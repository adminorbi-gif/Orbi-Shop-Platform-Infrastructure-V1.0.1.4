const fs = require('fs');
const file = 'src/components/client/NicheHub.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the button
content = content.replace(/<button onClick=\{\(\) => setShowAllCategories\(true\)\}.*?<\/button>/s, '');

// Simplify the header back
content = content.replace(/<div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1\.5">\s*<h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">\s*\{lang === "sw" \? "Ungependa Kununua nini Leo Kutoka Kwetu\?" : "What would you like to buy from us today\?"\}\s*<\/h2>\s*<\/div>/s, `<h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-1.5">\n              {lang === "sw" ? "Ungependa Kununua nini Leo Kutoka Kwetu?" : "What would you like to buy from us today?"}\n            </h2>`);

// Remove the modal
content = content.replace(/<AnimatePresence>\s*\{showAllCategories && \(.*?\)\}\s*<\/AnimatePresence>/s, '');

fs.writeFileSync(file, content, 'utf8');
