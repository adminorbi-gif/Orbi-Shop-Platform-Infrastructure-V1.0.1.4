import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Camera, 
  HelpCircle, 
  Eye, 
  Star, 
  Award, 
  Zap,
  Layers,
  Coins,
  ShieldCheck,
  ListOrdered,
  TrendingUp,
  Scale
} from "lucide-react";

interface PhotoQualityGuideProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "sw" | "en";
  defaultTab?: "photos" | "wholesale";
}

export function PhotoQualityGuide({ isOpen, onClose, lang, defaultTab = "photos" }: PhotoQualityGuideProps) {
  const isSwahili = lang === "sw";
  const [activeTab, setActiveTab] = React.useState<"photos" | "wholesale">("photos");

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab || "photos");
    }
  }, [isOpen, defaultTab]);

  // Translate helper
  const t = (swText: string, enText: string) => (isSwahili ? swText : enText);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:max-w-xl bg-white shadow-2xl z-[1000100] flex flex-col h-full border-l border-slate-100 overflow-hidden">
          {/* Backdrop for closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer z-[-1]"
          />

          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
                {activeTab === "photos" ? (
                  <Camera size={20} className="animate-pulse text-emerald-600" />
                ) : (
                  <Layers size={20} className="animate-pulse text-indigo-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  {activeTab === "photos" 
                    ? t("Mwongozo wa Ubora wa Picha", "Photo Quality standard Guide")
                    : t("Mwongozo wa Bei za Jumla & Punguzo", "Wholesale & Discount Guide")
                  }
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {activeTab === "photos"
                    ? t("Boresha Mauzo kwa Picha Bora", "Incentivize Customers with high-converting photos")
                    : t("Weka MOQ na Viwango vya Bei Safi", "Set Up MOQs & Tiered Pricing Structures")
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title={t("Funga", "Close")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-6 py-2 border-b border-slate-100 bg-slate-50 flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex-1 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "photos"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Camera size={13} />
              {t("Ubora wa Picha", "Photo Quality")}
            </button>
            <button
              onClick={() => setActiveTab("wholesale")}
              className={`flex-1 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "wholesale"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers size={13} />
              {t("Bei za Jumla & Vifurushi", "Wholesale & Discounts")}
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: PHOTO QUALITY */}
            {activeTab === "photos" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Introductory conversion tip */}
                <div className="bg-emerald-50/55 border border-emerald-100/60 p-4 rounded-2xl flex gap-3.5">
                  <span className="text-emerald-600 shrink-0 mt-0.5">
                    <Award size={20} className="fill-emerald-100" />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-emerald-950">
                      {t("Picha Safi Sawa na Mauzo Mara 3 Zaidi!", "Clean Photos = 3x Higher Conversion!")}
                    </h4>
                    <p className="text-[11px] text-emerald-900/90 leading-relaxed font-semibold">
                      {t(
                        "Wateja hununua bidhaa kwa macho kwanza. Picha zenye mandhari meupe na zisizo na mambo mengi pembeni huongeza uaminifu na kufanya bidhaa yako ionekane ya kisasa zaidi (premium look & feel).",
                        "Buyers purchase with their eyes. High-resolution photos on clean, uncluttered neutral backgrounds build immediate trust and elevate your brand image automatically."
                      )}
                    </p>
                  </div>
                </div>

                {/* Visual Example Comparison Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Eye size={14} className="text-slate-400" />
                    {t("Mfano wa Picha (Mlinganisho wa Moja kwa Moja)", "Visual Examples (Direct Side-by-Side)")}
                  </h4>

                  {/* Case 1: Watch */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {t("MFANO 1: Saa ya mkononi au Bidhaa Ndogo", "EXAMPLE 1: Wristwatch or Small Gadget")}
                    </span>
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Good Item Card */}
                      <div className="border border-emerald-200/60 rounded-2xl overflow-hidden bg-white hover:shadow-md transition group">
                        <div className="aspect-square relative bg-slate-50">
                          <img
                            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
                            alt="Good wrist watch photo example"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-2 py-1 bg-emerald-600/95 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-1 shadow-md">
                            <Check size={11} className="stroke-[3px]" />
                            {t("SAHIHI / GOOD", "GOOD")}
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50/20 space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{t("Aesthetic Minimalist", "Professional Product Shot")}</p>
                          <p className="text-[10px] text-emerald-800 font-semibold leading-snug">
                            {t("✓ Mandhari meupe na safi\n✓ Mwanga mzuri wa kutosha\n✓ Bidhaa imekaa katikati", "✓ Crisp white backdrop\n✓ Focused professional lighting\n✓ Centered alignment")}
                          </p>
                        </div>
                      </div>

                      {/* Bad Item Card */}
                      <div className="border border-red-200/60 rounded-2xl overflow-hidden bg-white hover:shadow-md transition group">
                        <div className="aspect-square relative bg-slate-50">
                          <img
                            src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80"
                            alt="Bad wrist watch photo example"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-2 py-1 bg-red-600/95 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-1 shadow-md">
                            <X size={11} className="stroke-[3px]" />
                            {t("KOSA / BAD", "BAD")}
                          </span>
                        </div>
                        <div className="p-3 bg-red-50/20 space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{t("Cluttered Desktop Backdrop", "Messy Cluttered Backdrop")}</p>
                          <p className="text-[10px] text-red-800 font-semibold leading-snug">
                            {t("✗ Vitu vingi meza ya kazi\n✗ Msongamano unaharibu taswira\n✗ Havutii macho ya mnunuzi", "✗ Messy wires, books & tools\n✗ No focus on the product\n✗ Destroys buyer confidence")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Case 2: Headphone or Accessory */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {t("MFANO 2: Headphones au Audio Gears", "EXAMPLE 2: Headphones or Audio Gears")}
                    </span>
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Good Item Card */}
                      <div className="border border-emerald-200/60 rounded-2xl overflow-hidden bg-white hover:shadow-md transition group">
                        <div className="aspect-square relative bg-slate-50">
                          <img
                            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
                            alt="Good headphones photo example"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-2 py-1 bg-emerald-600/95 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-1 shadow-md">
                            <Check size={11} className="stroke-[3px]" />
                            {t("SAHIHI / GOOD", "GOOD")}
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50/20 space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{t("Studio Clean Background", "Clean Studio Presentation")}</p>
                          <p className="text-[10px] text-emerald-800 font-semibold leading-snug">
                            {t("✓ Imefunikwa na vivuli laini\n✓ Rangi halisi inasisimua\n✓ Bidhaa inatambulika vyema", "✓ Soft studio shadows only\n✓ Pop color background\n✓ Premium details are clear")}
                          </p>
                        </div>
                      </div>

                      {/* Bad Item Card */}
                      <div className="border border-red-200/60 rounded-2xl overflow-hidden bg-white hover:shadow-md transition group">
                        <div className="aspect-square relative bg-slate-50">
                          <img
                            src="https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=400&q=80"
                            alt="Bad headphones photo example"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-2 py-1 bg-red-600/95 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-1 shadow-md">
                            <X size={11} className="stroke-[3px]" />
                            {t("KOSA / BAD", "BAD")}
                          </span>
                        </div>
                        <div className="p-3 bg-red-50/20 space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{t("Dark Workshop / Dusty Context", "Dark Distorted Context")}</p>
                          <p className="text-[10px] text-red-800 font-semibold leading-snug">
                            {t("✗ Alama za vumbi na mwanga hafifu\n✗ Picha ina giza au vivuli vikali\n✗ Inaonekana kama iliyotumika", "✗ Harsh flash shadows / Dust\n✗ Unrelated industrial objects\n✗ Appears dirty or used")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist of Dos and Don'ts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Do List */}
                  <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                    <h5 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                      {t("Mambo ya Kufanya (Do's)", "Proven Best Practices")}
                    </h5>
                    <ul className="space-y-2 text-[10px] text-emerald-900 font-semibold">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Weka bidhaa yako ionekane wazi katikati ya fremu.",
                            "Center the main product in the middle of your framing."
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Tumia mwanga wa asili (nje au karibu na dirisha) au studio light.",
                            "Utilize clean daylight or soft continuous LED studio lamps."
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Piga picha yenye pande zote (Pembe tofauti: mbele, nyuma, kwa karibu/macro).",
                            "Shoot from multiple angles (Front, 3/4 turn, back, and closed details)."
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Futa vumbi au unyayo vyovyote kabla ya kupiga picha.",
                            "Wipe smudge, dust & fingerprints off products before shooting."
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Don'ts List */}
                  <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl">
                    <h5 className="text-[11px] font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                        <X size={12} className="stroke-[3]" />
                      </span>
                      {t("Mambo ya Kuepuka (Don'ts)", "Common Mistakes to Avoid")}
                    </h5>
                    <ul className="space-y-2 text-[10px] text-rose-900 font-semibold">
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Epuka unyevu au ukungu (blurry) uliosababishwa na kamera kutetemeka.",
                            "Avoid low-light camera shakes resulting in blurred outlines."
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Kamwe usitumie mionzi ya flash mbele ya kioo/plastiki (glare reflection).",
                            "Avoid harsh flash camera reflections on glass or plastic wrap."
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Usichanganye alama za bei, nembo za maji au sticker zisizohusiana.",
                            "Do not add watermarks, stickers, or pricing labels manually on images."
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-600 mt-0.5">•</span>
                        <span>
                          {t(
                            "Mazingira meusi ya chumbani yenye kivuli kikubwa (harsh shadow).",
                            "Do not take photos in dark rooms with high contrast dark shadows."
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* AI Image Tools tip */}
                <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                  <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500 fill-amber-500" />
                    {t("Ushauri wa Mtaalam wa Kuongeza Mauzo", "Pro-Seller Catalog Booster Tip")}
                  </h5>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    {t(
                      "Ikiwa huna background nyeupe, unaweza kutumia tovuti za bure kama remove.bg au zana za AI kusafisha mandhari ya picha yako kuwa safi na meupe kabla ya kupakia hapa. Hii inainua tija ya duka lako kwa asilimia 300% na kuvutia wateja wa hadhi ya juu!",
                      "If you do not have a white studio light background, you can use automated AI background removal apps like remove.bg to instantly extract your product cleanly. This delivers high-performing catalog assets, attracting premium buyers instantly!"
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: WHOLESALE & QUANTITY DISCOUNTS */}
            {activeTab === "wholesale" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Introductory conversion tip */}
                <div className="bg-indigo-50/55 border border-indigo-100/60 p-4 rounded-2xl flex gap-3.5">
                  <span className="text-indigo-600 shrink-0 mt-0.5">
                    <Coins size={20} className="fill-indigo-100 text-indigo-600" />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-indigo-950">
                      {t("Kuza Faida kwa Bei za Jumla (Wholesale)", "Accelerate Sales with Wholesale Pricing!")}
                    </h4>
                    <p className="text-[11px] text-indigo-900/90 leading-relaxed font-semibold">
                      {t(
                        "Wateja wengi nchini Tanzania, hasa wafanyabiashara wadogo na wanunuzi wa vikundi, hupendelea kununua kwa wingi kupata bei nafuu. Kusanidi bei za jumla kunakufungulia soko kubwa la B2B kiotomatiki.",
                        "Setting volume-based wholesale price structures directly attracts retail resellers, bulk buying groups, and businesses, instantly scaling up your checkout values."
                      )}
                    </p>
                  </div>
                </div>

                {/* Steps timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <ListOrdered size={14} className="text-slate-400" />
                    {t("Hatua kwa Hatua: Jinsi ya Kusanidi", "Step-by-Step Configuration Guide")}
                  </h4>

                  {/* Step 1 */}
                  <div className="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white hover:shadow-xs transition duration-150">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-950">
                        {t("Chagua Aina ya Bei ya Jumla", "Switch Pricing Model to Wholesale")}
                      </h5>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                        {t(
                          "Wakati wa kuongeza au kuhariri bidhaa, nenda kwenye sehemu ya bei na ubadilishe kutoka 'Retail (Bei Kawaida)' kwenda 'Whole Sale (Bei za Jumla)'.",
                          "Inside the product form, locate the pricing section and toggle the 'Pricing Model' dropdown from 'Retail' to 'Whole Sale (Tiered pricing)'."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white hover:shadow-xs transition duration-150">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-950">
                        {t("Weka Idadi ya Chini ya Agizo (MOQ)", "Define Minimum Order Quantities (MOQ)")}
                      </h5>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                        {t(
                          "Weka kiwango cha chini cha bidhaa (Minimum Quantity) ambacho mteja lazima anunue ili kupata bei maalum ya punguzo la jumla. Unaweza kuanza na kiasi kidogo kama vipande 3 au 5.",
                          "Specify the exact quantity target ('Min Quantity') that triggers the wholesale price rate. For instance, you can protect bulk purchases by requiring a minimum of 5 units."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white hover:shadow-xs transition duration-150">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                      3
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-950">
                        {t("Sanidi Viwango vya Punguzo (Tiered Discounts)", "Configure Tiered Pricing Rates")}
                      </h5>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                        {t(
                          "Bofya '+ Ongeza Vigezo' kuongeza viwango tofauti (mfano: 5-10, 11-20, au 21+). Kila kiwango kinapoongezeka, punguza bei kidogo ili kuwavutia wateja kununua zaidi.",
                          "Add multiple discount tiers by clicking '+ Add Quantity Tier'. As order volumes increase, offer deeper discounts (e.g. 5+ units at TZS 10,000; 20+ units at TZS 9,000) to incentivize larger carts."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white hover:shadow-xs transition duration-150">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                      4
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-950">
                        {t("Ukusanyaji wa Vifurushi vya Akili (Smart Bundles)", "Smart Bundles AI Integration")}
                      </h5>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                        {t(
                          "Mfumo wetu wa akili wa 'Smart Bundles' utatengeneza vifurushi maalum vya bidhaa tofauti kiotomatiki kwa kutumia bei za jumla ulizoweka ili kuvutia wateja bila wewe kupoteza faida.",
                          "Our 'Smart Bundles' AI engine aggregates individual items into cross-product combos using your specified wholesale discount tiers, driving high-value carts while fully protecting your profit margins."
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profit protection rule cards */}
                <div className="p-4.5 bg-emerald-50 rounded-2xl border border-emerald-200/60 space-y-2">
                  <h5 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600 fill-emerald-100" />
                    {t("Ulinzi wa Bei Salama (Smart Protection Rule)", "Smart Protection Guardrails")}
                  </h5>
                  <p className="text-[10px] text-emerald-900 font-semibold leading-relaxed">
                    {t(
                      "Sera ya Kulinda Muuzaji: Ili kulinda faida yako, mfumo wetu hautawahi kupunguza au kutoa punguzo kwa bidhaa yoyote hadi kufikia chini ya 75% ya bei ya kawaida ya reja-reja, isipokuwa ukiweka wenyewe kiwango hicho kwenye 'Minimum Selling Price (Safe Margin Floor)'. Hii inakupa usalama wa 100% wa faida yako ya kibiashara hata wakati wa majadiliano ya AI au vifurushi vya kiotomatiki.",
                      "Seller Margin Protection Policy: To guarantee safe transactions, our platform will never allow automated engines or AI negotiations to discount your products below 75% of your standard retail price, unless explicitly specified in your 'Minimum Selling Price (Safe Margin Floor)'. This gives you absolute control over your pricing margins with zero risk."
                    )}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            >
              {t("Nimeelewa / Got it", "Got it, Thanks!")}
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
