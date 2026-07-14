const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

const regex = /(<\/h3>\s*)(<div className="flex items-center justify-between gap-2 text-\[10px\]">[\s\S]*?<\/div>)(\s*<div className="space-y-1\.5">\s*<div className="flex min-w-0 flex-wrap items-center gap-1\.5">[\s\S]*?<\/div>)/;

const match = content.match(regex);
if (match) {
  const newContent = content.replace(regex, `$1$3\n            $2`);
  fs.writeFileSync('src/pages/ClientApp/index.tsx', newContent);
  console.log("Patched successfully");
} else {
  console.log("Regex didn't match");
}
