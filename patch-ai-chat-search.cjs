const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state for aiSearchQuery and isAiSearchOpen
if (!content.includes('const [aiSearchQuery, setAiSearchQuery]')) {
    content = content.replace(
        'const [aiInputMessage, setAIInputMessage] = useState("");',
        'const [aiInputMessage, setAIInputMessage] = useState("");\n  const [aiSearchQuery, setAiSearchQuery] = useState("");\n  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);'
    );
}

// Add the search icon button in the header
const headerButtonsMatch = content.match(/className="text-\[10px\] hover:bg-white\/10 px-2 py-1 rounded transition border border-white\/20 font-bold"/);
if (headerButtonsMatch) {
    content = content.replace(
        /<button[\s\S]*?className="text-\[10px\] hover:bg-white\/10 px-2 py-1 rounded transition border border-white\/20 font-bold"[\s\S]*?>[\s\S]*?<\/button>/,
        `<button
                    onClick={() => setIsAiSearchOpen(!isAiSearchOpen)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Search Messages"
                  >
                    <Search size={16} />
                  </button>
                  $&`
    );
}

// Add the search input bar below the header
if (!content.includes('placeholder={lang === "sw" ? "Tafuta ujumbe..." : "Search messages..."}')) {
    content = content.replace(
        /<\/div>\n              <\/div>\n              \{\/\* Chat messages \*\/\}/,
        `</div>
              </div>
              
              {/* Search Bar */}
              {isAiSearchOpen && (
                <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={lang === "sw" ? "Tafuta ujumbe..." : "Search messages..."}
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400"
                    />
                    {aiSearchQuery && (
                      <button
                        onClick={() => setAiSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Chat messages */}`
    );
}

// Replace the aiChatHistory.map to filter by aiSearchQuery
const mapMatch = content.match(/\{aiChatHistory\.map\(\(chat, idx\) => \{/);
if (mapMatch) {
    content = content.replace(
        /\{aiChatHistory\.map\(\(chat, idx\) => \{/,
        `{(aiSearchQuery.trim() ? aiChatHistory.filter(c => typeof c.content === 'string' && c.content.toLowerCase().includes(aiSearchQuery.toLowerCase())) : aiChatHistory).map((chat, idx) => {`
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully added AI chat search bar");
