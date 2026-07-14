const fs = require('fs');
const filesToPatch = [
  'src/components/client/ProductGrid.tsx',
  'src/pages/ClientApp/index.tsx',
  'src/pages/ClientApp/components/ClientSmartBundles.tsx',
  'src/pages/ProductDetailPage.tsx'
];
for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ rounded-\[13px\]/g, '');
  content = content.replace(/rounded-\[13px\] /g, '');
  fs.writeFileSync(file, content);
}
console.log("Done");
