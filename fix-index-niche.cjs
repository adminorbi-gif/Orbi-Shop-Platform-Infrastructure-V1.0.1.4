const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `<NicheShoppingCenter\n                    onOpenAIChat`,
  `<NicheShoppingCenter\n                    deliveryZones={normalizedDeliveryZones}\n                    onOpenAIChat`
);

fs.writeFileSync(file, content, 'utf8');
