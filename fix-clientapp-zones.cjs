const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const insertionPoint = `  useEffect(() => {
    if (visualSearchError) {
      showAlert(visualSearchError, "error");
    }
  }, [visualSearchError, showAlert]);`;

const toInsert = `  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);

  useEffect(() => {
    let active = true;
    getCachedDeliveryZones().then((zones) => {
      if (active) setDeliveryZones(zones);
    });
    return () => {
      active = false;
    };
  }, []);

  const normalizedDeliveryZones = useMemo(() => normalizeDeliveryZones(deliveryZones), [deliveryZones]);`;

if (content.includes(insertionPoint)) {
  content = content.replace(insertionPoint, insertionPoint + '\n\n' + toInsert);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully inserted deliveryZones state inside ClientApp.");
} else {
  console.log("Insertion point not found.");
}
