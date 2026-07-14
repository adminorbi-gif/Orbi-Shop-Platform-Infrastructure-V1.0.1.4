const fs = require('fs');

const filesToPatch = [
  'src/pages/ClientApp/index.tsx',
  'src/pages/ClientApp/components/ClientSmartBundles.tsx',
  'src/pages/ProductDetailPage.tsx'
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  const oldBottom = `<div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className={\`h-2 w-2 rounded-full \${p.stock > 0 ? "bg-emerald-500" : "bg-slate-300"}\`}></div>
                    <span className="min-w-0 break-words text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                      {p.stock > 0 ? (lang === "sw" ? "Tayari kununua" : "Ready to buy") : (lang === "sw" ? "Haipatikani" : "Unavailable")}
                    </span>
                  </div>
                  <button className="rounded-full bg-slate-950 p-2 text-white transition-colors hover:bg-[#ff4c00]">
                    <ShoppingCart size={16} />
                  </button>
                </div>`;

  const newBottom = `<div className="flex items-center gap-2 pt-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">
                      {p.stock > 0 ? (lang === "sw" ? \`\${p.stock} zipo\` : \`\${p.stock} in stock\`) : (lang === "sw" ? "Imeisha" : "Sold out")}
                    </span>
                  </div>
                </div>`;

  // Actually ProductDetailPage and ClientSmartBundles might have slight variations, let's just do regex or ignore if not exact match.
  content = content.replace(/<div className="grid grid-cols-\[1fr_auto\] items-center gap-2 border-t border-slate-100 pt-2\.5">[\s\S]*?<\/button>\s*<\/div>/g, newBottom);

  fs.writeFileSync(file, content);
}
console.log("Done");
