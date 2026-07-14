# Product Bundles & Wholesale Integration Guide

## 1. Overview
Orbi Shop incorporates a powerful, multi-channel **Product Bundle & Wholesale Tiering Engine** to optimize merchant sales velocity, enable business-to-business (B2B) procurements, and deliver high-yield consumer combos (B2C). 

By offering synergistic product combinations at reduced overheads, the marketplace increases the Average Order Value (AOV) for sellers while providing deep, transparent discounts to both everyday buyers and commercial enterprises.

---

## 2. Dynamic Bundle Generation (The Ecosystem Engine)

Client-facing bundles are generated dynamically using real-time inventory from the active marketplace pool. Implemented in `src/pages/ClientApp/components/ClientSmartBundles.tsx`, the generator function (`generateSmartBundles`) processes products based on several safety and contextual rules:

### Core Generation Logic
1. **Validation & Filtering**: The engine filters active products to ensure only items with positive stock (`stock > 0`) and valid pricing (`price > 0`) are selected.
2. **Contextual Relevance**: Bundles are automatically categorized and filtered based on the buyer's selected **Niche** or **Family** to guarantee highly relevant combos.
3. **Strict Deduplication**: No duplicate products can exist inside a single bundle, guaranteeing unique pairs.
4. **Automatic Backfilling**: If a specific niche contains fewer than 2 distinct items, the engine backfills products from the global pool to guarantee package completeness.

---

## 3. Bundle Classifications & Pricing Models

The system automatically generates and renders four primary archetypes of product bundles:

```
                  ┌──────────────────────────────┐
                  │   Orbi Smart Bundle Pool     │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ B2C Combos      │     │ B2B Wholesale   │     │ Partner Synergy │
│ (12% Discount)  │     │ (20% Discount)  │     │ (15% Discount)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                 │
                                         ┌───────┴───────┐
                                         ▼               ▼
                                ┌─────────────────┐     ┌─────────────────┐
                                │ P2C (Same)      │     │ P2B (Different) │
                                └─────────────────┘     └─────────────────┘
```

### 3.1 B2C Consumer Combo (Consumer Combo)
* **Structure**: Exactly 2 distinct products.
* **Standard Discount**: `12%` off standard retail pricing.
* **Objective**: Formulates premium, everyday combos with high-synergy products for immediate household or individual utility.
* **Data Definition**:
  ```typescript
  type: "B2C"
  name: "Premium [Family/Niche] Lifestyle Combo"
  ```

### 3.2 B2B Enterprise Wholesale (Wholesale Collection)
* **Structure**: Exactly 3 distinct products (bypasses to 2 if distinct pool limit is reached).
* **Standard Discount**: `20%` off standard pricing.
* **Objective**: High-yield multi-product collection tailored for merchants, local B2B vendors, and reselling pools to enhance regional retail margins.
* **Data Definition**:
  ```typescript
  type: "B2B"
  name: "[Niche] B2B Enterprise Collection"
  ```

### 3.3 P2C Factory-Direct Bundle (Partner-to-Consumer)
* **Structure**: Exactly 2 distinct products sourced from the **same seller**.
* **Standard Discount**: `15%` off standard pricing.
* **Objective**: Bypasses intermediate distribution markups, delivering bulk products straight from original producers and factory-direct merchants.
* **Data Definition**:
  ```typescript
  type: "P2C"
  name: "P2C Factory-to-Business Direct Solution"
  ```

### 3.4 P2B Multi-Vendor Synergy (Partner-to-Business)
* **Structure**: Exactly 2 distinct products sourced from **different sellers**.
* **Standard Discount**: `15%` off standard pricing.
* **Objective**: Joint peer-to-business packages offering complementary operational synergy (e.g., pairing a coffee maker vendor with a cup vendor).
* **Data Definition**:
  ```typescript
  type: "P2B"
  name: "P2B Multi-Vendor Synergy Pack"
  ```

