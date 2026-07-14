# Wakala (Broker & Agent) Commerce System Guide

## 1. Overview
The **Orbi Wakala (Broker/Agent) Module** is a peer-to-peer commerce framework built to drive offline and social-selling networks across Tanzania and East Africa. 

By empowering local brokers ("Wakalas") to promote vetted merchant inventory, Orbi Shop accelerates trust-based sales. Wakalas share direct referral links and earn structured, automated sales commissions secured directly by **ORBI PaySafe (Secure Escrow)**.

---

## 2. Architecture & Data Flow

```
   ┌─────────────────────────────────────────────────────────────┐
   │ 1. ADMIN PORTAL                                             │
   │    - Assigns Wakala ID (brokerId) to Product                │
   │    - Configures Commission Percent (brokerCommissionPercent)│
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 2. WAKALA PORTAL (/wakalas)                                 │
   │    - Wakala logs in, views their curated products catalog   │
   │    - Copies personalized referral link:                      │
   │      [BaseURL]/?product=[ID]&ref=[WakalaID]                 │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 3. CONSUMER JOURNEY & CHECKOUT                              │
   │    - Buyer loads referral link, adding product to cart      │
   │    - Orbi checkout calculates total, applying volume,       │
   │      wholesale, or coupon rates                             │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 4. SERVER PROCESSING & PAYSAFE SECURE ESCROW                 │
   │    - Calculates exact commission based on net item price     │
   │    - Embeds commission payload directly inside order        │
   │    - Escrows funds in ORBI PaySafe until delivery confirm   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 5. EARNINGS RELEASE                                         │
   │    - Order completion releases 80% available balance        │
   │    - 20% remains pending for post-purchase buyer guarantees │
   └─────────────────────────────────────────────────────────────┘
```

---

## 3. Product-Level Commission Control (Sellers & Admins)

Commission controls are set dynamically at the individual product (or listing) layer. 

### 3.1 Database Integration (`public.products`)
The database contains specific columns defining broker associations:
```sql
-- Managed during Phase 1 Foundation
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS broker_commission_percent NUMERIC DEFAULT 0;
```

### 3.2 Commission Management & Constraints
1. **Wakala Assignment**: Administrators assign a listing to a verified broker's UUID or system ID.
2. **Flexible Commission Rates**: Commissions are declared as a whole percentage (e.g., `5%`, `10%`, or `15%`).
3. **Walk-Away Price Protection**: Orbi Shop's core safety logic ensures that the sum of the **broker commission** and any **discounts** (coupons, bundles, or wholesale tiers) never drops the net revenue below the seller's `walkAwayPrice`.
4. **Display Accents**: In the Wakala Portal, products display their dedicated commission rate directly on the product card banner:
   ```
   [Kamisheni: 12%]
   ```

---

## 4. Checkout Commission Math (`/server/routes/checkout.ts`)

Commission logic is evaluated server-side during checkout to prevent client-side parameter manipulation.

### 4.1 Server Calculations
When the checkout router processes the cart array, it checks for active broker mappings on each validating item:

```typescript
// Enterprise Phase 1: Wakala Commission Calculation
let orderBrokerId: string | null = null;
let orderBrokerCommission = 0;

sellerItems.forEach((c: any) => {
  if (c.product.brokerId && c.product.brokerCommissionPercent) {
    orderBrokerId = c.product.brokerId;
    
    // Derived unit price based on B2B Wholesale Quantity Brackets or B2C retail price
    const itemPrice = getProductPriceForQty(c.product, c.quantity);
    const qty = parseInt(c.quantity, 10) || 1;
    const itemTotal = itemPrice * qty;
    
    // Deduct percentage proportional to the total net price
    const comm = (itemTotal * parseFloat(c.product.brokerCommissionPercent)) / 100;
    orderBrokerCommission += comm;
  }
});
```

### 4.2 Order Preservation (`public.orders`)
The processed broker details are locked into the final order entry:
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_commission_amount NUMERIC DEFAULT 0;
```

---

## 5. Wakala Dashboard & Release Milestones

Wakalas log into the **Wakala Portal** (`/wakalas`) to monitor their sales and commission streams.

### 5.1 Financial Breakdown
* **Jumla ya Kamisheni (Total Commission)**: Total gross volume of commission logged across all sales.
* **Kamisheni Zilizokamilika (Available Commission - 80%)**: Instantly available for withdrawal once order delivery is confirmed by the buyer or system pilot.
* **Zinazosubiri (Pending Commission - 20%)**: Held temporarily to secure buyer protection clauses and accommodate potential post-sale disputes.
* **Zilizotolewa (Withdrawn)**: Historic record of payouts successfully transferred to the Wakala's registered payment account.

### 5.2 Referral Link Mechanics
Wakalas can generate instant referral links for catalog listings:
```javascript
const link = `${window.location.origin}/?product=${product.id}&ref=${wakalaId}`;
```
When this URL is loaded, the client application pre-loads the targeted product details and preserves the referral tracking ID throughout the buyer session.
