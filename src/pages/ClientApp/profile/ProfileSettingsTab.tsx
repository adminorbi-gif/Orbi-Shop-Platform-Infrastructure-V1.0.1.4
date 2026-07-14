import {
  Check,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
  ChevronRight,
  BellRing
} from "lucide-react";

type ProfileSettingsTabProps = {
  lang: string;
  user: any;
  editName: string;
  editPhone: string;
  editEmail: string;
  editAddress: string;
  isEditMode: boolean;
  isSavingProfile: boolean;
  localOrdersCount: number;
  points: number;
  unreadCount: number;
  onSetEditName: (value: string) => void;
  onSetEditPhone: (value: string) => void;
  onSetEditEmail: (value: string) => void;
  onSetEditAddress: (value: string) => void;
  onToggleEdit: () => void;
  onSaveProfile: () => void;
  onLogout?: () => void;
  onClose: () => void;
  onGoOrders: () => void;
  onGoMessages: () => void;
  onGoRewards: () => void;
};

export function ProfileSettingsTab({
  lang,
  user,
  editName,
  editPhone,
  editEmail,
  editAddress,
  isEditMode,
  isSavingProfile,
  localOrdersCount,
  points,
  unreadCount,
  onSetEditName,
  onSetEditPhone,
  onSetEditEmail,
  onSetEditAddress,
  onToggleEdit,
  onSaveProfile,
  onLogout,
  onClose,
  onGoOrders,
  onGoMessages,
  onGoRewards,
}: ProfileSettingsTabProps) {
  const details = [
    {
      icon: User,
      label: lang === "sw" ? "Jina Kamili" : "Full Name",
      value: user.name,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      icon: Phone,
      label: lang === "sw" ? "Namba ya Simu" : "Phone Number",
      value: user.phone || "N/A",
      tone: "text-slate-700 bg-slate-100",
    },
    {
      icon: Mail,
      label: lang === "sw" ? "Barua Pepe" : "Email Address",
      value: user.email || "N/A",
      tone: "text-slate-700 bg-slate-100",
    },
    {
      icon: MapPin,
      label: lang === "sw" ? "Anwani ya Kufikisha" : "Delivery Address",
      value:
        editAddress || (lang === "sw" ? "Haijawekwa bado" : "Not set yet"),
      tone: "text-slate-700 bg-slate-100",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Header Profile Summary */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-60"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 relative z-10 w-full">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-white border-2 border-white shadow-md flex items-center justify-center shrink-0">
             <User size={36} className="text-indigo-400" />
          </div>
          <div className="text-center md:text-left flex-1 min-w-0">
             <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate px-2 md:px-0">{user.name || "Customer"}</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">{user.email || user.phone || "No contact info"}</p>
             
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xs">
                  <Sparkles size={12} className="text-amber-500" />
                  {points} {lang === "sw" ? "Alama" : "Points"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xs">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Verified
                </span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 relative z-10">
            <button
              type="button"
              onClick={onToggleEdit}
              className={`flex-1 md:flex-none min-h-[44px] px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                isEditMode
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isEditMode ? <X size={16} /> : <Settings size={16} />}
              {isEditMode
                ? lang === "sw"
                  ? "Ghairi"
                  : "Cancel"
                : lang === "sw"
                  ? "Hariri Profaili"
                  : "Edit Profile"}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-[44px] h-[44px] rounded-xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all active:scale-95 shrink-0 shadow-sm"
                title={lang === "sw" ? "Ondoka" : "Logout"}
              >
                <LogOut size={18} />
              </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-1">
             <div className="px-5 py-4 border-b border-slate-100">
               <h3 className="font-extrabold text-slate-800 text-base">
                 {lang === "sw" ? "Taarifa Binafsi" : "Personal Information"}
               </h3>
             </div>
             <div className="p-4 sm:p-5">
               {isEditMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                      {lang === "sw" ? "Jina Kamili" : "Full Name"}
                    </span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => onSetEditName(e.target.value)}
                      className="min-h-[48px] bg-slate-50 border border-slate-200 text-slate-900 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                      {lang === "sw" ? "Namba ya Simu" : "Phone Number"}
                    </span>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => onSetEditPhone(e.target.value)}
                      className="min-h-[48px] bg-slate-50 border border-slate-200 text-slate-900 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                      {lang === "sw" ? "Barua Pepe" : "Email Address"}
                    </span>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => onSetEditEmail(e.target.value)}
                      className="min-h-[48px] bg-slate-50 border border-slate-200 text-slate-900 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                      {lang === "sw" ? "Anwani ya Kufikisha Oda" : "Delivery Address"}
                    </span>
                    <textarea
                      rows={3}
                      value={editAddress}
                      onChange={(e) => onSetEditAddress(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs resize-y min-h-[90px]"
                      placeholder={
                        lang === "sw"
                          ? "Mfano: Kijitonyama, Dar es Salaam"
                          : "e.g. Kijitonyama, Dar es Salaam"
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isSavingProfile}
                    onClick={onSaveProfile}
                    className="sm:col-span-2 min-h-[48px] mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-60 transition-all active:scale-95"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        {lang === "sw" ? "Inahifadhi..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {lang === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {details.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-4 transition-all hover:border-slate-200 hover:shadow-xs group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.tone}`}>
                          <Icon size={18} className="opacity-80" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-0.5">
                            {item.label}
                          </p>
                          <p className="text-sm font-extrabold text-slate-800 truncate" title={String(item.value)}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
               <BellRing size={16} className="text-slate-400" />
               <h3 className="font-extrabold text-slate-800 text-base">
                 {lang === "sw" ? "Mapendeleo na Usalama" : "Preferences & Security"}
               </h3>
             </div>
             <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{lang === "sw" ? "Hali ya Lugha" : "Language & Region"}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {lang === "sw" ? "App inafuata mapendeleo ya kifaa chako." : "App follows your device's preferences."}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-slate-400">{lang.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm mb-1">{lang === "sw" ? "Ulinzi wa Akaunti" : "Account Protection"}</h4>
                    <p className="text-xs text-emerald-700/80 font-medium">
                      {lang === "sw" ? "Taarifa zako nyeti zinalindwa na uthibitisho imara." : "Your sensitive info is protected with secure verification."}
                    </p>
                  </div>
                  <ShieldCheck size={24} className="text-emerald-500 shrink-0 opacity-80" />
                </div>
             </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
           <h3 className="font-extrabold text-slate-800 text-base px-2">
             {lang === "sw" ? "Njia za Haraka" : "Quick Actions"}
           </h3>
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={onGoOrders}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm">{lang === "sw" ? "Oda Zangu" : "My Orders"}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{localOrdersCount} {lang === "sw" ? "rekodi za oda" : "total orders"}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              <button
                type="button"
                onClick={onGoMessages}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-left group"
              >
                <div className="relative w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm">{lang === "sw" ? "Kituo cha Msaada" : "Support Center"}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {unreadCount > 0 ? `${unreadCount} ${lang === "sw" ? "mpya" : "unread"}` : lang === "sw" ? "Ongea na huduma kwa wateja" : "Chat with our team"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              <button
                type="button"
                onClick={onGoRewards}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm">{lang === "sw" ? "Zawadi Zangu" : "My Rewards"}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{points} {lang === "sw" ? "alama zilizokusanywa" : "points collected"}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
