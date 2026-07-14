const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetailPage.tsx', 'utf8');

// Find the section that looks like:
//             </div>
// 
//           </div>
// 
//             {/* Reviews Section */}

const badPattern = /<\/div>\s*<\/div>\s*\{\/\* Reviews Section \*\/\}/s;
if (badPattern.test(code)) {
    console.log("Found bad pattern!");
    
    // We want to remove the extra closing div before Reviews Section, and add it after Reviews Section.
    // Let's replace the `</div>\n\n          </div>\n\n            {/* Reviews Section */}`
    // with `</div>\n\n            {/* Reviews Section */}`
    // AND we need to add `</div>` before `/* Right Column: Details */`
    
    code = code.replace(/(\s*)<\/div>(\s*)<\/div>(\s*)\{\/\* Reviews Section \*\/\}/, '$1</div>$3{/* Reviews Section */}');
    
    // Now add the `</div>` before Right Column
    code = code.replace(/(\s*)\{\/\* Right Column: Details \*\/\}/, '$1</div>$1{/* Right Column: Details */}');
    
    fs.writeFileSync('src/pages/ProductDetailPage.tsx', code);
    console.log("Fixed!");
} else {
    console.log("Pattern not found");
}
