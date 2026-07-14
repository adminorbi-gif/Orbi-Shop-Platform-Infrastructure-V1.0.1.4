import React, { useMemo, useState, useEffect } from 'react';
import { Product } from '../../../types';
import { SmartBundle } from './ClientSmartBundles';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { db } from '../../../lib/db';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Minus,
  Package,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Zap,
  Building2,
  FileText,
  Clock,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Layers,
  Share2
} from 'lucide-react';
import { formatCurrency } from '../../../lib/storage';
import { PriceDisplay } from '../../../components/PriceDisplay';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithSkeleton } from '../../../components/ImageWithSkeleton';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_ROUTES_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY' && GOOGLE_MAPS_API_KEY !== '';

function MapInstructionsSplash({ lang }: { lang: 'sw' | 'en' }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl h-64 text-center">
      <MapPin size={24} className="text-slate-400 mb-2 animate-bounce" />
      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
        {lang === 'sw' ? 'Ramani Halisi Inahitajika' : 'Real-time Interactive Map'}
      </h4>
      <p className="text-[10px] text-slate-500 font-medium max-w-xs mt-1.5 leading-relaxed">
        {lang === 'sw' 
          ? 'Tafadhali weka secret yenye jina GOOGLE_MAPS_PLATFORM_KEY kwenye mipangilio ya AI Studio (Gear Icon ⚙️ -> Secrets) ili kuwezesha ramani halisi ya usafirishaji.'
          : 'Please add a secret named GOOGLE_MAPS_PLATFORM_KEY in AI Studio Settings (Gear Icon ⚙️ -> Secrets) to enable interactive Google Maps.'}
      </p>
    </div>
  );
}

const HUB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Dar es Salaam': { lat: -6.7924, lng: 39.2083 },
  'Mwanza': { lat: -2.5164, lng: 32.9014 },
  'Arusha': { lat: -3.3731, lng: 36.6853 },
  'Dodoma': { lat: -6.1630, lng: 35.7516 },
  'Mbeya': { lat: -8.9000, lng: 33.4500 }
};

function GeocodedHubMarker({ address, label }: { address: string; label: string }) {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  const fallbackPos = HUB_COORDINATES[address] || HUB_COORDINATES['Dar es Salaam'];
  const [position, setPosition] = useState<google.maps.LatLngLiteral>(fallbackPos);

  useEffect(() => {
    if (map && fallbackPos) {
      map.panTo(fallbackPos);
      map.setZoom(8);
    }
  }, [map, fallbackPos]);

  useEffect(() => {
    if (!geocodingLib || !map || !address) return;

    // Sanitize search name for better results
    const lower = address.toLowerCase();
    let queryAddress = address;
    if (lower.includes('karibu')) {
      queryAddress = 'Morogoro';
    } else if (lower.includes('mingine')) {
      queryAddress = 'Dodoma';
    }

    if (!queryAddress.toLowerCase().includes('tanzania')) {
      queryAddress = `${queryAddress}, Tanzania`;
    }

    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address: queryAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const pos = { lat: loc.lat(), lng: loc.lng() };
        setPosition(pos);
        map.panTo(pos);
        map.setZoom(8);
      } else {
        console.warn('Geocoding failed for address, using fallback preset:', queryAddress, status);
      }
    });
  }, [geocodingLib, map, address]);

  return (
    <AdvancedMarker position={position} title={label}>
      <Pin background="#ff4c00" glyphColor="#fff" borderColor="#ffffff" />
    </AdvancedMarker>
  );
}

