const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminApp/index.tsx', 'utf8');

// 1. Remove Bell from Desktop Header
const desktopHeaderBefore = `              <div className="flex items-center gap-2">
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
              </div>`;

const desktopHeaderAfter = `              <div className="flex items-center gap-2">
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
              </div>`;

content = content.replace(desktopHeaderBefore, desktopHeaderAfter);

// 2. Remove Bell from Mobile Header
const mobileHeaderBefore = `            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => setTab("notifications")}
                className="relative text-slate-500 hover:text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0"
              >
                <Bell size={13} />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[14px] flex items-center justify-center leading-none">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="hover:scale-105 active:scale-95 transition bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold"
              >`;

const mobileHeaderAfter = `            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="hover:scale-105 active:scale-95 transition bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold"
              >`;

content = content.replace(mobileHeaderBefore, mobileHeaderAfter);

// 3. Add Bell to Bottom of Sidebar
const bottomSidebarBefore = `            <div className="mt-auto pt-8 flex flex-col gap-2">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 text-red-500 px-4 py-3 hover:bg-red-50 rounded-xl w-full text-left transition cursor-pointer"
              >
                <LogOut size={18} /> {t(lang, "sidebar.logout")}
              </button>
              <a
                href="/"
                className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                <Store size={18} /> {t(lang, "sidebar.store")}
              </a>
            </div>`;

const bottomSidebarAfter = `            <div className="mt-auto pt-8 flex flex-col gap-2">
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

content = content.replace(bottomSidebarBefore, bottomSidebarAfter);

fs.writeFileSync('src/pages/AdminApp/index.tsx', content);
