import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../lib/db";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/storage";
import { Product, MarketplaceAd, SellerProfile } from "../../types";
import { ImageWithSkeleton } from "../ImageWithSkeleton";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  MousePointerClick,
  Eye,
  Percent,
  Clock,
  Sparkles,
  Upload,
  ArrowUpRight,
  PlusCircle,
  HelpCircle,
  Play,
  Pause,
  ChevronRight
} from "lucide-react";

// Local storage helper for image uploaded inside the seller dashboard
const uploadAdFile = async (
  file: File
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "promotions");

    const uploadRes = await fetch("/api/v1/storage/upload", {
      method: "POST",
      body: formData
    });
    
    const resJson = await uploadRes.json();
    if (!uploadRes.ok || !resJson.success) {
      throw new Error(`Kosa la kupakia: ${resJson.message || uploadRes.statusText}`);
    }
    return resJson.publicUrl;
  } catch (error: any) {
    console.error("Storage Error:", error);
    throw error;
  }
};

interface SellerMarketingProps {
  lang: "sw" | "en";
  seller: SellerProfile;
  products: Product[];
  displayAlert: (text: string, type: "success" | "error") => void;
}

export function SellerMarketing({ lang, seller, products, displayAlert }: SellerMarketingProps) {
  const [ads, setAds] = useState<MarketplaceAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form Fields
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adImage, setAdImage] = useState("");
  const [adLink, setAdLink] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [bidAmount, setBidAmount] = useState(250); // CPC bid TZS
  const [budgetLimit, setBudgetLimit] = useState(150000); // prepaid budget total limit
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Orbi Pay Integration
  const [marketingPaymentMethod, setMarketingPaymentMethod] = useState<"orbi_wallet" | "mobile_money">("orbi_wallet");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const fetchWalletBalance = async () => {
    if (!seller?.id) return;
    try {
      const res = await fetch(`/api/v1/payments/lending/profile/${seller.id}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setWalletBalance(data.profile.tzsBalance);
      }
    } catch (e) {
      console.warn("Failed to load wallet balance for ad manager", e);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, [seller]);

  // Load existing paid placement ads
  const loadSellerAds = async () => {
    setLoading(true);
    try {
      const data = await db.getAds();
      
      // Filter ads belonging to this current seller shop
      const sellerEmail = seller.email || seller.invoiceEmail || "";
      const matched = data.filter((ad) => {
        const isMatchedEmail = sellerEmail && ad.contactEmail?.toLowerCase() === sellerEmail.toLowerCase();
        const isMatchedName = seller.name && ad.businessName?.toLowerCase() === seller.name.toLowerCase();
        return isMatchedEmail || isMatchedName;
      });
      
      setAds(matched);
    } catch (e: any) {
      displayAlert(lang === "sw" ? "Imeshindwa kupakia matangazo" : "Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerAds();
  }, [seller]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploading(true);
    setUploadProgress(20);
    try {
      if (file.size > 15 * 1024 * 1024) {
        throw new Error(lang === "sw" ? "Ukubwa usizidi 15MB" : "Size exceeds 15MB");
      }
      setUploadProgress(50);
      const url = await uploadAdFile(file);
      setUploadProgress(100);
      setAdImage(url);
      displayAlert(lang === "sw" ? "Bango la tangazo limepakiwa kikamilifu!" : "Ad banner uploaded successfully!", "success");
    } catch (err: any) {
      displayAlert(err.message, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Autocomplete link based on selected product
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId) {
      setAdLink(`/?product=${prodId}`);
      // auto-fill title or description if empty
      const target = products.find(p => p.id === prodId);
      if (target) {
        if (!adTitle) setAdTitle(target.name);
        if (!adDescription) setAdDescription(target.description || "");
      }
    } else {
      setAdLink("");
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adTitle.trim() || !adImage.trim()) {
      displayAlert(
        lang === "sw" ? "Tafadhali jaza kichwa na picha ya bango" : "Please fill out headline and banner cover",
        "error"
      );
      return;
    }

    const campaign: MarketplaceAd = {
      id: `AD-SEL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      businessName: seller.name || "My Shop",
      contactEmail: seller.email || seller.invoiceEmail || "seller@orbi.com",
      title: adTitle.trim(),
      description: adDescription.trim(),
      image: adImage.trim(),
      link: adLink.trim() || "/",
      bidAmount: Number(bidAmount) || 200,
      budgetLimit: Number(budgetLimit) || 100000,
      totalSpent: 0,
      startDate: startDate,
      endDate: endDate,
      visible: false, // Hidden until admin reviews & approves
      status: "pending", // Waiting for manager authorization
      metrics: { impressions: 0, clicks: 0, ctr: 0 },
      createdAt: Date.now(),
    };

    if (marketingPaymentMethod === "orbi_wallet") {
      if (walletBalance === null || walletBalance < Number(budgetLimit)) {
        displayAlert(
          lang === "sw"
            ? "Mizani yako ya Orbi Pay haitoshi kukamilisha malipo haya ya bajeti ya tangazo."
            : "Your Orbi Pay Wallet balance is insufficient to fund this campaign budget.",
          "error"
        );
        return;
      }

      try {
        const deductRes = await fetch("/api/v1/payments/wallet/deduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: seller.id,
            amount: Number(budgetLimit),
            serviceName: "Marketplace Ad",
            description: `CPC Prepaid Ad Campaign Budget: ${adTitle.trim()}`
          })
        });
        const deductData = await deductRes.json();
        if (!deductRes.ok || !deductData.success) {
          throw new Error(deductData.error || "Wallet deduction failed");
        }
        
        (campaign as any).paymentMethod = "orbi_wallet";
        (campaign as any).funded = true;
        (campaign as any).fundingTransactionId = deductData.profile?.transactions?.[0]?.id || `TX-AD-${Date.now()}`;
        
        if (deductData.profile) {
          setWalletBalance(deductData.profile.tzsBalance);
        }
      } catch (err: any) {
        displayAlert(
          lang === "sw"
            ? `Malipo ya Orbi Pay yameshindwa: ${err.message}`
            : `Orbi Pay payment failed: ${err.message}`,
          "error"
        );
        return;
      }
    } else {
      if (!paymentPhone.trim() || !paymentRef.trim()) {
        displayAlert(
          lang === "sw"
            ? "Tafadhali jaza namba ya simu na kumbukumbu ya malipo ya mtandao."
            : "Please fill in your payment phone and network transaction reference.",
          "error"
        );
        return;
      }
      (campaign as any).paymentMethod = "mobile_money";
      (campaign as any).paymentPhone = paymentPhone.trim();
      (campaign as any).paymentRef = paymentRef.trim().toUpperCase();
      (campaign as any).funded = false;
    }

    try {
      const allAds = await db.getAds();
      const updatedList = [campaign, ...allAds];
      await db.saveAds(updatedList);
      
      setAds((prev) => [campaign, ...prev]);
      setShowModal(false);
      resetForm();
      displayAlert(
        lang === "sw"
          ? "Ombi la bango limetunza! Meneja wetu atapitia na kuidhinisha hivi punde."
          : "Campaign submitted! Our administrator will review and activate it shortly.",
        "success"
      );
    } catch (err: any) {
      displayAlert(lang === "sw" ? "Imeshindwa kutuma ombi" : "Could not submit ad campaign", "error");
    }
  };

  const resetForm = () => {
    setAdTitle("");
    setAdDescription("");
    setAdImage("");
    setAdLink("");
    setSelectedProductId("");
    setBidAmount(250);
    setBudgetLimit(150000);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  };

  const stats = useMemo(() => {
    return ads.reduce(
      (acc, item) => {
        acc.totalImpressions += item.metrics?.impressions || 0;
        acc.totalClicks += item.metrics?.clicks || 0;
        acc.totalSpent += item.totalSpent || 0;
        return acc;
      },
      { totalImpressions: 0, totalClicks: 0, totalSpent: 0 }
    );
  }, [ads]);

  const avgCtr = useMemo(() => {
    if (stats.totalImpressions === 0) return 0;
    return Number(((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2));
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 text-white p-6 rounded-3xl shadow-lg shadow-slate-950/10 relative overflow-hidden border border-slate-900">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6 select-none pointer-events-none">
          <Megaphone size={160} />
        </div>
        <div className="space-y-1.5 relative z-10 font-sans">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 rounded-xl text-slate-950">
              <Megaphone size={14} />
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
              {lang === "sw" ? "MATANGAZO YA KULIPIA (CPC)" : "PREPAID SPONSORED CAMPAIGNS (CPC)"}
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white block">
            {lang === "sw" ? "Meneja wa Matangazo ya Duka" : "Marketing & Ad Placements Hub"}
          </h1>
          <p className="text-slate-400 text-xs max-w-xl">
            {lang === "sw"
              ? "Tangaza bidhaa zako moja kwa moja kwenye soko kuu na uruhusu bofya za kulipia kuelekeza wateja kwako."
              : "Increase sales by sponsoring products, tracking actual impressions, click conversions, and CPC budgets."}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-white hover:bg-slate-50 text-slate-950 font-black text-[10px] uppercase px-5 py-3.5 rounded-2xl border border-slate-200 cursor-pointer transition active:scale-[0.98] flex items-center gap-1.5 shadow-sm self-start sm:self-center shrink-0"
        >
          <Plus size={14} />
          {lang === "sw" ? "Tangaza Bidhaa" : "Sponsor Products"}
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[1.45rem] border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {lang === "sw" ? "Kuonekana (Impressions)" : "Impressions"}
            </span>
            <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition duration-300 text-slate-500">
              <Eye size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {stats.totalImpressions.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {lang === "sw" ? "Kwenye kurasa za wateja" : "Views on customer feed"}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.45rem] border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {lang === "sw" ? "Mibofyo (Clicks)" : "Ad Clicks"}
            </span>
            <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition duration-300 text-slate-500">
              <MousePointerClick size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {stats.totalClicks.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {lang === "sw" ? "Wateja waliofungua bango" : "Redirect clicks to store"}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.45rem] border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              CTR (Conversion)
            </span>
            <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 transition duration-300 text-slate-500">
              <Percent size={14} />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-indigo-600 font-mono">{avgCtr}%</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {lang === "sw" ? "Kiwango cha ufanisi" : "Click-through performance"}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.45rem] border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {lang === "sw" ? "Gharama ya Matumizi" : "Total Cost (Spent)"}
            </span>
            <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition duration-300 text-slate-500">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(stats.totalSpent)}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {lang === "sw" ? "Inayokatwa kwenye bajeti" : "Deducted from active budget"}
            </p>
          </div>
        </div>
      </div>

      {/* Main campaigns list wrapper */}
      <div className="bg-white rounded-[1.65rem] border border-slate-200/80 p-6 shadow-sm space-y-6">
        <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500" />
          {lang === "sw" ? "Orodha ya Kampeni Zangu" : "My Active & Pending Campaigns"}
          <span className="font-mono text-slate-400">({ads.length})</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin inline-block mr-2 align-middle"></span>
            {lang === "sw" ? "Inapakia kampeni..." : "Loading campaign records..."}
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-200">
            <Megaphone size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-600">
              {lang === "sw" ? "Hakuna kampeni za matangazo bado" : "You have no active or proposed campaigns yet"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
              {lang === "sw"
                ? "Bofya kitufe cha 'Tangaza Bidhaa' hapo juu ili kuandaa bango la kuvutia wateja."
                : "Create a prepaid CPC advertising package and display custom banners to buyers."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad) => {
              const percentSpent = Math.min(100, Math.round((ad.totalSpent / ad.budgetLimit) * 100));
              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md hover:shadow-slate-100 transition-all duration-300"
                >
                  {/* Creative cover */}
                  <div className="relative h-28 bg-slate-100 overflow-hidden shrink-0">
                    <ImageWithSkeleton
                      src={ad.image}
                      alt={ad.title}
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {ad.status === "active" && (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                          {lang === "sw" ? "LIVE / INARUSHA" : "LIVE / ACTIVE"}
                        </span>
                      )}
                      {ad.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {lang === "sw" ? "INASUBIRI IDHINI" : "PENDING APPROVAL"}
                        </span>
                      )}
                      {ad.status === "completed" && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {lang === "sw" ? "IMEKWISHA" : "FINISHED / DEPAID"}
                        </span>
                      )}
                      {ad.status === "paused" && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          {lang === "sw" ? "IMESITISHWA" : "PAUSED"}
                        </span>
                      )}
                      {ad.status === "scheduled" && (
                        <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                          {lang === "sw" ? "IMERATIBIWA" : "SCHEDULED"}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-xs font-black truncate leading-tight">{ad.title}</h3>
                    </div>
                  </div>

                  {/* Body & metrics */}
                  <div className="p-4 flex-1 space-y-3.5">
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {ad.description || (lang === "sw" ? "Tangazo maalum la bidhaa..." : "Product campaign descriptions...")}
                    </p>

                    {/* Metrics values */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                      <div>
                        <p className="text-[8px] font-bold uppercase text-slate-400">
                          {lang === "sw" ? "Mionekano" : "Impressions"}
                        </p>
                        <p className="text-[11px] font-black text-slate-800 font-mono mt-0.5">{ad.metrics?.impressions || 0}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase text-slate-400">
                          {lang === "sw" ? "Bofya" : "Clicks"}
                        </p>
                        <p className="text-[11px] font-black text-slate-800 font-mono mt-0.5">{ad.metrics?.clicks || 0}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase text-slate-400">CTR</p>
                        <p className="text-[11px] font-black text-indigo-600 font-mono mt-0.5">
                          {ad.metrics?.ctr || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Budget spend meter bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-slate-500">
                          {lang === "sw" ? "Gharama:" : "Spent:"} <strong>{formatCurrency(ad.totalSpent)}</strong>
                        </span>
                        <span className="text-slate-400">
                          {lang === "sw" ? "ya " : "of "}{formatCurrency(ad.budgetLimit)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentSpent >= 100 ? "bg-red-500" : percentSpent > 75 ? "bg-amber-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${percentSpent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Payment Info Badge */}
                    <div className="flex items-center justify-between text-[9px] font-bold py-1.5 bg-slate-50/50 px-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400">
                        {lang === "sw" ? "Malipo ya Bajeti:" : "Billing & Funding:"}
                      </span>
                      <span>
                        {(ad as any).paymentMethod === "mobile_money" ? (
                          <span className="text-amber-700 font-black uppercase tracking-wider text-[8px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Mobile Money
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-black uppercase tracking-wider text-[8px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Orbi Pay Wallet
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Footer timeline info */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {ad.startDate} {lang === "sw" ? "hadi" : "to"} {ad.endDate}
                      </span>
                      <span className="font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                        CPC: {formatCurrency(ad.bidAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal form box */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone className="text-amber-400" size={16} />
                <h3 className="font-black text-xs uppercase tracking-wider">
                  {lang === "sw" ? "Kampeni Mpya ya Matangazo" : "Deploy Ad Campaign"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Product link autocomplete */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Chagua Bidhaa ya Kutangaza" : "Target Product"}
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800"
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                >
                  <option value="">-- {lang === "sw" ? "Iliyo hiari (Chagua Bidhaa)" : "Dropdown (Select optional product)"} --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Headline */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Kichwa cha Tangazo" : "Ad Headline (Title)"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === "sw" ? "Mfano: Kahawa nzuri yenye ladha ya asili!" : "Headline that grabs user attention"}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800 placeholder-slate-400/70"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Maelezo ya Tangazo" : "Marketing Description"}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === "sw" ? "Ujumbe mfupi unaoelezea bidhaa au ofa..." : "Short marketing call to action..."}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800 placeholder-slate-400/70 resize-none"
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                />
              </div>

              {/* Image creative bango */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Pakia Bango Kuu la Picha" : "Ad Banner Cover Image"} *
                </label>

                <div className="border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 p-5 rounded-xl text-center relative transition text-slate-400 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
                    <Upload size={16} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-700">
                      {lang === "sw" ? "Pakia picha ya tangazo" : "Upload promotional graphic"}
                    </p>
                    <p className="text-[8px] text-slate-400">Max size: 15MB</p>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600">
                      <span>{lang === "sw" ? "Inapakia..." : "Uploading creative bango..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800 placeholder-slate-400/70"
                  value={adImage}
                  onChange={(e) => setAdImage(e.target.value)}
                />

                {adImage && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 mt-2">
                    <ImageWithSkeleton
                      src={adImage}
                      alt="Cover preview"
                      containerClassName="w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => setAdImage("")}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 active:scale-95 duration-150 shadow"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Redirect path link */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Kiungo cha Kuelekeza Mteja" : "Target Redirect Link"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /?product=PROD-123 or direct URL"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800 placeholder-slate-400/70"
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                />
              </div>

              {/* Bid and Budget Limits fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Zabuni ya Bofya (CPC Bid)" : "CPC Bid TZS"}
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold font-mono outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Min: 100 TZS</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Bajeti Nzima (Budget Limit)" : "Total Budget Limit TZS"}
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="1000"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold font-mono outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Min: 10,000 TZS</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Tarehe ya Kuanza" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Tarehe ya Mwisho" : "End Date"}
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold outline-none focus:border-slate-950 focus:bg-white transition duration-200 text-slate-800"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "NJIA YA MALIPO YA BAJETI" : "CAMPAIGN BUDGET PAYMENT METHOD"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarketingPaymentMethod("orbi_wallet")}
                    className={`p-3 rounded-xl border text-left transition duration-150 outline-none cursor-pointer flex flex-col justify-between ${
                      marketingPaymentMethod === "orbi_wallet"
                        ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/10"
                        : "border-slate-150 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${marketingPaymentMethod === "orbi_wallet" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                      <span className="text-[11px] font-black text-slate-800">Orbi Pay Wallet</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">
                      {lang === "sw" ? "Mizani: " : "Balance: "}
                      <span className="font-mono text-emerald-600 font-bold">
                        {walletBalance !== null ? `${walletBalance.toLocaleString()} TZS` : "Inapakia..."}
                      </span>
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarketingPaymentMethod("mobile_money")}
                    className={`p-3 rounded-xl border text-left transition duration-150 outline-none cursor-pointer flex flex-col justify-between ${
                      marketingPaymentMethod === "mobile_money"
                        ? "border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/10"
                        : "border-slate-150 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${marketingPaymentMethod === "mobile_money" ? "bg-amber-500" : "bg-slate-300"}`}></span>
                      <span className="text-[11px] font-black text-slate-800">{lang === "sw" ? "Lipa na Simu" : "Mobile Money"}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">
                      {lang === "sw" ? "Tigo/M-Pesa manual" : "Tigo/M-Pesa manual"}
                    </p>
                  </button>
                </div>
              </div>

              {/* Sub-inputs dependent on payment method selection */}
              {marketingPaymentMethod === "mobile_money" ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/30 border border-amber-100/60 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-1 col-span-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                    <p className="block">
                      {lang === "sw" ? (
                        <>
                          Tuma kiasi cha <span className="font-bold text-slate-800">{(budgetLimit || 0).toLocaleString()} TZS</span> kwenda LIPA NAMBA: <span className="font-bold text-orange-600">4488219</span> (ORBI SHOPPING SERVICE) kisha weka maelezo hapa chini:
                        </>
                      ) : (
                        <>
                          Send <span className="font-bold text-slate-800">{(budgetLimit || 0).toLocaleString()} TZS</span> to LIPA NUMBER: <span className="font-bold text-orange-600">4488219</span> (ORBI SHOPPING SERVICE) and fill details below:
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {lang === "sw" ? "Namba Iliyolipwa" : "Payment Phone Number"} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0712345678"
                      className="w-full bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-xs font-semibold font-mono leading-none"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {lang === "sw" ? "Kumbukumbu ya Malipo" : "Transaction Ref"} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RJ78HH902B"
                      className="w-full bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-xs font-semibold font-mono leading-none uppercase"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/40 border border-emerald-100/60 rounded-xl space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black uppercase text-[9px] tracking-wide">
                    <span>⚡ Orbi Pay Quick Checkout</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    {lang === "sw" ? (
                      <>
                        Kiasi cha <span className="font-bold text-slate-800">{(budgetLimit || 0).toLocaleString()} TZS</span> kitakatwa moja kwa moja kutoka kwenye Orbi Pay Wallet yako ili kuanzisha kampeni hii. Kampeni yako itaanza kupokea mibofyo ikishaidhinishwa na meneja!
                      </>
                    ) : (
                      <>
                        An amount of <span className="font-bold text-slate-800">{(budgetLimit || 0).toLocaleString()} TZS</span> will be directly deducted from your active Orbi Pay balance to start this campaign. Runs instantly upon approval!
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition active:scale-[0.98]"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition active:scale-[0.98] shadow-md shadow-slate-950/10"
                >
                  {lang === "sw" ? "Tuma Ombi" : "Submit Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
