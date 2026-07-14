import React from "react";
import { Globe, ExternalLink, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithSkeleton } from "../../../components/ImageWithSkeleton";

export const EcosystemResults = ({
  results,
  isFetching,
  lang,
  searchQuery,
  onSelect
}: {
  results: any[];
  isFetching: boolean;
  lang: string;
  searchQuery: string;
  onSelect: (item: any) => void;
}) => {
  if (!searchQuery.trim() && !isFetching && results.length === 0) return null;

  return (
    <div className="w-full mt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Globe size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {lang === "sw" ? "Mtandao wa Kiulimwengu (Ecosystem)" : "Global Ecosystem Network"}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            {lang === "sw" 
              ? "Matokeo mapana kutoka kwa wabia wetu wa kibiashara."
              : "Extended matches from our certified B2B/B2C partners."}
          </p>
        </div>
      </div>

      {isFetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {results.map((item, idx) => (
              <motion.button
                key={idx}
                onClick={() => onSelect(item)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 relative text-left"
              >
                {/* Image or Placeholder */}
                {item.image ? (
                  <div className="w-full h-32 bg-slate-100 relative overflow-hidden shrink-0 border-b border-slate-100">
                    <ImageWithSkeleton
                      src={item.image}
                      alt={item.title}
                      className="group-hover:scale-105 transition duration-500"
                      containerClassName="w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-full h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 flex items-center justify-center">
                    <Activity size={16} className="text-blue-300" />
                  </div>
                )}
                
                <div className="p-4 flex flex-col flex-1 w-full">
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mb-3">
                    {item.snippet}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between w-full">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">
                      Geo: {item.is_available_in_geo || "TZ"}
                    </span>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      ) : searchQuery.trim() ? (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
          <p className="text-sm text-slate-500 font-semibold">
            {lang === "sw" ? "Hakuna matokeo ya ziada yaliyopatikana." : "No extended ecosystem results found."}
          </p>
        </div>
      ) : null}
    </div>
  );
};
