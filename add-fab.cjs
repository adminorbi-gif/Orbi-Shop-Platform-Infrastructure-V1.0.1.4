const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert the FAB at the bottom, just before the Floating Support Chat
const fabHTML = `
        {/* Global Categories FAB */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90]">
           <button 
             onClick={() => setShowAllCategories(true)}
             className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-slate-800 transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
           >
             <LayoutGrid size={18} />
             <span className="font-bold text-sm whitespace-nowrap">{lang === "sw" ? "Kategoria Zote" : "All Categories"}</span>
           </button>
        </div>

        {/* Global Categories Modal */}
        <AnimatePresence>
          {showAllCategories && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[150] bg-slate-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 bg-white border-b border-slate-200 shadow-sm shrink-0 sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                   <button onClick={() => setShowAllCategories(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                     <X size={20} />
                   </button>
                   <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{lang === "sw" ? "Duka Zote & Kategoria" : "All Stores & Categories"}</h2>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
                 <div className="max-w-7xl mx-auto space-y-10 pb-24">
                    {niches.filter(n => n.name !== "Zote" && n.name !== "All").map(niche => {
                        const IconComponent = (LucideIcons as any)[niche.icon] || LucideIcons.ShoppingBag;
                        return (
                           <div key={niche.name} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100/80">
                                   <div className="flex items-center gap-4">
                                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                                           <IconComponent size={28} />
                                       </div>
                                       <div>
                                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{niche.name}</h3>
                                          <p className="text-sm text-slate-500 font-medium mt-1">{niche.categories.length} {lang === "sw" ? "kategoria" : "categories"}</p>
                                       </div>
                                   </div>
                                   <button 
                                      onClick={() => {
                                         setShowAllCategories(false);
                                         setSelectedNiche(niche.name);
                                         setSelectedCategory("Zote");
                                         setSelectedFamily(null);
                                         setSearch("");
                                         window.scrollTo({ top: 0, behavior: "smooth" });
                                      }}
                                      className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors text-center"
                                   >
                                      {lang === "sw" ? "Fungua Duka Hili" : "Visit Store"}
                                   </button>
                               </div>
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                  {niche.categories.map(cat => (
                                     <button 
                                       key={cat.name} 
                                       className="p-4 bg-slate-50/50 rounded-2xl hover:bg-blue-50 hover:shadow-md transition-all group flex flex-col justify-start items-start text-left min-h-[110px] border border-transparent hover:border-blue-100"
                                       onClick={() => {
                                          setShowAllCategories(false);
                                          setSelectedNiche(niche.name);
                                          setSelectedCategory(cat.name);
                                          setSelectedFamily(null);
                                          setSearch("");
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                       }}
                                     >
                                        <span className="text-sm sm:text-base font-bold text-slate-800 block mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2">{cat.name}</span>
                                        {cat.families && cat.families.length > 0 && <span className="text-xs text-slate-400 block line-clamp-2 font-medium leading-relaxed">{cat.families.join(" • ")}</span>}
                                     </button>
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

content = content.replace('{/* Floating Support Chat (Internal) */}', fabHTML + '\n        {/* Floating Support Chat (Internal) */}');

fs.writeFileSync(file, content, 'utf8');
