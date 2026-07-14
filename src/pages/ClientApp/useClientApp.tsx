import { slugify } from "../../lib/slugify";
import { getLoyaltyPoints, saveLoyaltyPoints, formatOrderNumber } from "../../lib/helpers";
import { updateDynamicProductSchema } from "../../utils/seo";
import { Html5Qrcode } from "html5-qrcode";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { db } from "../../lib/db";
import {
  BilingualSearchEngine,
  InvertedIndexSearch,
} from "../../lib/SearchEngine";
import { BILINGUAL_DICTIONARY } from "../../lib/searchDictionary";
import { formatCurrency } from "../../lib/storage";
import {
  Product,
  Promotion,
  Order,
  OrderStatusLog,
  Customer,
  Message,
  CartItem,
  Coupon,
  Niche,
  SellerProfile,
  MarketplaceAd,
  Review,
  PromotionalBanner,
} from "../../types";
import { getProductPriceForQty, getProductMOQ } from "../../utils/pricing";
import { navigateTo } from "../../utils/navigation";
import { generateNicheColorMap } from "../../utils/colorGenerator";
import {
  ShoppingCart,
  Search,
  User,
  Zap,
  MessageSquare,
  MessageCircle,
  Menu,
  X,
  Trash,
  Phone,
  ArrowUpDown,
  Image as ImageIcon,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Check,
  MapPin,
  Mail,
  Globe,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Package,
  Clock,
  Paperclip,
  Download,
  Smartphone,
  Shirt,
  Sofa,
  Heart,
  CarFront,
  ShoppingBag,
  TrendingUp,
  History,
  Store,
  Shuffle,
  Sparkles,
  Gift,
  Award,
  Bell,
  Bot,
  Camera,
  RefreshCw,
  Coins,
  Star,
  Tag,
  Ticket,
  Activity,
  Cpu,
  FileText,
  Laptop,
  Baby,
  Palette,
  Coffee,
  Dumbbell,
  Scissors,
  Briefcase,
  Headphones,
  Cake,
  Watch,
  Bike,
  Key,
  BookOpen,
  Leaf,
  Flame,
  Music,
  Gem,
  Tv,
  Compass,
  Footprints,
  Crown,
  GlassWater,
  Wrench,
  Flower2,
  Anchor,
  Apple,
  Banana,
  Beer,
  Bone,
  Box,
  Brain,
  Brush,
  Bus,
  Calculator,
  Candy,
  Cat,
  ChefHat,
  Clapperboard,
  Cloud,
  Cookie,
  Dog,
  Dices,
  Disc,
  Egg,
  Fan,
  Feather,
  Fish,
  Gamepad2,
  Gavel,
  Guitar,
  Hammer,
  IceCream,
  Joystick,
  Lightbulb,
  Luggage,
  Map,
  Mic,
  Microscope,
  Moon,
  Mountain,
  Paintbrush,
  PenTool,
  Pill,
  Pizza,
  Plane,
  Plug,
  Printer,
  Puzzle,
  Radio,
  Receipt,
  Rocket,
  Ruler,
  Scale,
  Server,
  Shell,
  ShowerHead,
  Shovel,
  Sprout,
  Stethoscope,
  Sun,
  Table,
  Tablet,
  Tent,
  Thermometer,
  Trophy,
  Umbrella,
  Utensils,
  Wallet,
  Wine,
  Pause,
  Play,
  Armchair,
  Bath,
  Battery,
  Bed,
  Beef,
  BellRing,
  Bird,
  Book,
  Castle,
  Clover,
  Construction,
  Container,
  CupSoda,
  Glasses,
  GraduationCap,
  HardHat,
  Heater,
  Martini,
  Notebook,
  PackageOpen,
  PawPrint,
  Pen,
  Pencil,
  PiggyBank,
  PlugZap,
  Rabbit,
  Refrigerator,
  Salad,
  Sandwich,
  ShoppingBasket,
  Smile,
  Snowflake,
  Soup,
  Speaker,
  Target,
  Telescope,
  Terminal,
  ToyBrick,
  Train,
  Trees,
  Volleyball,
  Wand,
  Warehouse,
  WashingMachine,
  Waves,
  Webcam,
  Wheat,
} from "lucide-react";
import { Lang, t } from "../../lib/i18nClient";
import { apiFetch } from "../../lib/db";
import { useDialog } from "../../components/CustomDialogContext";

