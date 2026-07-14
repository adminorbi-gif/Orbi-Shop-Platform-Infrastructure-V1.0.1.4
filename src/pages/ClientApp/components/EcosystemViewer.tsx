import React from "react";
import { ArrowLeft, ShieldAlert, ExternalLink, Globe } from "lucide-react";

export const EcosystemViewer = ({
  item,
  onClose,
  lang,
}: {
  item: any;
  onClose: () => void;
  lang: string;
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition font-bold text-sm"
        >
          <ArrowLeft size={18} />
          {lang === "sw" ? "Rudi Orbi Shop" : "Back to Orbi Shop"}
        </button>
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-rose-100">
          <ShieldAlert size={14} />
          <span>{lang === "sw" ? "Mbia wa Nje" : "Third-Party Seller"}</span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <Globe size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-amber-900 mb-1">
              {lang === "sw" 
                ? "Unaelekea kwenye mtandao wa muuzaji wa nje." 
                : "You are viewing an external seller's website."}
            </h3>
            <p className="text-xs text-amber-700">
              {lang === "sw"
                ? "Bidhaa hizi hazilindwi na mfumo wa malipo wa Orbi Shop (Orbi Protection). Tafadhali kuwa mwangalifu unapofanya miamala na wauzaji wa nje."
                : "These products are NOT protected by Orbi Shop's payment protection system. Please exercise caution when transacting with external merchants."}
            </p>
          </div>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            <span>{lang === "sw" ? "Fungua Kwenye Kichupo Kipya" : "Open in New Tab"}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Embedded Content */}
      <div className="flex-1 bg-slate-100 relative">
        <iframe
          src={item.link}
          title={item.title}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
