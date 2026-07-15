const fs = require('fs');
const file = 'src/components/client/NicheHub.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1.5 tracking-tight">
            {lang === "sw" ? "Ungependa Kununua nini Leo Kutoka Kwetu?" : "What would you like to buy from us today?"}
          </h2>`;

const replacement1 = `          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {lang === "sw" ? "Ungependa Kununua nini Leo Kutoka Kwetu?" : "What would you like to buy from us today?"}
            </h2>
            <button onClick={() => setShowAllCategories(true)} className="inline-flex w-fit items-center gap-1.5 text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors">
               <LucideIcons.LayoutGrid size={14} />
               {lang === "sw" ? "Kategoria Zote" : "All Categories"}
            </button>
          </div>`;

content = content.replace(target1, replacement1);

// Then insert the modal at the end of the return statement, just before the closing </div>
const modalHTML = `
      <AnimatePresence>
        {showAllCategories && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
               <div className="flex items-center gap-3">
                 <button onClick={() => setShowAllCategories(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                   <LucideIcons.X size={20} />
                 </button>
                 <h2 className="text-xl font-black text-slate-800">{lang === "sw" ? "Kategoria Zote" : "All Categories"}</h2>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
               <div className="max-w-7xl mx-auto space-y-12 pb-24">
                  {displayNiches.map(niche => {
                      const IconComponent = (LucideIcons as any)[niche.icon] || LucideIcons.ShoppingBag;
                      const styleInfo = getStyleClasses(niche.name);
                      return (
                         <div key={niche.name}>
                             <div className="flex items-center gap-3 mb-4">
                                 <div className={\`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 \${styleInfo.bgClass}\`}>
                                     <IconComponent size={24} />
                                 </div>
                                 <h3 className={\`text-2xl font-black \${styleInfo.textClass}\`}>{niche.name}</h3>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                {niche.categories.map(cat => (
                                   <a 
                                     href={\`/niche/\${slugifyNiche(niche.name)}?category=\${encodeURIComponent(cat.name)}\`} 
                                     key={cat.name} 
                                     className="p-3 sm:p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between min-h-[100px]"
                                     onClick={(e) => {
                                        e.preventDefault();
                                        onSelectNiche(niche.name);
                                        // Optional: trigger category select if we had that method, 
                                        // but for now since onSelectNiche is standard, it will switch the niche. 
                                        setShowAllCategories(false);
                                     }}
                                   >
                                      <span className="text-sm font-semibold text-slate-700 block mb-1 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                      {cat.families && cat.families.length > 0 && <span className="text-[10px] sm:text-xs text-slate-400 block line-clamp-2 leading-tight">{cat.families.join(", ")}</span>}
                                   </a>
                                ))}
                             </div>
                         </div>
                      )
                  })}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

content = content.replace(/\s*<\/div>\s*<\/div>\s*\)\;\s*\}\s*$/m, `\n${modalHTML}\n      </div>\n    </div>\n  );\n}`);

fs.writeFileSync(file, content, 'utf8');
