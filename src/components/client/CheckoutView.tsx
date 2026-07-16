import React, { useEffect, useMemo, useState } from "react";
import { X, ArrowLeft, ShieldCheck, Zap, Info, ChevronRight, CheckCircle2, MapPin, Phone, User as UserIcon, Tag, CreditCard, Lock, ArrowRight, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PriceDisplay } from "../PriceDisplay";
import { formatCurrency } from "../../lib/storage";
import { db } from "../../lib/db";
import type { DeliveryQuote, DeliveryZone, GooglePlaceDetails } from "../../types";
import { DEFAULT_DELIVERY_ZONES, formatDeliveryDays, getDeliveryZoneName, normalizeDeliveryZones } from "../../lib/deliveryZones";
import { useDialog } from "../CustomDialogContext";
import { ImageWithSkeleton } from "../ImageWithSkeleton";
import { GooglePlacePicker } from "../GooglePlacePicker";

interface CheckoutViewProps {
  showCheckout: boolean;
  setShowCheckout: (v: boolean) => void;
  cart: any[];
  lang: string;
  user: any;
  coupons: any[];
  getProductPriceForQty: (p: any, q: number) => number;
  handlePlaceOrder: (details: any) => Promise<void>;
  globalSettings: any;
  t: (k: string) => string;
}

