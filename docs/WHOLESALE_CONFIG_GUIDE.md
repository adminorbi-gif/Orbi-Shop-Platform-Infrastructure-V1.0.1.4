# Wholesale Tier-Based Pricing & B2B Setup Guide

This guide provides merchants and system administrators with a comprehensive, step-by-step workflow for configuring wholesale pricing, setting minimum order quantities, and defining tier-based discounts inside the **Orbi Merchant Portal**.

---

## 1. Overview of the Tiered Pricing Engine
Orbi Shop's core pricing calculator evaluates order volumes dynamically. When a buyer increases the quantity of a product in their cart, the system scans the product's configured `wholesaleTiers` array and applies the correct price-point unit rate, granting immediate bulk discounts without requiring coupons or manual negotiation.

```
┌────────────────────────────────────────────────────────┐
│                   Buyer Adds Product                   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Check Product Pricing Mode                 │
└───────────────────────────┬────────────────────────────┘
                            ├─────────────────────────────┐
                            ▼ (mode: "retail")            ▼ (mode: "wholesale")
              ┌───────────────────────────┐ ┌───────────────────────────┐
              │    Apply Flat Unit Price  │ │ Scan Quantity Bracket     │
              └───────────────────────────┘ └─────────────┬─────────────┘
                                                          │
                                                          ▼
                                            ┌───────────────────────────┐
                                            │ Apply Tiered Unit Discount│
                                            └───────────────────────────┘
```

---

## 2. Step-by-Step Configuration in the Merchant Portal

Merchants can enable tiered pricing during the creation of a new product or when editing an existing listing from their dashboard.

### Step 1: Access Product Workspace
1. Log in to the **Orbi Merchant Dashboard** (`/sellers/dashboard`).
2. Navigate to the **Products (Bidhaa)** tab.
3. Click **Add Product (Ongeza Bidhaa)** to create a new listing, or click **Edit (Hariri)** (pencil icon) on any active item in your inventory grid.

### Step 2: Set Core Pricing Mode
Scroll down to the **Product Pricing Mode** card within the form:
* **Interface Fields (Kiswahili & English)**:
  * **Dropdown Selector**: `Product Pricing Mode` / `Njia ya Bei ya Bidhaa`
  * **Option 1**: `Retail (Single price)` / `Retail (Bei Kawaida)`
  * **Option 2**: `Whole Sale (Tiered pricing)` / `Whole Sale (Bei za Jumla)`
* **Action**: Toggle the dropdown and select **Whole Sale (Tiered pricing)**.

### Step 3: Define Pricing Tiers & Volume Brackets
Once you enable **Whole Sale**, the dynamic **Wholesale Pricing Tiers** section appears below. 

1. Click the **+ Add Quantity Tier** / **+ Ongeza Vigezo** button in the upper-right corner of the card to create your first volume discount bracket.
2. For each added tier, configure these two values:
   * **Min Quantity** / **Kuanzia Idadi (Min Qty)**: The lowest number of units a buyer must order to qualify for this discount bracket.
   * **Price per Unit (TZS)** / **Bei ya kila kimoja (Price per Qty)**: The unit rate (in TZS) charged when the buyer's order quantity falls within or above this tier.
3. Add as many tiers as needed to structure your wholesale strategy. For example:
   * **Tier 1**: Min Qty: `1` | Price: `150,000 TZS` (Standard retail base rate)
   * **Tier 2**: Min Qty: `10` | Price: `135,000 TZS` (10% volume discount)
   * **Tier 3**: Min Qty: `50` | Price: `120,000 TZS` (20% enterprise wholesale rate)
4. To remove a tier, click the trash can icon (**Trash2**) next to the tier bracket.

### Step 4: Configure Reserve Price Safeguards
1. Set the **Walk-Away Price (Reserve Price)** on the product sheet. This defines the absolute lowest price-point permitted for the listing across coupons, flash discounts, or buyer negotiation tools.
2. Save your changes by clicking **Publish Product** or **Update Product**.

---

## 3. Dynamic Calculation Mechanics (`src/utils/pricing.ts`)

The front-end client utilizes a deterministic utility function `getProductPriceForQty` to compute active checkout pricing. The function determines unit rates based on the following algorithm:

```typescript
export function getProductPriceForQty(product: Product, quantity: number): number {
  const qty = Math.max(1, parseInt(quantity as any, 10) || 1);
  
  // If wholesale tiers are configured, sort descending to find the highest matched minQty bracket
  if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
    const sortedTiers = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
    const matchedTier = sortedTiers.find((t) => qty >= t.minQty);
    
    if (matchedTier) {
      return matchedTier.price;
    }
  }
  
  return product.price; // Fallback to standard retail price
}
```

---

## 4. Troubleshooting and Merchant FAQ

#### Q1: Why is my tier pricing not displaying on the storefront?
* **Answer**: Verify that your tiers are saved with valid minimum quantities (strictly positive integers starting with `1` for the baseline tier). Ensure the first tier starts at `minQty: 1` to define the base unit price correctly.

#### Q2: Can buyers mix different products to trigger wholesale tier pricing?
* **Answer**: No. Wholesale tiers are evaluated **per product entry**. To bundle separate complementary items together for multi-item discounts, utilize the **Smart Bundles & Consumer Combos** module.

#### Q3: How is this integrated with the Wakala (Broker) system?
* **Answer**: If a Wakala shares a referral link for a wholesale product, the commission is computed as the configured percentage (e.g. `10%`) applied to the *actual discounted tier price* determined at checkout, rather than the initial retail base rate.
