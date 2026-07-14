const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminApp/index.tsx', 'utf8');

const targetMobile = `            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="hover:scale-105 active:scale-95 transition bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold"
              >
                {lang === "sw" ? "EN" : "SW"}
              </button>
              <a
                href="/"
                className="text-slate-500 hover:text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0"
              >
                <Store size={13} />
              </a>
              <button
                onClick={onLogout}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-100/70 flex items-center justify-center shrink-0"
              >
                <LogOut size={13} />
              </button>
            </div>`;

const replacementMobile = `            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => setTab("notifications")}
                className="relative text-slate-500 hover:text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0"
                title={lang === "sw" ? "Taarifa" : "Notifications"}
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
              >
                {lang === "sw" ? "EN" : "SW"}
              </button>
              <a
                href="/"
                className="text-slate-500 hover:text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0"
              >
                <Store size={13} />
              </a>
              <button
                onClick={onLogout}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-100/70 flex items-center justify-center shrink-0"
              >
                <LogOut size={13} />
              </button>
            </div>`;

if (content.includes(targetMobile)) {
  content = content.replace(targetMobile, replacementMobile);
} else {
  console.log("targetMobile not found");
}

fs.writeFileSync('src/pages/AdminApp/index.tsx', content);
