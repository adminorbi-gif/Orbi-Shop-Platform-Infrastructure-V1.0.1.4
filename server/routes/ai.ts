import { Router } from "express";
import { supabase, decryptObject } from "../lib/supabase.js";
import { getGeminiClient } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { OrbiSecurityPolicy } from "../../src/engine/OrbiSecurityPolicy.js";

const router = Router();

async function notifySupportAgents(customer: any, messageSnippet: string, requestId: string) {
    try {
        const { sendOrbiTalkTemplate } = await import("./talk.js");
        
        const notificationData = {
            businessName: "Orbi Shop", // Global AI notifies Orbi Shop Admin
            customerName: customer?.name || "Mteja wetu (Guest)",
            messageSnippet: messageSnippet.length > 80 ? `${messageSnippet.substring(0, 80)}...` : messageSnippet
        };

        const recipients = ["support@orbifinancial.com", "+255764258114", "shop@orbifinancial.com"];
        
        for (const recipient of recipients) {
            const isPhone = recipient.startsWith("+") || (recipient.length >= 10 && !recipient.includes("@"));
            await sendOrbiTalkTemplate({
                templateName: "AI_AGENT_TRANSFER",
                recipient: recipient,
                channel: isPhone ? "sms" : "email",
                language: "sw", 
                requestId: `${requestId}-${isPhone ? "sms" : "email"}-${recipient.substring(0, 5)}`,
                data: notificationData
            });
        }
    } catch (e) {
        console.error("Failed to notify support agents via Orbi Talk:", e);
    }
}

