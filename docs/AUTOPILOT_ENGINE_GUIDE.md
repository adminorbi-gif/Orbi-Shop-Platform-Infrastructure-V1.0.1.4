# Orbi Autopilot & Autonomous B2B Engine

This document provides a highly structured, professional overview of the autonomous systems, localization algorithms, and dynamic pricing engines built into Orbi Shop. It serves as an authoritative guide for future developers and AI Coding Agents to maintain, extend, and enhance these systems without compromising system security or violating regional business logic.

---

## 1. Engine Core Philosophy

The Orbi Autopilot is a **client-side localized commerce orchestrator**. It automatically creates, formats, and targets B2C Combos, B2B Wholesales, and Partner Synergy Packs based on local regional dynamics and seller constraints.

The engine operates on three main tenets:
1. **Zero-Overhead Determinism**: Use robust seed hashing (e.g., based on the visiting merchant's ID or active session) to generate consistent localized options without requiring constant server roundtrips or database overhead.
2. **Dynamic Price Protection**: Never enforce hardcoded flat discounts. Always calculate maximum discount potential from the bottom up, adhering strictly to individual product price floors (`wholesaleTiers` and `walkAwayPrice`).
3. **Realistic Scarcity**: Use deterministic countdown timers to represent genuine, time-sensitive regional trade deals.

---

## 2. Dynamic Localization & Hub-Routing Algorithm

When generating personalized syndicates for a merchant, the engine maps the user's `seedId` (e.g., `userId` or `sessionId`) to key Tanzanian commerce sectors using a stable string-hashing algorithm:

### 2.1 Regional Hash Formulation
The seed string is parsed into a deterministic 32-bit integer:
```typescript
let hashVal = 0;
for (let i = 0; i < seedId.length; i++) {
  hashVal = seedId.charCodeAt(i) + ((hashVal << 5) - hashVal);
}
hashVal = Math.abs(hashVal);
```

### 2.2 Local Market Mapping
The resulting `hashVal` is used to index predefined local logistics arrays:
* **Cities**: `["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Dodoma"]`
* **Wholesale Hubs**: `["Kariakoo Wholesalers", "Sheikh Amri Plaza", "Nyamagana Central Hub", "Sido Commercial Hub", "Uhuru Street Hub"]`
* **Est. Reseller Margins**: Calculated deterministically as `12% + (hashVal % 11)` (resulting in a realistic target between $12\%$ and $22\%$).

### 2.3 Extending Regional Data
To add new cities or hubs, append them to the arrays inside `generateSmartBundles()`. The hashing function automatically distributes clients evenly across the expanded pool.

---

## 3. Dynamic Safeguard Discount Mechanics

To prevent financial loss for multi-vendor consortia and individual sellers, the system **never** hardcodes flat discount figures (e.g., subtracting a flat 12%, 15%, or 20% from retail price). 

Instead, the pricing model operates as follows:

```
               +--------------------------------------+
               |        Retail Product Price          |
               +------------------+-------------------+
                                  |
               +------------------v-------------------+
               | Checks for wholesaleTiers/walkAway   |
               +------------------+-------------------+
                                  |
               +------------------v-------------------+
               | Determines safe unit price floor     |
               | (via getProductSafeBundlePrice)      |
               +------------------+-------------------+
                                  |
               +------------------v-------------------+
               | Aggregates all safe prices into sum   |
               +------------------+-------------------+
                                  |
               +------------------v-------------------+
               | Back-calculates actual discount %    |
               | (ensures profit-margin safety)       |
               +--------------------------------------+
```

### 3.1 Price Floor Evaluation Flow
1. Check if the product has `wholesaleTiers` configured. If yes, take the minimum price defined in the tiers as the absolute wholesale floor.
2. If no wholesale tiers are found, check if a custom `walkAwayPrice` is set by the seller.
3. If neither is available, apply a gentle, protected discount dynamically.

### 3.2 Dynamic Discount Back-Calculation
The final discount percentage shown to the merchant is back-calculated using the aggregate retail cost and the protected floor price:
$$\text{Discount \%} = \text{Math.max}\left(1, \text{Math.round}\left(\frac{\text{Original Price} - \text{Bundle Price}}{\text{Original Price}} \times 100\right)\right)$$

This ensures the user sees a premium, dynamically configured percentage discount, but the system never dips below any individual product's walk-away rate.

---

## 4. Live Scarcity & Countdown Mechanics

To encourage swift wholesale acquisition, the `ClientB2BDealRoomCard` implements a countdown timer. 

### 4.1 Seeded Deal Lifespans
To prevent jarring UI changes where timers reset on every refresh, the duration is stably seeded using the bundle's unique string ID:
* **Seed Formula**:
  ```typescript
  const idStr = String(bundle.id || 'bundle');
  const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Seeds remaining time between 1h 15m (4500s) and 6h 15m (22500s)
  const durationSeconds = 4500 + (hash % 18000);
  ```
* **Interval Loop**: A standard React `useEffect` runs an interval to decrement `timeLeft` each second.
* **Expiry Safeties**: When the timer reaches zero, the card displays `"Ended"` or `"Muda Umekwisha"` (in Swahili mode) and disables further bulk procurement interactions for that specific deal.

---

## 5. Guidelines for Future AI Coding Agents

When tasked with modifying, optimizing, or extending these dynamic systems:
1. **Never Hardcode Pricing Math**: Always use `getProductSafeBundlePrice` or its equivalent checks to resolve unit costs.
2. **Keep the Hashing Pure**: Do not inject side-effects or asynchronous calls inside the hash generation. It must remain synchronous, deterministic, and fast.
3. **Preserve Bilingual Strings**: Ensure any new autopilot strings or localization keys support both English (`en`) and Swahili (`sw`) versions. Refer to `i18nClient.ts` or local translation variables.
4. **Adhere to standard types**: Keep all extended bundle metadata compatible with the `SmartBundle` interface defined in `src/types.ts`.
