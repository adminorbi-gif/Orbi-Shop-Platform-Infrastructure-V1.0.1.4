const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

const regex = /\s*\{\!isOutOfStock \? \([\s\S]*?\([\s\S]*?View details[\s\S]*?<\/span>\s*<\/button>\s*\)\}/;
if (content.match(regex)) {
  const newContent = content.replace(regex, '');
  fs.writeFileSync('src/pages/ClientApp/index.tsx', newContent);
  console.log("Patched successfully");
} else {
  console.log("Regex didn't match");
}