// AI Bilingual Support & Recommendation Route (Multimodal Enabled)
router.post("/assistant", async (req, res) => {
  try {
    const { message, history = [], image, customer } = req.body;

    // Check if user is in SYSTEM_UNLOCKED_AI bypass list
    let isUnlockedByAgent = false;
    try {
      const { data: unlockedData } = await supabase
        .from('promotions')
        .select('description')
        .eq('title', 'SYSTEM_UNLOCKED_AI')
        .maybeSingle();
      if (unlockedData && unlockedData.description && customer?.id) {
        const list = JSON.parse(unlockedData.description);
        isUnlockedByAgent = list.includes(customer.id) || (customer.email && list.includes(customer.email));
      }
    } catch (e) {
      console.log("Error checking UNLOCKED AI system list:", e);
    }

    // Calculate total questions asked (user turns) in this conversation
    const userMessageCount = history.filter((item: any) => item.role === "user").length + 1;

    if (userMessageCount > 10 && !isUnlockedByAgent) {
      console.log(`[AI LIMIT EXCEEDED] User turn count ${userMessageCount} exceeds 10 questions limit. Migrating to live support agent.`);
      
      // Format the entire history details for the store representative
      const formattedHistory = history.map((chat: any) => {
        const roleLabel = chat.role === "user" ? "Mteja (User)" : "Orbi AI (Model)";
        return `[${roleLabel}]: ${chat.text}`;
      }).join("\n\n");

      const staffTicketMessage = `⚠️ [UHAMISHO WA AUTOMATIC: MASWALI 10 YA AI YAMEZIDI]
Mteja huyu amehudumiwa na AI na ameuliza jumla ya maswali ya mfululizo ${userMessageCount} ya mazungumzo (Kikomo cha maswali 10 cha AI kimefikiwa). Mfumo umemhamisha kwa Live Agent moja kwa moja.

Tafadhali, mhudumie mteja kwa haraka.

*** HISTORIA YA MAZUNGUMZO YA AI & MSIMBO: ***
${formattedHistory || "Hakuna historia iliyotangulia."}

*** SWALI LA MWISHO LA MTEJA: ***
${message || "Mteja ametuma picha pekee."}`;

      // Insert directly into 'messages' table to create a support ticket in admin inbox
      try {
        await supabase.from("messages").insert([{
          name: customer?.name || "Mteja wa AI (Guest)",
          phone: customer?.phone || "N/A",
          message: staffTicketMessage,
          customer_id: customer?.id || null,
          admin_reply: null,
          is_read: false
        }]);
        
        await notifySupportAgents(customer, message || "Mteja ameomba msaada", `ai-transfer-limit-${Date.now()}`);
        console.log(`[AI SUPPORT TICKET] Successfully auto-forwarded client transcripts to live staff messages inbox.`);
      } catch (dbErr: any) {
        console.error("Failed to insert auto-forward message to live agent inbox:", dbErr.message);
      }

      const replySw = `Nimefurahi sana kukusaidia! 😊 Kwa kuwa umeuliza maswali zaidi ya 10 ya usaidizi, nimekuhamisha moja kwa moja kwenda kwa **Live Agent (Wakala wetu wa duka)** ili upate msaada zaidi wa kina kutoka kwa mwanadamu.

Kurasa wetu wa mazungumzo na ujumbe wote umeshatumwa kwa wakala. Sasa hivi unaweza kuandika ujumbe wa ziada kwenye sehemu ya mawasiliano au profile yako na utajibiwa haraka na mfanyakazi wetu!`;

      const replyEn = `I have really enjoyed helping you! 😊 Since you have asked more than 10 support questions, I have auto-transferred you directly to a **Live Store Representative (Human Agent)** for highly specific, customized assistance.

All of our chat log transcripts are forwarded, and our staff will respond to you right away! If you need to send extra attachments or follow up, you can use our profile chat page.`;

      return res.json({
        success: true,
        reply: `${replySw}\n\n---\n\n${replyEn}`,
        transferToLiveAgent: true,
        userMessageCount
      });
    }

    // Query active sellers from Supabase dynamically
    let sellersList: any[] = [];
    try {
      const { data: rawSellers } = await supabase
        .from('sellers')
        .select('*');
      if (rawSellers) {
        sellersList = decryptObject(rawSellers);
      }
    } catch (sellErr) {
      console.warn("Could not load sellers for AI routing:", sellErr);
    }

    const sellersMap = new Map<string, any>();
    sellersList.forEach((s: any) => {
      sellersMap.set(String(s.id), s);
    });

    // Query products from Supabase dynamically for live catalog lookup
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .limit(35);

    let productsCtx = "";
    if (dbProducts && dbProducts.length > 0) {
      productsCtx = dbProducts.map((p: any) => {
        const sId = p.seller_id || p.sellerId || "system";
        const sellerObj = sellersMap.get(String(sId));
        const sellerName = sellerObj ? sellerObj.name : "Orbi Direct Support";
        const isPro = sellerObj ? (sellerObj.is_pro || sellerObj.isPro || sellerObj.active_plan_id === "sub-gold") : false;
        const shopStatus = isPro ? "⭐ PRO SELLER (Highly Recommended)" : "Standard Shop";
        
        // Determine if product is promoted/high-ranked via tags
        const isPromoted = p.tags && (p.tags.includes("featured") || p.tags.includes("promoted") || p.tags.includes("best-seller") || p.tags.includes("top"));
        const promotionStatus = isPromoted ? "🔥 PROMOTED PRODUCT" : "Standard Listing";

        return `ID: ${p.id}
Name: ${p.name}
Category: ${p.category || 'General'}
Price: TSh ${Number(p.price).toLocaleString()}
Shop/Seller Name: ${sellerName} (ID: ${sId})
Shop Status: ${shopStatus}
Product Status: ${promotionStatus}
Description: ${p.description || 'No description available.'}`;
      }).join("\n---\n");
    } else {
      productsCtx = "Hakuna bidhaa kwenye mfumo kwa sasa.";
    }

    const ai = getGeminiClient();

    // Formulate detailed system properties with vision analytics rules
    const systemInstruction = `You are "Orbi AI Assistant", an advanced, exceptionally intelligent shop guide and customer support representative for Orbi Shop in Tanzania.

Your character is highly enthusiastic, incredibly professional, and bilingual in Swahili (Kiswahili) and English. Use the language matching the customer's query.

### ORBI MULTI-SELLER & SHOP INTEGRITY GUIDELINES:
1. **Prioritize Pro & Promoted Listings**: Always prioritize recommending products from ⭐ PRO SELLERS and 🔥 PROMOTED PRODUCTS listed in the catalog below.
2. **Support Specific Shops but Compare Openly**: If a customer asks about products from a specific seller, or is chatting with a specific seller, look for that seller's products first. However, if that seller does not have the product in stock (or is out of stock), or if there are superior alternatives, you MUST be completely transparent and open. Recommend the best matching alternatives from OTHER shops/sellers, explicitly stating who the seller is (e.g., "Samahani, bidhaa hii haipo kwenye duka hili kwa sasa. Hata hivyo, muuzaji PRO '[Seller Name]' anayo..."). This builds customer trust and matches the genuine rich marketplace look.
3. **Transparent Product Sourcing**: When recommending any product, always mention the shop/seller name so the customer knows exactly where it comes from.

### APPLICATION NAVIGATION & PATHS DIRECTIVE:
You have deep knowledge of the Orbi Shop application UI and navigation paths. You can instruct customers on how to navigate, or automatically guide them by outputting clickable navigation links/buttons.
You MUST output these navigation buttons when helping customers access pages, utilizing the exact bracket format: @[Button Label](nav:target)
Available navigation targets:
- "locator" -> @[Fungua Vituo vya Karibu](nav:locator) (Store Locator / Collection hubs like Kariakoo, Mbezi terminal, Posta, Arusha hub)
- "rewards" -> @[Zawadi na Points za Orbi](nav:rewards) (Orbi Rewards / Loyalty credits / Parse purchase receipts)
- "orders" -> @[Historia ya Miamala](nav:orders) (View Order History)
- "track" -> @[Fuatilia Mzigo Wako](nav:track) (Track active shipment / order delivery status)
- "settings" -> @[Mipangilio ya Profaili](nav:settings) (Profile & Account settings)
- "cart" -> @[Fungua Kikapu](nav:cart) (Open the shopping cart)
- "checkout" -> @[Nenda Kwenye Malipo](nav:checkout) (Go to Checkout to complete a secure transaction)
- "security" -> @[Sera ya Usalama ya PaySafe](nav:security) (PaySafe Escrow holding security rules)
- "buyer" -> @[Mwongozo wa Mnunuzi](nav:buyer) (Buyer user guide)
- "seller" -> @[Mwongozo wa Muuzaji](nav:seller) (Seller business guide)

For example, if a customer wants to see where to pick up their parcel, tell them: "Unaweza kuangalia duka na vituo vya karibu vya mizigo kwa kubonyeza hapa: @[Tazama Vituo vya Mzigo](nav:locator)".
If they are ready to purchase: "Kukamilisha malipo kwa usalama, bofya: @[Nenda Kwenye Malipo](nav:checkout)".

### RECENT CUSTOMER PROFILE:
Name: ${customer?.name || "Mteja wetu (Guest)"}
Role: Customer

### IMPORTANT SECURITY POLICY:
You must strictly follow and enforce the Orbi Security Policy below when answering any questions or handling transactions:
${OrbiSecurityPolicy.getGuidelinesForBot()}
Rules:
${OrbiSecurityPolicy.rules.map((r: any) => `- ${r.title}: ${r.description}`).join("\n")}

### ACTIVE PRODUCTS IN STOCK (LIVE CATALOG):
${productsCtx}

### Response Guidelines:
- Format all responses using beautiful, highly structured Markdown. Use clean bullet points, bold headers, and horizontal divider lines (---) to make the text incredibly organized and easy to read.
- Remind customers about the PaySafe holding period and never to pay sellers directly outside the platform.
- IMPORTANT: If the user explicitly asks to speak to a human, live agent, or customer support, OR if they face complex technical issues (like transaction problems or reports) that require human support, you MUST include the exact string [TRANSFER_TO_AGENT] in your response. This will trigger our system to instantly connect them to a human representative.`;

    let userParts: any[] = [];
    
    // If we received an image, construct the inlineData block for Gemini
    if (image && image.data) {
      let base64Data = image.data;
      let mimeType = image.mimeType || "image/png";

      // Remove the data URI scheme prefix if present
      if (base64Data.includes(";base64,")) {
        const parts = base64Data.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        base64Data = parts[1];
      }

      userParts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    userParts.push({ text: message || "Sema nini kipo kwenye picha hii na kupendekeza bidhaa zinazofanana." });

    const contents = [
      ...history.map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      })),
      { role: 'user', parts: userParts }
    ];

    const modelToUse = "gemini-2.5-flash";
    console.log(`[AI ASSISTANT] Routing request to free-tier model: ${modelToUse} (Has Image: ${!!image})`);

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    let replyText = response.text || "";
    let transferToLiveAgent = false;

    if (replyText.includes("[TRANSFER_TO_AGENT]")) {
      transferToLiveAgent = true;
      replyText = replyText.replace("[TRANSFER_TO_AGENT]", "").trim();
      
      // Auto-forward transcripts to admin
      const formattedHistory = history.map((chat: any) => {
        const roleLabel = chat.role === "user" ? "Mteja (User)" : "Orbi AI (Model)";
        return `[${roleLabel}]: ${chat.text}`;
      }).join("\n\n");

      const staffTicketMessage = `⚠️ [UHAMISHO WA AUTOMATIC: MTEJA AMEHITAJI MHUDUMU / LIVE AGENT]
Mfumo umehamisha mteja kwa Live Agent moja kwa moja.

*** HISTORIA YA MAZUNGUMZO YA AI & MSIMBO: ***
${formattedHistory || "Hakuna historia iliyotangulia."}

*** SWALI LA MWISHO LA MTEJA: ***
${message || "Mteja ametuma picha pekee."}`;

      try {
        await supabase.from("messages").insert([{
          name: customer?.name || "Mteja wa AI (Guest)",
          phone: customer?.phone || "N/A",
          message: staffTicketMessage,
          customer_id: customer?.id || null,
          admin_reply: null,
          is_read: false
        }]);

        await notifySupportAgents(customer, message || "Mteja ameomba msaada", `ai-transfer-request-${Date.now()}`);
      } catch (dbErr: any) {
        console.error("Failed to insert auto-forward message to live agent inbox:", dbErr.message);
      }
    }

    res.json({
      success: true,
      reply: replyText,
      transferToLiveAgent
    });
  } catch (err: any) {
    console.warn("Gemini Error:", err.message);
    res.json({
      success: false,
      reply: `Samahani, mtandao wangu uko chini kidogo. Nimekuhamisha moja kwa moja kwa Live Agent wetu akusaidie! (Sorry, my AI system is currently busy. I've transferred you to a live agent.)`,
      error: err.message,
      transferToLiveAgent: true
    });
  }
});