const STOREFRONT_PRIMARY_TIMEOUT_MS = 12000;
const STOREFRONT_OPTIONAL_TIMEOUT_MS = 6500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function normalizePwaLaunchUrl() {
  const currentUrl = new URL(window.location.href);
  const rawLaunch = currentUrl.searchParams.get("launch");
  if (!rawLaunch) return currentUrl;

  let launchUrl: URL | null = null;
  try {
    launchUrl = new URL(rawLaunch);
  } catch {
    try {
      launchUrl = new URL(decodeURIComponent(rawLaunch));
    } catch {
      launchUrl = null;
    }
  }

  if (!launchUrl || launchUrl.protocol !== "web+orbishop:") return currentUrl;

  const targetUrl = new URL(window.location.origin);
  const launchParts = [launchUrl.hostname, ...launchUrl.pathname.split("/")].filter(Boolean);
  const [kind, id] = launchParts;

  if (kind === "product" && id) {
    targetUrl.searchParams.set("product", id);
  } else if (kind === "seller" && id) {
    targetUrl.searchParams.set("seller", id);
  } else if (kind === "track" && id) {
    targetUrl.searchParams.set("track", "true");
    targetUrl.searchParams.set("order", id);
  } else {
    targetUrl.searchParams.set("source", "pwa-protocol");
  }

  targetUrl.searchParams.set("source", "pwa-protocol");
  window.history.replaceState({}, "", `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
  return targetUrl;
}

function getProductIdFromLocation() {
  const launchUrl = normalizePwaLaunchUrl();
  const search = new URLSearchParams(launchUrl.search);
  const queryProductId = search.get("product") || search.get("product-id");
  if (queryProductId) return queryProductId;

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  if (pathParts[0] === "shop" && pathParts.length >= 3) {
    const lastPart = pathParts[pathParts.length - 1];
    const idMatch = lastPart.match(/--([a-z0-9-]+)$/i);
    if (idMatch) return idMatch[1];
  } else if (pathParts[0] === "product" && pathParts.length >= 2) {
    return pathParts[1];
  }

  return null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function slugifyNiche(name: string): string {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/ & /g, "-")
    .replace(/ /g, "-")
    .replace(/[^\w-]/g, "");
}

function deslugifyNiche(slug: string, systemNiches?: { name: string }[]): string {
  if (!slug) return "Zote";
  
  if (systemNiches && systemNiches.length > 0) {
    const matched = systemNiches.find(
      (n) => slugifyNiche(n.name) === slug.toLowerCase() || n.name.toLowerCase() === slug.toLowerCase()
    );
    if (matched) return matched.name;
  }

  const mapping: Record<string, string> = {
    "electronics-tech": "Electronics & Tech",
    "fashion-apparel": "Fashion & Apparel",
    "home-furniture": "Home & Furniture",
    "health-beauty": "Health & Beauty",
    "auto-motors": "Auto & Motors",
    "supermarket-food": "Supermarket & Food"
  };
  
  const mapped = mapping[slug.toLowerCase()];
  if (mapped) return mapped;

  const fallback = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (systemNiches && systemNiches.length > 0) {
    const hasNiche = systemNiches.some(n => n.name === fallback);
    if (hasNiche) return fallback;
  }
  
  return "Zote";
}

export interface SearchHistoryItem {
  term: string;
  timestamp: number;
}

export function useClientApp() {
const { showAlert, showConfirm } = useDialog();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("orbishop_lang") as Lang) || "sw";
    } catch {
      return "sw";
    }
  });
  const [prefs, setPrefs] = useState<{
    categories: Record<string, number>;
    views: Record<string, number>;
  }>(() => {
    try {
      if (localStorage.getItem("orbishop_cookie_consent_accepted") === "true") {
        const savedPrefs = localStorage.getItem("orbishop_user_prefs");
        if (savedPrefs) return JSON.parse(savedPrefs);
      }
    } catch {}
    return { categories: {}, views: {} };
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [wholesaleDeals, setWholesaleDeals] = useState<Product[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    db.getInvoiceSettings().then((res) => setGlobalSettings(res));
  }, []);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [promotionalBanners, setPromotionalBanners] = useState<
    PromotionalBanner[]
  >([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("orbishop_cart");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketplaceAds, setMarketplaceAds] = useState<MarketplaceAd[]>([]);
  const [visitorId, setVisitorId] = useState<string>(() => {
    let vid = localStorage.getItem("orbi_visitor_id");
    if (!vid) {
      vid =
        "vis_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("orbi_visitor_id", vid);
    }
    return vid;
  });
  const [countedAds, setCountedAds] = useState<string[]>([]);
  const trackedAdsRef = useRef<Set<string>>(new Set());
  const [shuffleWeights, setShuffleWeights] = useState<Record<string, number>>(
    {},
  );

  const handleShuffleClick = () => {
    const weights: Record<string, number> = {};
    products.forEach((p) => {
      weights[p.id] = Math.random();
    });
    promos.forEach((pr) => {
      weights[pr.id] = Math.random();
    });
    setShuffleWeights(weights);
    showAlert(
      lang === "sw"
        ? "Duka limechanganywa kibahati! Furahia kugundua bidhaa mpya."
        : "Marketplace reshuffled! Discover brand new products.",
      "success",
    );
  };

  const salesCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        if (order.status !== "confirmed") return acc;
        order.items.forEach((item) => {
          acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        });
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [orders]);

  const heroAds = useMemo(() => {
    const filteredHero = promos
      .filter((p) => p.title.startsWith("[HERO] "))
      .map((p) => ({ ...p, title: p.title.replace("[HERO] ", "") }));
    return filteredHero.sort((a, b) => {
      const wA = shuffleWeights[a.id] || 0.5;
      const wB = shuffleWeights[b.id] || 0.5;
      return wA - wB;
    });
  }, [promos, shuffleWeights]);
  const carouselAds = useMemo(() => {
    const defaultAds = promos.filter(
      (p) => !p.title.startsWith("[HERO] ") && p.title !== "SYSTEM_SELLERS",
    );

    // Auto-pilot: Automatically map one product from each active PRO seller as a sponsored ad
    const activeProSellers = sellers.filter(
      (s) => s.isPro && s.proUntil && s.proUntil > Date.now(),
    );
    const proAds: Promotion[] = [];

    activeProSellers.forEach((s) => {
      // Find a product by this seller to advertise
      const proProducts = products.filter(
        (p) => p.sellerId === s.id && p.images?.length > 0,
      );
      if (proProducts.length > 0) {
        const topProduct = proProducts.sort(
          (a, b) => (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0),
        )[0];
        proAds.push({
          id: topProduct.id,
          title: `[SPONSORED] ${s.name}`,
          description: topProduct.name,
          image: topProduct.images[0],
          link: `/?product=${topProduct.id}`,
          visible: true,
          createdAt: Date.now(),
        });
      }
    });

    const combined = [...defaultAds, ...proAds];
    return combined.sort((a, b) => {
      const wA = shuffleWeights[a.id] || 0.5;
      const wB = shuffleWeights[b.id] || 0.5;
      return wA - wB;
    });
  }, [promos, sellers, products, salesCounts, shuffleWeights]);

  const [recentProductIds, setRecentProductIds] = useState<string[]>(() => {
    try {
      if (localStorage.getItem("orbishop_cookie_consent_accepted") === "true") {
        const stored = localStorage.getItem("orbishop_recent_products");
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  const recentProductsList = useMemo(() => {
    if (!products.length) return [];
    return recentProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [recentProductIds, products]);

  const activeMarketplaceAds = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return marketplaceAds.filter((ad) => {
      if (!ad.visible) return false;
      if (ad.status === "paused" || ad.status === "pending") return false;
      if (ad.totalSpent >= ad.budgetLimit) return false;
      if (ad.startDate && todayStr < ad.startDate) return false;
      if (ad.endDate && todayStr > ad.endDate) return false;
      return true;
    });
  }, [marketplaceAds]);

  const trackMarketplaceAdImpression = async (adId: string) => {
    if (trackedAdsRef.current.has(adId)) return;
    trackedAdsRef.current.add(adId);

    try {
      setCountedAds((prev) => [...prev, adId]);
      fetch("/api/ads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          adId: adId,
          action: "impression",
          visitorId,
        }),
      }).catch((e) => console.log("Impression track skipped", e));
    } catch (err) {
      console.error("Error writing ad impression:", err);
    }
  };

  const handleMarketplaceAdClick = async (ad: MarketplaceAd) => {
    try {
      // Billable CPC event. This is separate from general visitor analytics.
      const trackClick = fetch("/api/ads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          adId: ad.id,
          action: "click",
          visitorId,
        }),
      }).catch((e) => console.warn("Ad click tracking error ignored", e));

      await Promise.race([
        trackClick,
        new Promise((resolve) => window.setTimeout(resolve, 450)),
      ]);

      if (ad.link) {
        window.location.href = ad.link;
      }
    } catch (err) {
      console.error("Error registering ad click:", err);
    }
  };

  const [activeUser, setActiveUser] = useState<Customer | null>(null);

  // UI State
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const data = localStorage.getItem("orbi_user_search_history");
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === "string") {
            let ts = Date.now();
            if (idx === 1 || idx === 2) {
              ts = Date.now() - 28 * 60 * 60 * 1000; // Staggered to show Yesterday
            } else if (idx >= 3) {
              ts = Date.now() - 55 * 60 * 60 * 1000; // Staggered to show Older
            }
            return { term: item, timestamp: ts };
          }
          if (item && typeof item === "object" && typeof item.term === "string") {
            return {
              term: item.term,
              timestamp: typeof item.timestamp === "number" ? item.timestamp : Date.now()
            };
          }
          return null;
        }).filter(Boolean) as SearchHistoryItem[];
      }
      return [];
    } catch {
      return [];
    }
  });

  const groupedSearchHistory = useMemo(() => {
    const today: SearchHistoryItem[] = [];
    const yesterday: SearchHistoryItem[] = [];
    const older: SearchHistoryItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    searchHistory.forEach((item) => {
      if (item.timestamp >= todayStart) {
        today.push(item);
      } else if (item.timestamp >= yesterdayStart) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    });

    return [
      { label: lang === "sw" ? "Leo" : "Today", items: today },
      { label: lang === "sw" ? "Jana" : "Yesterday", items: yesterday },
      { label: lang === "sw" ? "Zamani" : "Older Searches", items: older }
    ].filter(group => group.items.length > 0);
  }, [searchHistory, lang]);

  const [backendPopularSearches, setBackendPopularSearches] = useState<
    string[]
  >([]);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [ecosystemResults, setEcosystemResults] = useState<any[]>([]);
  const [isExpandingSearch, setIsExpandingSearch] = useState(false);
  const [isFetchingEcosystem, setIsFetchingEcosystem] = useState(false);
  const [ecosystemViewerItem, setEcosystemViewerItem] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Zote");
  const [selectedNiche, setSelectedNiche] = useState<string>("Zote");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredCategoryX, setHoveredCategoryX] = useState<number | null>(null);
  const [hoveredNiche, setHoveredNiche] = useState<string | null>(null);
  const [hoveredNicheX, setHoveredNicheX] = useState<number | null>(null);

  // Mega Menu Products computation
  const megaMenuProducts = useMemo(() => {
    if (!hoveredNiche && !hoveredCategory) return [];

    let targetNiche = hoveredNiche !== "Zote" ? hoveredNiche : null;
    let targetCat = hoveredCategory !== "Zote" ? hoveredCategory : null;

    let filtered = products.filter((p) => {
      if (targetNiche && (p.niche || "Mengineyo") !== targetNiche) return false;
      if (targetCat && p.category !== targetCat) return false;
      return true;
    });

    const proSellerIds = new Set(
      sellers.filter((s) => s.isPro).map((s) => s.id),
    );

    // Prioritize products from pro sellers, then fallback to others
    filtered.sort((a, b) => {
      const aPro = a.sellerId && proSellerIds.has(a.sellerId) ? 1 : 0;
      const bPro = b.sellerId && proSellerIds.has(b.sellerId) ? 1 : 0;
      return bPro - aPro;
    });

    return filtered.slice(0, 10);
  }, [hoveredNiche, hoveredCategory, products, sellers]);
  const [selectedArrangementTier, setSelectedArrangementTier] =
    useState<string>(() => {
      try {
        return (
          localStorage.getItem("orbishop_selectedArrangementTier") || "all"
        );
      } catch {
        return "all";
      }
    });
  const [selectedArrangementVibe, setSelectedArrangementVibe] =
    useState<string>(() => {
      try {
        return (
          localStorage.getItem("orbishop_selectedArrangementVibe") || "all"
        );
      } catch {
        return "all";
      }
    });
  const [selectedArrangementWrap, setSelectedArrangementWrap] =
    useState<string>(() => {
      try {
        return (
          localStorage.getItem("orbishop_selectedArrangementWrap") || "all"
        );
      } catch {
        return "all";
      }
    });
  const nicheScrollRef = useRef<HTMLDivElement>(null);

  const syncStatesRef = useRef<any>({});
  const hasSyncedInitialUrlRef = useRef<boolean>(false);
  useEffect(() => {
    syncStatesRef.current = {
      selectedProduct,
      selectedFamily,
      selectedNiche,
      selectedCategory,
      viewSeller,
      showCart,
      showCheckout,
      showTrackOrder,
      showProfile,
      profileInitialTab,
      showAboutPage,
      aboutPageTab,
      showApplySellerModal,
      showAuth
    };
  });

  const [likedProductIds, setLikedProductIds] = useState<string[]>(() => {
    try {
      const data = localStorage.getItem("orbi_liked_product_ids");
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [clickedNiches, setClickedNiches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("orbi_clicked_niches");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const likedNiches = useMemo(() => {
    const niches = new Set<string>();
    likedProductIds.forEach((id) => {
      const prod = products.find((p) => p.id === id);
      if (prod && prod.niche) {
        niches.add(prod.niche.toLowerCase());
      }
    });
    return Array.from(niches);
  }, [likedProductIds, products]);

  // AI Shopkeeper Auto Pilot: Read user experience (Search + Clicks + Likes + Selected Niches)
  const userPreferenceProfile = useMemo(() => {
    const profile = {
      niches: new Set<string>(),
      categories: new Set<string>(),
      keywords: new Set<string>(),
      families: new Set<string>()
    };

    // Load from cookies first (if accepted)
    try {
      const match = document.cookie.match(/(^|;)\s*orbi_ux_prefs\s*=\s*([^;]+)/);
      if (match) {
        const decoded = JSON.parse(decodeURIComponent(match[2]));
        if (decoded.niches) decoded.niches.forEach((n: string) => profile.niches.add(n.toLowerCase()));
        if (decoded.categories) decoded.categories.forEach((c: string) => profile.categories.add(c.toLowerCase()));
        if (decoded.families) decoded.families.forEach((f: string) => profile.families.add(f.toLowerCase()));
      }
    } catch {}

    // Incorporate Liked Niches & Families
    likedNiches.forEach(n => profile.niches.add(n));
    likedProductIds.forEach((id) => {
      const prod = products.find((p) => p.id === id);
      if (prod && prod.family) {
        profile.families.add(prod.family.toLowerCase());
      }
    });

    // Incorporate Clicked Niches from state
    clickedNiches.forEach(n => profile.niches.add(n.toLowerCase()));

    // Incorporate Clicks (Recent products viewed)
    recentProductsList.forEach(p => {
      if (p.niche) profile.niches.add(p.niche.toLowerCase());
      if (p.category) profile.categories.add(p.category.toLowerCase());
      if (p.family) profile.families.add(p.family.toLowerCase());
      p.name.split(" ").filter(w => w.length > 3).forEach(w => profile.keywords.add(w.toLowerCase()));
    });

    // Incorporate Searches
    searchHistory.slice(0, 10).forEach(item => {
      const term = item.term;
      term.split(" ").filter(w => w.length > 2).forEach(word => {
        profile.keywords.add(word.toLowerCase());
      });
    });

    return profile;
  }, [likedNiches, likedProductIds, clickedNiches, products, recentProductsList, searchHistory]);

  useEffect(() => {
    try {
      if (localStorage.getItem("orbishop_cookie_consent_accepted") === "true") {
        const payload = {
          niches: Array.from(userPreferenceProfile.niches).slice(0, 5),
          categories: Array.from(userPreferenceProfile.categories).slice(0, 5),
          families: Array.from(userPreferenceProfile.families).slice(0, 5)
        };
        // Use cookie for automatic UX adjustment persistence
        document.cookie = `orbi_ux_prefs=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {}
  }, [userPreferenceProfile]);

  const toggleLikeProduct = (productId: string, productNiche?: string) => {
    try {
      let updated: string[];
      let isLiking = false;
      if (likedProductIds.includes(productId)) {
        updated = likedProductIds.filter((id) => id !== productId);
      } else {
        updated = [...likedProductIds, productId];
        isLiking = true;
      }
      setLikedProductIds(updated);
      localStorage.setItem("orbi_liked_product_ids", JSON.stringify(updated));

      if (isLiking) {
        setToastMsg(
          lang === "sw"
            ? "Bidhaa imeongezwa kwenye vipendwa!"
            : "Product added to favorites!"
        );
      } else {
        setToastMsg(
          lang === "sw"
            ? "Bidhaa imeondolewa kwenye vipendwa!"
            : "Product removed from favorites!"
        );
      }
    } catch (e) {
      console.error(e);
      setToastMsg(
        lang === "sw"
          ? "Kuna tatizo wakati wa kubadilisha vipendwa."
          : "There was a problem updating your favorites."
      );
    }
  };

  const [showNicheDrawer, setShowNicheDrawer] = useState(false);
  const [sortOrder, setSortOrder] = useState<
    "default" | "asc" | "desc" | "newest" | "popular"
  >(() => {
    try {
      return (localStorage.getItem("orbishop_sortOrder") as any) || "default";
    } catch {
      return "default";
    }
  });
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState<"login" | "register" | null>(null);
  const [showApplySellerModal, setShowApplySellerModal] = useState(() => {
    return window.location.pathname === "/sellers/signup" || window.location.search.includes("seller-signup=true") || window.location.search.includes("seller-apply=true") || window.location.hash.includes("#seller-signup") || window.location.hash.includes("#seller-apply");
  });

  useEffect(() => {
    const handleUrlChangeOnClient = () => {
      const activeSignup = window.location.pathname === "/sellers/signup" || window.location.search.includes("seller-signup=true") || window.location.search.includes("seller-apply=true") || window.location.hash.includes("#seller-signup") || window.location.hash.includes("#seller-apply");
      if (activeSignup) {
        setShowApplySellerModal(true);
      }
    };
    window.addEventListener("popstate", handleUrlChangeOnClient);
    handleUrlChangeOnClient();

    return () => {
      window.removeEventListener("popstate", handleUrlChangeOnClient);
    };
  }, []);

  const [showProfile, setShowProfile] = useState(false);
  const [showTrackOrder, setShowTrackOrder] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<
    "orders" | "track" | "rewards" | "locator" | "settings"
  >("orders");

  const [showChatModal, setShowChatModal] = useState(false);
  const [chatTargetSellerId, setChatTargetSellerId] = useState<string | undefined>(undefined);
  const [chatTargetSellerName, setChatTargetSellerName] = useState<string | undefined>(undefined);
  const [chatTargetSellerAvatar, setChatTargetSellerAvatar] = useState<string | undefined>(undefined);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSecureOrderAuthPrompt, setShowSecureOrderAuthPrompt] =
    useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [aboutPageTab, setAboutPageTab] = useState("about");
  const [isLoading, setIsLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState<Order | null>(null);
  const [viewPromo, setViewPromo] = useState<Promotion | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // SEO: Dynamic Title and Meta Tag Updates for the Search Engine Platform
  useEffect(() => {
    const baseTitle = "Orbi Shop | The Most Trusted Marketplace in Tanzania";
    const baseDesc = "Orbi Shop is Tanzania's safest e-commerce platform. Shop verified products, enjoy payment protection with Orbi Pay, and track your orders in real-time. Nunua mtandaoni Tanzania.";
    
    let currentTitle = baseTitle;
    let currentDesc = baseDesc;

    if (selectedProduct) {
      currentTitle = `Bei ya ${selectedProduct.name} | Orbi Shop`;
      currentDesc = `Nunua ${selectedProduct.name} kwa bei ya ${formatCurrency(selectedProduct.price)}. ${selectedProduct.description?.substring(0, 100)}...`;
    } else if (committedSearch.trim()) {
      currentTitle = `Search results for "${committedSearch}" | Orbi Shop`;
      currentDesc = `Find the best prices for "${committedSearch}" on Orbi Shop Tanzania. Verified sellers and secure payments guaranteed. Buy ${committedSearch} safely.`;
    } else if (selectedNiche !== "Zote") {
      currentTitle = `${selectedNiche} | Orbi Shop Tanzania`;
      currentDesc = `Discover the best ${selectedNiche} products on Orbi Shop. High quality, authentic, and protected shopping in Tanzania. ${selectedNiche} deals today.`;
    }

    document.title = currentTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', currentDesc);
    
    // OG Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', currentTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', currentDesc);

    updateDynamicProductSchema(selectedProduct);
  }, [selectedProduct, committedSearch, selectedNiche, lang]);

  const [viewSeller, setViewSeller] = useState<SellerProfile | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [allReviews, setAllReviews] = useState<Record<string, any[]>>({});

  useEffect(() => {
    try {
      localStorage.setItem("orbishop_lang", lang);
      window.dispatchEvent(new Event("orbishop-language-change"));
      localStorage.setItem("orbishop_selectedCategory", selectedCategory);
      localStorage.setItem("orbishop_selectedNiche", selectedNiche);
      localStorage.setItem(
        "orbishop_selectedArrangementTier",
        selectedArrangementTier,
      );
      localStorage.setItem(
        "orbishop_selectedArrangementVibe",
        selectedArrangementVibe,
      );
      localStorage.setItem(
        "orbishop_selectedArrangementWrap",
        selectedArrangementWrap,
      );
      localStorage.setItem("orbishop_sortOrder", sortOrder);

      if (activeUser && activeUser.id && activeUser.id !== "guest") {
        db.updateCustomer(activeUser.id, { preferredLanguage: lang }).catch(
          (err) =>
            console.warn(
              "Could not sync preferred language to server profile:",
              err,
            ),
        );
      }
    } catch {}
  }, [
    lang,
    selectedCategory,
    selectedNiche,
    selectedArrangementTier,
    selectedArrangementVibe,
    selectedArrangementWrap,
    sortOrder,
    activeUser?.id,
  ]);

  useEffect(() => {
    // Bi-directional URL to React State router
    const handleUrlToStateSync = () => {
      const normalizedUrl = normalizePwaLaunchUrl();
      const search = new URLSearchParams(normalizedUrl.search);
      const hash = window.location.hash;
      const path = window.location.pathname;
      const cur = syncStatesRef.current;

      // 1. Handle product selection from Path or Query
      const prodId = search.get("product") || search.get("product-id");
      const pathParts = path.split('/').filter(Boolean);
      let pathProdId = null;
      if (pathParts[0] === 'shop' && pathParts.length >= 3) {
        const lastPart = pathParts[pathParts.length - 1];
        const idMatch = lastPart.match(/--([a-z0-9-]+)$/i);
        if (idMatch) pathProdId = idMatch[1];
      } else if (pathParts[0] === 'product' && pathParts.length >= 2) {
        pathProdId = pathParts[1];
      }

      const effectiveProdId = prodId || pathProdId;
      if (effectiveProdId) {
        if (!cur.selectedProduct || (cur.selectedProduct.id !== effectiveProdId && cur.selectedProduct.legacy_id !== effectiveProdId)) {
          const found = products.find(p => p.id === effectiveProdId || p.legacy_id === effectiveProdId);
          if (found) setSelectedProduct(found);
        }
      } else {
        if (cur.selectedProduct) setSelectedProduct(null);
      }

      // 1d. Handle niche and nested categories/families from path
      if (pathParts[0] === 'niche' && pathParts.length >= 2) {
        const nicheSlug = pathParts[1];
        
        // Resolve Niche
        let resolvedNiche = "Zote";
        if (cur.selectedNiche && cur.selectedNiche !== "Zote" && slugifyNiche(cur.selectedNiche) === nicheSlug) {
          resolvedNiche = cur.selectedNiche;
        } else {
          resolvedNiche = deslugifyNiche(nicheSlug, systemNiches);
          if (cur.selectedNiche !== resolvedNiche) {
            setSelectedNiche(resolvedNiche);
          }
        }

        // Resolve Category under Niche
        if (pathParts.length >= 3) {
          const catSlug = pathParts[2];
          if (cur.selectedCategory && cur.selectedCategory !== "Zote" && slugify(cur.selectedCategory) === catSlug) {
            // Already matches
          } else {
            const matchedCategory = Array.from<string>(new Set(products.map(p => (p.category || "") as string))).find(c => slugify(c) === catSlug);
            if (matchedCategory) {
              if (cur.selectedCategory !== matchedCategory) {
                setSelectedCategory(matchedCategory);
              }
            } else {
              const reconstructed = catSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              if (cur.selectedCategory !== reconstructed) {
                setSelectedCategory(reconstructed);
              }
            }
          }
        } else {
          if (cur.selectedCategory && cur.selectedCategory !== "Zote") {
            setSelectedCategory("Zote");
          }
        }

        // Resolve Family under Category
        if (pathParts.length >= 4) {
          const familySlug = pathParts[3];
          if (cur.selectedFamily && slugify(cur.selectedFamily) === familySlug) {
            // Already matches
          } else {
            const matchingProduct = products.find(p => {
              let fam = p.family || "";
              if (p.category && p.category.includes("::")) {
                fam = p.category.split("::")[2] || fam;
              }
              return slugify(fam) === familySlug;
            });

            if (matchingProduct) {
              let actualFamily = matchingProduct.family || "";
              if (matchingProduct.category && matchingProduct.category.includes("::")) {
                actualFamily = matchingProduct.category.split("::")[2] || actualFamily;
              }
              if (cur.selectedFamily !== actualFamily) {
                setSelectedFamily(actualFamily);
              }
            } else {
              const reconstructed = familySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              if (cur.selectedFamily !== reconstructed) {
                setSelectedFamily(reconstructed);
              }
            }
          }
        } else {
          if (cur.selectedFamily) {
            setSelectedFamily(null);
          }
        }
      } else if (!effectiveProdId && pathParts.length === 0) {
        if (cur.selectedNiche && cur.selectedNiche !== "Zote") {
          setSelectedNiche("Zote");
        }
      }

      // 1b. Handle category from flat /shop/ paths (if not nested inside a niche)
      if (pathParts[0] === 'shop' && pathParts.length === 2 && !effectiveProdId) {
        const catSlug = pathParts[1];
        if (cur.selectedCategory && cur.selectedCategory !== "Zote" && slugify(cur.selectedCategory) === catSlug) {
          // Already matches
        } else {
          const matchedCategory = Array.from<string>(new Set(products.map(p => (p.category || "") as string))).find(c => slugify(c) === catSlug);
          if (matchedCategory) {
            if (cur.selectedCategory !== matchedCategory) {
              setSelectedCategory(matchedCategory);
            }
          } else {
            if (cur.selectedCategory && cur.selectedCategory !== "Zote") {
              setSelectedCategory("Zote");
            }
          }
        }
      } else if (!effectiveProdId && pathParts.length === 0) {
        if (cur.selectedCategory && cur.selectedCategory !== "Zote") {
          setSelectedCategory("Zote");
        }
      } else if (pathParts[0] !== 'shop' && pathParts[0] !== 'niche') {
        if (cur.selectedCategory && cur.selectedCategory !== "Zote") {
          setSelectedCategory("Zote");
        }
      }

      // 1c. Handle family from path (when not inside a niche)
      if (pathParts[0] === 'family' && pathParts.length >= 2) {
        const familySlug = pathParts[1];
        if (cur.selectedFamily && slugify(cur.selectedFamily) === familySlug) {
          // Already matches
        } else {
          const matchingProduct = products.find(p => {
            let fam = p.family || "";
            if (p.category && p.category.includes("::")) {
              fam = p.category.split("::")[2] || fam;
            }
            return slugify(fam) === familySlug;
          });

          if (matchingProduct) {
            let actualFamily = matchingProduct.family || "";
            if (matchingProduct.category && matchingProduct.category.includes("::")) {
              actualFamily = matchingProduct.category.split("::")[2] || actualFamily;
            }
            if (cur.selectedFamily !== actualFamily) {
              setSelectedFamily(actualFamily);
            }
          } else {
            const reconstructed = familySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (cur.selectedFamily !== reconstructed) {
              setSelectedFamily(reconstructed);
            }
          }
        }
        if (cur.selectedProduct) {
          setSelectedProduct(null);
        }
      } else if (pathParts[0] !== 'niche') {
        if (cur.selectedFamily && (!cur.selectedNiche || cur.selectedNiche === "Zote")) {
          setSelectedFamily(null);
        }
      }

      // 2. Handle seller storefront
      const sellerId = search.get("seller") || search.get("seller-id") || search.get("seller-profile");
      if (sellerId) {
        if (!cur.viewSeller || cur.viewSeller.id !== sellerId) {
          const found = sellers.find(s => s.id === sellerId);
          if (found) {
            setViewSeller(found);
          } else {
            // Guard against redundant object literal updates
            if (!cur.viewSeller || cur.viewSeller.id !== sellerId || cur.viewSeller.store_name !== "Merchant Store") {
              setViewSeller({ id: sellerId, store_name: "Merchant Store", name: "Merchant Partner" } as any);
            }
          }
        }
      } else {
        if (cur.viewSeller) setViewSeller(null);
      }

      // 3. Handle Cart page
      const hasCart = search.get("cart") === "true" || search.get("page") === "cart";
      if (cur.showCart !== hasCart) setShowCart(hasCart);

      // 4. Handle Checkout page
      const hasCheckout = search.get("checkout") === "true" || search.get("page") === "checkout" || path === "/checkout";
      if (cur.showCheckout !== hasCheckout) setShowCheckout(hasCheckout);

      // 5. Handle Track Order page
      const trackOrderId = pathParts[0] === 'track' && pathParts.length >= 2 ? pathParts[1] : null;
      const hasTrack = search.get("track") === "true" || search.get("page") === "track" || !!trackOrderId;
      if (cur.showTrackOrder !== hasTrack) setShowTrackOrder(hasTrack);

      // 6. Handle Profile page and its active initial tab
      const hasProfile = search.get("profile") === "true" || search.get("page") === "profile";
      if (cur.showProfile !== hasProfile) setShowProfile(hasProfile);
      const allowedProfileTabs = new Set([
        "orders",
        "track",
        "rewards",
        "locator",
        "settings",
      ]);
      const profTab = search.get("profile-tab") as any;
      if (
        profTab &&
        allowedProfileTabs.has(profTab) &&
        cur.profileInitialTab !== profTab
      ) {
        setProfileInitialTab(profTab);
      }

      // 7. Handle About page and its active tab
      const hasAbout = search.get("about") === "true" || search.get("page") === "about" || hash.includes("#about");
      if (cur.showAboutPage !== hasAbout) setShowAboutPage(hasAbout);
      const abTab = search.get("about-tab") || "about";
      if (abTab && cur.aboutPageTab !== abTab) {
        setAboutPageTab(abTab);
      }

      // 8. Handle Seller application page / signup
      const hasSignup = search.get("seller-signup") === "true" || search.get("seller-apply") === "true" || hash.includes("#seller-signup");
      if (cur.showApplySellerModal !== hasSignup) setShowApplySellerModal(hasSignup);

      // 9. Handle Auth login / register
      const authVal = search.get("auth") as any;
      if (authVal) {
        if (cur.showAuth !== authVal) setShowAuth(authVal);
      } else {
        if (cur.showAuth) setShowAuth(null);
      }
    };

    // ONLY execute initial routing setup once when data finishes loading
    if (!isLoading && !hasSyncedInitialUrlRef.current) {
      handleUrlToStateSync();
      hasSyncedInitialUrlRef.current = true;
    }

    window.addEventListener("popstate", handleUrlToStateSync);

    return () => {
      window.removeEventListener("popstate", handleUrlToStateSync);
    };
  }, [isLoading, products, sellers]);

  // Sync React State changes to Browser URL parameters instantly
  useEffect(() => {
    if (!hasSyncedInitialUrlRef.current) return;

    const params = new URLSearchParams(window.location.search);
    let newPath = window.location.pathname;

    if (selectedProduct) {
      const nicheSlug = slugify(selectedProduct.niche || 'general');
      // Category might be "Phones::iOS", we want "phones/ios"
      const categoryPath = (selectedProduct.category || '')
        .split('::')
        .map(part => slugify(part))
        .filter(Boolean)
        .join('/');
      
      const productSlug = slugify(selectedProduct.name);
      
      const fullCategoryPath = categoryPath ? `${nicheSlug}/${categoryPath}` : nicheSlug;
      newPath = `/shop/${fullCategoryPath}/${productSlug}--${selectedProduct.id}`;
      
      params.delete("product");
      params.delete("product-id");
    } else if (selectedNiche && selectedNiche !== "Zote") {
      const nicheSlug = slugifyNiche(selectedNiche);
      if (selectedCategory && selectedCategory !== "Zote") {
        const catSlug = slugify(selectedCategory);
        if (selectedFamily) {
          const familySlug = slugify(selectedFamily);
          newPath = `/niche/${nicheSlug}/${catSlug}/${familySlug}`;
        } else {
          newPath = `/niche/${nicheSlug}/${catSlug}`;
        }
      } else {
        newPath = `/niche/${nicheSlug}`;
      }
      params.delete("product");
    } else if (selectedFamily) {
      newPath = `/family/${slugify(selectedFamily)}`;
      params.delete("product");
    } else if (selectedCategory && selectedCategory !== "Zote") {
      newPath = `/shop/${slugify(selectedCategory)}`;
      params.delete("product");
    } else {
      if (newPath.startsWith('/shop/') || newPath.startsWith('/family/') || newPath.startsWith('/niche/')) {
        newPath = '/';
      }
    }

    if (viewSeller) {
      params.set("seller", viewSeller.id);
    } else {
      params.delete("seller");
      params.delete("seller-id");
    }

    if (showCart) {
      params.set("cart", "true");
    } else {
      params.delete("cart");
    }

    if (showCheckout) {
      params.set("checkout", "true");
    } else {
      params.delete("checkout");
    }

    if (showTrackOrder) {
      params.set("track", "true");
    } else {
      params.delete("track");
    }

    if (showProfile) {
      params.set("profile", "true");
      params.set("profile-tab", profileInitialTab);
    } else {
      params.delete("profile");
      params.delete("profile-tab");
    }

    if (showAboutPage) {
      params.set("about", "true");
      params.set("about-tab", aboutPageTab);
    } else {
      params.delete("about");
      params.delete("about-tab");
    }

    if (showApplySellerModal) {
      params.set("seller-signup", "true");
    } else {
      params.delete("seller-signup");
      params.delete("seller-apply");
    }

    if (showAuth) {
      params.set("auth", showAuth);
    } else {
      params.delete("auth");
    }

    const currentSearch = window.location.search;
    const currentPath = window.location.pathname;
    const newSearch = params.toString() ? `?${params.toString()}` : "";
    
    if (currentSearch !== newSearch || currentPath !== newPath) {
      window.history.pushState({}, "", newPath + newSearch + window.location.hash);
    }
  }, [
    selectedProduct,
    selectedCategory,
    selectedNiche,
    selectedFamily,
    viewSeller,
    showCart,
    showCheckout,
    showTrackOrder,
    showProfile,
    profileInitialTab,
    showAboutPage,
    aboutPageTab,
    showApplySellerModal,
    showAuth
  ]);

  useEffect(() => {
    try {
      localStorage.setItem("orbishop_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const data = await apiFetch("/api/v1/search/popular");
        if (data && data.success && Array.isArray(data.popular)) {
          setBackendPopularSearches(data.popular);
        }
      } catch (err) {
        // Handle transient network fetch errors gracefully during server restarts
        console.warn("Popular searches did not load yet:", err);
      }
    };
    fetchPopular();
    const interval = setInterval(fetchPopular, 30000);
    return () => clearInterval(interval);
  }, []);

  const [contextualAds, setContextualAds] = useState<any[]>([]);
  const [isFetchingContextualAds, setIsFetchingContextualAds] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchContextualAds = async () => {
      if (!userPreferenceProfile) return;
      setIsFetchingContextualAds(true);
      try {
        const payload = {
          niches: Array.from(userPreferenceProfile.niches) as string[],
          categories: Array.from(userPreferenceProfile.categories) as string[],
          keywords: Array.from(userPreferenceProfile.keywords) as string[],
          families: Array.from(userPreferenceProfile.families) as string[],
        };
        const fetched = await db.getContextualAds(payload);
        if (active) {
          setContextualAds(fetched);
        }
      } catch (err) {
        console.warn("Error fetching contextual ads:", err);
      } finally {
        if (active) {
          setIsFetchingContextualAds(false);
        }
      }
    };

    fetchContextualAds();

    return () => {
      active = false;
    };
  }, [userPreferenceProfile]);

  const sortedAdsList = useMemo(() => {
    const loyaltyAds: any[] = [];

    const sourceAds = contextualAds && contextualAds.length > 0 ? contextualAds : activeMarketplaceAds;

    const mappedSponsorAds = sourceAds.map((ad) => {
      const originalAd = activeMarketplaceAds.find(a => a.id === ad.id) || ad;
      return {
        id: ad.id,
        type: "sponsor" as const,
        businessName: ad.businessName,
        title: ad.title,
        description:
          ad.description ||
          (lang === "sw"
            ? "Gundua kahawa na matoleo hapa..."
            : "Premium quality sponsored product space..."),
        image:
          ad.image ||
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
        badge: lang === "sw" ? "Imedhaminiwa" : "Sponsored",
        niche: ad.niche || "",
        relevancePercentage: ad.relevancePercentage || undefined,
        matchReason: ad.matchReason || undefined,
        action: () => handleMarketplaceAdClick(originalAd),
        trackImpression: () => trackMarketplaceAdImpression(originalAd.id),
      };
    });

    const combined = [...loyaltyAds, ...mappedSponsorAds];

    if (!contextualAds || contextualAds.length === 0) {
      return combined
        .map((ad) => {
          let score = Math.random();
          
          if (ad.niche && userPreferenceProfile.niches.has(ad.niche.toLowerCase())) {
             score -= 5; // Boost
          }

          if (selectedNiche && selectedNiche !== "Zote") {
            const isMatch =
              ad.niche?.toLowerCase() === selectedNiche.toLowerCase();
            if (isMatch) {
              score -= 10;
            }
          }
          return { ad, score };
        })
        .sort((a, b) => a.score - b.score)
        .map((x) => x.ad);
    }

    return combined;
  }, [contextualAds, activeMarketplaceAds, selectedNiche, lang, visitorId, userPreferenceProfile]);

  const handleProductSelect = (p: Product) => {
    setSelectedProduct(p);
    
    const nicheSlug = slugify(p.niche || 'general');
    const categoryPath = (p.category || '')
      .split('::')
      .map(part => slugify(part))
      .filter(Boolean)
      .join('/');
    const productSlug = slugify(p.name);
    
    const fullCategoryPath = categoryPath ? `${nicheSlug}/${categoryPath}` : nicheSlug;
    const newPath = `/shop/${fullCategoryPath}/${productSlug}--${p.id}`;

    window.history.pushState(
      {},
      "",
      newPath
    );
    window.dispatchEvent(new Event('popstate'));

    setRecentProductIds((prev) => {
      const updated = [p.id, ...prev.filter((id) => id !== p.id)].slice(0, 10);
      try {
        if (
          localStorage.getItem("orbishop_cookie_consent_accepted") === "true"
        ) {
          localStorage.setItem(
            "orbishop_recent_products",
            JSON.stringify(updated),
          );
        }
      } catch {}
      return updated;
    });
  };

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [systemNiches, setSystemNiches] = useState<Niche[]>([]);
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);

  // --- Loyalty Program & Receipt Scanner States ---
  const [forcePointsUpdate, setForcePointsUpdate] = useState(0);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [parsedReceiptData, setParsedReceiptData] = useState<any>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);

  const [readReplyIds, setReadReplyIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("orbishop_read_reply_ids");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const handleReceiptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsParsingReceipt(true);
    setParsingError(null);
    setParsedReceiptData(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const res = await fetch("/api/v1/ai/parse-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64data,
              customerId: activeUser ? activeUser.id : getInitialUserId(),
            }),
          });
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) throw new Error("Server returned non-JSON response");
          const data = await res.json();
          if (data.success && data.receipt) {
            setParsedReceiptData(data.receipt);
            showAlert(
              lang === "sw"
                ? "Risiti imechanganuliwa! Tafadhali hakiki maelezo hapa chini."
                : "Receipt parsed successfully! Please review details below.",
              "success",
            );
          } else {
            throw new Error(
              data.error ||
                (lang === "sw"
                  ? "Imeshindwa kutambua herufi za risiti."
                  : "Invalid receipt content. Please try another copy."),
            );
          }
        } catch (innerErr: any) {
          console.error(innerErr);
          setParsingError(innerErr.message || "E-OCR error processing receipt");
        } finally {
          setIsParsingReceipt(false);
        }
      };
    } catch (err: any) {
      console.error(err);
      setParsingError(
        err.message || "Failed to process receipt physical selection",
      );
      setIsParsingReceipt(false);
    }
  };

  const handleClaimReceiptPoints = async () => {
    if (!parsedReceiptData) return;
    const userId = activeUser ? activeUser.id : getInitialUserId();
    const earned =
      parsedReceiptData.estimatedLoyaltyPoints ||
      Math.floor(parsedReceiptData.total / 2000) ||
      50;
    const currentPoints = getLoyaltyPoints(userId);
    const updated = currentPoints + earned;

    saveLoyaltyPoints(userId, updated);

    // Add real notification message inside profile inbox
    const receiptFeedbackMsg = {
      id: "ReceiptClaim-" + Date.now(),
      name: "Orbi Loyalty Manager",
      phone: "System Reward",
      message: `🎉 RISITI YA DHAMBI ILIYOSHUGHULIKIWA:
Imethibitishwa kutoka kwa muuzaji: "${parsedReceiptData.vendor}".
Jumla ya manunuzi ${formatCurrency(Number(parsedReceiptData.total))} imehakikiwa kikamilifu. 

Zawadi ya Alama za Uaminifu zilizoongezwa kwenye kibeti chako: +${earned} Points!`,
      customer_id: userId,
      admin_reply:
        "Mfumo wa Orbi umeweka alama hizi moja kwa moja kwenye akaunti yako. Asante kwa kutuamini!",
      date: Date.now(),
    };

    try {
      await db.saveMessage(receiptFeedbackMsg);
    } catch (dbErr) {
      console.log(
        "Ignored silent database save error for receipt message tracker:",
        dbErr,
      );
    }

    showAlert(
      lang === "sw"
        ? `Hongera! Risiti yako ya ${formatCurrency(Number(parsedReceiptData.total))} imesajiliwa na alama +${earned} zimeingizwa kwenye wasifu wako!`
        : `Congratulations! Your receipt totaling ${formatCurrency(Number(parsedReceiptData.total))} was audited and +${earned} points have been credited to your reward wallet!`,
      "success",
    );

    setParsedReceiptData(null);
    setForcePointsUpdate((prev) => prev + 1);
  };

  const handleRedeemVoucher = async (voucher: any) => {
    const userId = activeUser ? activeUser.id : getInitialUserId();
    const currentPoints = getLoyaltyPoints(userId);
    if (currentPoints < voucher.points) {
      showAlert(
        lang === "sw"
          ? `Alama zako (${currentPoints}) hazitoshi kukomboa tuzo hii inayouza kwa alama ${voucher.points}.`
          : `Your loyalty points balance (${currentPoints}) is insufficient to claim this reward costing ${voucher.points} points.`,
        "error",
      );
      return;
    }

    const confirmChoice = await showConfirm(
      lang === "sw"
        ? `Je, unapenda kukata alama -${voucher.points} za uaminifu kutoka kwenye akaunti yako ili kupokea ${voucher.nameSw}?`
        : `Are you sure you want to deduct -${voucher.points} loyalty points from your balance to claim a ${voucher.nameEn}?`,
      lang === "sw" ? "Komboa Alama" : "Claim Premium Reward",
    );

    if (confirmChoice) {
      const updated = currentPoints - voucher.points;
      saveLoyaltyPoints(userId, updated);

      const cpnCode = `ORBI-VIP-${voucher.percent}-${Math.floor(Math.random() * 10000)}`;
      const newCoupon = {
        id: "Redeem-" + Date.now(),
        code: cpnCode,
        discountPercentage: voucher.percent,
        expiresAt: new Date(
          Date.now() + 15 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        active: true,
        targetCustomer: userId,
      };

      try {
        await db.saveCoupon(newCoupon);
        const cpns = await db.getCoupons();
        setCoupons(cpns);

        showAlert(
          lang === "sw"
            ? `Imefanikiwa! Punguzo lako limehamishwa kama Kuponi mpya: "${cpnCode}". Unaweza kuinakili sasa kwa ajili ya manunuzi ya mabezi!`
            : `Splendid! Coupon created successfully with code: "${cpnCode}". It is now loaded into your checkout options!`,
          "success",
        );
        setForcePointsUpdate((prev) => prev + 1);
      } catch (cpnErr: any) {
        showAlert("Failed coupon instantiation: " + cpnErr.message, "error");
      }
    }
  };

  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(
    () => {
      try {
        const stored = localStorage.getItem("orbi_read_notifications");
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
  );
  const saveReadNotificationIds = (ids: string[]) => {
    setReadNotificationIds(ids);
    localStorage.setItem("orbi_read_notifications", JSON.stringify(ids));
  };

  const [showAIChatDrawer, setShowAIChatDrawer] = useState(false);
  const [imageUploadCount, setImageUploadCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("orbi_image_upload_count") || "0");
    } catch {
      return 0;
    }
  });
  const [showImageLimitModal, setShowImageLimitModal] = useState(false);

  const getInitialUserId = (): string => {
    try {
      const saved = localStorage.getItem("Orbishop_customers");
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id) return u.id;
      }
      // Check if we have a persistent unique guest ID
      const savedGuestId = localStorage.getItem("Orbishop_guest_id");
      if (savedGuestId && savedGuestId.startsWith("guest-")) {
        return savedGuestId;
      }
      const newGuestId = `guest-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("Orbishop_guest_id", newGuestId);
      return newGuestId;
    } catch {}
    return "guest";
  };

  const [isTransferredToLive, setIsTransferredToLive] = useState<boolean>(
    () => {
      try {
        const initUid = getInitialUserId();
        const lockUntil = Number(
          localStorage.getItem(`orbi_ai_lock_until_${initUid}`) || "0",
        );
        if (lockUntil && Date.now() < lockUntil) {
          return true;
        }
        if (lockUntil && Date.now() >= lockUntil) {
          localStorage.removeItem(`orbi_ai_lock_until_${initUid}`);
          localStorage.setItem(`orbi_ai_transferred_${initUid}`, "false");
          return false;
        }
        return (
          localStorage.getItem(`orbi_ai_transferred_${initUid}`) === "true"
        );
      } catch {
        return false;
      }
    },
  );

  const [aiLockTimeRemaining, setAiLockTimeRemaining] = useState<string>("");

  const checkAIResetQuotaStatus = async () => {
    const userId = activeUser ? activeUser.id : getInitialUserId();
    if (!userId || userId === "guest") return;
    try {
      const res = await fetch(
        `/api/v1/ai/status?customerId=${encodeURIComponent(userId)}`,
      );
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return;
      const data = await res.json();
      if (data.success) {
        const lastCheckedKey = `orbi_ai_last_reset_checked_${userId}`;
        const lastChecked = Number(localStorage.getItem(lastCheckedKey) || "0");
        if (data.resetAt && data.resetAt > lastChecked) {
          // Reset quota!
          setAIChatHistory([]);
          localStorage.setItem(`orbi_ai_chat_history_${userId}`, "[]");
          setIsTransferredToLive(false);
          localStorage.setItem(`orbi_ai_transferred_${userId}`, "false");
          localStorage.removeItem(`orbi_ai_lock_until_${userId}`);
          localStorage.setItem(lastCheckedKey, String(data.resetAt));

          showAlert(
            lang === "sw"
              ? "🎉 Habari njema! Mfumo au mfanyakazi wetu ameweka upya kikomo chako cha maswali ya AI. Sasa unaweza kuendelea kuuliza maswali sasa!"
              : "🎉 Excellent news! Support has manually reset your AI assistant chat quota. You can now resume your conversations with Orbi AI!",
            "success",
          );
        }
      }
    } catch (err) {
      console.warn("AI status verification check failure:", err);
    }
  };

  useEffect(() => {
    if (showAIChatDrawer) {
      checkAIResetQuotaStatus();
    }
  }, [showAIChatDrawer]);

  // Synchronize dynamic AI states on activeUser change (login / logout)
  useEffect(() => {
    const userId = activeUser ? activeUser.id : getInitialUserId();
    try {
      // 1. Load History
      const storedHist = localStorage.getItem(`orbi_ai_chat_history_${userId}`);
      const hist = storedHist ? JSON.parse(storedHist) : [];
      setAIChatHistory(Array.isArray(hist) ? hist : []);

      // 2. Load transferred and lock state
      const lockUntil = Number(
        localStorage.getItem(`orbi_ai_lock_until_${userId}`) || "0",
      );
      if (lockUntil && Date.now() < lockUntil) {
        setIsTransferredToLive(true);
      } else {
        if (lockUntil && Date.now() >= lockUntil) {
          localStorage.removeItem(`orbi_ai_lock_until_${userId}`);
          localStorage.setItem(`orbi_ai_transferred_${userId}`, "false");
        }
        const isTransferred =
          localStorage.getItem(`orbi_ai_transferred_${userId}`) === "true";
        setIsTransferredToLive(isTransferred);
      }

      // Check reset status on mount
      checkAIResetQuotaStatus();

      // 3. Image upload count
      const uploadCount = Number(
        localStorage.getItem(`orbi_image_upload_count_${userId}`) || "0",
      );
      setImageUploadCount(uploadCount);
    } catch (e) {
      console.error("AI dynamic state synchronization error:", e);
    }
  }, [activeUser]);

  useEffect(() => {
    const updateLockTimer = () => {
      try {
        const userId = activeUser ? activeUser.id : getInitialUserId();
        const lockUntilVal = localStorage.getItem(
          `orbi_ai_lock_until_${userId}`,
        );
        if (!lockUntilVal) {
          setAiLockTimeRemaining("");
          return;
        }
        const lockUntil = Number(lockUntilVal);
        const now = Date.now();
        if (now < lockUntil) {
          const remainingSeconds = Math.max(
            0,
            Math.ceil((lockUntil - now) / 1000),
          );
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
          setAiLockTimeRemaining(formatted);
          if (!isTransferredToLive) {
            setIsTransferredToLive(true);
            localStorage.setItem(`orbi_ai_transferred_${userId}`, "true");
          }
        } else {
          // Lock expired!
          setAiLockTimeRemaining("");
          setIsTransferredToLive(false);
          localStorage.setItem(`orbi_ai_transferred_${userId}`, "false");
          localStorage.removeItem(`orbi_ai_lock_until_${userId}`);
          // Clear history so they start fresh after 30 min lockout
          setAIChatHistory([]);
          localStorage.setItem(`orbi_ai_chat_history_${userId}`, "[]");
        }
      } catch (err) {
        console.error("Lock timer check error:", err);
      }
    };

    updateLockTimer();
    const interval = setInterval(updateLockTimer, 1000);
    return () => clearInterval(interval);
  }, [activeUser, isTransferredToLive]);

  const [aiChatHistory, setAIChatHistory] = useState<
    {
      role: "user" | "model";
      text: string;
      image?: { data: string; mimeType: string };
    }[]
  >(() => {
    try {
      const initUid = getInitialUserId();
      const stored = localStorage.getItem(`orbi_ai_chat_history_${initUid}`);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [aiInputMessage, setAIInputMessage] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSelectedImage, setAiSelectedImage] = useState<{
    data: string;
    mimeType: string;
    filename: string;
  } | null>(null);

  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualSearchError, setVisualSearchError] = useState("");

  const handleVisualSearchImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (imageUploadCount >= 3) {
      setShowImageLimitModal(true);
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVisualSearching(true);
    setVisualSearchError("");
    const userId = activeUser ? activeUser.id : getInitialUserId();

    try {
      // 1. Increment image search quota count
      const nextCount = imageUploadCount + 1;
      setImageUploadCount(nextCount);
      localStorage.setItem(
        `orbi_image_upload_count_${userId}`,
        String(nextCount),
      );

      // 2. Try local QR/Barcode scanning first (fast, offline, client-side)
      let hiddenEl = document.getElementById("hidden-qr-reader-element");
      if (!hiddenEl) {
        hiddenEl = document.createElement("div");
        hiddenEl.id = "hidden-qr-reader-element";
        hiddenEl.style.display = "none";
        document.body.appendChild(hiddenEl);
      }

      const html5QrCode = new Html5Qrcode("hidden-qr-reader-element");
      try {
        const decodedText = await html5QrCode.scanFile(file, false);
        console.log("QR Code read successfully offline:", decodedText);
        // Play beep sound for successful scan!
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.frequency.value = 1000;
          gain.gain.setValueAtTime(0.15, context.currentTime);
          osc.start();
          osc.stop(context.currentTime + 0.12);
        } catch (audioErr) {
          console.warn("Audio context not allowed yet:", audioErr);
        }

        // Apply search immediately and return
        applySearch(decodedText);
        setIsVisualSearching(false);
        return;
      } catch (qrErr) {
        console.log("No QR/Barcode found offline, falling back to Gemini Vision API...", qrErr);
      }

      // 3. If local QR scan fails, convert to base64 and call our Vision AI visual-search endpoint
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch("/api/v1/ai/visual-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data }),
          });
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) throw new Error("Server returned non-JSON response");
          const data = await res.json();
          if (data.success && data.result) {
            console.log("Visual search success:", data.detectedType, data.result);
            // Apply search automatically
            applySearch(data.result);
          } else {
            setVisualSearchError(lang === "sw" ? "Imeshindwa kutambua picha" : "Failed to recognize product in image");
          }
        } catch (apiErr: any) {
          console.error("Visual search API error:", apiErr);
          setVisualSearchError(lang === "sw" ? "Tatizo la mtandao wakati wa kutafuta" : "Network error during visual search");
        } finally {
          setIsVisualSearching(false);
        }
      };
      reader.onerror = () => {
        setVisualSearchError(lang === "sw" ? "Imeshindwa kusoma faili ya picha" : "Failed to read image file");
        setIsVisualSearching(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("General error in visual search image change:", err);
      setVisualSearchError(err.message || "Error");
      setIsVisualSearching(false);
    } finally {
      e.target.value = "";
    }
  };

  const handleAIImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (imageUploadCount >= 3) {
      setShowImageLimitModal(true);
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setIsAILoading(true);
      reader.onloadend = () => {
        const newImg = {
          data: reader.result as string,
          mimeType: file.type,
          filename: file.name,
        };
        setAiSelectedImage(newImg);
        // Auto-open AI visual guidance chat drawer when an image is selected from top bar or drawer input
        setShowAIChatDrawer(true);
        setIsAILoading(false);
        // Delay to allow state/drawer to mount
        setTimeout(() => sendAIChatMessage("", newImg), 100);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const sendAIChatMessage = async (
    messageText: string,
    providedImage?: { data: string; mimeType: string },
  ) => {
    if (isTransferredToLive) return;
    const finalImage = providedImage || aiSelectedImage;
    if (!messageText.trim() && !finalImage) return;

    const userId = activeUser ? activeUser.id : getInitialUserId();

    const userMsg = {
      role: "user" as const,
      text:
        messageText ||
        (lang === "sw"
          ? "Tafadhali nisaidie kuona picha hii"
          : "Please explain or find matches for this image"),
      image: finalImage
        ? { data: finalImage.data, mimeType: finalImage.mimeType }
        : undefined,
    };

    const updatedHistory = [...aiChatHistory, userMsg];
    setAIChatHistory(updatedHistory);
    localStorage.setItem(
      `orbi_ai_chat_history_${userId}`,
      JSON.stringify(updatedHistory),
    );
    setAIInputMessage("");

    const imagePayload = finalImage
      ? { data: finalImage.data, mimeType: finalImage.mimeType }
      : null;

    // If we are searching with an image, increment the upload search counter to prevent token abuse
    if (imagePayload) {
      const nextCount = imageUploadCount + 1;
      setImageUploadCount(nextCount);
      localStorage.setItem(
        `orbi_image_upload_count_${userId}`,
        String(nextCount),
      );
    }

    setAiSelectedImage(null);
    setIsAILoading(true);

    try {
      const response = await fetch("/api/v1/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: aiChatHistory,
          image: imagePayload,
          customer: activeUser
            ? {
                id: activeUser.id,
                name: activeUser.name,
                phone: activeUser.phone,
                email: activeUser.email,
              }
            : null,
        }),
      });
      const ct = response.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
         throw new Error("Sorry, the AI service is temporarily unavailable.");
      }
      const result = await response.json();
      if (result.success) {
        const modelMsg = { role: "model" as const, text: result.reply };
        const finalHistory = [...updatedHistory, modelMsg];
        setAIChatHistory(finalHistory);
        localStorage.setItem(
          `orbi_ai_chat_history_${userId}`,
          JSON.stringify(finalHistory),
        );

        if (result.transferToLiveAgent) {
          setIsTransferredToLive(true);
          localStorage.setItem(`orbi_ai_transferred_${userId}`, "true");
          // Lock for 30 minutes
          const lockTime = Date.now() + 30 * 60 * 1000;
          localStorage.setItem(
            `orbi_ai_lock_until_${userId}`,
            String(lockTime),
          );
        }
      } else {
        const errorMsg = {
          role: "model" as const,
          text: result.reply || "Error contacting AI.",
        };
        const finalHistory = [...updatedHistory, errorMsg];
        setAIChatHistory(finalHistory);
        localStorage.setItem(
          `orbi_ai_chat_history_${userId}`,
          JSON.stringify(finalHistory),
        );
      }
    } catch (err: any) {
      console.error(err);
      const fallbackMsg = {
        role: "model" as const,
        text: "Samahani, mtandao ulikuwa na changamoto kidogo. Tafadhali jaribu tena baada ya sekunde kadhaa.",
      };
      const finalHistory = [...updatedHistory, fallbackMsg];
      setAIChatHistory(finalHistory);
      localStorage.setItem(
        `orbi_ai_chat_history_${userId}`,
        JSON.stringify(finalHistory),
      );
    } finally {
      setIsAILoading(false);
    }
  };

  const notifications = useMemo(() => {
    if (!activeUser) return [];
    const list: any[] = [];

    // 1. Order Status Updates
    const userOrders = orders.filter(
      (o) =>
        o.customerId === activeUser.id ||
        o.customer_id === activeUser.id ||
        (o.customerDetails?.phone === activeUser.phone &&
          activeUser.phone !== ""),
    );

    userOrders.forEach((o) => {
      const statusUpper = (o.status || "CREATED").toUpperCase();
      if (statusUpper !== "CREATED" && statusUpper !== "AWAITING_PAYMENT") {
        let statusTextEn = "Confirmed";
        let statusTextSw = "Imethibitishwa";
        if (statusUpper === "SHIPPED") {
          statusTextEn = "Shipped";
          statusTextSw = "Imesafirishwa";
        } else if (
          statusUpper === "DELIVERED" ||
          statusUpper === "BUYER_CONFIRMED" ||
          statusUpper === "RELEASED"
        ) {
          statusTextEn = "Delivered";
          statusTextSw = "Imepokelewa";
        } else if (statusUpper === "CANCELLED" || statusUpper === "REFUNDED") {
          statusTextEn = "Cancelled";
          statusTextSw = "Imebatilishwa";
        } else if (statusUpper === "DISPUTED") {
          statusTextEn = "Disputed";
          statusTextSw = "Mgogoro";
        }

        list.push({
          id: `order-${o.id}-${o.status}`,
          type: "order",
          title: `Order #${formatOrderNumber(o)}: ${statusTextEn}!`,
          titleSw: `Oda #${formatOrderNumber(o)}: ${statusTextSw}!`,
          desc: `Your order was marked as ${o.status}.`,
          descSw: `Oda yako ya jumla ya ${formatCurrency(Number(o.total))} imewekwa hali ya ${statusTextSw}.`,
          date: o.date,
          originalId: o.id,
        });
      }
    });

    // 2. Newly Approved Coupons/Discounts
    coupons.forEach((c) => {
      if (c.active && !c.isUsed) {
        list.push({
          id: `coupon-${c.id || c.code}`,
          type: "discount",
          title: `New Discount Code: ${c.code}!`,
          titleSw: `Kuponi Mpya ya Punguzo: ${c.code}!`,
          desc: `Get ${c.discountPercentage}% discount expiring soon!`,
          descSw: `Pata punguzo la ${c.discountPercentage}% kwa ajili ya kuponi inayokwisha tarehe ${c.expiresAt.slice(0, 10)}!`,
          date: new Date(c.expiresAt).getTime() - 24 * 60 * 60 * 1000,
          originalId: c.code,
        });
      }
    });

    // 3. Customer-service replies
    guestMessages.forEach((m) => {
      if (m.adminReply) {
        list.push({
          id: `reply-${m.id}`,
          type: "message",
          title: `Support Agent Replied!`,
          titleSw: `Jibu la Huduma kwa Wateja!`,
          desc: `Replied: "${m.adminReply.slice(0, 35)}..."`,
          descSw: `Mhudumu amejibu: "${m.adminReply.slice(0, 35)}..."`,
          date: m.date,
          originalId: m.id,
        });
      }
    });

    return list.sort((a, b) => b.date - a.date);
  }, [activeUser, orders, coupons, guestMessages]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !readNotificationIds.includes(n.id))
      .length;
  }, [notifications, readNotificationIds]);

  const loadData = React.useCallback(async (isBackground: boolean = false) => {
    try {
      if (!isBackground) setIsLoading(true);

      // Products are the only blocking storefront dependency. Campaigns, banners,
      // reviews, and ads must never hold a product page hostage on slow networks.
      const allProducts = await withTimeout(
        db.getProducts(),
        STOREFRONT_PRIMARY_TIMEOUT_MS,
        "Products",
      );
      const visibleProducts = allProducts.filter((p: any) => p.visible !== false);
      setProducts(visibleProducts);

      // Fetch dynamic wholesale deals from the backend
      db.getWholesaleDeals()
        .then((deals) => {
          setWholesaleDeals(deals);
        })
        .catch((err) => {
          console.warn("[Wholesale Automation] Failed to load wholesale deals:", err);
        });

      if (!isBackground) {
        const requestedProductId = getProductIdFromLocation();
        if (requestedProductId) {
          const requestedProduct = visibleProducts.find(
            (p: any) => p.id === requestedProductId || p.legacy_id === requestedProductId,
          );
          if (requestedProduct) {
            setSelectedProduct(requestedProduct);
          }
        }
      }

      if (!isBackground) setIsLoading(false);

      // Optional visual storefront data loads progressively after the product list.
      Promise.allSettled([
        withTimeout(db.getPromotions(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Promotions"),
        withTimeout(db.getPromotionalBanners(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Promotional banners"),
      ]).then(([promosRes, bannersRes]) => {
        let visiblePromos: any[] = [];
        if (promosRes.status === 'fulfilled') {
          const allPromos = promosRes.value;
        visiblePromos = allPromos.filter((p: any) => p.visible);
        setPromos(visiblePromos);
      }

      if (bannersRes.status === 'fulfilled') {
        const activeBanners = bannersRes.value.filter((b: any) => b.visible);
        setPromotionalBanners(activeBanners);
      }

      if (!isBackground) {
        const weights: Record<string, number> = {};
        visibleProducts.forEach((p: any) => {
          const combined = `${visitorId}_${p.id}`;
          let hash = 0;
          for (let i = 0; i < combined.length; i++) {
            hash = (hash << 5) - hash + combined.charCodeAt(i);
            hash |= 0;
          }
          weights[p.id] = Math.abs(hash % 1000000) / 1000000;
        });
        visiblePromos.forEach((pr: any) => {
          const combined = `${visitorId}_${pr.id}`;
          let hash = 0;
          for (let i = 0; i < combined.length; i++) {
            hash = (hash << 5) - hash + combined.charCodeAt(i);
            hash |= 0;
          }
          weights[pr.id] = Math.abs(hash % 1000000) / 1000000;
        });
        setShuffleWeights(weights);
      }
      });

      // Fetch secondary data without blocking the UI
      Promise.allSettled([
        activeUser ? withTimeout(db.getOrders(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Orders") : Promise.resolve([]),
        withTimeout(db.getReviews(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Reviews"),
        withTimeout(db.getCoupons(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Coupons"),
        withTimeout(db.getNiches(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Niches"),
        withTimeout(db.getSellers(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Sellers"),
        withTimeout(db.getAds(), STOREFRONT_OPTIONAL_TIMEOUT_MS, "Ads")
      ]).then(([ordersRes, reviewsRes, couponsRes, nichesRes, sellersRes, adsRes]) => {
        // 4. Process Orders
        if (ordersRes.status === 'fulfilled') {
          setOrders(Array.isArray(ordersRes.value) ? ordersRes.value : []);
        }

        // 5. Process Reviews
        if (reviewsRes.status === 'fulfilled') {
          const revsData = reviewsRes.value;
          const mappedRevs: Record<string, any[]> = {};
          if (revsData && Array.isArray(revsData)) {
            revsData.forEach((r: any) => {
              if (r.productId) {
                if (!mappedRevs[r.productId]) mappedRevs[r.productId] = [];
                mappedRevs[r.productId].push({
                  id: r.id,
                  userName: r.userName,
                  rating: r.rating,
                  comment: r.comment,
                  createdAt: r.createdAt,
                });
              }
            });
          }
          setAllReviews(mappedRevs);
        }

        // 7. Process Coupons, Niches, Sellers, Ads
        if (couponsRes.status === 'fulfilled') {
          setCoupons(Array.isArray(couponsRes.value) ? couponsRes.value : []);
        }

        if (nichesRes.status === 'fulfilled') {
          setSystemNiches(Array.isArray(nichesRes.value) ? nichesRes.value : []);
        }

        if (sellersRes.status === 'fulfilled') {
          const allSellers = Array.isArray(sellersRes.value) ? sellersRes.value : [];
          setSellers(allSellers);
          
          if (!isBackground) {
            const params = new URLSearchParams(window.location.search);
            const sellerId = params.get("seller");
            if (sellerId) {
              const seller = allSellers.find((s: any) => s.id === sellerId);
              if (seller) setViewSeller(seller);
            }
          }
        }

        if (adsRes.status === 'fulfilled') {
          setMarketplaceAds(Array.isArray(adsRes.value) ? adsRes.value : []);
        }

        if (!isBackground) {
          const params = new URLSearchParams(window.location.search);

          const orderIdParam = params.get("order") || params.get("order_id");
          if (orderIdParam) {
            setShowTrackOrder(true);
          }

          const invData = params.get("invoice");
          if (invData) {
            try {
              const decoded = JSON.parse(decodeURIComponent(atob(invData)));
              if (decoded && decoded.id) {
                setViewInvoice(decoded);
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname,
                );
              }
            } catch (err) {
              console.error("Failed to load invoice from URL", err);
            }
          }
        }
      });
    } catch (error: any) {
      console.warn(
        "[loadData] Failed to retrieve storefront resources, will retry:",
        error.message || error,
      );
      if (!isBackground) setIsLoading(false);
    }
  }, [visitorId, activeUser?.id]);

  useEffect(() => {
    loadData();

    // Replaced direct Supabase DB WebSocket with safe API-based polling
    const interval = setInterval(() => loadData(true), 15000); // reduced polling frequency
    return () => {
      clearInterval(interval);
    };
  }, [loadData]);

  useEffect(() => {
    const setupUser = async () => {
      const savedUser = localStorage.getItem("Orbishop_customers");
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setActiveUser(u);
          if (u.preferredLanguage || u.preferred_language) {
            const prefL = u.preferredLanguage || u.preferred_language;
            if (prefL === "sw" || prefL === "en") {
              setLang(prefL);
            }
          }
        } catch (e) {
          localStorage.removeItem("Orbishop_customers");
        }
      }
    };
    setupUser();
  }, []);

  useEffect(() => {
    if (!activeUser) {
      setGuestMessages([]);
      return;
    }
    const fetchGuestMsgs = async () => {
      try {
        const all = await db.getMessages();
        const userMsgs = all.filter((m) => {
          const isSameCustomer = m.customerId === activeUser.id;
          if (isSameCustomer) return true;

          // Phone matching
          if (!m.phone || !activeUser.phone) return false;
          const cp1 = m.phone.replace(/\D/g, "");
          const cp2 = activeUser.phone.replace(/\D/g, "");
          if (!cp1 || !cp2) return false;
          const len1 = cp1.length;
          const len2 = cp2.length;
          if (len1 >= 9 && len2 >= 9) {
            return cp1.slice(-9) === cp2.slice(-9);
          }
          return cp1 === cp2;
        });
        setGuestMessages(userMsgs);
      } catch (err) {
        console.warn("Error loading customer messages in header:", err);
      }
    };
    fetchGuestMsgs();

    const interval = setInterval(fetchGuestMsgs, 15000); // reduced polling frequency
    return () => {
      clearInterval(interval);
    };
  }, [activeUser]);

  const unreadCount = useMemo(() => {
    if (!activeUser || guestMessages.length === 0) return 0;
    return guestMessages.filter((m) => {
      // Message is from admin if it is admin initiated OR has an admin reply
      const isFromAdmin =
        m.message === "Ujumbe kutoka Orbi Shop" ||
        m.message === "Admin initiated dummy" ||
        m.message === "Ujumbe toka kwa Admin" ||
        m.message === "Ujumbe toka kwa Orbi Shop" ||
        !!m.adminReply;
      return isFromAdmin && !readReplyIds.includes(m.id);
    }).length;
  }, [guestMessages, activeUser, readReplyIds]);

  const logoutClient = async () => {
    localStorage.removeItem("Orbishop_customers");
    setActiveUser(null);
    try {
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Error signing out from server during logout:", e);
    }
  };

  useEffect(() => {
    if (!activeUser) return;

    const verifyUserStatus = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res && res.success === false) {
          if (res.error?.includes("frozen") || res.error?.includes("zuiwa") || res.error?.includes("blocked")) {
            showAlert(res.error, "error");
          }
          logoutClient();
        } else if (res && res.customer) {
          if (res.customer.status === "frozen" || res.customer.status === "blocked") {
            let parsedReason = res.customer.block_reason || '';
            if (parsedReason && parsedReason.startsWith('[')) {
              try {
                const logs = JSON.parse(parsedReason);
                if (Array.isArray(logs) && logs.length > 0) {
                  parsedReason = logs[logs.length - 1].reason || '';
                }
              } catch (e) {}
            }
            const reasonMsg = parsedReason ? ` Sababu (Reason): ${parsedReason}.` : '';
            showAlert(
              lang === "sw"
                ? `Akaunti yako imezuiwa au kufungwa.${reasonMsg} Tafadhali wasiliana na usaidizi kupitia namba +255 764 258 114.`
                : `Your account is frozen or blocked.${reasonMsg} Please contact customer support at +255 764 258 114.`,
              "error"
            );
            logoutClient();
          } else {
            // Check if name, phone, or email changed and update local storage gracefully
            const localUser = {
              ...activeUser,
              name: res.customer.name,
              phone: res.customer.phone || "",
              email: res.customer.email,
              tin: res.customer.tin || "",
              preferredLanguage: res.customer.preferred_language || "sw"
            };
            if (JSON.stringify(localUser) !== JSON.stringify(activeUser)) {
              localStorage.setItem("Orbishop_customers", JSON.stringify(localUser));
              setActiveUser(localUser);
            }
          }
        }
      } catch (err) {
        console.warn("Verification check for user status failed:", err);
      }
    };

    // Verify status on initial load/activeUser identification
    verifyUserStatus();

    // Verify status periodically every 30 seconds
    const interval = setInterval(verifyUserStatus, 30000);
    return () => clearInterval(interval);
  }, [activeUser, lang, showAlert]);

  const niches = [
    { name: "Zote", icon: "Globe" },
    ...(systemNiches.length > 0
      ? systemNiches
      : Array.from(new Set(products.map((p) => p.niche || "Mengineyo"))).map(
          (n) => ({ name: n, icon: "Globe" }),
        )),
  ];

  const [nicheHues, setNicheHues] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("orbi_niche_hues");
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });

  const nicheColorMapData = useMemo(() => {
    const names = niches.map((n) => n.name);
    return generateNicheColorMap(names, nicheHues);
  }, [niches, nicheHues]);

  useEffect(() => {
    const currentKeysCount = Object.keys(nicheHues).length;
    const newKeysCount = Object.keys(nicheColorMapData.updatedHues).length;
    if (newKeysCount !== currentKeysCount) {
      setNicheHues(nicheColorMapData.updatedHues);
      try {
        localStorage.setItem("orbi_niche_hues", JSON.stringify(nicheColorMapData.updatedHues));
      } catch {}
    }
  }, [nicheColorMapData.updatedHues, nicheHues]);

  // Auto-Pilot dynamically derived seller categories
  const dynamicSellerCategories = Array.from(
    new Set(
      sellers
        .filter((s) => s.status !== "frozen")
        .map((s) => {
          const desc = (s.description || "").toLowerCase();
          const name = (s.name || "").toLowerCase();
          if (
            desc.includes("wholesale") ||
            desc.includes("jumla") ||
            name.includes("wholesale")
          ) {
            return "Wholesale";
          }
          return null;
        })
        .filter(Boolean) as string[],
    ),
  );

  // Only show categories that belong to the current niche (or all if 'Zote')
  const categories = [
    "Zote",
    ...Array.from(
      new Set(
        products
          .filter(
            (p) =>
              selectedNiche === "Zote" ||
              (p.niche || "Mengineyo") === selectedNiche,
          )
          .map((p) => p.category),
      ),
    ),
  ];

  const families = useMemo(() => {
    return Array.from(new Set(
      products.map(p => {
        let fam = p.family?.trim();
        if (!fam && p.category) {
          const parts = p.category.split("::");
          if (parts.length >= 3) {
            fam = parts[2]?.trim();
          }
        }
        return fam;
      }).filter(Boolean) as string[]
    ));
  }, [products]);

  const filteredProductsBySeller = useMemo(() => {
    return viewSeller
      ? products.filter((p) => {
          if (viewSeller.id === "00000000-0000-0000-0000-000000000001" || viewSeller.id === "official") {
            return (
              !p.sellerId || p.sellerId === "official" || p.sellerId === "admin" || p.sellerId === "00000000-0000-0000-0000-000000000001"
            );
          }
          return p.sellerId === viewSeller.id;
        })
      : products;
  }, [products, viewSeller]);

  const searchIndex = useMemo(() => {
    return new InvertedIndexSearch(filteredProductsBySeller);
  }, [filteredProductsBySeller]);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { filteredProducts, similarSuggestions, suggestions } = useMemo(() => {
    const searchActive = committedSearch && committedSearch.trim().length > 0;
    const matchedProducts = searchActive
      ? searchIndex.search(committedSearch, expandedKeywords)
      : filteredProductsBySeller;

    const filtered = matchedProducts
      .filter((p) => {
        const matchesNiche =
          selectedNiche === "Zote" ||
          (p.niche || "Mengineyo") === selectedNiche;
        let matchesCat =
          selectedCategory === "Zote" || p.category === selectedCategory;

        if (selectedCategory === "Wholesale" && !matchesCat) {
          const s = sellers.find((s) => s.id === p.sellerId);
          if (s) {
            const desc = (s.description || "").toLowerCase();
            const name = (s.name || "").toLowerCase();
            if (
              desc.includes("wholesale") ||
              desc.includes("jumla") ||
              name.includes("wholesale")
            ) {
              matchesCat = true;
            }
          }
        } else if (selectedCategory === "Pro Sellers" && !matchesCat) {
          const s = sellers.find((s) => s.id === p.sellerId);
          if (s && s.isPro && s.proUntil && s.proUntil > Date.now()) {
            matchesCat = true;
          }
        }

        // Semantic Arrangement Tier matching
        let matchesTier = true;
        if (selectedArrangementTier !== "all") {
          if (p.arrangeTier && p.arrangeTier !== "all") {
            matchesTier = p.arrangeTier === selectedArrangementTier;
          } else if (selectedArrangementTier === "luxury") {
            matchesTier =
              p.price >= 50000 ||
              p.name.toLowerCase().includes("luxury") ||
              p.name.toLowerCase().includes("royal") ||
              (p.description && p.description.toLowerCase().includes("luxury"));
          } else if (selectedArrangementTier === "premium") {
            matchesTier =
              (p.price >= 20000 && p.price < 50000) ||
              p.name.toLowerCase().includes("premium") ||
              (p.description &&
                p.description.toLowerCase().includes("premium"));
          } else if (selectedArrangementTier === "standard") {
            matchesTier =
              p.price < 20000 ||
              p.name.toLowerCase().includes("essential") ||
              p.name.toLowerCase().includes("basic");
          }
        }

        // Semantic Arrangement Vibe matching
        let matchesVibe = true;
        if (selectedArrangementVibe !== "all") {
          if (p.vibe && p.vibe !== "all") {
            matchesVibe = p.vibe === selectedArrangementVibe;
          } else {
            const descLower = p.description ? p.description.toLowerCase() : "";
            const nameLower = p.name.toLowerCase();
            if (selectedArrangementVibe === "romance") {
              matchesVibe =
                nameLower.includes("romance") ||
                nameLower.includes("love") ||
                nameLower.includes("red") ||
                nameLower.includes("rose") ||
                descLower.includes("romance") ||
                descLower.includes("rose") ||
                descLower.includes("love");
            } else if (selectedArrangementVibe === "serenity") {
              matchesVibe =
                nameLower.includes("pastel") ||
                nameLower.includes("serenity") ||
                nameLower.includes("pink") ||
                nameLower.includes("white") ||
                descLower.includes("pastel") ||
                descLower.includes("calm") ||
                descLower.includes("white");
            } else if (
              selectedArrangementVibe === "amber" ||
              selectedArrangementVibe === "sunshine"
            ) {
              matchesVibe =
                nameLower.includes("amber") ||
                nameLower.includes("sunset") ||
                nameLower.includes("warm") ||
                nameLower.includes("orange") ||
                nameLower.includes("yellow") ||
                descLower.includes("sunset") ||
                descLower.includes("warm") ||
                descLower.includes("gold") ||
                nameLower.includes("sunshine");
            } else if (
              selectedArrangementVibe === "emerald" ||
              selectedArrangementVibe === "nature"
            ) {
              matchesVibe =
                nameLower.includes("emerald") ||
                nameLower.includes("wealth") ||
                nameLower.includes("money") ||
                nameLower.includes("green") ||
                descLower.includes("emerald") ||
                descLower.includes("wealth") ||
                descLower.includes("rich") ||
                nameLower.includes("nature");
            } else if (selectedArrangementVibe === "minimalist") {
              matchesVibe =
                nameLower.includes("minimalist") ||
                nameLower.includes("sleek") ||
                nameLower.includes("modern") ||
                nameLower.includes("clean") ||
                descLower.includes("minimal") ||
                descLower.includes("sleek") ||
                descLower.includes("modern");
            } else if (selectedArrangementVibe === "mystery") {
              matchesVibe =
                nameLower.includes("mystery") ||
                nameLower.includes("purple") ||
                nameLower.includes("orchid") ||
                descLower.includes("enchanted");
            }
          }
        }

        // Semantic Arrangement Wrap matching
        let matchesWrap = true;
        if (selectedArrangementWrap !== "all") {
          if (p.presentationStyle && p.presentationStyle !== "all") {
            matchesWrap = p.presentationStyle === selectedArrangementWrap;
          } else {
            const descLower = p.description ? p.description.toLowerCase() : "";
            const nameLower = p.name.toLowerCase();
            if (selectedArrangementWrap === "box") {
              matchesWrap =
                nameLower.includes("box") ||
                nameLower.includes("kasha") ||
                descLower.includes("box") ||
                descLower.includes("kasha");
            } else if (selectedArrangementWrap === "wrap") {
              matchesWrap =
                nameLower.includes("wrap") ||
                nameLower.includes("paper") ||
                descLower.includes("wrap") ||
                descLower.includes("paper");
            } else if (selectedArrangementWrap === "basket") {
              matchesWrap =
                nameLower.includes("basket") ||
                nameLower.includes("hamper") ||
                descLower.includes("basket") ||
                descLower.includes("hamper") ||
                descLower.includes("basket");
            } else if (
              selectedArrangementWrap === "acrylic" ||
              selectedArrangementWrap === "glass"
            ) {
              matchesWrap =
                nameLower.includes("acrylic") ||
                nameLower.includes("crystal") ||
                nameLower.includes("cube") ||
                nameLower.includes("glass") ||
                descLower.includes("vase") ||
                descLower.includes("glass");
            }
          }
        }

        return (
          matchesNiche &&
          matchesCat &&
          matchesTier &&
          matchesVibe &&
          matchesWrap
        );
      })
      .sort((a, b) => {
        // If search query is active, sort strictly by name exact matches first, then category, then niche
        if (committedSearch && committedSearch.trim().length > 0) {
          const scoreS_A = BilingualSearchEngine.getRelevanceScore(
            a,
            committedSearch,
            expandedKeywords,
          );
          const scoreS_B = BilingualSearchEngine.getRelevanceScore(
            b,
            committedSearch,
            expandedKeywords,
          );
          if (scoreS_A !== scoreS_B) {
            return scoreS_B - scoreS_A;
          }
        }

        const aSeller = sellers.find((s) => s.id === a.sellerId);
        const bSeller = sellers.find((s) => s.id === b.sellerId);

        // Core business logic priority score calculator:
        // Combined scoring system avoiding binary blocks, so all signals work together fluidly.
        const getPriorityScore = (p: Product, s: SellerProfile | undefined) => {
          let score = 0;

          // 1. Explicitly Liked Product (Maximum individual signal)
          if (likedProductIds.includes(p.id)) {
            score += 100000;
          }

          // 2. Active Subscription/Paid Plan boost (e.g. Standard, Elite, Premium plans)
          const hasPaidPlan =
            s?.activePlanId && s.activePlanId.toLowerCase() !== "free";
          if (hasPaidPlan) {
            score += 40000;
          }

          // 3. Pro Seller status boost
          const isPro = s?.isPro && s?.proUntil && s.proUntil > Date.now();
          if (isPro) {
            score += 25000;
          }

          // 4. Visitor-specific dynamic shuffle boost (to ensure all products reach different visitors fairly)
          const weight = shuffleWeights[p.id] || 0.5;
          score += weight * 4000;

          // 5. Intelligent AI Shopkeeper Preference Matching (Families, Niches, Categories, Keywords)
          if (p.family && userPreferenceProfile.families.has(p.family.toLowerCase())) {
            score += 35000;
          }
          if (p.niche && userPreferenceProfile.niches.has(p.niche.toLowerCase())) {
            score += 20000;
          }
          if (p.category && userPreferenceProfile.categories.has(p.category.toLowerCase())) {
            score += 15000;
          }
          let keywordMatchCount = 0;
          userPreferenceProfile.keywords.forEach((kw) => {
             if (p.name.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)) {
                 keywordMatchCount++;
             }
          });
          score += keywordMatchCount * 5000;

          // 5. Promoted product tag matching (promo/promoted/trend/recommend/vip)
          const isPromoted =
            p.tags &&
            p.tags.some((t) => {
              const tLower = t.toLowerCase();
              return (
                tLower.includes("promoted") ||
                tLower.includes("promo") ||
                tLower.includes("trend") ||
                tLower.includes("recommend") ||
                tLower.includes("vip")
              );
            });
          if (isPromoted) {
            score += 15000;
          }

          // 6. Legacy tracking history metrics (categories / views)
          const catPref = prefs?.categories?.[p.category] || 0;
          const viewPref = prefs?.views?.[p.id] || 0;
          score += catPref * 100 + viewPref * 250;

          return score;
        };

        const scoreA = getPriorityScore(a, aSeller);
        const scoreB = getPriorityScore(b, bSeller);

        // Explicit Sort Orders:
        // Respect standard mathematical parameters. Use business priority ONLY to break equal ties.
        if (sortOrder === "asc") {
          if (a.price !== b.price) {
            return a.price - b.price;
          }
          return scoreB - scoreA; // tie-breaker
        }
        if (sortOrder === "desc") {
          if (a.price !== b.price) {
            return b.price - a.price;
          }
          return scoreB - scoreA; // tie-breaker
        }
        if (sortOrder === "newest") {
          if (a.createdAt !== b.createdAt) {
            return b.createdAt - a.createdAt;
          }
          return scoreB - scoreA; // tie-breaker
        }
        if (sortOrder === "popular") {
          const popularityA =
            (salesCounts[a.id] || 0) * 10 + (prefs?.views?.[a.id] || 0);
          const popularityB =
            (salesCounts[b.id] || 0) * 10 + (prefs?.views?.[b.id] || 0);
          if (popularityA !== popularityB) {
            return popularityB - popularityA;
          }
          return scoreB - scoreA; // tie-breaker
        }

        // Default Sort Order:
        // Sophisticated priority score ranking is the main driver
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        // Absolute fallback random weight to maintain server stability
        const wA = shuffleWeights[a.id] || 0.5;
        const wB = shuffleWeights[b.id] || 0.5;
        return wA - wB;
      });

    let relSugg: Product[] = [];
    if (
      filtered.length === 0 &&
      committedSearch &&
      committedSearch.trim().length > 0
    ) {
      const relaxed = matchedProducts
        .map((p) => ({
          p,
          score: BilingualSearchEngine.getRelevanceScore(
            p,
            committedSearch,
            expandedKeywords,
          ),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.p);
      relSugg = relaxed.slice(0, 12);
    }

    let suggestList: Product[] = [];
    if (debouncedSearch.length > 1) {
      const suggestMatched = searchIndex.search(
        debouncedSearch,
        expandedKeywords,
      );
      suggestList = suggestMatched
        .sort((a, b) => {
          const aSeller = sellers.find((s) => s.id === a.sellerId);
          const bSeller = sellers.find((s) => s.id === b.sellerId);

          const getSuggestScore = (
            p: Product,
            s: SellerProfile | undefined,
          ) => {
            let score = 0;
            if (likedProductIds.includes(p.id)) score += 100000;

            const hasPaidPlan =
              s?.activePlanId && s.activePlanId.toLowerCase() !== "free";
            if (hasPaidPlan) score += 40000;

            const isPro = s?.isPro && s?.proUntil && s.proUntil > Date.now();
            if (isPro) score += 25000;

            if (p.niche && userPreferenceProfile.niches.has(p.niche.toLowerCase())) {
              score += 20000;
            }
            if (p.category && userPreferenceProfile.categories.has(p.category.toLowerCase())) {
              score += 15000;
            }
            let kwMatches = 0;
            userPreferenceProfile.keywords.forEach((kw) => {
               if (p.name.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)) {
                   kwMatches++;
               }
            });
            score += kwMatches * 5000;

            return score;
          };

          const scoreA = getSuggestScore(a, aSeller);
          const scoreB = getSuggestScore(b, bSeller);

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }

          return (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0);
        })
        .slice(0, 5);
    }

    return { 
      filteredProducts: filtered, 
      similarSuggestions: relSugg, 
      suggestions: suggestList 
    };
  }, [
    debouncedSearch,
    committedSearch,
    products,
    selectedNiche,
    selectedCategory,
    sortOrder,
    orders,
    salesCounts,
    viewSeller,
    filteredProductsBySeller,
    sellers,
    shuffleWeights,
    selectedArrangementTier,
    selectedArrangementVibe,
    selectedArrangementWrap,
    searchIndex,
    expandedKeywords,
    likedProductIds,
    userPreferenceProfile,
    prefs
  ]);
  const adPlacementIndex = useMemo(() => {
    if (filteredProducts.length === 0) return -1;
    const hash = hashString(visitorId || "default");

    const possiblePlacements = [6, 8, 10];
    const index = possiblePlacements[hash % possiblePlacements.length];

    if (filteredProducts.length <= index) {
      return filteredProducts.length > 1
        ? Math.floor(filteredProducts.length / 2)
        : 1;
    }

    return index;
  }, [filteredProducts.length, visitorId]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setDebouncedSearch("");
      setCommittedSearch("");
      setExpandedKeywords([]);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const applySearch = (term: string) => {
    const trimmed = term.trim();
    setSearch(trimmed);
    setCommittedSearch(trimmed);
    setShowSuggestions(false);

    if (trimmed) {
      try {
        const historyData = localStorage.getItem("orbi_user_search_history");
        let historyList: any[] = historyData ? JSON.parse(historyData) : [];
        if (!Array.isArray(historyList)) historyList = [];

        // Filter out same term (case insensitive)
        historyList = historyList.filter((item) => {
          if (!item) return false;
          const itemTerm = typeof item === "string" ? item : item.term;
          return itemTerm && itemTerm.toLowerCase() !== trimmed.toLowerCase();
        });

        // Prepend new search item with timestamp
        historyList.unshift({ term: trimmed, timestamp: Date.now() });
        historyList = historyList.slice(0, 15); // Keep up to 15 items for good grouping

        localStorage.setItem(
          "orbi_user_search_history",
          JSON.stringify(historyList),
        );

        const mappedList: SearchHistoryItem[] = historyList.map((item) => {
          if (typeof item === "string") {
            return { term: item, timestamp: Date.now() };
          }
          return {
            term: item.term,
            timestamp: typeof item.timestamp === "number" ? item.timestamp : Date.now(),
          };
        });

        setSearchHistory(mappedList);
      } catch (e) {
        console.error("Failed to save search history:", e);
      }
    }
  };

  const clearSearchHistory = () => {
    try {
      localStorage.removeItem("orbi_user_search_history");
      setSearchHistory([]);
      setToastMsg(
        lang === "sw"
          ? "Historia ya utafutaji imefutwa kikamilifu!"
          : "Search history has been successfully cleared!"
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setExpandedKeywords([]);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const fetchExpanded = async () => {
      try {
        setIsExpandingSearch(true);
        const sid =
          localStorage.getItem("orbi_visitor_session_id") ||
          (() => {
            const newSid =
              "v-" + Math.random().toString(36).substring(2, 11).toUpperCase();
            localStorage.setItem("orbi_visitor_session_id", newSid);
            return newSid;
          })();
        const devType =
          window.innerWidth < 640
            ? "Mobile"
            : window.innerWidth < 1024
              ? "Tablet"
              : "Desktop";
        let carrier = localStorage.getItem("orbi_visitor_carrier");
        if (!carrier) {
          const carrierList = [
            "Vodacom",
            "Airtel",
            "Halotel",
            "Tigo",
            "TTCL",
            "WiFi",
          ];
          carrier = carrierList[Math.floor(Math.random() * carrierList.length)];
          localStorage.setItem("orbi_visitor_carrier", carrier);
        }
        const res = await fetch(
          `/api/v1/search/expand?q=${encodeURIComponent(debouncedSearch)}&sessionId=${sid}&carrier=${carrier}&device=${devType}`,
          { signal: controller.signal }
        );
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
           throw new Error("Invalid response format");
        }
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.keywords)) {
          setExpandedKeywords(json.keywords);
        } else if (isMounted) {
          // If response not successful, fallback to local dictionary
          const queryLower = debouncedSearch.trim().toLowerCase();
          const fallbackKeywords = BILINGUAL_DICTIONARY[queryLower] || [queryLower];
          setExpandedKeywords(fallbackKeywords);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("AI Search query expansion error:", err);
        // Fallback to local bilingual dictionary expansion to prevent breaking the UX and ensure continuous offline/robust behavior!
        const queryLower = debouncedSearch.trim().toLowerCase();
        const fallbackKeywords = BILINGUAL_DICTIONARY[queryLower] || [queryLower];
        if (isMounted) {
          setExpandedKeywords(fallbackKeywords);
        }
      } finally {
        if (isMounted) {
          setIsExpandingSearch(false);
        }
      }
    };

    const fetchEcosystem = async () => {
      try {
        setIsFetchingEcosystem(true);
        // Map language or device to a country, or default to TZ
        const loc = "TZ"; // In real usage, you might get this from user profile/IP
        const res = await fetch(
          `/api/ecosystem-search?q=${encodeURIComponent(debouncedSearch)}&loc=${loc}`,
          { signal: controller.signal }
        );
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
           throw new Error("Invalid response format");
        }
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setEcosystemResults(json.data);
        } else if (isMounted) {
          setEcosystemResults([]);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("Ecosystem Search error:", err);
        if (isMounted) {
          setEcosystemResults([]);
        }
      } finally {
        if (isMounted) {
          setIsFetchingEcosystem(false);
        }
      }
    };

    fetchExpanded();
    fetchEcosystem();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedSearch]);

  const { popularCategories, popularSearches } = useMemo(() => {
    const catCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const filteredForNiche = products.filter(
      (p) =>
        selectedNiche === "Zote" || (p.niche || "Mengineyo") === selectedNiche,
    );

    filteredForNiche.forEach((p) => {
      const sales = salesCounts[p.id] || 0;
      catCounts[p.category] = (catCounts[p.category] || 0) + sales + 1;
      p.tags.forEach((t) => {
        const tLower = t.trim().toLowerCase();
        if (tLower) {
          tagCounts[tLower] = (tagCounts[tLower] || 0) + sales + 1;
        }
      });
    });
    return {
      popularCategories: Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0])
        .filter((c) => c && c !== "Zote")
        .slice(0, 4),
      popularSearches: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0])
        .slice(0, 5),
    };
  }, [products, salesCounts, selectedNiche]);

  const iconMap: Record<string, any> = {
    Coins,
    Smartphone,
    Shirt,
    Sofa,
    Heart,
    CarFront,
    ShoppingBag,
    Package,
    Store,
    Tag,
    Ticket,
    Activity,
    Award,
    Zap,
    Cpu,
    Camera,
    Bot,
    FileText,
    MessageSquare,
    Laptop,
    Baby,
    Palette,
    Coffee,
    Dumbbell,
    Scissors,
    Briefcase,
    Gift,
    Headphones,
    Cake,
    Watch,
    Bike,
    Key,
    BookOpen,
    Leaf,
    Flame,
    Music,
    Gem,
    Tv,
    Compass,
    Footprints,
    Crown,
    GlassWater,
    Wrench,
    Flower2,
    Globe,
    Anchor,
    Apple,
    Banana,
    Beer,
    Bone,
    Box,
    Brain,
    Brush,
    Bus,
    Calculator,
    Candy,
    Cat,
    ChefHat,
    Clapperboard,
    Cloud,
    Cookie,
    Dog,
    Dices,
    Disc,
    Egg,
    Fan,
    Feather,
    Fish,
    Gamepad2,
    Gavel,
    Guitar,
    Hammer,
    IceCream,
    Joystick,
    Lightbulb,
    Luggage,
    Map,
    Mic,
    Microscope,
    Moon,
    Mountain,
    Paintbrush,
    PenTool,
    Pill,
    Pizza,
    Plane,
    Plug,
    Printer,
    Puzzle,
    Radio,
    Receipt,
    Rocket,
    Ruler,
    Scale,
    Server,
    Shell,
    ShowerHead,
    Shovel,
    Sprout,
    Stethoscope,
    Sun,
    Table,
    Tablet,
    Tent,
    Thermometer,
    Trophy,
    Umbrella,
    Utensils,
    Wallet,
    Wine,
    Armchair,
    Bath,
    Battery,
    Bed,
    Beef,
    BellRing,
    Bird,
    Book,
    Castle,
    Clover,
    Construction,
    Container,
    CupSoda,
    Glasses,
    GraduationCap,
    HardHat,
    Heater,
    Martini,
    Notebook,
    PackageOpen,
    PawPrint,
    Pen,
    Pencil,
    PiggyBank,
    PlugZap,
    Rabbit,
    Refrigerator,
    Salad,
    Sandwich,
    ShoppingBasket,
    Smile,
    Snowflake,
    Soup,
    Speaker,
    Target,
    Telescope,
    Terminal,
    ToyBrick,
    Train,
    Trees,
    Volleyball,
    Wand,
    Warehouse,
    WashingMachine,
    Waves,
    Webcam,
    Wheat,
  };

  const handleCategorySelect = (c: string) => {
    setSelectedCategory(c);
    if (c !== "Zote") {
      setPrefs((p) => {
        const next = {
          ...p,
          categories: { ...p.categories, [c]: (p.categories[c] || 0) + 1 },
        };
        try {
          if (
            localStorage.getItem("orbishop_cookie_consent_accepted") === "true"
          ) {
            localStorage.setItem("orbishop_user_prefs", JSON.stringify(next));
          }
        } catch {}
        return next;
      });
    }
  };

  const trackProductInteraction = (prod: Product) => {
    try {
      const sid =
        localStorage.getItem("orbi_visitor_session_id") ||
        (() => {
          const newSid =
            "v-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          localStorage.setItem("orbi_visitor_session_id", newSid);
          return newSid;
        })();
      fetch("/api/analytics/visitors/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          action: "product_view",
          productId: prod.id,
          productName: prod.name,
        }),
      }).catch(() => {});
    } catch {}

    setPrefs((p) => {
      const next = {
        categories: {
          ...p.categories,
          [prod.category]: (p.categories[prod.category] || 0) + 1,
        },
        views: { ...p.views, [prod.id]: (p.views[prod.id] || 0) + 1 },
      };
      try {
        if (
          localStorage.getItem("orbishop_cookie_consent_accepted") === "true"
        ) {
          localStorage.setItem("orbishop_user_prefs", JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  const trackNicheInteraction = (nicheName: string) => {
    try {
      const sid =
        localStorage.getItem("orbi_visitor_session_id") ||
        (() => {
          const newSid =
            "v-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          localStorage.setItem("orbi_visitor_session_id", newSid);
          return newSid;
        })();
      fetch("/api/analytics/visitors/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          action: "product_view",
          productName: `Niche: ${nicheName}`,
        }),
      }).catch(() => {});
    } catch {}

    try {
      const stored = localStorage.getItem("orbi_clicked_niches") || "[]";
      const list = JSON.parse(stored);
      if (Array.isArray(list) && !list.includes(nicheName.toLowerCase())) {
        const updated = [...list, nicheName.toLowerCase()];
        localStorage.setItem("orbi_clicked_niches", JSON.stringify(updated));
        setClickedNiches(updated);
      }
    } catch {}
  };

  const recommendedProducts = useMemo(() => {
    if (!products.length) return [];
    return [...products]
      .map((p) => {
        let score = 0;
        if (prefs.categories[p.category])
          score += prefs.categories[p.category] * 2;
        if (prefs.views[p.id]) score += prefs.views[p.id] * 5;

        // Auto Pilot Shopkeeper Intelligence Matches
        if (p.family && userPreferenceProfile.families.has(p.family.toLowerCase())) {
          score += 45; // Extremely strong match with past visits for families
        }
        if (p.niche && userPreferenceProfile.niches.has(p.niche.toLowerCase())) {
          score += 30; // Very strong match with past visits
        }
        if (p.category && userPreferenceProfile.categories.has(p.category.toLowerCase())) {
          score += 20; // Strong match
        }
        
        let kwMatches = 0;
        userPreferenceProfile.keywords.forEach((kw) => {
           if (p.name.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)) {
               kwMatches++;
           }
        });
        score += kwMatches * 15; // Moderate match per keyword overlap

        if (p.stock > 0 && p.stock < 10) score += 3; // Boost items low in stock (scarcity)
        if (p.stock > 100) score += 1; // Boost popular items

        // Synced Pro Seller Promotion & Visitor Randomization (Rotation Equity)
        const s = sellers.find((sel) => sel.id === p.sellerId);
        const isPro = s?.isPro && s?.proUntil && s.proUntil > Date.now();
        if (isPro) {
          const weight = shuffleWeights[p.id] || 0.5;
          score += 20.0 + weight * 12; // High prominence recommendations synced dynamically
        } else {
          // Dynamic exploration boost makes sure that on reload, recommendations rotate naturally
          const randBoost = (shuffleWeights[p.id] || 0.5) * 4.0;
          score += randBoost;
        }

        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p)
      .slice(0, 5); // top 5
  }, [products, prefs, sellers, shuffleWeights, userPreferenceProfile]);

  const topSellingProducts = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const salesMap: Record<string, number> = {};
    validOrders.forEach((o) => {
      o.items.forEach((i) => {
        salesMap[i.id] = (salesMap[i.id] || 0) + i.quantity;
      });
    });

    const itemsWithSales = [...products]
      .map((p) => {
        const sales = salesMap[p.id] || 0;
        let score = sales;
        
        // Auto Pilot Match
        if (p.family && userPreferenceProfile.families.has(p.family.toLowerCase())) score += 3.5;
        if (p.niche && userPreferenceProfile.niches.has(p.niche.toLowerCase())) score += 2;
        if (p.category && userPreferenceProfile.categories.has(p.category.toLowerCase())) score += 1.5;
        let kwMatches = 0;
        userPreferenceProfile.keywords.forEach((kw) => {
           if (p.name.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)) kwMatches++;
        });
        score += kwMatches * 1;

        const s = sellers.find((sel) => sel.id === p.sellerId);
        const isPro = s?.isPro && s?.proUntil && s.proUntil > Date.now();
        if (isPro) {
          // Sync pro sellers' items into popular recommendations using dynamic visitor seeds
          const weight = shuffleWeights[p.id] || 0.5;
          score += 1.5 + weight * 3.5; // proportional boost to mix them in with high distribution
        }
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);

    // Get up to top 15 bestselling/boosted items, then shuffle per visitor for freshness
    const top15 = itemsWithSales.slice(0, 15);
    return top15
      .sort((a, b) => {
        const wA = shuffleWeights[a.id] || 0.5;
        const wB = shuffleWeights[b.id] || 0.5;
        return wA - wB;
      })
      .slice(0, 5);
  }, [products, orders, sellers, shuffleWeights, userPreferenceProfile]);

  const proSellerProducts = useMemo(() => {
    const LATEST_24H = Date.now() - 24 * 60 * 60 * 1000;
    const sellersSales24h: Record<string, number> = {};
    const productSales: Record<string, number> = {};

    orders.forEach((o) => {
      if (o.status !== "cancelled") {
        const is24h =
          (o.timestamp ? new Date(o.timestamp).getTime() : o.date || 0) >=
          LATEST_24H;
        o.items.forEach((i) => {
          const matchedProdId = i.id || i.productId;
          productSales[matchedProdId] =
            (productSales[matchedProdId] || 0) + i.quantity;
          if (is24h) {
            const product = products.find((p) => p.id === matchedProdId);
            if (product) {
              sellersSales24h[product.sellerId] =
                (sellersSales24h[product.sellerId] || 0) + i.quantity;
            }
          }
        });
      }
    });

    // Categorize sellers
    const superstarProSellers = sellers.filter(
      (s) => s.isPro && (sellersSales24h[s.id] || 0) > 2,
    );
    const regularProSellers = sellers.filter(
      (s) => s.isPro && (sellersSales24h[s.id] || 0) <= 2,
    );

    // Non-pro upgraded / promoting sellers who have chosen a strategy on the upgrade UI
    const promotingSellers = sellers.filter((s) => {
      if (s.isPro) return false;
      const strategy = localStorage.getItem("orbi_push_strategy_" + s.id);
      return strategy === "old" || strategy === "new";
    });

    // Rank sellers: 1. Superstar Pro, 2. Regular Pro, 3. Promoting Sellers
    const rankedSellers = [
      ...superstarProSellers,
      ...regularProSellers,
      ...promotingSellers,
    ];

    const finalMatchedProducts: Product[] = [];

    rankedSellers.forEach((seller) => {
      const sellerProds = products.filter(
        (p) => p.sellerId === seller.id && p.stock > 0,
      );
      if (sellerProds.length === 0) return;

      const strategy = seller.isPro
        ? "both"
        : localStorage.getItem("orbi_push_strategy_" + seller.id) || "none";

      if (strategy === "both") {
        // Auto-push BOTH old unsold products (long-lived) and top sold/new products.
        const unsoldOld = [...sellerProds]
          .filter((p) => (productSales[p.id] || 0) === 0)
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // oldest first

        const topSoldOrNew = [...sellerProds].sort((a, b) => {
          const salesA = productSales[a.id] || 0;
          const salesB = productSales[b.id] || 0;
          if (salesA !== salesB) return salesB - salesA; // most sold first
          return (b.createdAt || 0) - (a.createdAt || 0); // newest first
        });

        // Take up to 3 of each to promote healthy variety
        const addedIds = new Set<string>();
        unsoldOld.slice(0, 3).forEach((p) => {
          finalMatchedProducts.push(p);
          addedIds.add(p.id);
        });
        topSoldOrNew.forEach((p) => {
          if (!addedIds.has(p.id) && addedIds.size < 6) {
            finalMatchedProducts.push(p);
            addedIds.add(p.id);
          }
        });
      } else if (strategy === "old") {
        // Mode 1: Push old unsold products (long-lived stocks)
        const unsoldOld = [...sellerProds]
          .filter((p) => (productSales[p.id] || 0) === 0)
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // oldest first

        const otherOld = [...sellerProds].sort(
          (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
        ); // oldest overall fallback

        const pool = unsoldOld.length > 0 ? unsoldOld : otherOld;
        pool.slice(0, 4).forEach((p) => finalMatchedProducts.push(p));
      } else if (strategy === "new") {
        // Mode 2: Push new/top sold products
        const topSoldOrNew = [...sellerProds].sort((a, b) => {
          const salesA = productSales[a.id] || 0;
          const salesB = productSales[b.id] || 0;
          if (salesA !== salesB) return salesB - salesA;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        topSoldOrNew.slice(0, 4).forEach((p) => finalMatchedProducts.push(p));
      }
    });

    // Shuffle final pro product picks natively using visitor-specific weights to guarantee
    // randomized distribution equity (all pro sellers' products reach visitors fairly)
    return [...finalMatchedProducts].sort((a, b) => {
      const wA = shuffleWeights[a.id] || 0.5;
      const wB = shuffleWeights[b.id] || 0.5;
      return wA - wB;
    });
  }, [products, sellers, orders, shuffleWeights]);

  const topDealsProducts = useMemo(() => {
    const discounted = products.filter(
      (p) => p.oldPrice && p.oldPrice > p.price,
    );
    return [...discounted]
      .map((p) => {
        const percent = ((p.oldPrice || 0) - p.price) / (p.oldPrice || 1);
        const s = sellers.find((sel) => sel.id === p.sellerId);
        const isPro = s?.isPro && s?.proUntil && s.proUntil > Date.now();

        let score = percent;
        
        // Auto Pilot Match
        if (p.family && userPreferenceProfile.families.has(p.family.toLowerCase())) score += 0.3;
        if (p.niche && userPreferenceProfile.niches.has(p.niche.toLowerCase())) score += 0.2;
        if (p.category && userPreferenceProfile.categories.has(p.category.toLowerCase())) score += 0.15;
        let kwMatches = 0;
        userPreferenceProfile.keywords.forEach((kw) => {
           if (p.name.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)) kwMatches++;
        });
        score += kwMatches * 0.1;

        if (isPro) {
          // Boost pro items in top deals with controlled visitor randomization
          const weight = shuffleWeights[p.id] || 0.5;
          score += 0.15 + weight * 0.15;
        }
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p)
      .slice(0, 12);
  }, [products, sellers, shuffleWeights, userPreferenceProfile]);

  const newArrivalsProducts = useMemo(() => {
    const sorted = [...products]
      .map((p) => {
        const s = sellers.find((sel) => sel.id === p.sellerId);
        const isPro = s?.isPro && s?.proUntil && s.proUntil > Date.now();
        // Time normalized recency score helper
        const recencyScore = p.createdAt ? p.createdAt / Date.now() : 0.5;

        let score = recencyScore * 40;
        
        // Auto Pilot Match
        if (p.family && userPreferenceProfile.families.has(p.family.toLowerCase())) score += 20;
        if (p.niche && userPreferenceProfile.niches.has(p.niche.toLowerCase())) score += 15;
        if (p.category && userPreferenceProfile.categories.has(p.category.toLowerCase())) score += 10;
        let kwMatches = 0;
        userPreferenceProfile.keywords.forEach((kw) => {
           if (p.name.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)) kwMatches++;
        });
        score += kwMatches * 8;

        const weight = shuffleWeights[p.id] || 0.5;
        if (isPro) {
          // Dynamic pro boost with personalized rotation ensures all new pro arrivals get fair reach
          score += 25 + weight * 20;
        } else {
          score += weight * 8;
        }
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);

    return sorted.slice(0, 12);
  }, [products, sellers, shuffleWeights]);

  const addToCart = (
    p: Product,
    openCart: boolean = false,
    customQty: number = 1,
  ) => {
    if (p.stock <= 0) {
      setToastMsg(
        lang === "sw"
          ? "Kuna tatizo wakati wa kuongeza bidhaa. Tafadhali jaribu tena."
          : "There was a problem adding the product. Please try again."
      );
      return;
    }
    trackProductInteraction(p);

    // Track Visitor Cart Add event
    const sid =
      localStorage.getItem("orbi_visitor_session_id") ||
      (() => {
        const newSid =
          "v-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        localStorage.setItem("orbi_visitor_session_id", newSid);
        return newSid;
      })();
    fetch("/api/analytics/visitors/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sid,
        action: "cart_add",
        productName: p.name,
      }),
    }).catch((e) => console.warn("Analytics log cart_add failed", e));

    const moq = getProductMOQ(p);
    const initialQty = Math.max(customQty, moq);

    if (p.stock < initialQty) {
      setToastMsg(
        lang === "sw"
          ? `Stoki haitoshi. Kiasi cha chini cha kuagiza (MOQ) cha bidhaa hii ya jumla ni ${moq}.`
          : `Insufficient stock. Minimum order quantity (MOQ) for this wholesale item is ${moq}.`
      );
      return;
    }

    let addSuccess = true;

    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id);
      if (ex) {
        const nextQty = ex.quantity + customQty;
        if (nextQty > p.stock) {
          addSuccess = false;
          return prev;
        }
        return prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: nextQty } : i,
        );
      }
      return [...prev, { product: p, quantity: initialQty }];
    });

    if (!addSuccess) {
      setToastMsg(
        lang === "sw"
          ? "Kuna tatizo wakati wa kuongeza bidhaa. Tafadhali jaribu tena."
          : "There was a problem adding the product. Please try again."
      );
      return;
    }

    if (openCart) {
      setShowCart(true);
    } else {
      const swMsg = "Bidhaa imeongezwa kwenye kikapu";
      const enMsg = "Item added to cart list for shopping";
      setToastMsg(lang === "sw" ? swMsg : enMsg);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === id) {
          const newQ = item.quantity + delta;
          const moq = getProductMOQ(item.product);
          if (newQ < moq) {
            setToastMsg(
              lang === "sw"
                ? `Huwezi kupunguza idadi chini ya kiasi cha chini cha jumla (MOQ) cha ${moq}.`
                : `You cannot reduce quantity below the wholesale minimum order quantity (MOQ) of ${moq}.`
            );
            return item;
          }
          if (newQ > 0 && newQ <= item.product.stock) {
            return { ...item, quantity: newQ };
          }
        }
        return item;
      }),
    );
  };

  const handleOpenInternalChat = () => {
    if (activeUser) {
      setChatTargetSellerId("support");
      setChatTargetSellerName("Orbi Shop Support Team");
      setChatTargetSellerAvatar("https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png");
      setShowChatModal(true);
      setShowProfile(false);
    } else {
      showAlert(
        lang === "sw"
          ? "Tafadhali jisajili au ingia kwanza ili uweze kuanza mazungumzo na timu yetu ya msaada."
          : "Please login or register first to start a support chat with our team.",
        "info",
      );
      setShowAuth("login");
    }
  };

  const totalCart = cart.reduce(
    (acc, i) => acc + getProductPriceForQty(i.product, i.quantity) * i.quantity,
    0,
  );

  const renderSearchSuggestions = () => {
    const suggestedCategories = debouncedSearch.length > 1 ? categories.filter((c: string) => c && c !== "Zote" && c.toLowerCase().includes(debouncedSearch.toLowerCase())).slice(0, 3) : [];
    const suggestedFamilies = debouncedSearch.length > 1 ? families.filter((f: string) => f && f.toLowerCase().includes(debouncedSearch.toLowerCase())).slice(0, 3) : [];

    const finalPopularSearches =
      backendPopularSearches.length > 0
        ? backendPopularSearches
        : popularSearches;

    return (
      <div className="absolute top-full left-0 w-full bg-white mt-3 rounded-2xl shadow-xl border border-slate-100 p-4 z-50 text-slate-800 flex flex-col gap-5 text-left max-h-[70vh] overflow-y-auto">
        {expandedKeywords.length > 0 && (
          <div className="bg-amber-50/50 border border-amber-100/80 rounded-xl p-2.5 px-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
              <Sparkles size={11} className="text-amber-600 animate-pulse" />
              {lang === "sw" ? "Tafta na Orbi" : "Orbi search assist"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {expandedKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySearch(kw);
                  }}
                  className="bg-white hover:bg-amber-50 border border-slate-100 hover:border-amber-200 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer shadow-xs"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
        {debouncedSearch.length > 1 ? (
          <div className="space-y-6">
            {suggestedCategories.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                  {lang === "sw" ? "Makundi Yanayohusiana" : "Suggested Categories"}
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {suggestedCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCategory(cat);
                        setShowSuggestions(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Search size={12} className="text-indigo-400" />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {suggestedFamilies.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                  {lang === "sw" ? "Brands Zinazohusiana" : "Suggested Families"}
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {suggestedFamilies.map(fam => (
                    <button
                      key={fam}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedFamily(fam);
                        setShowSuggestions(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Search size={12} className="text-emerald-400" />
                      {fam}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {suggestions.length > 0 ? (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                {lang === "sw" ? "Bidhaa Zinazolingana" : "Matching Products"}
              </div>
              <div className="space-y-1">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowSuggestions(false);
                      handleProductSelect(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-medium flex items-center gap-3 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          className="w-full h-full object-cover"
                          alt={p.name}
                        />
                      ) : (
                        <Search size={14} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal line-clamp-1">
                        {p.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
              {lang === "sw" ? "Hakuna matokeo" : "No results found"}
            </div>
          )}
          </div>
        ) : (
          <>
            {searchHistory.length > 0 && (
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <History size={11} className="text-slate-400" />
                    {lang === "sw" ? "Historia ya Utafutaji" : "Search History"}
                  </span>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearSearchHistory();
                    }}
                    className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
                  >
                    {lang === "sw" ? "Futa" : "Clear"}
                  </button>
                </div>
                <div className="space-y-3">
                  {groupedSearchHistory.map((group) => (
                    <div key={group.label} className="px-1">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {group.label}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <button
                            key={item.term}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applySearch(item.term);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <History size={11} className="text-slate-400" />
                            {item.term}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {finalPopularSearches.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-orange-400" />
                  {lang === "sw" ? "Maudhui Yanayovuma" : "Popular Searches"}
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {finalPopularSearches.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applySearch(tag);
                      }}
                      className="bg-slate-50 hover:bg-orange-50/70 border border-slate-100 hover:border-orange-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <TrendingUp size={12} className="text-orange-400" />
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {popularCategories.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                  {lang === "sw" ? "Kundi Maarufu" : "Trending Categories"}
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {popularCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCategory(cat);
                        setShowSuggestions(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  
  return {
    showAlert,
    showConfirm,
    toastMsg,
    setToastMsg,
    lang,
    setLang,
    prefs,
    setPrefs,
    products,
    setProducts,
    wholesaleDeals,
    setWholesaleDeals,
    globalSettings,
    setGlobalSettings,
    promos,
    setPromos,
    promotionalBanners,
    setPromotionalBanners,
    cart,
    setCart,
    sellers,
    setSellers,
    orders,
    setOrders,
    marketplaceAds,
    setMarketplaceAds,
    visitorId,
    setVisitorId,
    countedAds,
    setCountedAds,
    shuffleWeights,
    setShuffleWeights,
    handleShuffleClick,
    salesCounts,
    heroAds,
    carouselAds,
    activeMarketplaceAds,
    trackMarketplaceAdImpression,
    handleMarketplaceAdClick,
    activeUser,
    setActiveUser,
    search,
    setSearch,
    committedSearch,
    setCommittedSearch,
    searchHistory,
    setSearchHistory,
    backendPopularSearches,
    setBackendPopularSearches,
    expandedKeywords,
    setExpandedKeywords,
    isExpandingSearch,
    setIsExpandingSearch,
    selectedCategory,
    setSelectedCategory,
    selectedFamily,
    setSelectedFamily,
    selectedNiche,
    setSelectedNiche,
    hoveredCategory,
    setHoveredCategory,
    hoveredCategoryX,
    setHoveredCategoryX,
    hoveredNiche,
    setHoveredNiche,
    hoveredNicheX,
    setHoveredNicheX,
    megaMenuProducts,
    selectedArrangementTier,
    setSelectedArrangementTier,
    selectedArrangementVibe,
    setSelectedArrangementVibe,
    selectedArrangementWrap,
    setSelectedArrangementWrap,
    nicheScrollRef,
    syncStatesRef,
    likedProductIds,
    setLikedProductIds,
    likedNiches,
    toggleLikeProduct,
    showNicheDrawer,
    setShowNicheDrawer,
    sortOrder,
    setSortOrder,
    showCart,
    setShowCart,
    showAuth,
    setShowAuth,
    showApplySellerModal,
    setShowApplySellerModal,
    showProfile,
    setShowProfile,
    showTrackOrder,
    setShowTrackOrder,
    profileInitialTab,
    setProfileInitialTab,
    showCheckout,
    setShowCheckout,
    showSecureOrderAuthPrompt,
    setShowSecureOrderAuthPrompt,
    showAboutPage,
    setShowAboutPage,
    aboutPageTab,
    setAboutPageTab,
    isLoading,
    setIsLoading,
    viewInvoice,
    setViewInvoice,
    viewPromo,
    setViewPromo,
    selectedProduct,
    setSelectedProduct,
    viewSeller,
    setViewSeller,
    showReviewModal,
    setShowReviewModal,
    selectedProductForReview,
    setSelectedProductForReview,
    allReviews,
    setAllReviews,
    sortedAdsList,
    contextualAds,
    isFetchingContextualAds,
    userPreferenceProfile,
    recentProductIds,
    setRecentProductIds,
    handleProductSelect,
    recentProductsList,
    coupons,
    setCoupons,
    systemNiches,
    setSystemNiches,
    guestMessages,
    setGuestMessages,
    forcePointsUpdate,
    setForcePointsUpdate,
    isParsingReceipt,
    setIsParsingReceipt,
    parsedReceiptData,
    setParsedReceiptData,
    parsingError,
    setParsingError,
    readReplyIds,
    setReadReplyIds,
    handleReceiptUpload,
    handleClaimReceiptPoints,
    handleRedeemVoucher,
    showNotificationsMenu,
    setShowNotificationsMenu,
    readNotificationIds,
    setReadNotificationIds,
    saveReadNotificationIds,
    showAIChatDrawer,
    setShowAIChatDrawer,
    imageUploadCount,
    setImageUploadCount,
    showImageLimitModal,
    setShowImageLimitModal,
    getInitialUserId,
    isTransferredToLive,
    setIsTransferredToLive,
    aiLockTimeRemaining,
    setAiLockTimeRemaining,
    checkAIResetQuotaStatus,
    aiChatHistory,
    setAIChatHistory,
    aiInputMessage,
    setAIInputMessage,
    isAILoading,
    setIsAILoading,
    aiSelectedImage,
    setAiSelectedImage,
    handleAIImageChange,
    isVisualSearching,
    visualSearchError,
    handleVisualSearchImageChange,
    sendAIChatMessage,
    notifications,
    unreadNotificationsCount,
    loadData,
    unreadCount,
    logoutClient,
    niches,
    nicheColorMap: nicheColorMapData.colorMap,
    dynamicSellerCategories,
    categories,
    filteredProductsBySeller,
    searchIndex,
    debouncedSearch,
    setDebouncedSearch,
    filteredProducts,
    similarSuggestions,
    suggestions,
    adPlacementIndex,
    showSuggestions,
    setShowSuggestions,
    applySearch,
    clearSearchHistory,
    groupedSearchHistory,
    popularCategories,
    popularSearches,
    iconMap,
    handleCategorySelect,
    trackProductInteraction,
    trackNicheInteraction,
    recommendedProducts,
    topSellingProducts,
    proSellerProducts,
    topDealsProducts,
    newArrivalsProducts,
    addToCart,
    updateQuantity,
    handleOpenInternalChat,
    totalCart,
    renderSearchSuggestions,
    showChatModal,
    setShowChatModal,
    chatTargetSellerId,
    setChatTargetSellerId,
    chatTargetSellerName,
    setChatTargetSellerName,
    chatTargetSellerAvatar,
    setChatTargetSellerAvatar,
    ecosystemResults,
    isFetchingEcosystem,
    ecosystemViewerItem,
    setEcosystemViewerItem
  };
}
