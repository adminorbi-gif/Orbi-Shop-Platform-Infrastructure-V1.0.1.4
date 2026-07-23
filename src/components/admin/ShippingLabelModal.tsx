import React from "react";
import { X, Printer, Share2, CheckCircle2, Package, Truck, ShieldCheck, MapPin, Phone, User, Building2, Barcode as BarcodeIcon, QrCode, AlertCircle } from "lucide-react";
import { Order } from "../../types";
import { formatCurrency } from "../../lib/storage";

interface ShippingLabelModalProps {
  order: Order | null;
  onClose: () => void;
  lang?: string;
  onMarkShipped?: (orderId: string) => void;
}

export function ShippingLabelModal({ order, onClose, lang = "sw", onMarkShipped }: ShippingLabelModalProps) {
  if (!order) return null;

  const orderNum = order.id.slice(-8).toUpperCase();
  const customerName = order.customerDetails?.name || "Mteja wa Orbi";
  const customerPhone = order.customerDetails?.phone || "Hakuna Namba";
  const customerAddress = order.customerDetails?.address || order.shippingDetails?.address || "Anwani ya Utoaji Haikutajwa";
  const destinationZone = order.shippingDetails?.zoneName || "Dar es Salaam Central";

  // Determine seller / hub info
  const firstItem = order.items?.[0];
  const sellerName = firstItem?.soldBy || order.sellerName || "Muuzaji Aliyethibitishwa wa Orbi";
  
  // Hub detection based on address or zone
  let hubName = "Orbi Central Logistics Hub";
  const lowerAddr = String(customerAddress).toLowerCase();
  if (lowerAddr.includes("kariakoo")) hubName = "Kariakoo Orbi Hub - Dock #4";
  else if (lowerAddr.includes("mbezi")) hubName = "Mbezi Terminal Hub";
  else if (lowerAddr.includes("posta")) hubName = "Posta Plaza Hub";
  else if (lowerAddr.includes("arusha")) hubName = "Arusha Clocktower Hub";
  else if (lowerAddr.includes("mwanza")) hubName = "Mwanza Capri Point Hub";
  else if (lowerAddr.includes("dodoma")) hubName = "Dodoma Capital Hub";

  const isMultiSeller = (order.items || []).length > 1;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWaybill = () => {
    const waybillText = `ORBI SHIPPING WAYBILL #${orderNum}\nMteja: ${customerName} (${customerPhone})\nAnwani: ${customerAddress}\nEneo la Hub: ${hubName}\nIdadi ya Bidhaa: ${order.items?.length || 1}`;
    navigator.clipboard.writeText(waybillText);
    alert(lang === "sw" ? "Taarifa za Waybill zimenakiliwa!" : "Waybill details copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto flex items-center justify-center print:p-0 print:bg-white print:static print:block">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #orbi-shipping-label-printable, #orbi-shipping-label-printable * {
            visibility: visible;
          }
          #orbi-shipping-label-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 16px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-8 print:my-0 print:max-w-full print:rounded-none print:shadow-none print:border-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              {lang === "sw" ? "Label ya Mzigo na Waybill" : "Shipping Label & Waybill"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWaybill}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={14} />
              {lang === "sw" ? "Nakili Waybill" : "Copy Waybill"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              {lang === "sw" ? "Chapa Label (Print)" : "Print Label"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PRINTABLE LABEL CONTAINER */}
        <div id="orbi-shipping-label-printable" className="p-6 bg-white text-slate-900 font-sans space-y-4">
          
          {/* Label Header with Barcode */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-lg">
                  O
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tighter text-slate-950 uppercase leading-none">
                    ORBI EXPRESS LOGISTICS
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Official Shipping & Hub Waybill
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-950 text-white font-mono text-[11px] font-black rounded uppercase">
                  WAYBILL #{orderNum}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-black text-[10px] rounded uppercase border border-blue-200">
                  {isMultiSeller ? "ORBI HUB CONSOLIDATED" : "DIRECT MERCHANT EXPRESS"}
                </span>
              </div>
            </div>

            {/* Barcode / QR Code Graphic */}
            <div className="flex flex-col items-end">
              <div className="p-2 bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <BarcodeIcon size={42} className="text-slate-950 stroke-[1.5]" />
                  <span className="text-[9px] font-mono font-bold tracking-widest text-slate-700 mt-0.5">
                    *ORBI-{orderNum}*
                  </span>
                </div>
                <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center p-1">
                  <QrCode size={36} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* SHIP FROM vs SHIP TO GRID */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* SHIP FROM (SELLER / HUB ORIGIN) */}
            <div className="border-2 border-slate-800 rounded-2xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Building2 size={12} className="text-slate-700" />
                  SHIP FROM (MUUZAJI / HUB)
                </span>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  VERIFIED MERCHANT
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-950 truncate">{sellerName}</p>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <MapPin size={12} className="text-slate-500 shrink-0" />
                  <span className="truncate">{hubName}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  Hub ID: ORBI-HUB-{hubName.slice(0, 3).toUpperCase()}-01
                </p>
              </div>
            </div>

            {/* SHIP TO (CUSTOMER DESTINATION) */}
            <div className="border-2 border-slate-900 bg-blue-50/40 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1">
                  <User size={12} className="text-blue-700" />
                  SHIP TO (MTEJA / ANWANI)
                </span>
                <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  DESTINATION
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-950 uppercase">{customerName}</p>
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
                  <Phone size={13} className="text-blue-700 shrink-0" />
                  <span>{customerPhone}</span>
                </div>
                <div className="flex items-start gap-1 text-[11px] font-bold text-slate-800 leading-tight pt-0.5">
                  <MapPin size={12} className="text-slate-600 shrink-0 mt-0.5" />
                  <span>{customerAddress} ({destinationZone})</span>
                </div>
              </div>
            </div>

          </div>

          {/* HUB CONSOLIDATION NOTICE BANNER */}
          {isMultiSeller && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3">
              <Truck size={20} className="text-amber-700 shrink-0" />
              <div className="text-[10px] text-amber-950 leading-tight font-medium">
                <strong className="font-black text-amber-900 block uppercase">
                  TAARIFA YA UFUNGASHAJI WA PAMOJA (ORBI CONSOLIDATED HUB):
                </strong>
                Mzigo huu umeunganishwa kutoka kwa wauzaji tofauti. Mhudumu wa Hub atakagua bidhaa zote kabla ya kumkabidhi Rider kwa usafirishaji wa kifurushi 1.
              </div>
            </div>
          )}

          {/* PACKAGE & ITEMS TABLE */}
          <div className="border-2 border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Package size={13} className="text-blue-400" />
                ORODHA YA BIDHAA NA UHAKIKI WA HUFF (ITEMS CHECKLIST)
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-300">
                Jumla: {formatCurrency(order.total)}
              </span>
            </div>
            
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase text-slate-600">
                <tr>
                  <th className="p-2.5 w-10 text-center">✓</th>
                  <th className="p-2.5">Bidhaa (Product Description)</th>
                  <th className="p-2.5 text-center w-16">Idadi</th>
                  <th className="p-2.5 text-right w-24">Bei</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="font-medium">
                    <td className="p-2.5 text-center">
                      <div className="w-4 h-4 border-2 border-slate-400 rounded m-auto" />
                    </td>
                    <td className="p-2.5">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      {item.soldBy && (
                        <p className="text-[9px] text-slate-500 font-mono">Muuzaji: {item.soldBy}</p>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-black text-slate-900">
                      x{item.quantity}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ESCROW & VERIFICATION FOOTER */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            
            <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 flex items-center gap-2.5">
              <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-slate-900 uppercase">ORBI PAY ESCROW PROTECTED</p>
                <p className="text-[9px] font-medium text-slate-600 leading-tight">
                  Malipo yamelindwa na mfumo wa Orbi Pay. Muuzaji atalipwa mara mteja anapothibitisha kupokea.
                </p>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 flex flex-col justify-center items-center text-center">
              <span className="text-[9px] font-black uppercase text-slate-500">SIGNATURE / STAMP YA RIDER</span>
              <div className="h-6 w-full border-b border-dashed border-slate-400 mt-1" />
              <span className="text-[8px] text-slate-400 font-mono mt-0.5">Tarehe: {new Date(order.date || Date.now()).toLocaleDateString("sw-TZ")}</span>
            </div>

          </div>

        </div>

        {/* BOTTOM QUICK ACTION BAR (Hidden on print) */}
        {onMarkShipped && order.status !== "SHIPPED" && order.status !== "DELIVERED" && (
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between no-print">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <AlertCircle size={15} className="text-amber-600" />
              <span>
                {lang === "sw" ? "Je, tayari umefungasha na kumpa Rider mzigo huu?" : "Ready to ship this package with courier?"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onMarkShipped(order.id);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              {lang === "sw" ? "Weka Hali: Mzigo Njiani (Ship)" : "Mark as Shipped"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
