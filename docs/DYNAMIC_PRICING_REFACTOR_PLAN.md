# Orbi Shop - Dynamic Pricing, Bundle & Commission Refactor Plan

This document outlines the architectural blueprint and execution plan to refactor Orbi Shop's product pricing, wholesale, and bundle engine. The primary objective is to **eliminate all hardcoded discount percentages** and ensure that pricing structures, discounts, and commissions are computed dynamically based on live catalog data, seller configuration settings, and strict safety safeguards.

---

## 1. Core Gaps in Current Architecture

| Component | Current Implementation | Proposed Dynamic Fix |
| :--- | :--- | :--- |
| **Client Bundles** | Hardcoded discounts (`12%` B2C, `20%` B2B, `15%` P2C/P2B) mapped directly in client UI. | Calculated as a dynamic mathematical delta between sum of retail prices and sum of active wholesale/tier rates. |
| **Walk-Away Price Protection** | Disconnected from client-side bundle generation. Could potentially lead to a bundle price violating a merchant's absolute minimum. | The client and server bundle calculators apply `Math.max(calculatedBundlePrice, sum(items.walkAwayPrice))` dynamically. |
| **Wakala Commissions** | Determined by applying static product commission percentages on the final checkout total. | Commission rates are validated server-side on the *net post-discount unit price* to prevent commission leakage on negative-margin sales. |
| **Wholesale Tier Alignments** | Separate retail vs. wholesale modes. | Unified calculator where standard retail pricing is evaluated as a wholesale tier of quantity 1, ensuring a single source of truth. |

---

## 2. Dynamic Bundle Calculator Formula (No Hardcoding)

Under the new architecture, discount values are never declared as static numbers. Instead, they are computed outputs of product-level and seller-level catalog arrays.

```
┌────────────────────────────────────────────────────────────────┐
│ 1. Retrieve items in bundle:                                   │
│    items = [item_A, item_B]                                    │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Sum original retail unit prices:                            │
│    originalPrice = item_A.price + item_B.price                 │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Evaluate item-specific wholesale rates for target quantity:  │
│    unitPrice_A = getProductPriceForQty(item_A, qty_A)          │
│    unitPrice_B = getProductPriceForQty(item_B, qty_B)          │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. Sum computed discounted unit prices:                        │
│    discountedSum = (unitPrice_A * qty_A) + (unitPrice_B * qty_B)│
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Apply Merchant Walk-Away Safety Guard:                      │
│    minPrice = (item_A.walkAwayPrice * qty_A) + (item_B.walkAway)│
│    finalBundlePrice = Math.max(discountedSum, minPrice)        │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Dynamically derive and display the discount percentage:     │
│    discountPercentage = ((originalPrice - bundlePrice) /       │
│                           originalPrice) * 100                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Client-Side Refactor (`/src/pages/ClientApp/components/ClientSmartBundles.tsx`)
1. Remove static constants:
   * Delete hardcoded percentage variables (`const discountPercentage = 12;`, `20`, `15`).
2. Integrate unified price engine:
   * Import the `getProductPriceForQty` utility from `src/utils/pricing.ts`.
3. Compute pricing dynamically:
   ```typescript
   // Dynamic B2B evaluation
   const items = hasThree ? [p1, p2, p3] : [p1, p2];
   const originalPrice = items.reduce((sum, item) => sum + item.price, 0);
   
   // Derive from the actual quantity-bracket price (e.g. B2B orders trigger wholesale tier quantities)
   const bundlePrice = items.reduce((sum, item) => {
     // B2B triggers wholesale quantity thresholds (e.g. min 10 units per item)
     const wholesalePrice = getProductPriceForQty(item, 10);
     return sum + Math.max(wholesalePrice, item.walkAwayPrice || 0);
   }, 0);
   
   const discountPercentage = Math.round(((originalPrice - bundlePrice) / originalPrice) * 100);
   ```

### Phase 2: Checkout Security & Invoicing (`/server/routes/checkout.ts`)
1. Validate client-submitted cart payloads against the same `getProductPriceForQty` logic.
2. Ensure that if a bundle is detected during checkout, the server-side validator reconstructs the items, recalculates the safety baseline using `walkAwayPrice`, and verifies that the transaction total meets or exceeds the merchant floor price.
3. Compute the Wakala commission based on the final, dynamically calculated net checkout line-item price:
   ```typescript
   const finalItemPrice = getProductPriceForQty(product, quantity);
   const earnedCommission = (finalItemPrice * quantity * (product.brokerCommissionPercent / 100));
   ```

### Phase 3: Merchant Portal Integration (`/src/components/seller/SellerSmartBundles.tsx`)
1. Modify the manual Bundle Creation form.
2. Instead of typing a freeform discount percentage, the merchant sets individual target quantities and matching discount tiers.
3. The UI automatically displays the computed dynamic discount and flags a warning if any tier breaches the item's configured `walkAwayPrice` threshold.

---

## 4. Operational & Performance Advantages
* **Zero Discrepancies**: Prevents checkout failures and database mapping mismatch errors where client-calculated totals contradict server-side tax and payment gateway rates.
* **Merchant Margin Security**: Guarantee that every automated sales channel (direct buying, bundles, wholesale orders, and broker networks) strictly honors individual merchant margin limits (`walkAwayPrice`).
* **Clean TRA Audits**: Every discount and tax line item on generated invoices is mathematically clean, allowing simple reporting to the Tanzania Revenue Authority (TRA) without fractional rounding errors.
