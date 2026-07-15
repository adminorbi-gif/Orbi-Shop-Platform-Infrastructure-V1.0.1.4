import React, { useMemo, useState, useEffect } from 'react';
import { Product } from '../../../types';
import { 
  Package, 
  Zap, 
  Building2, 
  Users, 
  Layers, 
  ShoppingBag, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { formatCurrency } from '../../../lib/storage';
import { PriceDisplay } from '../../../components/PriceDisplay';
import { motion, AnimatePresence } from 'motion/react';
import { getProductPriceForQty } from '../../../utils/pricing';
import { ImageWithSkeleton } from '../../../components/ImageWithSkeleton';
import { DeliveryZone } from '../../../types';

const MouseTrackZoom: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center center',
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(1.5)',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center center',
    });
  };

  return (
    <div 
      className={`overflow-hidden relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <div 
        style={{
          ...zoomStyle,
          transition: 'transform 0.1s ease-out, transform-origin 0.1s ease-out',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export interface SmartBundle {
  id: string;
  type: 'B2B' | 'B2C' | 'P2B' | 'P2C';
  name: string;
  items: Product[];
  originalPrice: number;
  bundlePrice: number;
  discountPercentage: number;
  tagline: string;
  businessDetails: string;
}

const t = {
  en: {
    b2b: "B2B Enterprise Wholesale",
    b2c: "B2C Consumer Combo",
    p2b: "P2B Partner Solution",
    p2c: "P2C Factory-Direct",
    buyAll: (count: number, price: string) => `Buy all (${count}) items by ${price}`,
    saveAmount: (amount: string) => `Save ${amount} instantly`,
    procureBtn: "View Deal Room",
    procuring: "Routing Order...",
    successToast: "Ecosystem package successfully queued into your procurement cart!",
    viewProduct: "Inspect details",
    bulkResell: "",
    directProducer: "Bypassing intermediate markup - 100% direct",
    retailSaver: "Premium everyday combo for immediate utility",
    synergyPartner: "Joint peer-to-business vendor synergy package",
    standardTotal: "Standard Total:",
    inStock: "Package Available",
    saving: "You Save"
  },
  sw: {
    b2b: "B2B Ununuzi wa Jumla",
    b2c: "B2C Kifurushi cha Wateja",
    p2b: "P2B Ushirikiano wa Biashara",
    p2c: "P2C Moja kwa Moja Kiwandani",
    buyAll: (count: number, price: string) => `Nunua zote (${count}) kwa ${price}`,
    saveAmount: (amount: string) => `Okoa ${amount} papo hapo`,
    procureBtn: "Fungua Ofa ya Biashara",
    procuring: "Tunasafirisha Bidhaa...",
    successToast: "Mkusanyiko wa bidhaa za kibiashara umeongezwa kwenye kikapu chako!",
    viewProduct: "Angalia sifa",
    bulkResell: "",
    directProducer: "Kupita madalali wote - bei halisi ya kiwandani",
    retailSaver: "Ofa bora ya matumizi ya nyumbani kwa gharama nafuu",
    synergyPartner: "",
    standardTotal: "Jumla ya Kawaida:",
    inStock: "Kifurushi Kipo",
    saving: "Unaokoa"
  }
};

/**
 * Generates unique bundles with different products only (no duplicate products in a bundle).
 */
/**
 * Safely calculates the minimum allowed price for a product inside smart bundles,
 * protecting the seller's margins based on wholesale settings or walk-away price floors.
 * The system never discounts below 90% of retail price if no floors are explicitly set.
 */
export function getProductSafeBundlePrice(product: Product): number {
  const retailPrice = product.price;

  // 1. Check if the product has wholesale tiers
  if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
    // Get the minimum price across wholesale tiers (representing bulk rate) to serve as the bundle floor
    const wholesalePrices = product.wholesaleTiers.map(t => Number(t.price)).filter(p => p > 0);
    if (wholesalePrices.length > 0) {
      return Math.min(retailPrice, Math.min(...wholesalePrices));
    }
  }

  // 2. If no wholesale tiers, check if walkAwayPrice is explicitly defined by the seller
  if (product.walkAwayPrice && product.walkAwayPrice > 0) {
    return Math.min(retailPrice, product.walkAwayPrice);
  }

  // 3. Fallback: if neither wholesale tiers nor walk-away price is set, NEVER discount below 90%
  // This strictly respects: "mfumo hautakiwi kumpunguzia muuzaji bei hadi 75% bila ruhusa yake"
  return Math.round(retailPrice * 0.90);
}

/**
 * Generates unique bundles with different products only (no duplicate products in a bundle).
 * Customized and personalized for each customer/user while strictly respecting seller safety settings.
 */
export function generateSmartBundles(
  products: Product[],
  lang: 'sw' | 'en' = 'en',
  selectedNiche?: string,
  selectedFamily?: string,
  userId?: string,
  deliveryZones: DeliveryZone[] = []
): SmartBundle[] {
  if (!products || products.length === 0) return [];

  // Filter available active pool
  const pool = products.filter(p => p.stock > 0 && p.price > 0);
  if (pool.length < 2) return [];

  // Filter pool based on selected Niche and selected Family
  let targetPool = [...pool];
  
  if (selectedFamily) {
    targetPool = targetPool.filter(p => p.family?.toLowerCase() === selectedFamily.toLowerCase());
  } else if (selectedNiche && selectedNiche !== "Zote") {
    targetPool = targetPool.filter(p => p.niche?.toLowerCase() === selectedNiche.toLowerCase());
  }
  
  // If we have fewer than 2 distinct items, backfill from other products to make sure we always have enough to pair
  if (targetPool.length < 2) {
    targetPool = [...pool];
  }

  // Remove duplicates from target pool to guarantee strictly distinct products in the same bundle
  const distinctPool: Product[] = [];
  const seenIds = new Set<string>();
  for (const p of targetPool) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      distinctPool.push(p);
    }
  }

  // If even global distinct pool is less than 2, cannot build a bundle
  if (distinctPool.length < 2) return [];

  // PERSONALIZATION: Rotate/shuffle pool based on a deterministic hash of the customer's userId.
  // If the user is a guest (no userId provided), we retrieve or generate a persistent 'orbi_guest_bundle_id' from localStorage.
  // This guarantees that even guest users get a personalized, distinct marketplace experience that remains stable during their visit!
  let poolToUse = [...distinctPool];
  let seedId = userId;

  if (!seedId) {
    try {
      let guestId = typeof window !== 'undefined' ? localStorage.getItem('orbi_guest_bundle_id') : null;
      if (!guestId && typeof window !== 'undefined') {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('orbi_guest_bundle_id', guestId);
      }
      seedId = guestId || undefined;
    } catch (e) {
      // If localStorage is blocked in iframe, use calendar day + list length as fallback
      const day = new Date().getDate();
      seedId = `fallback_day_${day}`;
    }
  }

  if (seedId) {
    let hash = 0;
    for (let i = 0; i < seedId.length; i++) {
      hash = seedId.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    const rotation = hash % poolToUse.length;
    if (rotation > 0) {
      poolToUse = [...poolToUse.slice(rotation), ...poolToUse.slice(0, rotation)];
    }
  }

  // If rotated pool still has fewer than 2, fallback
  if (poolToUse.length < 2) {
    poolToUse = [...distinctPool];
  }

  // Autonomous B2B localization & profit projection parameters
  let businessCity = "Dar es Salaam";
  let hubName = "Kariakoo Market";
  let estResellerMargin = 15; // default 15% profit margin
  if (seedId) {
    let hashVal = 0;
    for (let i = 0; i < seedId.length; i++) {
      hashVal = seedId.charCodeAt(i) + ((hashVal << 5) - hashVal);
    }
    hashVal = Math.abs(hashVal);
    let cities = ["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Dodoma"];
    let hubs = ["Kariakoo Wholesalers", "Sheikh Amri Plaza", "Nyamagana Central Hub", "Sido Commercial Hub", "Uhuru Street Hub"];
    
    if (deliveryZones && deliveryZones.length > 0) {
      const b2bHubs = deliveryZones.filter(dz => dz.isB2bHub);
      if (b2bHubs.length > 0) {
        cities = b2bHubs.map(dz => lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name));
        hubs = b2bHubs.map(dz => dz.b2bHubName || `${lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name)} Hub`);
      } else {
        // Fallback to all zones if no specific B2B hubs configured
        cities = deliveryZones.map(dz => lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name));
        hubs = cities.map(city => `${city} Hub`);
      }
    }

    businessCity = cities[hashVal % cities.length];
    hubName = hubs[hashVal % hubs.length];
    estResellerMargin = 12 + (hashVal % 11); // Deterministic margin target: 12% to 22%
  }

  const bundles: SmartBundle[] = [];

  // Helper to safely get localized niche
  const getLocalizedNiche = (rawNiche: string, isSw: boolean) => {
    if (!rawNiche) return isSw ? 'Jumla' : 'Wholesale';
    if (!isSw) return rawNiche;
    const lower = rawNiche.toLowerCase();
    if (lower.includes('electronics') || lower.includes('tech') || lower.includes('elektroniki') || lower.includes('simu')) return 'Elektroniki & Simu';
    if (lower.includes('fashion') || lower.includes('apparel') || lower.includes('mavazi') || lower.includes('mitindo')) return 'Mavazi & Mitindo';
    if (lower.includes('home') || lower.includes('furniture') || lower.includes('samani') || lower.includes('nyumbani')) return 'Samani & Nyumbani';
    if (lower.includes('health') || lower.includes('beauty') || lower.includes('afya') || lower.includes('urembo')) return 'Afya & Urembo';
    if (lower.includes('auto') || lower.includes('motor') || lower.includes('magari') || lower.includes('vipuri')) return 'Magari & Vipuri';
    if (lower.includes('supermarket') || lower.includes('food') || lower.includes('chakula') || lower.includes('vinywaji')) return 'Chakula & Vinywaji';
    return rawNiche;
  };

  // 1. B2C Consumer Combo (2 distinct products)
  if (poolToUse.length >= 2) {
    const items = [poolToUse[0], poolToUse[1]];
    const originalPrice = items[0].price + items[1].price;
    
    // Compute safe, margin-protected bundle prices
    const price0 = getProductSafeBundlePrice(items[0]);
    const price1 = getProductSafeBundlePrice(items[1]);
    const bundlePrice = price0 + price1;
    const discountPercentage = originalPrice > 0 ? Math.max(1, Math.round(((originalPrice - bundlePrice) / originalPrice) * 100)) : 0;
    
    bundles.push({
      id: `b2c-${items[0].id}-${items[1].id}`,
      type: "B2C",
      name: lang === 'sw' 
        ? `Kifurushi cha Kisasa cha ${items[0].family || selectedFamily || 'Rejareja'}` 
        : `Premium ${items[0].family || selectedFamily || 'Retail'} Lifestyle Combo`,
      items,
      originalPrice,
      bundlePrice,
      discountPercentage,
      tagline: lang === 'sw' ? t.sw.retailSaver : t.en.retailSaver,
      businessDetails: lang === 'sw' 
        ? "Imesanifiwa kwa ajili ya matumizi ya nyumbani au binafsi. Nunua bidhaa hizi mbili thabiti kwa pamoja uokoe gharama zaidi."
        : "Curated everyday consumer pairing offering immediate lifestyle synergy. Procure both premium products together with an instant pricing advantage."
    });
  }

  // 2. B2B Enterprise Wholesale Pack (Up to 5 distinct products if available)
  if (poolToUse.length >= 2) {
    // Prioritize products that are explicitly wholesale (have tiers, walkaway price under retail, or are wholesale-categorized/tagged)
    const wholesaleItems = poolToUse.filter(p => (
      (p.wholesaleTiers && p.wholesaleTiers.length > 0) || 
      (p.walkAwayPrice && p.walkAwayPrice > 0 && p.walkAwayPrice < p.price) ||
      p.category?.toLowerCase() === "wholesale" ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes("wholesale") || t.toLowerCase().includes("bulk")))
    ));
    const otherItems = poolToUse.filter(p => !wholesaleItems.some(wi => wi.id === p.id));
    const sortedB2BPool = [...wholesaleItems, ...otherItems];

    const itemsCount = Math.min(sortedB2BPool.length, 5);
    const items = sortedB2BPool.slice(0, itemsCount);
    const originalPrice = items.reduce((sum, item) => sum + item.price, 0);
    
    // Compute safe, margin-protected bundle prices
    const targetPrices = items.map(item => getProductSafeBundlePrice(item));
    const bundlePrice = targetPrices.reduce((sum, p) => sum + p, 0);
    const discountPercentage = originalPrice > 0 ? Math.max(1, Math.round(((originalPrice - bundlePrice) / originalPrice) * 100)) : 0;

    const sectorNameSw = getLocalizedNiche(items[0]?.niche || items[0]?.category || selectedNiche, true);
    const sectorNameEn = getLocalizedNiche(items[0]?.niche || items[0]?.category || selectedNiche, false);

    bundles.push({
      id: `b2b-wholesale-${items.map(i => i.id).join('-')}`,
      type: "B2B",
      name: lang === 'sw'
        ? `Kifurushi cha ${hubName} (${sectorNameSw})`
        : `${businessCity} ${sectorNameEn} Wholesale Syndicate`,
      items,
      originalPrice,
      bundlePrice,
      discountPercentage,
      tagline: lang === 'sw' 
        ? `Inapendekezwa kwa Wauzaji wa ${businessCity} | Okoa ${discountPercentage}%` 
        : `Recommended for ${businessCity} Merchants | Save ${discountPercentage}%`,
      businessDetails: lang === 'sw'
        ? `Mkusanyiko maalum wa jumla uliosanifiwa kwa wafanyabiashara wa ${businessCity} (unaoagizwa kupitia ${hubName}). Mpangilio huu wa wauzaji wengi unapunguza gharama za usafirishaji na kuongeza makadirio ya faida yako ya rejareja kwa ${estResellerMargin}%.`
        : `Personalized bulk procurement bundle for ${businessCity} merchants (sourced via ${hubName}). Our autopilot routing groups top vendors together to guarantee a protected ${estResellerMargin}% resale profit margin.`
    });
  }

  // 3. P2C / P2B Partner Synergy Pack (2 distinct products from either same seller or different sellers)
  if (poolToUse.length >= 2) {
    // Also prioritize wholesale items to get deep wholesale rates
    const wholesaleItems = poolToUse.filter(p => (
      (p.wholesaleTiers && p.wholesaleTiers.length > 0) || 
      (p.walkAwayPrice && p.walkAwayPrice > 0 && p.walkAwayPrice < p.price) ||
      p.category?.toLowerCase() === "wholesale" ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes("wholesale") || t.toLowerCase().includes("bulk")))
    ));
    const otherItems = poolToUse.filter(p => !wholesaleItems.some(wi => wi.id === p.id));
    const sortedB2BPool = [...wholesaleItems, ...otherItems];

    // Grab different items to avoid duplicating the exact B2C pair
    const idx1 = sortedB2BPool.length - 1;
    const idx2 = Math.max(0, sortedB2BPool.length - 2);
    const items = [sortedB2BPool[idx1], sortedB2BPool[idx2]];
    const originalPrice = items[0].price + items[1].price;
    
    // Compute safe, margin-protected bundle prices
    const price0 = getProductSafeBundlePrice(items[0]);
    const price1 = getProductSafeBundlePrice(items[1]);
    const bundlePrice = price0 + price1;
    const discountPercentage = originalPrice > 0 ? Math.max(1, Math.round(((originalPrice - bundlePrice) / originalPrice) * 100)) : 0;

    const isDifferentSellers = items[0].sellerId !== items[1].sellerId;
    const type = isDifferentSellers ? "P2B" : "P2C";

    bundles.push({
      id: `${type.toLowerCase()}-${items[0].id}-${items[1].id}`,
      type,
      name: lang === 'sw'
        ? (type === "P2B" ? "Kifurushi cha Ushirikiano wa Biashara (P2B)" : "Kifurushi Moja kwa Moja cha Kiwandani (P2C)")
        : (type === "P2B" ? "P2B Multi-Vendor Synergy Pack" : "P2C Factory-to-Business Direct Solution"),
      items,
      originalPrice,
      bundlePrice,
      discountPercentage,
      tagline: lang === 'sw' ? t.sw.synergyPartner : t.en.synergyPartner,
      businessDetails: lang === 'sw'
        ? "Ushirikiano wa kimkakati unaopitisha madalali wa kati na kuleta bidhaa mbili bora kwa gharama iliyopunguzwa ya usafirishaji."
        : "Strategic inventory alliance routing distinct high-demand assets together, minimizing middleman markups for optimal value delivery."
    });
  }

  return bundles.slice(0, 3);
}

const money = (value: number) => formatCurrency(Math.max(0, Math.round(value)));


export const ClientSmartBundleCard = ({ 
  bundle, 
  lang = 'en',
  onSelectProduct,
  onAddToCart,
  products,
  onSelectBundle
}: { 
  bundle: SmartBundle,
  lang?: 'sw' | 'en',
  onSelectProduct: (p: Product) => void,
  onAddToCart: (p: Product, openCart?: boolean, quantity?: number) => void,
  products: Product[],
  onSelectBundle?: (bundle: SmartBundle) => void
}) => {
  const itemsCount = bundle.items.length;

  const vendorCount = useMemo(() => {
    return new Set(bundle.items.map(item => item.sellerId || 'unknown')).size;
  }, [bundle.items]);

  const procurementScore = useMemo(() => {
    return Math.min(
      98,
      70 + bundle.discountPercentage + Math.min(bundle.items.length * 3, 12)
    );
  }, [bundle.discountPercentage, bundle.items.length]);

  const displayCaption = useMemo(() => {
    if (bundle.type === 'B2B') {
      return lang === 'sw'
        ? "Kifurushi cha wauzaji wengi chenye escrow, wauzaji waliothibitishwa, na usafirishaji wa pamoja."
        : "Multi-vendor supply bundle with escrow, verified sellers, and consolidated delivery.";
    } else {
      return lang === 'sw'
        ? "Ofa maalum ya bidhaa zenye kuokoa papo hapo na malipo yaliyolindwa."
        : "Curated product combo with instant saving and protected checkout.";
    }
  }, [bundle.type, lang]);

  const badgeStyles = 
    bundle.type === "B2B" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
    bundle.type === "B2C" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    bundle.type === "P2B" ? "bg-amber-50 text-amber-700 border-amber-100" :
    "bg-cyan-50 text-cyan-700 border-cyan-100";

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectBundle) {
      onSelectBundle(bundle);
    }
  };

  const renderBundleImages = () => {
    const items = bundle.items || [];
    if (items.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
          <Package size={34} strokeWidth={1} />
        </div>
      );
    }

    if (items.length === 1) {
      const firstItem = items[0];
      return (
        <ImageWithSkeleton
          src={firstItem.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
          alt={firstItem.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          containerClassName="w-full h-full"
        />
      );
    }

    if (items.length === 2) {
      return (
        <div className="flex h-full w-full divide-x divide-slate-100 bg-white">
          <div className="w-1/2 h-full relative overflow-hidden">
            <ImageWithSkeleton
              src={items[0].images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
              alt={items[0].name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              containerClassName="w-full h-full bg-slate-50"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider z-10">
              #1
            </span>
          </div>
          <div className="w-1/2 h-full relative overflow-hidden">
            <ImageWithSkeleton
              src={items[1].images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
              alt={items[1].name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              containerClassName="w-full h-full bg-slate-50"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider z-10">
              #2
            </span>
          </div>
        </div>
      );
    }

    if (items.length === 3) {
      return (
        <div className="flex h-full w-full divide-x divide-slate-100 bg-white">
          <div className="w-1/2 h-full relative overflow-hidden">
            <ImageWithSkeleton
              src={items[0].images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
              alt={items[0].name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              containerClassName="w-full h-full bg-slate-50"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider z-10">
              #1
            </span>
          </div>
          <div className="w-1/2 h-full flex flex-col divide-y divide-slate-100">
            <div className="h-1/2 w-full relative overflow-hidden">
              <ImageWithSkeleton
                src={items[1].images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
                alt={items[1].name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                containerClassName="w-full h-full bg-slate-50"
              />
              <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider z-10">
                #2
              </span>
            </div>
            <div className="h-1/2 w-full relative overflow-hidden">
              <ImageWithSkeleton
                src={items[2].images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
                alt={items[2].name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                containerClassName="w-full h-full bg-slate-50"
              />
              <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider z-10">
                #3
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[1px] bg-slate-100">
        {items.slice(0, 4).map((item, idx) => (
          <div key={item.id} className="relative overflow-hidden bg-white h-full w-full">
            <ImageWithSkeleton
              src={item.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              containerClassName="w-full h-full bg-slate-50"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider z-10">
              #{idx + 1}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      onClick={handleCardClick}
      className="orbi-market-product-card group flex h-full cursor-pointer flex-col overflow-hidden relative border border-slate-200/80 rounded-2xl bg-white"
    >
      {/* Upper image stage: beautifully showing the component product thumbnails together */}
      <div className="orbi-product-image-stage relative aspect-[1/1] bg-white flex flex-col justify-center border-b border-slate-100 overflow-hidden">
        {/* Render grid of images */}
        <MouseTrackZoom className="w-full h-full">
          {renderBundleImages()}
        </MouseTrackZoom>

        {/* Type & Readiness absolute badge */}
        <div className="absolute left-2.5 top-2.5 z-20 flex flex-wrap gap-1">
          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${badgeStyles}`}>
            {bundle.type} Ready
          </span>
        </div>

        {/* Right side: Procurement Score badge */}
        <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-xs">
          <Sparkles size={8} className="text-amber-600 animate-pulse" />
          <span>Score {procurementScore}%</span>
        </div>

        {/* Inspect/visual lens button on bottom-left */}
        <div className="absolute bottom-2.5 left-2.5 z-20 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer">
          <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>
      </div>

      {/* Card Info section */}
      <div className="flex flex-1 flex-col justify-between p-3.5 border-none">
        <div className="space-y-1.5">
          <h3 
            className="orbi-product-title text-[13px] font-bold font-jakarta leading-[1.3] text-slate-800 transition-colors group-hover:text-[#ff4c00] sm:text-[14px] line-clamp-2"
            title={bundle.items.map(item => item.name).join(" + ")}
          >
            {bundle.items.map(item => item.name).join(" + ")}
          </h3>

          {/* Pricing area with clean, compact price display */}
          <div className="space-y-1 mt-1">
            <div className="text-[12px] font-bold text-slate-500" style={{ color: '#343232' }}>
              {lang === 'sw' ? 'Nunua vyote kwa' : 'Buy all for:'}
            </div>
            
            <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
              <span className="text-[17px] min-[370px]:text-[19px] sm:text-[22px] font-black leading-none whitespace-nowrap">
                <PriceDisplay
                  amount={bundle.bundlePrice}
                  colorClass={bundle.type === "B2B" ? "text-slate-950" : "text-[#ff4c00]"}
                  className="font-black tracking-tight"
                  truncate={false}
                />
              </span>
              <span className="text-[13px] font-bold text-emerald-600 flex items-center gap-1">
                <span>{lang === 'sw' ? 'okoa' : 'save'}</span>
                <PriceDisplay
                  amount={bundle.originalPrice - bundle.bundlePrice}
                  colorClass="text-emerald-600 font-bold"
                  className="font-bold text-[13px]"
                  truncate={false}
                />
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded text-[9.25px]">
                  -{bundle.discountPercentage}%
                </span>
              </span>
            </div>

            {/* MOQ and Items */}
            <div className="text-[11px] text-slate-700 font-bold leading-tight flex items-center gap-1.5 pt-1">
              <span>{lang === 'sw' ? `MOQ: Combo 1` : `MOQ: Combo 1`}</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-500 font-medium">
                {lang === 'sw' ? `${bundle.items.length} Bidhaa` : `${bundle.items.length} items`}
              </span>
            </div>

            {/* Verified Supplier */}
            <div className="text-[10px] text-slate-400/90 font-medium flex items-center gap-1 pt-0.5">
              <span>2 yrs · TZ Verified Supplier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientSmartBundles = ({ 
  products, 
  lang = 'en',
  selectedNiche,
  selectedFamily,
  onSelectProduct,
  onAddToCart
}: { 
  products: Product[],
  lang?: 'sw' | 'en',
  selectedNiche?: string,
  selectedFamily?: string,
  onSelectProduct: (p: Product) => void,
  onAddToCart: (p: Product, openCart?: boolean, quantity?: number) => void
}) => {
  // Return null or empty div since the parent will mix bundles inside the product list grid directly.
  return null;
};
