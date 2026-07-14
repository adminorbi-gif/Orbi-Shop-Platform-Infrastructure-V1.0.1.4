const fs = require('fs');

const filesToPatch = [
  'src/pages/ClientApp/index.tsx',
  'src/pages/ClientApp/components/ClientSmartBundles.tsx',
  'src/pages/ProductDetailPage.tsx'
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/<span className="text-\[10px\] font-bold text-slate-400">\s*\{p.stock > 0 \? \(lang === "sw" \? \`\$\{p.stock\} zipo\` : \`\$\{p.stock\} left\`\) : \(lang === "sw" \? "Imeisha" : "Sold out"\)\}\s*<\/span>/g, '');

  fs.writeFileSync(file, content);
}
console.log("Done");
