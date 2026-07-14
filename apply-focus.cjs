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

  // Change image padding to include rounded-[13px] border-solid
  content = content.replace(/className="h-full w-full object-cover sm:object-contain p-1 transition-transform duration-700 group-hover:scale-\[1\.03\]"/g,
  'className="h-full w-full object-cover sm:object-contain p-1 transition-transform duration-700 group-hover:scale-[1.03] rounded-[13px] border-solid"');
  
  content = content.replace(/className="h-full w-full object-cover sm:object-contain p-1 transition-transform duration-500 group-hover:scale-\[1\.03\]"/g,
  'className="h-full w-full object-cover sm:object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03] rounded-[13px] border-solid"');

  fs.writeFileSync(file, content);
}
console.log("Done");
