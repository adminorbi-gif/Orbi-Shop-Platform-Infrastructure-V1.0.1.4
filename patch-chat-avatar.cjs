const fs = require('fs');
const file = 'src/components/chat/ChatRoom.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                <div className={\`flex items-end gap-2.5 \${
                  isAiBot 
                    ? "max-w-[98%] sm:max-w-[95%] md:max-w-[92%] lg:max-w-[90%] w-full" 
                    : "max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[82%]"
                }\`}>
                  {(!isMe || isAdminPreview) && msg.senderRole !== 'customer' && (
                    <div className={\`w-7 h-7 rounded-full flex-shrink-0 mb-1 flex items-center justify-center overflow-hidden border shadow-2xs \${
                      isAiBot ? "bg-indigo-600 text-white border-indigo-200" : "bg-slate-150 text-slate-600 border-slate-200"
                    }\`}>
                      {isAiBot ? (
                        <Bot size={13} />
                      ) : (msg.senderId === "support" || msg.senderId === "00000000-0000-0000-0000-000000000001" || msg.senderName?.toLowerCase().includes("orbi shop") || msg.senderName?.toLowerCase().includes("orbi store") || msg.senderRole === "admin") ? (
                        <ImageWithSkeleton
                          src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                          alt="Orbi Logo"
                          containerClassName="w-full h-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] font-black">{msg.senderRole ? msg.senderRole[0].toUpperCase() : "S"}</span>
                      )}
                    </div>
                  )}`;

const replacement = `                <div className={\`flex items-end gap-2.5 \${isMe ? "flex-row-reverse" : ""} \${
                  isAiBot 
                    ? "max-w-[98%] sm:max-w-[95%] md:max-w-[92%] lg:max-w-[90%] w-full" 
                    : "max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[82%]"
                }\`}>
                  <div className={\`w-7 h-7 rounded-full flex-shrink-0 mb-1 flex items-center justify-center overflow-hidden border shadow-2xs \${
                    isAiBot ? "bg-indigo-600 text-white border-indigo-200" : (isMe ? "bg-indigo-500 text-white border-indigo-300" : "bg-slate-150 text-slate-600 border-slate-200")
                  }\`}>
                    {isAiBot ? (
                      <Bot size={13} />
                    ) : (!isMe && (msg.senderId === "support" || msg.senderId === "00000000-0000-0000-0000-000000000001" || msg.senderName?.toLowerCase().includes("orbi shop") || msg.senderName?.toLowerCase().includes("orbi store") || msg.senderRole === "admin")) ? (
                      <ImageWithSkeleton
                        src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                        alt="Orbi Logo"
                        containerClassName="w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : isMe ? (
                       <User size={14} className="text-white" />
                    ) : (
                      <span className="text-[10px] font-black">{msg.senderRole ? msg.senderRole[0].toUpperCase() : "U"}</span>
                    )}
                  </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Success");
} else {
  console.log("Target not found");
}