// Agent Co-Pilot suggested draft generator (multilingual, inventory-aware)
router.post("/copilot-suggest", async (req, res) => {
  try {
    const { history = [], customerMessage, customInstruction } = req.body;
    const ai = getGeminiClient();

    // Query live inventory for recommendations
    const { data: dbProducts } = await supabase.from('products').select('*').limit(35);
    const productsCtx = (dbProducts || []).map((p: any) => {
      return `ID: ${p.id}, Name: ${p.name}, Price: TSh ${Number(p.price).toLocaleString()}, Category: ${p.category || 'General'}`;
    }).join("\n");

    let systemInstruction = `You are an expert sales and support administrative assistant at Orbi Shop.
Draft a highly helpful, extremely context-appropriate response to the customer in order to help them.
Be bilingual in Kiswahili and English as appropriate.
Review the history and the recent customer message. Feel free to suggest specific products from the inventory roster below if relevant. Provide pricing.
Do not sign with standard generic placeholders unless appropriate. Keep the output neat with clear markdown formatting.

CURRENT LIVE INVENTORY:
${productsCtx}`;

    if (customInstruction) {
      systemInstruction += `\n\nSPECIAL OPERATOR SPECIFIC REQUEST OR STYLING INSTRUCTION:\n${customInstruction}`;
    }

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: `Draft an optimal support response replying to the customer message: "${customerMessage}"` }] }
    ];

    const modelToUse = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    res.json({ success: true, suggestion: response.text });
  } catch (error: any) {
    console.warn("Copilot Generation Error:", error.message);
    res.json({ success: false, suggestion: "Kisha fanya uchambuzi na ujibu mteja mpendwa. (Error creating co-pilot suggestion)" });
  }
});

