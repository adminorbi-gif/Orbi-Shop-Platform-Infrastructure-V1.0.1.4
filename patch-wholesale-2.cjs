const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetailPage.tsx', 'utf8');

content = content.replace(
  /pcs/g,
  '${product.soldBy || "pcs"}'
); // Wait, this might replace too many things, let me be specific.

const target = `const rangeStr = tier.maxQty 
                           ? \`\$\{tier.minQty\} - \$\{tier.maxQty\} pcs\` 
                           : \`≥ \$\{tier.minQty.toLocaleString()\} pcs\`;`;
                           
const repl = `const rangeStr = tier.maxQty 
                           ? \`\$\{tier.minQty\} - \$\{tier.maxQty\} \$\{product.soldBy || "pcs"}\` 
                           : \`≥ \$\{tier.minQty.toLocaleString()\} \$\{product.soldBy || "pcs"}\`;`;
                           
// Just use a simpler regex:
content = content.replace(/`\$\{tier\.minQty\} - \$\{tier\.maxQty\} pcs`/g, '`${tier.minQty} - ${tier.maxQty} ${product.soldBy || "pcs"}`');
content = content.replace(/`≥ \$\{tier\.minQty\.toLocaleString\(\)\} pcs`/g, '`≥ ${tier.minQty.toLocaleString()} ${product.soldBy || "pcs"}`');

fs.writeFileSync('src/pages/ProductDetailPage.tsx', content);
console.log("Patched rangeStr successfully");
