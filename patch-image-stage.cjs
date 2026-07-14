const fs = require('fs');
let file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.orbi-product-image-stage\s*\{[\s\S]*?\}/, `.orbi-product-image-stage {\n  background: transparent;\n  border: none;\n  border-radius: 12px;\n}`);

fs.writeFileSync(file, content);
console.log("Done");
