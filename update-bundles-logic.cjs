const fs = require('fs');
const file = 'src/pages/ClientApp/components/ClientSmartBundles.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLogic = `    let cities = ["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Dodoma"];
    let hubs = ["Kariakoo Wholesalers", "Sheikh Amri Plaza", "Nyamagana Central Hub", "Sido Commercial Hub", "Uhuru Street Hub"];
    
    if (deliveryZones && deliveryZones.length > 0) {
      cities = deliveryZones.map(dz => lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name));
      hubs = cities.map(city => \`\${city} Hub\`);
    }`;

const replaceLogic = `    let cities = ["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Dodoma"];
    let hubs = ["Kariakoo Wholesalers", "Sheikh Amri Plaza", "Nyamagana Central Hub", "Sido Commercial Hub", "Uhuru Street Hub"];
    
    if (deliveryZones && deliveryZones.length > 0) {
      const b2bHubs = deliveryZones.filter(dz => dz.isB2bHub);
      if (b2bHubs.length > 0) {
        cities = b2bHubs.map(dz => lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name));
        hubs = b2bHubs.map(dz => dz.b2bHubName || \`\${lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name)} Hub\`);
      } else {
        // Fallback to all zones if no specific B2B hubs configured
        cities = deliveryZones.map(dz => lang === 'sw' ? (dz.labelSw || dz.name) : (dz.labelEn || dz.name));
        hubs = cities.map(city => \`\${city} Hub\`);
      }
    }`;

content = content.replace(targetLogic, replaceLogic);
fs.writeFileSync(file, content, 'utf8');
