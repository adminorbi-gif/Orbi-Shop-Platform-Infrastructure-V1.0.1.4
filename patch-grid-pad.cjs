const fs = require('fs');

let file = 'src/components/client/ProductGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change content wrapper
content = content.replace(/<div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:p-3\.5">/g, '<div className="flex flex-1 flex-col justify-between gap-1.5 pt-2 px-1">');

// We also should remove border from hover state if it's there
content = content.replace(/hover:border-\[#ff4c00\]/g, '');

fs.writeFileSync(file, content);
console.log("Done");
