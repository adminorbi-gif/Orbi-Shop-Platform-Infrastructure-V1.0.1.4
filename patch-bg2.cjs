const fs = require('fs');

const file = 'src/pages/ClientApp/components/ClientSmartBundles.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/aspect-\[1\/1\.02\] bg-white/g, 'aspect-[1/1.02] bg-transparent');
  fs.writeFileSync(file, content);
}
console.log("Done");
