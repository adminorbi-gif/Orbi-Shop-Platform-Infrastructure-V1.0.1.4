const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const matches = content.match(/import\s*\{[^}]*?Search[^}]*?\}\s*from\s*['"]lucide-react['"]/);
if (!matches) {
    content = content.replace(/import\s*\{/, 'import { Search, ');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Added Search import to lucide-react");
} else {
    console.log("Search import already exists in lucide-react");
}

