# WhatsApp Bot Integration Plan (Phase 3 Development TODO)

This document outlines the design and implementation roadmap for integrating a headless WhatsApp bot (using `whatsapp-web.js` & Express.js) with context-aware, multi-turn conversation history. This integration connects Orbi Marketplace's transaction flows directly to customer mobile devices.

---

## 🚀 1. Architectural Overview

The WhatsApp bot will run as an isolated backend service integrated directly into our Express API. The server handles:
1. **Persistent Authentication**: Headless Chrome session management to maintain linked-device status.
2. **Inbound Routing (Chatbot Engine)**: Captures user messages, matches them with context/history, and generates answers via Gemini / Orbi AI.
3. **Outbound Triggering (E-Commerce Notifications)**: Rest API `/api/send-message` to trigger automatic transaction alerts (e.g., order confirmation, payment escrow funded, delivery statuses).

```
 ┌─────────────────┐             ┌─────────────────────┐
 │  Customer App   │             │   Orbi Marketplace  │
 │   (WhatsApp)    │             │   Express Server    │
 └────────┬────────┘             └──────────┬──────────┘
          │                                 │
          │ ────[ Inbound WhatsApp Msg ]──> │  1. Check/load database chat history
          │                                 │  2. Format system/catalog context
          │ <───[ Dynamic Swahili/En AI ]── │  3. Call Gemini API
          │                                 │  4. Save interaction back to database
          │                                 │
          │ <───[ Outbound Escrow Alerts ]─ │  (Triggered via `/api/send-message`)
```

---

## 🛠️ 2. Step-by-Step Implementation Tasklist

### Task 2.1: Database Schema for Session & History Persistence
To ensure that the bot maintains active conversation history when a customer texts (e.g., *"Hallow, where to buy iPhone 12?"* followed by subsequent questions), we must store historical messages in database tables instead of short-lived memory:

```sql
CREATE TABLE whatsapp_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_phone VARCHAR(50) NOT NULL, -- e.g. "255712345678"
    role VARCHAR(20) NOT NULL,        -- 'user' | 'model' | 'system'
    message_body TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_sender_phone ON whatsapp_chat_history(sender_phone);
```

### Task 2.2: Context-Aware Retrieval & History Cap
When an inbound message is received from `sender_phone`:
1. **Fetch Last N Messages**: Query the database for the last 10 messages from that specific phone number to reconstruct a conversation thread.
2. **Build Prompt**:
   - **System Instruction**: Guide the AI to act as a helpful Orbi Marketplace assistant. Supply local Swahili/English dialect parameters, price structures, and category references.
   - **History Payload**: Append historical chats in chronological order:
     ```json
     [
       { "role": "user", "content": "Hallow, where to buy iPhone 12" },
       { "role": "model", "content": "Habari! Unaweza kununua iPhone 12 kwenye duka la Orbi Tech. Bei inaanza TZS 1,200,000. Je, ungependa nikuwekee oda?" },
       { "role": "user", "content": "Ina warranty ya muda gani?" }
     ]
     ```
   - **New Prompt**: Append the latest message ("Ina warranty ya muda gani?").
3. **Gemini API Call**: Execute server-side `GoogleGenAI` model call to produce a contextually consistent response.
4. **Append New Entries**: Save both the user's incoming message and the bot's generated response back to `whatsapp_chat_history`.

### Task 2.3: Express Server Setup (`whatsapp-web.js`)
Initialize and secure the client within the Node/Express startup script:

```typescript
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import axios from "axios";

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './wwebjs_auth' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let isWhatsAppReady = false;

// 1. Generate QR code in the terminal logs on boot
client.on('qr', (qr) => {
    isWhatsAppReady = false;
    console.log('SCAN THIS QR CODE TO LINK WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

// 2. Set connected status
client.on('ready', () => {
    isWhatsAppReady = true;
    console.log('WhatsApp Client is authenticated and ready!');
});

// 3. Fallback reconnection
client.on('disconnected', (reason) => {
    isWhatsAppReady = false;
    console.log('WhatsApp disconnected:', reason);
    client.initialize();
});
```

---

## 🤖 3. The Multi-Turn Conversation Flow Example

Here is how the bot maintains consistent context when a customer is querying the system:

1. **User Text**: *"Hallow, where to buy iPhone 12"*
   - **Backend Action**: Query history (empty). Fetch current product catalog for "iPhone 12" from the `products` database. Generate response: *"Habari! Tuna iPhone 12 kwa bei ya TZS 1,200,000 kwenye duka la Orbi. Je, ungependa kupata ya rangi gani?"*
   - **Storage Action**: Save the incoming user text and the generated response to `whatsapp_chat_history`.

2. **User Reply**: *"mimi nataka ya black, je kuna punguzo?"* (I want black, is there a discount?)
   - **Backend Action**: Fetch last 10 messages for this user. Construct the multi-turn prompt payload including:
     - Catalog context: wholesale pricing rules, product quantities, discount structures (`getProductSafeBundlePrice`).
     - Chat History: the previous conversation about iPhone 12.
   - **AI Generation**: Gemini receives the entire dialog context and responds: *"Ndiyo, ya rangi nyeusi ipo! Na ukinunua kuanzia jumla ya vipande 2 tunakupa punguzo la hadi 10%. Je, nikuandalie Group Buy au ununue moja kwa moja?"*
   - **Storage Action**: Store both the incoming and reply messages.

---

## 📣 4. Outbound E-commerce Transaction Alerts

Integrate this bot with existing backend hooks to send transactional updates directly to customers:

### 1. Order Placed Escrow Pending
*Triggered on checkout completion.*
> *"Habari [Name]! Oda yako #[OrderId] imepokelewa kikamilifu. Tafadhali kamilisha malipo ya TZS [Amount] kwa Lipa na M-Pesa ili kufanikisha muamala huu kwa usalama kupitia Orbi PaySafe."*

### 2. Escrow Funded / Seller Notified
*Triggered after payments confirmed.*
> *"Malipo yako yamehakikishwa na kuwekwa salama katika Escrow ya Orbi PaySafe! Muuzaji amearifiwa na anaanza kushughulikia oda yako #[OrderId] sasa hivi. 🚚"*

---

## 🛑 5. Critical Constraints & Security Rules

1. **Phone Number Standardization**: Ensure all numbers are sanitized to the standard international format (e.g. `255XXXXXXXXX@c.us`) on incoming and outgoing routing to prevent message mismatching.
2. **Rate Limiting**: Limit bot responses to 1 message per 2 seconds per sender phone number to avoid WhatsApp spam detection blockages.
3. **Opt-Out (Stop command)**: Allow users to opt-out of automated notifications by texting `STOP` or `AACHA`. Record opt-out status in the `customers` database.
4. **Agent Fallback**: If a user requests a human or expresses frustration, route the chat directly to the Wholesaler/Seller messaging board and disable the AI responder temporarily for 24 hours.
