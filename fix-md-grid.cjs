const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetailPage.tsx', 'utf8');

// Container
code = code.replace(/lg:grid-cols-\[minmax\(0,1\.2fr\)_minmax\(22rem,0\.8fr\)\]/, 'md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]');

// Left Column (Images)
code = code.replace(/order-1 lg:col-start-1 lg:col-span-1 lg:order-none/, 'order-1 md:col-start-1 md:col-span-1 md:order-none');

// Description
code = code.replace(/order-3 lg:col-start-1 lg:col-span-1 lg:order-none/, 'order-3 md:col-start-1 md:col-span-1 md:order-none');

// Reviews
code = code.replace(/order-4 lg:col-start-1 lg:col-span-1 lg:order-none/, 'order-4 md:col-start-1 md:col-span-1 md:order-none');

// Right Column
code = code.replace(/lg:sticky lg:top-6 lg:z-10 lg:self-start lg:row-span-3 order-2 lg:col-start-2 lg:col-span-1 lg:order-none/, 'md:sticky md:top-6 md:z-10 md:self-start md:row-span-3 order-2 md:col-start-2 md:col-span-1 md:order-none');

fs.writeFileSync('src/pages/ProductDetailPage.tsx', code);
console.log("Done fixing md grid");
