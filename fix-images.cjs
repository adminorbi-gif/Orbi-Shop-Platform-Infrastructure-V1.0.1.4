const fs = require('fs');

const fixProductGrid = () => {
  const file = 'src/components/client/ProductGrid.tsx';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className="h-full w-full object-cover sm:object-contain p-1 transition-transform duration-700 group-hover:scale-\[1\.03\] rounded-\[13px\] border-solid"/g,
    'className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] rounded-[13px]"'
  );
  // Also just in case there's any other variant
  content = content.replace(
    /className="h-full w-full object-cover sm:object-contain p-1 transition-transform duration-700 group-hover:scale-\[1\.03\]"/g,
    'className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"'
  );
  fs.writeFileSync(file, content);
};

const fixClientAppIndex = () => {
  const file = 'src/pages/ClientApp/index.tsx';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className="h-full w-full object-contain p-3\.5 transition duration-700 ease-out group-hover:scale-\[1\.045\] sm:p-4 border-none"/g,
    'className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045] border-none rounded-[13px]"'
  );
  content = content.replace(
    /className="w-full h-full object-contain p-1 group-hover:scale-\[1\.03\] transition duration-500"/g,
    'className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500 rounded-[13px]"'
  );
  fs.writeFileSync(file, content);
};

const fixSmartBundles = () => {
  const file = 'src/pages/ClientApp/components/ClientSmartBundles.tsx';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className="w-full h-full object-contain p-1"/g,
    'className="w-full h-full object-cover rounded-[13px]"'
  );
  fs.writeFileSync(file, content);
};

const fixProductDetail = () => {
  const file = 'src/pages/ProductDetailPage.tsx';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className="w-full h-full object-contain p-4 transition-transform duration-500 sm:group-hover:scale-105"/g,
    'className="w-full h-full object-cover transition-transform duration-500 sm:group-hover:scale-105 rounded-[13px]"'
  );
  content = content.replace(
    /className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"/g,
    'className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-[13px]"'
  );
  fs.writeFileSync(file, content);
};

fixProductGrid();
fixClientAppIndex();
fixSmartBundles();
fixProductDetail();
console.log("Done");
