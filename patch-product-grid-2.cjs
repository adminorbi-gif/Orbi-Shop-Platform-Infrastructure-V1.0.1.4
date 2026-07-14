const fs = require('fs');
let file = 'src/components/client/ProductGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div className="flex items-center gap-2 pt-1">\s*<div className="flex min-w-0 items-center gap-1\.5">\s*<span className="text-\[11px\] font-medium text-slate-500">\s*\{p\.stock > 0 \? \(lang === "sw" \? `\$\{p\.stock\} zipo` : `\$\{p\.stock\} in stock`\) : \(lang === "sw" \? "Imeisha" : "Sold out"\)\}\s*<\/span>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync(file, content);
console.log("Done ProductGrid 2");
