const fs = require('fs');

let file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

// Change gap to 5px to 10px if that's what they actually meant. But they probably meant 10px to 15px. Let's make it 8px to 10px max.
content = content.replace(/gap: clamp\(10px, 1\.2vw, 15px\);/g, 'gap: clamp(8px, 1vw, 10px);');

fs.writeFileSync(file, content);
console.log("Done gap");
