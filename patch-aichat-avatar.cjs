const fs = require('fs');
const file = 'src/components/client/AIChatDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `              <div key={idx} className={\`flex \${msg.role === "user" ? "justify-end" : "justify-start"}\`}>
                <div className={\`max-w-[85%] rounded-2xl p-3 shadow-sm \${msg.role === "user" ? "bg-amber-500 text-white" : "bg-white border border-slate-100 text-slate-800"}\`}>`;

const replacement = `              <div key={idx} className={\`flex items-end gap-2 \${msg.role === "user" ? "flex-row-reverse justify-start" : "justify-start"}\`}>
                <div className={\`w-7 h-7 shrink-0 rounded-full flex items-center justify-center \${msg.role === "user" ? "bg-amber-500 text-white" : "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm"}\`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={\`max-w-[80%] rounded-2xl p-3 shadow-sm \${msg.role === "user" ? "bg-amber-500 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"}\`}>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Success");
} else {
  console.log("Target not found");
}