---

### 3.5 Dynamic Safeguard Discount Mechanics (Why Percentages are NOT Hardcoded)

While user interface labels and nominal targets reference baseline numbers (e.g., `12%` for B2C, `20%` for B2B, `15%` for Partner Synergy), **the actual percentage discounts are not static, flat, or hardcoded in the codebase.** 

Instead, the system utilizes a **bottom-up dynamic valuation and safeguard architecture** to protect merchant profitability and respect wholesale constraints:

1. **Wholesale Pricing Integration**: The system queries the individual product's `wholesaleTiers` to find the minimum possible unit cost set by the seller for large volumes.
2. **Walk-Away Price Protection**: If no wholesale tiers exist, the system checks for a merchant-specified `walkAwayPrice` (the absolute reserve floor below which a sale cannot be executed).
3. **Guardrailed Unit Sourcing (`getProductSafeBundlePrice`)**: The final pricing engine computes the safe unit floor for each package component dynamically:
   ```typescript
   export function getProductSafeBundlePrice(product: Product): number {
     const retailPrice = product.price;
     // Sourced from minimum wholesale tier rate, fallback to walkAwayPrice, fallback to a small retail discount
     ...
   }
   ```
4. **Dynamic Back-Calculated Discount**: After determining the safe minimum price floors for all products in the combo, the bundle's total price is set, and the final discount percentage is back-calculated in real time:
   $$\text{Discount Percentage} = \text{Math.max}\left(1, \text{Math.round}\left(\frac{\text{Original Price} - \text{Bundle Price}}{\text{Original Price}} \times 100\right)\right)$$

This approach guarantees that **every bundle is self-balancing and legally protected**—ensuring buyers receive maximum safe value while preventing sellers from ever suffering a loss from over-discounted automatic bundles.

---

## 4. Merchant-Managed Bundles

Sellers can bypass algorithmic generation and construct high-converting custom combos directly from their Merchant Portal via the `SellerSmartBundles` component.

### 4.1 Interface Architecture
The `SellerSmartBundles` panel allows verified merchants to:
* **Formulate Name & Metadata**: Title the bundle in both English and Kiswahili (e.g., *"Back to School Pack"* or *"Kifurushi cha Shule"*).
* **Configure Discounts**: Manually input a percentage discount (`0% - 100%`) applied proportionally across all bundled items.
* **Inventory Control**: Directly select items from their product catalogue, assign individual quantities per product, and remove/update bundle contents on demand.

### 4.2 Code Hook Implementation
Sellers manage the state utilizing the standard `SmartBundle` schema:
```typescript
export interface SmartBundle {
  id: string;
  sellerId: string;
  name: string;
  description?: string;
  items: { productId: string; quantity: number }[];
  discountPercentage: number;
  active: boolean;
  createdAt: number;
}
```

---

## 5. Wholesale Price Tiering (B2B Quantity Brackets)

In addition to multi-product bundles, Orbi Shop supports item-specific wholesale bulk pricing. Implemented at the individual product layer, this allows sellers to establish progressive quantity-based discounts.

### 5.1 Wholesale Schema
```typescript
export interface WholesaleTier {
  minQty: number;      // Minimum units required to trigger the discount
  maxQty?: number;     // Optional upper boundary of the tier bracket
  price: number;       // Discounted price per unit for this tier
}
```

### 5.2 Product Integration
Every individual `Product` can define an optional `wholesaleTiers` list:
```typescript
export interface Product {
  id: string;
  price: number;                    // Standard retail price (1 unit)
  wholesaleTiers?: WholesaleTier[]; // Volume discount brackets
  walkAwayPrice?: number;           // Absolute bottom-line reserve price
  // ... rest of fields
}
```

### 5.3 Practical Example
A single smartphone is listed at `600,000 TZS`. The merchant configures the following volume pricing brackets:

