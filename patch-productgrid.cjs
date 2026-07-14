const fs = require('fs');
let content = fs.readFileSync('src/components/client/ProductGrid.tsx', 'utf8');

// Update main card container class
content = content.replace(/className="orbi-market-product-card group flex cursor-pointer flex-col overflow-hidden rounded-\[1\.35rem\] border border-slate-200\/80 text-left transition-all duration-300 hover:-translate-y-1 hover:border-orange-300\/70"/g, 
'className="orbi-market-product-card group flex cursor-pointer flex-col overflow-hidden text-left transition-all duration-300 hover:border-[#ff4c00]"');

// Make image stage cleaner and standard aspect ratio (e.g., 1/1)
content = content.replace(/className="orbi-product-image-stage relative aspect-\[1\/1\.02\] overflow-hidden"/g,
'className="orbi-product-image-stage relative aspect-[1/1] overflow-hidden"');

// Reduce font weight on product title
content = content.replace(/className="orbi-product-title text-\[12px\] font-black leading-\[1\.2\] text-slate-950 transition-colors group-hover:text-\[#ff4c00\] sm:text-\[14px\]"/g,
'className="orbi-product-title text-[13px] font-medium leading-[1.3] text-slate-800 transition-colors group-hover:text-[#ff4c00] sm:text-[14px] line-clamp-2"');

// Delivery badge simpler
content = content.replace(/<div className="flex min-w-0 items-center rounded-full bg-slate-50 px-2 py-1 text-\[9\.5px\] font-bold leading-tight text-slate-400 ring-1 ring-slate-100">/g,
'<div className="flex min-w-0 items-center text-[11px] font-medium leading-tight text-slate-500">');

// Remove large button, make it cleaner like Alibaba (just price, minimal actions)
// Actually Alibaba cards often just have the price and maybe "sold". Let's simplify the bottom section.
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

content = content.replace(oldBottom, newBottom);

// Also remove stock count from previous place to avoid duplication
const oldStockDisplay = `<span className="text-[10px] font-bold text-slate-400">
                    {p.stock > 0 ? (lang === "sw" ? \`\${p.stock} zipo\` : \`\${p.stock} left\`) : (lang === "sw" ? "Imeisha" : "Sold out")}
                  </span>`;
content = content.replace(oldStockDisplay, '');

fs.writeFileSync('src/components/client/ProductGrid.tsx', content);
