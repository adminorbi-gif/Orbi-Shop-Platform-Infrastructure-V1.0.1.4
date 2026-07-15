const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{/* Global Categories Side Button */}
        <div className="fixed top-1/2 -translate-y-1/2 right-2 sm:right-4 z-[90]">
           <button 
             onClick={() => setShowAllCategories(true)}
             className="flex items-center justify-center bg-black/10 backdrop-blur-md text-slate-700 hover:bg-black/20 hover:text-slate-900 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
             title={lang === "sw" ? "Kategoria Zote" : "All Categories"}
           >
             <LayoutGrid size={22} />
           </button>
        </div>`;

const replace = `{/* Global Categories Side Button */}
        <div className="fixed top-1/2 -translate-y-1/2 right-0 z-[90]">
           <button 
             onClick={() => setShowAllCategories(true)}
             className="flex items-center justify-center bg-black/10 backdrop-blur-sm text-slate-700 hover:bg-black/20 hover:text-slate-900 py-6 px-1 rounded-l-lg border border-white/20 border-r-0 transition-all active:scale-95"
             title={lang === "sw" ? "Kategoria Zote" : "All Categories"}
           >
             <ChevronLeft size={24} strokeWidth={2.5} />
           </button>
        </div>`;

content = content.replace(target, replace);
fs.writeFileSync(file, content, 'utf8');
