import React, { useState, useMemo } from 'react';
import { SmartBundle, Product } from '../../types';
import { Plus, Trash2, Save, Package, AlertTriangle, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/storage';

export const SellerSmartBundles = ({ 
  sellerId, 
  products, 
  lang 
}: { 
  sellerId: string, 
  products: Product[],
  lang: 'sw' | 'en' 
}) => {
  const [bundles, setBundles] = useState<SmartBundle[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBundle, setNewBundle] = useState<Partial<SmartBundle>>({
    name: '',
    description: '',
    items: [],
    discountPercentage: 0,
    active: true
  });

  const sellerProducts = products.filter(p => p.sellerId === sellerId);

  // Dynamic calculations for the new bundle creation state
  const computedStats = useMemo(() => {
    let originalTotal = 0;
    let discountedTotal = 0;
    let anyBreaches = false;

    newBundle.items?.forEach(item => {
      const prod = sellerProducts.find(p => p.id === item.productId);
      if (prod) {
        const qty = Number(item.quantity) || 1;
        originalTotal += prod.price * qty;
        
        // Handle explicit custom discounted unit price, or default to 10% off
        const discountedUnitPrice = (item as any).discountedPrice !== undefined 
          ? Number((item as any).discountedPrice) 
          : Math.round(prod.price * 0.90);
        
        discountedTotal += discountedUnitPrice * qty;

        const walkAway = Number(prod.walkAwayPrice) || Math.round(prod.price * 0.75);
        if (discountedUnitPrice < walkAway) {
          anyBreaches = true;
        }
      }
    });

    const discountPercentage = originalTotal > 0 
      ? Math.round(((originalTotal - discountedTotal) / originalTotal) * 100)
      : 0;

    return {
      originalTotal,
      discountedTotal,
      discountPercentage,
      anyBreaches
    };
  }, [newBundle.items, sellerProducts]);

  const handleSave = async () => {
    if (!newBundle.name || !newBundle.items?.length) return;
    
    // Build items with proper type format
    const bundleItems = (newBundle.items || []).map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 1,
      discountedPrice: (item as any).discountedPrice !== undefined 
        ? Number((item as any).discountedPrice)
        : Math.round((sellerProducts.find(p => p.id === item.productId)?.price || 0) * 0.90)
    }));

    const bundle: SmartBundle = {
      id: `bundle-${Date.now()}`,
      sellerId,
      name: newBundle.name,
      description: newBundle.description,
      items: bundleItems,
      discountPercentage: computedStats.discountPercentage,
      active: newBundle.active ?? true,
      createdAt: Date.now()
    };
    
    setBundles([...bundles, bundle]);
    setIsCreating(false);
    setNewBundle({ name: '', description: '', items: [], discountPercentage: 0, active: true });
  };

  const addItem = (productId: string) => {
    if (!productId) return;
    const prod = sellerProducts.find(p => p.id === productId);
    const initialDiscounted = prod ? Math.round(prod.price * 0.90) : 0;
    
    setNewBundle(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId, quantity: 1, discountedPrice: initialDiscounted } as any]
    }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...(newBundle.items || [])];
    newItems[index].quantity = quantity;
    setNewBundle({ ...newBundle, items: newItems });
  };

  const updateItemDiscountedPrice = (index: number, discountedPrice: number) => {
    const newItems = [...(newBundle.items || [])];
    (newItems[index] as any).discountedPrice = discountedPrice;
    setNewBundle({ ...newBundle, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...(newBundle.items || [])];
    newItems.splice(index, 1);
    setNewBundle({ ...newBundle, items: newItems });
  };

  return (
    <div id="seller-smart-bundles-section" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="text-emerald-500" />
            {lang === 'sw' ? 'Mkusanyiko wa Bidhaa (Smart Bundles)' : 'Smart Bundles'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'sw' ? 'Uza bidhaa kwa pamoja na punguzo la bei lililohesabiwa salama.' : 'Group products together for a safe, dynamically computed package discount.'}
          </p>
        </div>
        {!isCreating && (
          <button 
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="inline-block w-4 h-4 mr-1" />
            {lang === 'sw' ? 'Tengeneza Mpya' : 'Create New'}
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-5">
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'sw' ? 'Jina la Mkusanyiko' : 'Bundle Name'}</label>
              <input 
                value={newBundle.name}
                onChange={e => setNewBundle({...newBundle, name: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                placeholder="e.g. Living Room Tech Combo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'sw' ? 'Maelezo' : 'Description'}</label>
              <input 
                value={newBundle.description || ''}
                onChange={e => setNewBundle({...newBundle, description: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                placeholder="e.g. Combined entertainment solution for office or living spaces"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">{lang === 'sw' ? 'Bidhaa za Kwenye Mkusanyiko' : 'Bundle Items'}</label>
            
            <div className="space-y-3">
              {newBundle.items?.map((item, idx) => {
                const prod = sellerProducts.find(p => p.id === item.productId);
                if (!prod) return null;
                const walkAway = prod.walkAwayPrice || Math.round(prod.price * 0.75);
                const currentDiscounted = (item as any).discountedPrice !== undefined 
                  ? Number((item as any).discountedPrice) 
                  : Math.round(prod.price * 0.90);
                const isBreached = currentDiscounted < walkAway;

                return (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-black text-slate-900 block">{prod.name}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {lang === 'sw' ? `Bei ya Kawaida: ${formatCurrency(prod.price)}` : `Standard Price: ${formatCurrency(prod.price)}`}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeItem(idx)} 
                        className="text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{lang === 'sw' ? 'Idadi ya Bidhaa (Quantity)' : 'Quantity'}</label>
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={e => updateItemQuantity(idx, Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          {lang === 'sw' ? 'Bei ya Mkusanyiko (Kwa Kila Kimoja)' : 'Bundle Unit Price (TZS)'}
                        </label>
                        <input 
                          type="number" 
                          value={currentDiscounted} 
                          onChange={e => updateItemDiscountedPrice(idx, Number(e.target.value))}
                          className={`w-full px-3 py-1.5 border rounded-lg bg-white outline-none ${isBreached ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'}`}
                          min="0"
                        />
                      </div>
                    </div>

                    {isBreached && (
                      <div className="text-rose-600 text-xs font-bold flex items-center gap-1 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100">
                        <AlertTriangle size={12} className="animate-pulse" />
                        <span>
                          {lang === 'sw' 
                            ? `⚠️ Imevuka bei ya chini salama ya ${formatCurrency(walkAway)}! Bei hii itakataliwa kwenye malipo ili kulinda faida yako.`
                            : `⚠️ Below safe merchant floor of ${formatCurrency(walkAway)}! This will be auto-rejected at checkout.`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-2">
              <select 
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-sm"
                onChange={e => {
                  addItem(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>{lang === 'sw' ? 'Chagua bidhaa ya kuongeza kwenye mkusanyiko...' : 'Select product to add to bundle...'}</option>
                {sellerProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Computed Bundle Metrics Summary Card */}
          {newBundle.items && newBundle.items.length > 0 && (
            <div className={`p-4 rounded-xl border ${computedStats.anyBreaches ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-emerald-50/40 border-emerald-200 text-emerald-950'}`}>
              <h5 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package size={14} className={computedStats.anyBreaches ? "text-amber-500" : "text-emerald-500"} />
                {lang === 'sw' ? 'Muhtasari wa Mkusanyiko wa Bei' : 'Calculated Package Summary'}
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>{lang === 'sw' ? 'Jumla ya Bei ya Kawaida:' : 'Total Standard Price:'}</span>
                  <span className="font-mono font-bold">{formatCurrency(computedStats.originalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'sw' ? 'Bei ya Mkusanyiko:' : 'Bundle Package Price:'}</span>
                  <span className="font-mono font-black text-[#ff4c00]">{formatCurrency(computedStats.discountedTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-dotted border-slate-300 pt-1 mt-1 font-bold">
                  <span>{lang === 'sw' ? 'Punguzo la Jumla lililokokotolewa:' : 'Derived Dynamic Discount:'}</span>
                  <span className="text-emerald-600 font-black">-{computedStats.discountPercentage}% OFF</span>
                </div>
              </div>

              {computedStats.anyBreaches && (
                <div className="mt-3 text-xs bg-white border border-amber-200 p-2.5 rounded-lg text-amber-700 space-y-1 shadow-2xs">
                  <span className="font-black flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" />
                    {lang === 'sw' ? 'Tahadhari ya Kuzuia Hasara!' : 'Margin Protection Active!'}
                  </span>
                  <p className="leading-relaxed">
                    {lang === 'sw'
                      ? 'Baadhi ya bidhaa katika mkusanyiko huu zimepangwa kwa bei ya chini kuliko kiwango salama (walk-away price). Tafadhali rekebisha ili kuhakikisha ununuzi unafanikiwa.'
                      : 'Some bundle elements fall below safe margins. Adjust unit prices to bypass automated checkout blockage.'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              {lang === 'sw' ? 'Ghairi' : 'Cancel'}
            </button>
            <button 
              type="button"
              disabled={computedStats.anyBreaches || !newBundle.items?.length}
              onClick={handleSave}
              className={`px-4 py-2 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${computedStats.anyBreaches || !newBundle.items?.length ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}
            >
              <Save size={16} />
              {lang === 'sw' ? 'Hifadhi' : 'Save Bundle'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
              {lang === 'sw' ? 'Hakuna mikusanyiko bado. Tengeneza moja ili kuongeza mauzo!' : 'No custom smart bundles created yet. Add one to accelerate sales volumes!'}
            </div>
          ) : (
            bundles.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition bg-slate-50/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{b.name}</h4>
                    {b.description && <p className="text-xs text-slate-500 mt-0.5">{b.description}</p>}
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-black">
                    -{b.discountPercentage}% OFF
                  </span>
                </div>
                <div className="text-xs text-slate-500 pt-1.5 border-t border-slate-100 mt-2 flex flex-wrap gap-2">
                  {b.items.map(i => {
                    const p = sellerProducts.find(prod => prod.id === i.productId);
                    const formattedPrice = (i as any).discountedPrice ? ` (${formatCurrency((i as any).discountedPrice)})` : '';
                    return (
                      <span key={i.productId} className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700 font-medium">
                        {i.quantity}x {p?.name || 'Item'}{formattedPrice}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
