import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Niche, Product } from '../../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PriceDisplay } from '../PriceDisplay';

interface NicheHubProps {
  niches: Niche[];
  products: Product[];
  lang: string;
  onSelectNiche: (nicheName: string) => void;
  onSelectBundle?: (bundle: any) => void;
  nicheColorMap?: Record<string, { 
    hue: number; 
    textClass: string; 
    bgClass: string; 
    hoverBgClass: string; 
    borderClass: string; 
    gradientClass: string; 
    bannerBgClass: string; 
    css: string; 
  }>;
}

function slugifyNiche(name: string): string {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/ & /g, "-")
    .replace(/ /g, "-")
    .replace(/[^\w-]/g, "");
}

const getStringHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

interface NicheProductPreviewGridProps {
  products: Product[];
  lang: string;
  nicheName: string;
}

export function NicheProductPreviewGrid({ products, lang, nicheName }: NicheProductPreviewGridProps) {
  const nicheProducts = useMemo(() => {
    return products.filter(p => p.niche === nicheName);
  }, [products, nicheName]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when niche changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [nicheProducts]);

  useEffect(() => {
    if (nicheProducts.length <= 1) return;

    // Auto-cycle single slot with a randomized interval to create a natural feeling across different cards
    const intervalId = setInterval(() => {
      setCurrentIndex(current => (current + 1) % nicheProducts.length);
    }, 4500 + Math.random() * 2000); // Ticked at offset intervals between 4.5s and 6.5s

    return () => clearInterval(intervalId);
  }, [nicheProducts]);

  if (nicheProducts.length === 0) {
    return (
      <div className="flex-1 w-full bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 p-6 min-h-[160px]">
        <LucideIcons.PackageOpen size={24} className="mb-2 opacity-40 text-slate-300" />
        <span className="text-xs font-medium text-slate-400">{lang === "sw" ? "Hakuna bidhaa bado" : "No products yet"}</span>
      </div>
    );
  }

  const p = nicheProducts[currentIndex] || nicheProducts[0];

  return (
    <div className="flex-1 w-full relative group/img bg-[#ffffff] overflow-hidden flex flex-col" id="niche-product-preview-root">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`slot-${p.id}`}
          className="absolute inset-0 w-full h-full flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Clean, unobstructed image container */}
          <div className="flex-1 w-full overflow-hidden relative bg-transparent" id="niche-product-image-container">
            <img 
              src={p.images?.[0] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80'} 
              alt={p.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              id={`niche-product-preview-img-${p.id}`}
            />
          </div>
          
          {/* Clean details footer area below the image with no gradient or blur */}
          <div className="bg-[#ffffff] p-3 flex flex-col shrink-0" id="niche-product-details-container">
            <span className="text-xs font-bold line-clamp-1 leading-tight text-slate-700">
              {p.name}
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <PriceDisplay amount={p.price || 0} size="xs" colorClass="text-emerald-600" />
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                {lang === "sw" ? "Gusa duka" : "Enter Center"}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface NicheCardBackgroundCarouselProps {
  products: Product[];
  nicheName: string;
}

export function NicheCardBackgroundCarousel({ products, nicheName }: NicheCardBackgroundCarouselProps) {
  const images = useMemo(() => {
    const nicheProducts = products.filter(p => p.niche === nicheName);
    const collectedImages: string[] = [];
    for (const p of nicheProducts) {
      if (p.images && p.images[0]) {
        collectedImages.push(p.images[0]);
      }
      if (collectedImages.length >= 3) break;
    }
    return collectedImages;
  }, [products, nicheName]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % images.length);
    }, 4500 + Math.random() * 2000); // cycle every 4.5-6.5s offset
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
      <AnimatePresence mode="popLayout">
        {images.map((img, idx) => {
          if (idx !== activeIndex) return null;
          return (
            <motion.div
              key={img}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.14 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 overflow-hidden"
            >
              <motion.img
                src={img}
                alt="niche-bg-cycle"
                referrerPolicy="no-referrer"
                initial={{ scale: 1.05, filter: "blur(6px)" }}
                animate={{ scale: 1.15, filter: "blur(3px)" }}
                transition={{ duration: 8, ease: "linear" }}
                className="w-full h-full object-cover saturate-100 contrast-100 brightness-105"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {/* Absolute gradient overlay over the dynamic image to transition beautifully and keep card background clean */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/94 via-white/90 to-white/94 group-hover:from-white/88 group-hover:via-white/82 group-hover:to-white/88 transition-all duration-300" />
    </div>
  );
}

export function NicheHub({ niches, products, lang, onSelectNiche, onSelectBundle, nicheColorMap }: NicheHubProps) {
  // Filter out Zote/All from niches if it exists
  const displayNiches = niches.filter(n => n.name !== "Zote" && n.name !== "All");

    const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const scrollLeftBtn = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };
  const scrollRightBtn = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  

  // Fallback dynamic styles in case nicheColorMap is not provided
  const dynamicStyles = useMemo(() => {
    return displayNiches.map(niche => {
      const hash = getStringHash(niche.name);
      const hue = hash % 360;
      const textClass = `text-hash-${hash}`;
      const bgClass = `bg-hash-${hash}`;
      const borderClass = `border-hash-${hash}`;
      const css = `
        .${textClass} {
          color: hsl(${hue}, 75%, 40%) !important;
        }
        .group:hover .${textClass} {
          color: hsl(${(hue + 25) % 360}, 85%, 45%) !important;
        }
        .${bgClass} {
          background-color: hsl(${hue}, 90%, 97%) !important;
          color: hsl(${hue}, 75%, 40%) !important;
        }
        .group:hover .${bgClass} {
          background-color: hsl(${hue}, 90%, 93%) !important;
          color: hsl(${(hue + 25) % 360}, 85%, 45%) !important;
        }
        .${borderClass} {
          border-color: hsl(${hue}, 45%, 90%) !important;
        }
        .group:hover .${borderClass} {
          border-color: hsl(${hue}, 55%, 82%) !important;
        }
      `;
      return { nicheName: niche.name, textClass, bgClass, borderClass, css, hue };
    });
  }, [displayNiches]);

  

  const combinedStylesCss = useMemo(() => {
    const originalStyles = nicheColorMap
      ? Object.values(nicheColorMap).map(v => v.css).join("\n")
      : dynamicStyles.map(s => s.css).join("\n");
    
    const marqueeAnimationCss = ``;
    return originalStyles + "\n" + marqueeAnimationCss;
  }, [nicheColorMap, dynamicStyles]);

  const REPEAT_FACTOR = 6;
  const repeatedNiches = useMemo(() => {
    if (displayNiches.length === 0) return [];
    const arr = [];
    for (let i = 0; i < REPEAT_FACTOR; i++) {
      arr.push(...displayNiches);
    }
    return arr;
  }, [displayNiches]);
  
  const styleMapping = useMemo(() => {
    const map: Record<string, { textClass: string; bgClass: string; borderClass: string; hue: number }> = {};
    dynamicStyles.forEach(s => {
      map[s.nicheName] = { textClass: s.textClass, bgClass: s.bgClass, borderClass: s.borderClass, hue: s.hue };
    });
    return map;
  }, [dynamicStyles]);

  const getStyleClasses = (nicheName: string) => {
    if (nicheColorMap && nicheColorMap[nicheName]) {
      return nicheColorMap[nicheName];
    }
    return styleMapping[nicheName] || { textClass: "", bgClass: "", borderClass: "", hue: 200 };
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 mb-8 overflow-hidden">
      <style>{combinedStylesCss}</style>
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1.5 tracking-tight">
            {lang === "sw" ? "Ungependa Kununua nini Leo Kutoka Kwetu?" : "What would you like to buy from us today?"}
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            {lang === "sw" 
              ? "Chagua duka lako maalum kulingana na uhitaji wako wa sasa." 
              : "Choose your dedicated shopping center based on your current needs."}
          </p>
        </div>

        {/* Manual Navigation Controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={scrollLeftBtn}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xs cursor-pointer"
            aria-label="Previous"
            id="niche-slide-prev-btn"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollRightBtn}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xs cursor-pointer"
            aria-label="Next"
            id="niche-slide-next-btn"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
 
      <div 
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-2 px-4 sm:px-6 -mx-4 sm:-mx-6 snap-x snap-mandatory scroll-smooth"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        id="niche-slider-container"
      >
        <style>{`
          #niche-slider-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
            {displayNiches.map((niche, index) => {
              const IconComponent = (LucideIcons as any)[niche.icon] || LucideIcons.ShoppingBag;
              const styleInfo = getStyleClasses(niche.name);

              return (
                <div 
                  key={`${niche.id || niche.name}-${index}`}
                  className="shrink-0 snap-start select-none w-[280px] sm:w-[320px]"
                >
                  <motion.a
                    href={`/niche/${slugifyNiche(niche.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectNiche(niche.name);
                    }}
                    className={`bg-[#ffffff] rounded-2xl p-4 shadow-xs cursor-pointer group flex flex-col h-[330px] sm:h-[360px] relative overflow-hidden block w-full`}
                    id={`niche-card-${slugifyNiche(niche.name)}-${index}`}
                  >
                    {/* Header: beautifully compact */}
                    <div className="flex items-center gap-2.5 mb-1 z-10 relative">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styleInfo.bgClass}`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-base transition-colors line-clamp-1 ${styleInfo.textClass}`}>
                          {niche.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {niche.categories?.length || 0} {lang === "sw" ? "Kategoria" : "Categories"}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={14} />
                      </div>
                    </div>

                    {/* Cycling Dynamic Product Previews - Edge-to-edge full card layout */}
                    <div className="flex-1 z-10 relative -mx-4 -mb-4 mt-3 flex flex-col overflow-hidden">
                      <NicheProductPreviewGrid 
                        products={products}
                        lang={lang}
                        nicheName={niche.name}
                      />
                    </div>
                  </motion.a>
                </div>
              );
            })}
      </div>
    </div>
  );
}