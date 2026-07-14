const fs = require('fs');
const code = fs.readFileSync('src/pages/SellerApp/index.tsx', 'utf-8');
const replacement = `<select
                        value={prodSoldBy}
                        onChange={(e) => setProdSoldBy(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition"
                      >
                        <option value="" disabled>{lang === "sw" ? "Chagua kipimo..." : "Select unit..."}</option>
                        <option value="Piece">{lang === "sw" ? "Kipande (Piece)" : "Piece"}</option>`;
const target = `<select
                        value={prodSoldBy}
                        onChange={(e) => setProdSoldBy(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition"
                      >
                        <option value="Piece">{lang === "sw" ? "Kipande (Piece)" : "Piece"}</option>`;
if (code.includes(target)) {
  fs.writeFileSync('src/pages/SellerApp/index.tsx', code.replace(target, replacement));
  console.log("Patched UI successfully");
} else {
  console.log("UI Target not found");
}