| Order Quantity (Units) | Price per Unit (TZS) | Type |
| :--- | :--- | :--- |
| **1 - 9 units** | `600,000 TZS` | Retail (B2C) |
| **10 - 49 units** | `550,000 TZS` | Wholesale (B2B Tier 1) |
| **50+ units** | `500,000 TZS` | Enterprise (B2B Tier 2) |

---

## 6. How Admins Monitor and Audits

Admin users track and regulate bundles and wholesale systems through the centralized **Finances & Products Admin Dashboard**:
1. **Commission Protection**: The system guarantees that even when maximum wholesale discounts (e.g., 20%) are triggered, the final unit price never drops below the `walkAwayPrice` configured by the merchant or broker.
2. **Taxation & TRA Integration**: Bundled purchases are parsed and summarized on a single line item during checkout, ensuring correct mapping to TRA (Tanzania Revenue Authority) tax codes and accurate fiscal receipt generation.
3. **Performance Metrics**: Admins can audit high-performing bundles to identify market demands, fueling dynamic recommendations and push notifications across the ecosystem.

---

## 7. Autonomous Personalized B2B Syndicates & Autopilot Engine

Orbi Shop features an automated, serverless **Autopilot B2B Procurement Engine** designed to foster localized trade networks within key commercial sectors of Tanzania. When a client interacts with the B2B Deal Room, the engine generates bespoke, high-yield multi-vendor wholesale bundles personalized to that merchant's dynamic profile.

### 7.1 Deterministic User-to-Regional Hash Mapping
To deliver a personalized B2B experience without heavy database overhead, the engine calculates a stable, deterministic hash from the user's ID (`seedId`). This hash maps the visiting merchant to specific local distribution networks:

* **Commercial Cities**: Dynamically allocates the merchant's target market (e.g., *Dar es Salaam, Arusha, Mwanza, Mbeya, or Dodoma*).
* **Wholesale Hub Sources**: Identifies the regional physical wholesale hub closest to their logistics network (e.g., *Kariakoo Wholesalers, Sheikh Amri Plaza, Nyamagana Central Hub, Sido Commercial Hub, or Uhuru Street Hub*).
* **Calculated Profit Margins**: Projects a realistic, personalized retail profit margin target ranging between **12% and 22%** based on physical logistics, regional transport costs, and localized supply-demand metrics.

### 7.2 Dynamic B2B Naming & Localization Blueprint
The naming convention and marketing copywriting adapt seamlessly to the localized merchant's background:

* **English Bundle Names**: `[BusinessCity] [Sector] Wholesale Syndicate` (e.g., *"Dar es Salaam Electronics & Tech Wholesale Syndicate"*).
* **Swahili Bundle Names**: `Kifurushi cha [HubName] ([SectorSw])` (e.g., *"Kifurushi cha Kariakoo Wholesalers (Vifaa vya Umeme & Teknolojia)"*).
* **Localized Logistics Description**: Explains to the merchant how the auto-routed bulk bundle groups products to minimize transport overhead, secure lower import-broker tariffs, and guarantee their projected retail margins.

### 7.3 Real-Time Scarcity & Countdown Engine
To drive higher commercial conversion, the B2B Deal Room integrates a subtle, highly professional countdown timer on each bundle card:
* **Stable Seeding**: Time-to-expiration is seeded deterministically using the bundle's ID (typically between **1 hour 15 minutes** and **6 hours 15 minutes**) so that returning to the page provides a consistent sense of urgency rather than random flashes.
* **Urgency Indicators**: A compact, responsive badge styled in soft rose tones containing a pulsating `Clock` icon and tabular numbers (e.g., `03h:41m:12s`) keeps track of remaining hours, minutes, and seconds before the custom syndicate deal expires.
* **Live Expiry State**: Once the timer expires, the deal safely indicates it has closed (`Muda Umekwisha` / `Ended`) to protect merchant margins from stale market prices.
