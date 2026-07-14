const fs = require('fs');
const code = fs.readFileSync('src/pages/SellerApp/useSellerApp.tsx', 'utf-8');
const replacement = `    if (prodOldPrice && Number(prodOldPrice) > 0 && Number(prodOldPrice) <= priceNum) {
      displayAlert(
        lang === "sw"
          ? "Bei ya zamani lazima iwe kubwa kuliko bei ya kuuza ili ionyeshe punguzo sahihi."
          : "Old price must be greater than the selling price to show a valid discount.",
        "error",
      );
      return;
    }

    if (!prodSoldBy) {
      displayAlert(
        lang === "sw"
          ? "Tafadhali chagua kipimo (Inauzwa kwa) kabla ya kuhifadhi."
          : "Please select the unit (Sold by) before saving.",
        "error"
      );
      return;
    }

    if (prodPricingMode === "wholesale") {`;
const target = `    if (prodOldPrice && Number(prodOldPrice) > 0 && Number(prodOldPrice) <= priceNum) {
      displayAlert(
        lang === "sw"
          ? "Bei ya zamani lazima iwe kubwa kuliko bei ya kuuza ili ionyeshe punguzo sahihi."
          : "Old price must be greater than the selling price to show a valid discount.",
        "error",
      );
      return;
    }

    if (prodPricingMode === "wholesale") {`;
if (code.includes(target)) {
  fs.writeFileSync('src/pages/SellerApp/useSellerApp.tsx', code.replace(target, replacement));
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
