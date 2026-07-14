const fs = require('fs');

const path = 'src/pages/ClientApp/components/ClientB2BDealRoomCard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the product mapping logic to ensure 3 items exactly
code = code.replace(/while \(displayItems\.length < 5\) \{/g, 'while (displayItems.length < 3) {');
code = code.replace(/return displayItems\.slice\(0, 5\)\.map/g, 'return displayItems.slice(0, 3).map');

// Replace the BRAND HEADER SPACE
const brandHeaderRegex = /\{\/\* 1\. BRAND HEADER SPACE \*\/\}.*?\{\/\* 2\. VALUE TRUST BADGES \*\/\}/s;
const newBrandHeader = `{/* 1. BRAND HEADER SPACE */}
      <div className="pt-6 px-6 pb-4">
        <h2 className="text-3xl font-extrabold text-[#0a1f44] tracking-tight font-sans">
          {lang === 'sw' ? 'Ofa ya Biashara (B2B)' : 'B2B Deal Room'}
        </h2>
      </div>

      {/* 2. VALUE TRUST BADGES */}`;
code = code.replace(brandHeaderRegex, newBrandHeader);

// Replace TRUST BADGES
const trustBadgesRegex = /\{\/\* 2\. VALUE TRUST BADGES \*\/\}.*?\{\/\* 3\. MULTIPLE CONNECTED PRODUCT STAGE \*\/\}/s;
const newTrustBadges = `{/* 2. VALUE TRUST BADGES */}
      <div className="px-6 pb-6 flex flex-wrap gap-3">
        <span className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-3.5 py-1.5 rounded-lg shadow-sm">
          <Shield size={16} className="text-emerald-600" />
          {lang === 'sw' ? 'Escrow Inalinda' : 'Escrow Protected'}
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-3.5 py-1.5 rounded-lg shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {lang === 'sw' ? 'Wauzaji Waliohakikiwa' : 'Verified Sellers'}
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-3.5 py-1.5 rounded-lg shadow-sm">
          <Truck size={16} className="text-blue-600" />
          {lang === 'sw' ? 'Mizigo ya Pamoja' : 'Combined Delivery'}
        </span>
      </div>

      {/* 3. MULTIPLE CONNECTED PRODUCT STAGE */}`;
code = code.replace(trustBadgesRegex, newTrustBadges);

// Adjust PRODUCT STAGE
const productStageRegex = /\{\/\* 3\. MULTIPLE CONNECTED PRODUCT STAGE \*\/\}.*?\{\/\* 4\. MID STATS BAR \*\/\}/s;
const newProductStage = `{/* 3. MULTIPLE CONNECTED PRODUCT STAGE */}
      <div className="px-6 py-2 flex items-center justify-between relative min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {orderedProductCards.map((pc, idx) => {
            const isRaised = idx === 1; // Middle item is always raised when there are 3
            return (
              <React.Fragment key={pc.product.id}>
                {/* Product Card Container */}
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isRaised ? 1.08 : 0.95, 
                    y: isRaised ? -10 : 0, 
                    zIndex: isRaised ? 20 : 10 
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => {
                    if (!isRaised) {
                      handleProductSwap(e, idx);
                    }
                  }}
                  className={\`flex-1 flex flex-col bg-white rounded-2xl overflow-hidden relative cursor-pointer group/product border \${
                    isRaised ? 'border-slate-200 shadow-xl' : 'border-slate-100 shadow-sm'
                  }\`}
                >
                  {/* Image Box */}
                  <div className="aspect-[4/3] w-full relative bg-slate-50 overflow-hidden">
                    <div className="h-full w-full transition-transform duration-500 ease-out group-hover/product:scale-[1.03]">
                      <ImageWithSkeleton
                        src={pc.product.images?.[0] || pc.product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
                        alt={pc.product.name}
                        className="h-full w-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>
                  </div>
                  
                  {/* Caption below image */}
                  <div className="p-3 flex flex-col justify-between items-start gap-2 bg-white h-[65px]">
                    <span className={\`text-xs font-bold text-slate-800 line-clamp-1 transition-colors \${isRaised ? 'sm:text-sm' : ''}\`}>
                      {pc.product.name}
                    </span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md self-end mt-auto">
                      Qty: {pc.qty}
                    </span>
                  </div>
                </motion.div>

                {/* Plus Connection Indicator */}
                {idx < 2 && (
                  <motion.div layout className="flex-shrink-0 z-30 -mx-4 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0a1f44] font-black text-lg">
                    +
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 4. MID STATS BAR */}`;
code = code.replace(productStageRegex, newProductStage);

// Adjust STATS BAR
const statsBarRegex = /\{\/\* 4\. MID STATS BAR \*\/\}.*?\{\/\* 5\. PRICING BREAKDOWN BOX \*\/\}/s;
const newStatsBar = `{/* 4. MID STATS BAR */}
      <div className="mx-6 mt-6 p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-4 gap-0 divide-x divide-slate-200 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 px-2">
          <Package size={24} className="text-[#1a56db]" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-lg font-black text-slate-800">{items.length}</span>
            <span className="text-xs font-medium text-slate-500">{lang === 'sw' ? 'Bidhaa' : 'Items'}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 px-2">
          <Users size={24} className="text-[#1a56db]" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-lg font-black text-slate-800">{vendorCount}</span>
            <span className="text-xs font-medium text-slate-500">{lang === 'sw' ? 'Wauzaji' : 'Vendors'}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 px-2">
          <Layers size={24} className="text-[#1a56db]" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-black text-slate-800">{lang === 'sw' ? 'Tayari' : 'Bulk'}</span>
            <span className="text-xs font-medium text-slate-500">Ready</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 px-2">
          <Tag size={24} className="text-orange-500" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-black text-slate-800">{lang === 'sw' ? 'Okoa' : 'Instant'}</span>
            <span className="text-xs font-medium text-slate-500">Savings</span>
          </div>
        </div>
      </div>

      {/* 5. PRICING BREAKDOWN BOX */}`;
code = code.replace(statsBarRegex, newStatsBar);

// Adjust PRICING BREAKDOWN
const pricingBreakdownRegex = /\{\/\* 5\. PRICING BREAKDOWN BOX \*\/\}.*?\{\/\* 6\. CALL TO ACTION ACTION BUTTON \*\/\}/s;
const newPricingBreakdown = `{/* 5. PRICING BREAKDOWN BOX */}
      <div className="mx-6 mt-4 p-5 bg-slate-50/50 border border-slate-200 rounded-2xl grid grid-cols-3 gap-0 divide-x divide-slate-200 text-center shadow-sm">
        {/* Protected Bundle Price */}
        <div className="flex flex-col items-center justify-center px-3">
          <span className="text-xs font-medium text-[#1a56db] mb-2">
            {lang === 'sw' ? 'Bei ya Kifurushi' : 'Protected Bundle Price'}
          </span>
          <span className="text-2xl font-bold text-[#1a56db] tracking-tight leading-none mb-2">
            TSh {bundle.bundlePrice.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <Shield size={12} className="text-emerald-500" /> Escrow Protected
          </span>
        </div>

        {/* Standard Price */}
        <div className="flex flex-col items-center justify-center px-3">
          <span className="text-xs font-medium text-slate-500 mb-2">
            {lang === 'sw' ? 'Bei ya Kawaida' : 'Standard Total'}
          </span>
          <span className="text-2xl font-normal text-slate-400 line-through tracking-tight leading-none mb-2">
            TSh {bundle.originalPrice.toLocaleString()}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {lang === 'sw' ? 'Bei ya Sokoni' : 'Market Price'}
          </span>
        </div>

        {/* You Save */}
        <div className="flex flex-col items-center justify-center px-3">
          <span className="text-xs font-medium text-orange-600 mb-2">
            {lang === 'sw' ? 'Unaokoa' : 'You Save'}
          </span>
          <span className="text-2xl font-bold text-orange-600 tracking-tight leading-none mb-2">
            TSh {(bundle.originalPrice - bundle.bundlePrice).toLocaleString()}
          </span>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
            -{bundle.discountPercentage}%
          </span>
        </div>
      </div>

      {/* 6. CALL TO ACTION ACTION BUTTON */}`;
code = code.replace(pricingBreakdownRegex, newPricingBreakdown);

// Adjust CTA
const ctaRegex = /\{\/\* 6\. CALL TO ACTION ACTION BUTTON \*\/\}.*?<\/motion\.div>/s;
const newCTA = `{/* 6. CALL TO ACTION ACTION BUTTON */}
      <div className="p-6 flex flex-col items-center gap-3 mt-auto">
        <button
          onClick={handleCardClick}
          className="w-full py-3.5 bg-[#0a2b66] hover:bg-[#071f4b] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg active:scale-[0.99] text-lg"
        >
          <span>{lang === 'sw' ? 'Fungua Ofa ya Biashara' : 'Open Deal Room'}</span>
          <ArrowRight size={20} />
        </button>
        {/* Secure subtext */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Shield size={14} className="text-blue-600" />
          <span>Secure. Transparent. Built for Business.</span>
        </div>
      </div>
    </motion.div>`;
code = code.replace(ctaRegex, newCTA);

fs.writeFileSync(path, code);
