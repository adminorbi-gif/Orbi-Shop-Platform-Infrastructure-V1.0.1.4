import React from "react";
import { ArrowLeft, SlidersHorizontal, X, MessageSquare, ChevronRight, Sparkles } from "lucide-react";
import { Niche, Category, Product } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { DynamicPropertyFilter, DynamicFilters } from "./DynamicPropertyFilter";
import { parseKeyAttributes } from "../../utils/propertyExtractor";
import { WhatAreYouLookingFor } from "../../pages/ClientApp/components/WhatAreYouLookingFor";
import { ClientSmartBundles, generateSmartBundles, ClientSmartBundleCard } from "../../pages/ClientApp/components/ClientSmartBundles";
import { ClientB2BDealRoomCard } from "../../pages/ClientApp/components/ClientB2BDealRoomCard";

const getStringHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const GRADIENT_PALETTES = [
  "bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-350 bg-clip-text text-transparent",
  "bg-gradient-to-r from-pink-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent",
  "bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 bg-clip-text text-transparent",
  "bg-gradient-to-r from-rose-300 via-pink-200 to-rose-200 bg-clip-text text-transparent",
  "bg-gradient-to-r from-slate-200 via-neutral-100 to-slate-300 bg-clip-text text-transparent",
  "bg-gradient-to-r from-lime-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent",
  "bg-gradient-to-r from-violet-300 via-indigo-200 to-purple-200 bg-clip-text text-transparent",
  "bg-gradient-to-r from-orange-300 via-red-300 to-pink-300 bg-clip-text text-transparent",
  "bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent",
  "bg-gradient-to-r from-yellow-200 via-amber-300 to-orange-400 bg-clip-text text-transparent",
  "bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-400 bg-clip-text text-transparent",
  "bg-gradient-to-r from-fuchsia-300 via-purple-300 to-pink-400 bg-clip-text text-transparent"
];

const getNicheBgImage = (nicheName: string) => {
  switch (nicheName) {
    case "Electronics & Tech":
      return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";
    case "Fashion & Apparel":
      return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200";
    case "Home & Furniture":
      return "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1200";
    case "Health & Beauty":
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200";
    case "Auto & Motors":
      return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200";
    case "Supermarket & Food":
      return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200";
    default:
      return "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=1200";
  }
};

interface NicheShoppingCenterProps {
  deliveryZones?: DeliveryZone[];
  nicheObj: Niche;
  allCategories: Category[];
  products: Product[];
  sellers: any[];
  onSelectProduct: (productId: string) => void;
  sortedAdsList: any[];
  lang: string;
  onBack: () => void;
  onSelectCategory: (cat: string) => void;
  onSelectFamily: (fam: string) => void;
  selectedCategory: string;
  selectedFamily: string | null;
  renderProductCard: (p: Product) => React.ReactNode;
  activeDynamicFilters: DynamicFilters;
  setActiveDynamicFilters: (filters: DynamicFilters) => void;
  onOpenAIChat?: (initialMsg?: string) => void;
  onAddToCart?: (p: Product, openCart?: boolean, quantity?: number) => void;
  onSelectBundle?: (bundle: any) => void;
  currentUserId?: string;
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

export const NicheShoppingCenter: React.FC<NicheShoppingCenterProps> = ({
  nicheObj,
  allCategories,
  products,
  sellers,
  onSelectProduct,
  sortedAdsList,
  lang,
  onBack,
  onSelectCategory,
  onSelectFamily,
  selectedCategory,
  selectedFamily,
  renderProductCard,
  activeDynamicFilters = {},
  setActiveDynamicFilters,
  onOpenAIChat,
  onAddToCart,
  onSelectBundle,
  currentUserId,
  nicheColorMap,
}) => {

  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);

