const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminApp/index.tsx', 'utf8');

const target = `              <div className="flex items-center gap-2">
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

const replacement = `              <div className="flex flex-col items-center gap-2">
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
              </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log("Target replaced successfully.");
} else {
  console.log("Target NOT FOUND.");
}

fs.writeFileSync('src/pages/AdminApp/index.tsx', content);
