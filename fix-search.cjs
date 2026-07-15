const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `<div className="flex items-center justify-between p-4 sm:p-6 bg-white border-b border-slate-200 shadow-sm shrink-0 sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                   <button onClick={() => setShowAllCategories(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                     <X size={20} />
                   </button>
                   <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{lang === "sw" ? "Duka Zote & Kategoria" : "All Stores & Categories"}</h2>
                 </div>
              </div>`;

const replace1 = `<div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-6 bg-white border-b border-slate-200 shadow-sm shrink-0 sticky top-0 z-10 gap-4">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                   <button onClick={() => setShowAllCategories(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
                     <X size={20} />
                   </button>
                   <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap">{lang === "sw" ? "Duka Zote & Kategoria" : "All Stores & Categories"}</h2>
                 </div>
                 <div className="w-full md:w-80 relative shrink-0">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search size={18} className="text-slate-400" />
                   </div>
                   <input
                     type="text"
                     value={categorySearchQuery}
                     onChange={(e) => setCategorySearchQuery(e.target.value)}
                     placeholder={lang === "sw" ? "Tafuta kategoria..." : "Search categories..."}
                     className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                   />
                 </div>
              </div>`;

const target2 = `{niches.filter(n => n.name !== "Zote" && n.name !== "All").map(niche => {`;
const replace2 = `{niches.filter(n => n.name !== "Zote" && n.name !== "All").map(niche => {
                        const filteredCategories = niche.categories.filter(cat => 
                           cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                        );
                        if (categorySearchQuery && filteredCategories.length === 0) return null;`;

const target3 = `{niche.categories.map(cat => {`;
const replace3 = `{filteredCategories.map(cat => {`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);
content = content.replace(target3, replace3);

fs.writeFileSync(file, content, 'utf8');
