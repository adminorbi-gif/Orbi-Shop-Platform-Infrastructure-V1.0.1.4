const fs = require('fs');
let content = fs.readFileSync('src/pages/SellerApp/index.tsx', 'utf8');

const oldStockHTML = `                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {lang === "sw" ? "Stoki / Akiba" : "Stock Quantity"}
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                  </div>`;

const newStockHTML = `                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {lang === "sw" ? "Stoki / Akiba" : "Stock Quantity"}
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {lang === "sw" ? "Inauzwa kwa" : "Sold by"}
                      </label>
                      <select
                        value={prodSoldBy}
                        onChange={(e) => setProdSoldBy(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition"
                      >
                        <option value="Piece">{lang === "sw" ? "Kipande (Piece)" : "Piece"}</option>
                        <option value="Pair">{lang === "sw" ? "Jozi (Pair)" : "Pair"}</option>
                        <option value="Bundle">{lang === "sw" ? "Kifurushi (Bundle)" : "Bundle"}</option>
                        <option value="Box">{lang === "sw" ? "Boksi (Box)" : "Box"}</option>
                        <option value="Carton">{lang === "sw" ? "Katoni (Carton)" : "Carton"}</option>
                        <option value="Set">{lang === "sw" ? "Seti (Set)" : "Set"}</option>
                        <option value="Dozen">{lang === "sw" ? "Dazeni (Dozen)" : "Dozen"}</option>
                        <option value="Roll">{lang === "sw" ? "Roli (Roll)" : "Roll"}</option>
                        <option value="Meter">{lang === "sw" ? "Mita (Meter)" : "Meter"}</option>
                        <option value="Kg">{lang === "sw" ? "Kilo (Kg)" : "Kg"}</option>
                        <option value="Ltr">{lang === "sw" ? "Lita (Ltr)" : "Ltr"}</option>
                      </select>
                    </div>
                  </div>`;

if (content.includes(oldStockHTML)) {
  content = content.replace(oldStockHTML, newStockHTML);
  fs.writeFileSync('src/pages/SellerApp/index.tsx', content);
  console.log("Patched successfully");
} else {
  console.log("Did not find target stock HTML block");
}
