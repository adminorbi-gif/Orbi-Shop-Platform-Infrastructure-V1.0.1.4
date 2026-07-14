const fs = require('fs');

const fixClientAppIndex = () => {
  const file = 'src/pages/ClientApp/index.tsx';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"/g,
    'className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-[13px]"'
  );
  fs.writeFileSync(file, content);
};

const fixProductDetail = () => {
  const file = 'src/pages/ProductDetailPage.tsx';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"/g,
    'className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-[13px]"'
  );
  content = content.replace(
    /className="w-full h-full object-contain p-5 sm:p-7 lg:p-8 transition-transform duration-200 ease-out lg:group-hover:scale-\[2\.2\]"/g,
    'className="w-full h-full object-cover transition-transform duration-200 ease-out lg:group-hover:scale-[2.2] rounded-[13px]"'
  );
  fs.writeFileSync(file, content);
};

fixClientAppIndex();
fixProductDetail();
console.log("Done");