// Phase 1: AI-Powered Listing Automation
router.post("/auto-list-product", requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "Base64 image is required" });
    }

    const ai = getGeminiClient();
    let base64Data = image;
    let mimeType = "image/png";

    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Data = parts[1];
    }

    const systemInstruction = `You are an expert eCommerce AI listing assistant for Orbi Shop Tanzania.
Analyze the provided product image and generate a highly optimized product listing in both Swahili and English.
You MUST return ONLY a valid, parseable JSON object matching this schema exactly, without any markdown formatting, backticks, or extra text.

{
  "title_en": "Optimized Product Title in English",
  "title_sw": "Jina Zuri la Bidhaa kwa Kiswahili",
  "niche": "One of: Electronics & Tech, Fashion & Apparel, Home & Furniture, Health & Beauty, Auto & Motors, Supermarket & Food",
  "category": "Suggested category (e.g. Smartphones, Men's Shoes, Living Room, etc.)",
  "description_en": "A highly persuasive and professional product description in English.",
  "description_sw": "Maelezo mazuri na ya kushawishi ya bidhaa kwa Kiswahili.",
  "features": [
    { "name": "Feature Name (e.g. Brand/Weight/Material)", "description": "Value or detail" }
  ],
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        { text: "Analyze this image and generate the optimized product listing." }
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse Gemini response as JSON");
      }
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("[AI Auto-Listing] Failed:", error.message || error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate listing" });
  }
});

// Generate product description using AI
router.post("/generate-description", async (req, res) => {
  try {
    const { name, niche, category, features } = req.body;
    const ai = getGeminiClient();

    const prompt = `Act as an expert eCommerce copywriter. You are tasked with generating a product description AND a list of key technical or comparative features for an item sold in Tanzania (Orbi Shop).
