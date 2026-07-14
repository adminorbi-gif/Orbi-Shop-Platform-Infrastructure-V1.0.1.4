import React, { useState, useMemo, useEffect } from "react";
import { Search, Ticket, Mail, Phone, CheckCircle, Clock, Store, Trash2, X, Shield, Star, Briefcase, FileText, Check, AlertCircle, MessageSquare, Send, Smartphone, ExternalLink, Terminal } from "lucide-react";
import { Message, Product, SellerProfile } from "../../../../types";
import { useDialog } from "../../../../components/CustomDialogContext";
import { useI18n } from "../../index";
import { db, apiFetch } from "../../../../lib/db";
import { motion, AnimatePresence } from "motion/react";

export function TicketsAdmin({
  messages,
  setMessages,
  products = [],
  sellers = [],
  setSellers,
  currentStaff,
  currentSeller,
}: {
  messages: Message[];
  setMessages: any;
  products?: Product[];
  sellers?: SellerProfile[];
  setSellers?: any;
  currentStaff?: any;
  currentSeller?: any;
}) {
  const { showAlert } = useDialog();
  const { lang } = useI18n();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "apps" | "support">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // States for Merchant Support Dashboard
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "dashboard">("directory");
  const [dashboardReplyText, setDashboardReplyText] = useState<{ [msgId: string]: string }>({});

  // Professional Multichannel Reply States
  const [replyMode, setReplyMode] = useState<"inbuilt" | "sms" | "email">("inbuilt");
  const [smsSubMode, setSmsSubMode] = useState<"simulate" | "whatsapp">("simulate");
  const [emailSubMode, setEmailSubMode] = useState<"simulate" | "mailto">("simulate");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Dynamic Staff Assignment & CRM operational structures
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const list = await db.getStaff();
        setStaffList(list || []);
      } catch (e) {
        console.error("Failed to load staff in TicketsAdmin", e);
      }
    };
    loadStaff();
  }, []);

  const sendAutomatedFollowup = async (ticket: any, staffName: string) => {
    const emailToUse = ticket.email || (ticket.message ? extractEmail(ticket.message) : "");
    const phoneToUse = ticket.phone;

    const followUpEn = `Hello! This is an automated follow-up from Orbi Support regarding your ticket. Our team member, ${staffName}, has marked this issue as resolved. Do you still need any assistance with this request? Thank you for choosing Orbi Shop!`;
    const followUpSw = `Habari! Hili ni jibu la kufuatilia kiotomatiki kutoka kwa Msaada wa Orbi kuhusu ombi lako. Mwanachama wa timu yetu, ${staffName}, ameweka ombi hili kama limesuluhishwa. Je, bado unahitaji usaidizi wowote kuhusu changamoto hii? Asante kwa kuchagua Orbi Shop!`;

    const bodyText = lang === "sw" ? followUpSw : followUpEn;

    // Send direct email if available
    if (emailToUse) {
      try {
        await apiFetch("/api/talk/send-direct-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: emailToUse,
            channel: "email",
            subject: lang === "sw" ? "Msaada wa Orbi: Kufuatilia Tiketi Yako" : "Orbi Support: Ticket Follow-Up",
            body: bodyText
          })
        });
        console.log("[Automated Follow-up] Dispatched follow-up email to:", emailToUse);
      } catch (e) {
        console.warn("Automated email follow-up failed:", e);
      }
    }

    // Send direct SMS if available
    if (phoneToUse) {
      try {
        await apiFetch("/api/talk/send-direct-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: phoneToUse,
            channel: "sms",
            subject: "Orbi Support",
            body: bodyText
          })
        });
        console.log("[Automated Follow-up] Dispatched follow-up SMS to:", phoneToUse);
      } catch (e) {
        console.warn("Automated SMS follow-up failed:", e);
      }
    }
  };

  const updateTicketField = async (field: "status" | "priority" | "assignedStaffId", value: string) => {
    if (!selectedMsg) return;
    try {
      const resolvingStaffName = currentStaff?.name || currentSeller?.name || "System Admin";
      const resolvingStaffRole = currentStaff?.role || "seller";
      const updated = {
        ...selectedMsg,
        [field]: value,
        ...(field === "status" && value === "resolved" ? {
          resolvedByStaffId: currentStaff?.id || currentSeller?.id || "admin",
          resolvedByStaffName: resolvingStaffName,
          resolvedByStaffRole: resolvingStaffRole,
          resolvedAt: new Date().toISOString(),
        } : {})
      };
      await db.saveMessage(updated);
      setMessages((prev: Message[]) => prev.map((m) => (m.id === selectedMsg.id ? updated : m)));
      
      if (field === "status" && value === "resolved") {
        await sendAutomatedFollowup(selectedMsg, resolvingStaffName);
      }

      showAlert(
        lang === "sw"
          ? `Kikao cha tiketi kimesasishwa vyema`
          : `Ticket successfully updated: ${field} is now ${value}`,
        "success"
      );
    } catch (err: any) {
      showAlert(err.message || "Failed to update ticket", "error");
    }
  };

  // Parse seller applications
  const parseSellerApplication = (text: string) => {
    if (!text || !text.includes("Maombi ya Kuwa Muuzaji")) return null;

    const lines = text.split("\n");
    let fullName = "";
    let email = "";
    let storeName = "";
    let niche = "";
    let location = "";
    let tin = "";
    let businessType = "";
    let estimatedOrders = "";
    let description = "";
    let proposedPassword = "123456";

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes("jina kamili:")) fullName = line.split(/jina kamili:/i)[1]?.trim() || "";
      else if (lower.includes("barua pepe:")) email = line.split(/barua pepe:/i)[1]?.trim() || "";
      else if (lower.includes("duka:")) storeName = line.split(/duka:/i)[1]?.trim() || "";
      else if (lower.includes("niche ya biashara:")) niche = line.split(/niche ya biashara:/i)[1]?.trim() || "";
      else if (lower.includes("nchi/eneo:")) location = line.split(/nchi\/eneo:/i)[1]?.trim() || "";
      else if (lower.includes("namba ya tin:")) tin = line.split(/namba ya tin:/i)[1]?.trim() || "";
      else if (lower.includes("aina ya biashara:")) businessType = line.split(/aina ya biashara:/i)[1]?.trim() || "";
      else if (lower.includes("kiwango cha mauzo:")) estimatedOrders = line.split(/kiwango cha mauzo:/i)[1]?.trim() || "";
      else if (lower.includes("maelezo zaidi:")) {
        const details = line.split(/maelezo zaidi:/i)[1]?.trim() || "";
        if (details.includes("Password:")) {
          const passParts = details.split("Password:");
          description = passParts[0]?.trim() || "";
          proposedPassword = passParts[1]?.trim() || "123456";
        } else {
          description = details;
        }
      }
    });

    return {
      fullName: fullName || "N/A",
      email: email || "N/A",
      storeName: storeName || fullName || "N/A",
      niche: niche || "N/A",
      location: location || "N/A",
      tin: tin || "N/A",
      businessType: businessType || "N/A",
      estimatedOrders: estimatedOrders || "N/A",
      description: description || "Requested via chat application form.",
      proposedPassword,
    };
  };

  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => {
        // Exclude system dummy messages
        if (m.message === "Ujumbe kutoka Orbi Shop" || m.message === "Admin initiated dummy" || m.message === "Ujumbe toka kwa Admin" || m.message === "Ujumbe toka kwa Orbi Shop") {
          return false;
        }
        return true;
      })
      .filter((m) => {
        const isApp = m.message?.includes("Maombi ya Kuwa Muuzaji");
        if (filter === "unread") return !m.isRead;
        if (filter === "apps") return isApp;
        if (filter === "support") return !isApp;
        return true;
      })
      .filter((m) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.name?.toLowerCase().includes(q) ||
          m.phone?.includes(q) ||
          m.message?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date - a.date);
  }, [messages, filter, searchQuery]);

  const selectedMsg = useMemo(() => {
    return messages.find((m) => m.id === selectedId) || null;
  }, [messages, selectedId]);

  const groupedTickets = useMemo(() => {
    const groups: { [key: string]: typeof messages } = {};
    messages.forEach((msg) => {
      // Exclude seller applications & dummy messages
      const isApp = msg.message?.includes("Maombi ya Kuwa Muuzaji");
      const isDummy = msg.message === "Ujumbe kutoka Orbi Shop" || msg.message === "Admin initiated dummy" || msg.message === "Ujumbe toka kwa Admin" || msg.message === "Ujumbe toka kwa Orbi Shop";
      if (isApp || isDummy) return;

      const sId = (msg as any).sellerId || "general";
      if (!groups[sId]) {
        groups[sId] = [];
      }
      groups[sId].push(msg);
    });
    return groups;
  }, [messages]);

  const parsedApp = selectedMsg ? parseSellerApplication(selectedMsg.message) : null;

  const handleApproveSeller = async () => {
    if (!parsedApp || !setSellers) return;
    const lowerEmail = parsedApp.email.toLowerCase().trim();
    
    if (!lowerEmail || lowerEmail === "n/a" || !lowerEmail.includes("@")) {
      showAlert(lang === "sw" ? "Barua pepe haipo au si sahihi!" : "Invalid email address!", "error");
      return;
    }

    const exists = sellers.some((s) => s.email?.toLowerCase().trim() === lowerEmail);
    if (exists) {
      showAlert(lang === "sw" ? "Muuzaji mwenye barua pepe hii amesajiliwa tayari!" : "Seller with this email already exists!", "error");
      return;
    }

    const tempId = "SLR-" + Date.now().toString(36);
    const newSeller: SellerProfile = {
      id: tempId,
      name: parsedApp.storeName,
      email: lowerEmail,
      description: parsedApp.description || `Registered automatically from verification.`,
      status: "active",
      isPro: false,
      password: parsedApp.proposedPassword,
      isApproved: true,
      mustChangePassword: true,
      fullName: parsedApp.fullName,
      phone: selectedMsg?.phone || "",
      location: parsedApp.location !== "N/A" ? parsedApp.location : "",
      tin: parsedApp.tin !== "N/A" ? parsedApp.tin : "",
      niche: parsedApp.niche !== "N/A" ? parsedApp.niche : "",
      businessType: parsedApp.businessType !== "N/A" ? parsedApp.businessType : "Individual",
      estimatedOrders: parsedApp.estimatedOrders !== "N/A" ? parsedApp.estimatedOrders : "1-10",
    };

    const updated = [...sellers, newSeller];
    setSellers(updated);
    await db.saveSellers(updated);

    // Auto mark as replied
    handleReply(lang === "sw" ? "Maombi yako yamekubaliwa! Unaweza kuingia sasa." : "Your application has been approved! You can now log in.");

    showAlert(
      lang === "sw" ? `Muuzaji "${newSeller.name}" amethibitishwa!` : `Seller "${newSeller.name}" approved!`,
      "success"
    );
  };

  // Extract email utility
  const extractEmail = (text: string) => {
    const match = text?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : "";
  };

  const getCleanedPhone = (phone: string) => {
    let clean = phone?.replace(/[^0-9]/g, "") || "";
    if (clean.startsWith("0")) {
      clean = "255" + clean.slice(1);
    }
    return clean;
  };

  const supportMacros = useMemo(() => [
    {
      id: "general",
      titleEn: "General Greeting",
      titleSw: "Habari ya Jumla",
      textEn: "Hello, thank you for contacting us. Your issue has been received and is currently being processed by our support team. We will update you shortly.",
      textSw: "Habari, asante kwa kuwasiliana nasi. Changamoto yako imepokelewa na inafanyiwa kazi sasa hivi na idara husika. Tutakujulisha punde baada ya kukamilika."
    },
    {
      id: "order",
      titleEn: "Order Update",
      titleSw: "Taarifa ya Oda",
      textEn: "Hello, we have tracked your order and it is processing smoothly. Your items are ready for shipment and you will receive tracking information soon.",
      textSw: "Habari, tumefuatilia oda yako na inaendelea vizuri. Bidhaa zako zipo tayari kwa ajili ya kusafirishwa na utapokea taarifa ya ufuatiliaji punde."
    },
    {
      id: "approved",
      titleEn: "Seller Approved",
      titleSw: "Muuzaji Kukubaliwa",
      textEn: "Congratulations! Your application to become a seller on Orbi Marketplace has been approved. You can now log into your account using your email and start listing products.",
      textSw: "Hongera! Maombi yako ya kuwa muuzaji kwenye Orbi Marketplace yameidhinishwa. Unaweza kuingia kwenye akaunti yako sasa kwa kutumia barua pepe yako na kuanza kuweka bidhaa."
    },
    {
      id: "declined",
      titleEn: "Seller Declined",
      titleSw: "Muuzaji Kukataliwa",
      textEn: "Hello, we regret to inform you that your application does not meet our criteria at this moment. Please ensure your details (like TIN or business type) are correct and re-apply.",
      textSw: "Habari, tunasikitika kukujulisha kuwa maombi yako hayajakidhi vigezo vyetu kwa sasa. Tafadhali hakikisha taarifa zako (kama TIN au aina ya biashara) zipo sahihi na utume tena."
    },
    {
      id: "payment",
      titleEn: "Payment Verified",
      titleSw: "Malipo Yalothibitishwa",
      textEn: "Hello, your transaction has been verified. Your payment was successful and your order is now confirmed. Thank you for your cooperation.",
      textSw: "Habari, muamala wako umekaguliwa. Malipo yako yamefanikiwa na oda yako sasa imethibitishwa. Asante kwa ushirikiano wako."
    }
  ], []);

  useEffect(() => {
    if (selectedMsg) {
      const parsed = parseSellerApplication(selectedMsg.message);
      if (parsed && parsed.email && parsed.email !== "N/A") {
        setTargetEmail(parsed.email);
      } else {
        const extracted = extractEmail(selectedMsg.message);
        setTargetEmail(extracted || (selectedMsg as any).email || "");
      }
      setTargetPhone(selectedMsg.phone || "");
      setEmailSubject(
        lang === "sw" 
          ? `Msaada wa Orbi: Kujibu Ombi lako la Tiketi`
          : `Orbi Support: Reply to your Ticket Request`
      );
      // Reset simulation states
      setSimulatedLogs([]);
      setIsSimulating(false);
      setSimulationProgress(0);
      setReplyMode("inbuilt");
    }
  }, [selectedId, lang]);

  const handleSimulatedDispatch = async (type: "sms" | "email") => {
    if (!replyText.trim()) return;
    setIsSimulating(true);
    setSimulationProgress(5);
    setSimulatedLogs([
      type === "email" 
        ? `[SMTP] Initializing connection to Orbi Talk SMTP Gateway...`
        : `[SMS-GATEWAY] Initializing connection to Orbi Talk SMS Gateway...`
    ]);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      await delay(500);
      setSimulationProgress(25);
      const recipient = type === "email" ? targetEmail : targetPhone;
      
      if (!recipient) {
        throw new Error(
          lang === "sw"
            ? `Anwani au namba ya simu ya mpokeaji haijapatikana!`
            : `Recipient email or phone number is missing!`
        );
      }

      setSimulatedLogs(prev => [
        ...prev,
        `[ORBI-TALK-GATEWAY] Authenticating and preparing payload...`,
        `[ORBI-TALK-GATEWAY] Recipient: ${recipient}`,
        `[ORBI-TALK-GATEWAY] Sending request payload to /api/talk/send-direct-message...`
      ]);

      await delay(600);
      setSimulationProgress(55);

      // Call the REAL backend route for Orbi Talk!
      const res = await apiFetch("/api/talk/send-direct-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient,
          channel: type,
          subject: emailSubject || "Orbi Shop: Support Reply",
          body: replyText
        })
      });

      setSimulationProgress(85);
      
      if (!res || res.success === false) {
        throw new Error(res?.error || "Gateway returned an unexpected status");
      }

      setSimulatedLogs(prev => [
        ...prev,
        `[ORBI-TALK-GATEWAY] Server responded successfully. Processing metadata...`,
        res.simulated 
          ? `[ORBI-TALK-GATEWAY] Orbi Talk API Key is empty. Message registered in system under offline simulation mode.`
          : `[ORBI-TALK-GATEWAY] Success! Message dispatched via cellular/SMTP network carriers.`
      ]);

      await delay(600);
      setSimulationProgress(100);

      setSimulatedLogs(prev => [
        ...prev,
        res.simulated
          ? `[SUCCESS] Registered simulated ${type === "email" ? "Email" : "SMS"} inside Orbi Talk logs for ${recipient}!`
          : `[SUCCESS] Real ${type === "email" ? "Email" : "SMS"} delivered via Orbi Talk to ${recipient}! ID: ${res.data || 'Success'}`
      ]);

      await delay(600);

      // Now save reply to DB as resolved!
      const replyPrefix = type === "email" 
        ? `[Email Sent via Orbi Talk to ${targetEmail}]: ` 
        : `[SMS Sent via Orbi Talk to ${targetPhone}]: `;
        
      await handleReply(`${replyPrefix}${replyText}`);
      showAlert(
        lang === "sw" 
          ? `Jibu limetumwa kwa mafanikio kupitia Orbi Talk (${type === "email" ? "Barua Pepe" : "SMS"})!`
          : `Reply successfully dispatched via Orbi Talk (${type === "email" ? "Email" : "SMS"})!`,
        "success"
      );
    } catch (err: any) {
      setSimulatedLogs(prev => [...prev, `[ERROR] Dispatch failed: ${err.message || err}`]);
      showAlert(`Dispatch failed: ${err.message || err}`, "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReply = async (customText?: string) => {
    if (!selectedMsg) return;
    const textToSend = customText || replyText;
    if (!textToSend.trim()) return;

    setIsSending(true);
    try {
      const resolvingStaffName = currentStaff?.name || currentSeller?.name || "System Admin";
      const resolvingStaffRole = currentStaff?.role || "seller";
      const updated = {
        ...selectedMsg,
        adminReply: textToSend,
        isRead: true,
        status: "resolved",
        resolvedByStaffId: currentStaff?.id || currentSeller?.id || "admin",
        resolvedByStaffName: resolvingStaffName,
        resolvedByStaffRole: resolvingStaffRole,
        resolvedAt: new Date().toISOString(),
      };
      await db.saveMessage(updated);
      setMessages((prev: Message[]) => prev.map((m) => (m.id === selectedMsg.id ? updated : m)));
      
      await sendAutomatedFollowup(selectedMsg, resolvingStaffName);

      if (!customText) setReplyText("");
    } catch (err: any) {
      showAlert(err.message || "Failed to reply", "error");
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (msg: Message) => {
    if (msg.isRead) return;
    try {
      const updated = { ...msg, isRead: true };
      await db.saveMessage(updated);
      setMessages((prev: Message[]) => prev.map((m) => (m.id === msg.id ? updated : m)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === "sw" ? "Futa tiketi hii?" : "Delete this ticket?")) return;
    try {
      await db.deleteMessage(id);
      setMessages((prev: Message[]) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      showAlert(err.message || "Failed to delete", "error");
    }
  };

  const handleRouteToMerchant = async (msg: any) => {
    const seller = sellers.find(s => s.id === (msg.sellerId || msg.seller_id));
    const sellerName = seller ? seller.name : "Muuzaji";
    try {
      const updated = {
        ...msg,
        isRouted: true,
        adminReply: lang === "sw"
          ? `Ombi lako limeelekezwa kwa muuzaji (${sellerName}). Mtawasiliana kwa msaada zaidi.`
          : `Your request has been routed to the merchant (${sellerName}) for direct support.`
      };
      await db.saveMessage(updated);
      setMessages((prev: any) => prev.map((m: any) => m.id === msg.id ? updated : m));
      showAlert(
        lang === "sw" ? `Tiketi imetumwa kwa muuzaji ${sellerName}!` : `Ticket routed to merchant ${sellerName}!`,
        "success"
      );
    } catch (err: any) {
      showAlert(err.message || "Failed to route ticket", "error");
    }
  };

  const handleDashboardReply = async (msg: any, text: string) => {
    if (!text.trim()) return;
    try {
      const resolvingStaffName = currentStaff?.name || currentSeller?.name || "System Admin";
      const resolvingStaffRole = currentStaff?.role || "seller";
      const updated = {
        ...msg,
        adminReply: text,
        isRead: true,
        status: "resolved",
        resolvedByStaffId: currentStaff?.id || currentSeller?.id || "admin",
        resolvedByStaffName: resolvingStaffName,
        resolvedByStaffRole: resolvingStaffRole,
        resolvedAt: new Date().toISOString(),
      };
      await db.saveMessage(updated);
      setMessages((prev: any) => prev.map((m: any) => m.id === msg.id ? updated : m));
      setDashboardReplyText(prev => ({ ...prev, [msg.id]: "" }));
      
      await sendAutomatedFollowup(msg, resolvingStaffName);

      showAlert(
        lang === "sw" ? "Jibu limetumwa kwa mteja!" : "Reply successfully sent to customer!",
        "success"
      );
    } catch (err: any) {
      showAlert(err.message || "Failed to send reply", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            {lang === "sw" ? "Tiketi & Maombi" : "Tickets & Requests"}
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">
            {filteredMessages.length} {lang === "sw" ? "Tiketi" : "Tickets"} •{" "}
            {messages.filter(m => !m.isRead && m.message !== "Ujumbe kutoka Orbi Shop").length} {lang === "sw" ? "Hazijasomwa" : "Unread"}
          </p>
        </div>

        {/* Sub-tab toggler */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "directory"
                ? "bg-white text-slate-800 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase size={14} />
            {lang === "sw" ? "Orodha" : "Directory"}
          </button>
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeSubTab === "dashboard"
                ? "bg-white text-slate-800 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Store size={14} />
            {lang === "sw" ? "Msaada wa Wauzaji" : "Merchant Support"}
            {Object.keys(groupedTickets).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "directory" ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 relative">
          {/* Left Pane - List */}
          <div className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/40 h-full min-h-0 ${selectedId ? "hidden md:flex" : "flex"}`}>
            {/* Search */}
            <div className="p-4 border-b border-slate-200 bg-white shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder={lang === "sw" ? "Tafuta tiketi..." : "Search tickets..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-none shrink-0 bg-white">
              {[
                { id: "all", labelEn: "All", labelSw: "Zote" },
                { id: "unread", labelEn: "Unread", labelSw: "Hazijasomwa" },
                { id: "apps", labelEn: "Seller Apps", labelSw: "Maombi ya Muuzaji" },
                { id: "support", labelEn: "Support", labelSw: "Msaada" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    filter === f.id
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {lang === "sw" ? f.labelSw : f.labelEn}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center text-slate-400">
                  <MessageSquare size={32} className="mb-3 text-slate-300" />
                  <p className="text-sm font-semibold">{lang === "sw" ? "Hakuna tiketi zilizopatikana." : "No tickets found."}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMessages.map((msg) => {
                    const isApp = msg.message?.includes("Maombi ya Kuwa Muuzaji");
                    const isSelected = selectedId === msg.id;
                    return (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setSelectedId(msg.id);
                          markAsRead(msg);
                        }}
                        className={`w-full text-left p-4 transition-all relative ${
                          isSelected ? "bg-indigo-50/50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-600" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-sm truncate pr-2 ${!msg.isRead ? "text-slate-900" : "text-slate-700"}`}>
                            {msg.name || "Unknown"}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0 mt-0.5">
                            {new Date(msg.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {isApp ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                              <Star size={10} /> {lang === "sw" ? "Maombi" : "App"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              <MessageSquare size={10} /> {lang === "sw" ? "Msaada" : "Support"}
                            </span>
                          )}

                          {/* Priority Indicator */}
                          {msg.priority === "high" ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              🔥 {lang === "sw" ? "Juu" : "High"}
                            </span>
                          ) : msg.priority === "low" ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              💤 {lang === "sw" ? "Chini" : "Low"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              ⚡ {lang === "sw" ? "Kati" : "Medium"}
                            </span>
                          )}
                          
                          {/* Advanced Status Badge */}
                          {(msg.status === "resolved" || msg.adminReply) ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle size={10} /> {lang === "sw" ? "Imesuluhishwa" : "Resolved"}
                            </span>
                          ) : msg.status === "investigating" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 animate-pulse">
                              <Clock size={10} /> {lang === "sw" ? "Inasomwa" : "Investigating"}
                            </span>
                          ) : msg.isRead ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              <Clock size={10} /> {lang === "sw" ? "Inasubiri" : "Pending"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              <AlertCircle size={10} /> {lang === "sw" ? "Wazi" : "Open"}
                            </span>
                          )}

                          {/* Assigned Agent Indicator */}
                          {msg.assignedStaffId && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-100">
                              👤 {staffList.find(s => s.id === msg.assignedStaffId)?.name || "Agent"}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs line-clamp-2 ${!msg.isRead ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                          {msg.message}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane - Details */}
          <div className={`md:col-span-8 lg:col-span-8 flex flex-col bg-white h-full min-h-0 ${!selectedId ? "hidden md:flex" : "flex"}`}>
            {selectedMsg ? (
              <>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800">{selectedMsg.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Phone size={12} /> {selectedMsg.phone || "N/A"}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedMsg.date).toLocaleString()}</span>
                        {selectedMsg.adminReply ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle size={10} /> {lang === "sw" ? "Imesuluhishwa" : "Resolved"}
                          </span>
                        ) : selectedMsg.isRead ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            <Clock size={10} /> {lang === "sw" ? "Inasubiri" : "Pending"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            <AlertCircle size={10} /> {lang === "sw" ? "Wazi" : "Open"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(selectedMsg.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title={lang === "sw" ? "Futa Tiketi" : "Delete Ticket"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/30">
                  {/* Advanced Ticket Operational Controls */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Status Controller */}
                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5">
                        {lang === "sw" ? "Hali ya Tiketi" : "Ticket Status"}
                      </label>
                      <select
                        value={selectedMsg.status || (selectedMsg.adminReply ? "resolved" : "pending")}
                        onChange={(e) => updateTicketField("status", e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="pending">{lang === "sw" ? "Inasubiri (Pending)" : "Pending"}</option>
                        <option value="investigating">{lang === "sw" ? "Inachunguzwa (Reviewing)" : "Reviewing"}</option>
                        <option value="resolved">{lang === "sw" ? "Imesuluhishwa (Resolved)" : "Resolved"}</option>
                      </select>
                    </div>

                    {/* Priority Controller */}
                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5">
                        {lang === "sw" ? "Kipaumbele" : "Ticket Priority"}
                      </label>
                      <select
                        value={selectedMsg.priority || "medium"}
                        onChange={(e) => updateTicketField("priority", e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="low">{lang === "sw" ? "Chini (Low)" : "Low"}</option>
                        <option value="medium">{lang === "sw" ? "Kati (Medium)" : "Medium"}</option>
                        <option value="high">{lang === "sw" ? "Juu (High)" : "High"}</option>
                      </select>
                    </div>

                    {/* Assigned Support Staff Controller */}
                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5">
                        {lang === "sw" ? "Kabidhi kwa Staff" : "Assign to Staff"}
                      </label>
                      <select
                        value={selectedMsg.assignedStaffId || ""}
                        onChange={(e) => updateTicketField("assignedStaffId", e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="">{lang === "sw" ? "Haijakabidhiwa" : "Unassigned"}</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {parsedApp ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Store size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{lang === "sw" ? "Maombi ya Muuzaji Mpya" : "New Seller Application"}</h4>
                          <p className="text-xs text-slate-500 font-semibold">{parsedApp.storeName}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Jina Kamili</p>
                          <p className="text-sm font-semibold text-slate-700">{parsedApp.fullName}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Barua Pepe</p>
                          <p className="text-sm font-semibold text-slate-700">{parsedApp.email}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Niche</p>
                          <p className="text-sm font-semibold text-slate-700">{parsedApp.niche}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Aina ya Biashara</p>
                          <p className="text-sm font-semibold text-slate-700">{parsedApp.businessType}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">TIN</p>
                          <p className="text-sm font-semibold text-slate-700">{parsedApp.tin}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Eneo</p>
                          <p className="text-sm font-semibold text-slate-700">{parsedApp.location}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Maelezo Zaidi</p>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{parsedApp.description}</p>
                      </div>

                      {!selectedMsg.adminReply && (
                        <button
                          onClick={handleApproveSeller}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          {lang === "sw" ? "Kuidhinisha Muuzaji Huyu" : "Approve this Seller"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {selectedMsg.message}
                      </p>
                    </div>
                  )}

                  {/* Reply Section */}
                  <div className="mt-8">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Shield size={16} className="text-indigo-600 animate-pulse" /> 
                      {lang === "sw" ? "Jibu la Mhudumu / Msimamizi" : "Admin Resolution Console"}
                    </h4>
                    
                    {selectedMsg.adminReply ? (
                      <div className="space-y-3">
                        <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-slate-700 text-sm leading-relaxed relative">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-100/50">
                            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 flex items-center gap-1">
                              <CheckCircle size={12} />
                              {lang === "sw" ? "Imesuluhishwa" : "Resolved"}
                            </span>
                            {selectedMsg.resolvedByStaffName && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Shield size={10} className="text-slate-500" />
                                {lang === "sw" ? "Mhudumu:" : "Staff:"} {selectedMsg.resolvedByStaffName} ({selectedMsg.resolvedByStaffRole?.replace("_", " ")})
                              </span>
                            )}
                            {selectedMsg.adminReply.includes("[Email") ? (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Mail size={10} /> Email
                              </span>
                            ) : selectedMsg.adminReply.includes("[SMS") ? (
                              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Smartphone size={10} /> SMS
                              </span>
                            ) : selectedMsg.adminReply.includes("[WhatsApp") ? (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <MessageSquare size={10} /> WhatsApp
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Shield size={10} /> {lang === "sw" ? "Inbox ya Ndani" : "Inbuilt System"}
                              </span>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap">{selectedMsg.adminReply}</p>
                          {selectedMsg.resolvedAt && (
                            <div className="text-[9px] text-slate-400 mt-2 text-right font-semibold">
                              {lang === "sw" ? "Muda:" : "Resolved At:"} {new Date(selectedMsg.resolvedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs focus-within:border-indigo-500 transition-all">
                        {/* Channel Toggler */}
                        <div className="flex border-b border-slate-100 bg-slate-50/60 p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => { setReplyMode("inbuilt"); setSimulatedLogs([]); }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              replyMode === "inbuilt"
                                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                            }`}
                          >
                            <MessageSquare size={13} className="text-slate-600" />
                            {lang === "sw" ? "Inbox ya Ndani" : "Inbuilt System"}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => { setReplyMode("sms"); setSimulatedLogs([]); }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              replyMode === "sms"
                                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                            }`}
                          >
                            <Smartphone size={13} className="text-slate-600" />
                            {lang === "sw" ? "SMS / WhatsApp" : "Direct SMS / WA"}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => { setReplyMode("email"); setSimulatedLogs([]); }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              replyMode === "email"
                                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                            }`}
                          >
                            <Mail size={13} className="text-slate-600" />
                            {lang === "sw" ? "Barua Pepe" : "Direct Email"}
                          </button>
                        </div>

                        {/* Channel Specific Configuration Inputs */}
                        {replyMode === "sms" && (
                          <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                {lang === "sw" ? "Namba ya Simu ya Mteja" : "Recipient Mobile Number"}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={targetPhone}
                                  onChange={(e) => setTargetPhone(e.target.value)}
                                  placeholder="+255..."
                                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-xs font-semibold focus:border-indigo-500"
                                />
                                <Phone size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                {lang === "sw" ? "Njia ya Utumaji" : "Dispatch Action"}
                              </label>
                              <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/30">
                                <button
                                  type="button"
                                  onClick={() => setSmsSubMode("simulate")}
                                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    smsSubMode === "simulate" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                                  }`}
                                >
                                  📡 {lang === "sw" ? "Simulate SMS" : "SMS Gateway"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSmsSubMode("whatsapp")}
                                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    smsSubMode === "whatsapp" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                                  }`}
                                >
                                  💬 WhatsApp Web
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {replyMode === "email" && (
                          <div className="p-4 bg-slate-50/50 border-b border-slate-100 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  {lang === "sw" ? "Barua Pepe ya Mteja" : "Recipient Email"}
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    value={targetEmail}
                                    onChange={(e) => setTargetEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-xs font-semibold focus:border-indigo-500"
                                  />
                                  <Mail size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  {lang === "sw" ? "Kichwa cha Barua Pepe" : "Email Subject Line"}
                                </label>
                                <input
                                  type="text"
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  placeholder="Subject..."
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-xs font-semibold focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-200/30 p-1.5 rounded-lg">
                              <span className="text-[10px] font-bold text-slate-500 pl-1.5">
                                {lang === "sw" ? "Mbinu ya Utumaji wa Barua Pepe:" : "Email Dispatch Protocol:"}
                              </span>
                              <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/30 w-1/2">
                                <button
                                  type="button"
                                  onClick={() => setEmailSubMode("simulate")}
                                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    emailSubMode === "simulate" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                                  }`}
                                >
                                  🔐 SMTP Server
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEmailSubMode("mailto")}
                                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    emailSubMode === "mailto" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                                  }`}
                                >
                                  ✉️ Local Client
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Macros Selection */}
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <span>⚡</span>
                            {lang === "sw" ? "Miolezo / Majibu Haraka:" : "Quick Macros:"}
                          </span>
                          <div className="flex gap-2">
                            {supportMacros.map((macro) => (
                              <button
                                key={macro.id}
                                type="button"
                                onClick={() => {
                                  setReplyText(lang === "sw" ? macro.textSw : macro.textEn);
                                  showAlert(
                                    lang === "sw" ? `Kiolezo cha "${macro.titleSw}" kimepachikwa!` : `"${macro.titleEn}" template applied!`,
                                    "success"
                                  );
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-700 transition-all whitespace-nowrap shadow-3xs"
                              >
                                {lang === "sw" ? macro.titleSw : macro.titleEn}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Text Area Content */}
                        <div className="relative">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={
                              replyMode === "inbuilt"
                                ? (lang === "sw" ? "Andika jibu hapa litakalohifadhiwa kwenye akaunti ya mteja..." : "Write a message to save directly to user inbox...")
                                : replyMode === "sms"
                                ? (lang === "sw" ? "Andika ujumbe wa SMS utakaoenda kwenye simu ya mteja..." : "Write SMS notification text...")
                                : (lang === "sw" ? "Andika barua pepe kamili itakayotumwa..." : "Write official support email message body...")
                            }
                            className="w-full p-4 min-h-[140px] outline-none text-sm resize-y text-slate-700"
                            disabled={isSimulating}
                          />
                        </div>

                        {/* Simulated Transmission Progress Display */}
                        {isSimulating && (
                          <div className="bg-slate-900 text-slate-200 p-4 border-t border-slate-800 font-mono text-xs space-y-2 select-none">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              <span className="flex items-center gap-1"><Terminal size={12} /> {lang === "sw" ? "Njia ya Utumaji:" : "Transmission Terminal Logs"}</span>
                              <span>{simulationProgress}%</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full transition-all duration-300"
                                style={{ width: `${simulationProgress}%` }}
                              />
                            </div>

                            {/* Logs list */}
                            <div className="space-y-1 pt-1 text-slate-300 max-h-[100px] overflow-y-auto">
                              {simulatedLogs.map((log, index) => (
                                <p key={index} className={log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : log.includes("[ERROR]") ? "text-rose-400" : ""}>
                                  {log}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer Actions */}
                        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                          <p className="text-[10px] font-semibold text-slate-500 text-center sm:text-left">
                            {replyMode === "sms" && smsSubMode === "whatsapp" && (
                              <span className="text-emerald-600 flex items-center gap-1 justify-center sm:justify-start">ℹ️ {lang === "sw" ? "Bofya kutengeneza kiungo cha WhatsApp" : "Click to launch official WhatsApp Web client"}</span>
                            )}
                            {replyMode === "email" && emailSubMode === "mailto" && (
                              <span className="text-amber-600 flex items-center gap-1 justify-center sm:justify-start">ℹ️ {lang === "sw" ? "Inafungua App ya barua pepe" : "Launches local system default email client"}</span>
                            )}
                            {replyMode === "inbuilt" && (
                              <span className="text-slate-500 flex items-center gap-1 justify-center sm:justify-start">⚡ {lang === "sw" ? "Inasuluhisha na kuhifadhi kwenye mfumo" : "Resolves instantly inside customer inbox portal"}</span>
                            )}
                          </p>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {replyText.trim() && (
                              <button
                                type="button"
                                onClick={() => setReplyText("")}
                                className="px-3 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors"
                              >
                                {lang === "sw" ? "Futa" : "Clear"}
                              </button>
                            )}

                            {replyMode === "inbuilt" && (
                              <button
                                onClick={() => handleReply()}
                                disabled={!replyText.trim() || isSending}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center text-xs"
                              >
                                {isSending ? (
                                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Send size={15} />
                                )}
                                {lang === "sw" ? "Tuma Inbox" : "Send Inbuilt Inbox"}
                              </button>
                            )}

                            {replyMode === "sms" && (
                              smsSubMode === "simulate" ? (
                                <button
                                  onClick={() => handleSimulatedDispatch("sms")}
                                  disabled={!replyText.trim() || isSimulating || !targetPhone}
                                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center text-xs"
                                >
                                  {isSimulating ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <Send size={15} />
                                  )}
                                  {lang === "sw" ? "Tuma Ujumbe (SMS)" : "Dispatch SMS"}
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    if (!replyText.trim() || !targetPhone) return;
                                    const cleaned = getCleanedPhone(targetPhone);
                                    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(replyText)}`;
                                    window.open(url, "_blank");
                                    // Mark resolved in system db
                                    await handleReply(`[WhatsApp Sent to ${targetPhone}]: ${replyText}`);
                                    showAlert(
                                      lang === "sw" 
                                        ? "Kiungo cha WhatsApp kimefunguliwa na tiketi imewekwa alama ya kutatuliwa!" 
                                        : "WhatsApp link opened and ticket marked resolved!", 
                                      "success"
                                    );
                                  }}
                                  disabled={!replyText.trim() || !targetPhone}
                                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center text-xs"
                                >
                                  <ExternalLink size={15} />
                                  {lang === "sw" ? "Fungua WhatsApp" : "Open WhatsApp WA.me"}
                                </button>
                              )
                            )}

                            {replyMode === "email" && (
                              emailSubMode === "simulate" ? (
                                <button
                                  onClick={() => handleSimulatedDispatch("email")}
                                  disabled={!replyText.trim() || isSimulating || !targetEmail}
                                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center text-xs"
                                >
                                  {isSimulating ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <Send size={15} />
                                  )}
                                  {lang === "sw" ? "Tuma Email" : "Send Email SMTP"}
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    if (!replyText.trim() || !targetEmail) return;
                                    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(replyText)}`;
                                    window.location.href = mailtoUrl;
                                    // Mark resolved in system db
                                    await handleReply(`[Email Mailto Sent to ${targetEmail}]: ${replyText}`);
                                    showAlert(
                                      lang === "sw" 
                                        ? "Email Mailto imefunguliwa na tiketi imewekwa alama ya kutatuliwa!" 
                                        : "Mail client opened and ticket marked resolved!", 
                                      "success"
                                    );
                                  }}
                                  disabled={!replyText.trim() || !targetEmail}
                                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center text-xs"
                                >
                                  <ExternalLink size={15} />
                                  {lang === "sw" ? "Fungua kwenye Mail" : "Open in Mail Client"}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4 border border-slate-100 shadow-sm">
                  <Ticket size={28} />
                </div>
                <h3 className="font-bold text-slate-700 text-lg mb-1">{lang === "sw" ? "Chagua Tiketi" : "Select a Ticket"}</h3>
                <p className="text-sm font-medium">{lang === "sw" ? "Bofya tiketi upande wa kushoto ili kuona maelezo." : "Click a ticket on the left to view details."}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Merchant Support Dashboard */
        <div className="space-y-6 flex-1 overflow-y-auto min-h-0 pb-10">
          {/* Dashboard Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <MessageSquare size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "sw" ? "Jumla ya Tiketi" : "Total Grouped"}
                </p>
                <h4 className="text-2xl font-black text-slate-800">
                  {Object.values(groupedTickets).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0)}
                </h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Store size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "sw" ? "Wauzaji Wenye Tiketi" : "Active Merchants"}
                </p>
                <h4 className="text-2xl font-black text-slate-800">
                  {Object.keys(groupedTickets).filter(k => k !== "general").length}
                </h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "sw" ? "Inasubiri Kurutishwa" : "Awaiting Routing"}
                </p>
                <h4 className="text-2xl font-black text-slate-800">
                  {Object.values(groupedTickets).flat().filter((m: any) => !m.isRouted && !m.adminReply).length}
                </h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "sw" ? "Tiketi Zilizojibiwa" : "Resolved Tickets"}
                </p>
                <h4 className="text-2xl font-black text-slate-800">
                  {Object.values(groupedTickets).flat().filter((m: any) => m.adminReply).length}
                </h4>
              </div>
            </div>
          </div>

          {/* Grouped Merchant Panels */}
          <div className="space-y-6">
            {Object.keys(groupedTickets).map((sId) => {
              const groupTickets = groupedTickets[sId] || [];
              const isGeneral = sId === "general";
              const seller = sellers.find((s) => s.id === sId);
              const sellerName = isGeneral 
                ? (lang === "sw" ? "Msaada Mkuu / Orbi Official Support" : "Orbi Shop Official Support")
                : (seller?.name || `Merchant (${sId})`);
              const sellerNiche = seller?.niche || "";
              const sellerPhone = seller?.phone || "";

              return (
                <div key={sId} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Merchant Header Panel */}
                  <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-4 ${isGeneral ? "bg-slate-50/50" : "bg-white"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isGeneral ? "bg-slate-900 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                        {isGeneral ? <Shield size={22} /> : <Store size={22} />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                          {sellerName}
                          {isGeneral && (
                            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Official
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {sellerNiche ? `${sellerNiche} • ` : ""}{sellerPhone ? `${sellerPhone} • ` : ""}{groupTickets.length} {lang === "sw" ? "Maombi" : "Requests"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Merchant Support Requests List */}
                  <div className="divide-y divide-slate-100">
                    {groupTickets.map((ticket: any) => {
                      const hasReplied = !!ticket.adminReply;
                      const isRouted = !!ticket.isRouted;
                      const replyVal = dashboardReplyText[ticket.id] || "";

                      return (
                        <div key={ticket.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                {ticket.name || "Customer"}
                                <span className="text-xs font-medium text-slate-400">({ticket.phone})</span>
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {new Date(ticket.date).toLocaleString()}
                              </p>
                            </div>

                            {/* Status Badges */}
                            <div className="flex items-center gap-2">
                              {hasReplied ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle size={12} />
                                  {lang === "sw" ? "Imesuluhishwa" : "Resolved"}
                                </span>
                              ) : isRouted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                  <Store size={12} />
                                  {lang === "sw" ? "Imesogezwa kwa Muuzaji" : "Routed to Merchant"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                  <AlertCircle size={12} />
                                  {lang === "sw" ? "Inasubiri" : "Pending"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Customer Message */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {ticket.message}
                          </div>

                          {/* Replied Message if exists */}
                          {hasReplied && (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-emerald-800 text-xs leading-relaxed">
                              <p className="font-extrabold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1 text-emerald-600">
                                <Shield size={10} /> {lang === "sw" ? "Jibu la Msaada" : "Support Reply"}
                              </p>
                              {ticket.adminReply}
                            </div>
                          )}

                          {/* Routing & Reply Actions */}
                          {!hasReplied && (
                            <div className="space-y-3 pt-2">
                              <div className="flex flex-wrap gap-2">
                                {/* Route Query to Merchant Button (Only if not general support, and not already routed) */}
                                {!isGeneral && !isRouted && (
                                  <button
                                    onClick={() => handleRouteToMerchant(ticket)}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                  >
                                    <Store size={14} />
                                    {lang === "sw" ? "Sogeza kwa Muuzaji" : "Route Query to Merchant"}
                                  </button>
                                )}
                              </div>

                              {/* Direct Response Box */}
                              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-transparent focus-within:border-indigo-400 focus-within:bg-white transition-all shadow-inner">
                                <input
                                  type="text"
                                  value={replyVal}
                                  onChange={(e) => setDashboardReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                  placeholder={
                                    isGeneral 
                                      ? (lang === "sw" ? "Andika jibu kama Msaada Mkuu..." : "Reply directly to customer...")
                                      : (lang === "sw" ? "Andika jibu moja kwa moja kama Orbi Support..." : "Reply as Orbi Official Support...")
                                  }
                                  className="flex-1 bg-transparent border-none outline-none text-sm p-2 placeholder-slate-400 font-medium"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && replyVal.trim()) {
                                      handleDashboardReply(ticket, replyVal);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleDashboardReply(ticket, replyVal)}
                                  disabled={!replyVal.trim()}
                                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-40"
                                >
                                  <MessageSquare size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
