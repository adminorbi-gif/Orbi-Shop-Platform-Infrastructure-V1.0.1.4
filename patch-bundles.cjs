const fs = require('fs');
let file = 'src/pages/ClientApp/components/ClientSmartBundles.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden bg-white transition-all duration-300 hover:border-\[#ff4c00\] relative"/g, 'className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 relative"');

content = content.replace(/<div className="flex flex-1 flex-col justify-between gap-3 p-3\.5 bg-white">/g, '<div className="flex flex-1 flex-col justify-between gap-2 pt-2 px-1">');

fs.writeFileSync(file, content);
console.log("Done");
