const fs = require('fs');
const file = 'src/components/TrackOrderModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                       {/* Hub Activity Checklist */}
                       <div className="border-b border-slate-100 pb-2.5 pt-1 space-y-2">
                         <span className="text-slate-400 block text-[10px] uppercase tracking-wider">{isSw ? "Shughuli za Ghalani (Hub activity):" : "Hub activity"}</span>
                         <div className="space-y-1.5 pl-1 font-mono text-[10px]">
                           <div className="flex items-center gap-2 text-slate-700">
                             {activeIdx >= 0 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <X size={13} className="text-slate-300" />}
                             <span>Arrived: {activeIdx >= 0 ? "tick" : "X"}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-700">
                             {activeIdx >= 1 && hubStatus !== "FAILED" && hubStatus !== "RETURNED" ? <CheckCircle2 size={13} className="text-emerald-500" /> : <X size={13} className={hubStatus === "FAILED" || hubStatus === "RETURNED" ? "text-red-500" : "text-slate-300"} />}
                             <span>QA Passed, Quality: {activeIdx >= 1 && hubStatus !== "FAILED" && hubStatus !== "RETURNED" ? "Passes" : "X"}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-700">
                             {activeIdx >= 2 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <X size={13} className="text-slate-300" />}
                             <span>Packed: {activeIdx >= 2 ? "tick" : "X"}</span>
                           </div>
                         </div>
                       </div>`;

const replacement = `                       {/* Hub Activity Checklist */}
                       <div className="border-b border-slate-100 pb-2.5 pt-1 space-y-2">
                         <span className="text-slate-400 block text-[10px] uppercase tracking-wider">{isSw ? "Shughuli za Ghalani (Hub activity):" : "Hub activity"}</span>
                         <div className="space-y-1.5 pl-1 font-mono text-[10px]">
                           <div className="flex items-center gap-2 text-slate-700">
                             {activeIdx >= 0 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <X size={13} className="text-slate-300" />}
                             <span>{isSw ? "Imefika" : "Arrived"}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-700">
                             {activeIdx >= 1 && hubStatus !== "FAILED" && hubStatus !== "RETURNED" ? <CheckCircle2 size={13} className="text-emerald-500" /> : <X size={13} className={hubStatus === "FAILED" || hubStatus === "RETURNED" ? "text-red-500" : "text-slate-300"} />}
                             <span>{isSw ? "Ukaguzi (QA):" : "QA Inspected:"} {activeIdx >= 1 && hubStatus !== "FAILED" && hubStatus !== "RETURNED" ? (isSw ? "Imepita" : "Passes") : (hubStatus === "FAILED" || hubStatus === "RETURNED" ? (isSw ? "Imeshindikana" : "Failed") : (isSw ? "Inasubiri" : "Pending"))}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-700">
                             {activeIdx >= 2 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <X size={13} className="text-slate-300" />}
                             <span>{isSw ? "Imepakiwa" : "Packed"}</span>
                           </div>
                         </div>
                       </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Success");
} else {
  // Let's try to match with a regex just in case
  const regex = /\{\/\*\s*Hub Activity Checklist\s*\*\/\}.*?Packed: \{activeIdx >= 2 \? "tick" : "X"\}<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/s;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Success Regex");
  } else {
    // maybe it says "X" in Packed
    const regex2 = /\{\/\*\s*Hub Activity Checklist\s*\*\/\}.*?Packed: \{activeIdx >= 2 \? "[^"]*" : "X"\}<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/s;
    if (regex2.test(content)) {
      content = content.replace(regex2, replacement);
      fs.writeFileSync(file, content, 'utf8');
      console.log("Success Regex 2");
    } else {
      console.log("Target not found");
    }
  }
}
