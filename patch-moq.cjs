const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

content = content.replace(
  /<span className="shrink-0 text-\[10px\] font-bold text-\[\#12303c\]">MOQ: \{p\.stock\}<\/span>/,
  '<span className="shrink-0 text-[10px] font-bold text-[#12303c]">MOQ {p.stock}: Sold by {p.soldBy || "Piece"}</span>'
);

fs.writeFileSync('src/pages/ClientApp/index.tsx', content);
console.log("Patched index.tsx successfully");
