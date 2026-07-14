const fs = require('fs');
const file = 'src/pages/ClientApp/components/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                        {/* Status Tracker & Actions */}
                        <div className="lg:w-64 xl:w-72 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 shrink-0">`;

// Check how many times it appears
const count = (content.match(new RegExp(targetStr.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), "g")) || []).length;
console.log("Count:", count);

if (count > 0 && count % 2 === 0) { // e.g. 2 times per card
  // Replace the first one up to the second one
  // Wait, I can just re-apply the patch over the current card.
}

