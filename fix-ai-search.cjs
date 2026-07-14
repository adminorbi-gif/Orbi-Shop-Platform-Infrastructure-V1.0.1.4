const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// The script added it somewhere random because I replaced a wrong text, wait, my script was:
// content = content.replace('const [aiInputMessage, setAIInputMessage] = useState("");', ... )
// But I saw an error that `isAiSearchOpen` was not defined around 4719.
// So let's find where the state variables are inside ClientApp and add it there.
const clientAppStartMatch = content.indexOf('export default function ClientApp() {');
if (clientAppStartMatch !== -1) {
    // Add the states right after export default function ClientApp() {
    if (!content.includes('const [aiSearchQuery, setAiSearchQuery]')) {
        content = content.replace(
            'export default function ClientApp() {',
            'export default function ClientApp() {\n  const [aiSearchQuery, setAiSearchQuery] = useState("");\n  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);'
        );
    } else {
        // Wait, maybe it did add it, but somewhere else. Let's see if we can find where it added it.
        const matches = content.match(/const \[aiSearchQuery, setAiSearchQuery\] = useState\(""\);\n  const \[isAiSearchOpen, setIsAiSearchOpen\] = useState\(false\);/g);
        console.log("Found occurrences of our state definition: ", matches ? matches.length : 0);
        if (matches && matches.length > 0 && !content.substring(clientAppStartMatch, clientAppStartMatch + 500).includes('setAiSearchQuery')) {
            // It added it outside the component, let's remove it and put it inside.
            content = content.replace('const [aiSearchQuery, setAiSearchQuery] = useState("");\n  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);', '');
            content = content.replace(
                'export default function ClientApp() {',
                'export default function ClientApp() {\n  const [aiSearchQuery, setAiSearchQuery] = useState("");\n  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);'
            );
        }
    }
    
    // Also fix the Search import duplication
    content = content.replace(/Filter, Search,/g, 'Filter,');
    content = content.replace(/Filter,Search,/g, 'Filter,');
}

fs.writeFileSync(file, content, 'utf8');
