const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace(
  / gap: clamp\(8px, 1vw, 10px\);/,
  ' gap: clamp(13px, calc(1vw + 5px), 15px);'
);

fs.writeFileSync('src/index.css', content);
console.log("Patched index.css successfully");
