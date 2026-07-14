const fs = require('fs');
const file = 'src/pages/ClientApp/components/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '              ) : (\n                localOrders.map((o) => {\n                  const statusUpper = o.status\n                    ? o.status.toUpperCase()\n                    : "CREATED";\n                  const payStatus = o.paymentStatus || "requires_action";\n                  return (\n                    <div\n                      key={o.id}';
const endStr = '                      </div>\n                    </div>\n                  );\n                })\n              )}\n            </ProfileOrdersTab>';

const startIndex = content.indexOf(startStr);
console.log(startIndex !== -1 ? "FOUND START" : "NOT FOUND START");

if (startIndex === -1) {
    // Try a looser match
    console.log("Trying looser match...");
    const looserMatch = content.match(/localOrders\.map\(\(o\) => \{[\s\S]*?return \([\s\S]*?<div[\s\S]*?key=\{o\.id\}/);
    if (looserMatch) {
        console.log("Found looser match for start");
    }
}
