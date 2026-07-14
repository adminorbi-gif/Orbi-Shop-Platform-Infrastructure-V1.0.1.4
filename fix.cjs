const fs = require('fs');
let content = fs.readFileSync('src/pages/SellerApp/useSellerApp.tsx', 'utf8');

content = content.replace(
  'const [prodStock,\n    prodSoldBy, setProdStock] = useState("");',
  'const [prodStock, setProdStock] = useState("");'
);

fs.writeFileSync('src/pages/SellerApp/useSellerApp.tsx', content);
console.log("Fixed useSellerApp.tsx");
