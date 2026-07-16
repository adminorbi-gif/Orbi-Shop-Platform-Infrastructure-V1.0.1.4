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
          const options = quote?.shippingPlan?.shippingOptions || [];
          const isSelectedValid = options.some((opt: any) => opt.id === selectedShippingOptionId);
          if ((!selectedShippingOptionId || !isSelectedValid) && quote?.shippingPlan?.recommended) {
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
            ? "Chagua eneo halisi kupitia Google Maps au andika anwani yako ili mfumo ukokotoe route sahihi."
            : "Select an exact Google Maps location or enter your address so the system can calculate the live route.",
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
            <div className="w-full md:w-[350px] bg-slate-50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  {lang === "sw" ? "Muhtasari wa Oda" : "Order Summary"}
                </h3>
                
                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 no-scrollbar">
                  {cart.map((item, i) => {
                    const price = getProductPriceForQty(item.product, item.quantity);
                    return (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0">
                          <ImageWithSkeleton
                            src={item.product.images?.[0]}
                            alt=""
                            containerClassName="w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{item.quantity} x {formatCurrency(price)}</p>
                        </div>
                        <div className="text-xs font-black text-slate-700 shrink-0">
                          {formatCurrency(price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasWholesaleItems && (
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl space-y-1 text-slate-800 animate-in zoom-in-95">
                    <div className="flex items-center gap-1.5">
                      <Lock size={13} className="text-amber-600 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        {lang === "sw" ? "Bidhaa za Jumla Zimefungwa" : "Wholesale Locked"}
                      </p>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-slate-600">
                      {lang === "sw"
                        ? "Marekebisho yamefungwa kwa bei ya jumla na MOQ."
                        : "Locked at wholesale rate and minimum order quantity."}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={details.couponCode}
                      onChange={(e) => setDetails({ ...details, couponCode: e.target.value })}
                      placeholder={lang === "sw" ? "Nambari ya Punguzo" : "Promo Code"}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-16 py-2.5 text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                    <button 
                      onClick={validateCoupon}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between animate-in zoom-in-95">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <Tag size={13} className="animate-bounce" />
                        <span className="text-xs font-black">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-200/50 mt-6">
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
                  <span className="text-slate-600">
                    {deliveryQuoteLoading ? (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded animate-pulse">Calculating...</span>
                    ) : (
                      formatCurrency(deliveryFee)
                    )}
                  </span>
                </div>
                {hasLiveDeliveryQuote && deliveryQuote?.eta && (
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 -mt-1 bg-slate-100/60 p-1.5 rounded-lg">
                    <span>ETA:</span>
                    <span>{deliveryQuote.eta}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-slate-900 uppercase">{lang === "sw" ? "Jumla Kuu" : "Grand Total"}</span>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary leading-none">{formatCurrency(total)}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">TZS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Steps */}
            <div className="flex-1 p-6 md:p-10 flex flex-col justify-between">
              {/* Step indicator header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {lang === "sw" ? `Hatua ${step} kati ya 2` : `Step ${step} of 2`}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2].map((s) => (
                    <div 
                      key={s} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? "w-8 bg-primary" : "w-3 bg-slate-200"}`} 
                    />
                  ))}
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {lang === "sw" ? "Maelezo ya Usafirishaji" : "Shipping & Delivery"}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {lang === "sw" ? "Tafadhali jaza jina, simu na eneo kamili" : "Please provide your contact and exact delivery spot."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "sw" ? "Jina Kamili" : "Full Name"}
                      </label>
                      <div className="relative">
                        <UserIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${touched.name && currentErrors.name ? 'text-red-400' : 'text-slate-400'}`} size={15} />
                        <input
                          type="text"
                          name="checkout_name"
                          autoComplete="name"
                          value={details.name}
                          onBlur={() => handleBlur('name')}
                          onChange={(e) => setDetails({ ...details, name: e.target.value })}
                          placeholder="John Doe"
                          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:bg-white transition-all outline-none ${touched.name && currentErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                        />
                      </div>
                      {touched.name && currentErrors.name && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 ml-1 flex items-center gap-1"><Info size={11}/> {currentErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "sw" ? "Namba ya Simu" : "Phone Number"}
                      </label>
                      <div className="relative">
                        <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${touched.phone && currentErrors.phone ? 'text-red-400' : 'text-slate-400'}`} size={15} />
                        <input
                          type="tel"
                          name="checkout_phone"
                          autoComplete="tel"
                          value={details.phone}
                          onBlur={() => handleBlur('phone')}
                          onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                          placeholder="+255 000 000 000"
                          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:bg-white transition-all outline-none ${touched.phone && currentErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                        />
                      </div>
                      {touched.phone && currentErrors.phone && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 ml-1 flex items-center gap-1"><Info size={11}/> {currentErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Delivery Zone selector right beside address picker */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "sw" ? "Mkoa / Kanda" : "Region / Zone"}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <select
                          value={selectedDeliveryZoneId}
                          onChange={(e) => setSelectedDeliveryZoneId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:bg-white transition-all outline-none text-slate-700 focus:border-primary"
                        >
                          {normalizeDeliveryZones(deliveryZones).map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {getDeliveryZoneName(zone, lang)} ({formatDeliveryDays(zone, lang)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "sw" ? "Anwani ya Google Maps (Uwasilishaji Halisi)" : "Google Maps Spot (Exact Delivery)"}
                      </label>
                      <GooglePlacePicker
                        lang={lang as any}
                        value={details.address}
                        selectedPlace={selectedPlace}
                        onAddressChange={(value) => {
                          setDetails({ ...details, address: value });
                          setTouched({ ...touched, address: true });
                        }}
                        onPlaceSelect={(place) => setSelectedPlace(place)}
                        placeholder={lang === "sw" ? "Tafuta eneo halisi (Kibiti, nk)..." : "Search specific spot (e.g., Kibiti)..."}
                        error={touched.address && currentErrors.address ? currentErrors.address : undefined}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* Shipping Options directly in Step 1 below details */}
                  {deliveryQuote?.shippingPlan?.shippingOptions && deliveryQuote.shippingPlan.shippingOptions.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "sw" ? "Chagua Njia ya Usafirishaji" : "Select Shipping Method"}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {deliveryQuote.shippingPlan.shippingOptions.map((opt: any) => {
                          const isSelected = selectedShippingOptionId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedShippingOptionId(opt.id)}
                              className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 bg-white hover:border-slate-300"}`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                                  <Zap size={12} className={isSelected ? "text-primary" : "text-slate-400"} />
                                  {opt.label}
                                </p>
                                {opt.eta && <p className="text-[10px] text-slate-500 mt-0.5">{opt.eta}</p>}
                              </div>
                              {opt.fee !== undefined && (
                                <p className="text-xs font-black text-primary shrink-0 ml-2">{formatCurrency(opt.fee)}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message / warnings from delivery engine */}
                  {deliveryQuote?.shippingPlan?.message && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] font-bold text-blue-800 flex gap-2 items-start">
                      <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <span>{deliveryQuote.shippingPlan.message}</span>
                    </div>
                  )}

                  {deliveryQuote?.unavailableItems?.length ? (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 text-[11px] font-bold text-rose-700 flex gap-2 items-start">
                      <X size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        {lang === "sw" ? "Baadhi ya bidhaa hazifiki eneo hili:" : "Some items cannot reach this zone:"}{" "}
                        {deliveryQuote.unavailableItems.map((item) => item.name).join(", ")}
                      </div>
                    </div>
                  ) : null}

                  <button 
                    onClick={() => {
                      setTouched({ name: true, phone: true, address: true });
                      if (isValid) {
                        if (!selectedPlace) {
                          showAlert(
                            lang === "sw"
                              ? "Tafadhali chagua eneo sahihi kutoka kwa mapendekezo ya Google Maps ili kuhakikisha huduma na gharama sahihi."
                              : "Please select an address from Google Maps suggestions to ensure accurate delivery routing.",
                            "warning"
                          );
                          return;
                        }
                        setStep(2);
                      }
                    }}
                    disabled={(!isValid && (touched.name && touched.phone && touched.address)) || deliveryQuoteLoading || Boolean(deliveryQuote?.unavailableItems?.length)}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-98 disabled:opacity-50 mt-4 shadow-sm"
                  >
                    <span>{lang === "sw" ? "Endelea na Malipo" : "Continue to Payment"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {lang === "sw" ? "Njia ya Malipo & Uhakiki" : "Payment & Final Review"}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {lang === "sw" ? "Chagua malipo na uhakiki taarifa zako" : "Select payment method and verify details before ordering"}
                    </p>
                  </div>

                  {/* Payment option cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`block p-4 border-2 rounded-xl transition-all cursor-pointer ${details.paymentMethod === 'escrow' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input type="radio" className="hidden" checked={details.paymentMethod === 'escrow'} onChange={() => setDetails({ ...details, paymentMethod: 'escrow' })} />
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${details.paymentMethod === 'escrow' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                          <ShieldCheck size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-black text-slate-800">Orbi PaySafe</h4>
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1 py-0.5 rounded uppercase">Salama</span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tight">
                            {lang === "sw" ? "Lipa sasa, pesa inashikiliwa mpaka upokee" : "Pay now, funds held until delivery is verified"}
                          </p>
                        </div>
                      </div>
                    </label>

                    <label className={`block p-4 border-2 rounded-xl transition-all cursor-pointer ${details.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input type="radio" className="hidden" checked={details.paymentMethod === 'cod'} onChange={() => setDetails({ ...details, paymentMethod: 'cod' })} />
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${details.paymentMethod === 'cod' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                          <CreditCard size={20} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800">Cash on Delivery</h4>
                          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tight">
                            {lang === "sw" ? "Lipa taslimu unapopokea bidhaa zako" : "Pay cash directly to our agent at your doorstep"}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Elegant Details Summary Card */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1.5">
                      {lang === "sw" ? "Uhakiki wa Maelezo" : "Recipient & Route Summary"}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400">{lang === "sw" ? "Mpokeaji" : "Recipient"}</p>
                        <p className="font-bold text-slate-800">{details.name}</p>
                        <p className="text-slate-500 font-bold text-[10px]">{details.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400">{lang === "sw" ? "Eneo" : "Destination"}</p>
                        <p className="font-bold text-slate-800 truncate" title={details.address}>{details.address}</p>
                        {deliveryQuote?.routeSummary && (
                          <p className="text-primary font-bold text-[10px]">
                            {deliveryQuote.routeSummary.maxDistanceKm} km · {deliveryQuote.routeSummary.maxDurationMinutes} mins
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security banner */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0 h-fit">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">
                        {lang === "sw" ? "Garantii ya Orbi PaySafe" : "Orbi PaySafe Guarantee Enabled"}
                      </h4>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 leading-normal">
                        {details.paymentMethod === 'escrow' 
                          ? (lang === "sw" ? "Fedha zako zinalindwa kwa uaminifu wa hali ya juu. Muuzaji atalipwa tu baada ya kupokea bidhaa." : "Your transaction is highly secure. The seller is only paid after you verify receipt.")
                          : (lang === "sw" ? "Kagua mzigo wako kwa utulivu kabla ya kumpa dereva pesa zako." : "Inspect your package thoroughly before paying the delivery agent.")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setStep(1)} 
                      disabled={isOrdering} 
                      className="px-4 py-3 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {lang === "sw" ? "Rudi" : "Back"}
                    </button>
                    <button 
                      onClick={onSubmit}
                      disabled={isOrdering || deliveryQuoteLoading || Boolean(deliveryQuote?.unavailableItems?.length)}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:bg-slate-900 transition-all active:scale-98 disabled:opacity-50"
                    >
                      {isOrdering ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{lang === "sw" ? "Thibitisha Oda" : "Confirm & Place Order"}</span>
                          <CheckCircle2 size={15} />
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
