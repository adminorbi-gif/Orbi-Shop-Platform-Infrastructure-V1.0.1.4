const fs = require('fs');
let file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:border-\[#ff4c00\] snap-start"/g, 'className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 snap-start"');
content = content.replace(/<div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:p-3\.5 border-none">/g, '<div className="flex flex-1 flex-col justify-between gap-1.5 pt-2 px-1 border-none">');

fs.writeFileSync(file, content);
console.log("Done");