  const activeFilterCount = React.useMemo(() => {
    return Object.values(activeDynamicFilters).reduce<number>((acc, curr) => {
      const arr = curr as string[] | undefined;
      return acc + (arr ? arr.length : 0);
    }, 0);
  }, [activeDynamicFilters]);

  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; value: string }[] = [];
    Object.entries(activeDynamicFilters).forEach(([key, values]) => {
      if (values && Array.isArray(values)) {
        values.forEach((val) => {
          chips.push({ key, value: val });
        });
      }
    });
    return chips;
  }, [activeDynamicFilters]);

  const nicheCategories = React.useMemo(() => {
    if (!nicheObj) return [];
    if (nicheObj.categories && nicheObj.categories.length > 0) {
      return nicheObj.categories;
    }
    const catNames = Array.from(new Set(
      products
        .filter(p => p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo"))
        .map(p => p.category)
        .filter(Boolean)
    ));
    return catNames.map(name => ({ name, families: [] }));
  }, [nicheObj, products]);

  const categoryImages = React.useMemo(() => {
    const imagesSet = new Set<string>();

    nicheCategories.forEach(c => {
      // 1. Direct category image
      if (c.image) {
        imagesSet.add(c.image);
      }
      
      // 2. Find from allCategories list
      const matchedAll = allCategories.find(ac => ac.name === c.name);
      if (matchedAll?.image) {
        imagesSet.add(matchedAll.image);
      }

      // 3. Fallback to product images belonging to this category & niche
      const matchingProducts = products.filter(p => {
        const matchesNiche = p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo");
        return matchesNiche && p.category === c.name;
      });

      matchingProducts.forEach(p => {
        if (p.images && p.images.length > 0) {
          imagesSet.add(p.images[0]);
        } else if (p.image) {
          imagesSet.add(p.image);
        }
      });
    });

    const images = Array.from(imagesSet).filter(Boolean);

    if (images.length === 0) {
      images.push(getNicheBgImage(nicheObj.name));
    }

    // Shuffle the images array using Fisher-Yates shuffle
    const shuffled = [...images];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [nicheCategories, allCategories, products, nicheObj.name]);

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [categoryImages]);

  React.useEffect(() => {
    if (categoryImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % categoryImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [categoryImages]);

  const activeCategoryObj = selectedCategory !== "Zote" && nicheCategories
    ? nicheCategories.find((c) => c.name === selectedCategory) 
    : null;

  if (!nicheObj) return null;

  let displayProducts = products.filter((p) => p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo"));

  if (selectedCategory !== "Zote") {
    displayProducts = displayProducts.filter((p) => p.category === selectedCategory);
  }

  if (selectedFamily) {
    displayProducts = displayProducts.filter((p) => {
      let fam = p.family || "";
      if (p.category && p.category.includes("::")) {
        fam = p.category.split("::")[2] || fam;
      }
      return fam.toLowerCase().trim() === selectedFamily.toLowerCase().trim();
    });
  }

  // Apply Dynamic Filters
  if (Object.keys(activeDynamicFilters).length > 0) {
    displayProducts = displayProducts.filter((p) => {
      // 1. Price Range filter
      const activePriceFiltersSw = activeDynamicFilters["Kiwango cha Bei"] || [];
      const activePriceFiltersEn = activeDynamicFilters["Price Range"] || [];
      const activePriceFilters = [...activePriceFiltersSw, ...activePriceFiltersEn];
      if (activePriceFilters.length > 0) {
        const matchesPrice = activePriceFilters.some((range) => {
          const normalizedStr = range.replace(/,/g, '');
          
          const underMatch = normalizedStr.match(/(?:Chini ya|Under)\s+TZS\s+(\d+)/i);
          if (underMatch) {
            return p.price < parseFloat(underMatch[1]);
          }
          
          const overMatch = normalizedStr.match(/(?:Zaidi ya|Over)\s+TZS\s+(\d+)/i);
          if (overMatch) {
            return p.price > parseFloat(overMatch[1]);
          }
          
          const rangeMatch = normalizedStr.match(/TZS\s+(\d+)\s*-\s*(?:TZS\s+)?(\d+)/i);
          if (rangeMatch) {
            const low = parseFloat(rangeMatch[1]);
            const high = parseFloat(rangeMatch[2]);
            return p.price >= low && p.price <= high;
          }
          
          const aroundMatch = normalizedStr.match(/(?:Around|Kama)\s+TZS\s+(\d+)/i);
          if (aroundMatch) {
            const val = parseFloat(aroundMatch[1]);
            return p.price >= val * 0.9 && p.price <= val * 1.1;
          }
          
          return true;
        });
        if (!matchesPrice) return false;
      }

      // 2. Availability / Stock filter
      const activeStockFiltersSw = activeDynamicFilters["Upatikanaji"] || [];
      const activeStockFiltersEn = activeDynamicFilters["Availability"] || [];
      const activeStockFilters = [...activeStockFiltersSw, ...activeStockFiltersEn];
      if (activeStockFilters.length > 0) {
        const needsInStock = activeStockFilters.some(opt => opt.toLowerCase().includes("stock") || opt.toLowerCase().includes("stoki"));
        if (needsInStock && (p.stock === undefined || p.stock <= 0)) {
          return false;
        }
      }

      // 3. Regular specifications filter
      const otherFilters = { ...activeDynamicFilters };
      delete otherFilters["Kiwango cha Bei"];
      delete otherFilters["Price Range"];
      delete otherFilters["Upatikanaji"];
      delete otherFilters["Availability"];

      if (Object.keys(otherFilters).length === 0) return true;

      const pAttrs = parseKeyAttributes(p.description, p.features || []);
      
      return Object.entries(otherFilters).every(([propKey, values]) => {
        const activeValues = values as string[];
        if (!activeValues || activeValues.length === 0) return true;
        
        // Check if product has this key (case insensitive match)
        const pAttrMatch = pAttrs.find(
          (a) => a.key.toLowerCase() === propKey.toLowerCase()
        );
        if (!pAttrMatch) return false;
        
        // Check if the value is in activeValues (case-insensitive and spacing-insensitive)
        const normalizeVal = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "");
        const normalizedActiveValues = activeValues.map(normalizeVal);
        return normalizedActiveValues.includes(normalizeVal(pAttrMatch.value));
      });
    });
  }

  const smartBundles = React.useMemo(() => {
    return generateSmartBundles(products, lang, nicheObj.name, selectedFamily, currentUserId, deliveryZones);
  }, [products, lang, nicheObj.name, selectedFamily, currentUserId, deliveryZones]);

  const getThemeByNiche = (nicheName: string) => {
    switch (nicheName) {
      case "Electronics & Tech":
        return "bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-blue-400";
      case "Fashion & Apparel":
        return "bg-gradient-to-br from-fuchsia-900 via-pink-900 to-slate-900 text-pink-400";
      case "Home & Furniture":
        return "bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-orange-400";
      case "Health & Beauty":
        return "bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900 text-rose-400";
      case "Auto & Motors":
        return "bg-gradient-to-br from-slate-800 via-gray-900 to-black text-slate-300";
      case "Supermarket & Food":
        return "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-emerald-400";
      default:
        return "bg-slate-900 text-emerald-400";
    }
  };

  const styleInfo = nicheColorMap && nicheColorMap[nicheObj.name];

  const getHeadingGradientByNiche = (nicheName: string) => {
    if (nicheColorMap && nicheColorMap[nicheName]) {
      return nicheColorMap[nicheName].gradientClass;
    }
    const hash = getStringHash(nicheName);
    return `niche-heading-gradient-${hash}`;
  };

  const themeClasses = getThemeByNiche(nicheObj.name);
  const bgColor = styleInfo ? styleInfo.bannerBgClass : themeClasses.split(' ').filter(c => !c.startsWith('text-')).join(' ');
  const textColor = styleInfo ? styleInfo.textClass : themeClasses.split(' ').filter(c => c.startsWith('text-')).join(' ');

  const hash = getStringHash(nicheObj.name);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;
  const hue3 = (hue1 + 80) % 360;

  const dynamicHeadingCss = styleInfo ? styleInfo.css : `
    .niche-heading-gradient-${hash} {
      background-image: linear-gradient(to right, hsl(${hue1}, 100%, 75%), hsl(${hue2}, 100%, 80%), hsl(${hue3}, 100%, 75%)) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
      text-fill-color: transparent !important;
    }
  `;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <style>{dynamicHeadingCss}</style>
      <div className={`relative overflow-hidden text-white ${bgColor} w-full max-[720px]:w-[calc(100%+16px)] max-[720px]:-mx-2 sm:max-[720px]:w-[calc(100%+32px)] sm:max-[720px]:-mx-4 min-[720px]:w-[calc(100%-50px)] min-[720px]:mx-auto max-[720px]:aspect-[21/11] min-[720px]:aspect-[5/2] md:aspect-[10/3] lg:aspect-[4/1] max-h-[250px] border-none flex items-center py-4 px-6 sm:py-6 sm:px-10 md:py-8 md:px-14 max-[720px]:rounded-none min-[720px]:rounded-[14px] shadow-none`}>
        {/* Background Image with 80% opacity and 2px blur */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 overflow-hidden"
            >
              <img
                src={categoryImages[currentImageIndex]}
                alt=""
                className="w-full h-full object-cover blur-[2px]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80";
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Dark overlay to ensure contrast and readability of text */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className={`text-3xl sm:text-5xl font-black mb-3 ${getHeadingGradientByNiche(nicheObj.name)}`}>
            {nicheObj.name}
          </h1>
          <p className="text-slate-300 font-medium text-sm sm:text-base max-w-xl">
            {lang === "sw" 
              ? `Gundua bidhaa bora kutoka kwenye duka la ${nicheObj.name}. Chagua kipengele unachotaka.` 
              : `Explore top quality products from the ${nicheObj.name} center. Choose a category to refine.`}
          </p>
        </div>
      </div>

      <div className="w-full py-4">
        <div className="flex justify-center items-center gap-6 flex-wrap w-full px-2">
          {(() => {
            const displayCats = [
              { name: "Zote" },
              ...nicheCategories
            ];

            return displayCats.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              
              // Resolve category image
              let catImage = undefined;
              if (cat.name !== "Zote") {
                catImage = cat.image;
                if (!catImage) {
                  const globalCat = allCategories?.find(c => c.name === cat.name);
                  catImage = globalCat?.image;
                }
              }

              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    onSelectCategory(cat.name);
                    onSelectFamily("");
                  }}
                  className={`flex flex-col items-center gap-1.5 transition-all duration-300 outline-none cursor-pointer shrink-0 ${
                    isSelected
                      ? "opacity-100 scale-105"
                      : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
                  }`}
                >
                  <div
                    className={`w-[92px] h-[92px] shrink-0 rounded-full bg-slate-100 border-[5px] overflow-hidden flex items-center justify-center transition-transform duration-300 ${
                      isSelected 
                        ? (styleInfo ? `${styleInfo.borderClass} shadow-lg` : "border-slate-900 shadow-lg") 
                        : "border-transparent"
                    }`}
                  >
                    {catImage ? (
                      <img
                        src={catImage}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80";
                        }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {cat.name === "Zote"
                          ? lang === "sw"
                            ? "ZOTE"
                            : "ALL"
                          : cat.name.slice(0, 3)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold whitespace-nowrap transition-colors duration-300 ${
                      isSelected 
                        ? (styleInfo ? styleInfo.textClass : "text-slate-900") 
                        : "text-slate-500"
                    }`}
                  >
                    {cat.name === "Zote" ? (lang === "sw" ? "Zote" : "All") : cat.name}
                  </span>
                </button>
              );
            });
          })()}
        </div>
      </div>

      <AnimatePresence>
        {activeCategoryObj && activeCategoryObj.families && activeCategoryObj.families.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex md:flex-wrap gap-2 pt-2 border-t border-slate-200/60 overflow-x-auto no-scrollbar pb-1 md:pb-0 scroll-smooth w-full"
          >
            {activeCategoryObj.families.map((fam) => (
              <button
                key={fam}
                onClick={() => onSelectFamily(selectedFamily === fam ? "" : fam)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  selectedFamily === fam 
                    ? (styleInfo ? `${styleInfo.bgClass} border` : "bg-emerald-100 text-emerald-800 border border-emerald-200")
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {fam}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* What are you looking for automated recommendation bar (contextualized to this niche) */}
      {selectedCategory === "Zote" && (
        <WhatAreYouLookingFor
          products={products.filter((p) => p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo"))}
          sellers={sellers}
          lang={lang === "sw" ? "sw" : "en"}
          onSelectFamily={onSelectFamily}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* Product Listing Area Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
        {/* Filter Sidebar (Only visible when a specific category is selected) */}
        {selectedCategory !== "Zote" && (
          <div className="w-full md:w-64 shrink-0 hidden md:block">
            <DynamicPropertyFilter 
              products={products.filter(p => {
                const matchesNiche = p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo");
                const matchesCat = p.category === selectedCategory;
                let matchesFamily = true;
                if (selectedFamily) {
                  let fam = p.family || "";
                  if (p.category && p.category.includes("::")) {
                    fam = p.category.split("::")[2] || fam;
                  }
                  matchesFamily = fam.toLowerCase().trim() === selectedFamily.toLowerCase().trim();
                }
                return matchesNiche && matchesCat && matchesFamily;
              })}
              activeFilters={activeDynamicFilters}
              onFilterChange={setActiveDynamicFilters}
              lang={lang}
            />
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 w-full min-w-0">
          {selectedCategory !== "Zote" && (
            <div className="md:hidden mb-4">
              {/* Responsive Compact Filter Controls */}
              <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span>{lang === "sw" ? "Vigezo" : "Specifications"}</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
                  {displayProducts.length} {lang === "sw" ? "Bidhaa" : "Products"}
                </div>
              </div>

              {/* Horizontally scrollable Applied Filter Chips */}
              {activeFilterChips.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 scroll-smooth">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={`${chip.key}-${chip.value}`}
                      type="button"
                      onClick={() => {
                        const currentList = activeDynamicFilters[chip.key] || [];
                        const newList = currentList.filter(v => v !== chip.value);
                        const newFilters = { ...activeDynamicFilters };
                        if (newList.length > 0) {
                          newFilters[chip.key] = newList;
                        } else {
                          delete newFilters[chip.key];
                        }
                        setActiveDynamicFilters(newFilters);
                      }}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shrink-0 shadow-xs cursor-pointer"
                    >
                      <span className="text-slate-400">{chip.key}:</span>
                      <span>{chip.value}</span>
                      <X size={10} className="text-slate-400" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveDynamicFilters({})}
                    className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 underline px-2 shrink-0 cursor-pointer"
                  >
                    {lang === "sw" ? "Safisha Zote" : "Clear All"}
                  </button>
                </div>
              )}

              {/* Mobile Filter Slide-up Drawer */}
              <AnimatePresence>
                {isMobileFilterOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="fixed inset-0 bg-black/60 z-[100]"
                    />
                    {/* Drawer container */}
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl z-[101] flex flex-col pb-6"
                    >
                      {/* Drag indicator bar */}
                      <div className="flex justify-center py-3">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100">
                        <div>
                          <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                            {lang === "sw" ? "Vigezo" : "Specifications"}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {displayProducts.length} {lang === "sw" ? "bidhaa zinalingana" : "matching products"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMobileFilterOpen(false)}
                          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Filter panel scroll content */}
                      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                        <DynamicPropertyFilter 
                          products={products.filter(p => {
                            const matchesNiche = p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo");
                            const matchesCat = p.category === selectedCategory;
                            let matchesFamily = true;
                            if (selectedFamily) {
                              let fam = p.family || "";
                              if (p.category && p.category.includes("::")) {
                                fam = p.category.split("::")[2] || fam;
                              }
                              matchesFamily = fam.toLowerCase().trim() === selectedFamily.toLowerCase().trim();
                            }
                            return matchesNiche && matchesCat && matchesFamily;
                          })}
                          activeFilters={activeDynamicFilters}
                          onFilterChange={setActiveDynamicFilters}
                          lang={lang}
                        />
                      </div>

                      {/* Bottom action drawer buttons */}
                      <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                        {activeFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDynamicFilters({});
                            }}
                            className="flex-1 py-3 border border-slate-200 text-slate-700 hover:text-slate-900 bg-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
                          >
                            {lang === "sw" ? "Safisha" : "Clear All"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsMobileFilterOpen(false)}
                          className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-98 shadow-md cursor-pointer text-center"
                        >
                          {lang === "sw" ? "Onyesha Bidhaa" : "Show Products"} ({displayProducts.length})
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {displayProducts.length > 0 ? (
          <div className="orbi-product-list-grid py-1">
            <AnimatePresence mode="popLayout">
              {(() => {
                const elements: React.ReactNode[] = [];
                const bundlesToInject = smartBundles.filter(b => b.type !== 'B2B');

                displayProducts.forEach((p, idx) => {
                  elements.push(
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderProductCard(p)}
                    </motion.div>
                  );

                  // Inject a bundle card every 4 products
                  if ((idx + 1) % 4 === 0 && bundlesToInject.length > 0) {
                    const bundle = bundlesToInject.shift();
                    if (bundle) {
                      elements.push(
                        <motion.div
                          key={`mixed-bundle-${bundle.id}`}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className={bundle.type === 'B2B' ? "col-span-1 md:col-span-2" : ""}
                        >
                          {bundle.type === 'B2B' ? (
                            <ClientB2BDealRoomCard
                              bundle={bundle}
                              lang={lang as 'sw' | 'en'}
                              products={products}
                              onSelectBundle={onSelectBundle}
                            />
                          ) : (
                            <ClientSmartBundleCard
                              bundle={bundle}
                              lang={lang as 'sw' | 'en'}
                              products={products}
                              onSelectProduct={(prod) => onSelectProduct(prod.id)}
                              onAddToCart={onAddToCart}
                              onSelectBundle={onSelectBundle}
                            />
                          )}
                        </motion.div>
                      );
                    }
                  }

                  // Inject an ad every 6 products, or at index 3 and 9, etc., dynamically
                  const adIndex = Math.floor(idx / 6);
                  if ((idx + 1) % 6 === 0 && sortedAdsList && sortedAdsList.length > 0) {
                    const ad = sortedAdsList[adIndex % sortedAdsList.length];
                    elements.push(
                      <motion.div
                        key={`embedded-ad-${idx}-${ad.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onViewportEnter={ad.trackImpression}
                        viewport={{ once: true, amount: 0.5 }}
                        onClick={ad.action}
                        className="bg-gradient-to-br from-indigo-50/40 to-slate-50/40 rounded-2xl border-2 border-dashed border-indigo-200/60 p-3.5 flex flex-col justify-between hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all duration-300 group relative min-h-[320px] shadow-xs overflow-hidden"
                      >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-indigo-200/20 rounded-full blur-2xl pointer-events-none" />
                        
                        <div>
                          {/* Image area */}
                           <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden relative mb-3 border border-slate-200/50">
                            <img
                              src={ad.image}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80";
                              }}
                              alt={ad.title}
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2 left-2 bg-indigo-600/90 backdrop-blur-xs text-white text-[8px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase">
                              {ad.badge || (lang === "sw" ? "IMEDHAMINIWA" : "SPONSORED")}
                            </span>
                            {ad.relevancePercentage && (
                              <span className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[8px] px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 shadow-xs">
                                <Sparkles size={8} className="animate-pulse" />
                                <span>{ad.relevancePercentage}% Match</span>
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-0.5 leading-none">
                            {ad.businessName}
                          </span>
                          
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-700 leading-snug line-clamp-2 transition-colors">
                            {ad.title}
                          </h4>
                          
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {ad.description}
                          </p>

                          {ad.matchReason && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1.5 bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit flex items-center gap-1">
                              <Sparkles size={8} />
                              <span>{ad.matchReason}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 border-t border-indigo-100/60 pt-2.5 mt-3 shrink-0">
                          <span>
                            {lang === "sw" ? "Gundua Sasa" : "Discover Now"}
                          </span>
                          <ChevronRight
                            size={14}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </div>
                      </motion.div>
                    );
                  }
                });

                // Append leftover bundles if any are still in queue
                while (bundlesToInject.length > 0) {
                  const bundle = bundlesToInject.shift();
                  if (bundle) {
                    elements.push(
                      <motion.div
                        key={`mixed-bundle-end-${bundle.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={bundle.type === 'B2B' ? "col-span-1 md:col-span-2" : ""}
                      >
                        {bundle.type === 'B2B' ? (
                          <ClientB2BDealRoomCard
                            bundle={bundle}
                            lang={lang as 'sw' | 'en'}
                            products={products}
                            onSelectBundle={onSelectBundle}
                          />
                        ) : (
                          <ClientSmartBundleCard
                            bundle={bundle}
                            lang={lang as 'sw' | 'en'}
                            products={products}
                            onSelectProduct={(prod) => onSelectProduct(prod.id)}
                            onAddToCart={onAddToCart}
                            onSelectBundle={onSelectBundle}
                          />
                        )}
                      </motion.div>
                    );
                  }
                }

                return elements;
              })()}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-12 px-6 text-center bg-gradient-to-br from-indigo-50/40 to-slate-50/40 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto my-6 animate-in fade-in zoom-in-95">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-lg font-black shadow-md border-2 border-white">
                OB
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            
            <h4 className="text-base font-black text-slate-900 mb-2">
              {lang === "sw" 
                ? "Je, unatafuta kitu maalum ambacho hukioni hapa?" 
                : "Looking for a specific item not listed here?"}
            </h4>
            
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
              {lang === "sw" 
                ? "Habari! Mimi ni msaidizi wako wa kibinafsi wa Orbi Shop. Ingawa kwa sasa hatuna bidhaa zinazolingana na vichungi vyako, nipo hapa kukusaidia. Unaweza kuongea nami sasa hivi ili nikutafutie kwa haraka na kukuagizia kwa urahisi!" 
                : "Hello! I am your personal Orbi Shop concierge. While we don't have matching products under these filters right now, I'm here to serve you. You can chat with our intelligent assistant to source exactly what you need!"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {onOpenAIChat && (
                <button
                  onClick={() => {
                    const msg = lang === "sw"
                      ? `Halo! Natafuta bidhaa katika kundi la "${nicheObj.name}". Je, unaweza kunisaidia kupata chaguzi sahihi hivi sasa?`
                      : `Hello! I am looking for items in the "${nicheObj.name}" category. Can you help me source what I need?`;
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
                  setActiveDynamicFilters({});
                  if (onSelectCategory) onSelectCategory("Zote");
                  if (onSelectFamily) onSelectFamily("");
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-xs"
              >
                {lang === "sw" ? "Futa Vichungi" : "Clear Filters"}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
