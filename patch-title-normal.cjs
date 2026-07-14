const fs = require('fs');
const files = [
  'src/pages/ClientApp/index.tsx',
  'src/components/client/ProductGrid.tsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/className="orbi-product-title([^"]+)font-bold([^"]+)"/g, 'className="orbi-product-title$1font-normal$2"');
  fs.writeFileSync(file, content);
}
console.log("Patched to normal");