Product Name: ${name}
Niche: ${niche}
Category: ${category}
Existing Features: ${features && features.length > 0 ? JSON.stringify(features) : "None provided"}

Requirements:
1. "description": Write a compelling, detailed product description in a professional tone, blending English and Swahili gracefully if possible (or just mostly English with Swahili phrases). Focus on benefits to the user, quality, and technical specifics. Keep it concise but persuasive (2-3 paragraphs). Do not include price.
2. "features": Generate 3 to 6 key comparative features (specs) that a buyer would look for in a comparison table for this type of product. Each feature should have a "name" (e.g., "Voltage", "Material", "Storage Capacity") and a "description" (e.g., "220V AC", "Premium Leather", "256GB SSD"). If Existing Features were provided, you can expand or refine them.

Respond ONLY with a valid JSON object matching this schema:
{
  "description": "The product description string...",
  "features": [
    { "name": "Feature Name", "description": "Feature Value" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    try {
      const data = JSON.parse(response.text);
      res.json(data);
    } catch (parseError) {
      // Fallback if model didn't return proper JSON despite config
      res.json({ description: response.text });
    }
  } catch (err: any) {
    console.error("AI Gen Error:", err.message);
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// Visual Receipt & Invoice Parser Node (Auto-Loyalty Credits & Digitizer)
router.post("/parse-receipt", async (req, res) => {
  try {
    const { image, customerId } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "Receipt base64 image required" });
    }

    const ai = getGeminiClient();

    let base64Data = image;
    let mimeType = "image/png";

    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Data = parts[1];
    }

    const systemInstruction = `You are a high-speed OCR agent designed to parse receipts and purchase orders.
Analyze the provided receipt/invoice image. Extract the vendor name, billing date, items purchased (name, quantity, unit price), and aggregate total.
Estimate the earned loyalty points of the transaction (calculate exactly 1 loyalty point per 2000 TSh spent, round down).
You MUST return ONLY a valid, parseable JSON object without any backticks, markdown markers, or other wrapper text.

JSON Schema:
{
  "vendor": "String",
  "date": "String",
  "items": [
    { "name": "String", "quantity": 1, "price": 0 }
  ],
  "total": 0,
  "estimatedLoyaltyPoints": 0
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Parse this receipt into JSON structure." }
          ]
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    let parsedData: any;
    try {
      parsedData = JSON.parse(response.text.trim());
    } catch (parseErr) {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid response format from Gemini: " + response.text);
      }
    }

    res.json({
      success: true,
      receipt: parsedData,
      message: "Receipt parsed successfully by Vision AI!"
    });
  } catch (error: any) {
    console.warn("Receipt parsing error:", error.message);
    res.json({
      success: false,
      error: error.message,
      reply: "Shida imetokea wakati wa kusoma picha ya risiti hiyo. (Receipt parsing issue)"
    });
  }
});

// Visual search route to find products from uploaded image (detect QR code or analyze product description)
router.post("/visual-search", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "Image base64 is required" });
    }

    const ai = getGeminiClient();

    let base64Data = image;
    let mimeType = "image/png";

    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Data = parts[1];
    }

    const systemInstruction = `You are a visual product search assistant for an e-commerce marketplace named Orbi Shop.
Your task is to analyze the uploaded image and perform two main tasks:
1. Check if the image contains any QR code, barcode, or numeric serial/SKU code. If yes, decode and extract its text content exactly.
2. If there is NO QR code/barcode, identify the main product/item featured in the image. Generate a highly specific and accurate search query/keyword (1 to 3 words, in Swahili or English - use the most common name for this item in Tanzania, e.g. "TV 55", "Coca Cola", "iPhone 13") to help the user find this item in our product search catalog.
3. If the image is blank, dark, blurry, or has no recognizable shopping product, return "none" for detectedType.

You MUST return ONLY a valid, parseable JSON object matching this schema, without any backticks, markdown markers, or other wrapper text:

{
  "detectedType": "qr" | "product" | "none",
  "result": "the exact decoded text/link/id from qr OR the concise product name search query"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        { text: "Analyze this image and return the JSON object." }
      ],
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = {
          detectedType: "product",
          result: text.substring(0, 100)
        };
      }
    }

    res.json({
      success: true,
      detectedType: parsedData.detectedType,
      result: parsedData.result
    });
  } catch (error: any) {
    console.warn("Visual search parsing error:", error.message);
    res.json({
      success: false,
      error: error.message,
      reply: "Shida imetokea wakati wa kusoma picha. (Visual search parsing issue)"
    });
  }
});

