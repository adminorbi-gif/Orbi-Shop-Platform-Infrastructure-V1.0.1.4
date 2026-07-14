const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// replace gap: clamp(0.65rem, 1.55vw, 1.2rem); with gap: clamp(10px, 1.2vw, 15px);
content = content.replace(/gap: clamp\(0\.65rem, 1\.55vw, 1\.2rem\);/g, 'gap: clamp(10px, 1.2vw, 15px);');

// Just in case it's different, let's also do a general replace in .orbi-product-list-grid
content = content.replace(/\.orbi-product-list-grid\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(auto-fill, minmax\(140px, 1fr\)\);\s*gap:[^;]+;/g, 
'.orbi-product-list-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n  gap: clamp(10px, 1.2vw, 15px);');

fs.writeFileSync('src/index.css', content);
console.log("Done");
