const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetailPage.tsx', 'utf8');

const reviewsRegex = /\{\/\* Reviews Section \*\/\}\s*<div id="reviews".*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/s;
const prodInfoRegex = /\{\/\* Product Information \(Moved from bottom\) \*\/\}\s*<div id="description".*?<\/div>\s*<\/div>\s*<\/div>/s;

const matchReviews = code.match(reviewsRegex);
const matchProdInfo = code.match(prodInfoRegex);

if (matchReviews && matchProdInfo) {
    console.log("Matched both");
    const reviewsBlock = matchReviews[0];
    const prodInfoBlock = matchProdInfo[0];
    
    const block1 = reviewsBlock;
    const block2 = prodInfoBlock;
    
    // The current order is reviewsBlock then prodInfoBlock.
    const combinedCurrent = block1 + '\n\n            ' + block2;
    
    // Add mt-2 to reviews
    let newReviewsBlock = reviewsBlock.replace('<div id="reviews" className="orbi-product-detail-card rounded-[1.75rem] overflow-hidden">', '<div id="reviews" className="orbi-product-detail-card rounded-[1.75rem] overflow-hidden mt-2 scroll-mt-28">');
    // Remove mt-2 from prod info (or maybe keep it? Let's just swap them)
    
    // It's probably easier to just replace both in the file directly.
    code = code.replace(block1, '');
    code = code.replace(block2, block2 + '\n\n            ' + newReviewsBlock);
    
    fs.writeFileSync('src/pages/ProductDetailPage.tsx', code);
    console.log("Reordered!");
} else {
    console.log("Not matched", !!matchReviews, !!matchProdInfo);
}
