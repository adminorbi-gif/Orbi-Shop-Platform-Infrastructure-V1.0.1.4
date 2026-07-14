const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminApp/index.tsx', 'utf8');

const topTarget = `              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                  className="hover:scale-110 transition bg-white shadow-sm border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold cursor-pointer shrink-0"
                  title={
                    lang === "sw"
                      ? "Switch to English"
                      : "Badili kwenda Kiswahili"
                  }
                >
                  {lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
                </button>
              </div>
            </div>
            {currentStaff && (`;

const topReplacement = `              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab("notifications")}
                  className="relative hover:scale-110 transition bg-white shadow-sm border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
                  title={lang === "sw" ? "Taarifa" : "Notifications"}
                >
                  <Bell size={16} className="text-slate-600" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center leading-none">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                  className="hover:scale-110 transition bg-white shadow-sm border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold cursor-pointer shrink-0"
                  title={
                    lang === "sw"
                      ? "Switch to English"
                      : "Badili kwenda Kiswahili"
                  }
                >
                  {lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
                </button>
              </div>
            </div>
            {currentStaff && (`;

if (content.includes(topTarget)) {
  content = content.replace(topTarget, topReplacement);
  console.log("Top target replaced");
} else {
  console.log("Top target NOT FOUND");
}

const bottomTarget = `            <div className="mt-auto pt-8 flex flex-col gap-2">
              <button
                onClick={() => setTab("notifications")}
                className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer relative"
              >
                <Bell size={18} /> {lang === "sw" ? "Taarifa" : "Notifications"}
                {totalNotifications > 0 && (
                  <span className="absolute right-4 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </span>
                )}
              </button>
              <a
                href="/"
                className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                <Store size={18} /> {t(lang, "sidebar.store")}
              </a>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 text-red-500 px-4 py-3 hover:bg-red-50 rounded-xl w-full text-left transition cursor-pointer"
              >
                <LogOut size={18} /> {t(lang, "sidebar.logout")}
              </button>
            </div>`;

const bottomReplacement = `            <div className="mt-auto pt-8 flex flex-col gap-2">
              <a
                href="/"
                className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                <Store size={18} /> {t(lang, "sidebar.store")}
              </a>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 text-red-500 px-4 py-3 hover:bg-red-50 rounded-xl w-full text-left transition cursor-pointer"
              >
                <LogOut size={18} /> {t(lang, "sidebar.logout")}
              </button>
            </div>`;

if (content.includes(bottomTarget)) {
  content = content.replace(bottomTarget, bottomReplacement);
  console.log("Bottom target replaced");
} else {
  console.log("Bottom target NOT FOUND");
}

fs.writeFileSync('src/pages/AdminApp/index.tsx', content);
