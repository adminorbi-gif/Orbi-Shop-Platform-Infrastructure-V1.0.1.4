const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const badButtonStr = `<button
                    onClick={() => setIsAiSearchOpen(!isAiSearchOpen)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Search Messages"
                  >
                    <Search size={16} />
                  </button>
                  <button`;

if (content.includes(badButtonStr)) {
    content = content.replace(badButtonStr, '<button');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Removed bad search button from DropdownFilter");
} else {
    console.log("Could not find bad button string in DropdownFilter");
}
