const fs = require('fs');
const file = 'src/pages/ClientApp/components/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '                  return (\n                    <div\n                      key={o.id}';
const endStr = '                      </div>\n                    </div>\n                  );\n                })\n              )}\n            </ProfileOrdersTab>';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCard = `                  return (
                    <div
                      key={o.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-[0_2px_12px_rgb(0,0,0,0.03)] overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 flex flex-col mb-6"
                    >
                      {/* Header */}
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight flex items-center gap-1.5">
                              <Package size={18} className="text-slate-400" />
                              {lang === "sw" ? "Oda #" : "Order #"}{formatOrderNumber(o)}
                            </h3>
                            <span className={\`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs \${statusUpper === "PAYMENT_HELD" || statusUpper === "PROCESSING" ? "bg-amber-50 text-amber-700 border-amber-200" : statusUpper === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-300" : statusUpper === "DELIVERED" || statusUpper === "BUYER_CONFIRMED" || statusUpper === "RELEASED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : statusUpper === "CANCELLED" || statusUpper === "REFUNDED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200"}\`}>
                              {statusUpper}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold pl-6">
                            {new Date(o.date).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <div className="text-left sm:text-right pl-6 sm:pl-0">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{lang === "sw" ? "Jumla ya Malipo" : "Total Amount"}</p>
                          <PriceDisplay amount={o.total} size="lg" colorClass="text-slate-900 font-black" />
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Items List */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            {lang === "sw" ? "Bidhaa zilizomo" : "Included Items"}
                          </h4>
                          <div className="space-y-3">
                            {o.items.map((item) => (
                              <div key={item.productId} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center text-slate-400">
                                    <Package size={16} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 leading-snug truncate pr-2">{item.name}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">{lang === "sw" ? "Idadi:" : "Qty:"} {item.quantity}</p>
                                  </div>
                                </div>
                                {[ "DELIVERED", "BUYER_CONFIRMED", "RELEASED", "ARCHIVED" ].includes(statusUpper) && (
                                  <button
                                    onClick={() => onWriteReview?.(item.productId, item.name)}
                                    className="px-3 py-1.5 bg-amber-50 border border-amber-200/50 hover:bg-amber-100 text-amber-700 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                                  >
                                    {lang === "sw" ? "Andika Uhakiki" : "Write Review"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Payment Reference Reset */}
                          {o.paymentReference && o.status !== "cancelled" && (
                            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === "sw" ? "Kumbukumbu ya Malipo:" : "Payment Ref:"}</span>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold border border-slate-200/60 shadow-xs">{o.paymentReference}</span>
                              </div>
                              <button
                                onClick={async () => {
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
                                className="text-[10px] text-rose-500 hover:text-rose-600 font-extrabold hover:underline transition-all cursor-pointer"
                              >
                                {lang === "sw" ? "Badilisha/Reset" : "Reset Reference"}
                              </button>
                            </div>
                          )}

                          {/* Missing Payment Reference */}
                          {!o.paymentReference && o.status !== "cancelled" && (
                              <div className="mt-5 w-full bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 shadow-sm">
                                <p className="text-xs text-amber-800 font-extrabold flex items-center gap-1.5 mb-1 uppercase tracking-wide">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                  {lang === "sw" ? "Thibitisha Malipo ya Simu" : "Confirm Mobile Payment"}
                                </p>
                                <p className="text-[11px] text-amber-700/80 mb-3 font-medium">
                                  {lang === "sw" ? "Ingiza msimbo wa muamala wa M-Pesa au Tigo Pesa." : "Enter your mobile money transaction code."}
                                </p>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder={lang === "sw" ? "Msimbo (Mf. PK812...)" : "Ref (e.g. PK812...)"}
                                    className="flex-1 min-h-[44px] bg-white border border-amber-200 text-slate-900 px-4 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder:normal-case placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 shadow-xs"
                                    onKeyDown={async (e) => {
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
                                  />
                                  <div className="text-[9px] text-amber-600/70 font-bold uppercase tracking-wider text-center sm:text-left sm:w-20">
                                    {lang === "sw" ? "Bonyeza Enter Kuhifadhi" : "Press Enter to Save"}
                                  </div>
                                </div>
                              </div>
                          )}
                        </div>

                        {/* Status Tracker & Actions */}
                        <div className="lg:w-64 xl:w-72 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 shrink-0">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Clock size={14} /> {lang === "sw" ? "Mwelekeo wa Oda" : "Order Tracking"}
                          </h4>
                          
                          {/* Vertical Timeline */}
                          <div className="relative pl-3.5 space-y-5 my-2 flex-1">
                            <div className="absolute left-[19px] top-3 bottom-4 w-0.5 bg-slate-100 rounded-full"></div>
                            
                            {[
                              { step: "CREATED", labelEn: "Order Placed", labelSw: "Oda Imewekwa", active: true },
                              { step: "PROCESSING", labelEn: "Processing", labelSw: "Inaandaliwa", active: ["PAYMENT_HELD", "PROCESSING", "SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED"].includes(statusUpper) },
                              { step: "SHIPPED", labelEn: "Shipped", labelSw: "Iko Njiani", active: ["SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED"].includes(statusUpper) },
                              { step: "DELIVERED", labelEn: "Delivered", labelSw: "Imefika Mkononi", active: ["DELIVERED", "BUYER_CONFIRMED", "RELEASED"].includes(statusUpper) }
                            ].map((s, i) => (
                              <div key={i} className="relative flex items-center gap-4">
                                <div className={\`w-3.5 h-3.5 rounded-full border-[3px] bg-white z-10 \${s.active ? "border-indigo-500 shadow-sm shadow-indigo-200" : "border-slate-200"}\`}></div>
                                <span className={\`text-xs font-extrabold \${s.active ? "text-slate-800" : "text-slate-400"}\`}>{lang === "sw" ? s.labelSw : s.labelEn}</span>
                              </div>
                            ))}
                          </div>

                          {/* Escrow Trust Badge */}
                          <div className="mt-2 mb-3 bg-emerald-50/50 rounded-xl p-2.5 flex gap-2 items-start border border-emerald-100/50">
                             <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                             <p className="text-[9px] text-emerald-800 font-medium leading-tight">
                               {lang === "sw" 
                                 ? "Fedha zako zimehifadhiwa salama kwenye Escrow mpaka uthibitishe mzigo."
                                 : "Funds held safely in Escrow until delivery is confirmed."}
                             </p>
                          </div>

                          <div className="flex flex-col gap-2.5 mt-auto">
                            <button
                              onClick={() => {
                                setTrackOrderId(o.id);
                                setTab("track");
                                handleTrackSearch(o.id);
                              }}
                              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                            >
                              <MapPin size={14} />
                              {lang === "sw" ? "Ramani na Ufuatiliaji" : "Live Map Tracking"}
                            </button>

                            <button
                              onClick={() => onViewInvoice(o)}
                              className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Package size={14} />
                              {lang === "sw" ? "Angalia Ankara (Invoice)" : "View Order Invoice"}
                            </button>
                            
                            {["DELIVERED", "SHIPPED"].includes(statusUpper) && (
                                <button
                                  onClick={async () => {
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
                                  className="w-full h-11 mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-[11px] font-black transition-all shadow-emerald-500/20 shadow-lg active:scale-95 flex items-center justify-center gap-2 animate-pulse cursor-pointer uppercase tracking-wider"
                                >
                                  <Check size={16} className="stroke-[3]" />
                                  {lang === "sw" ? "Thibitisha Mzigo Wangu" : "Confirm Delivery Received"}
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

  const newContent = content.slice(0, startIndex) + newCard + content.slice(endIndex + endStr.length);
  fs.writeFileSync(file, newContent, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to find start or end strings.");
}