export function CheckoutView({
  showCheckout,
  setShowCheckout,
  cart,
  lang,
  user,
  coupons,
  getProductPriceForQty,
  handlePlaceOrder,
  globalSettings,
  t
}: CheckoutViewProps) {
  const { showAlert } = useDialog();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    tin: user?.tin || "",
    paymentMethod: "escrow",
    couponCode: ""
  });
  const [touched, setTouched] = useState({ name: false, phone: false, address: false });
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceDetails | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
  const [selectedDeliveryZoneId, setSelectedDeliveryZoneId] = useState(DEFAULT_DELIVERY_ZONES[0].id);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);
  const selectedDeliveryZone = useMemo(() => {
    return normalizeDeliveryZones(deliveryZones).find((zone) => zone.id === selectedDeliveryZoneId) || normalizeDeliveryZones(deliveryZones)[0];
  }, [deliveryZones, selectedDeliveryZoneId]);

  const hasWholesaleItems = useMemo(() => {
    return cart.some(item => item.product?.wholesaleTiers && item.product.wholesaleTiers.length > 0);
  }, [cart]);

  const getErrors = () => {
    const errs: any = {};
    if (!details.name.trim()) {
      errs.name = lang === "sw" ? "Jina linahitajika" : "Name is required";
    } else if (details.name.trim().length < 3) {
      errs.name = lang === "sw" ? "Jina lazima liwe na herufi 3 au zaidi" : "Name must be at least 3 characters";
    }

    if (!details.phone.trim()) {
      errs.phone = lang === "sw" ? "Namba ya simu inahitajika" : "Phone number is required";
    } else if (!/^(\+?\d{9,15})$/.test(details.phone.trim().replace(/\s/g, ''))) {
      errs.phone = lang === "sw" ? "Weka namba ya simu iliyo sahihi" : "Enter a valid phone number";
    }

    if (!details.address.trim()) {
      errs.address = lang === "sw" ? "Anwani inahitajika" : "Address is required";
    } else if (details.address.trim().length < 5) {
      errs.address = lang === "sw" ? "Tafadhali weka anwani kamili" : "Please enter a complete address";
    }
    return errs;
  };
  const currentErrors = getErrors();
  const isValid = Object.keys(currentErrors).length === 0;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const subtotal = cart.reduce((sum, item) => {
    const actualPrice = getProductPriceForQty(item.product, item.quantity);
    return sum + (actualPrice * item.quantity);
  }, 0);

  const discount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage / 100) : 0;
  const hasLiveDeliveryQuote = Boolean(deliveryQuote && deliveryQuote.available);
  const deliveryFee = hasLiveDeliveryQuote ? Number(deliveryQuote?.totalFee || 0) : 0;
  const total = subtotal - discount + deliveryFee;

  useEffect(() => {
    let active = true;
    db.getDeliveryZones()
      .then((zones) => {
        if (!active) return;
        const normalized = normalizeDeliveryZones(zones);
        setDeliveryZones(normalized);
        setSelectedDeliveryZoneId((current) => normalized.some((zone) => zone.id === current) ? current : normalized[0].id);
      })
      .catch(() => {
        if (active) setDeliveryZones(DEFAULT_DELIVERY_ZONES);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedDeliveryZoneId || cart.length === 0) {
      setDeliveryQuote(null);
      return () => {
        active = false;
      };
    }

    setDeliveryQuoteLoading(true);
    const destination = selectedPlace && selectedPlace.lat && selectedPlace.lng
      ? { lat: selectedPlace.lat, lng: selectedPlace.lng, address: selectedPlace.formattedAddress || selectedPlace.name, placeId: selectedPlace.placeId }
      : undefined;
    db.getDeliveryQuote({
      zoneId: selectedDeliveryZoneId,
      lang,
      destination,
      cart: cart.map((item: any) => ({
        productId: item.product?.id,
        quantity: parseInt(item.quantity, 10) || 1,
      })),
      applyInsurance: false,
      shippingType: selectedShippingOptionId || undefined,
    })
      .then((quote) => {
        if (active) {
          setDeliveryQuote(quote);
          if (!selectedShippingOptionId && quote?.shippingPlan?.recommended) {
            setSelectedShippingOptionId(quote.shippingPlan.recommended.id);
          }
        }
      })
      .catch((error) => {
        console.warn("Delivery quote failed, using fallback zone fee:", error);
        if (active) setDeliveryQuote(null);
      })
      .finally(() => {
        if (active) setDeliveryQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDeliveryZoneId, cart, lang, selectedPlace, selectedShippingOptionId]);

  const validateCoupon = () => {
    const found = coupons.find(c => c.code === details.couponCode && c.active);
    if (found) {
      setAppliedCoupon(found);
    } else {
      showAlert(lang === "sw" ? "Kuponi hii si sahihi au imekwisha muda wake." : "Invalid or expired coupon code.", "error");
    }
  };

  const onSubmit = async () => {
    setIsOrdering(true);
    try {
      if (deliveryQuote && !deliveryQuote.available) {
        throw new Error(lang === "sw" ? "Baadhi ya bidhaa hazifiki eneo ulilochagua." : "Some items cannot be delivered to the selected zone.");
      }
      if (!hasLiveDeliveryQuote) {
        throw new Error(
          lang === "sw"
            ? "Chagua eneo halisi kupitia Google Maps ili mfumo ukokotoe delivery route na gharama sahihi."
            : "Select an exact Google Maps location so the system can calculate the delivery route and fee.",
        );
      }
      await handlePlaceOrder({
        ...details,
        destination: selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng, address: selectedPlace.formattedAddress, placeId: selectedPlace.placeId } : undefined,
        cart,
        appliedCoupon,
        finalTotal: total,
        deliveryZone: {
          id: selectedDeliveryZone.id,
          name: deliveryQuote?.zoneName || getDeliveryZoneName(selectedDeliveryZone, lang),
          price: deliveryFee,
          minDays: selectedDeliveryZone.minDays,
          maxDays: selectedDeliveryZone.maxDays,
          eta: deliveryQuote?.eta || "",
        },
        deliveryFee,
        deliveryQuote,
        applyInsurance: false,
        deliveryEta: deliveryQuote?.eta || "",
        operation: details.paymentMethod === "escrow" ? "paysafe" : "cash_on_delivery",
        paymentCategory: details.paymentMethod === "escrow" ? "orbi" : undefined,
        paymentRail: details.paymentMethod === "escrow" ? "orbi_wallet" : undefined
      });
      setShowCheckout(false);
    } catch (err: any) {
      showAlert(err.message, "error");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <AnimatePresence>
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
          >
            <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full z-10 transition-colors">
              <X size={20} />
            </button>

            {/* Left: Summary (Mobile: Bottom, Desktop: Left) */}
            <div className="w-full md:w-[350px] bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  {lang === "sw" ? "Muhtasari wa Oda" : "Order Summary"}
                </h3>
                
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                  {cart.map((item, i) => {
                    const price = getProductPriceForQty(item.product, item.quantity);
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0">
                          <ImageWithSkeleton
                            src={item.product.images?.[0]}
                            alt=""
                            containerClassName="w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.quantity} x {formatCurrency(price)}</p>
                        </div>
                        <div className="text-xs font-black text-slate-700">
                          {formatCurrency(price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasWholesaleItems && (
                  <div className="mt-4 p-4.5 bg-amber-50/90 border-l-4 border-amber-500 rounded-r-2xl shadow-xs space-y-2 text-slate-800">
                    <div className="flex items-center gap-2">
                      <Lock size={15} className="text-amber-600 shrink-0" />
                      <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                        {lang === "sw" ? "Bidhaa za Jumla Zimefungwa" : "Wholesale Items Locked"}
                      </p>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-600">
                      {lang === "sw"
                        ? "Marekebisho au kufuta bidhaa za jumla kumefungwa wakati wa malipo. Bidhaa hizi zimewekewa viwango vya MOQ (Idadi ya Chini) na haziwezi kushindana na bei au idadi za reja-reja (retail sales)."
                        : "Wholesale products in this order are locked at wholesale bulk quantity and cannot be modified or deleted during checkout. Because wholesale items are sold at highly discounted bulk rates, they require minimum order quantities and cannot compete with retail pricing."}
                    </p>
                  </div>
                )}

                <div className="mt-8 space-y-4">
                  <div className="relative group">
                    <input
                      type="text"
                      value={details.couponCode}
                      onChange={(e) => setDetails({ ...details, couponCode: e.target.value })}
                      placeholder={lang === "sw" ? "Nambari ya Punguzo" : "Promo Code"}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                    <button 
                      onClick={validateCoupon}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Tag size={14} className="animate-bounce" />
                        <span className="text-xs font-black">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {lang === "sw" ? "Eneo la Usafirishaji" : "Delivery zone"}
                    </label>
                    <select
                      value={selectedDeliveryZoneId}
                      onChange={(e) => setSelectedDeliveryZoneId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 outline-none focus:border-primary"
                    >
                      {normalizeDeliveryZones(deliveryZones).map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {getDeliveryZoneName(zone, lang)} · {formatDeliveryDays(zone, lang)} · {formatCurrency(zone.price)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-[10px] font-bold text-slate-500">
                      {deliveryQuoteLoading
                        ? (lang === "sw" ? "Inahesabu usafirishaji..." : "Calculating delivery...")
                        : hasLiveDeliveryQuote
                          ? `${deliveryQuote?.selectedShippingType?.label || deliveryQuote?.zoneName || getDeliveryZoneName(selectedDeliveryZone, lang)} · ${deliveryQuote?.eta || ""} · ${formatCurrency(deliveryFee)}`
                          : (lang === "sw" ? "Delivery ya sasa inahitaji eneo halisi la Google Maps." : "Current delivery pricing requires an exact Google Maps location.")}
                    </p>
                    {deliveryQuote?.shippingPlan?.shippingOptions && deliveryQuote.shippingPlan.shippingOptions.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {lang === "sw" ? "Aina ya Usafirishaji" : "Shipping Method"}
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {deliveryQuote.shippingPlan.shippingOptions.map((opt: any) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedShippingOptionId(opt.id)}
                              className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${selectedShippingOptionId === opt.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 bg-white hover:border-primary/30"}`}
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{opt.label}</p>
                                {opt.eta && <p className="text-[10px] text-slate-500">{opt.eta}</p>}
                              </div>
                              {opt.fee !== undefined ? (
                                <p className="text-sm font-black text-primary">{formatCurrency(opt.fee)}</p>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    
                    {deliveryQuote?.shippingPlan?.message ? (
                      <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] font-bold text-blue-800">
                        {deliveryQuote.shippingPlan.message}
                      </div>
                    ) : null}
                    {deliveryQuote?.unavailableItems?.length ? (
                      <div className="mt-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[11px] font-bold text-rose-700">
                        {lang === "sw" ? "Hazifiki eneo hili:" : "Unavailable for this zone:"}{" "}
                        {deliveryQuote.unavailableItems.map((item) => item.name).join(", ")}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-200/50">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-600">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Delivery</span>
                  <span className="text-slate-600">{deliveryQuoteLoading ? "..." : formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-slate-900 uppercase">{lang === "sw" ? "Jumla Kuu" : "Grand Total"}</span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary leading-none">{formatCurrency(total)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Tanzanian Shillings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Steps */}
            <div className="flex-1 p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                      {step > s ? <CheckCircle2 size={14} /> : s}
                    </div>
                    {s < 3 && <div className={`w-8 sm:w-12 h-1 rounded-full transition-all ${step > s ? "bg-primary" : "bg-slate-100"}`} />}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lang === "sw" ? "Maelezo ya Usafirishaji" : "Shipping Details"}</h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">{lang === "sw" ? "Tafadhali jaza mahali bidhaa ipelekwe" : "Where should we deliver your products?"}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === "sw" ? "Jina Kamili" : "Full Name"}</label>
                      <div className="relative">
                        <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${touched.name && currentErrors.name ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                        <input
                          type="text"
                          name="checkout_name"
                          autoComplete="name"
                          value={details.name}
                          onBlur={() => handleBlur('name')}
                          onChange={(e) => setDetails({ ...details, name: e.target.value })}
                          placeholder="John Doe"
                          className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:bg-white transition-all outline-none ${touched.name && currentErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                        />
                      </div>
                      {touched.name && currentErrors.name && (
                        <p className="text-[11px] text-red-500 font-medium mt-1 ml-1 flex items-center gap-1"><Info size={12}/> {currentErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === "sw" ? "Namba ya Simu" : "Phone Number"}</label>
                      <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${touched.phone && currentErrors.phone ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                        <input
                          type="tel"
                          name="checkout_phone"
                          autoComplete="tel"
                          value={details.phone}
                          onBlur={() => handleBlur('phone')}
                          onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                          placeholder="+255 000 000 000"
                          className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:bg-white transition-all outline-none ${touched.phone && currentErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                        />
                      </div>
                      {touched.phone && currentErrors.phone && (
                        <p className="text-[11px] text-red-500 font-medium mt-1 ml-1 flex items-center gap-1"><Info size={12}/> {currentErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === "sw" ? "Anwani ya Makazi/Ofisi" : "Delivery Address"}</label>
                    <GooglePlacePicker
                      lang={lang as any}
                      value={details.address}
                      selectedPlace={selectedPlace}
                      onAddressChange={(value) => {
                        setDetails({ ...details, address: value });
                        setTouched({ ...touched, address: true });
                      }}
                      onPlaceSelect={(place) => setSelectedPlace(place)}
                      placeholder="e.g. Mwanza, Rock City, Mtaa wa Pamba"
                      error={touched.address && currentErrors.address ? currentErrors.address : undefined}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      setTouched({ name: true, phone: true, address: true });
                      if (isValid) setStep(2);
                    }}
                    disabled={(!isValid && (touched.name && touched.phone && touched.address)) || deliveryQuoteLoading || Boolean(deliveryQuote?.unavailableItems?.length)}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>{lang === "sw" ? "Endelea na Malipo" : "Continue to Payment"}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lang === "sw" ? "Njia ya Malipo" : "Payment Method"}</h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">{lang === "sw" ? "Chagua jinsi ungependa kulipia oda yako" : "Select how you would like to pay"}</p>
                  </div>

                  <div className="space-y-3">
                    <label className={`block w-full p-5 border-2 rounded-2xl transition-all cursor-pointer ${details.paymentMethod === 'escrow' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input type="radio" className="hidden" checked={details.paymentMethod === 'escrow'} onChange={() => setDetails({ ...details, paymentMethod: 'escrow' })} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${details.paymentMethod === 'escrow' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                          <ShieldCheck size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800">Orbi PaySafe Escrow</h4>
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Recommended</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Safest way to pay. Funds held until delivery is confirmed.</p>
                        </div>
                      </div>
                    </label>

                    <label className={`block w-full p-5 border-2 rounded-2xl transition-all cursor-pointer ${details.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input type="radio" className="hidden" checked={details.paymentMethod === 'cod'} onChange={() => setDetails({ ...details, paymentMethod: 'cod' })} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${details.paymentMethod === 'cod' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                          <CreditCard size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-slate-800">Cash on Delivery (Lipa Unapopokea)</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Pay the courier directly in cash when you receive the items.</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="px-6 py-4 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider transition-all">Back</button>
                    <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-primary transition-all active:scale-95">
                      <span>Review Order</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lang === "sw" ? "Hakiki & Maliza" : "Review & Finish"}</h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">{lang === "sw" ? "Hakiki taarifa zako kabla ya kuweka oda" : "Double check everything before placing your order"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "sw" ? "Mteja" : "Customer"}</p>
                      <p className="text-sm font-bold text-slate-800">{details.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{details.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "sw" ? "Mahali" : "Shipping To"}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{details.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "sw" ? "Malipo" : "Payment"}</p>
                      <p className="text-sm font-bold text-slate-800 uppercase">{details.paymentMethod === 'escrow' ? 'Orbi PaySafe' : 'Cash on Delivery'}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800">{lang === "sw" ? "Malipo Salama Yamewashwa" : "Secure Checkout Guaranteed"}</h4>
                      <p className="text-xs text-emerald-600 font-medium mt-1 leading-relaxed">
                        {details.paymentMethod === 'escrow' 
                          ? "Your money is protected by Orbi Shop Escrow. We only pay the seller after you confirm delivery."
                          : "Pay safely in person. Check your items before handing over the cash."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} disabled={isOrdering} className="px-6 py-4 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50">Back</button>
                    <button 
                      onClick={onSubmit}
                      disabled={isOrdering || deliveryQuoteLoading || Boolean(deliveryQuote?.unavailableItems?.length)}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-orange-100 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isOrdering ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{lang === "sw" ? "Thibitisha Oda" : "Place Your Order"}</span>
                          <CheckCircle2 size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
