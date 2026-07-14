const fs = require('fs');
const file = 'src/pages/ClientApp/components/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /localOrders\.map\(\(o\) => \{[\s\S]*?return \([\s\S]*?<div[\s\S]*?key=\{o\.id\}[\s\S]*?<\/div>\n                    <\/div>\n                  \);\n                \}\)\n              \)\}\n            <\/ProfileOrdersTab>/;

const newBlock = `localOrders.map((o) => {
                  const statusUpper = o.status
                    ? o.status.toUpperCase()
                    : "CREATED";
                  const payStatus = o.paymentStatus || "requires_action";
                  return (
                    <div
                      key={o.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-6 transition-all hover:shadow-md"
                    >
                      {/* Mobile-Friendly Header */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                            <Package size={20} />
                          </div>
                          <div className="flex flex-col">
                            <h3 className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">
                              {lang === "sw" ? "Oda #" : "Order #"}{formatOrderNumber(o)}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold">
                              {new Date(o.date).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                          <span className={\`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border shadow-xs \${statusUpper === "PAYMENT_HELD" || statusUpper === "PROCESSING" ? "bg-amber-50 text-amber-700 border-amber-200" : statusUpper === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-300" : statusUpper === "DELIVERED" || statusUpper === "BUYER_CONFIRMED" || statusUpper === "RELEASED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : statusUpper === "CANCELLED" || statusUpper === "REFUNDED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200"}\`}>
                            {statusUpper}
                          </span>
                          <div className="text-right">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{lang === "sw" ? "Jumla" : "Total"}</p>
                            <PriceDisplay amount={o.total} size="lg" colorClass="text-slate-900 font-black" />
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-6">
                        {/* Items */}
                        <div className="flex-1 min-w-0 flex flex-col gap-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {lang === "sw" ? "Bidhaa zilizomo" : "Included Items"}
                          </h4>
                          <div className="space-y-2.5">
                            {o.items.map((item) => (
                              <div key={item.productId} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-colors group">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center text-slate-400">
                                    <Package size={16} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 leading-snug truncate">{item.name}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">{lang === "sw" ? "Idadi:" : "Qty:"} {item.quantity}</p>
                                  </div>
                                </div>
                                {[ "DELIVERED", "BUYER_CONFIRMED", "RELEASED", "ARCHIVED" ].includes(statusUpper) && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onWriteReview?.(item.productId, item.name); }}
                                    className="px-3.5 py-2 bg-amber-50 border border-amber-200/50 hover:bg-amber-100 text-amber-700 rounded-xl text-[10px] font-extrabold transition-all shrink-0 active:scale-95 z-10"
                                  >
                                    {lang === "sw" ? "Andika Uhakiki" : "Write Review"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Payment Reference UI */}
                          {o.paymentReference && o.status !== "cancelled" && (
                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === "sw" ? "Kumbukumbu ya Malipo:" : "Payment Ref:"}</span>
                                <span className="text-sm font-mono font-black text-slate-800">{o.paymentReference}</span>
                              </div>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm(lang === "sw" ? "Je, unataka kuweka upya uhakiki wa malipo?" : "Do you want to reset the payment verification?")) {
                                    try {
                                      await db.saveOrder({ id: o.id, paymentReference: "" });
                                      const proofs = JSON.parse(localStorage.getItem("orbi_payment_proofs") || "{}");
                                      delete proofs[o.id];
                                      localStorage.setItem("orbi_payment_proofs", JSON.stringify(proofs));
                                      if (onRefresh) onRefresh();
                                    } catch (err) {}
                                  }
                                }}
                                className="px-4 py-2 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-[11px] font-extrabold transition-all active:scale-95"
                              >
                                {lang === "sw" ? "Badilisha/Reset" : "Reset Reference"}
                              </button>
                            </div>
                          )}

                          {!o.paymentReference && o.status !== "cancelled" && (
                            <div className="mt-4 w-full bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 sm:p-5 shadow-sm">
                              <p className="text-xs text-amber-800 font-extrabold flex items-center gap-2 mb-2 uppercase tracking-wide">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                {lang === "sw" ? "Thibitisha Malipo ya Simu" : "Confirm Mobile Payment"}
                              </p>
                              <p className="text-[11px] text-amber-700/80 mb-3 font-medium">
                                {lang === "sw" ? "Ingiza msimbo wa muamala wa M-Pesa au Tigo Pesa." : "Enter your mobile money transaction code."}
                              </p>
                              <div className="flex flex-col gap-2 relative z-10">
                                <input
                                  type="text"
                                  placeholder={lang === "sw" ? "Msimbo (Mf. PK812...)" : "Ref (e.g. PK812...)"}
                                  className="w-full min-h-[48px] bg-white border border-amber-200 text-slate-900 px-4 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder:normal-case placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 shadow-xs pointer-events-auto"
                                  onKeyDown={async (e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter") {
                                      const val = (e.target).value.trim();
                                      if (!val) return;
                                      try {
                                        await db.saveOrder({ id: o.id, paymentReference: val.toUpperCase() });
                                        showAlert(lang === "sw" ? "Imewasilishwa kikamilifu" : "Submitted successfully", "success");
                                        if (onRefresh) onRefresh();
                                      } catch (err) {
                                        showAlert("Error: " + err.message, "error");
                                      }
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="text-[9px] text-amber-600/80 font-bold uppercase tracking-wider text-left pl-1">
                                  {lang === "sw" ? "Bonyeza Enter Kuhifadhi" : "Press Enter to Save"}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tracker & Actions */}
                        <div className="lg:w-72 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 shrink-0 relative z-10">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={14} /> {lang === "sw" ? "Mwelekeo wa Oda" : "Order Tracking"}
                          </h4>
                          
                          <div className="flex flex-col gap-3 py-2">
                            {[
                              { step: "CREATED", labelEn: "Order Placed", labelSw: "Oda Imewekwa", active: true },
                              { step: "PROCESSING", labelEn: "Processing", labelSw: "Inaandaliwa", active: ["PAYMENT_HELD", "PROCESSING", "SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED"].includes(statusUpper) },
                              { step: "SHIPPED", labelEn: "Shipped", labelSw: "Iko Njiani", active: ["SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED"].includes(statusUpper) },
                              { step: "DELIVERED", labelEn: "Delivered", labelSw: "Imefika Mkononi", active: ["DELIVERED", "BUYER_CONFIRMED", "RELEASED"].includes(statusUpper) }
                            ].map((s, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className={\`w-5 h-5 rounded-full flex items-center justify-center shrink-0 \${s.active ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-300"}\`}>
                                   {s.active ? <Check size={12} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                </div>
                                <span className={\`text-xs font-bold \${s.active ? "text-slate-800" : "text-slate-400"}\`}>{lang === "sw" ? s.labelSw : s.labelEn}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackOrderId(o.id);
                                setTab("track");
                                handleTrackSearch(o.id);
                              }}
                              className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider pointer-events-auto"
                            >
                              <MapPin size={16} />
                              {lang === "sw" ? "Ramani na Ufuatiliaji" : "Live Map Tracking"}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onViewInvoice(o); }}
                              className="w-full min-h-[44px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                            >
                              <Package size={16} />
                              {lang === "sw" ? "Angalia Ankara (Invoice)" : "View Order Invoice"}
                            </button>
                            
                            {["DELIVERED", "SHIPPED"].includes(statusUpper) && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const confirmChoice = await showConfirm(
                                    lang === "sw"
                                      ? "Je, unathibitisha kupokea mzigo?"
                                      : "Confirm receipt of delivery?",
                                    lang === "sw" ? "Thibitisha" : "Confirm"
                                  );
                                  if (confirmChoice) {
                                    try {
                                      await db.saveOrder({ ...o, status: "BUYER_CONFIRMED" });
                                      setLocalOrders((prev) => prev.map(po => po.id === o.id ? { ...po, status: "BUYER_CONFIRMED" } : po));
                                    } catch (err) {}
                                  }
                                }}
                                className="w-full min-h-[44px] mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-[11px] font-black transition-all shadow-emerald-500/20 shadow-lg active:scale-95 flex items-center justify-center gap-2 animate-pulse cursor-pointer uppercase tracking-wider pointer-events-auto"
                              >
                                <Check size={18} className="stroke-[3]" />
                                {lang === "sw" ? "Thibitisha Mzigo" : "Confirm Delivery"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ProfileOrdersTab>`;

if (regex.test(content)) {
    content = content.replace(regex, newBlock);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully replaced order card rendering");
} else {
    console.log("Regex did not match");
}
