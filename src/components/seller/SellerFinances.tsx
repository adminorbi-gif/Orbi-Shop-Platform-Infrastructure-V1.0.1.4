import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  ShieldCheck,
  Globe,
  RefreshCw,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  Building,
  Sprout,
  Sliders,
  CreditCard,
  AlertCircle,
  QrCode,
  ArrowDownLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { formatCurrency } from "../../lib/storage";
import { db } from "../../lib/db";

interface Loan {
  id: string;
  type: "working_capital" | "kulima";
  amount: number;
  durationMonths: number;
  interestRate: number;
  cropType?: string;
  expectedAcreage?: number;
  expectedYield?: number;
  disbursedAt: string;
  remainingAmount: number;
  status: "active" | "repaid";
}

interface FinancialProfile {
  creditScore: number;
  salesVelocity: "excellent" | "good" | "fair";
  paymentConsistency: "excellent" | "good" | "fair";
  disputeRate: number;
  hasEnabledStablecoins: boolean;
  tzsBalance: number;
  usdcBalance: number;
  daiBalance: number;
  loans: Loan[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    timestamp: string;
    description: string;
    status: string;
  }[];
}

export function SellerFinances({
  sellerId,
  lang,
  displayAlert
}: {
  sellerId: string;
  lang: "sw" | "en";
  displayAlert?: (title: string, message: string) => void;
}) {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"lending" | "stablecoin" | "ledger">("lending");

  // Working Capital Loan Calculator states
  const [loanAmount, setLoanAmount] = useState(2000000);
  const [loanDuration, setLoanDuration] = useState(6);
  const [submittingLoan, setSubmittingLoan] = useState(false);

  // Kulima Agricultural Loan States
  const [cropType, setCropType] = useState("Maize/Mahindi");
  const [acreage, setAcreage] = useState(5);
  const [expectedYieldValue, setExpectedYieldValue] = useState(4000000);
  const [kulimaLoanAmount, setKulimaLoanAmount] = useState(1200000);
  const [submittingKulima, setSubmittingKulima] = useState(false);

  // Convert stablecoin states
  const [selectedStablecoin, setSelectedStablecoin] = useState<"USDC" | "DAI">("USDC");
  const [convertAmount, setConvertAmount] = useState(200);
  const [converting, setConverting] = useState(false);

  // Payout/Withdrawal states
  const [payoutAmount, setPayoutAmount] = useState(500000);
  const [payoutProvider, setPayoutProvider] = useState("M-Pesa");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  const t = (sw: string, en: string) => (lang === "sw" ? sw : en);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await (db as any).getLendingProfile(sellerId);
      if (res.success && res.profile) {
        setProfile(res.profile);
      } else {
        setErrorMsg(res.error || t("huduma hii inafanyiwa matengenezo, tafadhali jaribu tena baadaye au wasiliana na msaada / service are under maintenance try again or call support", "service are under maintenance try again or call support"));
      }
    } catch (err: any) {
      console.error("Error fetching financial profile:", err);
      setErrorMsg(err.message || t("huduma hii inafanyiwa matengenezo, tafadhali jaribu tena baadaye au wasiliana na msaada / service are under maintenance try again or call support", "service are under maintenance try again or call support"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      fetchProfile();
    }
  }, [sellerId]);

  // Max loan limits based on credit scores
  const maxLoanLimit = useMemo(() => {
    if (!profile) return 1000000;
    const score = profile.creditScore;
    if (score >= 800) return 12000000;
    if (score >= 750) return 8000000;
    if (score >= 700) return 5000000;
    if (score >= 650) return 3000000;
    return 1000000;
  }, [profile]);

  // Adjust Loan Amount slider if it exceeds calculated limit
  useEffect(() => {
    if (loanAmount > maxLoanLimit) {
      setLoanAmount(maxLoanLimit);
    }
  }, [maxLoanLimit]);

  // Interest rate APR and calculated fees
  const workingCapitalAPR = 8.5; // 8.5% flat
  const workingCapitalInterest = useMemo(() => {
    return Math.round((loanAmount * workingCapitalAPR * (loanDuration / 12)) / 100);
  }, [loanAmount, loanDuration]);

  const workingCapitalMonthlyInstallment = useMemo(() => {
    return Math.round((loanAmount + workingCapitalInterest) / loanDuration);
  }, [loanAmount, workingCapitalInterest, loanDuration]);

  // Kulima agricultural parameters
  const kulimaAPR = 4.5; // lower agricultural concession rates
  const kulimaInterest = useMemo(() => {
    return Math.round((kulimaLoanAmount * kulimaAPR * (6 / 12)) / 100); // 6 months standard cycle
  }, [kulimaLoanAmount]);

  const maxKulimaLimit = useMemo(() => {
    // 40% of expected yield value as secure ceiling
    return Math.round(expectedYieldValue * 0.4);
  }, [expectedYieldValue]);

  useEffect(() => {
    if (kulimaLoanAmount > maxKulimaLimit) {
      setKulimaLoanAmount(maxKulimaLimit);
    }
  }, [maxKulimaLimit]);

  // Handle standard Working Capital application
  const handleApplyWorkingCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (loanAmount > maxLoanLimit) {
      alert(t("Kiasi kimezidi kiwango chako cha mkopo kulingana na alama zako za kadi.", "Amount exceeds your maximum qualified limit based on your Credit Score."));
      return;
    }

    setSubmittingLoan(true);
    try {
      const res = await (db as any).applyLoan({
        sellerId,
        type: "working_capital",
        amount: loanAmount,
        durationMonths: loanDuration
      });

      if (res.success) {
        setProfile(res.profile);
        if (displayAlert) {
          displayAlert(
            t("Mkopo Umehinishwa! 🥳", "Loan Approved! 🥳"),
            t(
              `Hongera! Mkopo wako wa TZS ${loanAmount.toLocaleString()} umepitishwa papo hapo na kuingizwa kwenye mkoba wako wa Orbi Pay na CRDB/NMB.`,
              `Congratulations! Your Working Capital Loan of TZS ${loanAmount.toLocaleString()} has been instantly approved by CRDB/NMB and disbursed to your Orbi Pay wallet.`
            )
          );
        } else {
          alert(t("Mkopo umepatikana na kuwekwa kwenye pochi yako ya Orbi Pay!", "Loan approved and credited to your Orbi Pay wallet!"));
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to secure loan");
    } finally {
      setSubmittingLoan(false);
    }
  };

  // Handle Agricultural Kulima loan application
  const handleApplyKulima = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (kulimaLoanAmount > maxKulimaLimit) {
      alert(t("Kiasi kimezidi 40% ya dhamana ya mavuno yako.", "Amount exceeds 40% of your expected agricultural harvest yield value."));
      return;
    }

    setSubmittingKulima(true);
    try {
      const res = await (db as any).applyLoan({
        sellerId,
        type: "kulima",
        amount: kulimaLoanAmount,
        durationMonths: 6, // fixed harvest cycle
        cropType,
        expectedAcreage: acreage,
        expectedYield: expectedYieldValue
      });

      if (res.success) {
        setProfile(res.profile);
        if (displayAlert) {
          displayAlert(
            t("Mkopo wa Kulima Umepitishwa! 🌾", "Kulima Micro-Loan Approved! 🌾"),
            t(
              `Mkopo wako wa Pembejeo za Kilimo wa TZS ${kulimaLoanAmount.toLocaleString()} umethibitishwa papo hapo ukiwa umelindwa na dhamana ya mavuno yako ya ${cropType}.`,
              `Your Agricultural Inputs Loan of TZS ${kulimaLoanAmount.toLocaleString()} has been approved instantly, secured by your expected ${cropType} harvest value.`
            )
          );
        } else {
          alert(t("Mkopo wa Kulima umeidhinishwa kwa ufanisi!", "Kulima micro-loan secured successfully!"));
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to secure agricultural loan");
    } finally {
      setSubmittingKulima(false);
    }
  };

  // Handle repaying an active loan
  const handleRepayLoan = async (loanId: string, repayAmount: number) => {
    if (!profile) return;
    if (profile.tzsBalance < repayAmount) {
      alert(t("Mizani ya pochi yako haitoshi kukamilisha malipo haya ya mkopo.", "Insufficient TZS balance in your Orbi Pay wallet to make this repayment."));
      return;
    }

    if (!confirm(t(`Je, una uhakika unataka kulipa TZS ${repayAmount.toLocaleString()} kutoka kwenye mizani yako ya pochi?`, `Are you sure you want to repay TZS ${repayAmount.toLocaleString()} from your current wallet balance?`))) {
      return;
    }

    try {
      const res = await (db as any).repayLoan(sellerId, loanId, repayAmount);
      if (res.success) {
        setProfile(res.profile);
        alert(t("Ulipaji wa mkopo umekamilika kwa ufanisi!", "Loan repayment processed successfully!"));
      }
    } catch (err: any) {
      alert(err.message || "Failed to process repayment");
    }
  };

  // Handle stablecoin settlement toggle
  const handleToggleStablecoin = async (enabled: boolean) => {
    if (!profile) return;
    try {
      const res = await (db as any).toggleStablecoins(sellerId, enabled);
      if (res.success) {
        setProfile(res.profile);
        alert(enabled 
          ? t("Makazi ya Stablecoin yameamilishwa! Orbi Pay itapokea USDC/DAI kutoka kwa wanunuzi wa kimataifa.", "Stablecoin settlements enabled! Orbi Pay will accept USDC/DAI for cross-border trades.")
          : t("Makazi ya Stablecoin yamezimwa.", "Stablecoin settlements disabled.")
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle stablecoins");
    }
  };

  // Handle converting USDC/DAI to local TZS currency
  const handleConvertStablecoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const currentBalance = selectedStablecoin === "USDC" ? profile.usdcBalance : profile.daiBalance;
    if (convertAmount > currentBalance) {
      alert(t("Kiasi kimezidi mizani inayopatikana.", "Convert amount exceeds available stablecoin balance."));
      return;
    }

    setConverting(true);
    try {
      const rate = 2620; // 1 USDC/DAI = 2,620 TZS Bot rate
      const res = await (db as any).convertStablecoins(sellerId, selectedStablecoin, convertAmount, rate);
      if (res.success) {
        setProfile(res.profile);
        alert(t(
          `Umebadilisha kwa ufanisi ${convertAmount} ${selectedStablecoin} na kuingiza TZS ${(convertAmount * rate).toLocaleString()} kwenye pochi yako ya TZS!`,
          `Successfully converted ${convertAmount} ${selectedStablecoin} to TZS ${(convertAmount * rate).toLocaleString()} in your local payout balance!`
        ));
        setConvertAmount(0);
      }
    } catch (err: any) {
      alert(err.message || "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  // Handle local payout/withdrawals to M-Pesa, Airtel, CRDB etc.
  const handlePayoutWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!payoutAccount.trim()) {
      alert(t("Tafadhali weka namba ya simu au akaunti ya kibenki.", "Please enter a valid telephone register or bank account number."));
      return;
    }
    if (payoutAmount > profile.tzsBalance) {
      alert(t("Mizani yako ya pochi haitoshi kutoa kiasi hiki.", "Amount exceeds your withdrawable local currency balance."));
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await (db as any).executePayout(sellerId, payoutAmount, payoutProvider, payoutAccount);
      if (res.success) {
        setProfile(res.profile);
        if (displayAlert) {
          displayAlert(
            t("Pesa Imetumwa! 💸", "Payout Sent! 💸"),
            t(
              `Kiasi cha TZS ${payoutAmount.toLocaleString()} kimetumwa papo hapo kwenda ${payoutProvider} akaunti ${payoutAccount}.`,
              `Successfully transferred TZS ${payoutAmount.toLocaleString()} to your ${payoutProvider} account (${payoutAccount}) via Orbi Pay Gateway.`
            )
          );
        } else {
          alert(t("Miamala ya kutoa pesa imekamilika kwa ufanisi!", "Payout processed successfully!"));
        }
        setPayoutAccount("");
      }
    } catch (err: any) {
      alert(err.message || "Payout request failed");
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/60 min-h-[400px]">
        <RefreshCw size={40} className="text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          {t("Inapakia Huduma ya Kifedha...", "Initializing Financial Dashboard...")}
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-[2rem] border border-slate-200/60 min-h-[350px] text-center max-w-2xl mx-auto space-y-4 shadow-xs" id="finances-maintenance-view">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
          <AlertCircle size={40} className="text-amber-500" />
        </div>
        <h2 className="text-lg font-black text-slate-900">
          {t("Huduma Haipatikani kwa Sasa", "Service Temporarily Unavailable")}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md font-medium">
          {errorMsg}
        </p>
        <button
          onClick={fetchProfile}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition shadow-md shadow-slate-950/10 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>{t("Jaribu Tena", "Try Again")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="seller-finances-panel">
      {/* Dynamic Header & Hero with Glassmorphism */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 sm:p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6 select-none pointer-events-none">
          <TrendingUp size={240} className="text-emerald-500" />
        </div>
        <div className="space-y-4 relative z-10 font-sans">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <ShieldCheck size={14} />
            </span>
            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
              {t("ORBI PAY INTEGRATION SUITE", "ORBI PAY INTEGRATION SUITE")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white block">
            {t("Kituo cha Kifedha & Mikopo", "Orbi Finance & Lending Hub")}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
            {t(
              "Dhibiti pochi zako, makazi ya stablecoins za kigeni (USDC/DAI), na upate mikopo ya haraka ya mtaji kutoka kwa washirika wetu CRDB/NMB na huduma ya 'Kulima'.",
              "Manage multi-currency wallets, hedge volatility with international stablecoins, and secure instant capital loans partnered with NMB, CRDB, and Kulima Agricultural Finance."
            )}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setActiveTab("lending")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "lending"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              💼 {t("Alama za Mkopo & Mikopo", "Credit Score & Lending")}
            </button>
            <button
              onClick={() => setActiveTab("stablecoin")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "stablecoin"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              🪙 {t("Makazi ya Stablecoins", "Stablecoin Settlement Wallet")}
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📊 {t("Lajki ya Miamala", "PaySafe Transaction Ledger")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      {activeTab === "lending" && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Credit Score & Status Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-xs flex flex-col items-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                {t("Alama za Mkopo (Orbi Score)", "Orbi Credit Score")}
              </span>
              
              {/* Dial Representation */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Simulated circle border color depending on rating */}
                <div className={`absolute inset-0 rounded-full border-[10px] ${
                  profile.creditScore >= 750 ? "border-emerald-500" : profile.creditScore >= 700 ? "border-amber-500" : "border-slate-300"
                } opacity-20`}></div>
                
                <div className="flex flex-col items-center z-10">
                  <span className="text-4xl font-black text-slate-900 leading-none">
                    {profile.creditScore}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
                    / 850
                  </span>
                </div>
              </div>

              {/* Score classification */}
              <div className="mt-4 space-y-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  profile.creditScore >= 750 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {profile.creditScore >= 750 ? t("Kiwango cha Dhahabu (Excellent)", "Gold Level (Excellent)") : t("Kiwango cha Fedha (Good)", "Silver Level (Good)")}
                </span>
                <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed mx-auto mt-2">
                  {t(
                    `Inastahiki mikopo ya hadi TZS ${maxLoanLimit.toLocaleString()}`,
                    `Eligible for capital loans up to TZS ${maxLoanLimit.toLocaleString()}`
                  )}
                </p>
              </div>

              {/* Signals breakdown */}
              <div className="w-full border-t border-slate-100 mt-6 pt-4 space-y-3 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{t("Kasi ya Mauzo:", "Sales Velocity:")}</span>
                  <span className="font-bold uppercase text-emerald-600">{profile.salesVelocity}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{t("Uthabiti wa Malipo:", "Payment Consistency:")}</span>
                  <span className="font-bold uppercase text-emerald-600">{profile.paymentConsistency}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{t("Kiwango cha Migogoro:", "Dispute Rate:")}</span>
                  <span className="font-bold text-slate-900">{profile.disputeRate}%</span>
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                {t("Mikopo Yako ya Sasa", "Your Active Loans")}
              </h3>

              <div className="space-y-4">
                {profile.loans.filter(l => l.status === "active").map((loan) => (
                  <div key={loan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                          {loan.id}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 capitalize">
                          {loan.type === "kulima" ? "🌾 Kulima Micro-Loan" : "💼 Capital Loan (CRDB/NMB)"}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                        {t("Haijaisha", "Active")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{t("Mtaji uliochukuliwa", "Principal")}</p>
                        <p className="font-bold text-slate-700">{formatCurrency(loan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{t("Deni lililosalia", "Outstanding")}</p>
                        <p className="font-bold text-red-600">{formatCurrency(loan.remainingAmount)}</p>
                      </div>
                    </div>

                    {loan.remainingAmount > 0 && (
                      <button
                        onClick={() => handleRepayLoan(loan.id, Math.min(profile.tzsBalance, loan.remainingAmount))}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={11} />
                        <span>{t("Lipa Sasa kutoka Wallet", "Pay Installment from Wallet")}</span>
                      </button>
                    )}
                  </div>
                ))}

                {profile.loans.filter(l => l.status === "active").length === 0 && (
                  <p className="text-xs text-slate-400 text-center italic py-4">
                    {t("Huna mkopo wowote kwa sasa.", "You have no outstanding active loans.")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Apply Loan Options (Working Capital or Agricultural) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Standard Working Capital Loan Slider Form */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-amber-100 rounded-xl text-amber-700">
                  <Building size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {t("Mkopo wa Mtaji wa Haraka (CRDB / NMB)", "Instant Capital Loans (CRDB & NMB)")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t("Maombi yanapitishwa sekunde 5, malipo kupelekwa papo hapo.", "Get dynamic pre-approval within seconds directly from platform volume.")}
                  </p>
                </div>
              </div>

              <form onSubmit={handleApplyWorkingCapital} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-600 font-bold uppercase tracking-wider">{t("Kiasi cha Mkopo (TZS):", "Request Amount (TZS):")}</label>
                    <span className="text-sm font-black text-slate-900">{loanAmount.toLocaleString()} TZS</span>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={maxLoanLimit}
                    step={100000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>500K TZS</span>
                    <span>{t("Ukomo wako: ", "Your limit: ")}{(maxLoanLimit / 1000000).toFixed(1)}M TZS</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLoanDuration(m)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center ${
                        loanDuration === m
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm font-black">{m}</span>
                      <span className="text-[9px] uppercase tracking-wide opacity-80">{t("Miezi", "Months")}</span>
                    </button>
                  ))}
                </div>

                {/* Calculation summary block */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">{t("Riba ya Mkopo (APR):", "Interest APR:")}</span>
                    <span className="font-bold text-slate-900">{workingCapitalAPR}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">{t("Jumla ya Riba:", "Total Interest:")}</span>
                    <span className="font-bold text-slate-900">{workingCapitalInterest.toLocaleString()} TZS</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 mt-2 font-bold text-slate-900">
                    <span>{t("Malipo ya kila mwezi:", "Monthly Installment:")}</span>
                    <span className="text-emerald-700">{workingCapitalMonthlyInstallment.toLocaleString()} TZS / mwezi</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingLoan}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {submittingLoan ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                      {t("Kuthibitisha Maombi ya Mkopo...", "Authenticating CRDB/NMB Disbursal...")}
                    </>
                  ) : (
                    <>
                      <Building size={14} />
                      <span>{t("Saini na Idhinisha Mtaji Sasa", "Agree Terms & Disburse Instant Capital")}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Specialized "Kulima" Micro-Loan for Farmers */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-white p-6 sm:p-8 rounded-[2rem] border border-emerald-100 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <Sprout size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {t("🌾 Mkopo wa Pembejeo za Kilimo ('Kulima' Loans)", "🌾 'Kulima' Agricultural Micro-Loans")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t("Maalum kwa ajili ya wakulima, unalipwa wakati wa mavuno tu ukiwa umelindwa na mavuno yako.", "Specifically for farmers, repayable at harvest, secured by expected crop yield value.")}
                  </p>
                </div>
              </div>

              <form onSubmit={handleApplyKulima} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Aina ya Zao:", "Crop Type:")}</label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Maize/Mahindi">Mahindi (Maize)</option>
                      <option value="Coffee/Kahawa">Kahawa (Coffee)</option>
                      <option value="Cashews/Korosho">Korosho (Cashews)</option>
                      <option value="Rice/Mchele">Mchele (Rice)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Ukubwa wa Shamba (Acres):", "Farm Size (Acres):")}</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={acreage}
                      onChange={(e) => setAcreage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Thamani ya Mavuno (TZS):", "Expected Harvest Value:")}</label>
                    <input
                      type="number"
                      min={1000000}
                      step={500000}
                      value={expectedYieldValue}
                      onChange={(e) => setExpectedYieldValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-600 font-bold uppercase tracking-wider">{t("Kiasi cha Mkopo wa Kulima:", "Kulima Micro-Loan Amount:")}</label>
                    <span className="text-sm font-black text-slate-900">{kulimaLoanAmount.toLocaleString()} TZS</span>
                  </div>
                  <input
                    type="range"
                    min={200000}
                    max={maxKulimaLimit}
                    step={50000}
                    value={kulimaLoanAmount}
                    onChange={(e) => setKulimaLoanAmount(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-emerald-50 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>200K TZS</span>
                    <span>{t("Ukomo (40% ya mavuno): ", "Secure Limit (40% harvest): ")}{(maxKulimaLimit / 1000000).toFixed(1)}M TZS</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-800 font-semibold">{t("Riba ya Concession Kilimo:", "Agricultural Concession APR:")}</span>
                    <span className="font-bold text-emerald-900">{kulimaAPR}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-800 font-semibold">{t("Muda wa Kurejesha:", "Repayment Cycle:")}</span>
                    <span className="font-bold text-emerald-900">{t("Siku 180 (Wakati wa Mavuno)", "180 Days (Due at Harvest Time)")}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingKulima}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {submittingKulima ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                      {t("Kuandaa Pembejeo na Kulima Pay...", "Allocating Kulima Fertilizer credits...")}
                    </>
                  ) : (
                    <>
                      <Sprout size={14} />
                      <span>{t("Omba Mkopo Pembejeo za Kilimo", "Disburse Kulima Agri-Inputs Loan")}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {activeTab === "stablecoin" && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Multi-Currency Card & QR Codes */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t("Makazi ya Stablecoin (USDC/DAI)", "Stablecoin Settlement (USDC/DAI)")}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {t("Pokea dola kwa ajili ya biashara za kikanda.", "Hedge local currency inflation on settlements.")}
                  </p>
                </div>

                {/* Switch toggler */}
                <button
                  type="button"
                  onClick={() => handleToggleStablecoin(!profile.hasEnabledStablecoins)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    profile.hasEnabledStablecoins ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    profile.hasEnabledStablecoins ? "translate-x-6" : "translate-x-0"
                  }`}></div>
                </button>
              </div>

              {/* Multi-Currency Balances Card */}
              <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 relative overflow-hidden">
                <div className="space-y-4 relative z-10 font-sans">
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-indigo-300">
                      Orbi Pay Vault Balance
                    </span>
                    <h2 className="text-3xl font-black text-white mt-1">
                      {formatCurrency(profile.tzsBalance)}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs">
                    <div>
                      <span className="text-indigo-300 font-bold block">USDC (Polygon)</span>
                      <span className="text-base font-black text-white">{profile.usdcBalance.toLocaleString()} USDC</span>
                    </div>
                    <div>
                      <span className="text-indigo-300 font-bold block">DAI (Ethereum)</span>
                      <span className="text-base font-black text-white">{profile.daiBalance.toLocaleString()} DAI</span>
                    </div>
                  </div>
                </div>
              </div>

              {profile.hasEnabledStablecoins ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <Info size={14} className="text-indigo-600 flex-shrink-0" />
                    <p className="text-indigo-950 font-medium leading-relaxed">
                      {t(
                        "Orbi Pay automated settlement converts B2B stablecoin invoices back to TZS at Bot rate upon request.",
                        "Receive B2B payments instantly on Polygon. Conversion is secured deterministically."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {t("Anwani yako ya USDC/DAI (Polygon)", "Your USDC/DAI Deposit Address (Polygon)")}
                    </span>
                    <div className="p-2 bg-white rounded-xl shadow-xs">
                      <QrCode size={120} className="text-slate-900" />
                    </div>
                    <code className="text-[10px] font-mono text-slate-500 bg-slate-100 p-2 rounded-lg break-all select-all text-center">
                      0x9F42...d38A2B6b90{sellerId.substring(0, 4).toUpperCase()}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 italic">
                  {t(
                    "Tafadhali washa huduma ya Stablecoins kupata anwani ya makazi na kuanza kupokea dola za kimataifa.",
                    "Please enable stablecoin settlements to view your wallet deposit addresses."
                  )}
                </div>
              )}

            </div>
          </div>

          {/* RIGHT: Convert and Withdrawal Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Convert Stablecoin to TZS Form */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
                  <Globe size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {t("Badilisha Stablecoins kuwa TZS", "Convert Stablecoins to Local Currency")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t("Kamilisha ubadilishaji salama na uingize pesa kwenye pochi ya kutoa.", "Convert USDC/DAI assets directly into withdrawable Tanzanian Shillings.")}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConvertStablecoin} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Chagua Sarafu:", "Select Coin:")}</label>
                    <div className="flex gap-2">
                      {["USDC", "DAI"].map((coin) => (
                        <button
                          key={coin}
                          type="button"
                          onClick={() => setSelectedStablecoin(coin as any)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            selectedStablecoin === coin
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {coin}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Kiasi cha Kubadilisha:", "Convert Amount:")}</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedStablecoin === "USDC" ? profile.usdcBalance : profile.daiBalance}
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">{t("Kiwango cha FX cha Bot leo:", "Bot Official FX Rate:")}</span>
                    <span className="font-bold text-slate-900">1 {selectedStablecoin} = 2,620 TZS</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-200 pt-2 mt-2">
                    <span>{t("Utakachopokea kwenye pochi:", "TZS Amount to Credit:")}</span>
                    <span className="text-emerald-700">{(convertAmount * 2620).toLocaleString()} TZS</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={converting || convertAmount <= 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                >
                  {converting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                      {t("Inabadilisha sarafu...", "Executing secure FX convert...")}
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>{t("Badilisha na Uingize Pochi", "Convert Stablecoins Now")}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Request Payout to Bank or MNO Mobile Money */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <CreditCard size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {t("Kutoa Mtaji (Request Payout)", "Secure Local Payout / Withdrawal")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t("Toa pesa papo hapo kwenda akaunti yako ya simu au benki.", "Withdraw your TZS balance directly to M-Pesa, Tigo Pesa, CRDB, or NMB.")}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePayoutWithdraw} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Mtandao / Benki:", "Provider:")}</label>
                    <select
                      value={payoutProvider}
                      onChange={(e) => setPayoutProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Tigo Pesa">Tigo Pesa</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="CRDB Bank">CRDB Bank</option>
                      <option value="NMB Bank">NMB Bank</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Akaunti / Namba ya Simu:", "Account Number / Phone:")}</label>
                    <input
                      type="text"
                      placeholder="e.g. 07XXXXXXXX"
                      value={payoutAccount}
                      onChange={(e) => setPayoutAccount(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">{t("Kiasi cha Kutoa (TZS):", "Payout Amount (TZS):")}</label>
                    <input
                      type="number"
                      min={1000}
                      max={profile.tzsBalance}
                      step={10000}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={payoutLoading || payoutAmount <= 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {payoutLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                      {t("Inatuma maombi kwenda Orbi Pay...", "Sending payout task to gateway...")}
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={14} />
                      <span>{t("Toa Pesa Papo Hapo", "Process Instant Payout")}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {activeTab === "ledger" && profile && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {t("Lajki ya Miamala ya PaySafe", "PaySafe Transaction Ledger")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t("Miamala yote ya kifedha inayohusiana na mauzo au mikopo.", "Audit logs for all payouts, loan disbursements, and stablecoin conversions.")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4">{t("Rejea ya Muamala", "Reference Ref")}</th>
                  <th className="p-4">{t("Aina ya Miamala", "Transaction Type")}</th>
                  <th className="p-4">{t("Maelezo", "Description")}</th>
                  <th className="p-4">{t("Kiasi", "Amount")}</th>
                  <th className="p-4">{t("Tarehe", "Timestamp")}</th>
                  <th className="p-4">{t("Hali", "Gateway Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profile.transactions.map((tx) => (
                  <motion.tr
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="p-4 font-mono font-bold text-slate-400">
                      {tx.id}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider ${
                        tx.type === "loan_disbursal" 
                          ? "bg-amber-50 text-amber-700"
                          : tx.type === "loan_repayment"
                          ? "bg-slate-100 text-slate-800"
                          : tx.type === "stablecoin_conversion"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {tx.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {tx.description}
                    </td>
                    <td className="p-4 font-black text-slate-900 text-sm">
                      {tx.type === "payout" || tx.type === "loan_repayment" ? "-" : "+"} {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const isSuccess = tx.status === "success" || tx.status === "completed" || tx.status === "confirmed";
                        const isPending = tx.status === "pending" || tx.status === "processing" || tx.status === "held";
                        const isFailed = tx.status === "failed";

                        let badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
                        let pulseDotClass = "bg-emerald-500";
                        let pingDotClass = "bg-emerald-400";
                        
                        if (isPending) {
                          badgeClass = "bg-amber-50 text-amber-700 border border-amber-200/50";
                          pulseDotClass = "bg-amber-500";
                          pingDotClass = "bg-amber-400";
                        } else if (isFailed) {
                          badgeClass = "bg-rose-50 text-rose-700 border border-rose-200/50";
                          pulseDotClass = "bg-rose-500";
                          pingDotClass = "bg-rose-400";
                        }

                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider shadow-2xs ${badgeClass}`}>
                            {(isSuccess || isPending) ? (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingDotClass}`}></span>
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseDotClass}`}></span>
                              </span>
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full ${pulseDotClass}`}></span>
                            )}
                            <span>{tx.status}</span>
                          </span>
                        );
                      })()}
                    </td>
                  </motion.tr>
                ))}

                {profile.transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                      {t("Hakuna miamala yoyote iliyorekodiwa bado.", "No transaction logs recorded in ledger yet.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
