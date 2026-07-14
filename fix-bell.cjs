const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminApp/index.tsx', 'utf8');

const target1 = `              <div className="flex items-center gap-2">
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

const replacement1 = `              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="hover:scale-110 transition bg-white shadow-sm border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold cursor-pointer shrink-0 ml-2"
                title={
                  lang === "sw"
                    ? "Switch to English"
                    : "Badili kwenda Kiswahili"
                }
              >
                {lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
              </button>`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
} else {
    console.log("target1 not found");
}

const target2 = `{ id: "notifications", label: "Notifications", icon: Bell },`;
const replacement2 = `{ id: "notifications", label: "Notifications", icon: Bell, badge: totalNotifications },`;

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
} else {
    console.log("target2 not found");
}

const target3 = `{ id: "notifications", label: "Noti", icon: Bell },`;
const replacement3 = `{ id: "notifications", label: "Noti", icon: Bell, badge: totalNotifications },`;

if (content.includes(target3)) {
    content = content.replace(target3, replacement3);
} else {
    console.log("target3 not found");
}

fs.writeFileSync('src/pages/AdminApp/index.tsx', content);