function InteractiveHubMap({ address, label, lang }: { address: string; label: string; lang: 'sw' | 'en' }) {
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn("Google Maps Auth/Billing Failure detected. Activating fallback graphics.");
      setMapError(true);
    };
    (window as any).gm_authFailure = handleAuthFailure;
    return () => {
      if ((window as any).gm_authFailure === handleAuthFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  if (!hasValidKey || mapError) {
    return (
      <div className="mt-3.5 relative overflow-hidden rounded-2xl border border-slate-200 h-64 bg-slate-50 flex flex-col justify-between p-4">
        {/* Background custom routing grid mapping */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 40 L 500 40 M 0 100 L 500 100 M 0 160 L 500 160 M 0 220 L 500 220" stroke="#ff4c00" strokeWidth="1" fill="none" />
            <path d="M 50 0 L 50 300 M 150 0 L 150 300 M 250 0 L 250 300 M 350 0 L 350 300" stroke="#ff4c00" strokeWidth="1" fill="none" />
            <path d="M 20 40 L 150 160 L 300 100 L 450 200" stroke="#ff4c00" strokeWidth="2.5" strokeDasharray="6,4" fill="none" />
          </svg>
        </div>

        {/* Floating status badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 border border-orange-200">
            <span className="h-2 w-2 rounded-full bg-[#ff4c00] animate-pulse" />
            <span className="text-[9px] font-black uppercase text-[#ff4c00] tracking-wider">
              {lang === 'sw' ? 'Logistiki Halisi' : 'Logistics Radar'}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {address} Hub
          </span>
        </div>

        {/* Visual hub coordinate ping */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto">
          <div className="relative h-16 w-16 flex items-center justify-center">
            <span className="absolute h-14 w-14 rounded-full bg-orange-500/10 border border-orange-500/20 animate-ping" />
            <span className="absolute h-8 w-8 rounded-full bg-orange-500/20 animate-pulse" />
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#ff4c00] text-white shadow-md border-2 border-white">
              <MapPin size={18} className="fill-white/20 animate-bounce" />
            </div>
          </div>
          <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mt-2">
            {lang === 'sw' ? `Kituo cha ${label}` : `${label} Hub Station`}
          </h5>
          <p className="text-[9px] text-slate-500 font-medium max-w-xs text-center mt-1">
            {lang === 'sw' 
              ? 'Njia thabiti ya usafirishaji inafuatiliwa kwa ufanisi.'
              : 'Transit routes and delivery status tracked successfully.'}
          </p>
        </div>

        {/* Billing Warning message shown subtly in footer if mapError is true */}
        {mapError && (
          <div className="relative z-10 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-center text-[8px] font-semibold leading-relaxed">
            {lang === 'sw'
              ? 'Ramani halisi imebadilishwa kuwa mfumo wa rada kwa sababu akaunti ya Google Cloud haina malipo (billing) yaliyowezeshwa.'
              : 'Google Maps converted to logistics radar due to BillingNotEnabled on the Google Cloud project.'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3.5 relative overflow-hidden rounded-2xl border border-slate-200 h-64 bg-slate-50">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
        <Map
          defaultCenter={HUB_COORDINATES[address] || { lat: -6.7924, lng: 39.2083 }}
          defaultZoom={7}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
          disableDefaultUI={true}
          zoomControl={true}
        >
          <GeocodedHubMarker address={address} label={label} />
        </Map>
      </APIProvider>
    </div>
  );
}

interface BusinessBundleDetailPageProps {
  bundle: SmartBundle;
  lang: 'sw' | 'en';
  onClose: () => void;
  allBundles: SmartBundle[];
  onSelectBundle: (b: SmartBundle) => void;
  onAddToCart: (p: Product, openCart?: boolean, quantity?: number) => void;
  onSelectProduct: (p: Product) => void;
  products: Product[];
  sellers: any[];
}

const localT = {
  en: {
    back: 'Back to bundles',
    breadcrumbMarket: 'Enterprise Bundles',
    category: 'Corporate Solutions',
    ready: 'Ready to Procure',
    bundleLabel: 'Enterprise Bundle Offer',
    save: 'Instantly Save',
    off: 'off',
    items: 'integrated items',
    stock: 'In stock',
    escrowMini: 'Orbi PaySafe',
    certified: 'TBS Verified',
    savingTitle: 'Consolidated Savings',
    savingDesc: 'Your total combined discount when procuring this bundle package.',
    priceTitle: 'Procurement Price',
    eachPrice: 'Standard Single Value',
    quantity: 'Procurement Volume',
    addToCart: 'Procure Bundle to Cart',
    buyNow: 'Instant Checkout (Escrow)',
    adding: 'Consolidating package order...',
    added: 'Bundle successfully queued!',
    escrowNote: 'Secured by Orbi PaySafe Escrow. Your funds are held safely and only released once delivery and item inspection are fully validated.',
    trustEscrow: 'Orbi PaySafe Escrow',
    trustEscrowDesc: '100% payment protection. Funds are disbursed to vendors only upon your verified inspection.',
    trustDelivery: 'Consolidated Cargo Freight',
    trustDeliveryDesc: 'Prepared, verified, and shipped as a single logistics unit within 24–48 hours.',
    trustQuality: 'Dual Quality Inspection',
    trustQualityDesc: 'All items undergo rigid TBS quality standards check at the Kariakoo Hub before cargo load.',
    trustSeller: 'Verified Enterprise Sellers',
    trustSellerDesc: 'Sourced exclusively from vetted tier-1 wholesalers and direct factories on Orbi.',
    included: 'Sourced Items & Components',
    includedDesc: 'These products are pooled from top verified sellers and packed as a single cargo unit.',
    viewProduct: 'Inspect specifications',
    seller: 'Vendor Shop',
    deliveryTitle: 'Kariakoo Commercial Hub',
    deliveryDesc: 'Packages are consolidated and dispatched from Dar es Salaam Kariakoo Hub to your destination.',
    cargoNote: 'Major freight lines supported: Hood, Sabasaba, Abood, BM, GPS, and secondary logistics lines.',
    verifiedSellers: 'Authorized Wholesalers',
    whyTitle: 'Commercial Procurement Advantages',
    whyOne: 'Lower unit costs compared to buying separate items.',
    whyTwo: 'Consolidated cargo logistics saving up to 45% in transit fees.',
    whyThree: 'Automated TRA EFD-compliant business invoicing support.',
    whyFour: 'Rigid Kariakoo hub inspection to prevent defect overheads.',
    related: 'Alternative Enterprise Packages',
    seeAll: 'View all centers',
    choose: 'Procure bundle',
    from: 'From',
    
    // Enterprise Extensions
    volumeTiers: 'Enterprise Volume Procurement',
    volumeTiersDesc: 'Save more on bulk logistics. Select quantities to unlock extra wholesale discount tiers.',
    tierLabel: 'Tier Name',
    qtyRange: 'Quantity',
    extraDiscount: 'Extra Discount',
    tierStandard: 'Standard Tier (1-4 Pcs)',
    tierMerchant: 'Merchant Bulk (5-9 Pcs)',
    tierWholesale: 'Wholesale Group (10-24 Pcs)',
    tierCorporate: 'Corporate VIP (25+ Pcs)',
    rfqTitle: 'Request Customized Corporate Quote',
    rfqDesc: 'Need bespoke product specifications, custom branding, or volume adjustments? Submit a corporate inquiry.',
    rfqBtn: 'Submit RFQ / Bulk Customization',
    rfqName: 'Your Full Name / Company Name',
    rfqContact: 'WhatsApp / Mobile Number',
    rfqNotes: 'Custom specifications or logistic requirements...',
    rfqSubmit: 'Send RFQ to Orbi Sourcing Advisors',
    rfqSuccess: 'Your RFQ has been received! Our corporate procurement managers will contact you within 2 hours.',
    taxInvoiceTitle: 'TRA EFD Tax Invoice Included',
    taxInvoiceDesc: 'This procurement bundle supports automatic generation of TRA EFD-compliant tax invoices with verification QR codes upon delivery validation.',
    logisticsPlanner: 'Regional Sourcing Logistics',
    destinationHub: 'Target Delivery Destination',
    estTime: 'Est. Transit Time'
  },
  sw: {
    back: 'Rudi kwenye vifurushi',
    breadcrumbMarket: 'Mikusanyiko ya Biashara',
    category: 'Ufumbuzi wa Kibiashara',
    ready: 'Tayari kwa Ununuzi',
    bundleLabel: 'Ofa Maalum ya Kibiashara',
    save: 'Okoa Papo Hapo',
    off: 'punguzo',
    items: 'bidhaa zilizojumuishwa',
    stock: 'Zipo stoo',
    escrowMini: 'Orbi PaySafe',
    certified: 'Imethibitishwa TBS',
    savingTitle: 'Jumla ya Punguzo',
    savingDesc: 'Thamani ya fedha unayookoa kwa kununua kifurushi hiki kwa pamoja.',
    priceTitle: 'Bei ya Kifurushi',
    eachPrice: 'Thamani ya Kawaida',
    quantity: 'Idadi ya Vifurushi',
    addToCart: 'Weka Kifurushi Kwenye Kikapu',
    buyNow: 'Nunua Sasa',
    adding: 'Inaandaa usafirishaji wa pamoja...',
    added: 'Kifurushi kimeongezwa!',
    escrowNote: 'Imelindwa na Orbi PaySafe Escrow. Malipo yako yanashikiliwa salama na kutolewa tu baada ya mzigo kufika na kuukagua kikamilifu.',
    trustEscrow: 'Orbi PaySafe Escrow',
    trustEscrowDesc: 'Ulinzi wa malipo 100%. Fedha hutolewa kwa wauzaji baada ya wewe kukagua na kukubali mzigo.',
    trustDelivery: 'Mzigo Mchanganyiko (Consolidated)',
    trustDeliveryDesc: 'Bidhaa zote huandaliwa na kusafirishwa pamoja kama mzigo mmoja ndani ya saa 24–48.',
    trustQuality: 'Ukaguzi wa Ubora Mara Mbili',
    trustQualityDesc: 'Bidhaa hukaguliwa kwa viwango thabiti vya TBS kwenye kituo chetu cha Kariakoo kabla ya kupakiwa.',
    trustSeller: 'Wauzaji Waliosajiliwa',
    trustSellerDesc: 'Zinatoka kwa wauzaji wa jumla na viwanda vilivyosajiliwa kisheria kwenye mfumo wa Orbi.',
    included: 'Bidhaa na Vipengele vilivyopo',
    includedDesc: 'Bidhaa hizi zimekusanywa kutoka kwa wauzaji waaminika na kufungashwa kama oda moja.',
    viewProduct: 'Angalia sifa za bidhaa',
    seller: 'Duka la Muuzaji',
    deliveryTitle: 'Kituo cha Biashara Kariakoo',
    deliveryDesc: 'Mizigo yote inaratibiwa na kusafirishwa kutoka kituo chetu cha Kariakoo Dar es Salaam kwenda mkoani kwako.',
    cargoNote: 'Usafirishaji unasaidiwa na mabasi/mizigo ya: Hood, Sabasaba, Abood, BM, GPS, na wasafirishaji wengine.',
    verifiedSellers: 'Wauzaji wa Jumla Waliothibitishwa',
    whyTitle: 'Faida za Ununuzi wa Pamoja (Corporate)',
    whyOne: 'Gharama ya chini ya bidhaa kulinganishwa na kununua moja moja.',
    whyTwo: 'Uokoaji wa hadi 45% ya gharama za usafirishaji wa pamoja wa mizigo.',
    whyThree: 'Utoaji wa Risiti Rasmi za Kodi za TRA EFD kwa ajili ya hesabu za biashara.',
    whyFour: 'Kuepuka hasara ya bidhaa mbovu kupitia ukaguzi wa ghala la Kariakoo.',
    related: 'Vifurushi Vingine utakavyopenda',
    seeAll: 'Tazama zote',
    choose: 'Tazama kifurushi',
    from: 'Kuanzia',
    
    // Enterprise Extensions Swahili
    volumeTiers: 'Ununuzi wa Jumla wa Kibiashara',
    volumeTiersDesc: 'Okoa zaidi kwenye usafirishaji wa pamoja. Chagua idadi ili kufungua viwango vya punguzo la jumla.',
    tierLabel: 'Kiwango cha Ununuzi',
    qtyRange: 'Idadi ya Jumla',
    extraDiscount: 'Punguzo la Ziada',
    tierStandard: 'Kawaida Standard (Pcs 1-4)',
    tierMerchant: 'Mchuuzi Bulk (Pcs 5-9)',
    tierWholesale: 'Ununuzi wa Jumla (Pcs 10-24)',
    tierCorporate: 'VIP wa Kibiashara (Pcs 25+)',
    rfqTitle: 'Omba Nukuu Maalum ya Bei (RFQ)',
    rfqDesc: 'Je, unahitaji vipimo maalum, chapa yako kwenye bidhaa, au mabadiliko ya kifurushi? Tuma maombi hapa.',
    rfqBtn: 'Omba Marekebisho / RFQ',
    rfqName: 'Jina Lako / Jina la Kampuni',
    rfqContact: 'Namba ya WhatsApp / Simu',
    rfqNotes: 'Vipimo maalum vya bidhaa au maelezo ya usafirishaji...',
    rfqSubmit: 'Tuma Maelezo kwa Washauri wa Orbi',
    rfqSuccess: 'Ombi lako limepokelewa! Washauri wetu wa manunuzi watawasiliana nawe kwa WhatsApp/Simu ndani ya saa 2.',
    taxInvoiceTitle: 'Inajumuisha Risiti ya TRA EFD',
    taxInvoiceDesc: 'Ununuzi huu unakuwezesha kupata Ankara rasmi ya Kodi ya TRA EFD yenye msimbo wa QR mara tu unapothibitisha kupokea mzigo wako.',
    logisticsPlanner: 'Mpangaji wa Usafirishaji wa Mikoani',
    destinationHub: 'Mji Unakoenda Mzigo',
    estTime: 'Muda wa Kusafiri'
  },
};

const money = (value: number) => formatCurrency(Math.max(0, Math.round(value)));

const productTitle = (item: Product, lang: 'sw' | 'en') =>
  lang === 'sw' && (item as any).nameSw ? (item as any).nameSw : item.name;

const getItemCategoryLabel = (item: Product, lang: 'sw' | 'en') => {
  const raw = item.family || item.category || item.niche || '';
  if (lang === 'sw') {
    const lower = raw.toLowerCase();
    if (lower.includes('cooking') || lower.includes('appliance') || lower.includes('kitchen') || lower.includes('jiko')) {
      return 'Vifaa vya Jikoni';
    }
    if (lower.includes('electronics') || lower.includes('elektroniki')) {
      return 'Vifaa vya Elektroniki';
    }
    if (lower.includes('fashion') || lower.includes('mavazi') || lower.includes('clothing') || lower.includes('mitindo')) {
      return 'Mavazi & Mitindo';
    }
    if (lower.includes('home') || lower.includes('furniture') || lower.includes('samani') || lower.includes('nyumbani')) {
      return 'Samani & Nyumbani';
    }
    if (lower.includes('beauty') || lower.includes('afya') || lower.includes('urembo')) {
      return 'Afya & Urembo';
    }
    if (lower.includes('auto') || lower.includes('motor') || lower.includes('magari') || lower.includes('vipuri')) {
      return 'Magari & Vipuri';
    }
    if (lower.includes('supermarket') || lower.includes('food') || lower.includes('chakula') || lower.includes('vinywaji')) {
      return 'Chakula & Vinywaji';
    }
  }
  return raw;
};

const getProductDescription = (item: Product, lang: 'sw' | 'en') => {
  const name = item.name.toLowerCase();
  if (name.includes('kenwood') || name.includes('pressure cooker')) {
    return lang === 'sw'
      ? "Jiko hili la kisasa la shinikizo la umeme (Electric pressure cooker) limeundwa kurahisisha mapishi jikoni."
      : "This modern electric pressure cooker is designed to simplify kitchen cooking.";
  }
  if (name.includes('pad') || name.includes('anti-vibration')) {
    return lang === 'sw'
      ? "Pedi hizi za kuzuia mtikisiko husaidia kupunguza vibrasheni na kuongeza uthabiti wa vifaa."
      : "These anti-vibration pads help reduce vibrations and increase appliance stability.";
  }
  return item.description || (lang === 'sw' ? "Bidhaa hii imehakikiwa kuwa ya ubora wa juu na tayari kusafirishwa." : "This product is verified of high quality and ready to ship.");
};

const fallbackImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200';

export const BusinessBundleDetailPage: React.FC<BusinessBundleDetailPageProps> = ({
  bundle,
  lang,
  onClose,
  allBundles,
  onSelectBundle,
  onAddToCart,
  onSelectProduct,
  products,
  sellers,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // RFQ Sourcing States
  const [rfqName, setRfqName] = useState('');
  const [rfqContact, setRfqContact] = useState('');
  const [rfqNotes, setRfqNotes] = useState('');
  const [rfqSuccess, setRfqSuccess] = useState(false);
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);

  // Selected region for logistics preview
  const [selectedHub, setSelectedHub] = useState('Dar es Salaam');
  const [dbZones, setDbZones] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    db.getDeliveryZones()
      .then((zones) => {
        if (active && Array.isArray(zones)) {
          const activeZones = zones.filter(z => z.isActive);
          setDbZones(activeZones);
        }
      })
      .catch((err) => {
        console.warn("Failed to load delivery zones for map:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Tanzanian regional delivery transit hubs from DB with fallback defaults
  const regionalHubs = useMemo(() => {
    if (dbZones.length > 0) {
      return dbZones.map((zone) => ({
        name: zone.name,
        swName: zone.labelSw || zone.name,
        time: `${zone.minDays}-${zone.maxDays} ${lang === 'sw' ? 'Siku' : 'Days'}`,
        cost: zone.price === 0 
          ? (lang === 'sw' ? 'Mkusanyiko wa Bure' : 'Free Hub Pickup') 
          : `${formatCurrency(zone.price)}`
      }));
    }
    return [
      { name: 'Dar es Salaam', swName: 'Dar es Salaam', time: '24 Hours', cost: 'Free Kariakoo Hub Pickup' },
      { name: 'Mwanza', swName: 'Mwanza', time: '48 Hours', cost: 'Sabasaba / Hood Cargo' },
      { name: 'Arusha', swName: 'Arusha', time: '24-48 Hours', cost: 'BM / Abood Freight' },
      { name: 'Dodoma', swName: 'Dodoma', time: '24 Hours', cost: 'GPS / Sabasaba Express' },
      { name: 'Mbeya', swName: 'Mbeya', time: '48-72 Hours', cost: 'Hood / Abood Transport' }
    ];
  }, [dbZones, lang]);

  const activeHubInfo = useMemo(() => {
    return regionalHubs.find(h => h.name === selectedHub) || regionalHubs[0];
  }, [regionalHubs, selectedHub]);

  useEffect(() => {
    if (regionalHubs.length > 0 && !regionalHubs.some(h => h.name === selectedHub)) {
      setSelectedHub(regionalHubs[0].name);
    }
  }, [regionalHubs, selectedHub]);

  const t = localT[lang];
  const itemCount = bundle.items.length;

  const galleryImages = useMemo(() => {
    const images = bundle.items.flatMap((item) => item.images || []).filter(Boolean) as string[];
    return Array.from(new Set(images)).slice(0, 8);
  }, [bundle.items]);

  const [selectedImage, setSelectedImage] = useState<string | null>(galleryImages[0] || null);
  const heroImage = selectedImage || galleryImages[0] || fallbackImage;

  // Wholesale Volume Tiers configuration
  const volumeDiscountPercent = useMemo(() => {
    if (quantity >= 25) return 10; // Corporate VIP Tier (10% extra discount)
    if (quantity >= 10) return 6;  // Wholesale Tier (6% extra discount)
    if (quantity >= 5) return 3;   // Merchant Tier (3% extra discount)
    return 0;                      // Standard baseline (0% extra)
  }, [quantity]);

  const activeTier = useMemo(() => {
    if (quantity >= 25) return 'corporate';
    if (quantity >= 10) return 'wholesale';
    if (quantity >= 5) return 'merchant';
    return 'standard';
  }, [quantity]);

  const baseTotal = bundle.bundlePrice * quantity;
  const originalTotal = bundle.originalPrice * quantity;
  const volumeDiscountAmount = Math.round(baseTotal * (volumeDiscountPercent / 100));
  const finalTotal = Math.max(0, baseTotal - volumeDiscountAmount);
  const totalSaved = Math.max(0, originalTotal - finalTotal);

  const otherBundles = useMemo(
    () => allBundles.filter((b) => b.id !== bundle.id).slice(0, 4),
    [allBundles, bundle.id]
  );

  const handleAddBundleToCart = async () => {
    setIsAdding(true);

    for (let i = 0; i < bundle.items.length; i += 1) {
      const item = bundle.items[i];
      const actualProduct = products.find((p) => p.id === item.id) || item;
      onAddToCart(actualProduct, i === bundle.items.length - 1, quantity);
      await new Promise((resolve) => setTimeout(resolve, 70));
    }

    setIsAdding(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2800);
  };

  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqName || !rfqContact) return;
    
    setIsSubmittingRfq(true);
    setTimeout(() => {
      setIsSubmittingRfq(false);
      setRfqSuccess(true);
      setRfqName('');
      setRfqContact('');
      setRfqNotes('');
      setTimeout(() => setRfqSuccess(false), 8000);
    }, 1200);
  };

  const getNicheName = () => {
    // 1. Check if any item in the bundle has a niche
    const firstItemWithNiche = bundle.items.find(item => item.niche);
    let rawNiche = '';
    if (firstItemWithNiche && firstItemWithNiche.niche) {
      rawNiche = firstItemWithNiche.niche;
    } else {
      const cat = bundle.category || '';
      if (cat.toLowerCase().includes('home') || cat.toLowerCase().includes('furniture')) {
        rawNiche = 'Home & Furniture';
      } else if (cat.toLowerCase().includes('fashion') || cat.toLowerCase().includes('apparel')) {
        rawNiche = 'Fashion & Apparel';
      } else if (cat.toLowerCase().includes('electr') || cat.toLowerCase().includes('tech')) {
        rawNiche = 'Electronics & Tech';
      } else if (cat.toLowerCase().includes('health') || cat.toLowerCase().includes('beauty')) {
        rawNiche = 'Health & Beauty';
      } else if (cat.toLowerCase().includes('auto') || cat.toLowerCase().includes('motor')) {
        rawNiche = 'Auto & Motors';
      } else if (cat.toLowerCase().includes('super') || cat.toLowerCase().includes('food')) {
        rawNiche = 'Supermarket & Food';
      } else {
        rawNiche = 'Electronics & Tech';
      }
    }

    // Translate rawNiche to Swahili if lang is 'sw'
    if (lang === 'sw') {
      if (rawNiche.toLowerCase().includes('electronics') || rawNiche.toLowerCase().includes('elektroniki')) {
        return 'Elektroniki & Simu';
      }
      if (rawNiche.toLowerCase().includes('fashion') || rawNiche.toLowerCase().includes('mavazi') || rawNiche.toLowerCase().includes('mitindo')) {
        return 'Mavazi & Mitindo';
      }
      if (rawNiche.toLowerCase().includes('home') || rawNiche.toLowerCase().includes('samani') || rawNiche.toLowerCase().includes('nyumbani')) {
        return 'Samani & Nyumbani';
      }
      if (rawNiche.toLowerCase().includes('health') || rawNiche.toLowerCase().includes('afya') || rawNiche.toLowerCase().includes('urembo')) {
        return 'Afya & Urembo';
      }
      if (rawNiche.toLowerCase().includes('auto') || rawNiche.toLowerCase().includes('magari') || rawNiche.toLowerCase().includes('vipuri')) {
        return 'Magari & Vipuri';
      }
      if (rawNiche.toLowerCase().includes('supermarket') || rawNiche.toLowerCase().includes('chakula') || rawNiche.toLowerCase().includes('food') || rawNiche.toLowerCase().includes('vinywaji')) {
        return 'Chakula & Vinywaji';
      }
    }
    return rawNiche;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 selection:bg-[#ff4c00] selection:text-white font-sans antialiased">
      <div className="mx-auto max-w-[1420px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        
        {/* Navigation Breadcrumb with Elegant Layout */}
        <div className="mb-5 flex items-center justify-between border-b border-slate-200/40 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <button 
              onClick={onClose} 
              className="mr-1 text-[#ff4c00] hover:opacity-80 flex items-center gap-0.5 cursor-pointer font-black border-none bg-transparent p-0 transition-all"
            >
              <ChevronLeft size={13} className="stroke-[2.5]" />
              <span>{lang === 'sw' ? 'Rudi' : 'Back'}</span>
            </button>
            <span className="text-slate-300 sm:hidden">|</span>
            <span onClick={onClose} className="cursor-pointer hover:text-[#ff4c00] transition hidden sm:inline">Home</span>
            <ChevronRight size={11} className="text-slate-400 hidden sm:inline" />
            <span onClick={onClose} className="cursor-pointer hover:text-[#ff4c00] transition hidden sm:inline">
              {lang === 'sw' ? 'Mikusanyiko' : 'Bundles'}
            </span>
            <ChevronRight size={11} className="text-slate-400 hidden sm:inline" />
            <span className="text-slate-500">{getNicheName()}</span>
            <ChevronRight size={11} className="text-slate-400" />
            <span className="line-clamp-1 max-w-[120px] xs:max-w-[180px] sm:max-w-[360px] text-slate-900 font-extrabold">{bundle.name}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: bundle.name, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert(lang === 'sw' ? 'Kiungo kimenakiliwa!' : 'Link copied!');
              }
            }}
            className="flex items-center justify-center gap-1.5 p-2 sm:p-0 rounded-full bg-slate-50 border border-slate-200/50 sm:bg-transparent sm:border-none text-xs font-black text-slate-500 hover:text-[#ff4c00] transition uppercase tracking-wider cursor-pointer shadow-xxs sm:shadow-none"
            aria-label={lang === 'sw' ? 'Shiriki' : 'Share'}
          >
            <span className="hidden sm:inline">Share</span>
            <Share2 size={14} className="text-slate-600 sm:text-slate-500" />
          </button>
        </div>

        {/* Core Detail Grid Section */}
        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.1fr_1.1fr_390px] xl:items-start">
          
          {/* Left Column: Premium Interactive Image Stage */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs p-4 sm:p-5">
            <div className="relative">
              {/* Ready Badge & Discount absolute */}
              <div className="absolute left-3 top-3 z-10">
                <span className="rounded-lg bg-[#ff4c00] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  {bundle.type} READY
                </span>
              </div>
              
              <div className="absolute right-3 top-3 z-10 grid h-14 w-14 place-items-center rounded-full bg-white text-center text-sm font-black text-[#ff4c00] shadow-md border border-slate-150 ring-4 ring-slate-100/50">
                -{bundle.discountPercentage}%
              </div>

              {/* Main Stage Showcase */}
              <div className="relative group/mainstage flex min-h-[360px] sm:min-h-[420px] items-center justify-center rounded-2xl bg-white p-6 border border-slate-100/50">
                {/* Left overlay arrow */}
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = galleryImages.indexOf(heroImage);
                    const prevIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
                    setSelectedImage(galleryImages[prevIdx]);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-200/40 bg-white text-slate-700 shadow-md hover:text-[#ff4c00] hover:scale-105 transition active:scale-95 cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>

                <ImageWithSkeleton
                  src={heroImage}
                  alt={bundle.name}
                  className="max-h-[340px] w-full object-contain drop-shadow-xl hover:scale-102 transition duration-500 ease-out"
                  containerClassName="h-full w-full"
                />

                {/* Right overlay arrow */}
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = galleryImages.indexOf(heroImage);
                    const nextIdx = (currentIdx + 1) % galleryImages.length;
                    setSelectedImage(galleryImages[nextIdx]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-200/40 bg-white text-slate-700 shadow-md hover:text-[#ff4c00] hover:scale-105 transition active:scale-95 cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Thumbnail Selector Carousel with Chevron Controls */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = galleryImages.indexOf(heroImage);
                    const prevIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
                    setSelectedImage(galleryImages[prevIdx]);
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xxs hover:border-[#ff4c00] hover:text-[#ff4c00] transition active:scale-95 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex flex-1 gap-2.5 overflow-x-auto pb-1 scrollbar-none justify-center">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white p-1 border-2 transition duration-200 cursor-pointer ${
                        heroImage === image 
                          ? 'border-[#ff4c00] shadow-sm' 
                          : 'border-slate-200 hover:border-[#ff4c00]/40'
                      }`}
                    >
                      <ImageWithSkeleton
                        src={image}
                        alt=""
                        containerClassName="h-full w-full rounded-lg overflow-hidden"
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = galleryImages.indexOf(heroImage);
                    const nextIdx = (currentIdx + 1) % galleryImages.length;
                    setSelectedImage(galleryImages[nextIdx]);
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xxs hover:border-[#ff4c00] hover:text-[#ff4c00] transition active:scale-95 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Included Products Visual Strips for Quick Insight */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Package size={14} className="text-[#ff4c00]" />
                {t.included} ({itemCount})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {bundle.items.map((item, index) => (
                  <div 
                    key={`strip-item-${item.id}`}
                    onClick={() => onSelectProduct(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-150 bg-slate-50/40 hover:bg-orange-50/10 hover:border-[#ff4c00]/30 transition duration-200 cursor-pointer text-left"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white border border-slate-200">
                      <ImageWithSkeleton
                        src={item.images?.[0] || fallbackImage}
                        alt=""
                        containerClassName="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{productTitle(item, lang)}</p>
                      <PriceDisplay
                        amount={item.price}
                        colorClass="text-slate-400 font-medium"
                        className="text-[9px] block mt-0.5"
                        truncate={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: Enterprise Sourcing & Volume Discount Desk */}
          <div className="space-y-6">
            
            {/* Core Info Panel */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
              <span className="text-[#ff4c00] text-xs font-black uppercase tracking-widest mb-2 block">
                {lang === 'sw' ? `KIFURUSHI CHA ${getNicheName()}` : `${getNicheName()} BUNDLE`}
              </span>

              <h1 className="text-2xl sm:text-3xl font-black leading-tight text-slate-900 font-display">
                {bundle.name}
              </h1>

              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-500 font-medium">
                {bundle.businessDetails || (lang === 'sw' 
                  ? "Kifurushi safi kilichoundwa kutoka kwa wauzaji wa Orbi Shop walioaminika."
                  : "A highly curated package designed and compiled from Orbi Shop's trusted sellers.")
                }
              </p>

              {/* Core Attributes badging */}
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-5">
                <FeatureItem icon={<PackageCheck size={18} />} title={`17+ ${t.stock}`} desc="Stock Availability" />
                <FeatureItem icon={<ShieldCheck size={18} />} title="Orbi Escrow" desc="Malipo Salama" />
                <FeatureItem icon={<Award size={18} />} title="TBS Certified" desc="Ubora Uliothibitishwa" />
              </div>

              {/* Savings Card Indicator */}
              <div className="mt-5 rounded-2xl border border-orange-200/60 bg-[#fffcfb] p-4 flex items-start gap-3">
                <Sparkles size={18} className="text-[#ff4c00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1">
                    <span>{lang === 'sw' ? 'Okoa' : 'Save'}</span>
                    <PriceDisplay
                      amount={Math.max(0, bundle.originalPrice - bundle.bundlePrice)}
                      colorClass="text-[#ff4c00]"
                      className="font-black"
                      truncate={false}
                    />
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                    {lang === 'sw' ? 'Jumla ya punguzo ukinunua kifurushi hiki' : 'Total combined discount when purchasing this package.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Wholesale Tier Discount Matrix (The core of Enterprises Business Shopping Center) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#ff4c00]" />
                    {t.volumeTiers}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.volumeTiersDesc}
                  </p>
                </div>
                <span className="bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                  TZS Cargo Rates
                </span>
              </div>

              {/* Dynamic Matrix Representation */}
              <div className="overflow-hidden rounded-2xl border border-slate-150 shadow-xxs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-3">{t.tierLabel}</th>
                      <th className="p-3 text-center">{t.qtyRange}</th>
                      <th className="p-3 text-right">{t.extraDiscount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className={`transition-colors duration-150 ${activeTier === 'standard' ? 'bg-orange-50/30 text-[#ff4c00] font-black' : 'text-slate-700'}`}>
                      <td className="p-3 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${activeTier === 'standard' ? 'bg-[#ff4c00]' : 'bg-slate-300'}`} />
                        {t.tierStandard}
                      </td>
                      <td className="p-3 text-center font-mono">1 - 4</td>
                      <td className="p-3 text-right font-black">0%</td>
                    </tr>
                    <tr className={`transition-colors duration-150 ${activeTier === 'merchant' ? 'bg-orange-50/30 text-[#ff4c00] font-black' : 'text-slate-700'}`}>
                      <td className="p-3 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${activeTier === 'merchant' ? 'bg-[#ff4c00]' : 'bg-slate-300'}`} />
                        {t.tierMerchant}
                      </td>
                      <td className="p-3 text-center font-mono">5 - 9</td>
                      <td className="p-3 text-right font-black text-emerald-600">+3% OFF</td>
                    </tr>
                    <tr className={`transition-colors duration-150 ${activeTier === 'wholesale' ? 'bg-orange-50/30 text-[#ff4c00] font-black' : 'text-slate-700'}`}>
                      <td className="p-3 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${activeTier === 'wholesale' ? 'bg-[#ff4c00]' : 'bg-slate-300'}`} />
                        {t.tierWholesale}
                      </td>
                      <td className="p-3 text-center font-mono">10 - 24</td>
                      <td className="p-3 text-right font-black text-emerald-600">+6% OFF</td>
                    </tr>
                    <tr className={`transition-colors duration-150 ${activeTier === 'corporate' ? 'bg-orange-50/30 text-[#ff4c00] font-black' : 'text-slate-700'}`}>
                      <td className="p-3 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${activeTier === 'corporate' ? 'bg-[#ff4c00]' : 'bg-orange-500'}`} />
                        {t.tierCorporate}
                      </td>
                      <td className="p-3 text-center font-mono">25+</td>
                      <td className="p-3 text-right font-black text-emerald-600">+10% OFF</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TRA EFD Compliance Notice Panel */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <FileText size={20} className="text-[#ff4c00]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">{t.taxInvoiceTitle}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {t.taxInvoiceDesc}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Real-time Procurement Desk */}
          <aside className="xl:sticky xl:top-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#ff4c00]" />
              
              <p className="text-[10px] font-black uppercase tracking-wider text-[#ff4c00]">{t.priceTitle}</p>
              
              <div className="mt-1 flex items-baseline">
                <PriceDisplay
                  amount={finalTotal}
                  colorClass="text-[#ff4c00]"
                  className="text-3xl font-black font-display tracking-tight"
                  truncate={false}
                />
              </div>
              
              <div className="text-[11px] font-medium text-slate-400 mt-1.5 flex items-center gap-1">
                <span>{lang === 'sw' ? 'Bei ya kila moja' : 'Price per item'}</span>
                <PriceDisplay
                  amount={originalTotal / quantity}
                  colorClass="text-slate-400/90 line-through font-mono"
                  className="text-[11px]"
                  truncate={false}
                />
              </div>

              <div className="my-4 border-t border-slate-100" />

              {/* Volume selector widget */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Idadi</span>
                  <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white h-9">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="grid h-9 w-9 place-items-center text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="grid h-9 min-w-8 place-items-center px-1 font-mono text-xs font-black text-slate-950">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="grid h-9 w-9 place-items-center text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Quick Selection Buttons 1, 5, 10+ */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10].map((num) => {
                    const isSelected = (num === 1 && quantity === 1) || (num === 5 && quantity === 5) || (num === 10 && quantity >= 10);
                    const label = num === 10 ? '10+' : num.toString();
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        className={`py-2 rounded-xl text-xs font-black transition duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff4c00] text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Action Button (Weka kifurushi kwenye kikapu) */}
              <button
                type="button"
                onClick={handleAddBundleToCart}
                disabled={isAdding}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-white shadow-xs transition duration-150 active:scale-98 disabled:cursor-not-allowed cursor-pointer ${
                  success
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : isAdding
                      ? 'bg-slate-300'
                      : 'bg-[#ff4c00] hover:bg-[#e03d00]'
                }`}
              >
                {success ? (
                  <>
                    <CheckCircle2 size={14} />
                    {t.added}
                  </>
                ) : isAdding ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.adding}
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} />
                    {t.addToCart}
                  </>
                )}
              </button>

              {/* Buy Now Button (Nunua Sasa) */}
              <button
                type="button"
                onClick={handleAddBundleToCart}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#ffeae0] bg-[#fffbf9] px-5 py-3 text-[11px] font-black text-[#ff4c00] uppercase tracking-wider transition duration-150 hover:bg-[#fff5f0] cursor-pointer"
              >
                <Zap size={13} className="text-[#ff4c00] fill-[#ff4c00]" />
                {t.buyNow}
              </button>

              {/* Escrow Check Notice Card (Green) */}
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/45 p-3 flex items-start gap-2.5 text-left">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-emerald-800 font-semibold">
                  {lang === 'sw' 
                    ? 'Malipo yako yanalindwa na Orbi escrow na hutolewa baada ya kuthibitisha kupokea mzigo.'
                    : 'Your payment is secured by Orbi escrow and only disbursed to vendors after confirming successful delivery.'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Commercial trust elements strip (Full width below the top detail block) */}
        <section className="mt-8 grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:grid-cols-2 md:grid-cols-4">
          <TrustStrip 
            icon={<ShieldCheck size={20} className="text-[#ff4c00]" />} 
            title={lang === 'sw' ? 'Malipo Salama (Escrow)' : 'Malipo Salama (Escrow)'} 
            desc={lang === 'sw' ? 'Fedha zako zinalindwa hadi ukague na kukubali mzigo.' : 'Your funds are held safely until you inspect & accept the cargo.'} 
          />
          <TrustStrip 
            icon={<Truck size={20} className="text-[#ff4c00]" />} 
            title={lang === 'sw' ? 'Usafirishaji Haraka' : 'Fast Delivery'} 
            desc={lang === 'sw' ? 'Inasafirishwa ndani ya 24–48 Hours.' : 'Shipped within 24-48 hours.'} 
          />
          <TrustStrip 
            icon={<Award size={20} className="text-[#ff4c00]" />} 
            title={lang === 'sw' ? 'Ubora Uliothibitishwa' : 'Certified Quality'} 
            desc={lang === 'sw' ? 'Bidhaa zote zimepita viwango vya TBS.' : 'All items are certified to meet TBS quality standard requirements.'} 
          />
          <TrustStrip 
            icon={<Building2 size={20} className="text-[#ff4c00]" />} 
            title={lang === 'sw' ? 'Wauzaji Walioaminika' : 'Verified Wholesalers'} 
            desc={lang === 'sw' ? 'Bidhaa zinatoka kwa wauzaji waliothibitishwa na Orbi.' : 'Sourced strictly from checked premium wholesale sellers on Orbi.'} 
          />
        </section>

        {/* Bottom Double-Column Sourcing Layout */}
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          
          {/* Column 1: Kimejumuishwa kwenye kifurushi (Integrated Items List) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
            <div>
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-2">
                    <Package size={18} className="text-[#ff4c00]" />
                    {lang === 'sw' ? 'Bidhaa za kifurushi' : 'Included in this bundle'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {lang === 'sw' ? 'Bidhaa hizi zimekusanywa pamoja na kufungashwa kama oda moja.' : 'These products are compiled together and delivered as a single package.'}
                  </p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black text-orange-700 border border-orange-100 uppercase tracking-wider self-start sm:self-auto">
                  {itemCount} {lang === 'sw' ? 'Bidhaa' : 'Items'}
                </span>
              </div>

              <div className="space-y-4">
                {bundle.items.map((item) => {
                  const itemSeller = sellers.find((s) => s.id === item.sellerId);
                  return (
                    <article
                      key={`bundle-item-${item.id}`}
                      className="group flex flex-col sm:flex-row gap-4 rounded-[23px] border-[0.6px] border-[#cec8c3] bg-[#fdfdfd] p-4 transition hover:border-[#ff4c00]/40 hover:bg-slate-50/45 items-start sm:items-center justify-between"
                    >
                      <div className="flex gap-4 items-start sm:items-center w-full sm:w-auto min-w-0">
                        {/* Product Thumbnail */}
                        <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-50 border border-slate-200 sm:h-20 sm:w-20 shrink-0">
                          <img
                            src={item.images?.[0] || fallbackImage}
                            alt={productTitle(item, lang)}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
                          />
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-[#ff4c00] uppercase block mb-1">
                            {getItemCategoryLabel(item, lang)}
                          </span>
                          <h3 className="text-sm font-black text-slate-950 group-hover:text-[#ff4c00] transition duration-150 leading-snug">
                            {productTitle(item, lang)}
                          </h3>
                          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-medium">
                            {getProductDescription(item, lang).slice(0, 60)}...
                            <button
                              type="button"
                              onClick={() => onSelectProduct(item)}
                              className="text-[#ff4c00] hover:underline ml-1.5 font-bold cursor-pointer"
                            >
                              {lang === 'sw' ? 'Tazama Zaidi' : 'Learn More'}
                            </button>
                          </p>
                        </div>
                      </div>

                      {/* Price & Idadi */}
                      <div className="w-full sm:w-auto flex sm:flex-col items-center justify-between sm:items-end border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 sm:text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-500">
                          {lang === 'sw' ? 'Idadi: 1' : 'Qty: 1'}
                        </span>
                        <div className="sm:mt-1">
                          <PriceDisplay
                            amount={item.price}
                            colorClass="text-slate-950"
                            className="text-sm font-black"
                            truncate={false}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Tazama maelezo kamili ya kila bidhaa link at bottom right */}
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => {
                  if (bundle.items[0]) {
                    onSelectProduct(bundle.items[0]);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#ff4c00] hover:opacity-80 transition uppercase tracking-wider cursor-pointer"
              >
                {lang === 'sw' ? 'Tazama maelezo kamili ya kila bidhaa' : 'View full specifications of each product'}
                <ChevronRight size={14} className="text-[#ff4c00]" />
              </button>
            </div>
          </div>

          {/* Column 2: Logistics, Wholesalers, and custom Requests */}
          <div className="space-y-5">
            {/* Ghala la Dar es Salaam (Kariakoo) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <MapPin size={18} className="text-[#ff4c00]" />
                {lang === 'sw' 
                  ? `Kituo cha Usafirishaji cha ${activeHubInfo.swName}` 
                  : `${activeHubInfo.name} Delivery Hub`}
              </h3>
              
              {/* Real Interactive Google Map */}
              <InteractiveHubMap address={selectedHub} label={selectedHub} lang={lang} />

              <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-600">
                {lang === 'sw' 
                  ? `Bidhaa zinasafirishwa kutoka ghala kuu la Kariakoo kwenda kituo cha ${activeHubInfo.swName} na kufika kwa wakati.`
                  : `Products are dispatched directly from our main Kariakoo Warehouse to ${activeHubInfo.name} hub reliably.`}
              </p>

              {/* Small cargo partner notice */}
              <div className="mt-3.5 rounded-xl bg-orange-50/55 border border-orange-100 p-3 flex items-start gap-2.5 text-left">
                <Truck size={15} className="text-[#ff4c00] shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-orange-800 font-bold">
                  {lang === 'sw'
                    ? 'Tunashirikiana na watoa huduma wa mizigo (Hood, Sabasaba, Abood, BM, Gps n.k.).'
                    : 'We partner with trusted regional freight carriers (Hood, Sabasaba, Abood, BM, GPS, etc.).'}
                </p>
              </div>

              {/* Interactive regional logistics calculator */}
              <div className="mt-4 border-t border-slate-100 pt-3.5">
                <details className="group/details">
                  <summary className="flex items-center justify-between text-xs font-black text-[#ff4c00] uppercase tracking-wide cursor-pointer list-none select-none">
                    <span>🗺️ {lang === 'sw' ? 'Panga Usafirishaji wa Mikoani' : 'Plan Regional Cargo Delivery'}</span>
                    <ChevronRight size={14} className="transform group-open/details:rotate-90 transition duration-150 text-[#ff4c00]" />
                  </summary>
                  
                  {/* Expanded Hub Picker */}
                  <div className="mt-3.5 space-y-3.5">
                    <div className="grid grid-cols-5 gap-1.5">
                      {regionalHubs.map((hub) => (
                        <button
                          key={hub.name}
                          type="button"
                          onClick={() => setSelectedHub(hub.name)}
                          className={`rounded-xl border py-2 text-[10px] font-black uppercase text-center transition duration-200 cursor-pointer ${
                            selectedHub === hub.name
                              ? 'border-[#ff4c00] bg-orange-50/20 text-[#ff4c00]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {lang === 'sw' ? hub.swName.slice(0, 8) : hub.name.slice(0, 8)}
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t.destinationHub}</span>
                        <span className="text-xs font-black text-slate-800 block mt-1">{lang === 'sw' ? activeHubInfo.swName : activeHubInfo.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t.estTime}</span>
                        <span className="text-xs font-black text-orange-600 block mt-1 flex items-center gap-1">
                          <Clock size={13} className="text-[#ff4c00]" />
                          {activeHubInfo.time}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/60 pt-2 flex items-center gap-2">
                        <Truck size={13} className="text-slate-400" />
                        <span className="text-[10px] text-slate-600 font-bold">{activeHubInfo.cost}</span>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Wauzaji Waliohakikishwa Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full border-2 border-orange-100 bg-orange-50/60 flex items-center justify-center text-center">
                <span className="text-lg font-black text-[#ff4c00]">17+</span>
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide leading-tight">
                  {lang === 'sw' ? 'Wauzaji Waliohakikishwa' : 'Verified Wholesalers'}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {lang === 'sw'
                    ? 'Bidhaa zinatoka kwa wauzaji waliothibitishwa na Orbi Shop.'
                    : 'All goods are sourced from certified tier-1 wholesalers verified on Orbi Shop.'}
                </p>
              </div>
            </div>

            {/* Collapsible RFQ Request Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <details className="group/rfq">
                <summary className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wide cursor-pointer list-none select-none">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={15} className="text-[#ff4c00]" />
                    {lang === 'sw' ? 'Omba Nukuu Maalum ya Bei (RFQ)' : 'Request Customized Bulk Quote'}
                  </span>
                  <ChevronRight size={14} className="transform group-open/rfq:rotate-90 transition duration-150 text-slate-500" />
                </summary>
                
                <div className="mt-3.5">
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    {t.rfqDesc}
                  </p>
                  {rfqSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                        <Check size={20} />
                      </div>
                      <p className="text-xs font-black text-emerald-800 leading-relaxed">{t.rfqSuccess}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRfqSubmit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={rfqName}
                          onChange={(e) => setRfqName(e.target.value)}
                          placeholder={t.rfqName}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-[#ff4c00] transition"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          value={rfqContact}
                          onChange={(e) => setRfqContact(e.target.value)}
                          placeholder={t.rfqContact}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-[#ff4c00] transition"
                        />
                      </div>
                      <div>
                        <textarea
                          value={rfqNotes}
                          onChange={(e) => setRfqNotes(e.target.value)}
                          placeholder={t.rfqNotes}
                          rows={2}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-[#ff4c00] transition resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingRfq}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 interactive-tap cursor-pointer"
                      >
                        <Building2 size={12} />
                        {isSubmittingRfq ? 'Sending...' : t.rfqSubmit}
                      </button>
                    </form>
                  )}
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Why choose this package panel (Orange Banner matching screenshot perfectly) */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#ff4c00] to-orange-500 p-6 text-white shadow-md sm:p-8 relative">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                {lang === 'sw' ? 'Kwa nini uchague kifurushi hiki?' : 'Why choose this bundle?'}
              </h2>
              
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Item 1 */}
                <div className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#ff4c00] shadow-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">
                      {lang === 'sw' ? 'Bei nafuu zaidi' : 'Best Price Guarantee'}
                    </h4>
                    <p className="mt-0.5 text-white/90 leading-relaxed font-medium text-[11px]">
                      {lang === 'sw' ? 'Ikilinganishwa na kununua bidhaa moja moja.' : 'Save significantly compared to purchasing individual items separately.'}
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#ff4c00] shadow-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">
                      {lang === 'sw' ? 'Vifaa bora' : 'Top Quality Gear'}
                    </h4>
                    <p className="mt-0.5 text-white/90 leading-relaxed font-medium text-[11px]">
                      {lang === 'sw' ? 'imehakikiwa na kuthibitishwa ubora.' : 'Verified and certified to meet high quality standards.'}
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#ff4c00] shadow-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">
                      {lang === 'sw' ? 'Inakuokoa muda' : 'Time Saving Sourcing'}
                    </h4>
                    <p className="mt-0.5 text-white/90 leading-relaxed font-medium text-[11px]">
                      {lang === 'sw' ? 'na matatizo ya kutafuta bidhaa tofauti.' : 'Saves you the hassle of coordinating with multiple different vendors.'}
                    </p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#ff4c00] shadow-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">
                      {lang === 'sw' ? 'Imepangwa mahsusi' : 'Specially Configured'}
                    </h4>
                    <p className="mt-0.5 text-white/90 leading-relaxed font-medium text-[11px]">
                      {lang === 'sw' ? 'kwa matumizi ya kila siku yako jikoni.' : 'Carefully assembled for daily practical and household usage.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Mockup collage of products */}
            <div className="hidden lg:flex items-center justify-center relative h-52 w-full select-none">
              {bundle.items[0] && (
                <img
                  src={bundle.items[0].images?.[0] || fallbackImage}
                  alt=""
                  className="absolute right-14 bottom-[-10px] h-44 object-contain drop-shadow-2xl transform hover:scale-105 transition duration-300"
                />
              )}
              {bundle.items[1] && (
                <img
                  src={bundle.items[1].images?.[0] || fallbackImage}
                  alt=""
                  className="absolute right-[-10px] bottom-3 h-32 object-contain drop-shadow-2xl transform translate-x-2 rotate-6 hover:scale-105 transition duration-300 bg-white/10 backdrop-blur-xs rounded-2xl p-1.5 border border-white/20"
                />
              )}
            </div>
          </div>
        </section>

        {/* Related Bundles / Packages */}
        {otherBundles.length > 0 && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-2">
                <Layers size={18} className="text-[#ff4c00]" />
                {t.related}
              </h3>
              <button 
                type="button" 
                onClick={onClose}
                className="inline-flex items-center gap-0.5 text-xs font-black text-orange-600 hover:text-[#ff4c00] transition uppercase tracking-wider"
              >
                {t.seeAll}
                <ChevronRight size={14} className="text-[#ff4c00]" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {otherBundles.map((b, bIdx) => (
                <RelatedBundleCard
                  key={b.id}
                  bundle={b}
                  labelFrom={t.from}
                  buttonLabel={t.choose}
                  isFirst={bIdx === 0}
                  onSelect={() => {
                    onSelectBundle(b);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const ThemeBadge = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-orange-600 border border-orange-100">
    {icon}
    {children}
  </span>
);

const FeaturePill = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xxs">
    <div className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-[#ff4c00]">{icon}</div>
    <h3 className="text-xs font-black text-slate-950 truncate">{title}</h3>
    <p className="mt-0.5 text-[10px] text-slate-500 truncate">{desc}</p>
  </div>
);

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex flex-col items-center text-center p-2">
    <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-[#ff4c00] border border-orange-100/40 shrink-0">
      {icon}
    </div>
    <h4 className="text-[11px] font-black text-slate-900 leading-tight truncate w-full">{title}</h4>
    <p className="mt-0.5 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate w-full">{desc}</p>
  </div>
);

const TrustStrip = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-3.5 p-1.5">
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#ff4c00] border border-orange-100/40">
      {icon}
    </div>
    <div>
      <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide leading-tight">{title}</h3>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{desc}</p>
    </div>
  </div>
);

const RelatedBundleCard = ({
  bundle,
  labelFrom,
  buttonLabel,
  isFirst,
  onSelect,
}: {
  bundle: SmartBundle;
  labelFrom: string;
  buttonLabel: string;
  isFirst?: boolean;
  onSelect: () => void;
  key?: React.Key;
}) => {
  const images = bundle.items.slice(0, 3).map((item) => item.images?.[0]).filter(Boolean) as string[];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xxs transition duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-md interactive-tap w-full"
    >
      <div className="relative bg-slate-50/50 p-4">
        <div className="flex h-28 items-center justify-center gap-1.5">
          {(images.length ? images : [fallbackImage]).map((image, index) => (
            <React.Fragment key={`${image}-${index}`}>
              {index > 0 && (
                <span className="text-slate-400 font-extrabold text-sm select-none px-0.5">+</span>
              )}
              <div className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-white shadow-xxs border border-slate-100 flex items-center justify-center shrink-0">
                <img
                  src={image}
                  alt={bundle.name}
                  className="h-full w-full object-cover border-none"
                  style={{ borderStyle: 'none', borderWidth: '0px' }}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
        <span className="absolute left-3 top-3 rounded-lg bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-orange-600 border border-orange-100">
          {bundle.type}
        </span>
        <span className="absolute right-3 top-3 rounded-lg bg-emerald-50 px-2 py-0.5 text-[8px] font-black text-emerald-700 border border-emerald-100">
          -{bundle.discountPercentage}%
        </span>
      </div>

      <div className="p-4">
        <h4 className="line-clamp-2 text-xs font-black leading-snug text-slate-950 group-hover:text-[#ff4c00] transition duration-150 min-h-[32px]">{bundle.name}</h4>
        
        <div className="mt-3.5 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{labelFrom}</p>
            <PriceDisplay
              amount={bundle.bundlePrice}
              colorClass="text-slate-950"
              className="text-sm font-black"
              truncate={false}
            />
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-700 transition group-hover:bg-[#ff4c00] group-hover:text-white group-hover:border-[#ff4c00]">
            <Package size={11} />
            {buttonLabel}
          </span>
        </div>
      </div>
    </button>
  );
};
