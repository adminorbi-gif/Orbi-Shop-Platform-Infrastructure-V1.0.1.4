import { Router } from "express";
import { getAdminSupabase, getSupabase } from "../lib/supabase.js";
import { clearCachedValue, sendResilientJson, withTimeout } from "../lib/apiResilience.js";

const router = Router();
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getMessagesDb = (req: any) => {
  try {
    return getAdminSupabase();
  } catch {
    return getSupabase(req);
  }
};

const safeErrorMessage = (error: any) => {
  const message = error?.message || String(error || "Unknown message service error");
  return message.length > 240 ? `${message.slice(0, 240)}...` : message;
};

// GET /api/v1/messages - Retrieve message board items
router.get("/", async (req, res) => {
  return sendResilientJson(res, "messages:list", async () => {
    const { data, error } = await withTimeout(
      getMessagesDb(req).from('messages').select('*').order('created_at', { ascending: false }).limit(1000),
      12000,
      "messages query",
    );
    if (error) throw error;

    // Optimized parallelized lookup for customer-seller association based on recent order history
    const orderCustomerMap = new Map(); // customer_id or phone -> seller_id (TEXT)
    try {
      const { data: dbOrders } = await getMessagesDb(req)
        .from('orders')
        .select('id, customer_id, customer_phone')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbOrders && dbOrders.length > 0) {
        const orderIds = dbOrders.map(o => o.id);
        const { data: dbOrderItems } = await getMessagesDb(req)
          .from('order_items')
          .select('order_id, product_id')
          .in('order_id', orderIds);

        if (dbOrderItems && dbOrderItems.length > 0) {
          const prodIds = dbOrderItems.map(oi => oi.product_id).filter(Boolean);
          if (prodIds.length > 0) {
            const { data: dbProds } = await getMessagesDb(req)
              .from('products')
              .select('id, seller_id')
              .in('id', prodIds);

            if (dbProds && dbProds.length > 0) {
              const prodSellerMap = new Map(dbProds.map(p => [p.id, p.seller_id]));
              const orderSellerMap = new Map();
              for (const oi of dbOrderItems) {
                const sId = prodSellerMap.get(oi.product_id);
                if (sId) {
                  orderSellerMap.set(oi.order_id, sId);
                }
              }
              for (const ord of dbOrders) {
                const sId = orderSellerMap.get(ord.id);
                if (sId) {
                  if (ord.customer_id) orderCustomerMap.set(ord.customer_id, sId);
                  if (ord.customer_phone) orderCustomerMap.set(ord.customer_phone, sId);
                }
              }
            }
          }
        }
      }
    } catch (lookupErr) {
      console.warn("Could not perform automated customer-seller lookup:", lookupErr);
    }

    const mapped = (data || []).map(m => {
      let rawMessage = m.message || "";
      let sellerId = null;
      let isRouted = false;

      // 1. Try to extract explicit [SellerId: ...] tag
      const match = rawMessage.match(/\[SellerId:\s*([^\]]+)\]/i);
      if (match) {
        sellerId = match[1].trim();
        rawMessage = rawMessage.replace(/\[SellerId:\s*[^\]]+\]/i, "").trim();
      }

      // Check if routed
      if (rawMessage.includes("[Routed: true]")) {
        isRouted = true;
        rawMessage = rawMessage.replace("[Routed: true]", "").trim();
      }

      // 2. Fallback: Lookup by order history if no explicit sellerId
      if (!sellerId) {
        const lookupKey = m.customer_id || m.phone;
        const associatedSellerId = lookupKey ? orderCustomerMap.get(lookupKey) : null;
        if (associatedSellerId) {
          sellerId = associatedSellerId;
        }
      }

      return {
        id: m.id,
        name: m.name,
        phone: m.phone,
        message: rawMessage,
        date: new Date(m.created_at).getTime(),
        customerId: m.customer_id || (m.phone === "SYSTEM" ? "00000000-0000-0000-0000-000000000000" : null),
        adminReply: m.admin_reply,
        isRead: m.is_read,
        sellerId: sellerId,
        isRouted: isRouted
      };
    });

    return mapped;
  }, { ttlMs: 45000, timeoutMs: 15000, label: "messages list", retries: 1, fallback: [] });
});

