const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace(/\.orbi-market-product-card\s*\{[\s\S]*?\}/, `.orbi-market-product-card {\n  position: relative;\n  min-width: 0;\n  background: transparent;\n  border-radius: 0;\n  border: none;\n  box-shadow: none;\n}`);

content = content.replace(/\.orbi-market-product-card:hover\s*\{[\s\S]*?\}/, `.orbi-market-product-card:hover {\n  box-shadow: none;\n}`);

content = content.replace(/\.orbi-product-image-stage\s*\{/, `.orbi-product-image-stage {\n  border-radius: 12px;\n  border: 1px solid rgba(0,0,0,0.04);`);

fs.writeFileSync('src/index.css', content);
console.log("Patched CSS");
