const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `}, [products, lang, selectedFamily, activeUser?.id]);`,
  `}, [products, lang, selectedFamily, activeUser?.id, normalizedDeliveryZones]);`
);

content = content.replace(
  `}, [products, lang, activeUser?.id]);`,
  `}, [products, lang, activeUser?.id, normalizedDeliveryZones]);`
);

content = content.replace(
  `}, [products, lang, selectedNiche, selectedFamily, activeUser?.id]);`,
  `}, [products, lang, selectedNiche, selectedFamily, activeUser?.id, normalizedDeliveryZones]);`
);

fs.writeFileSync(file, content, 'utf8');
