import React, { useMemo, useState, useEffect } from 'react';
import { Product } from '../../../types';
import { SmartBundle } from './ClientSmartBundles';
import { 
  TrendingUp, 
  CheckCircle2, 
  Truck, 
  Package, 
  Users, 
  Layers, 
  Tag, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceDisplay } from '../../../components/PriceDisplay';
import { ImageWithSkeleton } from '../../../components/ImageWithSkeleton';
import { formatCurrency } from '../../../lib/storage';
import MouseTrackZoom from '../../../components/MouseTrackZoom';

interface ClientB2BDealRoomCardProps {
  bundle: SmartBundle;
  lang?: 'sw' | 'en';
  products: Product[];
  onSelectBundle?: (bundle: SmartBundle) => void;
}

export const ClientB2BDealRoomCard: React.FC<ClientB2BDealRoomCardProps> = ({
  bundle,
  lang = 'en',
  products,
  onSelectBundle
}) => {
  const items = useMemo(() => bundle.items || [], [bundle.items]);

  // Stable B2B countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState(() => {
    const idStr = String(bundle.id || 'bundle');
    const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Seed remaining time stably between 1h 15m (4500s) and 6h 15m (22500s)
    return 4500 + (hash % 18000);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return lang === 'sw' ? 'Muda Umekwisha' : 'Ended';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)}h:${pad(mins)}m:${pad(secs)}s`;
  };

  // Compute dynamic vendors count
  const vendorCount = useMemo(() => {
    return new Set(items.map(item => item.sellerId || 'unknown')).size;
  }, [items]);

  // Compute deal score
  const dealScore = useMemo(() => {
    return Math.min(
      98,
      72 + bundle.discountPercentage + Math.min(items.length * 3, 10)
    );
  }, [bundle.discountPercentage, items.length]);

  // Handle card click
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectBundle) {
      onSelectBundle(bundle);
    }
  };

  // Map products to appropriate visual cards
  const productCards = useMemo(() => {
    if (items.length === 0) return [];
    
    const displayItems: Product[] = [...items];
    while (displayItems.length < 3) {
      // Find a product that isn't already in displayItems, if possible
      const fallback = products.find(p => !displayItems.some(di => di.id === p.id));
      if (fallback) {
        displayItems.push(fallback);
      } else if (products.length > 0 && displayItems.length < products.length) {
        // Only if we actually have distinct products, we don't duplicate
        break;
      } else {
        break;
      }
    }

    return displayItems.map((item, idx) => {
      // Assign realistic wholesale quantity based on product type
      let qty = 10;
      const lowerName = item.name.toLowerCase();
      if (lowerName.includes('laptop') || lowerName.includes('simu') || lowerName.includes('phone') || lowerName.includes('tv')) {
        qty = idx === 1 ? 3 : 10;
      } else if (lowerName.includes('printer') || lowerName.includes('samani') || lowerName.includes('table') || lowerName.includes('chair')) {
        qty = 3;
      } else {
        qty = idx === 2 ? 50 : 25;
      }

      return {
        product: item,
        qty,
        label: item.name,
        originalIndex: idx + 1
      };
    });
  }, [items, products]);

  // If we can't formulate at least 1 product card, don't crash
  if (productCards.length === 0) return null;

  const [orderedProductCards, setOrderedProductCards] = useState(() => productCards.slice(0, 3));
  const [productOffset, setProductOffset] = useState(0);

  useEffect(() => {
    if (productCards.length === 0) return;
    const toShow = [];
    const maxItems = Math.min(3, productCards.length);
    for (let i = 0; i < maxItems; i++) {
      toShow.push(productCards[(productOffset + i) % productCards.length]);
    }
    setOrderedProductCards(toShow);
  }, [productCards, productOffset]);

  const handleProductSwap = (e: React.MouseEvent, clickedIndex: number) => {
    e.stopPropagation();
    const newCards = [...orderedProductCards];
    const centerIndex = Math.floor(newCards.length / 2);
    
    // Swap center and clicked
    const temp = newCards[centerIndex];
    newCards[centerIndex] = newCards[clickedIndex];
    newCards[clickedIndex] = temp;
    
    setOrderedProductCards(newCards);
  };

  const handleForwardPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProductOffset(prev => (prev + 1) % productCards.length);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      className="orbi-b2b-deal-room-card group cursor-pointer relative transition-all duration-300 overflow-hidden flex flex-col h-[472px] mx-auto lg:mx-0"
      whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
      style={{ backgroundColor: '#ffffff', borderStyle: 'none', width: '100%', maxWidth: '349px', borderRadius: '20px', height: '472px' }}
    >
      {/* 1. PRODUCT IMAGES (Compact) */}
      <div className="px-4 py-5 flex items-center justify-center relative" style={{ backgroundColor: '#ffffff', borderRadius: '20px' }}>
        {/* Subtle Countdown Timer Pill */}
        <div 
          className="absolute top-2.5 right-2.5 z-40 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-150 flex items-center gap-1 shadow-xs select-none"
          title={lang === 'sw' ? 'Muda uliobaki kabla ya ofa kuisha' : 'Time remaining before offer ends'}
        >
          <Clock size={11} className="text-rose-500 animate-pulse shrink-0" />
          <span className="font-mono tabular-nums leading-none">{formatCountdown(timeLeft)}</span>
        </div>

        <AnimatePresence mode="popLayout">
          {orderedProductCards.flatMap((pc, idx) => {
            const isRaised = idx === 1; // Middle item
            const card = (
                <motion.div 
                  key={`card-${pc.product.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0, 
                    zIndex: isRaised ? 20 : 10 
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 25 },
                    opacity: { duration: 0.3 }
                  }}
                  onClick={(e) => {
                    if (!isRaised) {
                      handleProductSwap(e, idx);
                    }
                  }}
                  className={`${isRaised ? 'flex-[2.7] z-20' : 'flex-[0.8] opacity-70 z-10'} flex flex-col bg-white rounded-xl overflow-hidden relative cursor-pointer group/product border-none transition-all duration-300`}
                >
                  <div className="aspect-square w-full relative bg-slate-50 overflow-hidden">
                    {productCards.length > 1 && (
                      <div className="absolute top-1.5 left-1.5 z-10 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm pointer-events-none">
                        {pc.originalIndex}/{productCards.length}
                      </div>
                    )}
                    <MouseTrackZoom className="w-full h-full">
                      <ImageWithSkeleton
                        src={pc.product.images?.[0] || pc.product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
                        alt={pc.product.name}
                        className="h-full w-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </MouseTrackZoom>
                  </div>
                  <div className="p-1.5 flex flex-col items-center bg-white border-t border-slate-50 h-[42px] justify-center">
                    <span className="text-[10px] font-bold text-slate-800 line-clamp-1 text-center w-full leading-tight">
                      {pc.product.name}
                    </span>
                    <span className="text-[#1a56db] text-[9px] font-bold mt-0.5">
                      Qty: {pc.qty}
                    </span>
                  </div>
                </motion.div>
            );

            const plus = idx < 2 ? (
                  <motion.div 
                    key={`plus-${pc.product.id}`}
                    layout
                    className="flex-shrink-0 z-30 -mx-2 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#0a1f44] font-bold text-[10px]"
                  >
                    +
                  </motion.div>
            ) : null;
            
            const forwardArrow = (idx === 2 && productCards.length > 3) ? (
                  <motion.div 
                    key={`forward-${pc.product.id}`}
                    layout
                    onClick={handleForwardPreview}
                    className="cursor-pointer flex-shrink-0 z-30 h-6 w-6 rounded-full shadow-sm flex items-center justify-center font-bold hover:bg-slate-100 transition-colors"
                    style={{
                      marginLeft: '7px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      fontSize: '17px',
                    }}
                  >
                    <ChevronRight size={19} className="stroke-[2.5]" />
                  </motion.div>
            ) : null;

            const elements = [card];
            if (plus) elements.push(plus);
            if (forwardArrow) elements.push(forwardArrow);
            
            return elements;
          })}
        </AnimatePresence>
      </div>

      {/* 3. MID STATS ROW (Compact) */}
      <div className="px-5 py-3 flex items-center justify-between text-center bg-white" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-slate-800">{items.length}</span>
          <span className="text-[10px] font-medium text-slate-500">{lang === 'sw' ? 'Bidhaa' : 'Items'}</span>
        </div>
        <div className="w-px h-6 bg-slate-200"></div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-slate-800">{vendorCount}</span>
          <span className="text-[10px] font-medium text-slate-500">{lang === 'sw' ? 'Wauzaji' : 'Vendors'}</span>
        </div>
        <div className="w-px h-6 bg-slate-200"></div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-orange-600">-{bundle.discountPercentage}%</span>
          <span className="text-[10px] font-bold text-orange-600">{lang === 'sw' ? 'Punguzo' : 'Discount'}</span>
        </div>
      </div>

      {/* 4. PRICING ROW (Compact) */}
      <div className="px-5 pt-4 pb-3 flex items-end justify-between mt-auto" style={{ backgroundColor: '#ededed', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 mb-0.5">
            {lang === 'sw' ? 'Bei Sokoni' : 'Market Price'}
          </span>
          <PriceDisplay amount={bundle.originalPrice} size="sm" className="line-through text-slate-400 font-medium" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-[#1a56db] mb-0.5 flex items-center gap-1">
            <Tag size={10} />
            {lang === 'sw' ? 'Bei ya B2B' : 'B2B Price'}
          </span>
          <PriceDisplay amount={bundle.bundlePrice} size="xl" className="text-[#0a1f44] tracking-tight leading-none" />
        </div>
      </div>

      {/* 5. CALL TO ACTION BUTTON */}
      <div className="px-5 pb-5" style={{ backgroundColor: '#ededed', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        <button
          onClick={handleCardClick}
          className="w-full py-2.5 bg-[#0a1f44] hover:bg-[#071633] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-sm shadow-sm active:scale-95"
        >
          <span>{lang === 'sw' ? 'Fungua Ofa ya Biashara' : 'Open Deal Room'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};
