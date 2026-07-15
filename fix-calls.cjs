const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `return generateSmartBundles(products, lang, undefined, selectedFamily, activeUser?.id);`,
  `return generateSmartBundles(products, lang, undefined, selectedFamily, activeUser?.id, normalizedDeliveryZones);`
);

content = content.replace(
  `const allBundles = generateSmartBundles(products, lang, undefined, undefined, activeUser?.id);`,
  `const allBundles = generateSmartBundles(products, lang, undefined, undefined, activeUser?.id, normalizedDeliveryZones);`
);

content = content.replace(
  `return generateSmartBundles(products, lang, selectedNiche !== "Zote" ? selectedNiche : undefined, selectedFamily || undefined, activeUser?.id);`,
  `return generateSmartBundles(products, lang, selectedNiche !== "Zote" ? selectedNiche : undefined, selectedFamily || undefined, activeUser?.id, normalizedDeliveryZones);`
);

fs.writeFileSync(file, content, 'utf8');
