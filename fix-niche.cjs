const fs = require('fs');
const file = 'src/components/client/NicheShoppingCenter.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetImport = `import { Product, Category, DeliveryRule } from "../../types";`;
const replaceImport = `import { Product, Category, DeliveryRule, DeliveryZone } from "../../types";`;
if (content.includes(targetImport)) {
  content = content.replace(targetImport, replaceImport);
} else {
  content = content.replace(`import { Product, Category } from "../../types";`, `import { Product, Category, DeliveryZone } from "../../types";`);
}

content = content.replace(
  `interface NicheShoppingCenterProps {`,
  `interface NicheShoppingCenterProps {\n  deliveryZones?: DeliveryZone[];`
);

content = content.replace(
  `  currentUserId?: string;\n}) => {`,
  `  currentUserId?: string;\n  deliveryZones?: DeliveryZone[];\n}) => {`
);

content = content.replace(
  `  const smartBundles = React.useMemo(() => {
    return generateSmartBundles(products, lang, nicheObj.name, selectedFamily, currentUserId);
  }, [products, lang, nicheObj.name, selectedFamily, currentUserId]);`,
  `  const smartBundles = React.useMemo(() => {
    return generateSmartBundles(products, lang, nicheObj.name, selectedFamily, currentUserId, deliveryZones);
  }, [products, lang, nicheObj.name, selectedFamily, currentUserId, deliveryZones]);`
);

fs.writeFileSync(file, content, 'utf8');
