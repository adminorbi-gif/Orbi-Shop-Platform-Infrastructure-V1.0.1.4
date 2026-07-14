const fs = require('fs');

const filesToPatch = [
  'src/pages/ClientApp/index.tsx'
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/bg-\[#f1f5f9\]\/50 /g, 'bg-transparent ');
    content = content.replace(/bg-slate-100 /g, 'bg-transparent ');
    fs.writeFileSync(file, content);
  }
}
console.log("Done");
