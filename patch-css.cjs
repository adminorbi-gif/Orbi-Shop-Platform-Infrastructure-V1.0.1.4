const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace(/\.orbi-market-product-card\s*\{[\s\S]*?\}/, '.orbi-market-product-card {\n  position: relative;\n  min-width: 0;\n  background: #ffffff;\n  border-radius: 12px;\n  border: 1px solid #e2e8f0;\n  box-shadow: none;\n}');

content = content.replace(/\.orbi-market-product-card:hover\s*\{[\s\S]*?\}/, '.orbi-market-product-card:hover {\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);\n}');

fs.writeFileSync('src/index.css', content);
