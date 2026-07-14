const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetailPage.tsx', 'utf8');

content = content.replace(
  /lang === "sw" \? "Vipande \(Pieces\)" : "Quantity Range"/g,
  'lang === "sw" ? `${product.soldBy || "Vipande"} (${product.soldBy || "Pieces"})` : "Quantity Range"'
);

content = content.replace(
  /lang === "sw" \? "Bei Kupitia Jumla \/ pc" : "Price per Piece"/g,
  'lang === "sw" ? `Bei Kupitia Jumla / ${product.soldBy || "pc"}` : `Price per ${product.soldBy || "Piece"}`'
);

content = content.replace(
  /const rangeStr = tier\.maxQty \n                           \? \`\$\{tier\.minQty\} - \$\{tier\.maxQty\} pcs\`\n                           : \`≥ \$\{tier\.minQty\.toLocaleString\(\)\} pcs\`;/g,
  'const rangeStr = tier.maxQty \n                           ? `${tier.minQty} - ${tier.maxQty} ${product.soldBy || "pcs"}`\n                           : `≥ ${tier.minQty.toLocaleString()} ${product.soldBy || "pcs"}`;'
);

fs.writeFileSync('src/pages/ProductDetailPage.tsx', content);
console.log("Patched ProductDetailPage.tsx successfully for wholesale tiers");
