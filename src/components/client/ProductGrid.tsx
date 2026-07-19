import { slugify } from "../../lib/slugify";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Package, ArrowUpDown, Zap, ShoppingCart, Truck, MessageSquare } from "lucide-react";
import { PriceDisplay } from "../PriceDisplay";
import { db } from "../../lib/db";
import { DEFAULT_DELIVERY_ZONES, formatDeliveryDays, getDeliveryZoneName, normalizeDeliveryZones } from "../../lib/deliveryZones";
import type { DeliveryZone } from "../../types";
import { motion } from "motion/react";
import { formatCurrency } from "../../lib/storage";

import { ImageWithSkeleton } from "../../components/ImageWithSkeleton";
import MouseTrackZoom from "../MouseTrackZoom";

interface ProductGridProps {
  products: any[];
  lang: string;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  sortOrder: "default" | "asc" | "desc" | "newest" | "popular";
  setSortOrder: (v: any) => void;
  handleProductSelect: (p: any) => void;
  t: (k: string) => string;
  onOpenAIChat?: (initialMsg?: string) => void;
}

export function ProductGrid({
  products,
  lang,
  selectedCategory,
  setSelectedCategory,
  sortOrder,
  setSortOrder,
  handleProductSelect,
  t,
  onOpenAIChat
}: ProductGridProps) {
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
  const primaryDeliveryZone = useMemo(() => normalizeDeliveryZones(deliveryZones)[0], [deliveryZones]);
  const lastVibeRef = useRef<number>(0);
  const triggerHaptic = () => {
    const now = Date.now();
    if (now - lastVibeRef.current < 250) return;
    lastVibeRef.current = now;
    if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
      try {
        window.navigator.vibrate(15);
      } catch (e) {}
    }
  };

  useEffect(() => {
    let active = true;
    db.getDeliveryZones()
      .then((zones) => {
        if (active) setDeliveryZones(normalizeDeliveryZones(zones));
      })
      .catch(() => {
        if (active) setDeliveryZones(DEFAULT_DELIVERY_ZONES);
      });
    return () => {
      active = false;
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-gradient-to-br from-indigo-50/40 to-slate-50/40 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto my-6 animate-in fade-in zoom-in-95">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-lg font-black shadow-md border-2 border-white">
            OB
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
        </div>

        <h3 className="text-base font-black text-slate-900 mb-2">
          {lang === "sw"
            ? "Je, unatafuta bidhaa maalum ya kundi hili?"
            : "Looking for a specific item in this category?"}
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          {lang === "sw"
            ? `Habari! Mimi ni msaidizi wako wa kibinafsi wa Orbi. Ingawa kwa sasa hatuna bidhaa za kundi hili linalolingana na vigezo vyako, nipo hapa kwa ajili yako. Unaweza kuongea nami moja kwa moja hapa kwenye Chat ili nikutafutie kwa urahisi!`
            : `Hello! I am your personal Orbi concierge. Although we don't currently have products matching your criteria in this category, I'm here to serve you. Chat with me directly and let me help you source exactly what you need!`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onOpenAIChat && (
            <button
              onClick={() => {
                const msg = lang === "sw"
                  ? `Halo! Natafuta bidhaa maalum katika kundi hili lakini sioni hapa. Je, unaweza kunisaidia kupata chaguzi sahihi?`
                  : `Hello! I am looking for a specific item in this category but cannot find it listed here. Can you help me source what I need?`;
                onOpenAIChat(msg);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} />
              {lang === "sw" ? "Niambie, nitakusaidia" : "Tell me I will help"}
            </button>
          )}
          <button
            onClick={() => {
              setSelectedCategory("Zote");
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-xs"
          >
            {lang === "sw" ? "Onyesha Zote" : "Show All Products"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="products-grid">
      {/* Grid Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Zap size={18} className="text-[#ff4c00]" />
            {selectedCategory === "Zote" ? (lang === "sw" ? "Bidhaa Zote" : "All Products") : selectedCategory}
          </h3>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200">
            {products.length} {lang === "sw" ? "Bidhaa" : "Items"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <ArrowUpDown size={12} />
            Sort By
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
          >
            <option value="default">{lang === "sw" ? "Chaguo-msingi" : "Default"}</option>
            <option value="newest">{lang === "sw" ? "Mpya Zaidi" : "Newest First"}</option>
            <option value="popular">{lang === "sw" ? "Maarufu" : "Most Popular"}</option>
            <option value="asc">{lang === "sw" ? "Bei: Chini kwenda Juu" : "Price: Low to High"}</option>
            <option value="desc">{lang === "sw" ? "Bei: Juu kwenda Chini" : "Price: High to Low"}</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="orbi-product-list-grid">
        {products.map((p) => {
          const nicheSlug = slugify(p.niche || 'general');
          const categoryPath = (p.category || '')
            .split('::')
            .map((part: string) => slugify(part))
            .filter(Boolean)
            .join('/');
          const productSlug = slugify(p.name);
          const fullCategoryPath = categoryPath ? `${nicheSlug}/${categoryPath}` : nicheSlug;
          const productUrl = `/shop/${fullCategoryPath}/${productSlug}--${p.id}`;

          return (
          <motion.a
            href={productUrl}
            key={p.id}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              triggerHaptic();
              handleProductSelect(p);
            }}
            onTouchStart={() => {
              triggerHaptic();
            }}
            className="orbi-market-product-card group flex cursor-pointer flex-col overflow-hidden text-left"
          >
            {/* Image Container */}
            <div className="orbi-product-image-stage relative aspect-[1/1] overflow-hidden">
              <MouseTrackZoom className="w-full h-full">
                <ImageWithSkeleton
                  src={p.images?.[0]}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  containerClassName="h-full w-full bg-slate-100"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </MouseTrackZoom>

              {/* Badges */}
              <div className="absolute left-2 top-2 z-20 flex max-w-[72%] flex-wrap gap-1.5">
                {p.stock <= 5 && p.stock > 0 && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                    {lang === "sw" ? "Chache" : "Low stock"}
                  </span>
                )}
                {p.isNew && (
                  <span className="rounded-full bg-slate-950/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                    {lang === "sw" ? "Mpya" : "New arrival"}
                  </span>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-2 p-3 opacity-0 transition-opacity sm:flex sm:group-hover:opacity-100">
                <div className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-lg ring-1 ring-slate-200">
                  {lang === "sw" ? "Tazama" : "Quick view"}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-start gap-1.5 p-3">
              <div className="space-y-2">
                
                <h4 className="orbi-product-title text-[13px] font-bold font-jakarta leading-[1.3] text-slate-800 transition-colors group-hover:text-[#ff4c00] sm:text-[14px] line-clamp-2">
                  {lang === "sw" ? (p.nameSw || p.name) : p.name}
                </h4>
                
                
              </div>

              <div className="space-y-2.5 mt-auto">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <PriceDisplay amount={p.price} size="lg" colorClass="text-[#ff4c00] font-black" className="text-[17px] min-[370px]:text-[19px] sm:text-[22px] md:text-[24px] font-black tracking-tight leading-none whitespace-nowrap" truncate={false} />
                  {p.oldPrice && p.oldPrice > p.price && (
                    <PriceDisplay amount={p.oldPrice} colorClass="text-slate-400/90 line-through font-medium" className="text-[11px] sm:text-xs" truncate={false} />
                  )}
                </div>

                
              </div>
            </div>
          </motion.a>
        )})}
      </div>
    </div>
  );
}
