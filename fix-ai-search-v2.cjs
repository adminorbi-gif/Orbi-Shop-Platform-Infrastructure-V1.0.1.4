const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add aiSearchQuery back into ClientApp if it's missing (which it is, based on linter errors on line 4719, etc)
const appStateHookRegex = /export default function ClientApp\(\)\s*\{/g;
if (appStateHookRegex.test(content) && !content.includes('const [aiSearchQuery, setAiSearchQuery] = useState("");')) {
    content = content.replace(/export default function ClientApp\(\)\s*\{/, 
        'export default function ClientApp() {\n  const [aiSearchQuery, setAiSearchQuery] = useState("");\n  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);'
    );
}

// 2. Put the button in the right place
const clearBtnRegex = /(<button[\s\S]*?className="text-\[10px\] hover:bg-white\/10 px-2 py-1 rounded transition border border-white\/20 font-bold"[\s\S]*?title=\{lang === "sw" \? "Futa Historia" : "Clear History"\}[\s\S]*?>[\s\S]*?<\/button>)/;
if (!content.includes('title="Search Messages"')) {
    content = content.replace(clearBtnRegex, `<button
                    onClick={() => setIsAiSearchOpen(!isAiSearchOpen)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Search Messages"
                  >
                    <Search size={16} />
                  </button>
                  $1`);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed Search state and button placement");