// POST /api/v1/messages/mark-read - Mark multiple messages as read
router.post("/mark-read", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: true });
    }
    
    const db = getMessagesDb(req);
    const normalizedIds = ids.map((id: unknown) => String(id || "").trim()).filter(Boolean);
    const validUUIDs = normalizedIds.filter((id: string) => uuidRegex.test(id));
    const validLegacy = normalizedIds.filter((id: string) => !uuidRegex.test(id));
    
    if (validUUIDs.length > 0) {
      const { error } = await db
        .from('messages')
        .update({ is_read: true })
        .in('id', validUUIDs);
      if (error) console.error("Error updating UUID messages:", error);
    }
    
    if (validLegacy.length > 0) {
      const { error: legacyError } = await db
        .from('messages')
        .update({ is_read: true })
        .in('legacy_id', validLegacy);
      if (legacyError) console.error("Error updating legacy messages:", legacyError);
    }

    clearCachedValue("messages:");
    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/messages/mark-read error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Message read status could not be updated right now." });
  }
});

// POST /api/v1/messages - Submit or reply to a customer session message
router.post("/", async (req, res) => {
  try {
    const msg = req.body;
    const db = getMessagesDb(req);
    let targetCustomerId = (msg.customerId && uuidRegex.test(msg.customerId)) ? msg.customerId : null;
    if (targetCustomerId === "00000000-0000-0000-0000-000000000000") {
      targetCustomerId = null;
    }

    const isReadVal = msg.isRead !== undefined ? msg.isRead : (msg.is_read !== undefined ? msg.is_read : false);
    
    let storedMessage = msg.message || "";
    if (msg.sellerId && !storedMessage.includes("[SellerId:")) {
      storedMessage = `${storedMessage}\n[SellerId: ${msg.sellerId}]`;
    }
    if (msg.isRouted && !storedMessage.includes("[Routed: true]")) {
      storedMessage = `${storedMessage}\n[Routed: true]`;
    }

    const payload = {
      name: msg.name,
      phone: msg.phone,
      message: storedMessage,
      customer_id: targetCustomerId,
      admin_reply: msg.adminReply || null,
      is_read: isReadVal,
      legacy_id: msg.id
    };

    let result;
    let existingMsg = null;

    if (msg.id) {
      if (uuidRegex.test(msg.id)) {
        const { data } = await db.from('messages').select('id').eq('id', msg.id).maybeSingle();
        if (data) existingMsg = data;
      } else {
        const { data } = await db.from('messages').select('id').eq('legacy_id', msg.id).maybeSingle();
        if (data) existingMsg = data;
      }
    }

    if (existingMsg) {
      result = await db.from('messages').update(payload).eq('id', existingMsg.id);
    } else {
      result = await db.from('messages').insert([payload]);
    }

    if (result.error) throw result.error;
    clearCachedValue("messages:");

    // Dispatch automatic confirmation for merchant applications
    const textMsg = msg.message || "";
    if (textMsg.includes("Maombi ya Kuwa Muuzaji")) {
      let matchedEmail = "";
      const lines = textMsg.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().includes("barua pepe:")) {
          matchedEmail = line.split(/barua pepe:/i)[1]?.trim() || "";
        }
      }
      
      const applicantName = msg.name || "Mpendwa Muuzaji";
      const applicantPhone = msg.phone;
      
      try {
        const { sendOrbiTalkDirectSMS, sendOrbiTalkDirectEmail } = await import("./talk.js");
        const requestId = `seller_ack_${Date.now()}`;
        
        const emailSubject = "Ombi Lako la Muuzaji Limepokelewa / Seller Application Received - Orbi Shop";
        
        const swMessage = `Habari ${applicantName},\n\nAsante kwa kutuma ombi lako la kuwa muuzaji kwenye mfumo wa Orbi Shop! Taarifa zako zote zimepokelewa kikamilifu kulingana na sera dhabiti za biashara yetu.\n\nIdara yetu ya usajili inashughulikia ombi lako na itakutafuta ndani ya saa 24 kwa ajili ya usajili kamili na kukupatia maelekezo ya akaunti yako.\n\nUshirikiano wako unathaminiwa sana!\n\nAsante,\nOrbi Shop Merchant Board`;
        
        const enMessage = `Dear ${applicantName},\n\nThank you for submitting your merchant registration on Orbi Shop! Your records have been received in accordance with our stringent platform standards and policies.\n\nOur onboarding team is actively reviewing your application. We will contact you within 24 hours to complete your verification and hand over your portal credentials.\n\nThank you for choosing to do business with Orbi Shop!\n\nBest regards,\nOrbi Shop Merchant Board`;
        
        const combinedBody = `${swMessage}\n\n====================\n\n${enMessage}`;

        if (applicantPhone) {
          const cleanPhone = applicantPhone.trim().replace(/\s+/g, "");
          console.log(`[SELLER REGISTRATION ACK] Dispatching auto-response SMS to ${cleanPhone}`);
          await sendOrbiTalkDirectSMS({
            recipient: cleanPhone,
            body: combinedBody,
            requestId
          }).catch(smsErr => console.error("Error dispatching seller application SMS ack:", smsErr));
        }
        
        if (matchedEmail && matchedEmail.includes("@")) {
          console.log(`[SELLER REGISTRATION ACK] Dispatching auto-response Email to ${matchedEmail}`);
          await sendOrbiTalkDirectEmail({
            recipient: matchedEmail.trim(),
            subject: emailSubject,
            body: combinedBody,
            requestId,
            ownerEmail: "sellers@orbifinancial.com",
            senderName: "Orbi Shop"
          }).catch(emailErr => console.error("Error dispatching seller application Email ack:", emailErr));
        }
      } catch (evtErr) {
        console.error("Error during automated seller receipt notification dispatch:", evtErr);
      }
    } else if (!existingMsg && !msg.adminReply && msg.phone !== "SYSTEM" && msg.name !== "SYSTEM ALERT") {
      // Notify Admin/Seller via Orbi Talk for new general customer support tickets
      try {
        const { sendOrbiTalkTemplate } = await import("./talk.js");
        const requestId = `ticket_alert_${Date.now()}`;
        
        const notificationData = {
          businessName: "Orbi Shop",
          customerName: msg.name || "Unknown",
          messageSnippet: textMsg.length > 80 ? `${textMsg.substring(0, 80)}...` : textMsg
        };

        const recipients = ["support@orbifinancial.com", "+255764258114", "shop@orbifinancial.com"];
        
        for (const recipient of recipients) {
          const isPhone = recipient.startsWith("+") || (recipient.length >= 10 && !recipient.includes("@"));
          await sendOrbiTalkTemplate({
            templateName: "NEW_SUPPORT_TICKET",
            recipient: recipient,
            channel: isPhone ? "sms" : "email",
            language: "sw",
            requestId: `${requestId}-${isPhone ? "sms" : "email"}-${recipient.substring(0, 5)}`,
            data: notificationData
          }).catch(err => console.error(`Error notifying support via ${isPhone ? "SMS" : "Email"}:`, err));
        }
      } catch (evtErr) {
        console.error("Error during automated ticket notification dispatch:", evtErr);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/messages error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Message could not be saved right now." });
  }
});

// DELETE /api/v1/messages/:id - Erase chat log ticket from database
router.delete("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(String(req.params.id || "")).trim();
    if (!id) {
      return res.status(400).json({ success: false, error: "Missing message id." });
    }

    const db = getMessagesDb(req);
    let deletedCount = 0;

    const deleteByColumn = async (column: "id" | "legacy_id") => {
      const { count, error } = await db
        .from('messages')
        .delete({ count: 'exact' })
        .eq(column, id);
      if (error) throw error;
      deletedCount += count || 0;
    };

    if (uuidRegex.test(id)) {
      await deleteByColumn("id");
      if (deletedCount === 0) {
        await deleteByColumn("legacy_id");
      }
    } else {
      await deleteByColumn("legacy_id");
    }

    clearCachedValue("messages:");
    res.json({ success: true, deletedCount });
  } catch (error: any) {
    console.error("DELETE /api/v1/messages/:id error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Message delete service is temporarily unavailable." });
  }
});

export default router;
