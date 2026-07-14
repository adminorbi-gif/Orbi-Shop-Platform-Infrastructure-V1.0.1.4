const fs = require('fs');

let file = 'src/components/client/ProductGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove category text block
content = content.replace(/\{\(\(\) => \{\s*let catText = p\.category \|\| "General";\s*let familyText = p\.family \|\| "";\s*if \(catText\.includes\("::"\)\) \{\s*const parts = catText\.split\("::"\);\s*catText = parts\[1\] \|\| parts\[0\] \|\| "General";\s*familyText = parts\[2\] \|\| familyText;\s*\}\s*return \(\s*<p className="break-words text-\[8\.5px\] font-black uppercase tracking-\[0\.14em\] text-slate-400">\s*\{catText\}\{familyText \? ` • \$\{familyText\}` : ""\}\s*<\/p>\s*\);\s*\}\)\(\)\}/, '');

// Remove availability status block
content = content.replace(/<div className="flex items-center justify-between gap-2">\s*<div className="flex min-w-0 items-center text-\[11px\] font-medium leading-tight text-slate-500">\s*<Truck size=\{10\} className="shrink-0 text-blue-500" \/>\s*<span className="min-w-0 break-words">\s*\{p\.stock > 0\s*\?\s*`\$\{getDeliveryZoneName\(primaryDeliveryZone, lang\)\} \$\{formatDeliveryDays\(primaryDeliveryZone, lang\)\}`\s*:\s*\(lang === "sw" \? "Haipatikani" : "Unavailable"\)\}\s*<\/span>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync(file, content);
console.log("Done ProductGrid");
