const fs = require('fs');
const file = 'src/pages/ClientApp/components/ClientSmartBundles.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetImport = `import { ImageWithSkeleton } from '../../../components/ImageWithSkeleton';`;
const replaceImport = `import { ImageWithSkeleton } from '../../../components/ImageWithSkeleton';\nimport { DeliveryZone } from '../../../types';`;
content = content.replace(targetImport, replaceImport);

const targetSig = `export function generateSmartBundles(
  products: Product[],
  lang: 'sw' | 'en' = 'en',
  selectedNiche?: string,
  selectedFamily?: string,
  userId?: string
): SmartBundle[] {`;
const replaceSig = `export function generateSmartBundles(
  products: Product[],
  lang: 'sw' | 'en' = 'en',
  selectedNiche?: string,
  selectedFamily?: string,
  userId?: string,
  deliveryZones: DeliveryZone[] = []
): SmartBundle[] {`;
content = content.replace(targetSig, replaceSig);

const targetHubs = `    const cities = ["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Dodoma"];
    const hubs = ["Kariakoo Wholesalers", "Sheikh Amri Plaza", "Nyamagana Central Hub", "Sido Commercial Hub", "Uhuru Street Hub"];
    businessCity = cities[hashVal % cities.length];
    hubName = hubs[hashVal % hubs.length];`;

const replaceHubs = `    let cities = ["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Dodoma"];
    let hubs = ["Kariakoo Wholesalers", "Sheikh Amri Plaza", "Nyamagana Central Hub", "Sido Commercial Hub", "Uhuru Street Hub"];
    
    if (deliveryZones && deliveryZones.length > 0) {
      cities = deliveryZones.map(dz => lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name));
      hubs = cities.map(city => \`\${city} Hub\`);
    }

    businessCity = cities[hashVal % cities.length];
    hubName = hubs[hashVal % hubs.length];`;
content = content.replace(targetHubs, replaceHubs);

fs.writeFileSync(file, content, 'utf8');
