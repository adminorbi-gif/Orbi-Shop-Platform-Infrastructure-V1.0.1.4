const fs = require('fs');

const filesToPatch = [
  'src/pages/ClientApp/index.tsx',
  'src/pages/ClientApp/components/ClientSmartBundles.tsx',
  'src/pages/ProductDetailPage.tsx'
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Update card container classes
  // ClientApp/index.tsx
  content = content.replace(/className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-\[1\.35rem\] border border-slate-200\/80 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300\/70 snap-start"/g,
  'className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:border-[#ff4c00] snap-start"');

  // ClientSmartBundles
  content = content.replace(/className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-\[1\.35rem\] border border-slate-200\/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-\[#ff4c00\] hover:shadow-md relative"/g,
  'className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden bg-white transition-all duration-300 hover:border-[#ff4c00] relative"');

  // ProductDetailPage
  content = content.replace(/className="orbi-market-product-card select-none transition duration-300 cursor-pointer overflow-hidden flex flex-col group h-full rounded-\[1\.4rem\] border border-slate-200\/80"/g,
  'className="orbi-market-product-card select-none transition duration-300 cursor-pointer overflow-hidden flex flex-col group h-full hover:border-[#ff4c00]"');

  // Image stage aspect ratio
  content = content.replace(/className="orbi-product-image-stage relative aspect-\[1\/1\.02\] overflow-hidden/g,
  'className="orbi-product-image-stage relative aspect-[1/1] overflow-hidden');

  // Title font
  content = content.replace(/className="orbi-product-title text-\[12px\] font-black leading-\[1\.2\] text-slate-950 transition-colors group-hover:text-\[#ff4c00\] sm:text-\[14px\]"/g,
  'className="orbi-product-title text-[13px] font-medium leading-[1.3] text-slate-800 transition-colors group-hover:text-[#ff4c00] sm:text-[14px] line-clamp-2"');

  // Delivery badge simpler
  content = content.replace(/<div className="flex items-center min-w-0 rounded-full bg-slate-50 px-2 py-1 text-\[9\.5px\] font-bold leading-tight text-slate-400 ring-1 ring-slate-100/g,
  '<div className="flex items-center min-w-0 text-[11px] font-medium leading-tight text-slate-500');

  content = content.replace(/<div className="flex min-w-0 items-center rounded-full bg-slate-50 px-2 py-1 text-\[9\.5px\] font-bold leading-tight text-slate-400 ring-1 ring-slate-100/g,
  '<div className="flex min-w-0 items-center text-[11px] font-medium leading-tight text-slate-500');


  fs.writeFileSync(file, content);
}
console.log("Done");