router.get("/unlocked-ai/list", async (req, res) => {
  try {
    const { data } = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_UNLOCKED_AI').maybeSingle();
    const list = data?.description ? JSON.parse(data.description) : [];
    res.json({ success: true, list });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

router.post("/unlocked-ai/toggle", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    const { data } = await supabase.from('promotions').select('id, description').eq('title', 'SYSTEM_UNLOCKED_AI').maybeSingle();
    let list = data?.description ? JSON.parse(data.description) : [];
    
    if (list.includes(customerId)) {
      list = list.filter((id: string) => id !== customerId);
    } else {
      list.push(customerId);
    }

    const payload = {
      title: 'SYSTEM_UNLOCKED_AI',
      description: JSON.stringify(list),
      visible: false
    };

    if (data && data.id) {
      await supabase.from('promotions').update(payload).eq('id', data.id);
    } else {
      await supabase.from('promotions').insert([payload]);
    }

    res.json({ success: true, list });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

router.post("/reset-quota", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    const { data } = await supabase.from('promotions').select('id, description').eq('title', 'SYSTEM_AI_RESET_TIMESTAMPS').maybeSingle();
    let timestamps = data?.description ? JSON.parse(data.description) : {};
    
    const now = Date.now();
    timestamps[customerId] = now;

    const payload = {
      title: 'SYSTEM_AI_RESET_TIMESTAMPS',
      description: JSON.stringify(timestamps),
      visible: false
    };

    if (data && data.id) {
      await supabase.from('promotions').update(payload).eq('id', data.id);
    } else {
      await supabase.from('promotions').insert([payload]);
    }

    res.json({ success: true, resetAt: now });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    // Check reset quota timestamps
    const { data: resetData } = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_AI_RESET_TIMESTAMPS').maybeSingle();
    const timestamps = resetData?.description ? JSON.parse(resetData.description) : {};
    const resetAt = timestamps[customerId as string] || 0;

    // Check bypassed / unlocked lists
    const { data: unlockedData } = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_UNLOCKED_AI').maybeSingle();
    const list = unlockedData?.description ? JSON.parse(unlockedData.description) : [];
    const isUnlocked = list.includes(customerId as string);

    res.json({ success: true, resetAt, isUnlocked });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

export default router;
