# Custom Instructions for Orbi Marketplace

## UI & Layout Guidelines
- **Product Grid Layout**: Ensure that the `.orbi-product-list-grid` always uses CSS Grid (`display: grid; grid-template-columns: repeat(auto-fill, minmax(..., 1fr));`). NEVER use `display: flex` for the product grid, as it causes the product cards to expand without limits and ruins the shopping center UI.
- **Top Recommended Collection**: The "What are you looking for?" / "Our top recommended collection for you" banner is a specialized, full-width section. Do NOT render it inside a standard product card container or apply standard product card styles to it. It must maintain its unique, full-width carousel/banner appearance.

## Code Maintenance
- **Translations (`i18nClient.ts`)**: When modifying `i18nClient.ts`, be extremely careful NOT to accidentally delete existing translation keys (e.g., `feat.niche1` to `feat.niche6`). Always verify that no unintended lines are removed during edits.
- **Niche & Categories**: Always respect the predefined niches (Electronics & Tech, Fashion & Apparel, Home & Furniture, Health & Beauty, Auto & Motors, Supermarket & Food). Do not remove their respective icons or mapping logic.
- **Unrelated Code & Logic**: DO NOT modify, format, or rewrite code, logic, or styles that are not directly related to the specific request. Keep edits strictly scoped to the exact task to avoid regressions, unintended layout changes, or breaking existing features.

## Autopilot & B2B Engine Guidelines
- **No Hardcoded Pricing Math**: When working on product combos, bundles, or wholesale syndicates, never hardcode static discount rates (e.g., flat `20%` price reduction). Always resolve price floors using `getProductSafeBundlePrice()` to honor individual merchant wholesale limits (`wholesaleTiers` and `walkAwayPrice`).
- **Deterministic Localization Mapping**: Keep the localized mapping (city, hub names, and target reseller margin rates) derived deterministically from the visiting merchant's unique seed ID or session ID to ensure consistent client experiences on refresh.
- **Urgency & Expiry Timers**: Do not use randomly generated, fluctuating timer durations on subsequent card loads. Seed countdown values using unique bundle IDs to provide realistic, predictable scarcity indicators. Refer to `/docs/AUTOPILOT_ENGINE_GUIDE.md` for full implementation details.

Add custom instructions for your project to control style, models used, add specific knowledge, and more.
