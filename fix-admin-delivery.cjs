const fs = require('fs');
const file = 'src/pages/AdminApp/components/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inside delivery zones render loop (there's a section to edit delivery zones)
// Let's find the UI for delivery zones
