import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Award, Flame, ArrowRight, Layers, Eye } from "lucide-react";
import { Product, SellerProfile } from "../../../types";

interface WhatAreYouLookingForProps {
  products: Product[];
  sellers: SellerProfile[];
  lang: "sw" | "en";
  onSelectFamily: (family: string) => void;
  onSelectProduct?: (productId: string) => void;
}

interface FamilyGroup {
  name: string;
  representativeProduct: Product;
  totalCount: number;
  hasProTrader: boolean;
  isPushed: boolean;
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='central' fill='%2394a3b8'%3ENo image%3C/text%3E%3C/svg%3E";

// Modern stateful thumbnail outside the parent component to preserve loading states between ticks
const PremiumImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state on source changes to handle carousel swap correctly
  useEffect(() => {
    setLoaded(false);
    setError(false);

    // Immediately check if the image has already completed loading (cached by the browser)
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setLoaded(true);
      } else {
        setError(true);
        setLoaded(true); // force loaded state to show placeholder immediately on error
      }
    }
  }, [src]);

  // Optimize URL if it's an Unsplash URL
  let optimizedSrc = src;
  if (src && src.includes("images.unsplash.com")) {
    try {
      const urlObj = new URL(src);
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("q", "75");
      if (!urlObj.searchParams.has("w")) {
        urlObj.searchParams.set("w", "480");
      }
      optimizedSrc = urlObj.toString();
    } catch (e) {
      optimizedSrc = src.includes("?")
        ? `${src}&auto=format&q=75&w=480`
        : `${src}?auto=format&q=75&w=480`;
    }
  }

  const isPlaceholder = !src || src === PLACEHOLDER_IMAGE;

  return (
    <div className="relative w-full h-full bg-slate-100/60 overflow-hidden rounded-md">
      {!loaded && !error && !isPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/80 via-slate-200/80 to-slate-100/80 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={error ? PLACEHOLDER_IMAGE : (optimizedSrc || PLACEHOLDER_IMAGE)}
        alt={alt}
        className={`${className} transition-all duration-500 ${
          loaded || error || isPlaceholder ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const WhatAreYouLookingFor: React.FC<WhatAreYouLookingForProps> = ({
  products,
  sellers,
  lang,
  onSelectFamily,
  onSelectProduct,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledGroups, setShuffledGroups] = useState<FamilyGroup[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  // ---- 1. Group, score, and sort by priority (deterministic) ----
  const sortedGroups = useMemo(() => {
    if (!products || !sellers) return [];

    const sellerMap = new Map<string, SellerProfile>();
    sellers.forEach((s) => sellerMap.set(s.id, s));

    const groups: { [key: string]: Product[] } = {};

    products.forEach((p) => {
      let fam = p.family?.trim();
      if (!fam && p.category) {
        const parts = p.category.split("::");
        if (parts.length >= 3) {
          fam = parts[2]?.trim();
        }
      }
      if (!fam) fam = "Zingine";

      const lowerFam = fam.toLowerCase();
      if (lowerFam === "zote" || lowerFam === "all" || fam === "") {
        return;
      }

      if (!groups[fam]) {
        groups[fam] = [];
      }
      groups[fam].push(p);
    });

    const list: FamilyGroup[] = [];

    Object.entries(groups).forEach(([famName, pList]) => {
      const withImages = pList.filter(
        (p) => p.images && p.images.length > 0 && typeof p.images[0] === "string" && p.images[0].trim() !== "" && p.images[0] !== "null" && p.images[0] !== "undefined"
      );
      const candidates = withImages.length > 0 ? withImages : pList;

      const scoredProducts = candidates.map((p) => {
        let score = 0;
        const seller = sellerMap.get(p.sellerId);
        const isPro = Boolean(seller?.isPro && seller?.proUntil && seller.proUntil > Date.now());
        if (isPro) score += 1000;

        const isPushed = Boolean(
          p.tags &&
            p.tags.some((t) => {
              const tl = t.toLowerCase();
              return (
                tl.includes("promoted") ||
                tl.includes("promo") ||
                tl.includes("trend") ||
                tl.includes("recommend") ||
                tl.includes("vip")
              );
            })
        );
        if (isPushed) score += 500;

        score += 10;
        return { product: p, score, isPro, isPushed };
      });

      scoredProducts.sort((a, b) => b.score - a.score);
      const topRepresentative = scoredProducts[0];
      if (topRepresentative) {
        list.push({
          name: famName,
          representativeProduct: topRepresentative.product,
          totalCount: pList.length,
          hasProTrader: scoredProducts.some((x) => x.isPro),
          isPushed: scoredProducts.some((x) => x.isPushed),
        });
      }
    });

    return list.sort((a, b) => {
      const aScore = (a.hasProTrader ? 100 : 0) + (a.isPushed ? 50 : 0);
      const bScore = (b.hasProTrader ? 100 : 0) + (b.isPushed ? 50 : 0);
      return bScore - aScore;
    });
  }, [products, sellers]);

  // ---- 2. Interleave + shuffle within tiers (fair spotlight rotation) ----
  useEffect(() => {
    if (sortedGroups.length === 0) {
      setShuffledGroups([]);
      return;
    }

    const highTier = sortedGroups.filter((g) => g.hasProTrader || g.isPushed);
    const normalTier = sortedGroups.filter((g) => !g.hasProTrader && !g.isPushed);

    const shuffleArray = (arr: FamilyGroup[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledHigh = shuffleArray(highTier);
    const shuffledNormal = shuffleArray(normalTier);

    const interleaved: FamilyGroup[] = [];
    const maxLen = Math.max(shuffledHigh.length, shuffledNormal.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < shuffledHigh.length) interleaved.push(shuffledHigh[i]);
      if (i < shuffledNormal.length) interleaved.push(shuffledNormal[i]);
    }

    setShuffledGroups(interleaved);
  }, [sortedGroups]);

  // ---- 3. Pick a random background image from all products ----
  useEffect(() => {
    if (!products || products.length === 0) return;

    const validProducts = products.filter(
      (p) => p.images && p.images.length > 0 && typeof p.images[0] === "string" && p.images[0].trim() !== ""
    );

    if (validProducts.length === 0) {
      setBackgroundImage("");
      return;
    }

    const randomProduct = validProducts[Math.floor(Math.random() * validProducts.length)];
    const imgUrl = randomProduct.images?.[0];
    if (imgUrl && typeof imgUrl === "string" && imgUrl.trim() !== "") {
      setBackgroundImage(imgUrl);
    } else {
      setBackgroundImage("");
    }
  }, [products]);

  // ---- 4. Auto‑rotation ----
  const [isPaused, setIsPaused] = useState(false);
  const totalFamilies = shuffledGroups.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (totalFamilies <= 1 || isPaused) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalFamilies);
    }, 5500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalFamilies, isPaused]);

  if (shuffledGroups.length === 0) return null;

  const activeSpotlight = shuffledGroups[currentIndex % totalFamilies];

  const getImageSrc = (product: Product): string => {
    const img = product?.images && product.images[0];
    if (img && typeof img === "string" && img.trim() !== "" && img !== "null" && img !== "undefined") {
      return img;
    }
    return PLACEHOLDER_IMAGE;
  };

  const handleProductClick = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectProduct) {
      onSelectProduct(productId);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full rounded-2xl border border-indigo-200/40 overflow-hidden my-5 relative transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_25px_65px_-12px_rgba(99,102,241,0.22)] shadow-[0_12px_45px_-15px_rgba(0,0,0,0.08)] group"
    >
      {backgroundImage && (
        <>
          <div className="absolute inset-0 overflow-hidden scale-105">
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover blur-[3px]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80";
              }}
            />
          </div>
          <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-md" />
        </>
      )}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-slate-50/90" />
      )}

      <div className="relative z-10 p-4 md:p-6">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-emerald-50 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2 border-b border-slate-200/40 pb-2">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-50/90 text-indigo-600 border border-indigo-100/60 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1 backdrop-blur-sm">
              <Sparkles size={10} className="animate-spin-slow text-indigo-500" />
              <span>
                {lang === "sw"
                  ? "Mkusanyiko wetu bora uliopendekezwa kwa ajili yako"
                  : "Our top recommended collection for you"}
              </span>
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
              {lang === "sw" ? "Unatafuta nini leo?" : "What are you looking for?"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-slate-200/60 text-indigo-700 font-black px-2.5 py-1 rounded-lg text-xs border border-slate-300/50 backdrop-blur-sm">
              {shuffledGroups.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-5 bg-slate-100/80 backdrop-blur-md rounded-xl border border-slate-200/40 p-3 flex flex-col gap-1 min-h-[240px]">
            <div className="absolute top-2 right-2 z-20 flex gap-1">
              {activeSpotlight.hasProTrader && (
                <span className="bg-amber-100/90 text-amber-800 border border-amber-200/60 text-[10px] px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-0.5 backdrop-blur-xs">
                  <Award size={10} /> Pro
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSpotlight.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col gap-2 pt-1"
              >
                <div>
                  <h3 className="text-xl font-black text-slate-950 mb-2 leading-tight">
                    {activeSpotlight.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3">
                    {lang === "sw"
                      ? `Kusanya bidhaa zote halisi na vifaa chini ya chapa inayopendwa ya ${activeSpotlight.name}.`
                      : `Browse all items, models, and parts matching the official ${activeSpotlight.name} ecosystem.`}
                  </p>
                </div>

                <div
                  onClick={(e) => {
                    if (onSelectProduct) {
                      e.stopPropagation();
                      onSelectProduct(activeSpotlight.representativeProduct.id);
                    } else {
                      onSelectFamily(activeSpotlight.name);
                    }
                  }}
                  className="bg-slate-50/90 hover:bg-white border border-slate-200/60 rounded-lg p-3 flex items-center gap-4 transition-all duration-300 cursor-pointer mt-auto backdrop-blur-sm shadow-xs hover:border-indigo-300"
                >
                  <div
                    className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-slate-200 relative"
                    onClick={(e) => handleProductClick(activeSpotlight.representativeProduct.id, e)}
                  >
                    <PremiumImage
                      src={getImageSrc(activeSpotlight.representativeProduct)}
                      alt={activeSpotlight.representativeProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {activeSpotlight.representativeProduct.name}
                    </p>
                    <span className="text-[10px] font-extrabold text-indigo-600 block mt-0.5">
                      {lang === "sw" ? "Gundua zote" : "Explore ecosystem"} &rarr;
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-1 pt-2 border-t border-slate-200/40">
              {shuffledGroups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentIndex % totalFamilies === idx ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {shuffledGroups.map((group) => (
                <div
                  key={group.name}
                  onClick={() => onSelectFamily(group.name)}
                  className="w-32 bg-slate-50/90 hover:bg-white border border-slate-200/60 hover:border-indigo-300 rounded-xl p-2 shrink-0 cursor-pointer transition-all duration-300 flex flex-col justify-between backdrop-blur-sm shadow-xs hover:-translate-y-1"
                >
                  <div className="w-full aspect-square rounded-md overflow-hidden mb-2 border border-slate-200/40">
                    <PremiumImage
                      src={getImageSrc(group.representativeProduct)}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-900 line-clamp-1">
                      {group.name}
                    </h4>
                    <p className="text-[8px] text-slate-500 font-medium mt-0.5 flex items-center gap-0.5">
                      <Layers size={7} />
                      <span>{lang === "sw" ? "Gundua" : "View"}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
