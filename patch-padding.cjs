const fs = require('fs');

const filesToPatch = [
  'src/components/client/ProductGrid.tsx',
  'src/pages/ClientApp/index.tsx',
  'src/pages/ClientApp/components/ClientSmartBundles.tsx',
  'src/pages/ProductDetailPage.tsx'
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace pt-2 px-1 with mt-2 px-0 or just mt-2
    content = content.replace(/gap-1\.5 pt-2 px-1/g, 'gap-1.5 mt-2 px-0');
    content = content.replace(/gap-2 pt-2 px-1/g, 'gap-2 mt-2 px-0');
    fs.writeFileSync(file, content);
  }
}
console.log("Done padding patch");
