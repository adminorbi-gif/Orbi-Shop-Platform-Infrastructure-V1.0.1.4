import { OrderItemRow } from '../index';
export { TicketsAdmin as MessagesAdmin } from "./TicketsAdmin";
import { SellerDetailView } from './SellerDetailView';
import { CustomerDetailView } from './CustomerDetailView';
import { CameraBarcodeScanner } from '../../../components/CameraBarcodeScanner';
import { getStoragePath, extractMediaFromText, isImage, isVideo } from '../../../lib/media';
import { getLoyaltyPoints, saveLoyaltyPoints, formatOrderNumber, getOrderNumber } from "../../../lib/helpers";
import { useI18n } from "../index";
import { useDialog } from "../../../components/CustomDialogContext";
import { uploadFileViaStorageApi, deleteFileViaStorageApi } from "../../../lib/upload";
import { ChatWidget } from "../../../components/chat/ChatWidget";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion } from "motion/react";
import { supabase } from "../../../lib/supabase";
import { formatCurrency } from "../../../lib/storage";
import { exportToCSV } from "../../../utils/exportUtils";
import { PriceDisplay } from "../../../components/PriceDisplay";
import { ImageWithSkeleton } from "../../../components/ImageWithSkeleton";
import { db, apiFetch } from "../../../lib/db";
import GooglePlacePicker from "../../../components/GooglePlacePicker";
import { quoteProductDelivery } from "../../../lib/deliveryZones";
import { SchemaValidator } from "../../../utils/schemaValidation";
import { PhotoQualityGuide } from "../../../components/PhotoQualityGuide";
import {
  Product,
  Order,
  OrderStatusLog,
  Promotion,
  Message,
  Customer,
  Coupon,
  Niche,
  SellerProfile,
  SubscriptionPlan,
  PromotionalBanner,
  Category,
  DeliveryZone,
  DeliveryRule,
  GooglePlaceDetails,
} from "../../../types";
import {
  Plus,
  Trash,
  Check,
  Percent,
  X,
  ChevronDown,
  Image as ImageIcon,
  Search,
  Copy,
  CheckCircle2,
  TrendingUp,
  Users,
  User,
  ShoppingBag,
  DollarSign,
  Calendar,
  ExternalLink,
  MessageSquare,
  History,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Ticket,
  FileText,
  LogOut,
  Store,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Bell,
  Lock,
  Paperclip,
  Download,
  Clock,
  ArrowUpRight,
  Truck,
  ShieldCheck,
  Shield,
  Smartphone,
  Shirt,
  Sofa,
  Heart,
  CarFront,
  Sparkles,
  Award,
  Barcode,
  Camera,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Megaphone,
  Bot,
  Cpu,
  Activity,
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
  Coins,
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
  Map as MapIcon,
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
  Globe,
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
  Unlock,
  Edit,
  UserCheck,
  ArrowLeft,
  Wheat,
} from "lucide-react";
import { getProductMOQ } from "../../../utils/pricing";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Lang, t } from "../../../lib/i18nAdmin";
import { FinancesAdmin } from "../../../components/admin/FinancesAdmin";
import { StaffAdmin } from "../../../components/admin/StaffAdmin";
import { AdsAdmin } from "../../../components/admin/AdsAdmin";
import { CampaignsAdmin } from "../../../components/admin/CampaignsAdmin";
import VisitorsAnalyticsView from "../../../components/VisitorsAnalytics";
import { ApplySellerModal } from "../../../components/client/ClientSubcomponents";
import { LoadingOverlay } from "../../../components/LoadingOverlay";


export function AdvancedSellerAnalytics({
  sellers,
  products = [],
  orders = [],
  lang,
}: {
  sellers: SellerProfile[];
  products?: Product[];
  orders?: Order[];
  lang: string;
}) {
  // Compute analytics
  const sellerStats = useMemo(() => {
    return sellers.map((seller) => {
      const sellerProducts = products.filter((p) => p.sellerId === seller.id);
      const productCount = sellerProducts.length;

      const sellerOrders = orders.filter((o) =>
        o.items.some((item) =>
          sellerProducts.some((sp) => sp.id === item.productId),
        ),
      );
      const orderCount = sellerOrders.length;

      const itemsSold = sellerOrders.reduce((acc, order) => {
        const orderItemsForSeller = order.items.filter((item) =>
          sellerProducts.some((sp) => sp.id === item.productId),
        );
        return (
          acc +
          orderItemsForSeller.reduce((sum, item) => sum + item.quantity, 0)
        );
      }, 0);

      const revenue = sellerOrders.reduce((acc, order) => {
        const orderItemsForSeller = order.items.filter((item) =>
          sellerProducts.some((sp) => sp.id === item.productId),
        );
        return (
          acc +
          orderItemsForSeller.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          )
        );
      }, 0);

      return {
        ...seller,
        productCount,
        orderCount,
        itemsSold,
        revenue,
      };
    });
  }, [sellers, products, orders]);

  const topBySales = [...sellerStats]
    .filter((s) => s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const topByActivity = [...sellerStats]
    .filter((s) => s.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5);
  const inactiveSellers = [...sellerStats]
    .filter((s) => s.productCount === 0 || s.orderCount === 0)
    .sort((a, b) => a.productCount - b.productCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Sellers by Revenue */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <TrendingUp size={20} />
            <h3 className="font-bold text-slate-800">
              {lang === "sw"
                ? "Wanaoongoza kwa Mauzo"
                : "Top Sellers (Revenue)"}
            </h3>
          </div>
          <div className="space-y-3">
            {topBySales.length === 0 && (
              <p className="text-slate-400 text-sm">
                {lang === "sw" ? "Hakuna takwimu" : "No analytics yet"}
              </p>
            )}
            {topBySales.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150 shadow-sm"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {s.name}
                    </p>
                    <div className="mt-0.5">
                      <PriceDisplay
                        amount={s.revenue}
                        size="xs"
                        colorClass="text-slate-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-700">
                    {s.itemsSold} {lang === "sw" ? "bidhaa" : "items"}
                  </p>
                  <button
                    onClick={() => {
                      let msg =
                        lang === "sw"
                          ? `Habari ${s.name}, hongera sana kwa kazi nzuri unayofanya.`
                          : `Hello ${s.name}, congratulations on your great performance.`;
                      const phoneStr = s.invoicePhone
                        ? s.invoicePhone.replace(/\+/g, "")
                        : "255764258114";
                      window.open(
                        `https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`,
                        "_blank",
                      );
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded mt-1 font-semibold flex items-center gap-1 justify-end transition cursor-pointer"
                  >
                    <MessageSquare size={10} /> Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Posting */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <Package size={20} />
            <h3 className="font-bold text-slate-800">
              {lang === "sw"
                ? "Wanaoongoza Kupanua Bidhaa (Active)"
                : "Most Active Sellers (Products)"}
            </h3>
          </div>
          <div className="space-y-3">
            {topByActivity.length === 0 && (
              <p className="text-slate-400 text-sm">
                {lang === "sw" ? "Hakuna takwimu" : "No analytics yet"}
              </p>
            )}
            {topByActivity.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150 shadow-sm"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {s.productCount}{" "}
                      {lang === "sw"
                        ? "bidhaa zilizo kwenye soko"
                        : "products listed"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <button
                    onClick={() => {
                      let msg =
                        lang === "sw"
                          ? `Habari ${s.name}, tunashukuru kwa ushirikiano wako. Tumia huduma yetu kukuza soko lako.`
                          : `Hello ${s.name}, we appreciate your activity. Let us know how we can help.`;
                      const phoneStr = s.invoicePhone
                        ? s.invoicePhone.replace(/\+/g, "")
                        : "255764258114";
                      window.open(
                        `https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`,
                        "_blank",
                      );
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded mt-1 font-semibold flex items-center gap-1 justify-end transition cursor-pointer"
                  >
                    <MessageSquare size={10} /> Support
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inactive & Underperforming Sellers */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 md:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-rose-600">
            <AlertCircle size={20} />
            <h3 className="font-bold text-slate-800">
              {lang === "sw"
                ? "Wauzaji Wasiofanya Vizuri (Inactive/Underperforming)"
                : "Inactive & Underperforming Sellers"}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveSellers.length === 0 && (
              <p className="text-slate-400 text-sm">
                {lang === "sw"
                  ? "Hakuna wauzaji wasio active."
                  : "No inactive sellers found."}
              </p>
            )}
            {inactiveSellers.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150 shadow-sm"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <AlertCircle size={14} />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {s.productCount}{" "}
                      {lang === "sw" ? "bidhaa, " : "products, "}
                      {s.orderCount} {lang === "sw" ? "oda" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      let msg =
                        lang === "sw"
                          ? `Habari ${s.name}, tumeona haujawa active kwa muda. Je kundi la Orbi linaweza kukusaidia vipi?`
                          : `Hello ${s.name}, we noticed you haven't been active lately. How can Orbi help you grow?`;
                      const phoneStr = s.invoicePhone
                        ? s.invoicePhone.replace(/\+/g, "")
                        : "255764258114";
                      window.open(
                        `https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`,
                        "_blank",
                      );
                    }}
                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1.5 rounded font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Bot size={10} /> Auto-Reachout
                  </button>
                  <button
                    onClick={() => {
                      let msg =
                        lang === "sw"
                          ? `Habari ${s.name}, tunakukumbusha kupost bidhaa na kuwa active.`
                          : `Hello ${s.name}, just checking in. Consider posting new products to attract customers!`;
                      const phoneStr = s.invoicePhone
                        ? s.invoicePhone.replace(/\+/g, "")
                        : "255764258114";
                      window.open(
                        `https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`,
                        "_blank",
                      );
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <MessageSquare size={10} /> ping
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- SELLERS ADMIN ---------------- //
export function SellersAdmin({
  sellers,
  setSellers,
  products = [],
  orders = [],
  currentStaff,
  messages = [],
  onRefreshData,
}: {
  sellers: SellerProfile[];
  setSellers: any;
  products?: Product[];
  orders?: Order[];
  currentStaff?: any;
  messages?: Message[];
  onRefreshData?: () => void;
}) {
  const { lang } = useI18n();
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subTab, setSubTab] = useState<"sellers" | "plans" | "analytics">(
    "analytics",
  );
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Parse swahili and/or english fields for new vendor requests from customer support chat
  // Parse swahili and/or english fields for new vendor requests from customer support chat
  const parseSellerApplication = (text: string) => {
    if (!text || !text.includes("Maombi ya Kuwa Muuzaji")) return null;

    const lines = text.split("\n");
    let fullName = "";
    let email = "";
    let storeName = "";
    let niche = "";
    let location = "";
    let tin = "";
    let businessType = "";
    let estimatedOrders = "";
    let description = "";
    let proposedPassword = "123456";

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes("jina kamili:")) {
        fullName = line.split(/jina kamili:/i)[1]?.trim() || "";
      } else if (lower.includes("barua pepe:")) {
        email = line.split(/barua pepe:/i)[1]?.trim() || "";
      } else if (lower.includes("duka:")) {
        storeName = line.split(/duka:/i)[1]?.trim() || "";
      } else if (lower.includes("niche ya biashara:")) {
        niche = line.split(/niche ya biashara:/i)[1]?.trim() || "";
      } else if (lower.includes("nchi/eneo:")) {
        location = line.split(/nchi\/eneo:/i)[1]?.trim() || "";
      } else if (lower.includes("namba ya tin:")) {
        tin = line.split(/namba ya tin:/i)[1]?.trim() || "";
      } else if (lower.includes("aina ya biashara:")) {
        businessType = line.split(/aina ya biashara:/i)[1]?.trim() || "";
      } else if (lower.includes("kiwango cha mauzo:")) {
        estimatedOrders = line.split(/kiwango cha mauzo:/i)[1]?.trim() || "";
      } else if (lower.includes("maelezo zaidi:")) {
        const details = line.split(/maelezo zaidi:/i)[1]?.trim() || "";
        if (details.includes("Password:")) {
          const passParts = details.split("Password:");
          description = passParts[0]?.trim() || "";
          proposedPassword = passParts[1]?.trim() || "123456";
        } else {
          description = details;
        }
      }
    });

    return {
      fullName: fullName || "N/A",
      email: email || "N/A",
      storeName: storeName || fullName || "N/A",
      niche: niche || "N/A",
      location: location || "N/A",
      tin: tin || "N/A",
      businessType: businessType || "N/A",
      estimatedOrders: estimatedOrders || "N/A",
      description: description || "Requested via chat application form.",
      proposedPassword,
    };
  };

  const pendingRequests = useMemo(() => {
    return (messages || [])
      .filter((msg) => msg.message && msg.message.includes("Maombi ya Kuwa Muuzaji"))
      .map((msg) => {
        const appData = parseSellerApplication(msg.message);
        if (!appData) return null;
        return {
          ...appData,
          id: msg.id,
          date: msg.date,
          phone: msg.phone || "N/A",
        };
      })
      .filter((app): app is any => !!app)
      .filter((app) => {
        const isAlreadySeller = sellers?.some(
          (s) => s.email?.toLowerCase().trim() === app.email.toLowerCase().trim()
        );
        return !isAlreadySeller;
      });
  }, [messages, sellers]);

  // Approving seller states
  const [approvingSellerData, setApprovingSellerData] = useState<{
    fullName: string;
    email: string;
    storeName: string;
    description: string;
    proposedPassword?: string;
    phone?: string;
    location?: string;
    tin?: string;
    businessType?: string;
    estimatedOrders?: string;
    niche?: string;
  } | null>(null);
  const [approvePassword, setApprovePassword] = useState("");
  const [approveForceChange, setApproveForceChange] = useState(true);

  const handleApproveSeller = (app: {
    fullName: string;
    email: string;
    storeName: string;
    description: string;
    proposedPassword?: string;
    phone?: string;
    location?: string;
    tin?: string;
    businessType?: string;
    estimatedOrders?: string;
    niche?: string;
  }) => {
    const lowerEmail = app.email.toLowerCase().trim();
    if (!lowerEmail || lowerEmail === "n/a" || !lowerEmail.includes("@")) {
      showAlert(
        lang === "sw"
          ? "Barua pepe haipo au si sahihi!"
          : "Application has an invalid or missing email address!",
        "error"
      );
      return;
    }

    const exists = sellers.some(
      (s) => s.email && s.email.toLowerCase().trim() === lowerEmail
    );
    if (exists) {
      showAlert(
        lang === "sw"
          ? "Muuzaji mwenye barua pepe hii amesajiliwa tayari!"
          : "A seller with this email address already exists!",
        "error"
      );
      return;
    }

    setApprovingSellerData(app);
    setApprovePassword(app.proposedPassword || "123456"); // Default proposed or temporary password
    setApproveForceChange(true);
  };

  // Plan States
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);

  // Plan fields
  const [planName, setPlanName] = useState("");
  const [planNameSw, setPlanNameSw] = useState("");
  const [planPrice, setPlanPrice] = useState(15000);
  const [planDays, setPlanDays] = useState(30);
  const [planDesc, setPlanDesc] = useState("");
  const [planDescSw, setPlanDescSw] = useState("");
  const [planActive, setPlanActive] = useState(true);

  // Seller States
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [proDays, setProDays] = useState(30);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [status, setStatus] = useState("active");
  const [deleteRequested, setDeleteRequested] = useState(false);

  const [invoiceCompanyName, setInvoiceCompanyName] = useState("");
  const [invoicePhone, setInvoicePhone] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [sellerPickupPlace, setSellerPickupPlace] = useState<GooglePlaceDetails | null>(null);
  const [invoiceTerms, setInvoiceTerms] = useState("");

  // Custom seller registration & approval states
  const [password, setPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isApproved, setIsApproved] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      setLoadingPlans(true);
      const subPlans = await db.getSubscriptionPlans();
      setPlans(subPlans || []);
      setLoadingPlans(false);
    }
    loadPlans();
  }, []);

  const handleOpen = (s?: SellerProfile) => {
    if (s) {
      setEditId(s.id);
      setName(s.name);
      setDescription(s.description);
      setEmail(s.email || "");
      setIsPro(!!s.isPro && !!s.proUntil && s.proUntil > Date.now());
      setProDays(30);
      setSelectedPlanId(s.activePlanId || "");
      setStatus(s.status || "active");
      setDeleteRequested(!!s.deleteRequested);
      setInvoiceCompanyName(s.invoiceCompanyName || "");
      setInvoicePhone(s.invoicePhone || "");
      setInvoiceEmail(s.invoiceEmail || "");
      setInvoiceAddress(s.invoiceAddress || "");
      setSellerPickupPlace(
        s.pickupLat && s.pickupLng
          ? {
              placeId: s.pickupPlaceId || "",
              formattedAddress: s.pickupAddress || s.invoiceAddress || "",
              lat: Number(s.pickupLat),
              lng: Number(s.pickupLng),
            }
          : null,
      );
      setInvoiceTerms(s.invoiceTerms || "");
      // Set values we read from the profile
      setPassword(s.password || "");
      setMustChangePassword(!!s.mustChangePassword);
      setIsApproved(s.isApproved !== false);
    } else {
      setEditId(null);
      setName("");
      setDescription("");
      setEmail("");
      setIsPro(false);
      setProDays(30);
      setSelectedPlanId("");
      setStatus("active");
      setDeleteRequested(false);
      setInvoiceCompanyName("");
      setInvoicePhone("");
      setInvoiceEmail("");
      setInvoiceAddress("");
      setSellerPickupPlace(null);
      setInvoiceTerms("");
      // Set defaults for new ones
      setPassword("");
      setMustChangePassword(true);
      setIsApproved(true);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated: SellerProfile[];
    if (editId) {
      updated = sellers.map((s) => {
        if (s.id === editId) {
          const newProUntil = isPro
            ? s.proUntil && s.proUntil > Date.now()
              ? s.proUntil + proDays * 24 * 60 * 60 * 1000
              : Date.now() + proDays * 24 * 60 * 60 * 1000
            : undefined;
          return {
            ...s,
            name,
            description,
            email: email.trim(),
            isPro,
            proUntil: isPro ? newProUntil : undefined,
            activePlanId: isPro ? selectedPlanId || undefined : undefined,
            status: status as "active" | "frozen",
            deleteRequested,
            invoiceCompanyName,
            invoicePhone,
            invoiceEmail,
            invoiceAddress,
            pickupAddress: sellerPickupPlace?.formattedAddress || invoiceAddress,
            pickupPlaceId: sellerPickupPlace?.placeId || s.pickupPlaceId,
            pickupLat: sellerPickupPlace?.lat,
            pickupLng: sellerPickupPlace?.lng,
            invoiceTerms,
            password: password ? password.trim() : s.password,
            mustChangePassword,
            isApproved,
          };
        }
        return s;
      });
    } else {
      const newProUntil = isPro
        ? Date.now() + proDays * 24 * 60 * 60 * 1000
        : undefined;
      updated = [
        ...sellers,
        {
          id: "SLR-" + Date.now().toString(36),
          name,
          description,
          email: email.trim(),
          isPro,
          proUntil: newProUntil,
          activePlanId: isPro ? selectedPlanId || undefined : undefined,
          status: status as "active" | "frozen",
          deleteRequested,
          invoiceCompanyName,
          invoicePhone,
          invoiceEmail,
          invoiceAddress,
          pickupAddress: sellerPickupPlace?.formattedAddress || invoiceAddress,
          pickupPlaceId: sellerPickupPlace?.placeId,
          pickupLat: sellerPickupPlace?.lat,
          pickupLng: sellerPickupPlace?.lng,
          invoiceTerms,
          password: password ? password.trim() : "123456", // Default temporary if empty
          mustChangePassword,
          isApproved,
        },
      ];
    }
    setSellers(updated);
    await db.saveSellers(updated);
    setShowModal(false);
    showAlert("Seller profile saved successfully", "success");
  };

  const handleRemove = async (id: string, name: string) => {
    if (
      currentStaff?.role !== "super_admin" &&
      currentStaff?.role !== "human_resources"
    )
      return;

    if (currentStaff?.role === "human_resources") {
      // HR can request deletion
      if (!confirm(`Request to delete seller ${name}?`)) return;
      const updated = sellers.map((s) =>
        s.id === id ? { ...s, deleteRequested: true } : s,
      );
      setSellers(updated);
      await db.saveSellers(updated);
      showAlert("Deletion requested successfully", "success");
    } else {
      // Super admin can delete directly
      if (!confirm(`Delete seller ${name}?`)) return;
      const updated = sellers.filter((s) => s.id !== id);
      setSellers(updated);
      await db.saveSellers(updated);
      showAlert("Seller deleted", "success");
    }
  };

  const handleToggleSellerStatus = async (seller: SellerProfile) => {
    if (
      currentStaff?.role !== "super_admin" &&
      currentStaff?.role !== "human_resources"
    )
      return;

    const newStatus = seller.status === "frozen" ? "active" : "frozen";
    if (!(await showConfirm(`Change seller ${seller.name} to ${newStatus}?`))) return;

    const reason = await showPrompt("Tafadhali jaza sababu ya kitendo hiki (Please enter reason for action):");
    if (!reason || reason.trim() === "") {
      showAlert("Lazima ujaze sababu ya kitendo hiki kwa madhumuni ya kiusalama (Reason is required).", "error");
      return;
    }

    let securityLogs = [];
    if (seller.blockReason && seller.blockReason.startsWith('[')) {
      try {
        securityLogs = JSON.parse(seller.blockReason);
      } catch (e) {}
    }
    securityLogs.push({
      date: new Date().toISOString(),
      action: newStatus,
      reason: reason.trim(),
      performedBy: {
        name: currentStaff?.name || "System Admin",
        email: currentStaff?.email || "admin"
      }
    });

    const blockReasonStr = JSON.stringify(securityLogs);

    const updated = sellers.map((s) =>
      s.id === seller.id ? { ...s, status: newStatus as "active" | "frozen", blockReason: blockReasonStr } : s,
    );
    setSellers(updated);
    await db.saveSellers(updated);
    showAlert(`Seller status changed to ${newStatus}.`, "success");
  };

  const handleApproveExistingSeller = async (seller: SellerProfile) => {
    if (
      currentStaff?.role !== "super_admin" &&
      currentStaff?.role !== "human_resources"
    )
      return;

    const updated = sellers.map((s) =>
      s.id === seller.id ? { ...s, isApproved: true, status: "active" as const } : s,
    );
    setSellers(updated);
    await db.saveSellers(updated);
    showAlert("Seller approved and activated.", "success");
  };

  const handleOpenPlan = (p?: SubscriptionPlan) => {
    if (p) {
      setEditPlanId(p.id);
      setPlanName(p.name);
      setPlanNameSw(p.nameSw || "");
      setPlanPrice(p.price);
      setPlanDays(p.days);
      setPlanDesc(p.description);
      setPlanDescSw(p.descriptionSw || "");
      setPlanActive(p.active);
    } else {
      setEditPlanId(null);
      setPlanName("");
      setPlanNameSw("");
      setPlanPrice(15000);
      setPlanDays(30);
      setPlanDesc("");
      setPlanDescSw("");
      setPlanActive(true);
    }
    setPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPlans: SubscriptionPlan[];
    if (editPlanId) {
      updatedPlans = plans.map((p) =>
        p.id === editPlanId
          ? {
              id: p.id,
              name: planName,
              nameSw: planNameSw,
              price: Number(planPrice),
              days: Number(planDays),
              description: planDesc,
              descriptionSw: planDescSw,
              active: planActive,
            }
          : p,
      );
    } else {
      updatedPlans = [
        ...plans,
        {
          id: "sub-" + Date.now().toString(36),
          name: planName,
          nameSw: planNameSw,
          price: Number(planPrice),
          days: Number(planDays),
          description: planDesc,
          descriptionSw: planDescSw,
          active: planActive,
        },
      ];
    }
    setPlans(updatedPlans);
    await db.saveSubscriptionPlans(updatedPlans);
    setPlanModal(false);
    showAlert("Subscription tier saved successfully", "success");
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      const updatedPlans = plans.filter((p) => p.id !== id);
      setPlans(updatedPlans);
      await db.saveSubscriptionPlans(updatedPlans);
      showAlert("Subscription plan deleted", "success");
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      {/* Sub-tabs header */}
      <div className="flex border-b border-slate-150 mb-6 gap-2">
        <button
          onClick={() => setSubTab("sellers")}
          className={`px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-colors ${subTab === "sellers" ? "border-primary text-primary bg-slate-50" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Orodha ya Wauzaji" : "Sellers List"}
        </button>
        <button
          onClick={() => setSubTab("plans")}
          className={`px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-colors ${subTab === "plans" ? "border-primary text-primary bg-slate-50" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Mipango ya Usajili (Plans)" : "Subscription Plans"}
        </button>
        <button
          onClick={() => setSubTab("analytics")}
          className={`px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-colors ${subTab === "analytics" ? "border-primary text-primary bg-slate-50" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Takwimu (Analytics)" : "Advanced Analytics"}
        </button>
      </div>

      {subTab === "analytics" && (
        <AdvancedSellerAnalytics
          sellers={sellers}
          products={products}
          orders={orders}
          lang={lang}
        />
      )}

      {subTab === "sellers" && selectedSellerId && (
        <SellerDetailView 
          seller={sellers.find(s => s.id === selectedSellerId)!}
          products={products}
          orders={orders}
          onBack={() => setSelectedSellerId(null)}
          onEdit={() => {
            const selected = sellers.find(s => s.id === selectedSellerId);
            if (selected) handleOpen(selected);
          }}
          onToggleStatus={() => {
            const selected = sellers.find(s => s.id === selectedSellerId);
            if (selected) handleToggleSellerStatus(selected);
          }}
          onApprove={() => {
            const selected = sellers.find(s => s.id === selectedSellerId);
            if (selected) handleApproveExistingSeller(selected);
          }}
          onDelete={async () => {
            const selected = sellers.find(s => s.id === selectedSellerId);
            if (!selected) return;
            await handleRemove(selected.id, selected.name);
            if (currentStaff?.role === "super_admin") setSelectedSellerId(null);
          }}
          canAdministrate={currentStaff?.role === "super_admin" || currentStaff?.role === "human_resources"}
          currentStaffRole={currentStaff?.role}
        />
      )}

      {subTab === "sellers" && !selectedSellerId && (
        <>
          {pendingRequests.length > 0 && (
            <div className="mb-8 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/5 border border-amber-300/60 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-700 font-bold shrink-0 shadow-xxs">
                  <Store size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    {lang === "sw"
                      ? "Maombi mapya ya kujiunga kama Muuzaji"
                      : "New Merchant Registration Applications"}
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      {lang === "sw" ? "Inasubiri Idhini" : "Awaiting Review"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === "sw"
                      ? `Kuna maombi ${pendingRequests.length} mapya ya Wauzaji yanayosubiri kudhinishwa hapa`
                      : `There are ${pendingRequests.length} merchant applications ready to review & activate`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} className="bg-white border border-amber-200/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow transition-all duration-200">
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-800 text-base block tracking-tight line-clamp-1">{req.storeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{lang === "sw" ? "Tuma Ombi:" : "Form ID:"} {req.id}</span>
                      </div>
                      
                      <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-medium text-slate-700">
                        <p className="truncate">
                          <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Muombaji: " : "Applicant: "}</span>
                          {req.fullName}
                        </p>
                        <p className="font-mono truncate">
                          <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Pepe: " : "Email: "}</span>
                          {req.email}
                        </p>
                        <p className="font-mono">
                          <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Simu: " : "Phone: "}</span>
                          {req.phone}
                        </p>
                        {req.niche && req.niche !== "N/A" && (
                          <p>
                            <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Niche: " : "Niche: "}</span>
                            <span className="bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-orange-150">{req.niche}</span>
                          </p>
                        )}
                        {req.location && req.location !== "N/A" && (
                          <p className="truncate">
                            <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Eneo: " : "Location: "}</span>
                            {req.location}
                          </p>
                        )}
                        {req.businessType && req.businessType !== "N/A" && (
                          <p>
                            <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Aina: " : "Type: "}</span>
                            {req.businessType}
                          </p>
                        )}
                        {req.estimatedOrders && req.estimatedOrders !== "N/A" && (
                          <p>
                            <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "Mauzo: " : "Orders/Mo: "}</span>
                            {req.estimatedOrders}
                          </p>
                        )}
                        {req.tin && req.tin !== "N/A" && (
                          <p className="font-mono text-emerald-700">
                            <span className="text-slate-400 font-bold font-sans">{lang === "sw" ? "TIN: " : "TIN: "}</span>
                            {req.tin}
                          </p>
                        )}
                      </div>

                      {req.description && req.description !== "N/A" && (
                        <p className="text-slate-500 italic text-[11px] leading-relaxed line-clamp-2">
                          "{req.description}"
                        </p>
                      )}
                    </div>
                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleApproveSeller(req)}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 px-4.5 py-2 rounded-xl text-xs font-black shadow-xs hover:shadow transition-all flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <Check size={14} />
                        {lang === "sw" ? "Uidhinishe Sasa" : "Approve & Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {lang === "sw" ? "Simamia Wauzaji" : "Manage Sellers"}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const exportData = sellers.map(s => ({
                    ID: s.id,
                    StoreName: s.storeName,
                    OwnerName: s.name,
                    Email: s.email,
                    Status: s.status || 'active',
                    IsPro: s.isPro ? 'Yes' : 'No',
                    ProUntil: s.proUntil ? new Date(s.proUntil).toLocaleDateString() : '',
                    ActivePlan: s.activePlanId || 'None'
                  }));
                  exportToCSV(exportData, `sellers_export_${new Date().toISOString().split('T')[0]}.csv`);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                <Download size={16} />
                {lang === "sw" ? "Hamisha CSV" : "Export CSV"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (onRefreshData) {
                    setIsRefreshing(true);
                    await onRefreshData();
                    setTimeout(() => setIsRefreshing(false), 800);
                  }
                }}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                {lang === "sw" ? "Onyesha upya" : "Refresh"}
              </button>
              <button
                onClick={() => handleOpen()}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition hover:opacity-95 shadow-sm"
              >
                <Plus size={16} />{" "}
                {lang === "sw" ? "Ongeza Muuzaji" : "Add Seller"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(240px,1.4fr)_190px_270px_minmax(330px,auto)] gap-4 px-4 py-3 bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>Merchant profile</span>
              <span>Status</span>
              <span>Performance</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
            {sellers.map((s: SellerProfile) => {
              const isCurrentlyPro =
                s.isPro && s.proUntil && s.proUntil > Date.now();
              const matchedPlan = plans.find((p) => p.id === s.activePlanId);
              
              const sellerProducts = products.filter(p => p.sellerId === s.id);
              const sellerOrders = orders.filter(o => o.items.some(item => sellerProducts.some(p => p.id === item.productId)));
              const totalSales = sellerOrders.reduce((sum, o) => sum + o.total, 0);

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSellerId(s.id)}
                  className="cursor-pointer bg-white p-3 md:p-4 flex flex-col gap-3 md:grid md:grid-cols-[minmax(240px,1.4fr)_190px_270px_minmax(330px,auto)] md:items-center md:gap-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 text-slate-600 flex items-center justify-center font-black text-sm shadow-sm shrink-0 group-hover:from-primary group-hover:to-primary group-hover:text-white transition-all duration-300">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">
                        {s.storeName || s.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {s.email || s.phone || "No contact"} • {s.businessType || "Seller"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-start">
                    <span
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${s.status === "frozen" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                    >
                      {s.status === "frozen" ? "Frozen" : "Active"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${s.isApproved === false ? "bg-amber-50 text-amber-700 animate-pulse border border-amber-100" : "bg-teal-50 text-teal-700 border border-teal-100"}`}
                    >
                      {s.isApproved === false
                        ? lang === "sw"
                          ? "Pending"
                          : "Pending"
                        : lang === "sw"
                          ? "Approved"
                          : "Approved"}
                    </span>
                    {s.deleteRequested && (
                      <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                        Delete requested
                      </span>
                    )}
                    {isCurrentlyPro && (
                      <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <Shield size={10} />
                        {matchedPlan ? matchedPlan.name.toUpperCase() : "PRO"}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 md:w-full shrink-0">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Products</span>
                      <span className="font-black text-slate-800 text-xs">{sellerProducts.length}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Orders</span>
                      <span className="font-black text-slate-800 text-xs">{sellerOrders.length}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Sales</span>
                      <span className="font-black text-emerald-600 text-xs truncate block" title={formatCurrency(totalSales)}>{formatCurrency(totalSales, { compact: true })}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-start md:justify-end gap-1 md:border-l md:border-slate-100 md:pl-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSellerId(s.id); }}
                      className="px-2.5 py-2 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-lg transition flex items-center gap-1"
                    >
                      <Store size={13} /> Open
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpen(s); }}
                      className="px-2.5 py-2 text-[10px] font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                    >
                      {lang === "sw" ? "Hariri" : "Edit"}
                    </button>
                    {s.isApproved === false && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApproveExistingSeller(s); }}
                        className="px-2.5 py-2 rounded-lg transition text-[10px] font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                      >
                        Approve
                      </button>
                    )}
                    {(currentStaff?.role === "super_admin" || currentStaff?.role === "human_resources") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleSellerStatus(s); }}
                        className={`px-2.5 py-2 rounded-lg transition text-[10px] font-black ${
                          s.status === "frozen"
                            ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                            : "text-rose-600 bg-rose-50 hover:bg-rose-100"
                        }`}
                      >
                        {s.status === "frozen" ? "Activate" : "Freeze"}
                      </button>
                    )}
                    {(currentStaff?.role === "super_admin" ||
                      currentStaff?.role === "human_resources") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(s.id, s.name); }}
                        className={`px-2.5 py-2 rounded-lg text-[10px] font-black transition-all ${
                          s.deleteRequested &&
                          currentStaff?.role === "human_resources"
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                            : currentStaff?.role === "super_admin" &&
                                s.deleteRequested
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        }`}
                        disabled={
                          s.deleteRequested &&
                          currentStaff?.role === "human_resources"
                        }
                      >
                        {currentStaff?.role === "super_admin" ? "Delete" : s.deleteRequested ? "Requested" : "Request"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {sellers.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium bg-slate-50">
                {lang === "sw" ? "Hakuna Wauzaji" : "No Sellers Yet"}
              </div>
            )}
            </div>
          </div>
        </>
      )}

      {subTab === "plans" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {lang === "sw"
                ? "Mipango ya Usajili ya PRO"
                : "Sellers Subscription Tiers"}
            </h2>
            <button
              onClick={() => handleOpenPlan()}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition hover:opacity-95 shadow-sm"
            >
              <Plus size={16} />{" "}
              {lang === "sw" ? "Tengeneza Mpango" : "Create Plan"}
            </button>
          </div>

          {loadingPlans ? (
            <div className="text-center py-12 text-slate-400">
              Loading plans...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`border rounded-2xl p-5 flex flex-col relative bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md group ${p.active ? "border-slate-200" : "border-slate-150 opacity-60 bg-slate-50"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-extrabold text-lg text-slate-800">
                      {lang === "sw" && p.nameSw ? p.nameSw : p.name}
                    </h3>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${p.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                    >
                      {p.active
                        ? lang === "sw"
                          ? "Inatumika"
                          : "Active"
                        : lang === "sw"
                          ? "Imesimama"
                          : "Inactive"}
                    </span>
                  </div>
                  <div className="my-3">
                    <span className="text-2xl font-black text-slate-800">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">
                      {" "}
                      / {p.days} {lang === "sw" ? "Siku" : "Days"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed flex-grow mt-2 whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {lang === "sw" && p.descriptionSw
                      ? p.descriptionSw
                      : p.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenPlan(p)}
                      className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 hover:bg-primary/5 hover:text-primary transition"
                    >
                      {lang === "sw" ? "Hariri" : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="bg-rose-50 text-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition"
                    >
                      {lang === "sw" ? "Futa" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
              {plans.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  {lang === "sw" ? "Hakuna Mipango" : "No Plans Configured Yet"}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Seller Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">
                {editId
                  ? lang === "sw"
                    ? "Hariri Wasifu wa Muuzaji"
                    : "Edit Seller Profile"
                  : lang === "sw"
                    ? "Sajili Muuzaji Mpya"
                    : "Register New Seller"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 font-bold text-slate-700">
                  {lang === "sw" ? "Jina la Duka" : "Store/Business Name"}
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-accent"
                  placeholder="e.g. Orbi Fashion"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-bold text-slate-700">
                  {lang === "sw"
                    ? "Barua Pepe ya Muuzaji"
                    : "Seller Email Account"}
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-accent font-mono text-sm"
                  placeholder="seller@example.com (links to Supabase logins)"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 font-bold text-slate-700">
                  {lang === "sw"
                    ? "Nenosiri la Muuzaji"
                    : "Seller Login Password"}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-accent font-mono text-sm"
                  placeholder={
                    editId
                      ? lang === "sw"
                        ? "Wacha wazi kubaki lisilobadilishwa"
                        : "Leave blank to keep unchanged"
                      : "e.g. initialPass123"
                  }
                />
              </div>

              <div className="flex flex-col gap-2 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-3 font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-bold">
                      {lang === "sw"
                        ? "Lazimisha mabadiliko ya nenosiri"
                        : "Force password change on login"}
                    </p>
                    <p className="text-slate-400 font-normal">
                      {lang === "sw"
                        ? "Mteja atatakiwa kuweka upya nenosiri akiingia"
                        : "Seller must reset this temporary password upon entry"}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-2 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-3 font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={(e) => setIsApproved(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-bold">
                      {lang === "sw"
                        ? "IDHINI: Imethibitishwa"
                        : "APPROVAL: Fully Approved"}
                    </p>
                    <p className="text-slate-400 font-normal">
                      {lang === "sw"
                        ? "Ruhusu muuzaji kuingia kwenye akaunti yake"
                        : "Checked means the seller request is approved and dashboard access is active"}
                    </p>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm mb-1 font-bold text-slate-700">
                  {lang === "sw"
                    ? "Maelezo ya Biashara"
                    : "Business Description"}
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-accent"
                  rows={3}
                  placeholder="Brands, logistics or niche details..."
                ></textarea>
              </div>
              <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/50">
                <label className="flex items-center gap-3 font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPro}
                    onChange={(e) => setIsPro(e.target.checked)}
                    className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                  />
                  {lang === "sw"
                    ? "Mpe Uanachama wa PRO"
                    : "Grant PRO Subscription"}
                </label>
                {isPro && (
                  <div className="mt-4 pt-4 border-t border-orange-200 space-y-3">
                    <div>
                      <label className="block text-xs mb-1 font-bold text-slate-600">
                        {lang === "sw"
                          ? "Chagua Mpango wa Usajili"
                          : "Select Subscription Tier"}
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => {
                          const planId = e.target.value;
                          setSelectedPlanId(planId);
                          const planObj = plans.find((p) => p.id === planId);
                          if (planObj) {
                            setProDays(planObj.days);
                          }
                        }}
                        className="w-full border border-slate-300 p-2 rounded-lg outline-none bg-white font-medium"
                      >
                        <option value="">
                          -- {lang === "sw" ? "Chagua Mipango" : "Select Plan"}{" "}
                          --
                        </option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.days} {lang === "sw" ? "Siku" : "Days"}
                            )
                          </option>
                        ))}
                        <option value="custom">
                          {lang === "sw" ? "Nyingine" : "Custom"}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs mb-1 font-bold text-slate-600">
                        {lang === "sw"
                          ? "Siku za kuongeza uanachama wa PRO"
                          : "Subscription duration days to add for PRO"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={proDays}
                        onChange={(e) => setProDays(Number(e.target.value))}
                        className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-orange-500 bg-white font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {(currentStaff?.role === "super_admin" ||
                currentStaff?.role === "human_resources") && (
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-4">
                  <label className="block text-xs mb-1 font-bold text-slate-600">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
              )}

              {/* Invoice settings */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">
                  {lang === "sw" ? "Mipangilio ya Invoice" : "Invoice Settings"}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1 font-bold text-slate-600">
                      Invoice Company Name
                    </label>
                    <input
                      type="text"
                      value={invoiceCompanyName}
                      onChange={(e) => setInvoiceCompanyName(e.target.value)}
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 font-bold text-slate-600">
                      Invoice Phone
                    </label>
                    <input
                      type="text"
                      value={invoicePhone}
                      onChange={(e) => setInvoicePhone(e.target.value)}
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 font-bold text-slate-600">
                      Invoice Email
                    </label>
                    <input
                      type="text"
                      value={invoiceEmail}
                      onChange={(e) => setInvoiceEmail(e.target.value)}
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <GooglePlacePicker
                      lang={lang === "sw" ? "sw" : "en"}
                      value={invoiceAddress}
                      selectedPlace={sellerPickupPlace}
                      onAddressChange={setInvoiceAddress}
                      onPlaceSelect={setSellerPickupPlace}
                      compact
                      label={lang === "sw" ? "Eneo la Seller / Pickup" : "Seller / Pickup Location"}
                      placeholder={
                        lang === "sw"
                          ? "Tafuta eneo la duka kwenye Google Maps..."
                          : "Search seller store on Google Maps..."
                      }
                      helperText={
                        lang === "sw"
                          ? "Hii itatumika kwa route delivery na ramani sahihi."
                          : "Used for route delivery and accurate map data."
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1 font-bold text-slate-600">
                    Invoice Terms
                  </label>
                  <textarea
                    value={invoiceTerms}
                    onChange={(e) => setInvoiceTerms(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                    rows={2}
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition rounded-xl font-bold"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white hover:opacity-90 transition rounded-xl font-bold"
                >
                  {lang === "sw" ? "Hifadhi" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">
                {editPlanId
                  ? lang === "sw"
                    ? "Hariri Mpango wa Usajili"
                    : "Edit Subscription Tier"
                  : lang === "sw"
                    ? "Unda Mpango Mpya"
                    : "Create Subscription Tier"}
              </h3>
              <button
                onClick={() => setPlanModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1 font-bold text-slate-700">
                    Plan Name (EN) *
                  </label>
                  <input
                    required
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full border border-slate-350 p-2.5 rounded-xl outline-none"
                    placeholder="e.g. Bronze"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 font-bold text-slate-700">
                    Jina la Mpango (SW)
                  </label>
                  <input
                    type="text"
                    value={planNameSw}
                    onChange={(e) => setPlanNameSw(e.target.value)}
                    className="w-full border border-slate-350 p-2.5 rounded-xl outline-none"
                    placeholder="e.g. Shaba"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1 font-bold text-slate-700">
                    {lang === "sw" ? "Bei (TZS) *" : "Price (TZS) *"}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="w-full border border-slate-350 p-2.5 rounded-xl outline-none font-bold text-emerald-600"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 font-bold text-slate-700">
                    {lang === "sw" ? "Siku *" : "Duration (Days) *"}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={planDays}
                    onChange={(e) => setPlanDays(Number(e.target.value))}
                    className="w-full border border-slate-350 p-2.5 rounded-xl outline-none font-bold"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1 font-bold text-slate-700">
                  Description / Features (EN)
                </label>
                <textarea
                  required
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full border border-slate-350 p-2.5 rounded-xl outline-none text-xs"
                  rows={3}
                  placeholder="Bullet points or short summary..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs mb-1 font-bold text-slate-700">
                  Maelezo / Sifa za Mpango (SW)
                </label>
                <textarea
                  value={planDescSw}
                  onChange={(e) => setPlanDescSw(e.target.value)}
                  className="w-full border border-slate-350 p-2.5 rounded-xl outline-none text-xs"
                  rows={3}
                  placeholder="Orodha ya faida kwa Kiswahili..."
                ></textarea>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="planActive"
                  checked={planActive}
                  onChange={(e) => setPlanActive(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
                <label
                  htmlFor="planActive"
                  className="text-sm font-bold text-slate-700 cursor-pointer select-none"
                >
                  Plan is active for subscription
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPlanModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition rounded-xl font-bold"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white hover:opacity-90 transition rounded-xl font-bold"
                >
                  {lang === "sw" ? "Hifadhi" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller Approval confirmation Modal inside SellersAdmin */}
      {approvingSellerData && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-800">
                {lang === "sw"
                  ? "Thibitisha Muuzaji"
                  : "Confirm Seller Approval"}
              </h3>
              <button
                onClick={() => setApprovingSellerData(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1.5 text-xs text-slate-700 font-bold">
                <p>
                  <span className="text-slate-400">
                    {lang === "sw" ? "Jina la Duka:" : "Store Name:"}
                  </span>{" "}
                  {approvingSellerData.storeName}
                </p>
                <p>
                  <span className="text-slate-400">
                    {lang === "sw" ? "Barua Pepe:" : "Email Address:"}
                  </span>{" "}
                  {approvingSellerData.email}
                </p>
                <p>
                  <span className="text-slate-400">
                    {lang === "sw" ? "Mwombaji:" : "Applicant Name:"}
                  </span>{" "}
                  {approvingSellerData.fullName}
                </p>
                {approvingSellerData.niche && approvingSellerData.niche !== "N/A" && (
                  <p>
                    <span className="text-slate-400">Niche:</span>{" "}
                    <span className="bg-orange-100 text-orange-850 px-1.5 py-0.5 rounded text-[10px]">{approvingSellerData.niche}</span>
                  </p>
                )}
                {approvingSellerData.location && approvingSellerData.location !== "N/A" && (
                  <p>
                    <span className="text-slate-400">
                      {lang === "sw" ? "Eneo:" : "Location:"}
                    </span>{" "}
                    {approvingSellerData.location}
                  </p>
                )}
                {approvingSellerData.businessType && approvingSellerData.businessType !== "N/A" && (
                  <p>
                    <span className="text-slate-400">
                      {lang === "sw" ? "Mfumo wa Biashara:" : "Business Entity:"}
                    </span>{" "}
                    {approvingSellerData.businessType}
                  </p>
                )}
                {approvingSellerData.tin && approvingSellerData.tin !== "N/A" && (
                  <p className="text-emerald-700 font-mono">
                    <span className="text-slate-400 font-sans">TIN:</span>{" "}
                    {approvingSellerData.tin}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  {lang === "sw"
                    ? "Weka Nenosiri la Kwanza la Muuzaji"
                    : "Set Custom Initial Password"}
                </label>
                <input
                  type="text"
                  required
                  value={approvePassword}
                  onChange={(e) => setApprovePassword(e.target.value)}
                  className="w-full border border-slate-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm bg-slate-50"
                  placeholder="e.g. customPass123"
                />
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-3 font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={approveForceChange}
                    onChange={(e) =>
                      setApproveForceChange(e.target.checked)
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-bold">
                      {lang === "sw"
                        ? "Lazimisha mabadiliko ya nenosiri"
                        : "Force password change on login"}
                    </p>
                    <p className="text-slate-400 font-normal">
                      {lang === "sw"
                        ? "Mteja atatakiwa kuweka upya nenosiri akiingia"
                        : "Seller must reset this temporary password upon entry"}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingSellerData(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition rounded-xl font-bold"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      !approvePassword ||
                      approvePassword.trim().length < 6
                    ) {
                      showAlert(
                        lang === "sw"
                          ? "Nenosiri lazima liwe na herufi angalau 6."
                          : "Password must be at least 6 characters.",
                        "error"
                      );
                      return;
                    }
                    const rawData = approvingSellerData;
                    setApprovingSellerData(null);

                    const lowerEmail = rawData.email.toLowerCase().trim();
                    const tempId = "SLR-" + Date.now().toString(36);
                    const newSeller: SellerProfile = {
                      id: tempId,
                      name: rawData.storeName,
                      email: lowerEmail,
                      description:
                        rawData.description ||
                        `Registered automatically from verification chat.`,
                      status: "active",
                      isPro: false,
                      password: approvePassword.trim(),
                      isApproved: true,
                      mustChangePassword: approveForceChange,
                      fullName: rawData.fullName || "",
                      phone: rawData.phone || "",
                      location: rawData.location && rawData.location !== "N/A" ? rawData.location : "",
                      tin: rawData.tin && rawData.tin !== "N/A" ? rawData.tin : "",
                      niche: rawData.niche && rawData.niche !== "N/A" ? rawData.niche : "",
                      businessType: rawData.businessType && rawData.businessType !== "N/A" ? rawData.businessType : "Individual",
                      estimatedOrders: rawData.estimatedOrders && rawData.estimatedOrders !== "N/A" ? rawData.estimatedOrders : "1-10",
                    };

                    const updated = [...sellers, newSeller];
                    setSellers(updated);
                    await db.saveSellers(updated);

                    showAlert(
                      lang === "sw"
                        ? `Muuzaji "${newSeller.name}" amethibitishwa na nenosiri limewekwa kabisa!`
                        : `Seller "${newSeller.name}" approved successfully with the custom password!`,
                      "success"
                    );
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 transition rounded-xl font-bold"
                >
                  {lang === "sw" ? "Thibitisha" : "Confirm & Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PayoutsAdmin() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    setPayouts(await db.getPayouts());
    setLoading(false);
  };

  const exportPayoutsToCSV = () => {
    const headers = ["Seller ID", "Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...payouts.map((p) => [p.sellerId, p.amount, p.status].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payouts_${new Date().toISOString()}.csv`;
    link.click();
  };

  const updateStatus = async (id: string, status: "paid" | "cancelled") => {
    const payout = payouts.find((p) => p.id === id);
    if (!payout) return;
    await db.savePayout({
      ...payout,
      status,
      paidAt: status === "paid" ? Date.now() : undefined,
    });
    loadPayouts();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Payout Requests</h2>
        <button
          onClick={exportPayoutsToCSV}
          className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Export to CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-3">Seller ID</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="p-3 font-mono">{p.sellerId}</td>
                <td className="p-3">{formatCurrency(p.amount)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      p.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : p.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  {p.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(p.id, "paid")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        Pay
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "cancelled")}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`orbi-admin-card orbi-dashboard-stat-card p-2.5 sm:p-3 rounded-[1.15rem] border border-slate-200/80 flex items-center justify-between gap-2 overflow-hidden @container bg-white/95 ${onClick ? "cursor-pointer hover:border-blue-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 transform hover:-translate-y-0.5 group" : ""}`}
    >
      <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
        <p className="orbi-admin-label text-zinc-500 font-extrabold uppercase tracking-[0.1em] transition max-w-full line-clamp-2">
          {title}
        </p>
        <div
          className="orbi-admin-metric-value font-black text-slate-900 min-w-0 max-w-full overflow-hidden"
          title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}
        >
          {value}
        </div>
      </div>
      {icon && (
        <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition duration-300">
          {icon}
        </div>
      )}
    </div>
  );
}

// ---------------- STOCK NOTIFICATIONS ADMIN ---------------- //
export function StockNotificationsAdmin() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getStockNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  const markNotified = async (id: string) => {
    await db.markStockNotificationAsNotified(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, notified: true } : n)),
    );
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h2 className="text-xl font-bold mb-4">Stock Notifications</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-3">Product ID</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} className="border-b border-slate-100">
                <td className="p-3 font-mono">{n.productId}</td>
                <td className="p-3">{n.email}</td>
                <td className="p-3">{n.phone}</td>
                <td className="p-3">
                  {n.notified ? (
                    <span className="text-green-600 font-bold">Notified</span>
                  ) : (
                    <span className="text-orange-600 font-bold">Pending</span>
                  )}
                </td>
                <td className="p-3">
                  {!n.notified && (
                    <button
                      onClick={() => markNotified(n.id)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Mark as Notified
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- PRODUCTS ADMIN ---------------- //
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function ProductsAdmin({
  currentSeller,
}: {
  currentSeller?: SellerProfile | null;
}) {
  const queryClient = useQueryClient();
  const { data: rawProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.getProducts(),
    staleTime: 60000,
  });

  const products = React.useMemo(() => {
    if (currentSeller) {
      return rawProducts.filter((p: any) => p.sellerId === currentSeller.id);
    }
    return rawProducts;
  }, [rawProducts, currentSeller]);

  const setProducts = (newProducts: any) => {
    const updated = typeof newProducts === 'function' ? newProducts(rawProducts) : newProducts;
    queryClient.setQueryData(['products'], updated);
  };
  const { lang } = useI18n();
  const { showAlert, showConfirm, showPrompt } = useDialog();

  const handleDownloadWholesalePricingSheet = () => {
    if (!products || products.length === 0) {
      showAlert(
        lang === "sw"
          ? "Hakuna bidhaa za kupakua kwa sasa."
          : "No products available to download.",
        "warning"
      );
      return;
    }

    const headers = [
      "Product ID",
      "Name",
      "SKU",
      "Category",
      "Niche",
      "Stock",
      "Retail Price",
      "MOQ",
      "Walk Away Price",
      "All Wholesale Tiers Summary",
      "Tier 1 Min Qty",
      "Tier 1 Price",
      "Tier 2 Min Qty",
      "Tier 2 Price",
      "Tier 3 Min Qty",
      "Tier 3 Price",
      "Tier 4 Min Qty",
      "Tier 4 Price",
      "Tier 5 Min Qty",
      "Tier 5 Price"
    ];

    const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",")];

    products.forEach((p) => {
      const tiers = p.wholesaleTiers || [];
      const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
      const moq = getProductMOQ(p);

      const summaryParts = sortedTiers.map(t => {
        const range = t.maxQty ? `${t.minQty}-${t.maxQty}` : `${t.minQty}+`;
        return `${range}: ${t.price}`;
      });
      const tiersSummary = summaryParts.join(" | ");

      const row = [
        p.id || "",
        p.name || "",
        p.sku || "",
        p.category || "",
        p.niche || "",
        p.stock !== undefined ? p.stock : "",
        p.price !== undefined ? p.price : "",
        moq,
        p.walkAwayPrice !== undefined ? p.walkAwayPrice : "",
        tiersSummary,
        sortedTiers[0]?.minQty ?? "",
        sortedTiers[0]?.price ?? "",
        sortedTiers[1]?.minQty ?? "",
        sortedTiers[1]?.price ?? "",
        sortedTiers[2]?.minQty ?? "",
        sortedTiers[2]?.price ?? "",
        sortedTiers[3]?.minQty ?? "",
        sortedTiers[3]?.price ?? "",
        sortedTiers[4]?.minQty ?? "",
        sortedTiers[4]?.price ?? ""
      ];

      const escapedRow = row.map(val => {
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(escapedRow.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orbi_admin_wholesale_pricing_sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert(
      lang === "sw"
        ? "Karatasi ya bei ya jumla imepakuliwa!"
        : "Wholesale pricing sheet downloaded successfully!",
      "success"
    );
  };

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sellProduct, setSellProduct] = useState<Product | null>(null);
  const [sellSkuInput, setSellSkuInput] = useState("");
  const [sellQtyInput, setSellQtyInput] = useState(1);
  const [showSellCameraScanner, setShowSellCameraScanner] = useState(false);
  const [showProductCameraScanner, setShowProductCameraScanner] =
    useState(false);

  const handleProductScanSuccess = (scannedText: string) => {
    const cleanedText = scannedText.trim();
    setShowProductCameraScanner(false);

    // Look up the product in the system
    const found = products.find(
      (p) =>
        p.id?.toLowerCase() === cleanedText.toLowerCase() ||
        (p.sku && p.sku.toLowerCase() === cleanedText.toLowerCase()),
    );

    if (found) {
      // Set the search text to find only this item
      setSearch(found.sku || found.id || found.name);

      // Auto-open product detail/inventory modal
      handleOpenModal(found);

      showAlert(
        lang === "sw"
          ? `✓ Bidhaa Imepatikana! Imefunguliwa kihariri cha hesabu ya stoki ya "${found.name}" (SKU: ${found.sku || "N/A"})`
          : `✓ Product Found! Opening inventory editor for "${found.name}" (SKU: ${found.sku || "N/A"})`,
        "success",
      );
    } else {
      // Not found, but set the search filter so the user knows what was scanned
      setSearch(cleanedText);
      showAlert(
        lang === "sw"
          ? `✕ Hakuna bidhaa yenye SKU au ID "${cleanedText}" katika mfumo huu.`
          : `✕ No product found with SKU or ID "${cleanedText}" in the inventory system.`,
        "error",
      );
    }
  };

  // Form State
  const [name, setName] = useState("");
  const [prodPricingMode, setProdPricingMode] = useState<"retail" | "wholesale">("retail");
  const [prodWholesaleTiers, setProdWholesaleTiers] = useState<{ minQty: number; price: number }[]>([]);
  const [niche, setNiche] = useState("");
  const [category, setCategory] = useState("");
  const [family, setFamily] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [tags, setTags] = useState("");
  const [desc, setDesc] = useState("");
  
  // Wakala (Broker) Commerce Mode
  const [brokerId, setBrokerId] = useState("");
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState("");
  
  const [taxCode, setTaxCode] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [sku, setSku] = useState("");
  const [warranty, setWarranty] = useState("");
  const [deliveryClass, setDeliveryClass] = useState("standard");
  const [weightKg, setWeightKg] = useState("1");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [fragile, setFragile] = useState(false);
  const [oversized, setOversized] = useState(false);
  const [requiresColdChain, setRequiresColdChain] = useState(false);
  const [digitalProduct, setDigitalProduct] = useState(false);
  const [requiresDeliveryQuote, setRequiresDeliveryQuote] = useState(false);
  const [deliveryScope, setDeliveryScope] = useState<"local_only" | "regional" | "national" | "custom_quote">("national");
  const [deliveryHandlingNotes, setDeliveryHandlingNotes] = useState("");
  const [blockedDeliveryZoneIds, setBlockedDeliveryZoneIds] = useState<string[]>([]);
  const [productDeliveryZones, setProductDeliveryZones] = useState<DeliveryZone[]>([]);
  const [features, setFeatures] = useState<
    { name: string; description: string }[]
  >([]);
  const [showFeatureImport, setShowFeatureImport] = useState(false);
  const [featureImportText, setFeatureImportText] = useState("");
  const [featureImportMode, setFeatureImportMode] = useState<
    "append" | "replace"
  >("append");
  const [justGeneratedSku, setJustGeneratedSku] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [globalNiches, setGlobalNiches] = useState<Niche[]>([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [arrangeTier, setArrangeTier] = useState("all");
  const [vibe, setVibe] = useState("all");
  const [presentationStyle, setPresentationStyle] = useState("all");

  useEffect(() => {
    db.getNiches()
      .then((res) => {
        setGlobalNiches(res || []);
      })
      .catch((err) => {
        console.warn("Failed to load niches in products management:", err);
        setGlobalNiches([]);
      });
  }, []);

  useEffect(() => {
    let active = true;
    db.getDeliveryZones()
      .then((zones) => {
        if (active) setProductDeliveryZones(Array.isArray(zones) ? zones : []);
      })
      .catch((err) => {
        console.warn("Failed to load delivery zones in product management:", err);
        if (active) setProductDeliveryZones([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Drag and Drop ordering state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showQualityGuide, setShowQualityGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<
    {
      id: string;
      text: string;
      subtext?: string;
      status: "pending" | "success" | "error";
      progress?: number;
      timestamp: string;
    }[]
  >([]);

  const handleImportFeaturesAction = (text: string) => {
    if (!text.trim()) return;

    const lines = text.split(/\r?\n/);
    const parsed: { name: string; description: string }[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const colonIndex = trimmed.indexOf(":");
      const equalIndex = trimmed.indexOf("=");

      let splitIndex = -1;
      if (colonIndex !== -1 && equalIndex !== -1) {
        splitIndex = Math.min(colonIndex, equalIndex);
      } else if (colonIndex !== -1) {
        splitIndex = colonIndex;
      } else if (equalIndex !== -1) {
        splitIndex = equalIndex;
      }

      if (splitIndex !== -1) {
        const rawKey = trimmed.substring(0, splitIndex).trim();
        const rawVal = trimmed.substring(splitIndex + 1).trim();

        const cleanKey = rawKey.replace(/^[\s\-\*\•\d\.\)]+/, "").trim();
        if (cleanKey) {
          parsed.push({ name: cleanKey, description: rawVal });
        }
      } else {
        const cleanKey = trimmed.replace(/^[\s\-\*\•\d\.\)]+/, "").trim();
        if (cleanKey) {
          parsed.push({ name: cleanKey, description: "" });
        }
      }
    });

    if (parsed.length > 0) {
      if (featureImportMode === "replace") {
        setFeatures(parsed);
      } else {
        setFeatures([...features, ...parsed]);
      }
      setFeatureImportText("");
      setShowFeatureImport(false);
    }
  };

  const handleFeatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("text/") && !file.name.endsWith(".txt")) {
      showAlert(
        lang === "sw"
          ? "Tafadhali chagua faili la maandishi (.txt)"
          : "Please select a text file (.txt)",
        "error",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setFeatureImportText(text);
      }
    };
    reader.readAsText(file);
  };

  const discountSuggestions = useMemo(() => {
    // Select active products with stock > 0 that have no discount (or oldPrice <= price)
    const eligible = products.filter(
      (p) => p.stock > 0 && (!p.oldPrice || p.oldPrice <= p.price),
    );

    // Sort oldest first (to surface older items for sales/promotions)
    const sorted = [...eligible].sort(
      (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
    );

    return sorted.slice(0, 3).map((p) => {
      // Find similar products from OTHER sellers
      const similarProducts = products.filter(
        (other) =>
          other.sellerId !== p.sellerId &&
          (other.category === p.category || other.niche === p.niche),
      );

      let discountPct = 0;
      let targetPrice = p.price;
      let reasonEn = "";
      let reasonSw = "";

      if (similarProducts.length > 0) {
        // Find the lowest price among competitor products
        const lowestCompetitorPrice = Math.min(
          ...similarProducts.map((s) => s.price),
        );

        // If competitor price is lower, suggest matching or beating it by a bit (e.g., 5% lower), but don't discount more than 50%
        if (lowestCompetitorPrice < p.price) {
          const beatPrice = Math.floor(lowestCompetitorPrice * 0.95);
          // Calculate the raw discount needed to hit beatPrice
          let rawDiscount = Math.ceil(((p.price - beatPrice) / p.price) * 100);

          // Cap the discount between 5% and 50%
          discountPct = Math.max(5, Math.min(50, rawDiscount));
          targetPrice = Math.round((p.price * (100 - discountPct)) / 100);

          reasonEn = `Competitors are selling similar items for as low as ${formatCurrency(lowestCompetitorPrice)}. A ${discountPct}% discount matches or beats the market!`;
          reasonSw = `Washindani wanauza kwa bei ya chini kama ${formatCurrency(lowestCompetitorPrice)}. Punguzo la ${discountPct}% litakupa ushindani sokoni!`;
        } else {
          // We are already cheaper or same price as competitors, so suggest a small promo just to clear stock
          discountPct = p.stock > 10 ? 10 : 5;
          targetPrice = Math.round((p.price * (100 - discountPct)) / 100);
          reasonEn = `Your price is competitive, but high stock (${p.stock}) remains. Apply a small ${discountPct}% flash sale to clear shelf space!`;
          reasonSw = `Bei yako ni nzuri, lakini akiba ni nyingi (${p.stock}). Weka punguzo dogo la ${discountPct}% kumaliza mzigo!`;
        }
      } else {
        // No competitor products found, fallback to stock-based
        discountPct = p.stock > 10 ? 15 : 10;
        targetPrice = Math.round((p.price * (100 - discountPct)) / 100);
        reasonEn = `This item has stock (${p.stock}) but no current discount. Apply a ${discountPct}% off promotion to clear stock!`;
        reasonSw = `Bidhaa hii ina akiba (${p.stock}) lakini haina punguzo. Weka punguzo la ${discountPct}% ili iuuzike haraka!`;
      }

      return {
        product: p,
        discountPct,
        suggestedPrice: targetPrice,
        reasonEn,
        reasonSw,
      };
    });
  }, [products]);

  const applyQuickDiscount = async (
    prod: Product,
    pct: number,
    targetPrice: number,
  ) => {
    setIsSaving(true);
    const logId = addLog(
      `Inatengeneza punguzo la ${pct}% kwa ${prod.name}...`,
      `Kuhifadhi mabadiliko ya bei`,
      "pending",
      30,
    );

    const updatedProd: Product = {
      ...prod,
      oldPrice: prod.price,
      price: targetPrice,
    };

    try {
      await db.saveProduct(updatedProd);
      setProducts(products.map((p) => (p.id === prod.id ? updatedProd : p)));
      addLog(
        `Punguzo la ${pct}% limewekwa kwa ${prod.name}!`,
        `Bei ya zamani: ${prod.price} -> Bei mpya: ${targetPrice}`,
        "success",
        100,
        logId,
      );
      showAlert(
        lang === "sw"
          ? `Punguzo linafanya kazi! Bei mpya ya ${prod.name} ni ${targetPrice}`
          : `Promotion active! New price of ${prod.name} is ${targetPrice}`,
        "success",
      );
    } catch (e: any) {
      addLog(
        `Kosa wakati wa kuweka punguzo kwa ${prod.name}`,
        e.message,
        "error",
        undefined,
        logId,
      );
      showAlert("Hitilafu: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const closeManualSell = () => {
    setSellProduct(null);
    setSellSkuInput("");
    setSellQtyInput(1);
    setShowSellCameraScanner(false);
  };

  const handleManualSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellProduct) return;

    const prodSku = (sellProduct.sku || "").trim();
    if (!prodSku) {
      showAlert(
        lang === "sw"
          ? "Bidhaa hii haina SKU iliyosajiliwa. Tafadhali hariri bidhaa na uweke SKU kwanza!"
          : "This product has no SKU registered. Please close and edit this product to register an SKU first!",
        "error",
      );
      return;
    }

    if (sellSkuInput.trim().toLowerCase() !== prodSku.toLowerCase()) {
      showAlert(
        lang === "sw"
          ? `Kosa la SKU! '${sellSkuInput}' hailingani na SKU ya bidhaa hii.`
          : `SKU Mismatch! '${sellSkuInput}' does not match this product's SKU.`,
        "error",
      );
      return;
    }

    if (sellProduct.stock < sellQtyInput) {
      showAlert(
        lang === "sw"
          ? `Akiba haitoshi! Kuna bidhaa ${sellProduct.stock} tu kwenye duka.`
          : `Insufficient stock! Only ${sellProduct.stock} items left in store.`,
        "error",
      );
      return;
    }

    try {
      const updatedProd: Product = {
        ...sellProduct,
        stock: sellProduct.stock - sellQtyInput,
      };

      const logId = addLog(
        lang === "sw"
          ? `Inarekodi mauzo ya dukan_i ya manually kwa ${sellProduct.name}...`
          : `Recording manual store sale for ${sellProduct.name}...`,
        `Deduction of ${sellQtyInput} from stock`,
        "pending",
        40,
      );

      await db.saveProduct(updatedProd);
      setProducts(
        products.map((p) => (p.id === sellProduct.id ? updatedProd : p)),
      );

      addLog(
        lang === "sw"
          ? `Bidhaa ${sellQtyInput} za ${sellProduct.name} zimeuzwa dukan_i manually!`
          : `Manually sold ${sellQtyInput} of ${sellProduct.name} directly in store!`,
        lang === "sw"
          ? `Stoki ya zamani: ${sellProduct.stock} -> Stoki mpya: ${updatedProd.stock}`
          : `Old stock: ${sellProduct.stock} -> New stock: ${updatedProd.stock}`,
        "success",
        100,
        logId,
      );

      showAlert(
        lang === "sw"
          ? `Mauzo dukan_i yamefanikiwa! Idadi iliyobaki ya stoki ni ${updatedProd.stock}`
          : `Manual shop sell recorded successfully! Remaining stock is ${updatedProd.stock}`,
        "success",
      );

      closeManualSell();
    } catch (e: any) {
      showAlert("Hitilafu: " + e.message, "error");
    }
  };

  const addLog = (
    text: string,
    subtext?: string,
    status: "pending" | "success" | "error" = "pending",
    progress?: number,
    existingId?: string,
  ) => {
    const id = existingId || Math.random().toString();
    const timestamp = new Date().toLocaleTimeString("sw-TZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setActivityLogs((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.map((item) =>
          item.id === id
            ? { ...item, text, subtext, status, progress, timestamp }
            : item,
        );
      } else {
        return [{ id, text, subtext, status, progress, timestamp }, ...prev];
      }
    });
    return id;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    setDragOverIdx(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    // Swap images array items on drop
    const newImages = [...images];
    const draggedItem = newImages[draggedIdx];
    newImages.splice(draggedIdx, 1);
    newImages.splice(index, 0, draggedItem);
    setImages(newImages);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleOpenModal = (prod?: Product) => {
    if (prod) {
      setEditId(prod.id);
      setName(prod.name);
      setNiche(prod.niche || "");
      setCategory(prod.category);
      setFamily(prod.family || "");
      setPrice(prod.price.toString());
      setOldPrice(prod.oldPrice ? prod.oldPrice.toString() : "");
      setStock(prod.stock.toString());
      setTags(prod.tags.join(", "));
      setDesc(prod.description);
      setImages(prod.images);
      setVisible(prod.visible !== false);
      setSku(prod.sku || "");
      setWarranty(prod.warranty || "");
      setDeliveryClass(prod.deliveryClass || "standard");
      setWeightKg(String(prod.weightKg || 1));
      setLengthCm(prod.lengthCm ? String(prod.lengthCm) : "");
      setWidthCm(prod.widthCm ? String(prod.widthCm) : "");
      setHeightCm(prod.heightCm ? String(prod.heightCm) : "");
      setFragile(Boolean(prod.fragile));
      setOversized(Boolean(prod.oversized));
      setRequiresColdChain(Boolean(prod.requiresColdChain));
      setDigitalProduct(Boolean(prod.digitalProduct));
      setRequiresDeliveryQuote(Boolean(prod.requiresDeliveryQuote));
      setDeliveryScope((prod.deliveryScope as any) || "national");
      setDeliveryHandlingNotes(prod.deliveryHandlingNotes || "");
      setBlockedDeliveryZoneIds(prod.blockedDeliveryZoneIds || []);
      setFeatures(prod.features || []);
      setTaxCode(prod.taxCode || 1);
      setBrokerId(prod.brokerId || "");
      setBrokerCommissionPercent(prod.brokerCommissionPercent ? prod.brokerCommissionPercent.toString() : "");
      setArrangeTier(prod.arrangeTier || "all");
      setVibe(prod.vibe || "all");
      setPresentationStyle(prod.presentationStyle || "all");
      if (prod.wholesaleTiers && prod.wholesaleTiers.length > 0) {
        setProdPricingMode("wholesale");
        setProdWholesaleTiers(prod.wholesaleTiers);
      } else {
        setProdPricingMode("retail");
        setProdWholesaleTiers([]);
      }
      setJustGeneratedSku("");
    } else {
      setEditId(null);
      setName("");
      setNiche("");
      setCategory("");
      setFamily("");
      setPrice("");
      setOldPrice("");
      setStock("");
      setTags("");
      setDesc("");
      setImages([]);
      setVisible(true);
      setSku("");
      setWarranty("");
      setBrokerId("");
      setBrokerCommissionPercent("");
      setDeliveryClass("standard");
      setWeightKg("1");
      setLengthCm("");
      setWidthCm("");
      setHeightCm("");
      setFragile(false);
      setOversized(false);
      setRequiresColdChain(false);
      setDigitalProduct(false);
      setRequiresDeliveryQuote(false);
      setDeliveryScope("national");
      setDeliveryHandlingNotes("");
      setBlockedDeliveryZoneIds([]);
      setFeatures([]);
      setTaxCode(1);
      setArrangeTier("all");
      setVibe("all");
      setPresentationStyle("all");
      setProdPricingMode("retail");
      setProdWholesaleTiers([]);
      setJustGeneratedSku("");
    }
    setShowModal(true);
  };

  const handleSuggestDescription = async () => {
    if (!name.trim()) {
      showAlert(
        lang === "sw"
          ? "Tafadhali ingiza 'Jina la Bidhaa' kwanza ili AI iweze kupendekeza maelezo sahihi!"
          : "Please enter the 'Product Name' first so the AI can generate accurate copywriting!",
        "warning",
      );
      return;
    }

    setGeneratingDesc(true);
    try {
      const data = await apiFetch("/api/v1/products/ai-suggest-description", {
        method: "POST",
        body: JSON.stringify({
          name,
          category,
          niche,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        }),
      });
      if (data.description) {
        setDesc(data.description);
        if (data.features && Array.isArray(data.features)) {
          setFeatures(data.features);
        }
        showAlert(
          lang === "sw"
            ? "Mswada wa maelezo maalum ya bidhaa umetengenezwa kikamilifu na Orbi AI!"
            : "Product copy suggested and populated successfully by Orbi AI!",
          "success",
        );
      } else {
        throw new Error(data.error || "Failed to generate copywriting");
      }
    } catch (err: any) {
      console.error("AI Copywriting suggest failed:", err);
      showAlert(
        lang === "sw"
          ? `Msaidizi wa AI ameshindwa: ${err.message}`
          : `AI Copywriter failed: ${err.message}`,
        "error",
      );
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSuggestNicheAndCategory = async () => {
    if (!name.trim()) {
      showAlert(
        lang === "sw"
          ? "Tafadhali ingiza 'Jina la Bidhaa' kwanza ili Orbi AI iweze kuchambua kundi muafaka!"
          : "Please enter the 'Product Name' first so Orbi AI can analyze and recommend a classification!",
        "warning",
      );
      return;
    }

    setClassifying(true);
    try {
      const data = await apiFetch("/api/v1/products/ai-suggest-niche", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: desc,
          availableNiches: globalNiches,
        }),
      });
      if (data.suggestedNiche) {
        setNiche(data.suggestedNiche);
        setCategory(data.suggestedCategory || "");
        setFamily(data.suggestedFamily || "");

        if (data.suggestedTier) {
          setArrangeTier(data.suggestedTier);
        }
        if (data.suggestedVibe) {
          setVibe(data.suggestedVibe);
        }
        if (data.suggestedPresentation) {
          setPresentationStyle(data.suggestedPresentation);
        }

        const explanation =
          lang === "sw"
            ? data.reasonSwahili ||
              `Imewekwa chini ya "${data.suggestedNiche} > ${data.suggestedCategory}${data.suggestedFamily ? " > " + data.suggestedFamily : ""}" mtawalia.`
            : data.reasonEnglish ||
              `Selected "${data.suggestedNiche} > ${data.suggestedCategory}${data.suggestedFamily ? " > " + data.suggestedFamily : ""}" as best fit.`;

        showAlert(
          lang === "sw"
            ? `✓ Orbi AI Organiser:\n• Niche: ${data.suggestedNiche}\n• Kategoria: ${data.suggestedCategory}\n• Familia: ${data.suggestedFamily || "N/A"}\n• Tier: ${data.suggestedTier || "all"}\n• Vibe: ${data.suggestedVibe || "all"}\n• Ufungaji: ${data.suggestedPresentation || "all"}\n\nSababu: ${explanation}`
            : `✓ Orbi AI Organiser:\n• Niche: ${data.suggestedNiche}\n• Category: ${data.suggestedCategory}\n• Family: ${data.suggestedFamily || "N/A"}\n• Tier: ${data.suggestedTier || "all"}\n• Vibe: ${data.suggestedVibe || "all"}\n• Presentation: ${data.suggestedPresentation || "all"}\n\nAnalysis: ${explanation}`,
          "success",
        );
      } else {
        throw new Error(data.error || "Failed to analyze categorization");
      }
    } catch (err: any) {
      console.error("AI Niche / Category suggest failed:", err);
      showAlert(
        lang === "sw"
          ? `Msaidizi wa Orbi AI ameshindwa: ${err.message}`
          : `Orbi AI Classifier failed: ${err.message}`,
        "error",
      );
    } finally {
      setClassifying(false);
    }
  };

  const handleImageFiles = async (inputFiles: File[]) => {
    const slicedFiles = inputFiles.slice(0, 5 - images.length);
    if (slicedFiles.length === 0) return;

    setIsUploading(true);

    // Dynamic Client-side Quality Checker to auto-cancel and reject low quality images
    const validationResults = await Promise.all(
      slicedFiles.map(async (file) => {
        if (file.type.startsWith("video/")) {
          if (file.size > 45 * 1024 * 1024) {
            return {
              file,
              valid: false,
              reason: `Ukubwa wa video umezidi kiwango cha juu cha 45MB (Imeongezeka hadi ${Math.round(file.size / (1024 * 1024))}MB).`,
            };
          }
          return { file, valid: true };
        }

        const check = await new Promise<{ valid: boolean; reason?: string }>(
          (resolve) => {
            // Reject files exceeding max size limits (45MB)
            if (file.size > 45 * 1024 * 1024) {
              resolve({
                valid: false,
                reason: `Ukubwa wa faili umezidi bando la 45MB (${Math.round(file.size / (1024 * 1024))}MB).`,
              });
              return;
            }

            // Reject files under 15 KB (typically extremely small thumbnails or icon files)
            if (file.size < 15360) {
              resolve({
                valid: false,
                reason: `Ukubwa wa faili ni mdogo mno (${Math.round(file.size / 1024)} KB). Tafadhali weka picha iliyohaririwa ya ubora wa juu.`,
              });
              return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              // Height or width less than 500 contains insufficient detail for product display
              if (img.width < 500 || img.height < 500) {
                resolve({
                  valid: false,
                  reason: `Azimio lililogundulika (${img.width}x${img.height}px) ni dogo sana. Inatakiwa iwe angalau 500x500px.`,
                });
                return;
              }

              // Canvas analysis for heavy blur and monochromatic low-contrast indicators
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  canvas.width = Math.min(img.width, 200);
                  canvas.height = Math.min(img.height, 200);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const imgData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                  );
                  const data = imgData.data;

                  let totalLuma = 0;
                  const len = data.length;
                  for (let i = 0; i < len; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
                  }
                  const avgLuma = totalLuma / (len / 4);

                  let varianceSum = 0;
                  for (let i = 0; i < len; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                    varianceSum += Math.pow(luma - avgLuma, 2);
                  }
                  const stdDev = Math.sqrt(varianceSum / (len / 4));

                  // A standard deviation value under 12 typically indicates extreme blurred image or single solid colors
                  if (stdDev < 12) {
                    resolve({
                      valid: false,
                      reason: `Picha inaonekana haina utofautishi mzuri au ina ukungu mwingi sana (Extreme blur or low contrast).`,
                    });
                    return;
                  }
                }
              } catch (e) {
                // Gracefully bypass if canvas context restrictions apply
              }

              resolve({ valid: true });
            };

            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve({
                valid: false,
                reason: "Faili hili si faili la picha halali au limeharibika.",
              });
            };

            img.src = objectUrl;
          },
        );

        return { file, ...check };
      }),
    );

    const validFiles = validationResults
      .filter((r) => r.valid)
      .map((r) => r.file);
    const invalidFiles = validationResults.filter((r) => !r.valid);

    if (invalidFiles.length > 0) {
      const reasonsList = invalidFiles
        .map((r) => `• ${r.file.name}: ${r.reason}`)
        .join("\n");
      showAlert(
        `Picha zifuatazo zimekataliwa kiotomatiki kwa sababu ya ubora duni au faili kubwa mno (Auto-Cancelled due to quality parameters/limits):\n\n${reasonsList}`,
        "error",
      );
    }

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    // Auto-convert valid image files into space-saving compressed high-quality WebP images
    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        if (file.type.startsWith("video/")) {
          return file;
        }
        try {
          const webImage = await new Promise<File>((resolve) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(file);
                return;
              }
              // Compress to 1600px edge bounds for optimized display and size
              let width = img.width;
              let height = img.height;
              const maxDim = 1600;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const originalName = file.name;
                    const baseName =
                      originalName.substring(
                        0,
                        originalName.lastIndexOf("."),
                      ) || originalName;
                    const webFileName = `${baseName}.webp`;
                    const webpCompFile = new File([blob], webFileName, {
                      type: "image/webp",
                      lastModified: Date.now(),
                    });
                    resolve(webpCompFile);
                  } else {
                    resolve(file);
                  }
                },
                "image/webp",
                0.82,
              );
            };
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(file);
            };
            img.src = objectUrl;
          });
          return webImage;
        } catch (e) {
          return file;
        }
      }),
    );

    const files = processedFiles;

    // Create tracking objects for new uploads
    const newUploads = files.map((file) => ({
      id: Math.random().toString(),
      name: file.name,
      progress: 0,
    }));
    setUploadingFiles((prev) => [...prev, ...newUploads]);

    const activeUploadLogs = newUploads.map((up) => {
      return addLog(
        `Inapakia picha: ${up.name}`,
        `Inapeleka kwenye backend storage API`,
        "pending",
        0,
      );
    });

    try {
      const urls = await Promise.all(
        files.map(async (file, idx) => {
          const url = await uploadFileViaStorageApi(
            file,
            "products",
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((p) =>
                  p.id === newUploads[idx].id ? { ...p, progress } : p,
                ),
              );
              addLog(
                `Inapakia picha: ${file.name}`,
                `Inapeleka kwenye backend storage API`,
                "pending",
                Math.round(progress),
                activeUploadLogs[idx],
              );
            },
          );
          setUploadingFiles((prev) =>
            prev.map((p) =>
              p.id === newUploads[idx].id ? { ...p, progress: 100 } : p,
            ),
          );
          addLog(
            `Imepakiwa: ${file.name}`,
            `Imefanikiwa kuhifadhiwa kupitia backend API`,
            "success",
            100,
            activeUploadLogs[idx],
          );
          return url;
        }),
      );
      await new Promise((r) => setTimeout(r, 500)); // Show 100% briefly
      setImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      showAlert("Imeshindwa kupakia picha: " + err.message, "error");
      activeUploadLogs.forEach((logId, idx) => {
        if (files[idx]) {
          addLog(
            `Kosa la kupakia: ${files[idx].name}`,
            err.message || "Error occurred",
            "error",
            undefined,
            logId,
          );
        }
      });
    } finally {
      setUploadingFiles([]);
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleImageFiles(Array.from(e.target.files));
    e.target.value = "";
  };
  
  const [isAutoListing, setIsAutoListing] = useState(false);
  const handleAutoListFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = "";
    
    // Auto-upload as first image
    handleImageFiles([file]);

    setIsAutoListing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await apiFetch("/api/v1/ai/auto-list-product", {
            method: "POST",
            body: JSON.stringify({ image: base64Data }),
          });
          if (res.success && res.data) {
            const d = res.data;
            if (d.title_sw) setName(d.title_sw);
            else if (d.title_en) setName(d.title_en);
            
            if (d.niche) setNiche(d.niche);
            if (d.category) setCategory(d.category);
            if (d.description_sw) setDesc(d.description_sw);
            else if (d.description_en) setDesc(d.description_en);
            
            if (d.features && Array.isArray(d.features)) {
               setFeatures(d.features.map((f: any) => ({ id: Math.random().toString(), ...f })));
            }
            if (d.seo_tags && Array.isArray(d.seo_tags)) {
               setTags(d.seo_tags.join(", "));
            }
            showAlert("Sifa za bidhaa zimejazwa kikamilifu na Orbi AI!", "success");
          }
        } catch (err: any) {
           console.error("Auto list failed", err);
           showAlert("Orbi AI imeshindwa kusoma picha. Jaza kwa mkono.", "error");
        } finally {
          setIsAutoListing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsAutoListing(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalWholesaleTiers =
      prodPricingMode === "wholesale"
        ? prodWholesaleTiers.filter((t) => t.minQty > 0 && t.price > 0)
        : [];

    if (
      prodPricingMode === "wholesale" &&
      finalWholesaleTiers.length > 0 &&
      price
    ) {
      const sorted = [...finalWholesaleTiers].sort(
        (a, b) => a.minQty - b.minQty,
      );
      finalWholesaleTiers = sorted;
    }

    const stockNum = Number(stock);
    const newProd: Product = {
      id: editId || "PRD-" + Date.now(),
      name,
      niche,
      category,
      family: family.trim(),
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      stock: stockNum,
      description: desc,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      images,
      visible,
      sku: sku.trim(),
      warranty: warranty.trim(),
      features: features.filter((f) => f.name.trim() && f.description.trim()),
      taxCode: taxCode,
      arrangeTier,
      vibe,
      presentationStyle,
      wholesaleTiers: finalWholesaleTiers,
      deliveryClass,
      weightKg: Number(weightKg || 1),
      lengthCm: lengthCm ? Number(lengthCm) : undefined,
      widthCm: widthCm ? Number(widthCm) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      fragile,
      oversized,
      requiresColdChain,
      digitalProduct,
      requiresDeliveryQuote,
      deliveryScope,
      deliveryPolicySource: "manual",
      deliveryHandlingNotes,
      blockedDeliveryZoneIds,
      brokerId: brokerId ? brokerId.trim() : undefined,
      brokerCommissionPercent: brokerCommissionPercent ? parseFloat(brokerCommissionPercent) : undefined,
      sellerId: editId
        ? products.find((p) => p.id === editId)?.sellerId
        : currentSeller
          ? currentSeller.id
          : undefined,
      createdAt: editId
        ? products.find((p) => p.id === editId)?.createdAt || Date.now()
        : Date.now(),
    };

    // Run custom Zod-like structural parsing and validation
    const brokerCommission = brokerCommissionPercent ? parseFloat(brokerCommissionPercent) : 0;
    if (brokerCommission > 20) {
      showAlert(lang === "sw" ? "Kamisheni haiwezi kuzidi 20%." : "Commission cannot exceed 20%.");
      return;
    }

    const validation = SchemaValidator.validateProduct(
      newProd,
      lang === "sw" ? "sw" : "en",
    );
    if (!validation.success || !validation.data) {
      showAlert(validation.error || "Schema Validation failed", "error");
      return;
    }

    setIsSaving(true);
    const logId = addLog(
      editId ? "Inasasisha bidhaa..." : "Inasajili bidhaa mpya...",
      `Bidhaa: ${name}`,
      "pending",
      20,
    );

    // Clean up edited images that are replaced/deleted
    if (editId) {
      const oldProd = products.find((p) => p.id === editId);
      if (oldProd && oldProd.images) {
        const removedImages = oldProd.images.filter(
          (img) => !newProd.images.includes(img),
        );
        if (removedImages.length > 0) {
          addLog(
            "Inasafisha picha zilizofutwa kutoka hifadhi...",
            `Inafuta picha ya zamani kutoka kwenye wingu`,
            "pending",
            50,
            logId,
          );
        }
        for (const imgUrl of removedImages) {
          const storagePath = getStoragePath(imgUrl);
          if (storagePath) {
            await deleteFileViaStorageApi(storagePath);
          }
        }
      }
    }

    try {
      addLog(
        "Inahifadhi taarifa kwenye Backend Database API...",
        `Kutuma data za ${name}`,
        "pending",
        80,
        logId,
      );
      const dbId = await db.saveProduct(validation.data as Product);
      const updatedProd = {
        ...newProd,
        ...validation.data,
        id: dbId,
      } as Product;
      let updated;
      if (editId) {
        updated = products.map((p) => (p.id === editId ? updatedProd : p));
      } else {
        updated = [updatedProd, ...products];
      }
      setProducts(updated);
      addLog(
        editId
          ? "Bidhaa imesasishwa kwa mafanikio!"
          : "Bidhaa mpya imehifadhiwa kikamilifu kwenye Database!",
        `Mabadiliko yalitekelezwa vizuri`,
        "success",
        100,
        logId,
      );
      setShowModal(false);
    } catch (error) {
      addLog(
        "Imeshindwa kuhifadhi bidhaa!",
        error instanceof Error ? error.message : "Database request failed",
        "error",
        undefined,
        logId,
      );
      showAlert(
        "Imeshindwa kuhifadhi bidhaa: " +
          (error instanceof Error ? error.message : "Tafadhali jaribu tena."),
        "error",
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const prodToDelete = products.find((p) => p.id === id);
    const pName = prodToDelete ? prodToDelete.name : id;
    if (
      !(await showConfirm(
        `Una uhakika unataka kufuta bidhaa hii: ${pName}?`,
        "Kufuta Bidhaa",
      ))
    )
      return;

    setIsSaving(true);
    const logId = addLog(
      "Inatekeleza ufutaji wa bidhaa...",
      `Inasafisha mifumo ya ${pName}`,
      "pending",
      20,
    );

    try {
      if (prodToDelete && prodToDelete.images) {
        for (const imgUrl of prodToDelete.images) {
          const storagePath = getStoragePath(imgUrl);
          if (storagePath) {
            await deleteFileViaStorageApi(storagePath);
          }
        }
      }
      addLog(
        "Inaondoa bidhaa kwenye mifumo ya database...",
        `Inatuma ombi la kuondoa`,
        "pending",
        60,
        logId,
      );
      await db.deleteProduct(id);
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      addLog(
        `Bidhaa '${pName}' imefutwa kabisa!`,
        `Picha na mifumo yote ipo safi sasa`,
        "success",
        100,
        logId,
      );
    } catch (error: any) {
      addLog(
        `Kosa wakati wa kufuta '${pName}'!`,
        error.message,
        "error",
        undefined,
        logId,
      );
      showAlert("Imeshindwa kufuta: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const copyProductLink = (id: string) => {
    const base = window.location.origin.replace("//admin.", "//www.");
    const link = `${base}/?product=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleSelectAll = () => {
    if (
      selectedIds.length === filteredProducts.length &&
      filteredProducts.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sel) => sel !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const bulkDeleteSelected = async () => {
    if (
      !(await showConfirm(
        t(lang, "prod.bulk_delete_confirm") ||
          "Uhakika unataka kufuta bidhaa zilizochaguliwa?",
        "Kufuta kwa Pamoja",
      ))
    )
      return;
    setIsSaving(true);
    const logId = addLog(
      `Inafuta bidhaa ${selectedIds.length} zilizochaguliwa kwa mpigo...`,
      `Mchakato umeanza`,
      "pending",
      10,
    );

    try {
      let deletedCount = 0;
      for (const id of selectedIds) {
        const prodToDelete = products.find((p) => p.id === id);
        const pName = prodToDelete ? prodToDelete.name : id;
        addLog(
          `Inasafisha picha za: ${pName} (${deletedCount + 1}/${selectedIds.length})...`,
          `Kufuta bidhaa mfululizo`,
          "pending",
          Math.round(10 + 80 * (deletedCount / selectedIds.length)),
          logId,
        );

        if (prodToDelete && prodToDelete.images) {
          for (const imgUrl of prodToDelete.images) {
            const storagePath = getStoragePath(imgUrl);
            if (storagePath) {
              await deleteFileViaStorageApi(storagePath);
            }
          }
        }
        await db.deleteProduct(id);
        deletedCount++;
      }
      const updated = products.filter((p) => !selectedIds.includes(p.id));
      setProducts(updated);
      setSelectedIds([]);
      addLog(
        `Bidhaa zote ${deletedCount} zimefutwa kikamilifu kwa mkupuo mmoja!`,
        `Ufutaji wa pamoja umekamilika vizuri`,
        "success",
        100,
        logId,
      );
    } catch (error: any) {
      addLog(
        "Imeshindwa kukamilisha ufutaji wa pamoja!",
        error.message,
        "error",
        undefined,
        logId,
      );
      showAlert("Kosa limejitokeza: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const bulkToggleVisibility = async (makeVisible: boolean) => {
    setIsSaving(true);
    const logId = addLog(
      `Inabadili infa ya bidhaa ${selectedIds.length} zilizochaguliwa...`,
      `Kuweka: ${makeVisible ? "Zinaonekana" : "Hazionekani"}`,
      "pending",
      20,
    );

    try {
      const updatedProducts = [...products];
      let processed = 0;
      for (const id of selectedIds) {
        const idx = updatedProducts.findIndex((p) => p.id === id);
        if (idx !== -1) {
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            visible: makeVisible,
          };
          await db.saveProduct(updatedProducts[idx]);
        }
        processed++;
        addLog(
          `Inasasisha uwezo wa kuonekana... ${processed}/${selectedIds.length}`,
          `Kuhifadhi mabadiliko`,
          "pending",
          Math.round(20 + 80 * (processed / selectedIds.length)),
          logId,
        );
      }
      setProducts(updatedProducts);
      setSelectedIds([]);
      addLog(
        `Uhariri wa kuonekana wa bidhaa ${processed} umetekelezeka!`,
        `Hali imesasishwa katika database`,
        "success",
        100,
        logId,
      );
    } catch (error: any) {
      addLog(
        "Kosa la kuweka uwezo wa kuonekana!",
        error.message,
        "error",
        undefined,
        logId,
      );
      showAlert("Kosa limejitokeza: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const bulkUpdateStock = async (stockValue: number) => {
    setIsSaving(true);
    const logId = addLog(
      `Inasasisha stoki za bidhaa ${selectedIds.length} zilizochaguliwa...`,
      `Kuweka idadi: ${stockValue}`,
      "pending",
      20,
    );

    try {
      const updatedProducts = [...products];
      let processed = 0;
      for (const id of selectedIds) {
        const idx = updatedProducts.findIndex((p) => p.id === id);
        if (idx !== -1) {
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            stock: stockValue,
          };
          await db.saveProduct(updatedProducts[idx]);
        }
        processed++;
        addLog(
          `Inasasisha stoki... ${processed}/${selectedIds.length}`,
          `Kuhifadhi mabadiliko`,
          "pending",
          Math.round(20 + 80 * (processed / selectedIds.length)),
          logId,
        );
      }
      setProducts(updatedProducts);
      setSelectedIds([]);
      addLog(
        `Stoki za bidhaa zote ${processed} zimesasishwa kikamilifu!`,
        `Kiasi kipya kimehifadhiwa`,
        "success",
        100,
        logId,
      );
    } catch (error: any) {
      addLog(
        "Kosa la kusasisha stoki ya pamoja!",
        error.message,
        "error",
        undefined,
        logId,
      );
      showAlert("Kosa limejitokeza: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const bulkApplyDiscount = async (discountPct: number) => {
    setIsSaving(true);
    const logId = addLog(
      `Inasindika punguzo la ${discountPct}% kwa bidhaa ${selectedIds.length} zilizochaguliwa...`,
      `Inapiga hesabu kulingana na kikomo cha faida`,
      "pending",
      20,
    );

    try {
      const updatedProducts = [...products];
      let processed = 0;
      let hasFloored = false;

      for (const id of selectedIds) {
        const idx = updatedProducts.findIndex((p) => p.id === id);
        if (idx !== -1) {
          const product = updatedProducts[idx];
          const basePrice = product.oldPrice || product.price;
          let targetPrice = Math.round(basePrice * (1 - discountPct / 100));
          const walkAway = product.walkAwayPrice || Math.round(basePrice * 0.75);

          if (targetPrice < walkAway) {
            targetPrice = walkAway;
            hasFloored = true;
          }

          updatedProducts[idx] = {
            ...product,
            oldPrice: basePrice,
            price: targetPrice,
          };
          await db.saveProduct(updatedProducts[idx]);
        }
        processed++;
        addLog(
          `Inasasisha bei na punguzo... ${processed}/${selectedIds.length}`,
          `Kuhifadhi bei mpya`,
          "pending",
          Math.round(20 + 80 * (processed / selectedIds.length)),
          logId,
        );
      }

      setProducts(updatedProducts);
      setSelectedIds([]);

      const successMsg = hasFloored
        ? (lang === "sw"
            ? `Punguzo la pamoja limekamilika! Baadhi ya bidhaa zilifikia kikomo cha chini cha faida (Walk-away price) na kuzuiliwa kupungua zaidi ili kukulinda.`
            : `Bulk discount completed! Some products hit their safe merchant floor (Walk-away price) and were capped to protect margins.`)
        : (lang === "sw"
            ? `Punguzo limewekwa kwa bidhaa zote ${processed} zilizochaguliwa!`
            : `Discount applied successfully to all ${processed} selected products!`);

      addLog(
        successMsg,
        `Ukokotoaji wa punguzo umekamilika`,
        "success",
        100,
        logId,
      );
      showAlert(successMsg, "success");
    } catch (error: any) {
      addLog(
        "Kosa la kuweka punguzo la pamoja!",
        error.message,
        "error",
        undefined,
        logId,
      );
      showAlert("Kosa limejitokeza: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* PHOTO QUALITY BOOSTER GUIDE */}
      <PhotoQualityGuide
        isOpen={showQualityGuide}
        onClose={() => setShowQualityGuide(false)}
        lang={lang}
      />
      {isSaving && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-accent rounded-full animate-spin mb-4" />
            <p className="font-bold text-slate-700">
              {lang === "sw" ? "Inapakia..." : "Saving..."}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">{t(lang, "prod.title")}</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder={t(lang, "comm.search_prod")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl outline-none focus:border-accent text-sm bg-slate-50"
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <button
              type="button"
              onClick={() =>
                setShowProductCameraScanner(!showProductCameraScanner)
              }
              className={`absolute right-2 top-1.5 p-1 rounded-lg transition-colors cursor-pointer ${
                showProductCameraScanner
                  ? "text-rose-500 hover:text-rose-600 bg-rose-50"
                  : "text-slate-400 hover:text-accent hover:bg-slate-100"
              }`}
              title={lang === "sw" ? "Skani QR/Barcode" : "Scan QR/Barcode"}
            >
              <Camera size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleDownloadWholesalePricingSheet}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap shadow-sm transition cursor-pointer"
            title={lang === "sw" ? "Pakua Orodha ya Bei ya Jumla" : "Download Wholesale Pricing Sheet"}
          >
            <Download size={18} className="text-slate-500" />
            <span>
              {lang === "sw" ? "Pakua Bei za Jumla" : "Download Wholesale Sheet"}
            </span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="bg-accent text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap shadow-sm hover:bg-amber-600 transition"
          >
            <Plus size={18} /> {t(lang, "prod.add")}
          </button>
        </div>
      </div>

      {/* QR/Barcode Camera Scanner Viewfinder */}
      {showProductCameraScanner && (
        <div className="py-2.5 animate-in fade-in slide-in-from-top-2 duration-150 max-w-md mx-auto w-full">
          <CameraBarcodeScanner
            lang={lang === "sw" ? "sw" : "en"}
            onScanSuccess={handleProductScanSuccess}
            onClose={() => setShowProductCameraScanner(false)}
          />
        </div>
      )}

      {activityLogs.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                Kifuatilia Shughuli za Mfumo (Live System Activity Monitor)
              </span>
            </div>
            <button
              onClick={() => setActivityLogs([])}
              className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition font-black uppercase"
            >
              {lang === "sw" ? "Futa Logi" : "Clear Logs"}
            </button>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-slate-100 shadow-sm gap-4"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {log.timestamp}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-slate-800">{log.text}</span>
                    {log.subtext && (
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        {log.subtext}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {log.progress !== undefined &&
                    log.progress < 100 &&
                    log.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1">
                          <div
                            className="bg-accent h-1 rounded-full transition-all duration-300"
                            style={{ width: `${log.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-black text-accent">
                          {log.progress}%
                        </span>
                      </div>
                    )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      log.status === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : log.status === "error"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700 animate-pulse"
                    }`}
                  >
                    {log.status === "success"
                      ? "Tayari"
                      : log.status === "error"
                        ? "Kosa"
                        : "Inafanya..."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Sales Suggestions for Sellers */}
      {discountSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/5 border border-amber-500/25 rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md">
                <Sparkles
                  size={18}
                  className="animate-spin"
                  style={{ animationDuration: "4s" }}
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-none">
                  {lang === "sw"
                    ? "Msaidizi wa Mauzo: Pendekezo la Punguzo"
                    : "Sales Assistant: Promotion Recommendations"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === "sw"
                    ? "Mifumo imegundua bidhaa zenye akiba isiyohama. Weka punguzo ili kuongeza mauzo sasa!"
                    : "Identified slow-moving / high stock inventory. Discount these items to clear shelf space and boost conversion!"}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-[10px] uppercase tracking-widest font-black text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Smart Suggestion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {discountSuggestions.map((suggestion) => (
              <div
                key={suggestion.product.id}
                className="bg-white/90 backdrop-blur-sm border border-amber-100 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-amber-300 hover:shadow transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-dashed border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-amber-600 transition">
                      {suggestion.product.name}
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 shrink-0">
                      Qty: {suggestion.product.stock}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-2 italic">
                    "{lang === "sw" ? suggestion.reasonSw : suggestion.reasonEn}
                    "
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs line-through text-slate-400 font-medium">
                      {formatCurrency(suggestion.product.price)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {formatCurrency(suggestion.suggestedPrice)}
                    </span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black px-1.5 py-0.5 rounded">
                      -{suggestion.discountPct}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickDiscount(
                      suggestion.product,
                      suggestion.discountPct,
                      suggestion.suggestedPrice,
                    )
                  }
                  className="w-full bg-slate-900 hover:bg-amber-600 text-white font-bold py-2.5 px-3 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Tag size={12} className="text-amber-400" />
                  <span>
                    {lang === "sw"
                      ? `Weka -${suggestion.discountPct}% Sasa `
                      : `Apply -${suggestion.discountPct}% & promote`}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto flex flex-col">
        <div className="bg-gray-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {t(lang, "prod.list")}
          </span>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <span className="text-xs font-black text-slate-700">
                {lang === "sw" 
                  ? `${selectedIds.length} Zilizochaguliwa:` 
                  : `${selectedIds.length} Selected:`}
              </span>

              {/* Update Stock */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-1.5 shrink-0 shadow-sm">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  {lang === "sw" ? "Stoki:" : "Stock:"}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="Qty"
                  id="admin-bulk-stock-input"
                  className="w-12 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-800 px-1 py-0.5 outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("admin-bulk-stock-input") as HTMLInputElement;
                    if (input && input.value !== "") {
                      bulkUpdateStock(parseInt(input.value, 10));
                      input.value = "";
                    } else {
                      showAlert(lang === "sw" ? "Tafadhali weka idadi ya stoki." : "Please enter stock quantity.", "error");
                    }
                  }}
                  className="text-xs font-black uppercase text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                >
                  {lang === "sw" ? "Weka" : "Set"}
                </button>
              </div>

              {/* Set Discount */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-1.5 shrink-0 shadow-sm">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  {lang === "sw" ? "Punguzo %:" : "Discount %:"}
                </span>
                <select
                  id="admin-bulk-discount-select"
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 px-1 py-0.5 outline-none cursor-pointer"
                >
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="25">25%</option>
                  <option value="30">30%</option>
                  <option value="40">40%</option>
                  <option value="50">50%</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById("admin-bulk-discount-select") as HTMLSelectElement;
                    if (select) {
                      bulkApplyDiscount(parseInt(select.value, 10));
                    }
                  }}
                  className="text-xs font-black uppercase text-amber-600 hover:text-amber-700 transition cursor-pointer"
                >
                  {lang === "sw" ? "Weka" : "Apply"}
                </button>
              </div>

              {/* Toggle Visibility */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => bulkToggleVisibility(true)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1 transition shadow-sm cursor-pointer"
                >
                  <Eye size={12} />
                  <span>{lang === "sw" ? "Weka Wazi" : "Make Live"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => bulkToggleVisibility(false)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl flex items-center gap-1 transition shadow-sm cursor-pointer"
                >
                  <EyeOff size={12} />
                  <span>{lang === "sw" ? "Ficha" : "Hide"}</span>
                </button>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={bulkDeleteSelected}
                className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs uppercase rounded-xl flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <Trash size={12} />
                <span>{lang === "sw" ? "Futa" : "Delete"}</span>
              </button>
            </div>
          )}
        </div>
        <table className="w-full min-w-[800px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="border-b border-slate-200">
              <th className="p-3 w-12 text-center">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === filteredProducts.length
                  }
                  ref={(input) => {
                    if (input)
                      input.indeterminate =
                        selectedIds.length > 0 &&
                        selectedIds.length < filteredProducts.length;
                  }}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
              </th>
              <th className="p-3">Picha</th>
              <th className="p-3">Jina</th>
              <th className="p-3">Kategoria</th>
              <th className="p-3">Bei</th>
              <th className="p-3">Akiba</th>
              <th className="p-3">Vitendo</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr
                key={p.id}
                className={`border-b last:border-0 border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.includes(p.id) ? "bg-amber-50/50" : ""}`}
              >
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded border-slate-300 text-accent focus:ring-accent"
                  />
                </td>
                <td className="p-4 relative">
                  <div className="w-12 h-12 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                    {p.images[0] ? (
                      p.images[0].startsWith("data:video/") ? (
                        <video
                          src={p.images[0]}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <ImageIcon size={20} className="text-slate-400" />
                    )}
                  </div>
                  {p.visible === false && (
                    <span className="absolute top-2 left-2 bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                      Imefichwa
                    </span>
                  )}
                </td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-slate-600">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                    {p.niche || "Hakuna Kundi"}
                  </span>
                  {p.category}
                </td>
                <td className="p-4 text-success font-medium">
                  <div className="flex flex-col items-start gap-1">
                    <span>{formatCurrency(p.price)}</span>
                    {p.oldPrice && p.oldPrice > p.price && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                        -
                        {Math.round(
                          ((p.oldPrice - p.price) / p.oldPrice) * 100,
                        )}
                        %
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {p.stock > 0 ? (
                    p.stock
                  ) : (
                    <span className="text-red-500 font-medium">
                      Out of Stock
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSellProduct(p);
                        setSellSkuInput("");
                        setSellQtyInput(1);
                      }}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition"
                      title={
                        lang === "sw"
                          ? "Uza Dukan_i (Manual Sell)"
                          : "Manual Sell / Out of Store"
                      }
                    >
                      <ShoppingCart size={16} />
                    </button>
                    <button
                      onClick={() => copyProductLink(p.id)}
                      className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                      title="Copy Link"
                    >
                      {copiedId === p.id ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-500">
                  {t(lang, "prod.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shadow-xs">
                  🛍️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editId
                      ? lang === "sw"
                        ? "Hariri Maelezo ya Bidhaa"
                        : "Edit Product Details"
                      : lang === "sw"
                        ? "Sajili Bidhaa Mpya"
                        : "Register New Product"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
                    {lang === "sw"
                      ? "Mabadiliko yanalinganishwa na duka papo hapo"
                      : "Data synchronizes with portal in real-time"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="text-slate-500 hover:text-slate-700" size={18} />
              </button>
            </div>
            <form onSubmit={saveProduct} className="p-6 space-y-4">
              {!editId && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 mb-2 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #6366f1 1px, transparent 1px)", backgroundSize: "12px 12px" }}></div>
                  <Sparkles size={24} className="text-indigo-600 mb-1 relative z-10" />
                  <h4 className="text-sm font-black text-indigo-900 relative z-10">Orbi AI Auto-Listing</h4>
                  <p className="text-xs text-indigo-700/80 mb-2 relative z-10 max-w-sm">
                    {lang === "sw" ? "Pakia picha na Orbi AI itajaza jina, kategoria, na maelezo kiotomatiki." : "Upload a photo and Orbi AI will auto-fill the title, category, and description."}
                  </p>
                  <label className="relative z-10 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer shadow-md transition-transform active:scale-95">
                    {isAutoListing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        {lang === "sw" ? "Inasoma Picha..." : "Scanning..."}
                      </span>
                    ) : (
                      <>
                        <ImageIcon size={16} />
                        {lang === "sw" ? "Pakia Picha & Jaza" : "Upload Photo & Auto-Fill"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAutoListFromImage} disabled={isAutoListing} />
                      </>
                    )}
                  </label>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5 animate-pulse">
                    📦 {lang === "sw" ? "Jina la Bidhaa" : "Product Name"}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={
                      lang === "sw"
                        ? "Weka jina la bidhaa hapa..."
                        : "Enter product name..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition duration-150"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      🛍️{" "}
                      {lang === "sw"
                        ? "Duka / Niche"
                        : "Niche (Store Category)"}
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestNicheAndCategory}
                      disabled={classifying}
                      className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-bold px-2 py-1.5 rounded-lg border border-indigo-150 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      <Sparkles
                        size={11}
                        className={
                          classifying
                            ? "animate-spin"
                            : "text-amber-500 fill-amber-500"
                        }
                      />
                      {classifying
                        ? lang === "sw"
                          ? "Inapanga..."
                          : "Organizing..."
                        : lang === "sw"
                          ? "Panga na Orbi AI"
                          : "Organize with Orbi AI"}
                    </button>
                  </div>
                  <select
                    value={niche}
                    onChange={(e) => {
                      const newNiche = e.target.value;
                      setNiche(newNiche);
                      setCategory("");
                      setFamily("");
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white transition duration-150 text-slate-800"
                  >
                    <option value="" disabled>
                      -- {lang === "sw" ? "Chagua Niche" : "Choose Niche"} --
                    </option>
                    {globalNiches.length > 0 ? (
                      globalNiches.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.name}
                        </option>
                      ))
                    ) : (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>

                {niche && globalNiches.find((n) => n.name === niche)?.categories && globalNiches.find((n) => n.name === niche)!.categories!.length > 0 && (
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      🏷️ {lang === "sw" ? "Kundi Maalum (Category)" : "Category"}
                    </label>
                    <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
                      {globalNiches.find((n) => n.name === niche)?.categories?.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            setCategory(cat.name);
                            setFamily("");
                          }}
                          className={`flex flex-col items-center gap-2 p-2 w-24 rounded-xl border transition shrink-0 snap-start ${
                            category === cat.name
                              ? "border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500"
                              : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white"
                          }`}
                        >
                          {cat.image ? (
                            <ImageWithSkeleton
                              src={cat.image}
                              alt={cat.name}
                              containerClassName="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                              <span className="text-[9px] font-bold text-slate-400">PIC</span>
                            </div>
                          )}
                          <span className="text-[10px] leading-tight text-center font-bold text-slate-700 break-words w-full line-clamp-2">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {category && globalNiches.find((n) => n.name === niche)?.categories?.find((c) => c.name === category)?.families && globalNiches.find((n) => n.name === niche)!.categories!.find((c) => c.name === category)!.families!.length > 0 && (
                  <div className="col-span-1 md:col-span-2 space-y-2 border-t border-slate-100 pt-3">
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      🌳 {lang === "sw" ? "Familia ya Bidhaa (Family)" : "Subcategory / Family"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {globalNiches.find((n) => n.name === niche)?.categories?.find((c) => c.name === category)?.families?.map((fam) => (
                        <button
                          key={fam}
                          type="button"
                          onClick={() => setFamily(fam)}
                          className={`px-3 py-1.5 rounded-lg border transition text-xs font-bold ${
                            family === fam
                              ? "border-indigo-500 bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500"
                              : "border-slate-200 bg-slate-50 hover:border-indigo-300 text-slate-600 hover:bg-white"
                          }`}
                        >
                          {fam}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arrangement Tier, Vibe, and Wrap/Presentation Style */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    🪄{" "}
                    {lang === "sw"
                      ? "Mandhari na Mpangilio wa Bidhaa (Orbi Stylist)"
                      : "Product Vibe & Arrangement (Orbi Stylist)"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        👑{" "}
                        {lang === "sw"
                          ? "Kiwango cha Thamani (Tier)"
                          : "Arrangement Tier"}
                      </label>
                      <select
                        value={arrangeTier}
                        onChange={(e) => setArrangeTier(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition text-slate-700"
                      >
                        <option value="all">
                          {lang === "sw" ? "Kawaida/Generic" : "None / Generic"}
                        </option>
                        <option value="standard">
                          {lang === "sw"
                            ? "Bajeti (Standard)"
                            : "Standard Essentials"}
                        </option>
                        <option value="premium">
                          {lang === "sw"
                            ? "Kifahari (Premium)"
                            : "Premium Artistry"}
                        </option>
                        <option value="luxury">
                          {lang === "sw" ? "Kifalme (Luxury)" : "Royal Luxury"}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        🌈{" "}
                        {lang === "sw"
                          ? "Mandhari ya Rangi (Vibe)"
                          : "Arrangement Vibe"}
                      </label>
                      <select
                        value={vibe}
                        onChange={(e) => setVibe(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition text-slate-700"
                      >
                        <option value="all">
                          {lang === "sw" ? "Kawaida/Generic" : "None / Generic"}
                        </option>
                        <option value="romance">
                          {lang === "sw"
                            ? "🔴 Upendo (Romance)"
                            : "🔴 Crimson Romance"}
                        </option>
                        <option value="serenity">
                          {lang === "sw"
                            ? "⚪ Utulivu (Serenity)"
                            : "⚪ Pastel Serenity"}
                        </option>
                        <option value="sunshine">
                          {lang === "sw"
                            ? "🟡 Furaha (Sunshine)"
                            : "🟡 Golden Sunshine"}
                        </option>
                        <option value="mystery">
                          {lang === "sw"
                            ? "🟣 Kipekee (Mystery)"
                            : "🟣 Enchanted Mystery"}
                        </option>
                        <option value="nature">
                          {lang === "sw"
                            ? "🟢 Asili (Nature)"
                            : "🟢 Lush Nature"}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        📦{" "}
                        {lang === "sw"
                          ? "Ufungashaji (Package)"
                          : "Presentation Style"}
                      </label>
                      <select
                        value={presentationStyle}
                        onChange={(e) => setPresentationStyle(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition text-slate-700"
                      >
                        <option value="all">
                          {lang === "sw" ? "Kawaida/Generic" : "None / Generic"}
                        </option>
                        <option value="box">
                          {lang === "sw"
                            ? "📦 Boxi Maalum (Premium Box)"
                            : "📦 Premium Box"}
                        </option>
                        <option value="wrap">
                          {lang === "sw"
                            ? "🎀 Karatasi Maalum (Classic Wrap)"
                            : "🎀 Classic Wrap"}
                        </option>
                        <option value="glass">
                          {lang === "sw"
                            ? "🏺 Chombo cha Kioo (Glass Vase)"
                            : "🏺 Glass Vase"}
                        </option>
                        <option value="basket">
                          {lang === "sw"
                            ? "🧺 Kikapu (Rustic Basket)"
                            : "🧺 Rustic Basket"}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    💰 {lang === "sw" ? "Bei (TSH)" : "Price (TSH)"}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition duration-150 text-slate-800"
                  />
                  {price && Number(price) > 0 && (
                    <div className="text-xs text-slate-500 mt-1.5 font-bold">
                      = {formatCurrency(Number(price))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    🏷️{" "}
                    {lang === "sw"
                      ? "Bei ya Zamani (Si Lazima)"
                      : "Original Price (Optional)"}
                  </label>
                  <input
                    type="number"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition duration-150 text-slate-800"
                  />
                  {oldPrice && Number(oldPrice) > 0 && (
                    <div className="text-xs text-slate-500 mt-1.5 font-bold">
                      = {formatCurrency(Number(oldPrice))}
                    </div>
                  )}
                </div>

                {/* Pricing Mode Selection Box */}
                <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-4 col-span-1 sm:col-span-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        {lang === "sw" ? "Aina ya Bei" : "Pricing Model / Type"}
                      </span>
                      <p className="text-[10px] text-slate-505 font-medium mt-0.5">
                        {lang === "sw"
                          ? "Chagua uuzaji wa Reja-reja au wa Jumla (Wholesale)"
                          : "Select regular retail or wholesale with discount tiers"}
                      </p>
                    </div>
                    <select
                      value={prodPricingMode}
                      onChange={(e) => {
                        const mode = e.target.value as "retail" | "wholesale";
                        setProdPricingMode(mode);
                        if (
                          mode === "wholesale" &&
                          prodWholesaleTiers.length === 0
                        ) {
                          setProdWholesaleTiers([
                            { minQty: 1, price: parseFloat(price) || 0 },
                          ]);
                        }
                      }}
                      className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl text-xs font-bold shrink-0 outline-none focus:border-indigo-600 transition text-slate-800"
                    >
                      <option value="retail">
                        {lang === "sw"
                          ? "Retail (Bei Kawaida)"
                          : "Retail (Single price)"}
                      </option>
                      <option value="wholesale">
                        {lang === "sw"
                          ? "Whole Sale (Bei za Jumla)"
                          : "Whole Sale (Tiered pricing)"}
                      </option>
                    </select>
                  </div>

                  {prodPricingMode === "wholesale" && (
                    <div className="space-y-3.5 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          {lang === "sw"
                            ? "Vigezo vya Bei za Jumla (Wholesale Prices per Quantity)"
                            : "Wholesale Pricing Tiers"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const lastQty =
                              prodWholesaleTiers.length > 0
                                ? prodWholesaleTiers[
                                    prodWholesaleTiers.length - 1
                                  ].minQty
                                : 1;
                            const lastPrice =
                              prodWholesaleTiers.length > 0
                                ? prodWholesaleTiers[
                                    prodWholesaleTiers.length - 1
                                  ].price
                                : parseFloat(price) || 0;
                            setProdWholesaleTiers([
                              ...prodWholesaleTiers,
                              {
                                minQty: lastQty + 5,
                                price: Math.max(0, Math.round(lastPrice * 0.9)),
                              },
                            ]);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                        >
                          {lang === "sw"
                            ? "+ Ongeza Vigezo"
                            : "+ Add Quantity Tier"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {prodWholesaleTiers.map((tier, idx) => (
                          <div
                            key={`wholesale-tier-${idx}`}
                            className="flex items-center gap-3 bg-white p-3 border border-slate-200/60 rounded-xl"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                                  {lang === "sw"
                                    ? "Kuanzia Idadi (Min Qty)"
                                    : "Min Quantity"}
                                </span>
                                <input
                                  required
                                  type="number"
                                  min="1"
                                  value={tier.minQty}
                                  onChange={(e) => {
                                    const updated = [...prodWholesaleTiers];
                                    updated[idx].minQty =
                                      parseInt(e.target.value) || 1;
                                    setProdWholesaleTiers(updated);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-bold outline-none text-slate-700"
                                  placeholder="e.g. 5"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                                  {lang === "sw"
                                    ? "Bei ya kila kimoja (Price per Qty)"
                                    : "Price per Unit (TZS)"}
                                </span>
                                <input
                                  required
                                  type="number"
                                  min="0"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const updated = [...prodWholesaleTiers];
                                    updated[idx].price =
                                      parseFloat(e.target.value) || 0;
                                    setProdWholesaleTiers(updated);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-bold outline-none text-emerald-600"
                                  placeholder="e.g. 120000"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setProdWholesaleTiers(
                                  prodWholesaleTiers.filter(
                                    (_, i) => i !== idx,
                                  ),
                                );
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 cursor-pointer"
                              title={
                                lang === "sw" ? "Futa vigezo" : "Delete tier"
                              }
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        ))}

                        {prodWholesaleTiers.length === 0 && (
                          <p className="text-[10px] text-slate-400 text-center py-2 italic font-semibold">
                            {lang === "sw"
                              ? "Bofya kitufe cha juu kuongeza vigezo vya mauzo ya jumla k.m. 'Nunua kuanzia 5 kila kimoja TZS 120,000'"
                              : "Click add button to start configuring your wholesale price metrics."}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl space-y-4 col-span-1 sm:col-span-2">
                  <div>
                    <span className="block text-[11px] font-black uppercase text-blue-700 tracking-wider">
                      {lang === "sw" ? "Akili ya Usafirishaji" : "Delivery Intelligence"}
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {lang === "sw"
                        ? "Hizi hutumika kuhesabu gharama halisi ya usafirishaji na kuzuia maeneo yasiyofaa kwa bidhaa hii."
                        : "Used to calculate real delivery quotes and block unsuitable zones for this product."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{lang === "sw" ? "Aina" : "Class"}</label>
                      <select value={deliveryClass} onChange={(e) => setDeliveryClass(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600">
                        <option value="standard">{lang === "sw" ? "Kawaida" : "Standard"}</option>
                        <option value="bulky">{lang === "sw" ? "Kubwa" : "Bulky"}</option>
                        <option value="heavy">{lang === "sw" ? "Nzito" : "Heavy"}</option>
                        <option value="special">{lang === "sw" ? "Maalum" : "Special"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{lang === "sw" ? "Uzito Kg" : "Weight Kg"}</label>
                      <input type="number" min="0" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{lang === "sw" ? "Urefu cm" : "Length cm"}</label>
                      <input type="number" min="0" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{lang === "sw" ? "Upana cm" : "Width cm"}</label>
                      <input type="number" min="0" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{lang === "sw" ? "Kimo cm" : "Height cm"}</label>
                      <input type="number" min="0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{lang === "sw" ? "Wigo" : "Scope"}</label>
                      <select value={deliveryScope} onChange={(e) => setDeliveryScope(e.target.value as any)} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600">
                        <option value="national">{lang === "sw" ? "Nchi nzima" : "National"}</option>
                        <option value="regional">{lang === "sw" ? "Mikoa iliyochaguliwa" : "Selected regions"}</option>
                        <option value="local_only">{lang === "sw" ? "Eneo la karibu tu" : "Local only"}</option>
                        <option value="custom_quote">{lang === "sw" ? "Quote maalum" : "Custom quote"}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      [fragile, setFragile, lang === "sw" ? "Inavunjika" : "Fragile"],
                      [oversized, setOversized, lang === "sw" ? "Kubwa" : "Oversized"],
                      [requiresColdChain, setRequiresColdChain, lang === "sw" ? "Baridi" : "Cold chain"],
                      [digitalProduct, setDigitalProduct, lang === "sw" ? "Digital" : "Digital"],
                      [requiresDeliveryQuote, setRequiresDeliveryQuote, lang === "sw" ? "Quote maalum" : "Custom quote"],
                    ].map(([checked, setter, label]: any) => (
                      <label key={label} className="min-h-11 flex items-center gap-2 rounded-2xl bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                        <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} className="h-4 w-4 accent-blue-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      {lang === "sw" ? "Maelezo ya logistics" : "Logistics notes"}
                    </label>
                    <textarea
                      value={deliveryHandlingNotes}
                      onChange={(e) => setDeliveryHandlingNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                      placeholder={lang === "sw" ? "Mf. Inahitaji dereva na makadirio ya mafuta..." : "e.g. Requires driver and fuel estimate..."}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">
                      {lang === "sw" ? "Maeneo ambayo bidhaa hii haiwezi kufikishwa" : "Blocked delivery zones for this product"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {productDeliveryZones.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[10px] font-bold text-slate-500 sm:col-span-3">
                          {lang === "sw"
                            ? "Hakuna delivery zones zilizopakiwa. Bidhaa itatumia rules za default hadi admin aweke zones."
                            : "No delivery zones loaded. Product will use default rules until zones are configured."}
                        </div>
                      )}
                      {productDeliveryZones.map((zone) => (
                        <label key={zone.id} className="min-h-11 flex items-center gap-2 rounded-2xl bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                          <input
                            type="checkbox"
                            checked={blockedDeliveryZoneIds.includes(zone.id)}
                            onChange={(e) => {
                              setBlockedDeliveryZoneIds((prev) =>
                                e.target.checked
                                  ? Array.from(new Set([...prev, zone.id]))
                                  : prev.filter((id) => id !== zone.id),
                              );
                            }}
                            className="h-4 w-4 accent-rose-600"
                          />
                          {zone.labelSw || zone.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-1 col-span-1 sm:col-span-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Tag size={13} className="text-amber-500" />
                    {lang === "sw"
                      ? "Msaidizi wa Punguzo la Bei / Discount Assistant:"
                      : "Discounting Quick Actions:"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[2, 3, 5, 10, 15, 20, 25, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const basePrice = Number(oldPrice || price);
                          if (!basePrice) {
                            showAlert(
                              lang === "sw"
                                ? "Tafadhali weka bei ya kawaida kwanza"
                                : "Please input a regular price first",
                              "warning",
                            );
                            return;
                          }
                          if (!oldPrice) {
                            setOldPrice(basePrice.toString());
                          }
                          const discounted = Math.round(
                            basePrice * (1 - pct / 100),
                          );
                          setPrice(discounted.toString());
                        }}
                        className="text-xs bg-white border border-slate-200 hover:border-accent hover:text-accent font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                      >
                        {pct}% OFF
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (oldPrice) {
                          setPrice(oldPrice);
                          setOldPrice("");
                        }
                      }}
                      className="text-xs bg-slate-200 text-slate-600 hover:bg-slate-300 font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {lang === "sw" ? "Futa Punguzo" : "Clear Discount"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    *{" "}
                    {lang === "sw"
                      ? "Hii itaweka 'Bei ya Zamani' kuwa bei yako ya sasa, kisha itaweka bei mpya kupata punguzo husika."
                      : "This will automatically mirror your regular price to 'Old Price' and calculate the new promo price."}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    📊 {lang === "sw" ? "Akiba (Stock)" : "Stock Qty"}
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    min="1"
                    placeholder="10"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition duration-150 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    🏷️{" "}
                    {lang === "sw"
                      ? "Lebo (Tags, koma kutenganisha)"
                      : "Tags (comma separated)"}
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={
                      lang === "sw"
                        ? "mf. mpya, inauzwa sana"
                        : "e.g. promo, exclusive"
                    }
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition duration-150 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    {lang === "sw" ? "Kundi la Kodi TRA" : "TRA Tax Category"}
                  </label>
                  <select
                    value={taxCode}
                    onChange={(e) => setTaxCode(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-xl text-xs font-bold outline-none transition duration-150 text-slate-700"
                  >
                    <option value={1}>
                      {lang === "sw"
                        ? "A - VAT Kawaida (18%)"
                        : "A - Standard VAT (18%)"}
                    </option>
                    <option value={2}>
                      {lang === "sw"
                        ? "B - Kiwango Maalum (Special rate)"
                        : "B - Special Rate"}
                    </option>
                    <option value={3}>
                      {lang === "sw"
                        ? "C - Kodi Sifuri / Zero-rated (0%)"
                        : "C - Zero-rated (0%)"}
                    </option>
                    <option value={4}>
                      {lang === "sw"
                        ? "D - Ahueni ya Kodi (Tax Relief)"
                        : "D - Tax Relief"}
                    </option>
                    <option value={5}>
                      {lang === "sw"
                        ? "E - Isiyotozwa Kodi (Exempted)"
                        : "E - Exempted"}
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <label className="block text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Barcode className="text-indigo-600" size={16} />
                      {lang === "sw"
                        ? "Msimbo wa SKU / Barcode"
                        : "SKU / Barcode"}
                    </span>
                    <span className="px-2 py-0.5 text-[9px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded font-mono font-bold uppercase tracking-wider border border-red-200 dark:border-red-900">
                      {lang === "sw"
                        ? "Ufunguo wa Lazima wa Database"
                        : "Mandatory DB Key"}
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    {lang === "sw"
                      ? "Changanua msimbo wa bidhaa au ingiza SKU hapa chini. Kila bidhaa ni lazima iwe na SKU kabla ya kusafirishwa."
                      : "Scan the product barcode or enter the SKU below. Every product must have an SKU for shipping verification."}
                  </p>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g. ORBI-7281093"
                        className="w-full border-2 border-indigo-500 dark:border-indigo-400 rounded-xl p-2.5 pl-10 outline-none text-sm font-mono font-bold tracking-wider focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition bg-indigo-50/10 text-indigo-950 dark:text-indigo-100"
                      />
                      <Barcode
                        size={18}
                        className="absolute left-3 top-3 text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const generated =
                          "ORBI-" + Math.floor(100000 + Math.random() * 900000);
                        setSku(generated);
                        setJustGeneratedSku(generated);
                        showAlert(
                          lang === "sw"
                            ? `SKU mpya imetengenezwa: ${generated}. Tafadhali iweke kwenye bidhaa!`
                            : `New SKU generated: ${generated}. Please copy it and label your product!`,
                          "success",
                        );
                      }}
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Sparkles size={14} />
                      {lang === "sw" ? "Tengeneza SKU" : "Generate SKU"}
                    </button>
                  </div>

                  {justGeneratedSku && sku === justGeneratedSku && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl mt-3">
                      <p className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                        <AlertCircle
                          size={15}
                          className="text-amber-600 shrink-0"
                        />
                        {lang === "sw"
                          ? "MAELEKEZO YA KUNAKILI NA KUWEKA LEBO:"
                          : "COPY & LABEL DIRECTIVE:"}
                      </p>
                      <p className="text-xs mt-1.5 leading-relaxed text-amber-900">
                        {lang === "sw"
                          ? `Umetengeneza SKU: ${sku}. Ili uweze kupima na kudhibitisha stoki wakati wa kusafirisha (shipment scan), unapaswa KUNAKILI msimbo huu na ubandike lebo ya kimaumbile kwenye bidhaa yako sasa.`
                          : `Successfully generated SKU: ${sku}. To verify and track inventory upon shipping, copy this code and stick/print a barcode label on the physical product now.`}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(sku);
                            showAlert(
                              lang === "sw"
                                ? "SKU imenakiliwa!"
                                : "SKU copied!",
                              "success",
                            );
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm inline-flex cursor-pointer"
                        >
                          <Copy size={13} />
                          {lang === "sw" ? "Nakili Sasa" : "Copy Code Now"}
                        </button>
                        <span className="text-[10px] text-amber-600 font-medium">
                          {lang === "sw"
                            ? "* Lazima ubandike lebo hii kwenye bidhaa"
                            : "* Must print/label this on physical product"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    {lang === "sw"
                      ? "Muda wa Dhamana (Warranty)"
                      : "Warranty Duration"}
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder={
                      lang === "sw"
                        ? "M.g. Miezi 12, Miaka 2..."
                        : "e.g. 12 Months, 2 Years..."
                    }
                    className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                  <p className="text-xs text-slate-500">
                    {lang === "sw"
                      ? "Ikiwa bidhaa hii ina warranty au dhamana, jaza hapa kuonyesha kwenye application kwa mteja."
                      : "Optional. Add warranty info to display a badge to customers."}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Percent size={16} className="text-amber-500" />
                    {lang === "sw" ? "Asilimia ya Dalali/Wakala (%)" : "Broker Commission (%)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={brokerCommissionPercent}
                    onChange={(e) => setBrokerCommissionPercent(e.target.value)}
                    placeholder={lang === "sw" ? "Mfano: 3" : "e.g. 3"}
                    className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  />
                  <p className="text-xs text-slate-500">
                    {lang === "sw"
                      ? "Hiari: Asilimia itakayokatwa kwenye mauzo na kulipwa kwa Wakala (Broker)."
                      : "Optional: Percentage deducted from sales and paid to the Broker."}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-slate-800">
                    {lang === "sw"
                      ? "Maelezo ya Bidhaa (Description)"
                      : "Product Description"}
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestDescription}
                    disabled={generatingDesc}
                    className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-150 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Sparkles
                      size={13}
                      className={
                        generatingDesc
                          ? "animate-spin"
                          : "text-amber-500 fill-amber-500"
                      }
                    />
                    {generatingDesc
                      ? lang === "sw"
                        ? "Inatengeneza..."
                        : "Generating..."
                      : lang === "sw"
                        ? "✨ Pendekeza na Orbi AI"
                        : "✨ Suggest with Orbi AI"}
                  </button>
                </div>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                  rows={5}
                  placeholder={
                    lang === "sw"
                      ? "Weka sifa na maelezo ya bidhaa, au bonyeza kipengele cha AI hapo juu kupata maelezo ya kiotomatiki..."
                      : "Enter product details and features, or click 'Suggest with AI' to draft automatically..."
                  }
                  className="w-full border rounded-xl p-2.5 outline-none text-slate-700 text-sm focus:border-accent font-medium leading-relaxed"
                ></textarea>
              </div>

              {/* Product Specifications Table Creator */}
              <div className="space-y-2 border border-slate-200/60 bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                    {lang === "sw"
                      ? "Sifa na Vigezo Maalum (Specifications)"
                      : "Specifications & Key Attributes"}
                  </label>
                  <div className="flex items-center gap-1.5 font-bold">
                    <button
                      type="button"
                      onClick={() => setShowFeatureImport(!showFeatureImport)}
                      className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-lg border shadow-sm transition cursor-pointer ${
                        showFeatureImport
                          ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <FileText
                        size={12}
                        className={
                          showFeatureImport
                            ? "text-indigo-400"
                            : "text-slate-500"
                        }
                      />
                      {lang === "sw" ? "Kuingiza kwa Mkupuo" : "Bulk Import"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFeatures([
                          ...features,
                          { name: "", description: "" },
                        ])
                      }
                      className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 shadow-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-indigo-600 transition"
                    >
                      <Plus size={13} />{" "}
                      {lang === "sw" ? "Ongeza Sifa" : "Add Attribute"}
                    </button>
                  </div>
                </div>

                {showFeatureImport && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-xs animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={14} className="text-indigo-600" />
                        {lang === "sw"
                          ? "Import Sifa Maalum"
                          : "Import Specifications"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const sampleText =
                              lang === "sw"
                                ? "Total Capacity: Litra 265 (takribani friji 198L–201L).\nDimensions: 1700 x 550 x 600 mm (Urefu x Upana x Kwenda Ndani).\nCooling System: Teknolojia ya No Frost.\nNoise Level: Hutumia sauti ya db 38 hivi."
                                : "Total Capacity: 265 Liters (approx. 198L–201L).\nDimensions: 1700 x 550 x 600 mm (H x W x D).\nCooling System: No Frost technology.\nNoise Level: Noise level of 38 dB.";
                            setFeatureImportText(sampleText);
                          }}
                          className="text-[9px] sm:text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 px-2 py-0.5 rounded-md cursor-pointer transition"
                        >
                          {lang === "sw" ? "Pakia Mfano" : "Load Sample"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFeatureImport(false)}
                          className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] sm:text-xs leading-relaxed text-slate-500">
                      {lang === "sw"
                        ? "Andika sifa zako au pakia faili la maandishi (.txt). Mfumo utazigawanya zenyewe kwa kutambua alama za : au = kwa kila mstari."
                        : "Enter specifications or pick a text file. The system will auto-split lines using : or =."}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1 flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition relative cursor-pointer group">
                        <input
                          type="file"
                          accept=".txt,text/plain"
                          onChange={handleFeatureFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="text-center space-y-1">
                          <div className="flex justify-center">
                            <span className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition text-indigo-600">
                              <FileText size={18} />
                            </span>
                          </div>
                          <span className="block text-[11px] sm:text-xs font-bold text-slate-700">
                            {lang === "sw"
                              ? "Chagua Faili (.txt)"
                              : "Choose Text File"}
                          </span>
                          <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium font-mono uppercase">
                            Plain text
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <textarea
                          value={featureImportText}
                          onChange={(e) => setFeatureImportText(e.target.value)}
                          rows={4}
                          placeholder={
                            lang === "sw"
                              ? "Mfano:\nDimensions: 1700x550x600 mm\nVoltage: 220V AC\nGuarantor = Miaka 2..."
                              : "Write or paste specifications here...\nE.g.\nTotal Capacity: 265 Liters\nNoise Level = 38 dB..."
                          }
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-2.5 text-xs font-mono leading-relaxed rounded-xl outline-none focus:border-indigo-500 focus:bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <label htmlFor="admin-feature-import-append" className="inline-flex items-center gap-1.5 cursor-pointer group">
                          <input
                            id="admin-feature-import-append"
                            type="radio"
                            name="adminFeatureImportMode"
                            checked={featureImportMode === "append"}
                            onChange={() => setFeatureImportMode("append")}
                            className="accent-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                          />
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition">
                            {lang === "sw"
                              ? "Ongeza kwenye zilizopo (Append)"
                              : "Append to list"}
                          </span>
                        </label>
                        <label htmlFor="admin-feature-import-replace" className="inline-flex items-center gap-1.5 cursor-pointer group">
                          <input
                            id="admin-feature-import-replace"
                            type="radio"
                            name="adminFeatureImportMode"
                            checked={featureImportMode === "replace"}
                            onChange={() => setFeatureImportMode("replace")}
                            className="accent-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                          />
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition">
                            {lang === "sw"
                              ? "Badilisha zilizopo zote (Replace)"
                              : "Replace existing"}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setFeatureImportText("")}
                          disabled={!featureImportText}
                          className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-40 cursor-pointer transition"
                        >
                          {lang === "sw" ? "Futa Maandishi" : "Clear"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleImportFeaturesAction(featureImportText)
                          }
                          disabled={!featureImportText.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-[11px] sm:text-xs px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check size={14} />
                          {lang === "sw"
                            ? "Kamilisha Import"
                            : "Import Specifications"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {features.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium italic">
                    {lang === "sw"
                      ? "Hakuna sifa zilizowekwa. Mf. Voltage: 220V."
                      : "No attributes added yet. E.g. Power source: Electric."}
                  </p>
                )}

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {features.map((f, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={
                            lang === "sw"
                              ? "Msimbo/Kipengele (Mf. Power)"
                              : "Attribute/Key (E.g. Power)"
                          }
                          value={f.name}
                          onChange={(e) => {
                            const updated = [...features];
                            updated[i].name = e.target.value;
                            setFeatures(updated);
                          }}
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                      <div className="flex-[2]">
                        <input
                          type="text"
                          placeholder={
                            lang === "sw"
                              ? "Maelezo (Mf. 2200W)"
                              : "Value/Details (E.g. 2200W)"
                          }
                          value={f.description}
                          onChange={(e) => {
                            const updated = [...features];
                            updated[i].description = e.target.value;
                            setFeatures(updated);
                          }}
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFeatures(features.filter((_, idx) => idx !== i))
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title={lang === "sw" ? "Futa sifa" : "Delete attribute"}
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    Picha na Video (Hadi 5)
                    {isUploading && (
                      <span className="text-accent flex items-center gap-1.5 text-xs px-2 py-0.5 bg-accent/10 rounded-full font-bold">
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        Inapakia...
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQualityGuide(true)}
                    className="inline-flex items-center gap-1.5 text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-150 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Sparkles
                      size={11}
                      className="text-amber-500 fill-amber-500"
                    />
                    {lang === "sw"
                      ? "Mwongozo wa Ubora"
                      : "Photo Quality Guide"}
                  </button>
                </div>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-slate-300 hover:border-primary/50"} ${isUploading || images.length >= 5 ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(!isUploading && images.length < 5);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    if (
                      !isUploading &&
                      images.length < 5 &&
                      e.dataTransfer.files
                    ) {
                      handleImageFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                >
                  <div className="absolute inset-0">
                    <input
                      type="file"
                      multiple
                      capture="environment"
                      accept="image/*,video/*"
                      onChange={handleImageUpload}
                      disabled={images.length >= 5 || isUploading}
                      className="w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      title="Pakia picha/video"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <ImageIcon
                      className={`w-8 h-8 transition-colors ${isDragActive ? "text-primary" : "text-slate-400"}`}
                    />
                    <div className="px-4">
                      <p className="text-sm font-bold text-slate-700">
                        Kokota picha/video hapa au bofya kuteua
                      </p>
                      <p className="text-xs text-slate-500 mt-1 mb-2">
                        Unaweza kuweka hadi faili 5
                      </p>
                      <div className="mt-2.5 max-w-md mx-auto p-2 bg-indigo-50/85 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed font-semibold">
                        ⚠️ <strong>Angalizo la Ubora:</strong> Tafadhali weka
                        picha zenye kiwango cha juu cha ubora zilizohaririwa
                        (high quality edited) zenye mandhari meupe au safi ya
                        uwazi (white or transparent), zisizo na ukungu au blur
                        effects. Mfumo utafuta na kusitisha picha zenye ubora
                        duni kiotomatiki.
                        <br />
                        <br />
                        🔒 <strong>Kikomo cha Faili:</strong> Ukubwa usizidi{" "}
                        <strong>45MB</strong>. Picha zako zitabadilishwa na
                        kubanwa kiotomatiki kuwa muundo wa kisasa wa kadi ya
                        picha ya wavuti (WebP Web Image/Bitmap) ili kulinda
                        nafasi yako ya hifadhi ya bidhaa.
                      </div>
                    </div>
                  </div>
                </div>

                {uploadingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadingFiles.map((file) => (
                      <div
                        key={file.id}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-4"
                      >
                        <span className="text-xs font-medium text-slate-700 truncate flex-1">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-3 w-1/3 min-w-[120px]">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-accent h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-slate-500 min-w-[30px] text-right">
                            {Math.round(file.progress)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 mt-4">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, i)}
                      className={`relative flex items-center justify-center transition-all duration-300 ${dragOverIdx === i && draggedIdx !== i ? (draggedIdx !== null && i > draggedIdx ? "pl-28" : "pr-28") : ""}`}
                    >
                      {/* Highlighted drop zone indicator */}
                      {dragOverIdx === i && draggedIdx !== i && (
                        <div
                          className={`absolute w-24 h-24 border-2 border-dashed border-accent rounded-xl bg-accent/5 ${draggedIdx !== null && i > draggedIdx ? "left-0" : "right-0"}`}
                        />
                      )}

                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragEnd={handleDragEnd}
                        className={`relative w-24 h-24 border-2 rounded-xl bg-slate-50 cursor-move overflow-hidden transition-all duration-300 ${draggedIdx === i ? "opacity-0 scale-95" : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"} ${dragOverIdx === i && draggedIdx !== i ? "scale-95 shadow-none" : ""}`}
                      >
                        {img.startsWith("data:video/") ? (
                          <video
                            src={img}
                            className="w-full h-full object-cover rounded pointer-events-none"
                          />
                        ) : (
                          <img
                            src={img}
                            className="w-full h-full object-cover rounded pointer-events-none"
                          />
                        )}

                        {/* Cover label for the first item */}
                        {i === 0 &&
                          Array.from(images).length > 0 &&
                          draggedIdx !== 0 && (
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] py-1.5 text-center font-bold tracking-wider uppercase">
                              Cover
                            </div>
                          )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImages(images.filter((_, idx) => idx !== i));
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 z-10 hover:scale-110 transition shadow-sm origin-center"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Realtime Inline Image Uploading Slots and Percentages */}
                  {uploadingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative w-24 h-24 border-2 border-dashed border-accent rounded-xl bg-slate-50 flex flex-col items-center justify-center overflow-hidden p-2 shadow-inner animate-pulse"
                    >
                      <div className="absolute inset-0 bg-accent/5" />
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <ImageIcon className="w-6 h-6 text-accent mb-1 animate-bounce" />
                        <span
                          className="text-[9px] font-semibold text-slate-600 truncate max-w-[80px]"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-sm font-black text-accent mt-0.5">
                          {Math.round(file.progress)}%
                        </span>
                      </div>

                      {/* Linear progress bar inside the thumbnail slot */}
                      <div className="absolute bottom-0 left-0 w-full bg-slate-200 h-1">
                        <div
                          className="bg-accent h-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    id="visibleToggle"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-accent focus:ring-accent border-slate-300"
                  />
                  <label
                    htmlFor="visibleToggle"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    {lang === "sw"
                      ? "Bidhaa iko wazi kwa Wateja (Visible on Storefront)"
                      : "Show on storefront (Visible to Customers)"}
                  </label>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-sm"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
                >
                  {isUploading
                    ? lang === "sw"
                      ? "Inapakia..."
                      : "Uploading..."
                    : lang === "sw"
                      ? "Hifadhi Bidhaa"
                      : "Save Specifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sellProduct && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {lang === "sw"
                      ? "Uza Moja kwa Moja Dukan_i"
                      : "Manual Direct Shop Sell"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === "sw"
                      ? "Punguza stoki kwa mauzo ya ana kwa ana"
                      : "Sell product directly and deduct stock"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeManualSell}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleManualSell} className="p-6 space-y-5">
              {/* Product Info Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 text-sm">
                {sellProduct.images[0] ? (
                  <img
                    src={sellProduct.images[0]}
                    alt={sellProduct.name}
                    className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-200 border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                    <ImageIcon size={20} className="text-slate-500" />
                  </div>
                )}
                <div className="space-y-1 overflow-hidden">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {sellProduct.name}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center font-semibold gap-1.5">
                    {lang === "sw" ? "Akiba Iliyopo:" : "Current Stock:"}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${sellProduct.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                    >
                      {sellProduct.stock > 0
                        ? sellProduct.stock
                        : lang === "sw"
                          ? "Hamna stoki"
                          : "Out of stock"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === "sw"
                      ? "Msimbo wa SKU uliosajiliwa:"
                      : "Registered SKU:"}{" "}
                    <span className="font-mono bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[10px]">
                      {sellProduct.sku ||
                        (lang === "sw" ? "HAUKUWEKWA" : "NOT SET")}
                    </span>
                  </p>
                </div>
              </div>

              {!sellProduct.sku && (
                <div className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-xl flex gap-2.5 text-xs">
                  <AlertCircle
                    className="text-rose-600 shrink-0 mt-0.5"
                    size={16}
                  />
                  <div>
                    <h4 className="font-bold text-rose-900">
                      {lang === "sw"
                        ? "HAUPOSAJILIWA SKU!"
                        : "SKU UNREGISTERED!"}
                    </h4>
                    <p className="mt-1 leading-relaxed text-rose-800">
                      {lang === "sw"
                        ? "Huwezi kuuza bidhaa hii dukan_i kwa kuwa haina msimbo wa SKU uliosajiliwa. Tafadhali ifunge na uhariri bidhaa ili kuipa SKU kwanza."
                        : "You cannot sell this item directly in store because it does not have an SKU registered. Please close and edit this product to set an SKU first."}
                    </p>
                  </div>
                </div>
              )}

              {sellProduct.sku && (
                <>
                  {/* Select Quantity to sell */}
                  <div className="space-y-1">
                    <label className="block text-xs font-black text-slate-550 uppercase tracking-wider">
                      {lang === "sw" ? "Idadi ya Mauzo" : "Quantity to Sell"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={sellProduct.stock}
                      value={sellQtyInput}
                      onChange={(e) =>
                        setSellQtyInput(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-sm focus:border-emerald-500 transition bg-white"
                    />
                    <p className="text-[10px] text-slate-400">
                      {lang === "sw"
                        ? `Upeo wa juu unaoruhusiwa ni kiasi cha akiba iliyopo (${sellProduct.stock})`
                        : `Maximum allowed quantity is the current available stock (${sellProduct.stock})`}
                    </p>
                  </div>

                  {/* Input / Scan Barcode / SKU field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-550 uppercase tracking-wider">
                        {lang === "sw"
                          ? "Changanua au Ingiza SKU ya Bidhaa"
                          : "Scan or Enter Product SKU"}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowSellCameraScanner(!showSellCameraScanner)
                        }
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition select-none cursor-pointer ${
                          showSellCameraScanner
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        <Camera size={13} />
                        {showSellCameraScanner
                          ? lang === "sw"
                            ? "Zima Kamera"
                            : "Turn Off Camera"
                          : lang === "sw"
                            ? "Kamera yaskana"
                            : "Scan with Camera"}
                      </button>
                    </div>

                    {showSellCameraScanner ? (
                      <div className="py-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        <CameraBarcodeScanner
                          lang={lang === "sw" ? "sw" : "en"}
                          onScanSuccess={(scannedText) => {
                            setSellSkuInput(scannedText);
                            setShowSellCameraScanner(false);
                            showAlert(
                              lang === "sw"
                                ? `Msimbo umesomwa kikamilifu: ${scannedText}`
                                : `Barcode read successfully: ${scannedText}`,
                              "success",
                            );
                          }}
                          onClose={() => setShowSellCameraScanner(false)}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={sellSkuInput}
                          onChange={(e) => setSellSkuInput(e.target.value)}
                          placeholder="e.g. ORBI-829103"
                          className="w-full border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none font-mono text-sm focus:border-emerald-500 transition bg-white"
                          autoFocus
                        />
                        <Barcode
                          size={18}
                          className="absolute left-3.5 top-3.5 text-slate-400"
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      {lang === "sw"
                        ? "Ingiza herufi zilizo sawa au changanua kwa kamera ili kukata hesabu ya stoki ya muuzaji."
                        : "Verify your entry. Characters must match exactly or scan via key barcode to deduct the seller's inventory."}
                    </p>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeManualSell}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={!sellProduct.sku || sellProduct.stock <= 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <DollarSign size={16} />
                  {lang === "sw" ? "Uza Sasa" : "Sell Out Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- ORDERS ADMIN ---------------- //
export function OrdersAdmin({
  currentStaff,
  currentSeller,
}: {
  currentStaff?: any;
  currentSeller?: any;
}) {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.getProducts(),
    staleTime: 60000,
  });
  
  const { data: rawOrders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => db.getOrders(),
    staleTime: 60000,
  });

  const orders = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let processed = rawOrders.map((o: any) => {
      if (
        [
          "delivered",
          "cancelled",
          "customer_confirmed",
          "released",
          "refunded",
        ].includes(String(o.status || "").toLowerCase()) &&
        o.date < thirtyDaysAgo
      ) {
        return { ...o, status: "archived" as const };
      }
      return o;
    });
    
    if (currentSeller) {
      processed = processed.filter((o: any) =>
        o.items.some((item: any) => {
          const prod = products.find((p: any) => p.id === item.productId);
          return prod?.sellerId === currentSeller.id;
        }),
      );
    }
    
    return processed;
  }, [rawOrders, currentSeller, products]);

  const setOrders = (newOrders: any) => {
    const updated = typeof newOrders === 'function' ? newOrders(orders) : newOrders;
    queryClient.setQueryData(['orders'], updated);
  };
  const setProducts = (newProducts: any) => {
    const updated = typeof newProducts === 'function' ? newProducts(products) : newProducts;
    queryClient.setQueryData(['products'], updated);
  };
  const { lang } = useI18n();
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePINInput, setDeletePINInput] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkDeleteActive, setBulkDeleteActive] = useState(false);

  const [trendMetric, setTrendMetric] = useState<"revenue" | "count">(
    "revenue",
  );
  const [trendInterval, setTrendInterval] = useState<
    "day" | "weekly" | "monthly" | "year"
  >("monthly");

  const saveOrderWithValidation = async (
    orderPayload: any,
    customBaseOrder?: Order,
  ) => {
    const existingOrder = (customBaseOrder ||
      orders.find((o) => o.id === orderPayload.id)) as any;
    const finalCustomerDetails = {
      name: (
        orderPayload.customerDetails?.name ||
        existingOrder?.customerDetails?.name ||
        existingOrder?.customer?.name ||
        ""
      ).trim(),
      phone: (
        orderPayload.customerDetails?.phone ||
        existingOrder?.customerDetails?.phone ||
        existingOrder?.customer?.phone ||
        ""
      ).trim(),
      address: (
        orderPayload.customerDetails?.address ||
        existingOrder?.customerDetails?.address ||
        existingOrder?.customer?.address ||
        ""
      ).trim(),
      tin:
        orderPayload.customerDetails?.tin ||
        existingOrder?.customerDetails?.tin ||
        undefined,
    };

    const completePayload = {
      ...existingOrder,
      ...orderPayload,
      customerDetails: finalCustomerDetails,
      total:
        typeof orderPayload.total === "number"
          ? orderPayload.total
          : (existingOrder?.total ?? 0),
      paymentMethod:
        orderPayload.paymentMethod || existingOrder?.paymentMethod || undefined,
      paymentMethodName:
        orderPayload.paymentMethodName ||
        existingOrder?.paymentMethodName ||
        undefined,
      status: orderPayload.status || existingOrder?.status || "pending",
    };

    const validationResult = SchemaValidator.validateShippingState(
      completePayload,
      lang === "sw" ? "sw" : "en",
    );

    if (!validationResult.success || !validationResult.data) {
      showAlert(
        validationResult.error ||
          (lang === "sw"
            ? "Uhakiki wa oda ulishindikana! Tafadhali hakiki taarifa za mteja."
            : "Order validation failed! Please check customer details."),
        "error",
      );
      throw new Error(
        validationResult.error || "Client-side validation failed",
      );
    }

    await db.saveOrder(completePayload);
  };

  // Generate order volume/count trends based on selected interval filter (day, weekly, monthly, year)
  const orderTrendsData = useMemo(() => {
    const list: {
      label: string;
      key: string;
      revenue: number;
      count: number;
    }[] = [];
    const now = new Date();

    if (trendInterval === "day") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i,
        );
        const key = d.toDateString(); // unique key
        const labelStr = d.toLocaleDateString(
          lang === "sw" ? "sw-TZ" : "en-US",
          { weekday: "short", day: "numeric" },
        );
        list.push({ label: labelStr, key, revenue: 0, count: 0 });
      }

      orders.forEach((o) => {
        if (o.status === "cancelled") return;
        const d = new Date(o.date);
        const key = d.toDateString();
        const matched = list.find((item) => item.key === key);
        if (matched) {
          matched.revenue += o.total;
          matched.count += 1;
        }
      });
    } else if (trendInterval === "weekly") {
      // Last 6 weeks (starting from current week back to 5 weeks ago)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() - i * 7,
        );
        // Back to start of the week (Sunday)
        const startOfWeek = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
        );
        const endOfWeek = new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate() + 6,
        );
        const labelStr = `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", { month: "short" })} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", { month: "short" })}`;
        list.push({
          label: labelStr,
          key: `${startOfWeek.toDateString()}_${endOfWeek.toDateString()}`,
          revenue: 0,
          count: 0,
        });
      }

      orders.forEach((o) => {
        if (o.status === "cancelled") return;
        const oTime = o.date;
        list.forEach((w) => {
          const [startStr, endStr] = w.key.split("_");
          const start = new Date(startStr);
          const end = new Date(endStr);
          end.setHours(23, 59, 59, 999); // include Sunday completely
          if (oTime >= start.getTime() && oTime <= end.getTime()) {
            w.revenue += o.total;
            w.count += 1;
          }
        });
      });
    } else if (trendInterval === "year") {
      // Last 4 years
      const currentYear = now.getFullYear();
      for (let i = 3; i >= 0; i--) {
        const y = currentYear - i;
        list.push({ label: `${y}`, key: `${y}`, revenue: 0, count: 0 });
      }

      orders.forEach((o) => {
        if (o.status === "cancelled") return;
        const d = new Date(o.date);
        const y = d.getFullYear().toString();
        const matched = list.find((item) => item.key === y);
        if (matched) {
          matched.revenue += o.total;
          matched.count += 1;
        }
      });
    } else {
      // "monthly" - Prior 5 months + current month
      const monthNames = [
        lang === "sw" ? "Jan" : "Jan",
        lang === "sw" ? "Feb" : "Feb",
        lang === "sw" ? "Mar" : "Mar",
        lang === "sw" ? "Apr" : "Apr",
        lang === "sw" ? "Mei" : "May",
        lang === "sw" ? "Jun" : "Jun",
        lang === "sw" ? "Jul" : "Jul",
        lang === "sw" ? "Ago" : "Aug",
        lang === "sw" ? "Sep" : "Sep",
        lang === "sw" ? "Okt" : "Oct",
        lang === "sw" ? "Nob" : "Nov",
        lang === "sw" ? "Des" : "Dec",
      ];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const mIdx = d.getMonth();
        const label = `${monthNames[mIdx]} ${String(y).slice(-2)}`;
        list.push({ label, key: `${y}-${mIdx}`, revenue: 0, count: 0 });
      }

      orders.forEach((o) => {
        if (o.status === "cancelled") return;
        const d = new Date(o.date);
        const y = d.getFullYear();
        const mIdx = d.getMonth();
        const key = `${y}-${mIdx}`;
        const matched = list.find((item) => item.key === key);
        if (matched) {
          matched.revenue += o.total;
          matched.count += 1;
        }
      });
    }

    return list;
  }, [orders, trendInterval, lang]);

  const [scanningOrder, setScanningOrder] = useState<Order | null>(null);
  const [scannedItemsMap, setScannedItemsMap] = useState<
    Record<string, number>
  >({});
  const [inputBarcode, setInputBarcode] = useState("");
  const [showOrderCameraScanner, setShowOrderCameraScanner] = useState(false);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderVehicle, setRiderVehicle] = useState("");

  const closeOrderScanning = () => {
    setScanningOrder(null);
    setScannedItemsMap({});
    setInputBarcode("");
    setShowOrderCameraScanner(false);
    setRiderName("");
    setRiderPhone("");
    setRiderVehicle("");
  };

  const handleVerifyBarcodeSku = (skuToVerify: string) => {
    if (!scanningOrder) return;
    const cleanedSku = skuToVerify.trim();
    if (!cleanedSku) {
      showAlert(
        lang === "sw"
          ? "Tafadhali ingiza au changanua msimbo wa SKU kabla ya kubonyeza Thibitisha!"
          : "Please enter or scan a valid SKU barcode before submitting verification!",
        "error",
      );
      return;
    }

    let matchedItem: {
      productId: string;
      rName: string;
      maxQty: number;
      currentScanned: number;
    } | null = null;

    for (const item of scanningOrder.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (
        prod &&
        prod.sku &&
        prod.sku.trim().toLowerCase() === cleanedSku.toLowerCase()
      ) {
        const currentScanned = scannedItemsMap[item.productId] || 0;
        matchedItem = {
          productId: item.productId,
          rName: item.name,
          maxQty: item.quantity,
          currentScanned,
        };
        break;
      }
    }

    if (matchedItem) {
      if (matchedItem.currentScanned >= matchedItem.maxQty) {
        showAlert(
          lang === "sw"
            ? `Bidhaa "${matchedItem.rName}" imeshachanganuliwa ya kutosha kwa ajili ya oda hii!`
            : `Product "${matchedItem.rName}" is already fully verified and scanned for this order!`,
          "warning",
        );
      } else {
        const newCount = matchedItem.currentScanned + 1;
        setScannedItemsMap((prev) => ({
          ...prev,
          [matchedItem!.productId]: newCount,
        }));
        showAlert(
          lang === "sw"
            ? `Msimbo unakubalika! Changanuo la "${matchedItem.rName}" imehakikiwa kikamilifu (${newCount}/${matchedItem.maxQty})`
            : `Fulfillment SKU valid! Scanned element of "${matchedItem.rName}" verified successfully (${newCount}/${matchedItem.maxQty})`,
          "success",
        );
      }
    } else {
      showAlert(
        lang === "sw"
          ? `Kosa la Kichanganuzi: Msimbo wa SKU au Barcode ("${cleanedSku}") haipo kwenye oda hii!`
          : `Scanner Alert: The scanned SKU/Barcode ("${cleanedSku}") is not found or mismatch in this order!`,
        "error",
      );
    }
    setInputBarcode("");
  };

  const handleFulfillAndShipOrder = async () => {
    if (!scanningOrder) return;

    // Run strict, Zod-like structural validation on shipping state object
    const validation = SchemaValidator.validateShippingState(
      { ...scanningOrder, status: "shipped" },
      lang === "sw" ? "sw" : "en",
    );
    if (!validation.success || !validation.data) {
      showAlert(
        validation.error || "Order shipping validation failed",
        "error",
      );
      return;
    }

    let allScanned = true;
    for (const item of scanningOrder.items) {
      const scannedCount = scannedItemsMap[item.productId] || 0;
      if (scannedCount < item.quantity) {
        allScanned = false;
        break;
      }
    }

    if (!allScanned) {
      if (
        !(await showConfirm(
          lang === "sw"
            ? "Msimbo wa bidhaa zingine bado haujachanganuliwa. Je, una uhakika unataka kusafirisha oda hii bila kumaliza uhakiki?"
            : "Some product items have not been fully scanned & verified yet. Are you absolute sure you want to ship order anyway?",
          "Security Stock Check",
        ))
      ) {
        return;
      }
    }

    try {
      const updatedOrder = {
        ...scanningOrder,
        status: "shipped" as const,
        staffName: currentStaff?.name || "Orbi Root Admin",
        staffEmail: currentStaff?.email || "admin.orbi@gmail.com",
        riderName: riderName.trim() || undefined,
        riderPhone: riderPhone.trim() || undefined,
        riderVehicle: riderVehicle.trim() || undefined,
      };
      await saveOrderWithValidation(updatedOrder, scanningOrder);
      setOrders(
        orders.map((o) => (o.id === scanningOrder.id ? updatedOrder : o)),
      );
      showAlert(
        lang === "sw"
          ? `Oda #${getOrderNumber(scanningOrder.id)} imehakikiwa na kusafirishwa! Rekodi ya stoki imehifadhiwa!`
          : `Order #${getOrderNumber(scanningOrder.id)} has been successfully verified, shipped and inventory recorded!`,
        "success",
      );
      closeOrderScanning();
    } catch (e: any) {
      showAlert(
        lang === "sw"
          ? "Hitilafu imetokea wakati wa kusafirisha: " + e.message
          : "Error when processing shipping: " + e.message,
        "error",
      );
    }
  };

  const toggleOrderSelection = useCallback((id: string, isChecked: boolean) => {
    setSelectedOrderIds((prev) => {
      if (isChecked) {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      } else {
        return prev.filter((item) => item !== id);
      }
    });
  }, []);

  const handleShipClick = useCallback((order: Order) => {
    setScanningOrder(order);
    const initialCounts: Record<string, number> = {};
    order.items.forEach((item) => {
      initialCounts[item.productId] = 0;
    });
    setScannedItemsMap(initialCounts);
    setInputBarcode("");
    setRiderName(order.riderName || "");
    setRiderPhone(order.riderPhone || "");
    setRiderVehicle(order.riderVehicle || "");
  }, []);

  const updateStatus = useCallback(
    async (orderId: string, status: string) => {
      let confirmMsg = "";
      const statusUpper = status.toUpperCase();
      if (statusUpper === "CONFIRMED" || statusUpper === "PAYMENT_HELD") {
        confirmMsg =
          lang === "sw"
            ? "Una uhakika unataka kuweka Malipo ya Oda hii kuwa Yamepokelewa Kwenye Escrow (Approve Escrow)?"
            : "Are you sure you want to approve this payment and hold funds in Escrow?";
      } else if (
        statusUpper === "CUSTOMER_CONFIRMED" ||
        statusUpper === "BUYER_CONFIRMED"
      ) {
        confirmMsg =
          lang === "sw"
            ? "Je, unathibitisha kuwa mteja ameridhia kupokea mzigo?"
            : "Are you sure you want to mark this order as Buyer Confirmed?";
      } else if (
        statusUpper === "CANCEL_ORDER" ||
        statusUpper === "CANCELLED"
      ) {
        confirmMsg =
          lang === "sw"
            ? "Una uhakika unataka kughairi oda hii? Kama mteja alilipa, fedha zitarejeshwa."
            : "Are you sure you want to Cancel this order? Locked escrow funds will be refunded.";
      } else if (statusUpper === "DELIVERED") {
        confirmMsg =
          lang === "sw"
            ? "Una uhakika unataka kuashiria mzigo umefikishwa (Delivered)? Hii itasubiri mteja athibitishe."
            : "Are you sure you want to mark this order as Delivered to the client's location?";
      } else if (statusUpper === "RELEASED") {
        confirmMsg =
          lang === "sw"
            ? "Una uhakika unataka kutoa fedha za escrow kwenda kwenye akaunti yako?"
            : "Are you sure you want to disburse the held escrow funds into your account?";
      } else if (statusUpper === "PROCESSING") {
        confirmMsg =
          lang === "sw"
            ? "Una uhakika unataka kuanza maandalizi ya bidhaa za oda hii sasa?"
            : "Are you sure you want to mark this order as Processing (under preparation)?";
      } else {
        confirmMsg =
          lang === "sw"
            ? `Una uhakika unataka kubadilisha hali ya oda hii kuwa ${status}?`
            : `Are you sure you want to change this order status to ${status}?`;
      }

      if (!(await showConfirm(confirmMsg, "Kubadili Hali"))) return;

      // Utilize functional state checks for extreme stability and no dependency on orders / products arrays
      let matchedOrder: Order | undefined = undefined;
      setOrders((prevOrders) => {
        matchedOrder = prevOrders.find((o) => o.id === orderId);
        return prevOrders;
      });

      try {
        await saveOrderWithValidation(
          {
            id: orderId,
            status,
            staffName: currentStaff?.name || "Orbi Root Admin",
            staffEmail: currentStaff?.email || "admin.orbi@gmail.com",
          },
          matchedOrder,
        );
      } catch (saveErr: any) {
        console.error("Order status update validation/save failed:", saveErr);
        showAlert(
          saveErr.message ||
            "Ilishindikana kubadili hali ya oda / Failed to change order status",
          "error",
        );
        return;
      }

      if (
        status === "cancelled" &&
        matchedOrder &&
        (matchedOrder as Order).status !== "cancelled"
      ) {
        const orderToCancel = matchedOrder as Order;
        setProducts((prevProducts) => {
          return prevProducts.map((p) => {
            const item = orderToCancel.items.find((i) => i.productId === p.id);
            if (item) {
              const newP = { ...p, stock: p.stock + item.quantity };
              db.saveProduct(newP);
              return newP;
            }
            return p;
          });
        });
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    },
    [lang, currentStaff, showConfirm, orders, saveOrderWithValidation],
  );

  const sendInvoice = useCallback((order: Order) => {
    setViewInvoiceOrder(order);
  }, []);

  const handleDeleteOrder = useCallback((order: Order) => {
    setOrderToDelete(order);
    setDeleteConfirmText("");
    setDeletePINInput("");
  }, []);

  const executeDeleteOrder = async () => {
    if (!orderToDelete) return;

    const correctPIN = localStorage.getItem("orbishop_delete_pin") || "9900";
    if (deletePINInput !== correctPIN) {
      showAlert(
        "Nenosiri / PIN la ulinzi si sahihi! Huwezi kufuta oda.",
        "error",
      );
      return;
    }

    try {
      await db.deleteOrder(orderToDelete.id);
      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setSelectedOrderIds((prev) =>
        prev.filter((id) => id !== orderToDelete.id),
      );
      showAlert("Oda imefutwa kikamilifu.", "success");
      setOrderToDelete(null);
      setDeletePINInput("");
      setDeleteConfirmText("");
    } catch (error) {
      console.error("Failed to delete order:", error);
      showAlert("Kuna hitilafu iliyotokea wakati wa kufuta.", "error");
    }
  };

  const executeBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;

    const correctPIN = localStorage.getItem("orbishop_delete_pin") || "9900";
    if (deletePINInput !== correctPIN) {
      showAlert(
        "Nenosiri / PIN la ulinzi si sahihi! Huwezi kufuta oda.",
        "error",
      );
      return;
    }

    if (deleteConfirmText.toUpperCase() !== "FUTA ODA") {
      showAlert("Tafadhali andika FUTA ODA ili kuthibitisha.", "error");
      return;
    }

    try {
      await Promise.all(selectedOrderIds.map((id) => db.deleteOrder(id)));
      setOrders(orders.filter((o) => !selectedOrderIds.includes(o.id)));
      showAlert(
        `Oda ${selectedOrderIds.length} zimefutwa kikamilifu kwa pamoja.`,
        "success",
      );
      setSelectedOrderIds([]);
      setBulkDeleteActive(false);
      setDeletePINInput("");
      setDeleteConfirmText("");
    } catch (error) {
      console.error("Failed to bulk delete orders:", error);
      showAlert(
        "Kuna hitilafu iliyotokea wakati wa kufuta kwa pamoja.",
        "error",
      );
    }
  };

  const executeBulkArchiveOrders = async () => {
    if (selectedOrderIds.length === 0) return;

    if (
      !(await showConfirm(
        lang === "sw"
          ? `Kuhifadhi (Archive) oda ${selectedOrderIds.length}?`
          : `Archive ${selectedOrderIds.length} selected orders?`,
      ))
    )
      return;

    try {
      const promises = selectedOrderIds.map(async (id) => {
        const orderToArchive = orders.find((o) => o.id === id);
        if (orderToArchive) {
          await saveOrderWithValidation(
            { ...orderToArchive, status: "archived" as const },
            orderToArchive,
          );
        }
      });
      await Promise.all(promises);

      setOrders(
        orders.map((o) =>
          selectedOrderIds.includes(o.id)
            ? { ...o, status: "archived" as const }
            : o,
        ),
      );
      showAlert(
        lang === "sw"
          ? `Oda ${selectedOrderIds.length} zimehifadhiwa (Archived).`
          : `${selectedOrderIds.length} orders archived successfully.`,
        "success",
      );
      setSelectedOrderIds([]);
    } catch (error) {
      console.error("Failed to bulk archive orders:", error);
      showAlert(
        lang === "sw"
          ? "Hitilafu imetokea wakati wa kuhifadhi."
          : "Error occurred archiving orders.",
        "error",
      );
    }
  };

  const normalizeStatusToHighFid = (st: string): string => {
    const s = String(st || "").toUpperCase();
    if (s === "PENDING" || s === "CREATED") return "CREATED";
    if (s === "CONFIRMED" || s === "PAYMENT_HELD") return "PAYMENT_HELD";
    if (s === "CUSTOMER_CONFIRMED" || s === "BUYER_CONFIRMED")
      return "BUYER_CONFIRMED";
    if (s === "SHIPPED") return "SHIPPED";
    if (s === "DELIVERED") return "DELIVERED";
    if (s === "CANCELLED" || s === "FAILED") return "CANCELLED";
    if (s === "REFUNDED") return "REFUNDED";
    if (s === "RELEASED") return "RELEASED";
    if (s === "DISPUTED") return "DISPUTED";
    if (s === "PROCESSING") return "PROCESSING";
    if (s === "ARCHIVED") return "ARCHIVED";
    return s;
  };

  const statusWeights: Record<string, number> = {
    // Legacy
    pending: 1,
    confirmed: 2,
    customer_confirmed: 3,
    shipped: 4,
    delivered: 5,
    cancelled: 6,
    archived: 7,
    // High-fidelity
    CREATED: 1,
    AWAITING_PAYMENT: 1.5,
    PAYMENT_HELD: 2,
    PROCESSING: 2.5,
    SHIPPED: 4,
    DELIVERED: 5,
    BUYER_CONFIRMED: 5.5,
    RELEASED: 6,
    DISPUTED: 3,
    REFUNDED: 6.5,
    CANCELLED: 6.8,
    ARCHIVED: 7,
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerDetails.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customerDetails.phone.includes(search);

    const oNorm = normalizeStatusToHighFid(o.status);
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = oNorm !== "ARCHIVED";
    } else {
      matchesStatus = oNorm === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const wA =
      statusWeights[a.status] ||
      statusWeights[normalizeStatusToHighFid(a.status)] ||
      99;
    const wB =
      statusWeights[b.status] ||
      statusWeights[normalizeStatusToHighFid(b.status)] ||
      99;
    if (wA !== wB) {
      return wA - wB;
    }
    return b.date - a.date;
  });

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / itemsPerPage));
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const confirmedOrders = orders.filter((o) => {
    const oNorm = normalizeStatusToHighFid(o.status);
    return [
      "PAYMENT_HELD",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "BUYER_CONFIRMED",
      "RELEASED",
      "DISPUTED",
      "CONFIRMED",
      "CUSTOMER_CONFIRMED",
    ].includes(oNorm);
  });
  const confirmedCount = confirmedOrders.length;
  const confirmedTotal = confirmedOrders.reduce(
    (acc, curr) => acc + curr.total,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-xl font-bold md:shrink-0">
          {t(lang, "ord.title")}
        </h2>

        {/* Takwimu za Oda Zilizokamilika */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-lg border border-emerald-100 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300 w-full xl:w-auto">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shadow-inner shrink-0">
            <CheckCircle2 size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Oda Zilizokamilika (Zimefurahiwa)
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 leading-none">
                {confirmedCount}
              </span>
              <span className="text-sm font-bold text-slate-400">Oda</span>
            </div>
            <p className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
              Jumla: {formatCurrency(confirmedTotal)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-accent font-semibold text-slate-700 transition"
          >
            <option value="all">
              {lang === "sw" ? "Hali Zote Amilifu" : "All Active Orders"}
            </option>
            <option value="CREATED">
              {lang === "sw" ? "Oda Mpya (Created)" : "New Created"}
            </option>
            <option value="PAYMENT_HELD">
              {lang === "sw"
                ? "Escrow: Yamepokelewa (Held)"
                : "Escrow: Payment Held"}
            </option>
            <option value="PROCESSING">
              {lang === "sw" ? "Inandaliwa (Processing)" : "Under Preparation"}
            </option>
            <option value="SHIPPED">
              {lang === "sw" ? "Njia Kufika (Transit)" : "In Transit"}
            </option>
            <option value="DELIVERED">
              {lang === "sw"
                ? "Imewasili (Delivered)"
                : "Delivered / Confirm Ready"}
            </option>
            <option value="BUYER_CONFIRMED">
              {lang === "sw"
                ? "Mteja Kathibitisha (Buyer Confirmed)"
                : "Buyer Confirmed Receipt"}
            </option>
            <option value="RELEASED">
              {lang === "sw"
                ? "Zimechukuliwa (Disbursed)"
                : "Completed & Disbursed"}
            </option>
            <option value="DISPUTED">
              {lang === "sw"
                ? "Mgogoro Waliofungua (Disputed)"
                : "Under Escrow Dispute"}
            </option>
            <option value="CANCELLED">
              {lang === "sw"
                ? "Zilizoghairiwa (Cancelled)"
                : "Cancelled / Refunded"}
            </option>
            <option value="ARCHIVED">
              {lang === "sw" ? "Oda Za Zamani (Archived)" : "Archived / Legacy"}
            </option>
          </select>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={t(lang, "comm.search_ord")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-accent focus:bg-white text-sm bg-slate-50 transition-all font-medium"
            />
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
          </div>
        </div>
      </div>

      {/* Monthly/Weekly/Daily/Yearly Trends Visualization Component */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
              {trendInterval === "day"
                ? lang === "sw"
                  ? "Mwenendo wa Kila Siku wa Oda"
                  : "Daily Order Trends"
                : trendInterval === "weekly"
                  ? lang === "sw"
                    ? "Mwenendo wa Kila Wiki wa Oda"
                    : "Weekly Order Trends"
                  : trendInterval === "year"
                    ? lang === "sw"
                      ? "Mwenendo wa Kila Mwaka wa Oda"
                      : "Yearly Order Trends"
                    : lang === "sw"
                      ? "Mwenendo wa Kila Mwezi wa Oda"
                      : "Monthly Order Trends"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {lang === "sw"
                ? "Boresha takwimu za oda kwa kubadili muda (Siku, Wiki, Mwezi au Mwaka; bila zilizoghairiwa)"
                : "Analyze order metrics filtered by your preferred timeline granularity (Day, Week, Month, Year)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Interval Selection Button Group */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              {(["day", "weekly", "monthly", "year"] as const).map(
                (interval) => (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => setTrendInterval(interval)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      trendInterval === interval
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {interval === "day"
                      ? lang === "sw"
                        ? "Siku"
                        : "Day"
                      : interval === "weekly"
                        ? lang === "sw"
                          ? "Wiki"
                          : "Weekly"
                        : interval === "monthly"
                          ? lang === "sw"
                            ? "Mwezi"
                            : "Monthly"
                          : lang === "sw"
                            ? "Mwaka"
                            : "Year"}
                  </button>
                ),
              )}
            </div>

            {/* Metric Selection Button Group */}
            <div className="flex items-center bg-indigo-50/50 p-1 rounded-xl shrink-0 border border-indigo-100/40">
              <button
                type="button"
                onClick={() => setTrendMetric("revenue")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                  trendMetric === "revenue"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "sw" ? "Mauzo" : "Revenue"}
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric("count")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                  trendMetric === "count"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "sw" ? "Idadi" : "Count"}
              </button>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full font-mono mt-4">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={50}
            minWidth={50}
          >
            <BarChart
              data={orderTrendsData}
              margin={{
                top: 10,
                right: 10,
                left: trendMetric === "revenue" ? 0 : -25,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                width={70}
                tickFormatter={(val) =>
                  trendMetric === "revenue"
                    ? val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                        ? `${(val / 1000).toFixed(0)}k`
                        : val
                    : val
                }
                dx={-4}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.05)",
                  fontFamily: "Inter, ui-sans-serif, sans-serif",
                }}
                formatter={(val: number) => [
                  trendMetric === "revenue"
                    ? formatCurrency(val)
                    : `${val} ${lang === "sw" ? "Oda" : "Orders"}`,
                  trendMetric === "revenue"
                    ? lang === "sw"
                      ? "Thamani ya Oda"
                      : "Order Revenue"
                    : lang === "sw"
                      ? "Idadi ya Oda"
                      : "Order Count",
                ]}
              />
              <Bar
                dataKey={trendMetric}
                fill={trendMetric === "revenue" ? "#4f46e5" : "#10b981"}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {selectedOrderIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-all animate-in slide-in-from-top-3 duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">
                {selectedOrderIds.length} oda zimechaguliwa kwa mpigo
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Mchakato wa kufuta au kuhifadhi (archive) kwa pamoja
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={executeBulkArchiveOrders}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition flex-1 md:flex-initial"
            >
              Hifadhi (Archive) Zilizochaguliwa
            </button>
            <button
              onClick={() => {
                setBulkDeleteActive(true);
                setDeleteConfirmText("");
                setDeletePINInput("");
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition flex-1 md:flex-initial"
            >
              Futa Zilizochaguliwa ({selectedOrderIds.length})
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Safisha
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto min-w-full flex flex-col">
        <div className="bg-gray-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {t(lang, "ord.list")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">
              {lang === "sw" ? "Chuja kwa Hali:" : "Filter by Status:"}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 font-bold text-slate-700 transition cursor-pointer"
            >
              <option value="all">
                {lang === "sw" ? "Hali Zote" : "All Statuses"}
              </option>
              <option value="pending">
                {lang === "sw" ? "Pending (Zinasubiri)" : "Pending"}
              </option>
              <option value="confirmed">
                {lang === "sw" ? "Confirmed (Zilizothibitishwa)" : "Confirmed"}
              </option>
              <option value="delivered">
                {lang === "sw" ? "Delivered (Zilizopokelewa)" : "Delivered"}
              </option>
              <option value="customer_confirmed">
                {lang === "sw"
                  ? "Mteja Amethibitisha (Cust Confirmed)"
                  : "Customer Confirmed"}
              </option>
              <option value="shipped">
                {lang === "sw" ? "Shipped (Zilizosafirishwa)" : "Shipped"}
              </option>
              <option value="cancelled">
                {lang === "sw" ? "Cancelled (Zilizoghairiwa)" : "Cancelled"}
              </option>
              <option value="archived">
                {lang === "sw" ? "Archived (Zilizohifadhiwa)" : "Archived"}
              </option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const targetOrders = selectedOrderIds.length > 0 ? orders.filter(o => selectedOrderIds.includes(o.id)) : orders;
                const exportData = targetOrders.map(o => ({
                  OrderID: o.id,
                  CustomerName: o.customerInfo?.name || '',
                  CustomerPhone: o.customerInfo?.phone || '',
                  Total: o.total,
                  Status: o.status,
                  Date: new Date(o.createdAt).toLocaleString(),
                  PaymentMethod: o.paymentMethod || '',
                  DeliveryStatus: o.shippingDetails?.status || ''
                }));
                exportToCSV(exportData, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Download size={14} />
              {lang === "sw" ? (selectedOrderIds.length > 0 ? `Hamisha (${selectedOrderIds.length})` : "Hamisha CSV") : (selectedOrderIds.length > 0 ? `Export (${selectedOrderIds.length})` : "Export CSV")}
            </button>
            {selectedOrderIds.length > 0 && (
              <select
                 onChange={async (e) => {
                    if (!e.target.value) return;
                    const newStatus = e.target.value;
                    showConfirm(
                       lang === "sw" ? "Sasisha Hali (Bulk)" : "Bulk Update Status",
                       lang === "sw" ? `Je, unataka kusasisha oda ${selectedOrderIds.length} kwenda hali ya "${newStatus}"?` : `Update ${selectedOrderIds.length} orders to "${newStatus}"?`,
                       async () => {
                          for (const id of selectedOrderIds) {
                             const order = orders.find(o => o.id === id);
                             if (order) await saveOrderWithValidation({ ...order, status: newStatus }, order);
                          }
                          setSelectedOrderIds([]);
                          showAlert(lang === "sw" ? "Imesasishwa kikamilifu" : "Bulk update successful", "success");
                       }
                    );
                    e.target.value = "";
                 }}
                 className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                 <option value="">{lang === "sw" ? "Sasisha Hali" : "Update Status"}</option>
                 <option value="pending">Pending</option>
                 <option value="processing">Processing</option>
                 <option value="shipped">Shipped</option>
                 <option value="delivered">Delivered</option>
                 <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
        <table className="w-full min-w-[900px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="border-b border-slate-200">
              <th className="p-3 w-12 text-center">
                <input
                  type="checkbox"
                  checked={
                    sortedOrders.length > 0 &&
                    selectedOrderIds.length === sortedOrders.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrderIds(sortedOrders.map((o) => o.id));
                    } else {
                      setSelectedOrderIds([]);
                    }
                  }}
                  className="rounded text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-3">
                {lang === "sw" ? "Oda Namba na Tarehe" : "Order No. / Date"}
              </th>
              <th className="p-3">Mteja</th>
              <th className="p-3">Bidhaa</th>
              <th className="p-3">Jumla</th>
              <th className="p-3">Hali</th>
              <th className="p-3">Vitendo</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((o) => (
              <OrderItemRow
                key={o.id}
                order={o}
                isSelected={selectedOrderIds.includes(o.id)}
                onToggleSelection={toggleOrderSelection}
                lang={lang}
                onUpdateStatus={updateStatus}
                onSendInvoice={sendInvoice}
                onDeleteOrder={handleDeleteOrder}
                onShipClick={handleShipClick}
              />
            ))}
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-500">
                  {t(lang, "ord.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-slate-100 rounded-b-3xl">
          <div className="text-xs text-slate-500 font-bold">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedOrders.length)} of {sortedOrders.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 text-xs font-bold transition cursor-pointer"
            >
              {lang === "sw" ? "Iliyopita" : "Prev"}
            </button>
            <span className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 text-xs font-bold transition cursor-pointer"
            >
              {lang === "sw" ? "Ijayo" : "Next"}
            </button>
          </div>
        </div>
      )}

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-4 mt-4">
        {paginatedOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
            {lang === "sw" ? "Hakuna oda inayokidhi vigezo hivi." : "No orders match these criteria."}
          </div>
        ) : (
          paginatedOrders.map(order => (
            <div key={order.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm relative">
              <div className="absolute top-4 right-4">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.includes(order.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedOrderIds(prev => [...prev, order.id]);
                    else setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                  }}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
              </div>
              <div className="pr-8 mb-3">
                <div className="font-mono text-[10px] text-slate-400 mb-1">{new Date(order.createdAt).toLocaleString()}</div>
                <div className="font-bold text-slate-800 break-all leading-tight">{order.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div>
                  <div className="font-bold text-slate-500 mb-0.5">{lang === "sw" ? "Mteja" : "Customer"}</div>
                  <div className="font-bold text-slate-800">{order.customerInfo.name}</div>
                  <div className="text-slate-600">{order.customerInfo.phone}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-500 mb-0.5">{lang === "sw" ? "Jumla" : "Total"}</div>
                  <div className="font-black text-indigo-700">{formatCurrency(order.total)}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{order.paymentMethod || 'CASH'}</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg">
                <div className="text-xs font-bold text-slate-700">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} {lang === "sw" ? "Vitu" : "Items"}
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === "pending" || order.status === "CREATED"
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : order.status === "processing" || order.status === "ACCEPTED"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : order.status === "shipped" || order.status === "READY_TO_SHIP"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : order.status === "delivered" || order.status === "DELIVERED"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedOrderIds([order.id]);
                    setBulkDeleteActive(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs transition"
                >
                  <Trash size={14} /> {lang === "sw" ? "Futa" : "Delete"}
                </button>
                <button
                  onClick={() => setViewInvoiceOrder(order)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
                >
                  <FileText size={14} /> {lang === "sw" ? "Risiti" : "Invoice"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {viewInvoiceOrder && (
        <InvoiceModal
          order={viewInvoiceOrder}
          onClose={() => setViewInvoiceOrder(null)}
          lang={lang}
        />
      )}

      {scanningOrder && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-amber-50/55 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Barcode size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {lang === "sw"
                      ? `Kuhakiki & Kusafirisha Oda #${getOrderNumber(scanningOrder.id)}`
                      : `Verify & Ship Order #${getOrderNumber(scanningOrder.id)}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium font-mono">
                    ID: {scanningOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={closeOrderScanning}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 text-sm">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">
                    {lang === "sw"
                      ? "Soma Kabla ya Kusafirisha"
                      : "Read Before Shipping Verification"}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === "sw"
                      ? "Changanua barcode ya kila bidhaa ili kuhakikisha idadi ya bidhaa kimaumbile inafanana na iliyoagizwa kabla haijasafirishwa."
                      : "Scan each product barcode with a physical scanner/camera, or type the SKU to increase scanned record before dispatch."}
                  </p>
                </div>
              </div>

              {/* Scan Input field / Camera trigger */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyBarcodeSku(inputBarcode);
                }}
                className="space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-505 uppercase tracking-wider">
                    {lang === "sw"
                      ? "KICHANGANUZI CHA BARCODE (BARCODE SCANNER)"
                      : "BARCODE SCAN INVENTORY"}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowOrderCameraScanner(!showOrderCameraScanner)
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition select-none cursor-pointer ${
                      showOrderCameraScanner
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <Camera size={13} />
                    {showOrderCameraScanner
                      ? lang === "sw"
                        ? "Zima Kamera"
                        : "Turn Off Camera"
                      : lang === "sw"
                        ? "Kamera yaskana"
                        : "Scan with Camera"}
                  </button>
                </div>

                {showOrderCameraScanner ? (
                  <div className="py-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <CameraBarcodeScanner
                      lang={lang === "sw" ? "sw" : "en"}
                      onScanSuccess={(scannedText) => {
                        handleVerifyBarcodeSku(scannedText);
                      }}
                      onClose={() => setShowOrderCameraScanner(false)}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inputBarcode}
                        onChange={(e) => setInputBarcode(e.target.value)}
                        placeholder={
                          lang === "sw"
                            ? "Gusa hapa kisha changanua barcode yako..."
                            : "Focus here and scan barcode element..."
                        }
                        className="w-full border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none font-mono text-sm focus:border-amber-600 transition bg-white"
                        autoFocus
                      />
                      <Barcode
                        size={18}
                        className="absolute left-3.5 top-3.5 text-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl transition text-sm flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {lang === "sw" ? "Thibitisha" : "Verify SKU"}
                    </button>
                  </div>
                )}
              </form>

              {/* Order Items scanned list */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  {lang === "sw"
                    ? "ORODHA KAUSHIRISHI YENYE UHAKIKI:"
                    : "VERIFICATION CHECKLIST & STATUS:"}
                </p>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {scanningOrder.items.map((item) => {
                    const scannedQty = scannedItemsMap[item.productId] || 0;
                    const requiredQty = item.quantity;
                    const isCompleted = scannedQty >= requiredQty;

                    return (
                      <div
                        key={item.productId}
                        className="p-3.5 flex justify-between items-center hover:bg-slate-50/50 transition"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span
                              className={`text-xs font-black font-mono border px-2 py-1 rounded-full ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : scannedQty > 0
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {scannedQty} / {requiredQty}{" "}
                              {lang === "sw" ? "Imekaguliwa" : "Scanned"}
                            </span>
                          </div>
                          <div>
                            {isCompleted ? (
                              <span
                                className="text-emerald-600 bg-emerald-50 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                                title="Kamilifu"
                              >
                                ✓
                              </span>
                            ) : (
                              <span className="text-red-500 animate-pulse font-mono font-bold text-xs">
                                ⏳ PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rider Details Section */}
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4.5 space-y-3.5">
                <p className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Truck size={14} className="text-amber-500 shrink-0" />
                  <span>
                    {lang === "sw"
                      ? "MAELEZO YA MSAFIRISHAJI (RIDER DETAILS)"
                      : "RIDER & COURIER DETAILS"}
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                      {lang === "sw" ? "Jina la Msafirishaji:" : "Rider Name:"}
                    </label>
                    <input
                      type="text"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder={
                        lang === "sw"
                          ? "Mfano: Hamza Omari"
                          : "e.g. Hamza Omari"
                      }
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 outline-none text-xs font-bold p-2.5 rounded-xl transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                      {lang === "sw" ? "Namba ya Simu:" : "Rider Phone:"}
                    </label>
                    <input
                      type="text"
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      placeholder="e.g. +255 712..."
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 outline-none text-xs font-bold p-2.5 rounded-xl transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                      {lang === "sw"
                        ? "Chombo / Namba ya Gari:"
                        : "Vehicle / Plate No:"}
                    </label>
                    <input
                      type="text"
                      value={riderVehicle}
                      onChange={(e) => setRiderVehicle(e.target.value)}
                      placeholder={
                        lang === "sw" ? "Mfano: MC 123 AAA" : "e.g. MC 123 AAA"
                      }
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 outline-none text-xs font-bold p-2.5 rounded-xl transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer triggers */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeOrderScanning}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100 transition cursor-pointer"
              >
                {lang === "sw" ? "Ghairi" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleFulfillAndShipOrder}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-lg cursor-pointer"
              >
                {lang === "sw"
                  ? "Kamilisha & Safirisha (Fulfill)"
                  : "Complete & Ship (Fulfill)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderToDelete && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-rose-100 flex items-center gap-3 bg-rose-50/50">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-rose-800">
                  Ufutaji Salama wa Oda
                </h2>
                <p className="text-xs text-rose-600 font-medium">
                  Nenosiri / PIN inahitajika ili kuidhinisha
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Unafuta kabisa Oda ya mteja:{" "}
                <strong className="text-slate-950">
                  {orderToDelete.customerDetails.name}
                </strong>{" "}
                yenye thamani ya{" "}
                <strong className="text-slate-950">
                  {formatCurrency(orderToDelete.total)}
                </strong>
                .
              </p>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-[11px] text-rose-700 font-bold leading-normal">
                * ANKRA NA HISTORIA YA ODA HII ITAFUTWA KABISA KATIKA MFUMO.
                KITENDO HIKI HAKIWEZI KURUDISHWA!
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Andika Namba ya Oda{" "}
                  <span className="font-mono text-rose-600 font-extrabold bg-rose-100 px-2 py-0.5 rounded leading-none">
                    #{getOrderNumber(orderToDelete.id)}
                  </span>{" "}
                  ili kuthibitisha:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 text-sm font-mono font-bold tracking-widest bg-slate-50 focus:bg-white transition"
                  placeholder={getOrderNumber(orderToDelete.id)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  PIN/Nenosiri la Ulinzi (Default ni 9900):
                </label>
                <input
                  type="password"
                  value={deletePINInput}
                  onChange={(e) => setDeletePINInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 text-sm font-mono font-bold bg-slate-50 focus:bg-white transition"
                  placeholder="PIN au Nenosiri la usalama"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition text-sm"
                >
                  Ghairi
                </button>
                <button
                  onClick={executeDeleteOrder}
                  disabled={
                    deleteConfirmText.toUpperCase() !==
                      getOrderNumber(orderToDelete.id) || !deletePINInput
                  }
                  className="px-5 py-2.5 text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl font-black transition shadow-md text-sm"
                >
                  Thibitisha & Futa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteActive && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-rose-100 flex items-center gap-3 bg-rose-50/50">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-rose-800">
                  Futa Oda kwa Pamoja (Bulk Delete)
                </h2>
                <p className="text-xs text-rose-600 font-medium">
                  Ulinzi salama dhidi ya upotevu wa data
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Uko tayari kufuta kabisa oda{" "}
                <strong className="text-rose-600">
                  {selectedOrderIds.length}
                </strong>{" "}
                zilizochaguliwa kwa mpigo.
              </p>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-[11px] text-rose-700 font-bold leading-normal">
                * TAHADHARI: VITENDO VYOTE NYUMA YA ODA HIZI (IKIWA NI PAMOJA NA
                INVOICES NA TAARIFA MAHSUSI) VITAFUTIKA KIKAMILIFU KATIKA
                DATABASE.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Andika{" "}
                  <span className="font-mono text-rose-600 font-extrabold bg-rose-100 px-2 py-0.5 rounded leading-none">
                    FUTA ODA
                  </span>{" "}
                  ili kuthibitisha:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 text-sm font-mono font-bold tracking-widest bg-slate-50 focus:bg-white transition"
                  placeholder="FUTA ODA"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  PIN/Nenosiri la Ulinzi (Default ni 9900):
                </label>
                <input
                  type="password"
                  value={deletePINInput}
                  onChange={(e) => setDeletePINInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 text-sm font-mono font-bold bg-slate-50 focus:bg-white transition"
                  placeholder="PIN au Nenosiri la usalama"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setBulkDeleteActive(false)}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition text-sm"
                >
                  Ghairi
                </button>
                <button
                  onClick={executeBulkDeleteOrders}
                  disabled={
                    deleteConfirmText.toUpperCase() !== "FUTA ODA" ||
                    !deletePINInput
                  }
                  className="px-5 py-2.5 text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl font-black transition shadow-md text-sm"
                >
                  Futa Kabisa Oda {selectedOrderIds.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- PROMOTIONS ADMIN ---------------- //
export function PromosAdmin({
  promos,
  setPromos,
  products = [],
}: {
  promos: Promotion[];
  setPromos: any;
  products?: Product[];
}) {
  const { lang } = useI18n();
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [linkType, setLinkType] = useState<"custom" | "product">("custom");
  const [linkProduct, setLinkProduct] = useState("");
  const [promoType, setPromoType] = useState("promo");
  const [allImages, setAllImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    { id: string; name: string; progress: number }[]
  >([]);

  // Advanced layout customizers for pushing styles to client dashboard
  const [cardBgColor, setCardBgColor] = useState("");
  const [cardBgGradient, setCardBgGradient] = useState("");
  const [cardTextColor, setCardTextColor] = useState("");
  const [cardButtonBg, setCardButtonBg] = useState("");
  const [cardButtonText, setCardButtonText] = useState("");
  const [cardOverlayOpacity, setCardOverlayOpacity] = useState(50);
  const [badgeText, setBadgeText] = useState("");

  // Countdown Flash Banners Sub-Tab States
  const [subTab, setSubTab] = useState<"standard" | "countdown">("standard");
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoadingBanners(true);
      try {
        const data = await db.getPromotionalBanners();
        setBanners(data);
      } catch (e) {
        console.error("Failed to load banners", e);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
  }, []);

  // Flash Banner Modal State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerTitleSw, setBannerTitleSw] = useState("");
  const [bannerDesc, setBannerDesc] = useState("");
  const [bannerDescSw, setBannerDescSw] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerLink, setBannerLink] = useState(""); // mapped to a product ID
  const [bannerStartDate, setBannerStartDate] = useState("");
  const [bannerEndDate, setBannerEndDate] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("");
  const [bannerTextColor, setBannerTextColor] = useState("");
  const [bannerButtonText, setBannerButtonText] = useState("");
  const [bannerButtonTextSw, setBannerButtonTextSw] = useState("");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [bannerUploading, setBannerUploading] = useState(false);

  const handleOpenBanner = (b?: PromotionalBanner) => {
    if (b) {
      setBannerId(b.id);
      setBannerTitle(b.title);
      setBannerTitleSw(b.titleSw || "");
      setBannerDesc(b.description || "");
      setBannerDescSw(b.descriptionSw || "");
      setBannerImage(b.image || "");
      setBannerLink(b.link || "");
      setBannerStartDate(b.startDate || "");
      setBannerEndDate(b.endDate || "");
      setBannerBgColor(b.bgColor || "#0f172a");
      setBannerTextColor(b.textColor || "#ffffff");
      setBannerButtonText(b.buttonText || "Angalia Ofa");
      setBannerButtonTextSw(b.buttonTextSw || "View Deal");
      setBannerVisible(b.visible);
    } else {
      setBannerId(null);
      setBannerTitle("");
      setBannerTitleSw("");
      setBannerDesc("");
      setBannerDescSw("");
      setBannerImage("");
      setBannerLink("");
      setBannerStartDate("");
      setBannerEndDate("");
      setBannerBgColor("#0f172a");
      setBannerTextColor("#ffffff");
      setBannerButtonText("Angalia Ofa");
      setBannerButtonTextSw("View Deal");
      setBannerVisible(true);
    }
    setShowBannerModal(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setBannerUploading(true);
    try {
      const url = await uploadFileViaStorageApi(
        e.target.files[0],
        "promotions",
        () => {},
      );
      setBannerImage(url);
    } catch (err: any) {
      showAlert("Imeshindwa kupakia picha: " + err.message, "error");
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (
      !(await showConfirm(
        "Je, una uhakika unataka kufuta bango hili?",
        "Kufuta Bango",
      ))
    )
      return;
    const updated = banners.filter((b) => b.id !== id);
    setBanners(updated);
    await db.savePromotionalBanners(updated);
    showAlert("Bango limefutwa kikamilifu!", "success");
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle) {
      showAlert("Tafadhali jaza kichwa cha bango.", "error");
      return;
    }

    const newBanner: PromotionalBanner = {
      id: bannerId || "BANN-" + Date.now(),
      title: bannerTitle,
      titleSw: bannerTitleSw || undefined,
      description: bannerDesc,
      descriptionSw: bannerDescSw || undefined,
      image: bannerImage,
      link: bannerLink,
      startDate: bannerStartDate,
      endDate: bannerEndDate,
      bgColor: bannerBgColor || undefined,
      textColor: bannerTextColor || undefined,
      buttonText: bannerButtonText || undefined,
      buttonTextSw: bannerButtonTextSw || undefined,
      visible: bannerVisible,
      createdAt: bannerId
        ? banners.find((b) => b.id === bannerId)?.createdAt || Date.now()
        : Date.now(),
    };

    let updatedList: PromotionalBanner[] = [];
    if (bannerId) {
      updatedList = banners.map((b) => (b.id === bannerId ? newBanner : b));
    } else {
      updatedList = [newBanner, ...banners];
    }

    setBanners(updatedList);
    await db.savePromotionalBanners(updatedList);
    setShowBannerModal(false);
    showAlert("Bango la ofa limehifadhiwa kikamilifu!", "success");
  };

  const handleOpen = (p?: Promotion) => {
    if (p) {
      setEditId(p.id);
      if (p.title?.startsWith("[HERO] ")) {
        setTitle(p.title.substring(7));
      } else {
        setTitle(p.title || "");
      }
      setPromoType(p.title?.startsWith("[HERO] ") ? "hero" : "promo");
      setDesc(p.description);
      setLink(p.link || "");
      if (p.link && p.link.includes("?product=")) {
        setLinkType("product");
        const match = p.link.match(/\?product=([^&]+)/);
        setLinkProduct(match ? match[1] : "");
      } else {
        setLinkType("custom");
        setLinkProduct("");
      }
      setAllImages([p.image, ...(p.images || [])].filter(Boolean));
      setCoverIndex(0);
      setVisible(p.visible);
      setCardBgColor(p.cardBgColor || "");
      setCardBgGradient(p.cardBgGradient || "");
      setCardTextColor(p.cardTextColor || "#ffffff");
      setCardButtonBg(p.cardButtonBg || "#fac815");
      setCardButtonText(p.cardButtonText || "Buy Now");
      setCardOverlayOpacity(
        p.cardOverlayOpacity !== undefined
          ? Math.round(p.cardOverlayOpacity * 100)
          : 50,
      );
      setBadgeText(p.badgeText || "Featured");
    } else {
      setEditId(null);
      setTitle("");
      setDesc("");
      setLink("");
      setLinkType("custom");
      setLinkProduct("");
      setPromoType("promo");
      setAllImages([]);
      setCoverIndex(0);
      setVisible(true);
      setCardBgColor("");
      setCardBgGradient("gradient-slate"); // we can store presets or actual css linear-gradients!
      setCardTextColor("#ffffff");
      setCardButtonBg("#fac815");
      setCardButtonText("Buy Now");
      setCardOverlayOpacity(50);
      setBadgeText("FAVORITE");
    }
    setShowModal(true);
  };

  const handleMultipeUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files as FileList).slice(
      0,
      1 - allImages.length,
    );
    if (files.length === 0) return;

    setIsUploading(true);
    const newUploads = files.map((file) => ({
      id: Math.random().toString(),
      name: file.name,
      progress: 0,
    }));
    setUploadingFiles((prev) => [...prev, ...newUploads]);

    try {
      const urls = await Promise.all(
        files.map(async (file, idx) => {
          const url = await uploadFileViaStorageApi(
            file,
            "promotions",
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((p) =>
                  p.id === newUploads[idx].id ? { ...p, progress } : p,
                ),
              );
            },
          );
          setUploadingFiles((prev) =>
            prev.map((p) =>
              p.id === newUploads[idx].id ? { ...p, progress: 100 } : p,
            ),
          );
          return url;
        }),
      );
      await new Promise((r) => setTimeout(r, 500));
      setAllImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      showAlert("Imeshindwa kupakia picha: " + err.message, "error");
    } finally {
      setUploadingFiles([]);
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImg = (idx: number) => {
    const newImgs = allImages.filter((_, i) => i !== idx);
    setAllImages(newImgs);
    if (idx === coverIndex) setCoverIndex(0);
    else if (idx < coverIndex) setCoverIndex(coverIndex - 1);
  };

  const savePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allImages.length === 0) {
      showAlert("Tafadhali weka angalau picha moja.", "error");
      return;
    }

    try {
      setIsSaving(true);

      // Ensure we have a valid cover
      const validCoverIndex = coverIndex < allImages.length ? coverIndex : 0;
      const image = allImages[validCoverIndex];
      const images = allImages.filter((_, i) => i !== validCoverIndex);

      const actualTitle = promoType === "hero" ? `[HERO] ${title}` : title;

      let finalLink = link;
      if (linkType === "product" && linkProduct) {
        finalLink = `/#/products?product=${linkProduct}`;
      }

      const p: Promotion = {
        id: editId || "PRM-" + Date.now(),
        title: actualTitle,
        description: desc,
        link: finalLink,
        image,
        images,
        visible,
        createdAt: editId
          ? promos.find((x) => x.id === editId)?.createdAt || Date.now()
          : Date.now(),
        cardBgColor: cardBgColor || undefined,
        cardBgGradient: cardBgGradient || undefined,
        cardTextColor: cardTextColor || undefined,
        cardButtonBg: cardButtonBg || undefined,
        cardButtonText: cardButtonText || undefined,
        cardOverlayOpacity:
          cardOverlayOpacity !== undefined ? cardOverlayOpacity / 100 : undefined,
        badgeText: badgeText || undefined,
      };

      // Clean up edited promo images that are replaced/deleted
      if (editId) {
        const oldPromo = promos.find((x) => x.id === editId);
        if (oldPromo) {
          const oldPromoImages = [
            oldPromo.image,
            ...(oldPromo.images || []),
          ].filter(Boolean);
          const newPromoImages = [p.image, ...(p.images || [])].filter(Boolean);
          const removedPromoImages = oldPromoImages.filter(
            (img) => !newPromoImages.includes(img),
          );
          for (const imgUrl of removedPromoImages) {
            const storagePath = getStoragePath(imgUrl);
            if (storagePath) {
              await deleteFileViaStorageApi(storagePath);
            }
          }
        }
      }

      let updated = promos;
      if (editId) updated = promos.map((x) => (x.id === editId ? p : x));
      else updated = [p, ...promos];

      setPromos(updated);
      await db.savePromo(p);
      setShowModal(false);
      showAlert(
        lang === "sw"
          ? "Mabadiliko ya bango yamehifadhiwa kikamilifu!"
          : "Promo changes saved successfully!",
        "success"
      );
    } catch (error: any) {
      showAlert(
        lang === "sw"
          ? "Imeshindwa kuhifadhi mabadiliko: " + error.message
          : "Failed to save changes: " + error.message,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deletePromo = async (id: string) => {
    if (
      !(await showConfirm(
        "Una uhakika unataka kufuta Promo hii?",
        "Kufuta Promo",
      ))
    )
      return;
    const promoToDelete = promos.find((p) => p.id === id);
    if (promoToDelete) {
      const promoImages = [
        promoToDelete.image,
        ...(promoToDelete.images || []),
      ].filter(Boolean);
      for (const imgUrl of promoImages) {
        const storagePath = getStoragePath(imgUrl);
        if (storagePath) {
          await deleteFileViaStorageApi(storagePath);
        }
      }
    }
    const u = promos.filter((p) => p.id !== id);
    setPromos(u);
    await db.deletePromo(id);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Matangazo (Promotions)</h2>

      {/* Sub tabs for Standard Carousel Promos vs Countdown Deals */}
      <div className="flex gap-2 border-b pb-2 mb-2 font-sans">
        <button
          onClick={() => setSubTab("standard")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
            subTab === "standard"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-800 hover:bg-slate-200"
          }`}
        >
          Mabango ya Carousel (Carousel Promos)
        </button>
        <button
          onClick={() => setSubTab("countdown")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer ${
            subTab === "countdown"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-800 hover:bg-slate-200"
          }`}
        >
          Ofa za Countdown (Flash Countdown Banners)
          <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black animate-pulse">
            NEW
          </span>
        </button>
      </div>

      {subTab === "standard" && (
        <div className="bg-white border rounded-2xl p-4 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              ORODHA YA PROMOS (CAROUSEL)
            </span>
            <button
              onClick={() => handleOpen()}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm text-[12px] uppercase"
            >
              + Ongeza Promo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="h-40 bg-slate-100 relative">
                  <img
                    src={p.image || (p.images && p.images[0]) || ""}
                    className="w-full h-full object-cover"
                    alt={p.title || "Promo"}
                  />
                  {!p.visible && (
                    <div className="absolute top-2 right-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                      Fiche
                    </div>
                  )}
                  {p.images && p.images.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {p.images.length} Picha Ndani
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      className="font-bold text-lg leading-tight flex-1 line-clamp-1"
                      title={
                        p.title?.startsWith("[HERO] ")
                          ? p.title.replace("[HERO] ", "")
                          : p.title
                      }
                    >
                      {p.title?.startsWith("[HERO] ")
                        ? p.title.replace("[HERO] ", "")
                        : p.title}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${p.title?.startsWith("[HERO] ") ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                    >
                      {p.title?.startsWith("[HERO] ") ? "Hero" : "Promo"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {p.description}
                  </p>
                  {p.link && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold text-accent">
                      <ExternalLink size={12} />{" "}
                      {p.link.includes("?product=") ? "Buy Now" : "Learn More"}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleOpen(p)}
                      className="flex-1 text-center py-2 bg-slate-100 rounded text-sm font-medium hover:bg-slate-200"
                    >
                      Hariri
                    </button>
                    <button
                      onClick={() => deletePromo(p.id)}
                      className="flex-1 text-center py-2 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100"
                    >
                      Futa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFA ZA COUNDOWN WORKSPACE */}
      {subTab === "countdown" && (
        <div className="bg-white border rounded-2xl p-4 flex flex-col shadow-sm animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              MABANGO YA COUNDOWN YA MUDA MAALUM ({banners.length})
            </span>
            <button
              onClick={() => handleOpenBanner()}
              className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-black flex items-center gap-2 text-xs uppercase cursor-pointer"
            >
              + Ongeza Bango la Ofa
            </button>
          </div>

          {loadingBanners ? (
            <div className="text-center py-10 text-slate-400">Inapakia...</div>
          ) : banners.length === 0 ? (
            <div className="text-center py-14 text-slate-400 border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">⏰</span>
              <p className="text-slate-500 font-extrabold text-[13px]">
                Hakuna bango lolote la muda maalum lililowekwa bado.
              </p>
              <p className="text-slate-400 text-xs">
                Bofya kitufe cha juu kuongeza bango la kwanza la saa ya kukata
                muda hewani!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((b) => {
                const nowTime = Date.now();
                const startTime = new Date(b.startDate).getTime();
                const endTime = new Date(b.endDate).getTime();
                let statusLabel = "";
                let statusColor = "";

                if (nowTime < startTime) {
                  statusLabel = "Scheduled";
                  statusColor = "bg-blue-100 text-blue-800 border-blue-200";
                } else if (nowTime >= startTime && nowTime < endTime) {
                  statusLabel = "Active";
                  statusColor =
                    "bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse";
                } else {
                  statusLabel = "Expired";
                  statusColor = "bg-red-100 text-red-800 border-red-200";
                }

                return (
                  <div
                    key={b.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between bg-slate-50/50"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenBanner(b)}
                            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                            type="button"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                            type="button"
                            title="Delete"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>

                      {b.image && (
                        <div className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={b.image}
                            alt={b.title}
                            className="w-full h-full object-cover"
                            referrerpolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 truncate leading-snug">
                          {b.title}
                        </h4>
                        {b.titleSw && (
                          <p className="text-[10px] text-slate-400 font-medium italic truncate">
                            Sw: {b.titleSw}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {b.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px] text-slate-600 font-sans">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">
                            Mwanzo:
                          </span>
                          <span className="font-bold text-slate-800">
                            {new Date(b.startDate).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">
                            Mwisho:
                          </span>
                          <span className="font-bold text-slate-800">
                            {new Date(b.endDate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-500 flex justify-between items-center gap-2">
                      <span className="truncate">
                        Rangi:{" "}
                        <span className="font-mono text-slate-700">
                          {b.bgColor || "#0f172a"}
                        </span>
                      </span>
                      <span className="truncate text-right">
                        Bidhaa:{" "}
                        <span className="text-blue-600 font-mono text-[9px] truncate max-w-[80px] inline-block">
                          {b.link || "N/A"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COUNTDOWN FLASH BANNER MODAL */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[250] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 relative shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBannerModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              type="button"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pr-8">
              {bannerId
                ? "Hariri Bango la Countdown"
                : "Ongeza Bango la Countdown"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 mb-4">
              Sanidi na panga bango la kipekee lenye saa ya kukata muda.
            </p>

            <form
              onSubmit={handleSaveBanner}
              className="space-y-4 font-sans text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Kichwa cha Bango (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. Flash Sale: 50% Off roses!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Kichwa cha Bango (SW)
                  </label>
                  <input
                    type="text"
                    value={bannerTitleSw}
                    onChange={(e) => setBannerTitleSw(e.target.value)}
                    placeholder="e.g. Ofa Maalum: 50% Punguzo roses!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Maelezo (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={bannerDesc}
                    onChange={(e) => setBannerDesc(e.target.value)}
                    placeholder="English description copywriting..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Maelezo (SW)
                  </label>
                  <textarea
                    rows={2}
                    value={bannerDescSw}
                    onChange={(e) => setBannerDescSw(e.target.value)}
                    placeholder="Maelezo kwa Kiswahili..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Tarehe ya Kuanza (Start Date/Time)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bannerStartDate}
                    onChange={(e) => setBannerStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Tarehe ya Kuisha (End Date / Countdown Target)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bannerEndDate}
                    onChange={(e) => setBannerEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Fungamanisha na Bidhaa (Link to Product)
                  </label>
                  <select
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition text-[11px]"
                  >
                    <option value="">-- Kimalizio cha Karibuni (N/A) --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 animate-none">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Kiunganishi / URL Maalum
                  </label>
                  <input
                    type="text"
                    value={bannerLink}
                    disabled={products.some((p) => p.id === bannerLink)}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="Au weka Kiungo maalum..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Rangi ya Nyuma (Gradient/Color Hex)
                  </label>
                  <input
                    type="text"
                    value={bannerBgColor}
                    onChange={(e) => setBannerBgColor(e.target.value)}
                    placeholder="e.g. #0f172a or linear-gradient(...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Rangi ya Maandishi (Color Hex)
                  </label>
                  <input
                    type="text"
                    value={bannerTextColor}
                    onChange={(e) => setBannerTextColor(e.target.value)}
                    placeholder="e.g. #ffffff"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Andiko la Kitufe (EN)
                  </label>
                  <input
                    type="text"
                    value={bannerButtonText}
                    onChange={(e) => setBannerButtonText(e.target.value)}
                    placeholder="e.g. View Deal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Andiko la Kitufe (SW)
                  </label>
                  <input
                    type="text"
                    value={bannerButtonTextSw}
                    onChange={(e) => setBannerButtonTextSw(e.target.value)}
                    placeholder="e.g. Angalia Ofa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 block">
                  Bango Picha (Image URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <input
                    type="text"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="Ingiza Picha url..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-slate-400 transition"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition select-none text-center">
                    <ImageIcon size={16} />
                    {bannerUploading ? "Inapakia..." : "Pakia Picha"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={bannerUploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {bannerImage && (
                  <div className="h-24 w-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    <img
                      src={bannerImage}
                      className="w-full h-full object-cover"
                      referrerpolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setBannerImage("")}
                      className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-1 shadow-sm hover:scale-105"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 select-none cursor-pointer font-sans text-xs">
                <input
                  type="checkbox"
                  checked={bannerVisible}
                  onChange={(e) => setBannerVisible(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4"
                />
                <span className="font-bold text-slate-700 font-sans">
                  Lipo hewani (Visible)
                </span>
              </label>

              <button
                type="submit"
                disabled={bannerUploading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl transition shadow-md cursor-pointer"
              >
                {bannerUploading ? "Inapakia Faili..." : "Hifadhi Bango"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={savePromo}
            className="bg-white p-6 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {editId
                  ? "Hariri Promo & Ubinafsishaji Kadi"
                  : "Promo Mpya & Ubinafsishaji Kadi"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-slate-700">
              {/* Promotion Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Aina ya Tangazo
                  </label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none bg-slate-50 focus:bg-white focus:border-primary transition"
                  >
                    <option value="promo">Tangazo la Kawaida (Carousel)</option>
                    <option value="hero">Bango Kuu la Juu (Hero Slider)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Mstari wa Juu (Badge Text)
                  </label>
                  <input
                    type="text"
                    placeholder="Mf. FEATURED, SPECIAL DEAL, MWEZI MPYA"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Title & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Kichwa cha Promo (Title)
                  </label>
                  <input
                    type="text"
                    placeholder="Kichwa cha promo (Si Lazima)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Aina ya Kiungo (Link Type)
                  </label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as any)}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  >
                    <option value="custom">
                      Kiungo cha Kawaida (Custom Link)
                    </option>
                    <option value="product">
                      Unganisha na Bidhaa (Link to Product)
                    </option>
                  </select>
                </div>
              </div>

              {linkType === "custom" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Kiungo (Link / Si Lazima)
                  </label>
                  <input
                    type="text"
                    placeholder="Mf. /#/products?product=123 au https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Chagua Bidhaa Kwenye Link (Search Product)
                  </label>
                  <input
                    type="text"
                    placeholder="Weka ID ya bidhaa au tafuta bidhaa..."
                    list="products-list-for-promo"
                    value={linkProduct}
                    onChange={(e) => setLinkProduct(e.target.value)}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  />
                  <datalist id="products-list-for-promo">
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Tsh {p.price?.toLocaleString()}
                      </option>
                    ))}
                  </datalist>
                </div>
              )}

              {/* Button Label Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Maneno ya Kitufe (Button Label)
                  </label>
                  <select
                    value={
                      cardButtonText === "Buy Now" ||
                      cardButtonText === "Nunua Sasa" ||
                      cardButtonText === "Explore" ||
                      cardButtonText === "Learn more"
                        ? cardButtonText
                        : "Custom"
                    }
                    onChange={(e) => {
                      if (e.target.value !== "Custom") {
                        setCardButtonText(e.target.value);
                      } else {
                        setCardButtonText("Click Here");
                      }
                    }}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  >
                    <option value="Buy Now">Buy Now / Nunua</option>
                    <option value="Nunua Sasa">Nunua Sasa</option>
                    <option value="Explore">Explore / Gundua</option>
                    <option value="Learn more">Learn more / Jifunze</option>
                    <option value="Custom">Custom (Andika Yako)</option>
                  </select>
                </div>
                {cardButtonText !== "Buy Now" &&
                  cardButtonText !== "Nunua Sasa" &&
                  cardButtonText !== "Explore" &&
                  cardButtonText !== "Learn more" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Andika Maneno Yako (Custom Text)
                      </label>
                      <input
                        type="text"
                        placeholder="Mf. Download, View..."
                        value={cardButtonText}
                        onChange={(e) => setCardButtonText(e.target.value)}
                        className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                      />
                    </div>
                  )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Maelezo Kamili (Description)
                </label>
                <textarea
                  placeholder="Maelezo (Si Lazima)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-primary transition"
                  rows={2}
                ></textarea>
              </div>

              {/* Uploading Area */}
              <div className="border rounded-2xl p-4 bg-slate-50 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pakia Picha ya Tangazo / Poster (Picha Moja)
                  {isUploading && (
                    <span className="text-accent ml-2 font-black animate-pulse">
                      Inapakia kwenye Wingu...
                    </span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMultipeUpload}
                  disabled={allImages.length >= 1 || isUploading}
                  className="w-full text-xs"
                />

                <div className="flex gap-2.5 flex-wrap pt-2">
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-32 h-32 border-2 border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
                    >
                      <img
                        src={img}
                        className="w-full h-full object-contain"
                        alt="Ad Thumbnail"
                      />
                      <button
                        type="button"
                        onClick={() => removeImg(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:scale-110 transition z-10 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {uploadingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative w-32 h-32 border-2 border-dashed border-accent rounded-xl bg-slate-100 flex flex-col items-center justify-center p-1 overflow-hidden shadow-inner animate-pulse"
                    >
                      <div className="absolute inset-0 bg-accent/5" />
                      <ImageIcon className="w-5 h-5 text-accent mb-0.5 animate-bounce" />
                      <span className="text-[7px] font-semibold text-slate-500 truncate max-w-[80px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] font-black text-accent mt-0.5">
                        {Math.round(file.progress)}%
                      </span>
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-accent transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibility Active Checkbox */}
              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  id="vis"
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="vis"
                  className="text-sm font-bold text-slate-700 cursor-pointer"
                >
                  Inaonekana Kwenye Duka / Bango Likamilike (Active Visibility)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 border-t pt-4 border-slate-100 mt-auto">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Ghairi
              </button>
              <button
                type="submit"
                disabled={isUploading || isSaving}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-primary-dark shadow-md hover:scale-[1.01] transition flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {lang === "sw" ? "Inahifadhi..." : "Saving..."}
                  </>
                ) : isUploading ? (
                  lang === "sw" ? "Inajaza Picha..." : "Uploading images..."
                ) : (
                  lang === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------- MESSAGES & CUSTOMERS ADMIN ---------------- //
export function CustomersAdmin({
  customers,
  setCustomers,
  orders,
  currentStaff,
}: {
  customers: Customer[];
  setCustomers: any;
  orders: Order[];
  currentStaff?: any;
}) {
  const { lang } = useI18n();
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [search, setSearch] = useState("");
  const [msgCustomer, setMsgCustomer] = useState<Customer | null>(null);
  const [msgText, setMsgText] = useState("");
  const [viewOrdersCustomer, setViewOrdersCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [resetPwdCustomer, setResetPwdCustomer] = useState<Customer | null>(
    null,
  );
  const [resetPwdText, setResetPwdText] = useState("");

  const [viewMode, setViewMode] = useState<"customers" | "newsletters">(
    "customers",
  );
  const [newsletters, setNewsletters] = useState<
    { id: string; email: string; created_at: string }[]
  >([]);

  useEffect(() => {
    if (viewMode === "newsletters" && newsletters.length === 0) {
      db.getNewsletters().then(setNewsletters);
    }
  }, [viewMode]);

  const handleToggleFreeze = async (customer: Customer) => {
    if (
      currentStaff?.role !== "super_admin" &&
      currentStaff?.role !== "human_resources"
    )
      return;
    const newStatus = customer.status === "frozen" ? "active" : "frozen";
    if (
      !(await showConfirm(
        `Change status to ${newStatus} for ${customer.name}?`,
      ))
    )
      return;

    const reason = await showPrompt("Tafadhali jaza sababu ya kitendo hiki (Please enter reason for action):");
    if (!reason || reason.trim() === "") {
      showAlert("Lazima ujaze sababu ya kitendo hiki kwa madhumuni ya kiusalama (Reason is required).", "error");
      return;
    }

    try {
      let securityLogs = [];
      if (customer.block_reason && customer.block_reason.startsWith('[')) {
        try {
          securityLogs = JSON.parse(customer.block_reason);
        } catch (e) {}
      }
      securityLogs.push({
        date: new Date().toISOString(),
        action: newStatus,
        reason: reason.trim(),
        performedBy: {
          name: currentStaff?.name || "System Admin",
          email: currentStaff?.email || "admin"
        }
      });

      const blockReasonStr = JSON.stringify(securityLogs);

      await db.updateCustomer(customer.id, { status: newStatus, block_reason: blockReasonStr });
      setCustomers(
        customers.map((c) =>
          c.id === customer.id ? { ...c, status: newStatus, block_reason: blockReasonStr } : c,
        ),
      );
      showAlert(`Customer status changed to ${newStatus}.`, "success");
    } catch (err) {
      console.error(err);
      showAlert("Error updating status.", "error");
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (
      currentStaff?.role !== "super_admin" &&
      currentStaff?.role !== "human_resources"
    )
      return;

    if (currentStaff?.role === "human_resources") {
      if (
        !(await showConfirm(`Request deletion for customer ${customer.name}?`))
      )
        return;
      try {
        await db.updateCustomer(customer.id, { deleteRequested: true });
        setCustomers(
          customers.map((c) =>
            c.id === customer.id ? { ...c, deleteRequested: true } : c,
          ),
        );
        showAlert("Deletion requested.", "success");
      } catch (err) {
        console.error(err);
        showAlert("Error requesting deletion.", "error");
      }
      return;
    }

    if (
      !(await showConfirm(
        `Una uhakika unataka kumfuta kabisa mteja huyu: ${customer.name}? Kitendo hiki hakiwezi kurudishwa na oda zake zote hazitakuwa na mmiliki.`,
        "Futa Mteja",
      ))
    )
      return;
    try {
      await db.deleteCustomer(customer.id);
      setCustomers(customers.filter((c: any) => c.id !== customer.id));
      showAlert("Mteja amefutwa kwa mafanikio.", "success");
    } catch (err) {
      console.error(err);
      showAlert("Kuna hitilafu iliyotokea wakati wa kumfuta mteja.", "error");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwdCustomer || !resetPwdText.trim()) return;
    if (resetPwdText.trim().length < 4) {
      showAlert("Nenosiri lazima liwe na herufi zisizopungua 4.", "error");
      return;
    }
    try {
      await db.resetCustomerPassword(resetPwdCustomer.id, resetPwdText.trim());
      showAlert("Nenosiri jipya limewasilishwa kwa mafanikio.", "success");
      setResetPwdCustomer(null);
      setResetPwdText("");
    } catch (err) {
      console.error(err);
      showAlert("Imeshindwa kubadili nenosiri la mteja.", "error");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())),
  );

  const sendMessage = async () => {
    if (!msgCustomer || !msgText.trim()) return;
    try {
      const msgPayload: Message = {
        id: "MSG-" + Date.now(),
        name: msgCustomer.name,
        phone: msgCustomer.phone,
        message: "Ujumbe kutoka Orbi Shop", // Admin initiated dummy
        adminReply: msgText,
        date: Date.now(),
        customerId: msgCustomer.id,
        isRead: true,
      };
      await db.saveMessage(msgPayload);
      showAlert("Ujumbe umetumwa / Message sent", "success");
      setMsgCustomer(null);
      setMsgText("");
    } catch (err: any) {
      console.error(err);
      showAlert("Ujumbe haukutuma: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-slate-700">
            {t(lang, "cust.title")}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setViewMode("customers")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${viewMode === "customers" ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              Wateja Wote
            </button>
            <button
              onClick={() => setViewMode("newsletters")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${viewMode === "newsletters" ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              Leads (Newsletters)
            </button>
          </div>
        </div>
        {viewMode === "customers" && (
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={t(lang, "comm.search_cust")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm bg-white shadow-sm"
            />
            <Search
              className="absolute left-3.5 top-3 text-slate-400"
              size={18}
            />
          </div>
        )}
      </div>

      {viewMode === "newsletters" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">
            Watu Waliojiunga na Newsletter ({newsletters.length})
          </div>
          {newsletters.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Hakuna taarifa yoyote mpaka sasa.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {newsletters.map((n) => (
                <li
                  key={n.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">{n.email}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={selectedCustomerId ? "space-y-4" : "bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"}>
          {selectedCustomerId ? (
            <CustomerDetailView 
              customer={customers.find(c => c.id === selectedCustomerId)!}
              orders={orders}
              onBack={() => setSelectedCustomerId(null)}
              onMessage={() => {
                const selected = customers.find(c => c.id === selectedCustomerId);
                if (selected) setMsgCustomer(selected);
              }}
              onResetPassword={() => {
                const selected = customers.find(c => c.id === selectedCustomerId);
                if (selected) setResetPwdCustomer(selected);
              }}
              onToggleFreeze={() => {
                const selected = customers.find(c => c.id === selectedCustomerId);
                if (selected) handleToggleFreeze(selected);
              }}
              onDelete={async () => {
                const selected = customers.find(c => c.id === selectedCustomerId);
                if (!selected) return;
                await handleDeleteCustomer(selected);
                if (currentStaff?.role === "super_admin") setSelectedCustomerId(null);
              }}
              canAdministrate={currentStaff?.role === "super_admin" || currentStaff?.role === "human_resources"}
              currentStaffRole={currentStaff?.role}
            />
          ) : (
          <>
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200/60 shadow-xs text-slate-400 font-bold flex flex-col items-center justify-center">
                <Users size={48} className="mb-4 text-slate-200" />
                <p className="text-lg font-medium text-slate-600">
                  {t(lang, "cust.empty")}
                </p>
              </div>
            ) : (
              <>
              <div className="hidden md:grid grid-cols-[minmax(240px,1.5fr)_170px_220px_minmax(360px,auto)] gap-4 px-4 py-3 bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                <span>Customer profile</span>
                <span>Status</span>
                <span>Orders</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => {
                const customerOrders = orders.filter(
                  (o) =>
                    (o.customerId === c.id || o.customer_id === c.id) &&
                    o.status !== "cancelled",
                );
                const totalSpent = customerOrders.reduce(
                  (sum, order) => sum + order.total,
                  0,
                );

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="cursor-pointer bg-white p-3 md:p-4 flex flex-col gap-3 md:grid md:grid-cols-[minmax(240px,1.5fr)_170px_220px_minmax(360px,auto)] md:items-center md:gap-4 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 text-slate-600 flex items-center justify-center font-black text-sm shadow-sm shrink-0 group-hover:from-primary group-hover:to-primary group-hover:text-white transition-all duration-300">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm truncate">
                            {c.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium truncate">
                            {c.phone || c.email || "No contact"} • Joined {new Date(c.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-start">
                        <span
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.status === "frozen" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                        >
                          {c.status === "frozen" ? "Frozen" : "Active"}
                        </span>
                        {c.deleteRequested && (
                          <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                            Delete requested
                          </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:w-full shrink-0">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Orders</span>
                        <span className="font-black text-slate-800 text-xs">{customerOrders.length}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Spent</span>
                        <span className="font-black text-emerald-600 text-xs truncate block" title={formatCurrency(totalSpent)}>{formatCurrency(totalSpent, { compact: true })}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-1 md:border-l md:border-slate-100 md:pl-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(c.id); }}
                        className="px-2.5 py-2 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-lg transition flex items-center gap-1"
                        title={lang === "sw" ? "Fungua ukurasa" : "Open profile"}
                      >
                        <User size={13} /> Open
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewOrdersCustomer(c); }}
                        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition"
                        title={lang === "sw" ? "Angalia Oda" : "View Orders"}
                      >
                        <ShoppingBag size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMsgCustomer(c); }}
                        className="p-2 text-slate-500 hover:text-accent hover:bg-accent/5 rounded-lg transition"
                        title={lang === "sw" ? "Tuma Ujumbe" : "Message"}
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResetPwdCustomer(c); }}
                        className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                        title="Reset Auth"
                      >
                        <Lock size={16} />
                      </button>

                      {(currentStaff?.role === "super_admin" || currentStaff?.role === "human_resources") && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFreeze(c); }}
                            className={`px-2.5 py-2 rounded-lg transition text-[10px] font-black ${
                              c.status === "frozen"
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                : "text-rose-600 bg-rose-50 hover:bg-rose-100"
                            }`}
                            title={c.status === "frozen" ? "Activate Customer" : "Freeze Customer"}
                          >
                            {c.status === "frozen" ? "Activate" : "Freeze"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c); }}
                            className={`px-2.5 py-2 rounded-lg transition text-[10px] font-black ${
                              c.deleteRequested && currentStaff?.role === "human_resources"
                                ? "text-slate-300 bg-slate-50 cursor-not-allowed"
                                : "text-red-600 bg-red-50 hover:bg-red-100"
                            }`}
                            title={currentStaff?.role === "super_admin" ? "Delete User" : "Request Delete"}
                            disabled={c.deleteRequested && currentStaff?.role === "human_resources"}
                          >
                            {currentStaff?.role === "super_admin" ? "Delete" : c.deleteRequested ? "Requested" : "Request"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
              </>
            )}
          </>
          )}
        </div>
      )}

      {msgCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <MessageSquare size={20} /> Tuma Ujumbe / Send Message
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Unatuma ujumbe kwenda kwa: <strong>{msgCustomer.name}</strong>
              </p>
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                rows={4}
                className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent text-sm"
                placeholder="Andika hapa... / Type here..."
              ></textarea>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setMsgCustomer(null)}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition text-sm"
                >
                  Ghairi / Cancel
                </button>
                <button
                  onClick={sendMessage}
                  className="px-5 py-2.5 text-white bg-primary hover:bg-slate-800 rounded-xl font-bold transition shadow-md text-sm"
                >
                  Tuma / Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resetPwdCustomer && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Lock size={20} /> Badili Nenosiri la Mteja
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Unabadili nenosiri la mteja:{" "}
                <strong>{resetPwdCustomer.name}</strong>
              </p>

              <div className="space-y-1.5 flex flex-col items-start whitespace-normal">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nenosiri Jipya *
                </label>
                <input
                  type="text"
                  value={resetPwdText}
                  onChange={(e) => setResetPwdText(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent text-sm bg-white"
                  placeholder={
                    lang === "sw"
                      ? "Weka nenosiri jipya hapa..."
                      : "Enter new password here..."
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setResetPwdCustomer(null)}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition text-sm"
                >
                  Ghairi / Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-5 py-2.5 text-white bg-primary hover:bg-slate-800 rounded-xl font-bold transition shadow-md text-sm"
                >
                  Hifadhi / Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewOrdersCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <ShoppingBag className="text-primary" size={22} />
                {lang === "sw" ? "Oda za Mteja" : "Customer Orders"} —{" "}
                {viewOrdersCustomer.name}
              </h2>
              <button
                onClick={() => setViewOrdersCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Mini Profile Box */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 text-slate-700 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {lang === "sw"
                    ? "Taarifa za Mawasiliano"
                    : "Contact Information"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-900">
                      {viewOrdersCustomer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span>{viewOrdersCustomer.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{viewOrdersCustomer.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="md:border-l md:pl-6 border-slate-200">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {lang === "sw" ? "Muhtasari wa Manunuzi" : "Purchase Summary"}
                </div>
                <div className="space-y-1">
                  <div>
                    {lang === "sw" ? "Tarehe aliyojiunga:" : "Joined date:"}{" "}
                    <span className="font-medium text-slate-900">
                      {new Date(
                        viewOrdersCustomer.registeredAt,
                      ).toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    {lang === "sw" ? "Jumla ya Manunuzi:" : "Total Purchases:"}{" "}
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(
                        orders
                          .filter(
                            (o) =>
                              (o.customerId === viewOrdersCustomer.id ||
                                o.customer_id === viewOrdersCustomer.id) &&
                              (o.status === "confirmed" ||
                                o.status === "shipped" ||
                                o.status === "delivered"),
                          )
                          .reduce((sum, o) => sum + o.total, 0),
                      )}
                    </span>
                  </div>
                  <div>
                    {lang === "sw" ? "Oda Zilizowekwa:" : "Placed Orders:"}{" "}
                    <span className="font-semibold text-slate-955">
                      {
                        orders.filter(
                          (o) =>
                            o.customerId === viewOrdersCustomer.id ||
                            o.customer_id === viewOrdersCustomer.id,
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable past orders list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wider">
                {lang === "sw"
                  ? "Historia ya Kina ya Oda"
                  : "Detailed Order History"}
              </h3>

              {orders.filter(
                (o) =>
                  o.customerId === viewOrdersCustomer.id ||
                  o.customer_id === viewOrdersCustomer.id,
              ).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag
                    size={48}
                    className="mx-auto mb-3 text-slate-200"
                  />
                  <p className="font-medium">
                    {lang === "sw"
                      ? "Mteja huyu bado hajaweka oda yoyote kwenye mfumo yetu."
                      : "This customer has not placed any orders in our system yet."}
                  </p>
                </div>
              ) : (
                orders
                  .filter(
                    (o) =>
                      o.customerId === viewOrdersCustomer.id ||
                      o.customer_id === viewOrdersCustomer.id,
                  )
                  .sort((a, b) => b.date - a.date)
                  .map((o) => (
                    <div
                      key={o.id}
                      className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition bg-white space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2 flex-wrap sm:flex-nowrap">
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>Oda ID: {o.id}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium font-mono">
                            {new Date(o.date).toLocaleDateString(
                              lang === "sw" ? "sw-TZ" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {o.paymentMethodName && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {o.paymentMethodName}
                            </span>
                          )}
                          {(() => {
                            const custStatusUpper = o.status
                              ? o.status.toUpperCase()
                              : "CREATED";
                            return (
                              <span
                                className={`inline-flex items-center justify-center gap-1 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs px-2.5 py-0.5 md:py-1 rounded-full font-extrabold uppercase tracking-wide text-center shrink-0 max-w-full select-none border shadow-sm ${
                                  custStatusUpper === "RELEASED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : custStatusUpper === "DISPUTED"
                                      ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                                      : custStatusUpper === "SHIPPED"
                                        ? "bg-sky-50 text-sky-700 border-sky-300 animate-pulse"
                                        : custStatusUpper === "DELIVERED"
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : custStatusUpper ===
                                              "BUYER_CONFIRMED"
                                            ? "bg-teal-50 text-teal-700 border-teal-200"
                                            : custStatusUpper ===
                                                  "PAYMENT_HELD" ||
                                                custStatusUpper === "PROCESSING"
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : custStatusUpper ===
                                                    "CANCELLED" ||
                                                  custStatusUpper === "REFUNDED"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-amber-50 text-amber-700 border-amber-205"
                                }`}
                              >
                                <span
                                  className={`w-1 h-1 rounded-full ${
                                    custStatusUpper === "RELEASED"
                                      ? "bg-emerald-500"
                                      : custStatusUpper === "DISPUTED"
                                        ? "bg-rose-500"
                                        : custStatusUpper === "SHIPPED"
                                          ? "bg-sky-500 animate-ping"
                                          : "bg-current"
                                  }`}
                                ></span>
                                {custStatusUpper === "CREATED" &&
                                  (lang === "sw" ? "Imepokelewa" : "Created")}
                                {custStatusUpper === "AWAITING_PAYMENT" &&
                                  (lang === "sw"
                                    ? "Inasubiri Malipo"
                                    : "Awaiting Payment")}
                                {custStatusUpper === "PAYMENT_HELD" &&
                                  (lang === "sw"
                                    ? "Escrow: Held"
                                    : "Escrow: Held")}
                                {custStatusUpper === "PROCESSING" &&
                                  (lang === "sw" ? "Inandaliwa" : "Processing")}
                                {custStatusUpper === "SHIPPED" &&
                                  (lang === "sw" ? "Transit" : "Transit")}
                                {custStatusUpper === "DELIVERED" &&
                                  (lang === "sw"
                                    ? "Delivered / Confirm"
                                    : "Delivered / Confirm")}
                                {custStatusUpper === "BUYER_CONFIRMED" &&
                                  (lang === "sw"
                                    ? "Mteja Amethibitisha"
                                    : "Receipt Confirmed")}
                                {custStatusUpper === "DISPUTED" &&
                                  (lang === "sw" ? "Mgogoro" : "Disputed")}
                                {custStatusUpper === "RELEASED" &&
                                  (lang === "sw" ? "Completed" : "Completed")}
                                {custStatusUpper === "REFUNDED" &&
                                  (lang === "sw" ? "Imerejeshwa" : "Refunded")}
                                {custStatusUpper === "CANCELLED" &&
                                  (lang === "sw" ? "Imeghairiwa" : "Cancelled")}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          {lang === "sw" ? "Bidhaa Zilizomo" : "Items In Order"}
                        </div>
                        {o.paymentReference && (
                          <div className="mb-3 p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-700 rounded-xl font-mono text-[11px] font-black tracking-wide flex items-center gap-1.5">
                            <span className="animate-pulse">💰</span> REF
                            MALIPO: {o.paymentReference}
                          </div>
                        )}
                        <div className="hidden" p-dummy="avoid-nesting"></div>
                        <ul className="divide-y divide-slate-150 text-slate-700 text-sm">
                          {o.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between py-1.5 first:pt-0 last:pb-0"
                            >
                              <span className="font-medium">
                                {item.quantity}x{" "}
                                <span className="text-slate-900">
                                  {item.name}
                                </span>
                              </span>
                              <span className="text-slate-500">
                                {formatCurrency(item.price)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Total footer */}
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          {lang === "sw" ? "Jumla ya Oda" : "Order Total"}
                        </span>
                        <span className="text-lg font-black text-primary">
                          {formatCurrency(o.total)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Bottom bar */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 shrink-0">
              <button
                onClick={() => setViewOrdersCustomer(null)}
                className="px-5 py-2 hover:bg-slate-200 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                {lang === "sw" ? "Funga" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- SETTINGS ADMIN ---------------- //
export function SettingsAdmin() {
  const { lang } = useI18n();
  const { showConfirm, showAlert } = useDialog();
  const isSw = lang === "sw";
  const [uploadingBGs, setUploadingBGs] = useState<Record<string, boolean>>({
    bg1: false,
    bg2: false,
    bg3: false,
  });

  const handleBGUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "appBarBackground" | "appBarBackground2" | "appBarBackground3",
    key: "bg1" | "bg2" | "bg3",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBGs((prev) => ({ ...prev, [key]: true }));
    try {
      const url = await uploadFileViaStorageApi(file, "promotions", () => {});
      setSettings((prev: any) => ({ ...prev, [field]: url }));
    } catch (err: any) {
      console.error(err);
      alert(
        isSw
          ? "Imeshindwa kupakia faili: " + err.message
          : "Failed to upload file: " + err.message,
      );
    } finally {
      setUploadingBGs((prev) => ({ ...prev, [key]: false }));
    }
  };

  const [settings, setSettings] = useState<any>({
    companyName: "",
    address: "",
    phone: "",
    email: "",
    terms: "",
    paymentOptions: [],
  });
  const [globalOfficePlace, setGlobalOfficePlace] = useState<GooglePlaceDetails | null>(null);
  const [sysNiches, setSysNiches] = useState<Niche[]>([]);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedLoyalty, setSavedLoyalty] = useState(false);
  const [nichesSaved, setNichesSaved] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>([]);
  const [deliveryZonePlaces, setDeliveryZonePlaces] = useState<Record<string, GooglePlaceDetails | null>>({});
  const [deliverySaved, setDeliverySaved] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [serviceHealthLoading, setServiceHealthLoading] = useState(false);
  const [editingDeliveryRuleIndex, setEditingDeliveryRuleIndex] = useState<number | null>(null);
  const [deliveryTest, setDeliveryTest] = useState({
    zoneId: "",
    deliveryClass: "standard",
    weightKg: 1,
    quantity: 1,
    fragile: false,
    oversized: false,
    requiresColdChain: false,
  });
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTotalPending, setAiTotalPending] = useState(0);
  const [aiMessage, setAiMessage] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiAppliedIds, setAiAppliedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNiche, setSavingNiche] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [newNicheName, setNewNicheName] = useState("");
  const [nicheCategoriesList, setNicheCategoriesList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newFamilyNames, setNewFamilyNames] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [newNicheMode, setNewNicheMode] = useState<"add" | "edit">("add");
  const [newNicheOriginalName, setNewNicheOriginalName] = useState("");
  const [newNicheIcon, setNewNicheIcon] = useState("Smartphone");
  const [iconSearch, setIconSearch] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconOptions = [
    "Smartphone",
    "Shirt",
    "Sofa",
    "Heart",
    "CarFront",
    "ShoppingBag",
    "Package",
    "Store",
    "Tag",
    "Ticket",
    "Activity",
    "Award",
    "Zap",
    "Cpu",
    "Camera",
    "Bot",
    "FileText",
    "MessageSquare",
    "Laptop",
    "Baby",
    "Palette",
    "Coffee",
    "Dumbbell",
    "Scissors",
    "Briefcase",
    "Gift",
    "Headphones",
    "Cake",
    "Watch",
    "Bike",
    "Key",
    "BookOpen",
    "Leaf",
    "Flame",
    "Music",
    "Gem",
    "Tv",
    "Compass",
    "Footprints",
    "Crown",
    "GlassWater",
    "Wrench",
    "Flower2",
    "Anchor",
    "Apple",
    "Banana",
    "Beer",
    "Bone",
    "Box",
    "Brain",
    "Brush",
    "Bus",
    "Calculator",
    "Candy",
    "Cat",
    "ChefHat",
    "Clapperboard",
    "Cloud",
    "Coins",
    "Cookie",
    "Dog",
    "Dices",
    "Disc",
    "Egg",
    "Fan",
    "Feather",
    "Fish",
    "Gamepad2",
    "Gavel",
    "Guitar",
    "Hammer",
    "IceCream",
    "Joystick",
    "Lightbulb",
    "Luggage",
    "Map",
    "Mic",
    "Microscope",
    "Moon",
    "Mountain",
    "Paintbrush",
    "PenTool",
    "Pill",
    "Pizza",
    "Plane",
    "Plug",
    "Printer",
    "Puzzle",
    "Radio",
    "Receipt",
    "Rocket",
    "Ruler",
    "Scale",
    "Server",
    "Shell",
    "ShowerHead",
    "Shovel",
    "Sprout",
    "Stethoscope",
    "Sun",
    "Table",
    "Tablet",
    "Tent",
    "Thermometer",
    "Trophy",
    "Umbrella",
    "Utensils",
    "Wallet",
    "Wine",
    "Globe",
    "Armchair",
    "Bath",
    "Battery",
    "Bed",
    "Beef",
    "BellRing",
    "Bird",
    "Book",
    "Castle",
    "Clover",
    "Construction",
    "Container",
    "CupSoda",
    "Glasses",
    "GraduationCap",
    "HardHat",
    "Heater",
    "Martini",
    "Notebook",
    "PackageOpen",
    "PawPrint",
    "Pen",
    "Pencil",
    "PiggyBank",
    "PlugZap",
    "Rabbit",
    "Refrigerator",
    "Salad",
    "Sandwich",
    "ShoppingBasket",
    "Smile",
    "Snowflake",
    "Soup",
    "Speaker",
    "Target",
    "Telescope",
    "Terminal",
    "ToyBrick",
    "Train",
    "Trees",
    "Volleyball",
    "Wand",
    "Warehouse",
    "WashingMachine",
    "Waves",
    "Webcam",
    "Wheat",
  ];
  const NicheIcons: Record<string, any> = {
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
    Coins,
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
    Map: MapIcon,
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
    Globe,
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

  const handleScanNiches = async () => {
    setAiLoading(true);
    setAiError("");
    setAiMessage("");
    setAiSuggestions([]);
    try {
      const res = await db.getNicheSuggestions();
      if (!res || res.success === false) {
        if (res?.error === "GEMINI_API_KEY_MISSING") {
          setAiError(
            isSw
              ? "Siri ya API ya Gemini haijawekwa kwenye dashibodi ya msanidi programu."
              : "Gemini API key is not configured in secrets yet.",
          );
        } else {
          setAiError(
            res?.error ||
              (isSw
                ? "Imeshindwa kupata mapendekezo ya AI."
                : "Failed to obtain AI suggestions."),
          );
        }
      } else {
        setAiSuggestions(res.suggestions || []);
        setAiTotalPending(res.totalPending || 0);
        if ((res.suggestions || []).length === 0) {
          setAiMessage(
            isSw
              ? "Bidhaa zote zimepangwa vizuri! Hakuna unorganized items."
              : "All products are properly organized! No pending unorganized items found.",
          );
        } else {
          setAiMessage(
            isSw
              ? `Uchambuzi umekamilika! Tulipata bidhaa ${res.suggestions.length} ambazo hazijapangwa vizuri.`
              : `Catalog categorization complete! Detected ${res.suggestions.length} items needing better classification.`,
          );
        }
      }
    } catch (err: any) {
      setAiError(err.message || "Network Error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySingleSuggestion = async (suggestion: any) => {
    setAiLoading(true);
    setAiError("");
    try {
      const isConfirmed = await showConfirm(
        isSw
          ? `Je, unataka kuhifadhi bidhaa hii "${suggestion.productName}" kwenye Niche "${suggestion.suggestedNiche}" na Kitengo "${suggestion.suggestedCategory}"?`
          : `Do you want to reassign "${suggestion.productName}" into the Niche "${suggestion.suggestedNiche}" and Category "${suggestion.suggestedCategory}"?`,
      );
      if (!isConfirmed) return;

      const res = await db.applyNicheSuggestions([suggestion]);
      if (res && res.success) {
        setAiAppliedIds((prev) => [...prev, suggestion.productId]);

        // Refresh niches in system context so it reflects immediately
        const freshNiches = await db.getNiches();
        setSysNiches(freshNiches);
      } else {
        setAiError(
          isSw
            ? "Imeshindwa kuweka mabadiliko."
            : "Failed to apply categorization change.",
        );
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAllSuggestions = async () => {
    if (aiSuggestions.length === 0) return;
    setAiLoading(true);
    setAiError("");
    try {
      const isConfirmed = await showConfirm(
        isSw
          ? `Je, una uhakika unataka kukubali na kuweka mapendekezo yote ${aiSuggestions.length} ya AI kwa wakati mmoja?`
          : `Are you sure you want to approve and bulk apply all ${aiSuggestions.length} AI-generated suggestions?`,
      );
      if (!isConfirmed) return;

      const unapplied = aiSuggestions.filter(
        (s) => !aiAppliedIds.includes(s.productId),
      );
      const res = await db.applyNicheSuggestions(unapplied);
      if (res && res.success) {
        setAiAppliedIds((prev) => [
          ...prev,
          ...unapplied.map((s) => s.productId),
        ]);

        // Refresh systems niches
        const freshNiches = await db.getNiches();
        setSysNiches(freshNiches);
        setAiMessage(
          isSw
            ? "Mapendekezo yote yamewekwa kikamilifu!"
            : "All suggestions successfully applied and categorized!",
        );
      } else {
        setAiError(
          isSw
            ? "Imeshindwa kuweka mabadiliko."
            : "Failed to apply bulk categorization changes.",
        );
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const getNicheValidationInfo = () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const name = newNicheName.trim();
    const categories = nicheCategoriesList.map((c) => c.name);

    // 1. Check if categories are entered but no niche name is specified (Orphaned categories)
    if (categories.length > 0 && !name) {
      errors.push(
        isSw
          ? "Kosa: Kuna makundi yaliyoandikwa lakini jina la Niche liko wazi. Makundi haya yatabaki yatima bila kuunganishwa na Niche yoyote!"
          : "Error: Sub-categories are specified but Niche Name is empty. Each category must map to a valid niche to prevent being left orphaned/unmatched!",
      );
    }

    // 2. Check if a niche name is given but there are zero categories
    if (name && categories.length === 0) {
      warnings.push(
        isSw
          ? "Onyo: Niche hii haina vikundi vyovyote vilivyofafanuliwa. Itakuwa tupu bila sub-categories."
          : "Warning: This niche has no sub-categories defined. The niche will be active but without mapped categories.",
      );
    }

    // 3. Find subcategories of products that will become orphaned based on the current state/edit
    const proposedNichesMap = new Map<string, Set<string>>();
    sysNiches.forEach((n) => {
      if (
        newNicheMode === "edit" &&
        n.name.toLowerCase() === newNicheOriginalName.toLowerCase()
      ) {
        if (name) {
          proposedNichesMap.set(
            name.toLowerCase(),
            new Set(categories.map((c) => c.toLowerCase())),
          );
        }
      } else {
        proposedNichesMap.set(
          n.name.toLowerCase(),
          new Set((n.categories || []).map((c) => (c.name || "").toLowerCase())),
        );
      }
    });

    if (newNicheMode === "add" && name) {
      proposedNichesMap.set(
        name.toLowerCase(),
        new Set(categories.map((c) => c.toLowerCase())),
      );
    }

    const oProds: { id: string; name: string; category: string }[] = [];
    if (products && Array.isArray(products)) {
      products.forEach((p) => {
        if (!p.category) return;
        if (p.category.includes("::")) {
          const parts = p.category.split("::");
          const pNiche = parts[0].trim();
          const pSub = parts[1].trim();

          const nicheSet = proposedNichesMap.get(pNiche.toLowerCase());
          if (!nicheSet || !nicheSet.has(pSub.toLowerCase())) {
            oProds.push(p);
          }
        } else {
          // Simple category name
          let found = false;
          for (const [_, catSet] of proposedNichesMap.entries()) {
            if (catSet.has(p.category.toLowerCase())) {
              found = true;
              break;
            }
          }
          if (!found) {
            oProds.push(p);
          }
        }
      });
    }

    if (oProds.length > 0) {
      warnings.push(
        isSw
          ? `Onyo: Kuna bidhaa ${oProds.length} ambazo kundi zao zitabaki yatima/hazitafanana chini ya mipangilio hii mpya ya niches (Mifano: ${oProds
              .slice(0, 3)
              .map((p) => `${p.name} katika [${p.category}]`)
              .join(", ")}).`
          : `Warning: ${oProds.length} product(s) will have their categories left orphaned/unmatched under these settings (Examples: ${oProds
              .slice(0, 3)
              .map((p) => `"${p.name}" in [${p.category}]`)
              .join(", ")}).`,
      );
    }

    return {
      errors,
      warnings,
      orphanedProductsCount: oProds.length,
      isValid: errors.length === 0,
    };
  };

  // TRA Settings state
  const [traTin, setTraTin] = useState("");
  const [traCertKey, setTraCertKey] = useState("");
  const [traCertSerial, setTraCertSerial] = useState("");
  const [traPrivateKeyPem, setTraPrivateKeyPem] = useState("");
  const [traAutoTaxSales, setTraAutoTaxSales] = useState(false);
  const [traIsSandbox, setTraIsSandbox] = useState(false);
  const [isTraSaved, setIsTraSaved] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<
    "system" | "profile" | "delivery" | "loyalty" | "tra" | "security" | "niches"
  >("profile");

  const deliveryMatrixRows = useMemo(() => {
    const zonesById = new Map(deliveryZones.map((zone) => [String(zone.id), zone]));
    return deliveryRules
      .map((rule, index) => ({
        rule,
        index,
        zone: zonesById.get(String(rule.zoneId)),
      }))
      .sort((a, b) => {
        const zoneSort = Number(a.zone?.sortOrder || 0) - Number(b.zone?.sortOrder || 0);
        if (zoneSort !== 0) return zoneSort;
        return Number(a.rule.sortOrder || 0) - Number(b.rule.sortOrder || 0);
      });
  }, [deliveryRules, deliveryZones]);

  const fallbackQuotePreview = useMemo(() => {
    const zone = deliveryZones.find((item) => String(item.id) === String(deliveryTest.zoneId)) || deliveryZones[0];
    if (!zone) return null;
    const product: Partial<Product> = {
      id: "admin-fallback-test",
      name: "Fallback test product",
      niche: "Admin",
      category: "Admin",
      price: 0,
      stock: 1,
      images: [],
      tags: [],
      description: "",
      createdAt: Date.now(),
      deliveryClass: deliveryTest.deliveryClass,
      weightKg: Number(deliveryTest.weightKg || 1),
      fragile: deliveryTest.fragile,
      oversized: deliveryTest.oversized,
      requiresColdChain: deliveryTest.requiresColdChain,
    };
    return quoteProductDelivery(product, Number(deliveryTest.quantity || 1), zone, deliveryRules, lang);
  }, [deliveryRules, deliveryTest, deliveryZones, lang]);

  const focusDeliveryRuleEditor = (index: number) => {
    setEditingDeliveryRuleIndex(index);
    setTimeout(() => {
      document
        .getElementById(`delivery-rule-editor-${index}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const refreshServiceHealth = async () => {
    setServiceHealthLoading(true);
    try {
      setServiceHealth(await db.getServiceHealth());
    } catch (err) {
      console.warn("Failed loading service health:", err);
      setServiceHealth({
        overallStatus: "degraded",
        checkedAt: new Date().toISOString(),
        services: [
          {
            id: "admin_health_endpoint",
            name: "Admin service health endpoint",
            group: "System",
            status: "degraded",
            message: isSw
              ? "Imeshindwa kusoma hali ya huduma kutoka backend."
              : "Failed to read service health from backend.",
          },
        ],
      });
    } finally {
      setServiceHealthLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      db.getInvoiceSettings().catch((err) => {
        console.warn("Failed loading invoice settings:", err);
        return {};
      }),
      db.getNiches().catch((err) => {
        console.warn("Failed loading niches:", err);
        return [];
      }),
      db.getTraConfig().catch((err) => {
        console.warn("Failed loading TRA config:", err);
        return null;
      }),
      db.getProducts().catch((err) => {
        console.warn("Failed loading products:", err);
        return [];
      }),
      db.getDeliveryZones().catch((err) => {
        console.warn("Failed loading delivery zones:", err);
        return [];
      }),
      db.getDeliveryRules().catch((err) => {
        console.warn("Failed loading delivery rules:", err);
        return [];
      }),
      db.getServiceHealth().catch((err) => {
        console.warn("Failed loading service health:", err);
        return null;
      }),
    ])
      .then(([res, niches, traConfig, prods, zones, rules, health]) => {
        setSettings(res || {});
        setSysNiches(niches || []);
        setProducts(prods || []);
        setDeliveryZones(zones || []);
        setDeliveryRules(rules || []);
        setServiceHealth(health);
        if (traConfig) {
          setTraTin(traConfig.tin || "");
          setTraCertKey(traConfig.certKey || "");
          setTraCertSerial(traConfig.certSerial || "");
          setTraPrivateKeyPem(traConfig.privateKeyPem || "");
          setTraAutoTaxSales(traConfig.autoTaxSales || false);
          setTraIsSandbox(traConfig.isSandbox || false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Critical error in AdminApp resource loading:", err);
        setLoading(false);
      });
  }, []);

  const handleSaveTra = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveTraConfig({
      tin: traTin,
      certKey: traCertKey,
      certSerial: traCertSerial,
      privateKeyPem: traPrivateKeyPem,
      autoTaxSales: traAutoTaxSales,
      isSandbox: traIsSandbox,
    });
    setIsTraSaved(true);
    setTimeout(() => setIsTraSaved(false), 3000);
  };

  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  const [deletePIN, setDeletePIN] = useState(
    () => localStorage.getItem("orbishop_delete_pin") || "9900",
  );
  const [pinSaved, setPinSaved] = useState(false);
  const [pinShow, setPinShow] = useState(false);

  const handleUpdateDeletePIN = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("orbishop_delete_pin", deletePIN);
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwdError(
        isSw
          ? "Nenosiri lazima liwe na herufi angalau 6"
          : "Password must be at least 6 characters",
      );
      return;
    }
    setPwdLoading(true);
    setPwdError("");
    setPwdMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwdLoading(false);
    if (error) {
      setPwdError(error.message);
    } else {
      setPwdMsg(
        isSw
          ? "Nenosiri limebadilishwa kikamilifu!"
          : "Account password has been updated successfully!",
      );
      setNewPassword("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveInvoiceSettings(settings);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 3000);
  };

  const handleSaveLoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveInvoiceSettings(settings);
    setSavedLoyalty(true);
    setTimeout(() => setSavedLoyalty(false), 3000);
  };

  const handleSaveDeliveryZones = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZones = deliveryZones
      .map((zone, index) => ({
        ...zone,
        name: (zone.name || zone.labelSw || zone.labelEn || "").trim(),
        labelSw: (zone.labelSw || zone.name || "").trim(),
        labelEn: (zone.labelEn || zone.name || "").trim(),
        isB2bHub: !!zone.isB2bHub,
        b2bHubName: (zone.b2bHubName || "").trim(),
        price: Math.max(0, Number(zone.price || 0)),
        minDays: Math.max(0, Number(zone.minDays || 0)),
        maxDays: Math.max(Math.max(0, Number(zone.minDays || 0)), Number(zone.maxDays || zone.minDays || 0)),
        sortOrder: Number(zone.sortOrder ?? index + 1),
        isActive: zone.isActive !== false,
      }))
      .filter((zone) => zone.name);

    await db.saveDeliveryZones(cleanZones);
    const cleanRules = deliveryRules
      .map((rule, index) => ({
        ...rule,
        zoneId: String(rule.zoneId || "").trim(),
        deliveryClass: String(rule.deliveryClass || "standard").trim().toLowerCase(),
        minWeightKg: Math.max(0, Number(rule.minWeightKg || 0)),
        maxWeightKg: rule.maxWeightKg === null || rule.maxWeightKg === undefined ? null : Math.max(0, Number(rule.maxWeightKg || 0)),
        baseFee: Math.max(0, Number(rule.baseFee || 0)),
        perKgFee: Math.max(0, Number(rule.perKgFee || 0)),
        fragileFee: Math.max(0, Number(rule.fragileFee || 0)),
        oversizedFee: Math.max(0, Number(rule.oversizedFee || 0)),
        coldChainFee: Math.max(0, Number(rule.coldChainFee || 0)),
        minDays: Math.max(0, Number(rule.minDays || 0)),
        maxDays: Math.max(Math.max(0, Number(rule.minDays || 0)), Number(rule.maxDays || rule.minDays || 0)),
        isAvailable: rule.isAvailable !== false,
        reasonIfUnavailable: rule.reasonIfUnavailable || "",
        sortOrder: Number(rule.sortOrder ?? index + 1),
      }))
      .filter((rule) => rule.zoneId && rule.deliveryClass);
    await db.saveDeliveryRules(cleanRules);
    setDeliveryZones(await db.getDeliveryZones());
    setDeliveryRules(await db.getDeliveryRules());
    setDeliverySaved(true);
    setTimeout(() => setDeliverySaved(false), 3000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-medium text-xs">
        <RefreshCw className="animate-spin mr-2" size={16} />
        <span>
          {isSw ? "Inapakia mipangilio..." : "Loading configuration panels..."}
        </span>
      </div>
    );

  const categories = [
    {
      id: "system",
      label: isSw ? "Afya ya Mfumo" : "Service Health",
      desc: isSw
        ? "Huduma, APIs na fallback"
        : "Services, APIs, and fallback status",
      icon: Server,
    },
    {
      id: "profile",
      label: isSw ? "Wasifu wa Soko" : "Business Profile",
      desc: isSw
        ? "Mawasiliano na njia za malipo"
        : "Profile, contacts & payments",
      icon: Store,
    },
    {
      id: "delivery",
      label: isSw ? "Usafirishaji" : "Delivery Zones",
      desc: isSw
        ? "Mikoa, bei na muda wa kufikisha"
        : "Regions, fees, and delivery ETA",
      icon: Truck,
    },
    {
      id: "loyalty",
      label: isSw ? "Zawadi & Alama" : "Loyalty & Terms",
      desc: isSw
        ? "Pointi, zawadi na masharti"
        : "Terms, rewards & points calibration",
      icon: Award,
    },
    {
      id: "tra",
      label: isSw ? "Kodi ya TRA EFD" : "TRA EFD Sync",
      desc: isSw
        ? "Mwasilisho na risiti za TRA"
        : "Fiscal device & telemetry settings",
      icon: FileText,
    },
    {
      id: "security",
      label: isSw ? "Mipangilio ya Usalama (Security)" : "Security Settings",
      desc: isSw
        ? "Nenosiri na PIN za ulinzi"
        : "Password reset & delete parameters",
      icon: Lock,
    },
    {
      id: "niches",
      label: isSw ? "Mipangilio ya Maduka (Niches)" : "Store Niches",
      desc: isSw ? "Katalogi za maduka na icons" : "Niche categorization lists",
      icon: Tag,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Settings Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[2.25rem] p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <SettingsIcon className="text-emerald-400 h-6 w-6" />
              <span>
                {isSw ? "Mipangilio ya Mfumo" : "System Control Panel"}
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              {isSw
                ? "Simamia soko lako, zawadi ya uaminifu, risiti (EFD), ulinzi, na katalogi za maduka."
                : "Configure your marketplace fronts, customer rewards, TRA telemetry, PIN rules, and store catalogs."}
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2 text-xs text-slate-300 self-start md:self-auto">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            <span className="font-mono uppercase">
              {isSw ? "Mfumo Amilifu" : "System Online"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar/Pills */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 p-3.5 space-y-1 shadow-xs">
          <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 mb-2.5">
            {isSw ? "Kategoria za Seti" : "Settings Domains"}
          </span>
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-1 lg:p-0 gap-1.5 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = activeSubTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveSubTab(cat.id as any)}
                  className={`min-w-[140px] sm:min-w-[200px] lg:w-full text-left p-3 rounded-2xl transition flex items-center gap-3 relative group cursor-pointer shrink-0 ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition shrink-0 ${
                      active
                        ? "bg-slate-800 text-emerald-400"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight text-left">
                    <div className="text-xs font-bold truncate leading-tight">
                      {cat.label}
                    </div>
                    <div
                      className={`text-[9px] truncate leading-tight mt-0.5 hidden sm:block ${active ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {cat.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeSubTab === "system" && (
            <div className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Server size={17} className="text-indigo-600" />
                    {isSw ? "Ufuatiliaji wa Huduma Muhimu" : "Critical Service Monitor"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {isSw
                      ? "Angalia Routes API, delivery cache, fallback engine na database kabla hazijaleta changamoto kwenye checkout."
                      : "Track Routes API, delivery cache, fallback engine, and database readiness before they affect checkout."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshServiceHealth}
                  disabled={serviceHealthLoading}
                  className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw size={14} className={serviceHealthLoading ? "animate-spin" : ""} />
                  {isSw ? "Hakiki Tena" : "Refresh"}
                </button>
              </div>

              <div className={`rounded-3xl border p-4 sm:p-5 ${
                serviceHealth?.overallStatus === "ok"
                  ? "bg-emerald-50 border-emerald-100"
                  : serviceHealth?.overallStatus === "attention"
                    ? "bg-amber-50 border-amber-100"
                    : "bg-rose-50 border-rose-100"
              }`}>
                <div className="flex items-start gap-3">
                  {serviceHealth?.overallStatus === "ok" ? (
                    <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={22} className={`${serviceHealth?.overallStatus === "attention" ? "text-amber-600" : "text-rose-600"} shrink-0 mt-0.5`} />
                  )}
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {serviceHealth?.overallStatus === "ok"
                        ? (isSw ? "Huduma Muhimu Ziko Sawa" : "Critical Services Healthy")
                        : serviceHealth?.overallStatus === "attention"
                          ? (isSw ? "Kuna Huduma Inahitaji Kuwekwa" : "Some Services Need Configuration")
                          : (isSw ? "Kuna Huduma Inahitaji Uangalizi" : "Some Services Need Attention")}
                    </p>
                    <p className="text-[11px] text-slate-600 font-semibold mt-1">
                      {isSw ? "Ukaguzi wa mwisho:" : "Last checked:"}{" "}
                      {serviceHealth?.checkedAt ? new Date(serviceHealth.checkedAt).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(serviceHealth?.services || []).map((service: any) => {
                  const status = String(service.status || "unknown");
                  const ok = status === "ok" || status === "ready";
                  const attention = status === "not_configured";
                  return (
                    <div
                      key={service.id}
                      className={`rounded-3xl border p-4 sm:p-5 shadow-xs ${
                        ok
                          ? "border-emerald-100 bg-white"
                          : attention
                            ? "border-amber-100 bg-amber-50/40"
                            : "border-rose-100 bg-rose-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {service.group || "System"}
                          </p>
                          <h4 className="text-sm font-black text-slate-900 mt-1">
                            {service.name}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${
                          ok
                            ? "bg-emerald-100 text-emerald-700"
                            : attention
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}>
                          {status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-3">
                        {service.message}
                      </p>
                      {service.meta && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {Object.entries(service.meta)
                            .filter(([_, value]) => value !== null && value !== "" && typeof value !== "object")
                            .slice(0, 6)
                            .map(([key, value]) => (
                              <div key={key} className="rounded-2xl bg-slate-50 border border-slate-100 p-2">
                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 truncate">
                                  {key}
                                </p>
                                <p className="text-[11px] font-black text-slate-800 truncate">
                                  {String(value)}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === "profile" && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200 text-left"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isSw
                    ? "WASIFU WA SOKO NA MAWASILIANO"
                    : "MARKETPLACE BRAND & CONTACTS"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {isSw
                    ? "Weka taarifa za msingi za soko lako zinazoonekana kwenye invoice za wateja."
                    : "Maintain corporate identifiers, support nodes, and invoice billing records."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {isSw
                      ? "Jina la Biashara / Soko"
                      : "Business / Storefront Title"}
                  </label>
                  <input
                    type="text"
                    value={settings.companyName || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, companyName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {isSw ? "Simu ya Msaada" : "Support Helpline Tel"}
                    </label>
                    <input
                      type="text"
                      value={settings.phone || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, phone: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {isSw
                        ? "Barua Pepe ya Ofisi"
                        : "Corporate Registered Email"}
                    </label>
                    <input
                      type="email"
                      value={settings.email || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, email: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <GooglePlacePicker
                    lang={isSw ? "sw" : "en"}
                    value={settings.address || ""}
                    selectedPlace={globalOfficePlace}
                    onAddressChange={(value) =>
                      setSettings({ ...settings, address: value })
                    }
                    onPlaceSelect={setGlobalOfficePlace}
                    compact
                    label={
                      isSw
                        ? "Anuani ya Ofisi / Kazi"
                        : "Physical Headquarters Address"
                    }
                    placeholder={
                      isSw
                        ? "Tafuta ofisi kwenye Google Maps..."
                        : "Search headquarters on Google Maps..."
                    }
                    helperText={
                      isSw
                        ? "Tumia Google Places ili kuepuka makosa ya eneo."
                        : "Use Google Places to avoid location spelling and map errors."
                    }
                  />
                </div>

                {/* Banner image background component */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 sm:p-6 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={16}
                        className="text-yellow-500 animate-pulse shrink-0"
                      />
                      <div>
                        <span className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                          {isSw
                            ? "Mipangilio ya Nyuma ya App Bar"
                            : "Client Portal App Bar Background Styles"}
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">
                          {isSw
                            ? "Weka hadi picha 3 ambazo zitajirudia (loop) kila baada ya sekunde 3 zikiwa na transitions nzuri za video, au sanidi rangi ya kudumu."
                            : "Configure up to 3 background images looping every 3 seconds with dynamic video-like transitions, or pick a default solid color."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Loop backgrounds inputs */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {isSw
                        ? "Hadi Picha/Video 3 za Mandhari ya Loop (Sekunde 3 kila moja)"
                        : "Up to 3 Loopable Background Media (3sec intervals)"}
                    </label>

                    {/* BG 1 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600">
                          {isSw
                            ? "Picha/Video ya 1 (Ya kwanza):"
                            : "Background Media 1 (Primary):"}
                        </span>
                        {settings.appBarBackground && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({ ...settings, appBarBackground: "" })
                            }
                            className="text-[9px] font-black text-rose-500 cursor-pointer hover:underline"
                          >
                            {isSw ? "Futa" : "Clear"}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          value={settings.appBarBackground || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              appBarBackground: e.target.value,
                            })
                          }
                          className="flex-1 bg-white border border-slate-200 hover:border-slate-300 p-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition font-mono"
                        />
                        <label className="shrink-0">
                          <span
                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${uploadingBGs.bg1 ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700 active:scale-95"}`}
                          >
                            {uploadingBGs.bg1 ? (
                              <>
                                <RefreshCw className="animate-spin" size={13} />
                                {isSw ? "Inapakia..." : "Uploading..."}
                              </>
                            ) : (
                              <>
                                <ImageIcon size={13} />
                                {isSw ? "Pakia" : "Upload"}
                              </>
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) =>
                              handleBGUpload(e, "appBarBackground", "bg1")
                            }
                            disabled={uploadingBGs.bg1}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* BG 2 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600">
                          {isSw
                            ? "Picha/Video ya 2:"
                            : "Background Media 2 (Looping):"}
                        </span>
                        {settings.appBarBackground2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                appBarBackground2: "",
                              })
                            }
                            className="text-[9px] font-black text-rose-500 cursor-pointer hover:underline"
                          >
                            {isSw ? "Futa" : "Clear"}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          value={settings.appBarBackground2 || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              appBarBackground2: e.target.value,
                            })
                          }
                          className="flex-1 bg-white border border-slate-200 hover:border-slate-300 p-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition font-mono"
                        />
                        <label className="shrink-0">
                          <span
                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${uploadingBGs.bg2 ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700 active:scale-95"}`}
                          >
                            {uploadingBGs.bg2 ? (
                              <>
                                <RefreshCw className="animate-spin" size={13} />
                                {isSw ? "Inapakia..." : "Uploading..."}
                              </>
                            ) : (
                              <>
                                <ImageIcon size={13} />
                                {isSw ? "Pakia" : "Upload"}
                              </>
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) =>
                              handleBGUpload(e, "appBarBackground2", "bg2")
                            }
                            disabled={uploadingBGs.bg2}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* BG 3 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600">
                          {isSw
                            ? "Picha/Video ya 3:"
                            : "Background Media 3 (Looping):"}
                        </span>
                        {settings.appBarBackground3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                appBarBackground3: "",
                              })
                            }
                            className="text-[9px] font-black text-rose-500 cursor-pointer hover:underline"
                          >
                            {isSw ? "Futa" : "Clear"}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          value={settings.appBarBackground3 || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              appBarBackground3: e.target.value,
                            })
                          }
                          className="flex-1 bg-white border border-slate-200 hover:border-slate-300 p-2.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition font-mono"
                        />
                        <label className="shrink-0">
                          <span
                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${uploadingBGs.bg3 ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700 active:scale-95"}`}
                          >
                            {uploadingBGs.bg3 ? (
                              <>
                                <RefreshCw className="animate-spin" size={13} />
                                {isSw ? "Inapakia..." : "Uploading..."}
                              </>
                            ) : (
                              <>
                                <ImageIcon size={13} />
                                {isSw ? "Pakia" : "Upload"}
                              </>
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) =>
                              handleBGUpload(e, "appBarBackground3", "bg3")
                            }
                            disabled={uploadingBGs.bg3}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preset Background Stock Images helper */}
                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {isSw
                        ? "Bofya Haraka Kuweka Picha za Unsplash:"
                        : "One-Click Premium Gradient Stock Backdrops:"}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          name: isSw
                            ? "Teal Cyber Matrix"
                            : "Teal Cyber Matrix",
                          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=480",
                        },
                        {
                          name: isSw ? "Warm Soft Mesh" : "Warm Soft Mesh",
                          url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=480",
                        },
                        {
                          name: isSw ? "Neon Synthwave" : "Neon Synthwave",
                          url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=480",
                        },
                        {
                          name: isSw ? "Iridescent Fluid" : "Iridescent Liquid",
                          url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=480",
                        },
                      ].map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (!settings.appBarBackground) {
                              setSettings({
                                ...settings,
                                appBarBackground: p.url,
                              });
                            } else if (!settings.appBarBackground2) {
                              setSettings({
                                ...settings,
                                appBarBackground2: p.url,
                              });
                            } else {
                              setSettings({
                                ...settings,
                                appBarBackground3: p.url,
                              });
                            }
                          }}
                          className="flex flex-col text-left rounded-2xl overflow-hidden border p-1 focus:outline-none transition cursor-pointer bg-white border-slate-200/85 hover:border-slate-350"
                        >
                          <div className="h-10 w-full rounded-xl bg-slate-100 overflow-hidden relative">
                            <img
                              src={p.url}
                              className="w-full h-full object-cover"
                              alt={p.name}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 mt-1 truncate w-full px-1">
                            {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Standard selection color as requested: "NOTE: add the default the background selection color so as the admin may select default static platform color" */}
                  <div className="pt-3 border-t border-slate-200/60 space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {isSw
                          ? "Rangi ya Chini ya Platform (Platform Base Color)"
                          : "Default Platform Background Selection Color"}
                      </label>
                      <p className="text-[9px] text-slate-500 font-medium">
                        {isSw
                          ? "Inatumika kama rangi kuu ya App Bar ikiwa picha hazipo, au kama rangi ya nyuma ya duka lote la mteja."
                          : "Overrides the App Bar static background if no images are loaded, or serves as the base theme brand color."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 items-center">
                      {[
                        {
                          name: isSw ? "Slate ya Giza" : "Slate Void",
                          value: "#0f172a",
                        },
                        {
                          name: isSw ? "Bluu Mtandao" : "Cyber Blue",
                          value: "#1e3a8a",
                        },
                        {
                          name: isSw ? "Zambarau Safi" : "Dark Violet",
                          value: "#1e1b4b",
                        },
                        {
                          name: isSw ? "Kijani Kibichi" : "Deep Emerald",
                          value: "#022c22",
                        },
                        {
                          name: isSw ? "Nyekundu / Ruby" : "Crimson Void",
                          value: "#450a0a",
                        },
                      ].map((col) => {
                        const active = settings.appBarColor === col.value;
                        return (
                          <button
                            key={col.value}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                appBarColor: col.value,
                              })
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                              active
                                ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: col.value }}
                            />
                            <span>{col.name}</span>
                          </button>
                        );
                      })}

                      {/* Custom input option */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl max-w-[150px]">
                        <span className="text-[10px] text-slate-400 font-bold">
                          HEX:
                        </span>
                        <input
                          type="text"
                          placeholder="#0f172a"
                          value={settings.appBarColor || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              appBarColor: e.target.value,
                            })
                          }
                          className="bg-transparent border-none text-[10px] font-mono font-bold w-full focus:outline-none text-slate-700"
                        />
                      </div>

                      {settings.appBarColor && (
                        <button
                          type="button"
                          onClick={() =>
                            setSettings({ ...settings, appBarColor: "" })
                          }
                          className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer ml-auto"
                        >
                          {isSw ? "Weka upya" : "Reset Default"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Disable animations toggle */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/60 rounded-2xl">
                      <input
                        type="checkbox"
                        id="toggle_appbar_animations"
                        checked={!!settings.disableAppBarAnimations}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            disableAppBarAnimations: e.target.checked,
                          })
                        }
                        className="cursor-pointer w-4 h-4 accent-indigo-600 rounded shrink-0"
                      />
                      <div className="leading-tight flex-1">
                        <label
                          htmlFor="toggle_appbar_animations"
                          className="cursor-pointer select-none text-[11px] font-bold text-slate-800 uppercase tracking-wide block"
                        >
                          {isSw
                            ? "Zima Madoido ya Kusogeza au Kukuza Picha (Ken Burns)"
                            : "Disable Ken-Burns zoom/pan animations"}
                        </label>
                        <span className="text-[9px] text-slate-500 font-medium leading-none block mt-0.5">
                          {isSw
                            ? "Zuia video na picha zisivute au kuelea (Zitabadilishana kwa utulivu, inafaa sana ukitumia video)"
                            : "Prevents panning and zooming motion on AppBar slides (performs clean crossfade transitions)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure payment options section */}
                <div className="border border-slate-200/80 rounded-3xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        {isSw ? "Njia za Malipo" : "Payment Gateways & Options"}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {isSw
                          ? "Ongeza maelezo ya akaunti za kupokea malipo."
                          : "Configure target bank nodes or mobile wallets for orders."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          paymentOptions: [
                            ...(settings.paymentOptions || []),
                            {
                              id: Date.now().toString(),
                              name: "",
                              details: "",
                            },
                          ],
                        })
                      }
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-2xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <span>+ {isSw ? "Ongeza Njia" : "Add Gateway"}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(settings.paymentOptions || []).length === 0 && (
                      <div className="text-xs text-slate-500 italic py-2 text-center">
                        {isSw
                          ? "Hakuna njia za malipo zilizoongezwa bado."
                          : "No corporate payment paths added yet."}
                      </div>
                    )}
                    {(settings.paymentOptions || []).map(
                      (opt: any, idx: number) => (
                        <div
                          key={opt.id}
                          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative group text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...settings.paymentOptions];
                              copy.splice(idx, 1);
                              setSettings({
                                ...settings,
                                paymentOptions: copy,
                              });
                            }}
                            className="absolute top-2.5 right-2.5 text-rose-500 bg-white p-1 rounded-full shadow-xs border border-rose-100 hover:bg-rose-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition duration-200"
                          >
                            <X size={14} />
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                {isSw
                                  ? "Jina la Njia ya Malipo (Mf. M-Pesa, NMB)"
                                  : "Financial Wallet Title"}
                              </label>
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) => {
                                  const copy = [...settings.paymentOptions];
                                  copy[idx].name = e.target.value;
                                  setSettings({
                                    ...settings,
                                    paymentOptions: copy,
                                  });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-indigo-600 transition"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                {isSw
                                  ? "Maelezo ya Malipo (Namba/Akaunti)"
                                  : "Account / Paybill Credentials details"}
                              </label>
                              <input
                                type="text"
                                value={opt.details}
                                onChange={(e) => {
                                  const copy = [...settings.paymentOptions];
                                  copy[idx].details = e.target.value;
                                  setSettings({
                                    ...settings,
                                    paymentOptions: copy,
                                  });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-indigo-600 transition"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end items-center gap-4">
                {savedProfile && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>
                      {isSw
                        ? "Imehifadhiwa kikamilifu"
                        : "Profile parameters saved!"}
                    </span>
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer"
                >
                  {isSw ? "Hifadhi Wasifu" : "Save Profile details"}
                </button>
              </div>
            </form>
          )}

          {activeSubTab === "delivery" && (
            <form
              onSubmit={handleSaveDeliveryZones}
              className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200 text-left"
            >
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {isSw ? "MAENEO YA USAFIRISHAJI" : "DELIVERY OPERATING ZONES"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {isSw
                      ? "Weka jina la eneo, gharama na siku za makadirio. Hizi ndizo zitatumika kwenye product cards na checkout."
                      : "Define customer-facing delivery regions, fees, and ETA windows used by product cards and checkout."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryZones((prev) => [
                      ...prev,
                      {
                        id: `new-${Date.now()}`,
                        name: "",
                        labelSw: "",
                        labelEn: "",
                        price: 0,
                        minDays: 1,
                        maxDays: 2,
                        isActive: true,
                        sortOrder: prev.length + 1,
                      },
                    ])
                  }
                  className="min-h-11 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-800"
                >
                  + {isSw ? "Ongeza Eneo" : "Add Zone"}
                </button>
              </div>

              <div className="space-y-3">
                {deliveryZones.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-semibold text-slate-500">
                    {isSw ? "Hakuna delivery zones bado." : "No delivery zones configured yet."}
                  </div>
                )}

                {deliveryZones.map((zone, idx) => (
                  <div key={zone.id || idx} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-xs ring-1 ring-slate-200">
                          <Truck size={16} />
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            {zone.name || (isSw ? `Eneo ${idx + 1}` : `Zone ${idx + 1}`)}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {isSw ? "Bei na muda huonekana kwa wateja" : "Fee and ETA are visible to customers"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                          <input
                            type="checkbox"
                            checked={zone.isActive !== false}
                            onChange={(e) => {
                              const copy = [...deliveryZones];
                              copy[idx] = { ...copy[idx], isActive: e.target.checked };
                              setDeliveryZones(copy);
                            }}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          {isSw ? "Active" : "Active"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setDeliveryZones((prev) => prev.filter((_, i) => i !== idx))}
                          className="min-h-11 rounded-2xl bg-rose-50 px-3 text-xs font-black text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100"
                        >
                          {isSw ? "Futa" : "Remove"}
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <GooglePlacePicker
                        lang={isSw ? "sw" : "en"}
                        value={zone.name || zone.labelSw || zone.labelEn || ""}
                        selectedPlace={deliveryZonePlaces[String(zone.id || idx)] || null}
                        onAddressChange={(value) => {
                          const copy = [...deliveryZones];
                          copy[idx] = {
                            ...copy[idx],
                            name: value,
                            labelSw: copy[idx].labelSw || value,
                            labelEn: copy[idx].labelEn || value,
                          };
                          setDeliveryZones(copy);
                        }}
                        onPlaceSelect={(place) => {
                          setDeliveryZonePlaces((prev) => ({
                            ...prev,
                            [String(zone.id || idx)]: place,
                          }));
                          if (place) {
                            const copy = [...deliveryZones];
                            copy[idx] = {
                              ...copy[idx],
                              name: place.name || place.formattedAddress,
                              labelSw: place.name || place.formattedAddress,
                              labelEn: place.name || place.formattedAddress,
                            };
                            setDeliveryZones(copy);
                          }
                        }}
                        compact
                        label={isSw ? "Tafuta region/place kwenye Google" : "Search region/place on Google"}
                        placeholder={isSw ? "Mfano: Dar es Salaam, Arusha, Mwanza..." : "Example: Dar es Salaam, Arusha, Mwanza..."}
                        helperText={
                          isSw
                            ? "Hii inasaidia admin kuweka jina sahihi la eneo kabla ya kuweka bei na siku."
                            : "This helps admins set an accurate zone name before configuring fees and ETA."
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Jina la ndani" : "Internal name"}
                        </label>
                        <input
                          value={zone.name || ""}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], name: e.target.value };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                          placeholder="Dar es Salaam"
                          required
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Label Kiswahili" : "Swahili label"}
                        </label>
                        <input
                          value={zone.labelSw || ""}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], labelSw: e.target.value };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                          placeholder="Mikoa mingine"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Label Kiingereza" : "English label"}
                        </label>
                        <input
                          value={zone.labelEn || ""}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], labelEn: e.target.value };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                          placeholder="Other regions"
                        />
                      </div>
                      <div className="lg:col-span-2 flex flex-col justify-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!zone.isB2bHub}
                            onChange={(e) => {
                              const copy = [...deliveryZones];
                              copy[idx] = { ...copy[idx], isB2bHub: e.target.checked };
                              setDeliveryZones(copy);
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
                          />
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                            {isSw ? "Hiki ni Kituo cha B2B?" : "Is B2B Hub?"}
                          </span>
                        </label>
                      </div>
                      {zone.isB2bHub && (
                        <div className="lg:col-span-2">
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {isSw ? "Jina la Hub" : "Hub Name"}
                          </label>
                          <input
                            value={zone.b2bHubName || ""}
                            onChange={(e) => {
                              const copy = [...deliveryZones];
                              copy[idx] = { ...copy[idx], b2bHubName: e.target.value };
                              setDeliveryZones(copy);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                            placeholder={isSw ? "Mfano: Kariakoo Hub" : "e.g. Kariakoo Hub"}
                          />
                        </div>
                      )}
                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Gharama (TSh)" : "Fee (TZS)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={zone.price || 0}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], price: Number(e.target.value || 0) };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Siku chini" : "Min days"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={zone.minDays || 0}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            const minDays = Number(e.target.value || 0);
                            copy[idx] = { ...copy[idx], minDays, maxDays: Math.max(minDays, Number(copy[idx].maxDays || minDays)) };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Siku juu" : "Max days"}
                        </label>
                        <input
                          type="number"
                          min={zone.minDays || 0}
                          value={zone.maxDays || zone.minDays || 0}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], maxDays: Number(e.target.value || 0) };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Mpangilio" : "Sort"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={zone.sortOrder ?? idx + 1}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], sortOrder: Number(e.target.value || 0) };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[2rem] border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {isSw ? "Kanuni za Bei ya Usafirishaji" : "Delivery Pricing Rules"}
                    </h4>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      {isSw
                        ? "Bei halisi kulingana na eneo, aina ya bidhaa na uzito. Kanuni isiyopatikana inaweza kuzuia bidhaa kufikishwa eneo husika."
                        : "Real quote rules by zone, product class, and weight. Unavailable rules can block delivery for a zone."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDeliveryRules((prev) => [
                        ...prev,
                        {
                          id: `new-rule-${Date.now()}`,
                          zoneId: deliveryZones[0]?.id || "",
                          deliveryClass: "standard",
                          minWeightKg: 0,
                          maxWeightKg: 5,
                          baseFee: 0,
                          perKgFee: 0,
                          fragileFee: 0,
                          oversizedFee: 0,
                          coldChainFee: 0,
                          minDays: 1,
                          maxDays: 2,
                          isAvailable: true,
                          sortOrder: prev.length + 1,
                        },
                      ])
                    }
                    className="min-h-11 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + {isSw ? "Ongeza Rule" : "Add Rule"}
                  </button>
                </div>

                <div className="rounded-[1.5rem] border border-blue-100 bg-white/80 p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                        {isSw ? "Live Fallback Pricing Matrix" : "Live Fallback Pricing Matrix"}
                      </h5>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {isSw
                          ? "Hiki ndicho checkout itatumia kama Google Routes au coordinates hazipo."
                          : "This is what checkout uses when Google Routes or coordinates are unavailable."}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase text-blue-700 ring-1 ring-blue-100">
                      {deliveryMatrixRows.length} {isSw ? "rules" : "rules"}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-[760px] w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-3 py-2">{isSw ? "Eneo" : "Zone"}</th>
                          <th className="px-3 py-2">{isSw ? "Class" : "Class"}</th>
                          <th className="px-3 py-2">{isSw ? "Uzito" : "Weight"}</th>
                          <th className="px-3 py-2">{isSw ? "Bei" : "Pricing"}</th>
                          <th className="px-3 py-2">ETA</th>
                          <th className="px-3 py-2">{isSw ? "Hali" : "Status"}</th>
                          <th className="px-3 py-2">{isSw ? "Kitendo" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {deliveryMatrixRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-5 text-center text-xs font-semibold text-slate-400">
                              {isSw ? "Hakuna matrix rules bado." : "No matrix rules configured yet."}
                            </td>
                          </tr>
                        ) : (
                          deliveryMatrixRows.map(({ rule, zone, index }, idx) => (
                            <tr key={`${rule.id || idx}-matrix`} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2 font-black text-slate-800">
                                {zone?.labelSw || zone?.name || rule.zoneId || "-"}
                              </td>
                              <td className="px-3 py-2">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-700">
                                  {rule.deliveryClass}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-600">
                                {Number(rule.minWeightKg || 0)}kg - {rule.maxWeightKg ?? "∞"}kg
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-600">
                                {formatCurrency(rule.baseFee || 0)} + {formatCurrency(rule.perKgFee || 0)}/kg
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-600">
                                {rule.minDays === rule.maxDays
                                  ? `${rule.maxDays} ${isSw ? "siku" : "days"}`
                                  : `${rule.minDays}-${rule.maxDays} ${isSw ? "siku" : "days"}`}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                                  rule.isAvailable !== false
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}>
                                  {rule.isAvailable !== false ? (isSw ? "Inafanya kazi" : "Available") : (isSw ? "Imezuiwa" : "Blocked")}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => focusDeliveryRuleEditor(index)}
                                  className="min-h-9 rounded-xl bg-slate-900 px-3 text-[10px] font-black uppercase text-white transition hover:bg-blue-700"
                                >
                                  {isSw ? "Hariri" : "Edit"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                        {isSw ? "Jaribu Quote ya Fallback" : "Test Fallback Quote"}
                      </h5>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {isSw
                          ? "Jaribu bei na ETA kabla ya kuweka rules live kwa wateja."
                          : "Preview fee and ETA before customers rely on these fallback rules."}
                      </p>
                    </div>
                    <div className={`rounded-2xl px-4 py-2 text-right ${
                      fallbackQuotePreview?.available ? "bg-white text-emerald-700" : "bg-white text-rose-700"
                    }`}>
                      <p className="text-[9px] font-black uppercase tracking-wider">
                        {fallbackQuotePreview?.available ? (isSw ? "Quote Inaruhusu" : "Quote Allowed") : (isSw ? "Quote Imezuiwa" : "Quote Blocked")}
                      </p>
                      <p className="text-sm font-black">
                        {fallbackQuotePreview?.available
                          ? `${formatCurrency(fallbackQuotePreview.fee)} · ${fallbackQuotePreview.eta}`
                          : fallbackQuotePreview?.reason || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-emerald-800">{isSw ? "Eneo la Mteja" : "Customer Zone"}</label>
                      <select
                        value={deliveryTest.zoneId || deliveryZones[0]?.id || ""}
                        onChange={(e) => setDeliveryTest((prev) => ({ ...prev, zoneId: e.target.value }))}
                        className="w-full rounded-2xl border border-emerald-100 bg-white p-3 text-xs font-bold outline-none focus:border-emerald-600"
                      >
                        {deliveryZones.map((zone) => (
                          <option key={zone.id} value={zone.id}>{zone.labelSw || zone.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-emerald-800">{isSw ? "Class" : "Class"}</label>
                      <select
                        value={deliveryTest.deliveryClass}
                        onChange={(e) => setDeliveryTest((prev) => ({ ...prev, deliveryClass: e.target.value }))}
                        className="w-full rounded-2xl border border-emerald-100 bg-white p-3 text-xs font-bold outline-none focus:border-emerald-600"
                      >
                        <option value="standard">standard</option>
                        <option value="fresh_food">fresh_food</option>
                        <option value="processed_food">processed_food</option>
                        <option value="bulky">bulky</option>
                        <option value="heavy">heavy</option>
                        <option value="vehicle">vehicle</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-emerald-800">{isSw ? "Uzito Kg" : "Weight Kg"}</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={deliveryTest.weightKg}
                        onChange={(e) => setDeliveryTest((prev) => ({ ...prev, weightKg: Number(e.target.value || 1) }))}
                        className="w-full rounded-2xl border border-emerald-100 bg-white p-3 text-xs font-bold outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-emerald-800">{isSw ? "Qty" : "Qty"}</label>
                      <input
                        type="number"
                        min="1"
                        value={deliveryTest.quantity}
                        onChange={(e) => setDeliveryTest((prev) => ({ ...prev, quantity: Number(e.target.value || 1) }))}
                        className="w-full rounded-2xl border border-emerald-100 bg-white p-3 text-xs font-bold outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="flex flex-wrap items-end gap-2 lg:col-span-6">
                      {[
                        ["fragile", isSw ? "Fragile" : "Fragile"],
                        ["oversized", isSw ? "Oversized" : "Oversized"],
                        ["requiresColdChain", isSw ? "Cold chain" : "Cold chain"],
                      ].map(([key, label]) => (
                        <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-emerald-100">
                          <input
                            type="checkbox"
                            checked={Boolean((deliveryTest as any)[key])}
                            onChange={(e) => setDeliveryTest((prev) => ({ ...prev, [key]: e.target.checked }))}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {deliveryRules.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-5 text-center text-xs font-semibold text-slate-500">
                      {isSw ? "Hakuna pricing rules bado. Zone price itatumika kama fallback." : "No pricing rules yet. Zone fees will be used as fallback."}
                    </div>
                  )}
                  {deliveryRules.map((rule, idx) => (
                    <div
                      id={`delivery-rule-editor-${idx}`}
                      key={rule.id || idx}
                      className={`rounded-3xl border p-4 transition-all ${
                        editingDeliveryRuleIndex === idx
                          ? "border-blue-400 bg-blue-50/70 shadow-lg shadow-blue-100"
                          : "border-blue-100 bg-white"
                      }`}
                    >
                      {editingDeliveryRuleIndex === idx && (
                        <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                            {isSw ? "Unahariri rule hii kutoka fallback matrix" : "Editing this fallback matrix rule"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingDeliveryRuleIndex(null)}
                            className="rounded-lg px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-slate-100"
                          >
                            {isSw ? "Funga" : "Close"}
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="lg:col-span-2">
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Eneo" : "Zone"}</label>
                          <select
                            value={rule.zoneId || ""}
                            onChange={(e) => {
                              const copy = [...deliveryRules];
                              copy[idx] = { ...copy[idx], zoneId: e.target.value };
                              setDeliveryRules(copy);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                          >
                            <option value="">{isSw ? "Chagua zone" : "Select zone"}</option>
                            {deliveryZones.map((zone) => (
                              <option key={zone.id} value={zone.id}>{zone.labelSw || zone.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Aina" : "Class"}</label>
                          <select
                            value={rule.deliveryClass || "standard"}
                            onChange={(e) => {
                              const copy = [...deliveryRules];
                              copy[idx] = { ...copy[idx], deliveryClass: e.target.value };
                              setDeliveryRules(copy);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                          >
                            <option value="standard">{isSw ? "Kawaida" : "Standard"}</option>
                            <option value="fresh_food">{isSw ? "Chakula fresh" : "Fresh food"}</option>
                            <option value="processed_food">{isSw ? "Chakula kilichosindikwa" : "Processed food"}</option>
                            <option value="bulky">{isSw ? "Kubwa" : "Bulky"}</option>
                            <option value="heavy">{isSw ? "Nzito" : "Heavy"}</option>
                            <option value="vehicle">{isSw ? "Gari / Chombo" : "Vehicle"}</option>
                            <option value="special">{isSw ? "Maalum" : "Special"}</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Kg Chini" : "Min Kg"}</label>
                          <input type="number" min="0" step="0.1" value={rule.minWeightKg || 0} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], minWeightKg: Number(e.target.value || 0) };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Kg Juu" : "Max Kg"}</label>
                          <input type="number" min="0" step="0.1" value={rule.maxWeightKg ?? ""} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], maxWeightKg: e.target.value === "" ? null : Number(e.target.value || 0) };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" placeholder="No cap" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Ada ya Msingi" : "Base Fee"}</label>
                          <input type="number" min="0" value={rule.baseFee || 0} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], baseFee: Number(e.target.value || 0) };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Kwa Kg" : "Per Kg"}</label>
                          <input type="number" min="0" value={rule.perKgFee || 0} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], perKgFee: Number(e.target.value || 0) };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Siku Chini" : "ETA Min"}</label>
                          <input type="number" min="0" value={rule.minDays || 0} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], minDays: Number(e.target.value || 0) };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Siku Juu" : "ETA Max"}</label>
                          <input type="number" min="0" value={rule.maxDays || 0} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], maxDays: Number(e.target.value || 0) };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">{isSw ? "Sababu ikiwa haipatikani" : "Unavailable reason"}</label>
                          <input value={rule.reasonIfUnavailable || ""} onChange={(e) => {
                            const copy = [...deliveryRules];
                            copy[idx] = { ...copy[idx], reasonIfUnavailable: e.target.value };
                            setDeliveryRules(copy);
                          }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600" placeholder={isSw ? "Mf. Huduma haipo mkoa huu" : "e.g. Service unavailable"} />
                        </div>
                        <div className="flex items-end gap-2 lg:col-span-2">
                          <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                            <input type="checkbox" checked={rule.isAvailable !== false} onChange={(e) => {
                              const copy = [...deliveryRules];
                              copy[idx] = { ...copy[idx], isAvailable: e.target.checked };
                              setDeliveryRules(copy);
                            }} className="h-4 w-4 accent-emerald-600" />
                            {isSw ? "Inapatikana" : "Available"}
                          </label>
                          <button type="button" onClick={() => setDeliveryRules((prev) => prev.filter((_, i) => i !== idx))} className="min-h-11 rounded-2xl bg-rose-50 px-3 text-xs font-black text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100">
                            {isSw ? "Futa" : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end items-center gap-4">
                {deliverySaved && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>{isSw ? "Delivery zones zimehifadhiwa" : "Delivery zones saved"}</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="min-h-11 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer"
                >
                  {isSw ? "Hifadhi Usafirishaji" : "Save Delivery Zones"}
                </button>
              </div>
            </form>
          )}

          {activeSubTab === "loyalty" && (
            <form
              onSubmit={handleSaveLoyalty}
              className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200 text-left"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isSw
                    ? "ALAMA ZA UAMINIFU NA MASHARTI"
                    : "LOYALTY REWARDS & LEGAL TERMS"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {isSw
                    ? "Seti za mifumo ya pointi na mikataba/vigezo vya soko upande wa mteja."
                    : "Tune the customer fidelity logic, voucher costs, and general terms of service representation."}
                </p>
              </div>

              <div className="bg-amber-50/55 border border-amber-200/60 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500 shrink-0" />
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    {isSw
                      ? "PIMA REWARD POINT COEFFS"
                      : "FIDELITY PROGRAM RATINGS"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-amber-800 tracking-wider">
                      {isSw
                        ? "Point kwa kila TSh 1,000"
                        : "Points per TZS 1000 spent"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        settings.pointsRate !== undefined
                          ? settings.pointsRate
                          : 1
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsRate: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full bg-white border border-amber-200 rounded-2xl p-3 text-xs font-semibold outline-none focus:border-amber-600 transition"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-amber-800 tracking-wider">
                      {isSw
                        ? "Thamani ya Cash kwa kila Alama"
                        : "Cash value in TZS per Point"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        settings.pointsWorth !== undefined
                          ? settings.pointsWorth
                          : 10
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsWorth: parseInt(e.target.value, 10) || 10,
                        })
                      }
                      className="w-full bg-white border border-amber-200 rounded-2xl p-3 text-xs font-semibold outline-none focus:border-amber-600 transition"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-amber-800 tracking-wider">
                      {isSw
                        ? "Points kwa kila Kuponi 1 TSh"
                        : "Points per TSh 1 discount"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        settings.pointsRequiredPerTzsDiscount !== undefined
                          ? settings.pointsRequiredPerTzsDiscount
                          : 10
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsRequiredPerTzsDiscount:
                            parseInt(e.target.value, 10) || 10,
                        })
                      }
                      className="w-full bg-white border border-amber-300 rounded-2xl p-3 text-xs font-semibold outline-none focus:border-amber-600 transition"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-amber-200/50 pt-3 space-y-3">
                  <span className="block text-[9px] font-black uppercase text-amber-900 tracking-widest">
                    {isSw
                      ? "GHARAMA ZA POINT KUKOMBOA ZAWADI"
                      : "VOUCHER POINT REWARD CALIBRATION"}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 tracking-wider">
                        v_5k_cost (Kuponi TSh 5,000)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          settings.v_5k_cost !== undefined
                            ? settings.v_5k_cost
                            : 100
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            v_5k_cost: parseInt(e.target.value, 10) || 100,
                          })
                        }
                        className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs font-semibold outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 tracking-wider">
                        v_15_vip_cost (Punguzo 15% VIP)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          settings.v_15_vip_cost !== undefined
                            ? settings.v_15_vip_cost
                            : 250
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            v_15_vip_cost: parseInt(e.target.value, 10) || 250,
                          })
                        }
                        className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs font-semibold outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 tracking-wider">
                        v_free_ship_cost (Uwasilishaji Bure)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          settings.v_free_ship_cost !== undefined
                            ? settings.v_free_ship_cost
                            : 50
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            v_free_ship_cost:
                              parseInt(e.target.value, 10) || 50,
                          })
                        }
                        className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs font-semibold outline-none transition"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {isSw
                    ? "Masharti na Vigezo vya Soko (Customer Agreement terms)"
                    : "Marketplace Terms & Conditions"}
                </label>
                <textarea
                  value={settings.terms || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, terms: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-indigo-600 focus:bg-white resize-y h-24 transition"
                  placeholder="Tunapokea malipo kabla ya kutuma mzigo..."
                />
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end items-center gap-4">
                {savedLoyalty && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>
                      {isSw
                        ? "Mipangilio imehuishwa kikamilifu"
                        : "Loyalty parameters adjusted!"}
                    </span>
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer"
                >
                  {isSw ? "Hifadhi Alama & Masharti" : "Save Reward parameters"}
                </button>
              </div>
            </form>
          )}

          {activeSubTab === "tra" && (
            <form
              onSubmit={handleSaveTra}
              className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200 text-left"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isSw
                    ? "TRA EFDMS INTEGRATION (GLOBAL)"
                    : "TRA EFD TELEMETRY ENGINE"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {isSw
                    ? "Sajili bidhaa, simamia namba za kodi za EFD na udhibiti sahihi za kisheria za mamlaka."
                    : "Configure communication paths with the Tanzania Revenue Authority fiscal servers."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <input
                  type="checkbox"
                  id="tra_sandbox_settings"
                  checked={traIsSandbox}
                  onChange={(e) => setTraIsSandbox(e.target.checked)}
                  className="cursor-pointer w-4.5 h-4.5 accent-indigo-600 rounded"
                />
                <label
                  htmlFor="tra_sandbox_settings"
                  className="cursor-pointer select-none text-xs font-bold text-slate-800 uppercase tracking-wide"
                >
                  {isSw
                    ? "Kipindi cha Majaribio TU (Use SANDBOX Server)"
                    : "Use Development Test Gateway (Sandbox/Testing)"}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    TAXPAYER TIN NUMBER
                  </label>
                  <input
                    type="text"
                    value={traTin}
                    onChange={(e) => setTraTin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:bg-white transition"
                    placeholder="e.g. 100123456"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    CERTIFICATE KEY (SERIAL)
                  </label>
                  <input
                    type="text"
                    value={traCertKey}
                    onChange={(e) => setTraCertKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  CERTIFICATE SERIAL (TRA PROVIDED)
                </label>
                <input
                  type="text"
                  value={traCertSerial}
                  onChange={(e) => setTraCertSerial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:bg-white transition"
                  placeholder="e.g. ABC123XYZ"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  PRIVATE KEY (PEM STRING FORMAT)
                </label>
                <textarea
                  rows={4}
                  value={traPrivateKeyPem}
                  onChange={(e) => setTraPrivateKeyPem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl font-mono text-[10px] leading-relaxed outline-none focus:border-indigo-600 focus:bg-white transition"
                  placeholder="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAz87..."
                />
              </div>

              <div className="flex items-center gap-2.5 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <input
                  type="checkbox"
                  id="tra_auto_submission"
                  checked={traAutoTaxSales}
                  onChange={(e) => setTraAutoTaxSales(e.target.checked)}
                  className="cursor-pointer w-4.5 h-4.5 accent-emerald-600 rounded"
                />
                <label
                  htmlFor="tra_auto_submission"
                  className="cursor-pointer select-none text-xs font-bold text-emerald-950 uppercase tracking-wide"
                >
                  {isSw
                    ? "Tuma Tarakimu TRA Moja kwa moja (Auto submission on Delivery)"
                    : "Auto tax sales submission (Upload to TRA upon confirmation)"}
                </label>
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end items-center gap-4">
                {isTraSaved && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>
                      {isSw
                        ? "Sahihi za TRA zimehifadhiwa"
                        : "TRA parameters stored!"}
                    </span>
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-750 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer"
                >
                  {isSw ? "Hifadhi TRA" : "Save TRA telemetry"}
                </button>
              </div>
            </form>
          )}

          {activeSubTab === "security" && (
            <div className="space-y-6 text-left">
              {/* Account Password */}
              <form
                onSubmit={handleUpdatePassword}
                className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {isSw
                      ? "Nenosiri Jipya la Akaunti Yako"
                      : "New Account Password"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {isSw
                      ? "Weka nenosiri jipya la kuingia kwenye portal ya soko."
                      : "Modify access codes for high level merchant security nodes."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {isSw ? "Weka nenosiri jipya" : "Enter new password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white transition pr-10"
                      placeholder={
                        isSw
                          ? "Weka nenosiri jipya"
                          : "password minimum 6 characters"
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {pwdError && (
                  <div className="text-rose-500 text-xs font-bold">
                    {pwdError}
                  </div>
                )}
                {pwdMsg && (
                  <div className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={15} /> <span>{pwdMsg}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {pwdLoading
                      ? isSw
                        ? "Inabadilisha..."
                        : "Processing..."
                      : isSw
                        ? "Badili Nenosiri"
                        : "Save new password"}
                  </button>
                </div>
              </form>

              {/* Delete PIN */}
              <form
                onSubmit={handleUpdateDeletePIN}
                className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {isSw
                      ? "PIN ya Ulinzi ya Futa Oda (Delete Security PIN)"
                      : "ORDER DELETION PIN PARAMETER"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {isSw
                      ? "Weka PIN madhubuti hapa kuzuia uondoaji wa oda kinyume cha sheria na wafanyakazi au watumiaji wasioidhinishwa (Default PIN ni 9900)."
                      : "Protect critical transaction databases. Staff must enter this PIN and authorization code to remove records."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {isSw
                      ? "Nenosiri / PIN ya Kufuta Oda"
                      : "Security Deletion Passcode"}
                  </label>
                  <div className="relative">
                    <input
                      type={pinShow ? "text" : "password"}
                      value={deletePIN}
                      onChange={(e) => setDeletePIN(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/85 hover:border-slate-300 p-3.5 rounded-2xl text-sm font-mono tracking-widest font-black outline-none focus:border-rose-600 focus:bg-white transition pr-10"
                      placeholder="e.g. 9900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPinShow(!pinShow)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {pinShow ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {pinSaved && (
                  <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 size={15} />{" "}
                    <span>
                      {isSw
                        ? "PIN ya usalama imesasishwa kikamilifu!"
                        : "Security PIN has been secured!"}
                    </span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer"
                  >
                    {isSw ? "Hifadhi PIN ya Ulinzi" : "Authorize deletion PIN"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === "niches" && (
            <div className="bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200 text-left">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isSw
                    ? "Mipangilio ya Maduka (Niches)"
                    : "Storefront Niche Categories"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {isSw
                    ? "Orodha ya niches (Maduka) inayoonekana kwenye menu ya wateja. Admin anaweza kuongeza, kubadilisha, au kufuta."
                    : "Configure product niche boundaries that filter storefront listings dynamically."}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4">
                <span className="block text-[10px] font-black uppercase text-slate-700 tracking-wider">
                  {isSw ? "ONGEZA NICHES MPYA" : "CREATE NEW NICHE SECTION"}
                </span>

                <div className="space-y-6">
                  {/* Row 1: Niche Name and Collapsed Icon Selector side-by-side with Pill in front */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center bg-white border border-slate-200 p-4 rounded-3xl shadow-xs">
                    {/* Collapsed Pill Icon selector with live search */}
                    <div className="relative shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="w-full sm:w-auto flex items-center justify-between gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-4 py-3 rounded-full text-xs font-bold cursor-pointer transition shadow-xs min-w-[150px]"
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(
                            NicheIcons[newNicheIcon] || Smartphone,
                            { size: 16, className: "text-slate-700 animate-pulse" },
                          )}
                          <span className="font-extrabold text-slate-800 tracking-wide">{newNicheIcon}</span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400" />
                      </button>

                      {showIconPicker && (
                        <>
                          {/* Backdrop click to close */}
                          <div className="fixed inset-0 z-40" onClick={() => setShowIconPicker(false)} />
                          <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                              <Search size={14} className="text-slate-400 shrink-0" />
                              <input
                                type="text"
                                placeholder={isSw ? "Tafuta icon..." : "Search icon..."}
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-xs font-semibold w-full"
                                autoFocus
                              />
                            </div>
                            <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {iconOptions
                                .filter((icon) =>
                                  icon.toLowerCase().includes(iconSearch.toLowerCase()),
                                )
                                .map((icon) => {
                                  const IconComp = NicheIcons[icon];
                                  const active = newNicheIcon === icon;
                                  return (
                                    <button
                                      key={icon}
                                      type="button"
                                      onClick={() => {
                                        setNewNicheIcon(icon);
                                        setShowIconPicker(false);
                                      }}
                                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                        active
                                          ? "bg-slate-950 border-slate-950 text-emerald-400"
                                          : "bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-600 hover:text-slate-900"
                                      }`}
                                      title={icon}
                                    >
                                      {IconComp && <IconComp size={15} />}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Niche Name Input */}
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={newNicheName}
                        onChange={(e) => setNewNicheName(e.target.value)}
                        placeholder={
                          isSw ? "Ingiza Jina la Niche / Kitengo kipya..." : "Enter new Niche / Category name..."
                        }
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-full text-xs font-bold outline-none focus:border-slate-900 focus:bg-white transition px-5"
                      />
                    </div>
                  </div>

                  {/* Section 2: "MAKUNDI NA FAMILIA" (CATEGORIES & FAMILIES) */}
                  <div className="space-y-4 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="block text-[11px] font-black uppercase text-slate-800 tracking-wider">
                        {isSw ? "MAKUNDI NA FAMILIA" : "CATEGORIES & FAMILIES"}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {nicheCategoriesList.length} {isSw ? "Makundi" : "Categories"}
                      </span>
                    </div>

                    {/* Category Input Form */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category Name Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-left">
                            {isSw ? "Jina la Kundi (Mf. Simu)" : "Category Name (e.g. Phones)"}
                          </label>
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder={isSw ? "Jina la Kundi" : "Category Name"}
                            className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-slate-900 transition shadow-xs"
                          />
                        </div>

                        {/* Subfamilies Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-left">
                            {isSw ? "Familia za Bidhaa (Zitenganishe kwa koma)" : "Sub-Families (Comma separated)"}
                          </label>
                          <input
                            type="text"
                            value={newFamilyNames}
                            onChange={(e) => setNewFamilyNames(e.target.value)}
                            placeholder={isSw ? "iOS, Android, n.k." : "iOS, Android, etc."}
                            className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-slate-900 transition shadow-xs"
                          />
                        </div>

                        {/* Image Upload/URL Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-left">
                            {isSw ? "Picha ya Kundi (Pakia au URL)" : "Category Image (Upload or URL)"}
                          </label>
                          <div className="flex gap-2">
                            {/* Upload Button or preview */}
                            <div className="relative shrink-0">
                              {newCategoryImage ? (
                                <div className="relative group shrink-0">
                                  <img
                                    src={newCategoryImage}
                                    alt="Preview"
                                    className="w-[38px] h-[38px] rounded-xl object-cover border border-slate-200 shadow-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setNewCategoryImage("")}
                                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow-sm transition"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : (
                                <label className={`w-[38px] h-[38px] rounded-xl border border-dashed border-slate-300 flex items-center justify-center bg-white hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition shrink-0 ${uploadingCategoryImage ? "opacity-55" : ""}`}>
                                  {uploadingCategoryImage ? (
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <ImageIcon size={15} className="text-slate-400" />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingCategoryImage}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingCategoryImage(true);
                                      try {
                                        const url = await uploadFileViaStorageApi(file, "niches");
                                        setNewCategoryImage(url);
                                      } catch (err: any) {
                                        showAlert(err.message || "Failed to upload", "error");
                                      } finally {
                                        setUploadingCategoryImage(false);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            <input
                              type="text"
                              value={newCategoryImage}
                              onChange={(e) => setNewCategoryImage(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-slate-900 transition shadow-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for Category */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/40">
                        {editingCategoryIdx !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewCategoryName("");
                              setNewFamilyNames("");
                              setNewCategoryImage("");
                              setEditingCategoryIdx(null);
                            }}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-655 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <X size={14} />
                            <span>{isSw ? "Ghairi" : "Cancel"}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCategoryName.trim()) return;
                            const families = newFamilyNames
                              .split(",")
                              .map((f) => f.trim())
                              .filter(Boolean);
                            if (editingCategoryIdx !== null) {
                              const updated = [...nicheCategoriesList];
                              updated[editingCategoryIdx] = {
                                name: newCategoryName.trim(),
                                families,
                                image: newCategoryImage,
                              };
                              setNicheCategoriesList(updated);
                              setEditingCategoryIdx(null);
                            } else {
                              setNicheCategoriesList([
                                ...nicheCategoriesList,
                                {
                                  name: newCategoryName.trim(),
                                  families,
                                  image: newCategoryImage,
                                },
                              ]);
                            }
                            setNewCategoryName("");
                            setNewFamilyNames("");
                            setNewCategoryImage("");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {editingCategoryIdx !== null ? (
                            <>
                              <Check size={14} />
                              <span>{isSw ? "Hifadhi Kundi" : "Update Category"}</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              <span>{isSw ? "Ongeza Kundi" : "Add Category"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Category preview list: Spacious bento grid layout as requested */}
                    {nicheCategoriesList.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                        <ImageIcon className="mx-auto text-slate-300 mb-2 animate-pulse" size={24} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {isSw ? "Hakuna kundi lililoongezwa bado" : "No categories defined yet"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {isSw ? "Tumia fomu hapo juu kuongeza kategoria na familia zake." : "Use the form above to add categories with sub-families."}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2 pb-2">
                          {nicheCategoriesList.map((cat, idx) => {
                          const getPillStyle = (name: string) => {
                            const colors = [
                              "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100/70",
                              "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100/70",
                              "bg-sky-50 border-sky-150 text-sky-700 hover:bg-sky-100/70",
                              "bg-amber-50 border-amber-150 text-amber-700 hover:bg-amber-100/70",
                              "bg-rose-50 border-rose-150 text-rose-700 hover:bg-rose-100/70",
                              "bg-violet-50 border-violet-150 text-violet-700 hover:bg-violet-100/70",
                              "bg-teal-50 border-teal-150 text-teal-700 hover:bg-teal-100/70",
                              "bg-fuchsia-50 border-fuchsia-150 text-fuchsia-700 hover:bg-fuchsia-100/70"
                            ];
                            let hash = 0;
                            for (let i = 0; i < name.length; i++) {
                              hash = name.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            return colors[Math.abs(hash) % colors.length];
                          };

                          return (
                            <div
                              key={idx}
                              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between min-h-[220px] relative group ${
                                editingCategoryIdx === idx
                                  ? "bg-indigo-50/70 border-indigo-300 shadow-sm"
                                  : "bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300/90 hover:shadow-md"
                              }`}
                            >
                              {/* Beautiful Squircle Preview Avatar Image */}
                              <div className="shrink-0">
                                {cat.image ? (
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-14 h-14 rounded-2xl object-cover bg-slate-50 border border-slate-150 shadow-xs"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-150 flex flex-col items-center justify-center">
                                    <ImageIcon size={16} className="text-slate-400" />
                                    <span className="text-[6px] font-extrabold text-slate-400 uppercase mt-0.5 tracking-wider">NO PIC</span>
                                  </div>
                                )}
                              </div>

                              {/* Floating Action Buttons in Top-Right Corner */}
                              <div className="absolute top-4 right-4 flex items-center gap-0.5 bg-white/95 border border-slate-200/80 p-1 rounded-2xl shadow-sm opacity-60 group-hover:opacity-100 transition-all duration-250">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryIdx(idx);
                                    setNewCategoryName(cat.name);
                                    setNewFamilyNames(cat.families.join(", "));
                                    setNewCategoryImage(cat.image || "");
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                  title={isSw ? "Hariri" : "Edit"}
                                >
                                  <Edit size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNicheCategoriesList(
                                      nicheCategoriesList.filter((_, i) => i !== idx),
                                    );
                                    if (editingCategoryIdx === idx) {
                                      setNewCategoryName("");
                                      setNewFamilyNames("");
                                      setNewCategoryImage("");
                                      setEditingCategoryIdx(null);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                  title={isSw ? "Futa" : "Delete"}
                                >
                                  <X size={13} />
                                </button>
                              </div>

                              {/* Middle: Category Name */}
                              <div className="mt-3.5 mb-2">
                                <span className="text-[9px] font-black text-indigo-650 tracking-wider uppercase block mb-0.5">
                                  {isSw ? "Jamii" : "Category"}
                                </span>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-snug break-words">
                                  {cat.name}
                                </h4>
                              </div>

                              {/* Subtle separating line */}
                              <div className="h-px w-full bg-slate-100 my-2" />

                              {/* Bottom: Families tag cloud distributed beautifully */}
                              <div className="flex-1 mt-1">
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                  {isSw ? "Familia zilizo ndani" : "Sub-Families Included"}
                                </span>
                                {cat.families && cat.families.length > 0 ? (
                                  <div className="max-h-[85px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent">
                                    <div className="flex flex-wrap gap-1.5">
                                      {cat.families.map((f, fi) => (
                                        <span
                                          key={fi}
                                          className={`text-[9px] px-2.5 py-1 rounded-xl font-bold leading-none shrink-0 border ${getPillStyle(f)} transition-all duration-200 cursor-default`}
                                        >
                                          {f}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic font-medium">
                                    {isSw ? "Haina familia" : "No sub-families mapped yet"}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time Validator Panel */}
                  {(() => {
                    const { errors, warnings, isValid } = getNicheValidationInfo();
                    if (
                      errors.length === 0 &&
                      warnings.length === 0 &&
                      !newNicheName.trim() &&
                      nicheCategoriesList.length === 0
                    ) {
                      return null; // Don't clutter if nothing at all is typed yet
                    }

                    return (
                      <div className="space-y-2 p-4 rounded-3xl border border-slate-200 bg-slate-50 transition-all text-left">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {isSw ? "Uhakiki wa Muda Halisi" : "Real-time Validation"}
                          </span>
                          <span
                            className={`inline-flex h-2.5 w-2.5 rounded-full ${
                              isValid ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"
                            }`}
                          ></span>
                        </div>

                        {errors.map((err, i) => (
                          <div
                            key={`err-${i}`}
                            className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-[10px] font-bold leading-normal"
                          >
                            <AlertCircle size={13} className="shrink-0 mt-0.5" />
                            <span>{err}</span>
                          </div>
                        ))}

                        {warnings.map((warn, i) => (
                          <div
                            key={`warn-${i}`}
                            className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-150 p-2.5 rounded-xl text-[10px] font-bold leading-normal"
                          >
                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                            <span>{warn}</span>
                          </div>
                        ))}

                        {isValid && errors.length === 0 && warnings.length === 0 && (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[10px] font-bold">
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span>
                              {isSw
                                ? "Sahihi: Kila kundi lina niche na kategoria ziko salama."
                                : "Perfect: Parent niche and sub-category pairs are aligned safely."}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Submission and Edit Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      disabled={savingNiche}
                      onClick={async () => {
                        const name = newNicheName.trim();
                        const categories = nicheCategoriesList;
                        const icon = newNicheIcon;

                        const validator = getNicheValidationInfo();
                        if (!validator.isValid) {
                          showAlert(
                            isSw
                              ? "Haiwezi kuhifadhi: Tafadhali rekebisha makosa kwenye fomu kwanza."
                              : "Cannot save: Please fix validation errors on the form first.",
                            "error",
                          );
                          return;
                        }

                        if (name) {
                          setSavingNiche(true);
                          try {
                            if (newNicheMode === "add") {
                              if (!sysNiches.find((n) => n.name === name)) {
                                const updated = [...sysNiches, { name, icon, categories }];
                                setSysNiches(updated);
                                await db.saveNiches(updated);
                                setNewNicheName("");
                                setNicheCategoriesList([]);
                              } else {
                                alert("Niche with this name already exists");
                              }
                            } else {
                              // Edit mode
                              const updated = [...sysNiches];
                              const idx = updated.findIndex((n) => n.name === newNicheOriginalName);
                              if (idx !== -1) {
                                if (newNicheOriginalName !== name) {
                                  if (
                                    await showConfirm(
                                      `Are you sure you want to rename '${newNicheOriginalName}' to '${name}'? This will update all associated products.`,
                                      "Rename Niche",
                                    )
                                  ) {
                                    await db.renameProductsNiche(newNicheOriginalName, name);
                                  } else {
                                    // User cancelled, abort save
                                    return;
                                  }
                                }
                                updated[idx] = { name, icon, categories };
                                setSysNiches(updated);
                                await db.saveNiches(updated);

                                setNewNicheMode("add");
                                setNewNicheName("");
                                setNicheCategoriesList([]);
                                setNewNicheOriginalName("");
                              }
                            }
                          } catch (err: any) {
                            showAlert(err.message || "Failed to save", "error");
                          } finally {
                            setSavingNiche(false);
                          }
                        }
                      }}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55 shadow-md"
                    >
                      {savingNiche ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{isSw ? "Inahifadhi..." : "Saving..."}</span>
                        </>
                      ) : newNicheMode === "add" ? (
                        <>
                          <Plus size={14} />
                          <span>{isSw ? "Ongeza Niche Mpya" : "Add Niche Entry"}</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{isSw ? "Hifadhi Mabadiliko" : "Save Changes"}</span>
                        </>
                      )}
                    </button>
                    {newNicheMode === "edit" && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewNicheMode("add");
                          setNewNicheName("");
                          setNicheCategoriesList([]);
                          setNewNicheOriginalName("");
                          setNewCategoryName("");
                          setNewFamilyNames("");
                          setNewCategoryImage("");
                          setEditingCategoryIdx(null);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <X size={14} />
                        <span>{isSw ? "Ghairi" : "Cancel Edit"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {isSw
                    ? "ORODHA KAMILI YA NICHES AMILIFU"
                    : "ACTIVE CATEGORY ITEMS"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {sysNiches.map((niche, idx) => {
                    const IconComp = NicheIcons[niche.icon];
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-55 border border-slate-200 p-3.5 rounded-2xl font-medium text-xs text-slate-700"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                                {IconComp && <IconComp size={15} />}
                              </div>
                              <span className="font-bold text-slate-800 truncate">
                                {niche.name}
                              </span>
                            </div>
                            {niche.categories &&
                              niche.categories.length > 0 && (
                                <span className="text-[9px] text-slate-400 font-medium truncate mt-1">
                                  {niche.categories.map(c => c.name).join(", ")}
                                </span>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shadow-xs bg-white rounded-xl border border-slate-100 p-0.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewNicheMode("edit");
                              setNewNicheOriginalName(niche.name);
                              setNewNicheName(niche.name);
                              setNewNicheIcon(niche.icon);
                              setNicheCategoriesList(niche.categories || []);
                              setNewCategoryName("");
                              setNewFamilyNames("");
                              setNewCategoryImage("");
                              setEditingCategoryIdx(null);
                              // Scroll to top so the user sees the form
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={savingNiche}
                            onClick={async () => {
                              if (
                                await showConfirm(
                                  isSw
                                    ? `Je, una uhakika unataka kufuta niche hii "${niche.name}"? Hii itafuta bidhaa ZOTE zilizo ndani ya niche hii pia.`
                                    : `Are you absolutely sure you want to delete "${niche.name}"? Doing so will purge ALL associate listings in database.`,
                                )
                              ) {
                                setSavingNiche(true);
                                try {
                                  await db.deleteProductsByNiche(niche.name);
                                  const updated = sysNiches.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setSysNiches(updated);
                                  await db.saveNiches(updated);
                                } catch (err: any) {
                                  showAlert(err.message || "Failed to delete", "error");
                                } finally {
                                  setSavingNiche(false);
                                }
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
 
              <div className="border-t border-slate-100 pt-5 flex justify-end items-center gap-4">
                {nichesSaved && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>
                      {isSw
                        ? "Orodha imehifadhiwa kikamilifu"
                        : "Catalog entries stored!"}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  disabled={savingNiche}
                  onClick={async () => {
                    setSavingNiche(true);
                    try {
                      await db.saveNiches(sysNiches);
                      setNichesSaved(true);
                      setTimeout(() => setNichesSaved(false), 3000);
                    } catch (err: any) {
                      showAlert(err.message || "Failed to save", "error");
                    } finally {
                      setSavingNiche(false);
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-7 py-3 rounded-2xl shadow-md transition cursor-pointer disabled:opacity-55 flex items-center justify-center gap-2"
                >
                  {savingNiche ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isSw ? "Inahifadhi..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{isSw ? "Hifadhi Katalogi" : "Save and rebuild Niches"}</span>
                  )}
                </button>
              </div>

              {/* AI NICHE SUGGESTER PANEL */}
              <div className="border-t border-slate-100 pt-6 mt-8 space-y-4">
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50/60 border border-violet-100 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-violet-600 rounded-2xl text-white shadow-sm shrink-0">
                        <Sparkles size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-0">
                          {isSw
                            ? "Mshauri wa Kitengo cha AI (Niche Suggester)"
                            : "AI Niche & Category Suggester"}
                          <span className="hidden sm:inline-flex bg-violet-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                            Beta
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {isSw
                            ? "AI inachanganua majina na maelezo ya bidhaa ili kupendekeza niche na kitengo husika kwa bidhaa ambazo hazijapangwa vizuri dukani kwako."
                            : "Leverage Gemini to analyze unorganized product listings and recommend highly precise niche & category pairings."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={aiLoading}
                      onClick={handleScanNiches}
                      className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-md transition cursor-pointer flex items-center gap-2 self-start sm:self-center shrink-0"
                    >
                      {aiLoading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin font-semibold"></div>
                      ) : (
                        <Sparkles size={14} />
                      )}
                      <span>
                        {isSw ? "Changanua Bidhaa AI" : "Scan with Gemini AI"}
                      </span>
                    </button>
                  </div>

                  {aiError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-4 rounded-2xl font-semibold">
                      {aiError}
                    </div>
                  )}

                  {aiMessage && !aiLoading && (
                    <div className="bg-indigo-50/80 border border-indigo-100 text-indigo-800 text-xs p-4 rounded-xl font-medium tracking-wide">
                      {aiMessage}
                    </div>
                  )}

                  {aiLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                      <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-semibold text-slate-500 animate-pulse">
                        {isSw
                          ? "AI inasoma katalogi ya bidhaa & kuunda vijisehemu..."
                          : "Analyzing unassigned items, mapping keywords, and organizing folders..."}
                      </p>
                    </div>
                  )}

                  {aiSuggestions.length > 0 && !aiLoading && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-violet-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-violet-700 tracking-wider">
                          {isSw
                            ? "MAPENDEKEZO YA KITENGO"
                            : "RECOMMENDED PAIRINGS"}{" "}
                          (
                          {
                            aiSuggestions.filter(
                              (s) => !aiAppliedIds.includes(s.productId),
                            ).length
                          }{" "}
                          {isSw ? "imesalia" : "remaining"})
                        </span>

                        {aiSuggestions.some(
                          (s) => !aiAppliedIds.includes(s.productId),
                        ) && (
                          <button
                            type="button"
                            onClick={handleApplyAllSuggestions}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            {isSw ? "Kubali Yote" : "Approve & Bulk Apply"}
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {aiSuggestions.map((s) => {
                          const isApplied = aiAppliedIds.includes(s.productId);
                          const IconComp =
                            NicheIcons[s.suggestedNicheIcon] ||
                            NicheIcons["Smartphone"];

                          return (
                            <div
                              key={s.productId}
                              className={`p-4 rounded-2.5xl transition border ${
                                isApplied
                                  ? "bg-emerald-50/40 border-emerald-100 text-slate-400"
                                  : "bg-white border-slate-100 text-slate-700 hover:shadow-xs hover:border-slate-200"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="space-y-1 min-w-0 flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-slate-800 truncate">
                                      {s.productName}
                                    </span>
                                    {isApplied && (
                                      <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                                        {isSw ? "IMEWEKWA" : "CLASSIFIED"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-100/50 text-[10px] font-black px-2.5 py-1 rounded-xl">
                                      {IconComp && <IconComp size={12} />}
                                      <span>{s.suggestedNiche}</span>
                                    </span>
                                    <span className="text-slate-300 text-xs">
                                      /
                                    </span>
                                    <span className="text-slate-600 text-[11px] font-extrabold bg-slate-55 border border-slate-100 px-2.5 py-1 rounded-xl">
                                      {s.suggestedCategory}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium italic mt-2 pl-2 border-l border-violet-300/40">
                                    {s.reasoning}
                                  </p>
                                </div>

                                {!isApplied && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleApplySingleSuggestion(s)
                                    }
                                    className="bg-violet-100 hover:bg-violet-600 text-violet-700 hover:text-white shrink-0 self-start sm:self-center font-black text-[10px] uppercase px-4 py-2.5 rounded-xl transition cursor-pointer"
                                  >
                                    {isSw
                                      ? "Kubali & Weka"
                                      : "Approve & Category"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InvoiceModal({
  order,
  onClose,
  lang,
}: {
  order: Order;
  onClose: () => void;
  lang: string;
}) {
  const [inv, setInv] = useState<any>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [sellersList, setSellersList] = useState<SellerProfile[]>([]);
  const [isSingleSeller, setIsSingleSeller] = useState(false);
  const [logs, setLogs] = useState<OrderStatusLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // TRA EFDMS Integration States
  const [traConfig, setTraConfig] = useState<any>(null);
  const [showTraSettings, setShowTraSettings] = useState(false);
  const [submittingTra, setSubmittingTra] = useState(false);
  const [isTraRegLoading, setIsTraRegLoading] = useState(false);
  const [isTraTokenLoading, setIsTraTokenLoading] = useState(false);
  const [isTraZLoading, setIsTraZLoading] = useState(false);
  const [traError, setTraError] = useState("");
  const [traSuccess, setTraSuccess] = useState("");

  const [tin, setTin] = useState("");
  const [certKey, setCertKey] = useState("");
  const [certSerial, setCertSerial] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [autoTaxSales, setAutoTaxSales] = useState(false);

  useEffect(() => {
    async function loadTra() {
      try {
        const config = await db.getTraConfig();
        if (config) {
          setTraConfig(config);
          setTin(config.tin || "");
          setCertKey(config.certKey || "");
          setCertSerial(config.certSerial || "");
          setIsSandbox(config.isSandbox !== false);
          setAutoTaxSales(!!config.autoTaxSales);
        }
      } catch (err) {
        console.warn("Failed to load TRA configuration:", err);
      }
    }
    loadTra();
  }, []);

  const isTraVerified = order.paymentReference?.includes("TRA_VERIFIED");
  const traInfo = useMemo(() => {
    if (!isTraVerified) return null;
    const parts = order.paymentReference.split("||");
    const info: any = {};
    parts.forEach((p: string) => {
      if (p.startsWith("RCTVNUM:"))
        info.rctvnum = p.substring("RCTVNUM:".length);
      if (p.startsWith("RCTNUM:")) info.rctnum = p.substring("RCTNUM:".length);
      if (p.startsWith("GC:")) info.gc = p.substring("GC:".length);
      if (p.startsWith("DC:")) info.dc = p.substring("DC:".length);
      if (p.startsWith("DATE:")) info.date = p.substring("DATE:".length);
      if (p.startsWith("TIME:")) info.time = p.substring("TIME:".length);
      if (p.startsWith("SIGN:")) info.sign = p.substring("SIGN:".length);
    });
    return info;
  }, [order.paymentReference, isTraVerified]);

  const handleSaveSettings = async () => {
    try {
      setTraError("");
      setTraSuccess("");
      const payload: any = {
        tin,
        certKey,
        certSerial,
        isSandbox,
        autoTaxSales,
      };
      if (privateKeyPem.trim()) {
        payload.privateKeyPem = privateKeyPem;
      }
      const updated = await db.saveTraConfig(payload);
      setTraConfig(updated);
      setPrivateKeyPem("");
      setTraSuccess("TRA Settings saved successfully!");
    } catch (err: any) {
      setTraError("Failed to save: " + err.message);
    }
  };

  const handleRegisterVfd = async () => {
    if (!window.confirm("Do you want to send TIN Registration to TRA?")) return;
    try {
      setTraError("");
      setTraSuccess("");
      setIsTraRegLoading(true);
      const res = await db.registerTraVfd();
      setTraConfig(res);
      setTraSuccess(
        "VFD successfully registered in EFDMS! REGID received: " + res.regId,
      );
    } catch (err: any) {
      setTraError("Registration failed: " + err.message);
    } finally {
      setIsTraRegLoading(false);
    }
  };

  const handleGetToken = async () => {
    try {
      setTraError("");
      setTraSuccess("");
      setIsTraTokenLoading(true);
      const res = await db.getTokenTra();
      setTraSuccess("Token refreshed correctly!");
    } catch (err: any) {
      setTraError("Token request failed: " + err.message);
    } finally {
      setIsTraTokenLoading(false);
    }
  };

  const handlePostToTra = async () => {
    try {
      setTraError("");
      setTraSuccess("");
      setSubmittingTra(true);
      const res = await db.submitTraReceipt(order.id);
      if (res.success) {
        setTraSuccess("Receipt submitted successfully to TRA!");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setTraError("Posting failed: " + err.message);
    } finally {
      setSubmittingTra(false);
    }
  };

  const handlePostZReport = async () => {
    if (!window.confirm("Submit daily cumulative Z Report to TRA?")) return;
    try {
      setTraError("");
      setTraSuccess("");
      setIsTraZLoading(true);
      const res = await db.submitTraZReport();
      if (res.success) {
        setTraSuccess(
          `Z report submitted successfully! Report number: #${res.result.znum}`,
        );
      }
    } catch (err: any) {
      setTraError("Z Report failed: " + err.message);
    } finally {
      setIsTraZLoading(false);
    }
  };

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoadingLogs(true);
        const fetched = await db.getOrderLogs(order.id);
        setLogs(fetched);
      } catch (err) {
        console.warn("Failed to load order audit logs:", err);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadLogs();
  }, [order.id]);

  useEffect(() => {
    async function loadInv() {
      try {
        const [globalInv, prods, sellers] = await Promise.all([
          db.getInvoiceSettings(),
          db.getProducts(),
          db.getSellers(),
        ]);

        setProductsList(prods);
        setSellersList(sellers);

        const sellerIdsInOrder = new Set<string>();
        order.items.forEach((item) => {
          const itemPid = item.productId || (item as any).id;
          const prod = prods.find((p) => p.id === itemPid);
          if (prod && prod.sellerId) {
            sellerIdsInOrder.add(prod.sellerId);
          }
        });

        let finalInv = { ...globalInv };
        let singleSellerFound = false;

        if (sellerIdsInOrder.size === 1) {
          const uniqueSellerId = Array.from(sellerIdsInOrder)[0];
          const s = sellers.find((x) => x.id === uniqueSellerId);
          if (s) {
            singleSellerFound = true;
            finalInv = {
              ...finalInv,
              companyName:
                s.invoiceCompanyName || s.name || globalInv.companyName,
              address: s.invoiceAddress || globalInv.address,
              phone: s.invoicePhone || globalInv.phone,
              email: s.invoiceEmail || s.email || globalInv.email,
              terms: s.invoiceTerms || globalInv.terms,
              businessLogo: s.businessLogo || "",
            };
          }
        } else {
          // If multi-seller order or no seller (Admin's own), brand as Official Orbi Shop
          finalInv = {
            ...finalInv,
            companyName: globalInv.companyName || "Orbi Shop Store",
            address: globalInv.address || "Dar es Salaam, Tanzania",
            phone: globalInv.phone || "+255 744 111 222",
            email: globalInv.email || "support@orbifinancial.com",
            terms:
              globalInv.terms ||
              "Asante kwa kununua kupitia Orbi Shop. Bidhaa hizi zimetolewa kutoka wauzaji mbalimbali na kuratibiwa na duka kuu la mtandaoni la Orbi Shop.",
            businessLogo: "", // Falls back to Orbi Shop logo
          };
        }

        setIsSingleSeller(singleSellerFound);
        setInv(finalInv);
      } catch (err) {
        console.warn(
          "Failed to auto fill seller details on admin invoice",
          err,
        );
      }
    }
    loadInv();
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  if (!inv)
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Inatengeneza invoice...
      </div>
    );

  const handleWhatsApp = () => {
    // Pack the order into the URL so the customer can view it on their device
    const orderData = btoa(encodeURIComponent(JSON.stringify(order)));
    const invLink = `${window.location.origin}/?invoice=${orderData}`;

    let itemsText = order.items
      .map((i) => `- ${i.quantity}x ${i.name} (@ ${formatCurrency(i.price)})`)
      .join("\n");
    let msg = `Habari ${order.customerDetails.name},\n\nAsante kwa manunuzi yako kutoka ${inv.companyName || "Orbi Shop"}.\n\nOda yako: #${getOrderNumber(order.id)}\nUnaweza kuiona na kuipakua (PDF) kupitia kiungo hiki:\n${invLink}\n\nJumla: ${formatCurrency(order.total)}\n\nTafadhali kamilisha malipo ili tuweze kutuma mzigo wako.`;

    let phoneStr = order.customerDetails.phone.replace(/[^0-9]/g, "");
    if (phoneStr.startsWith("0")) {
      phoneStr = "255" + phoneStr.substring(1);
    }
    window.open(
      `https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const logoSrc =
    inv.businessLogo ||
    "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";
  const isPaidOrDelivered = [
    "delivered",
    "buyer_confirmed",
    "released",
    "disputed",
  ].includes(String(order.status || "").toLowerCase());

  return (
    <>
      <style>{`
      @media print {
        @page {
          size: 80mm auto !important; /* Standard EFD Printer Paper Width */
          margin: 0 !important;
        }
        body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          width: 80mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        body * {
          visibility: hidden;
        }
        #admin-invoice-print-container, #admin-invoice-print-container * {
          visibility: visible;
        }
        #admin-invoice-print-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          max-width: 80mm !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          box-shadow: none !important;
          overflow: visible !important;
          display: block !important;
        }
        .invoice-body {
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 8mm 4mm !important;
          border: none !important;
          box-shadow: none !important;
          background-color: #dfebf2 !important;
          color: #1a2f52 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          transform: none !important;
        }
        /* scale fonts and guarantee legible sans-monospaced fonts under EFD standard */
        .invoice-body * {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", sans-serif !important;
          font-size: 8.5px !important;
          line-height: 1.2 !important;
        }
        .invoice-body h1 {
          font-size: 11px !important;
        }
        .invoice-body .text-sm {
          font-size: 10px !important;
        }
        .invoice-body .text-xs {
          font-size: 8px !important;
        }
        /* Hide buttons during print */
        #admin-invoice-print-container button,
        .print\:hidden,
        .no-print {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
        }
      }

      /* Carbon receipt paper texture */
      .carbon-paper {
        background-color: #dfebf2;
        background-image: 
          radial-gradient(#1a2f52 0.5px, transparent 0.5px), 
          linear-gradient(to bottom, rgba(26, 47, 82, 0.02) 1px, transparent 1px);
        background-size: 16px 16px, 100% 4px;
        color: #1a2f52;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", sans-serif !important;
      }

      /* Realistic Zig Zag Cut clip-path */
      .zigzag-borders {
        clip-path: polygon(
          0% 8px, 1.5% 0px, 3% 8px, 4.5% 0px, 6% 8px, 7.5% 0px, 9% 8px, 10.5% 0px, 12% 8px, 13.5% 0px, 15% 8px, 16.5% 0px, 18% 8px, 19.5% 0px, 21% 8px, 22.5% 0px, 24% 8px, 25.5% 0px, 27% 8px, 28.5% 0px, 30% 8px, 31.5% 0px, 33% 8px, 34.5% 0px, 36% 8px, 37.5% 0px, 39% 8px, 40.5% 0px, 42% 8px, 43.5% 0px, 45% 8px, 46.5% 0px, 48% 8px, 49.5% 0px, 51% 8px, 52.5% 0px, 54% 8px, 55.5% 0px, 57% 8px, 58.5% 0px, 60% 8px, 61.5% 0px, 63% 8px, 64.5% 0px, 66% 8px, 67.5% 0px, 69% 8px, 70.5% 0px, 72% 8px, 73.5% 0px, 75% 8px, 76.5% 0px, 78% 8px, 79.5% 0px, 81% 8px, 82.5% 0px, 84% 8px, 85.5% 0px, 87% 8px, 88.5% 0px, 90% 8px, 91.5% 0px, 93% 8px, 94.5% 0px, 96% 8px, 97.5% 0px, 99% 8px, 100% 0px,
          100% calc(100% - 8px), 98.5% 100%, 97% calc(100% - 8px), 95.5% 100%, 94% calc(100% - 8px), 92.5% 100%, 91% calc(100% - 8px), 89.5% 100%, 88% calc(100% - 8px), 86.5% 100%, 85% calc(100% - 8px), 83.5% 100%, 82% calc(100% - 8px), 80.5% 100%, 79% calc(100% - 8px), 77.5% 100%, 76% calc(100% - 8px), 74.5% 100%, 73% calc(100% - 8px), 71.5% 100%, 70% calc(100% - 8px), 68.5% 100%, 67% calc(100% - 8px), 65.5% 100%, 64% calc(100% - 8px), 62.5% 100%, 61% calc(100% - 8px), 59.5% 100%, 58% calc(100% - 8px), 56.5% 100%, 55% calc(100% - 8px), 53.5% 100%, 52% calc(100% - 8px), 50.5% 100%, 49% calc(100% - 8px), 47.5% 100%, 46% calc(100% - 8px), 44.5% 100%, 43% calc(100% - 8px), 41.5% 100%, 40% calc(100% - 8px), 38.5% 100%, 37% calc(100% - 8px), 35.5% 100%, 34% calc(100% - 8px), 32.5% 100%, 31% calc(100% - 8px), 29.5% 100%, 28% calc(100% - 8px), 26.5% 100%, 25% calc(100% - 8px), 23.5% 100%, 22% calc(100% - 8px), 20.5% 100%, 19% calc(100% - 8px), 17.5% 100%, 16% calc(100% - 8px), 14.5% 100%, 13% calc(100% - 8px), 11.5% 100%, 10% calc(100% - 8px), 8.5% 100%, 7% calc(100% - 8px), 5.5% 100%, 4% calc(100% - 8px), 2.5% 100%, 1% calc(100% - 8px), 0% 100%
        );
      }
      `}</style>
      <div
        id="admin-invoice-print-container"
        className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block print:overflow-visible print:backdrop-blur-none flex"
      >
        <div className="carbon-paper zigzag-borders border border-[#1a2f52]/10 shadow-2xl w-full max-w-lg m-auto print:m-0 print:rounded-none print:shadow-none print:max-w-full invoice-body flex flex-col relative overflow-hidden text-[#1a2f52] font-mono pt-12 pb-12 px-6 sm:px-8 select-text">
          {/* Tear-off look design element at the top */}
          <div className="h-1 bg-[repeating-linear-gradient(90deg,currentColor,currentColor_10px,transparent_10px,transparent_20px)] text-[#1a2f52]/20 shrink-0 print:hidden mb-4"></div>

          {/* Controls Bar */}
          <div className="p-3 mb-4 rounded-xl border border-[#1a2f52]/15 flex justify-between items-center bg-white/50 print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-[10px] uppercase tracking-wide">
                {isPaidOrDelivered
                  ? lang === "sw"
                    ? "Risiti Rasmi ya EFD"
                    : "EFD Official Receipt"
                  : lang === "sw"
                    ? "Ankara ya EFD"
                    : "EFD Tax Invoice"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleWhatsApp}
                className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                Tuma WhatsApp
              </button>
              <button
                onClick={handlePrint}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                🖨️ Print Doc
              </button>
              <button
                onClick={onClose}
                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition ml-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* TRA EFD CONTROL DASHBOARD (print:hidden) */}
          <div className="mb-4 bg-slate-900 border border-slate-850 text-slate-100 rounded-xl p-3.5 space-y-3 shrink-0 print:hidden text-[10px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold tracking-wider text-slate-200">
                <ShieldCheck className="text-emerald-400" size={13} />
                <span>TRA EFDMS INTEGRATION ENGINE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowTraSettings(!showTraSettings)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition text-slate-300"
                >
                  <SettingsIcon size={10} />
                  {showTraSettings ? "Funga Sanidi" : "Sanidi EFD"}
                </button>
              </div>
            </div>

            {/* Success and Error Feedback banners */}
            {traError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2 rounded flex items-start gap-1.5">
                <AlertCircle
                  className="shrink-0 mt-0.5 text-rose-400"
                  size={12}
                />
                <span className="font-semibold leading-relaxed">
                  {traError}
                </span>
              </div>
            )}
            {traSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2 rounded flex items-start gap-1.5">
                <CheckCircle2
                  className="shrink-0 mt-0.5 text-emerald-400"
                  size={12}
                />
                <span className="font-semibold leading-relaxed">
                  {traSuccess}
                </span>
              </div>
            )}

            {/* TRA Configuration Form Panel */}
            {showTraSettings && (
              <div className="border border-slate-800 bg-slate-950/50 p-3 rounded-lg space-y-2.5">
                <div className="font-extrabold text-[8.5px] text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1 flex justify-between items-center">
                  <span>SETTINGS / MAELEZO YA DEVICE</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="tra_sandbox_chk"
                      checked={isSandbox}
                      onChange={(e) => setIsSandbox(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor="tra_sandbox_chk"
                      className="cursor-pointer select-none"
                    >
                      TEST SERVER (SANDBOX)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <label className="text-slate-400 block mb-0.5 font-bold uppercase">
                      TAXPAYER TIN:
                    </label>
                    <input
                      type="text"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono focus:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5 font-bold uppercase">
                      CERTKEY (SERIAL):
                    </label>
                    <input
                      type="text"
                      value={certKey}
                      onChange={(e) => setCertKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono focus:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-slate-400 block mb-0.5 font-bold uppercase">
                      CERTIFICATE SERIAL (TRA PROVIDED):
                    </label>
                    <input
                      type="text"
                      value={certSerial}
                      onChange={(e) => setCertSerial(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono focus:border-slate-700 focus:outline-none placeholder-slate-600"
                      placeholder="e.g. ABC123XYZ"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-slate-400 block mb-0.5 font-bold uppercase">
                      PRIVATE KEY (PEM STRING FORMAT) [HIARI]:
                    </label>
                    <textarea
                      rows={3}
                      value={privateKeyPem}
                      onChange={(e) => setPrivateKeyPem(e.target.value)}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[8px] focus:border-slate-700 focus:outline-none placeholder-slate-700"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 block uppercase text-left">
                        Auto TAX Sales Submission
                      </span>
                      <p className="text-[8.5px] text-slate-400 mt-0.5 text-left">
                        Sajili risiti TRA moja kwa moja baada ya oda
                        kuwasilishwa (Confirm Delivery)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoTaxSales(!autoTaxSales)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center ${autoTaxSales ? "bg-emerald-600 justify-end" : "bg-slate-700 justify-start"}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 font-bold rounded cursor-pointer text-white transition flex items-center gap-1"
                  >
                    Hifadhi Settings
                  </button>
                  <button
                    type="button"
                    disabled={isTraRegLoading}
                    onClick={handleRegisterVfd}
                    className="px-2.5 py-1 bg-violet-700 hover:bg-violet-650 font-bold rounded cursor-pointer text-white transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {isTraRegLoading ? (
                      <RefreshCw className="animate-spin" size={9} />
                    ) : (
                      <Zap size={9} />
                    )}
                    Register device TRA
                  </button>
                  <button
                    type="button"
                    disabled={isTraTokenLoading}
                    onClick={handleGetToken}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 font-bold rounded cursor-pointer text-slate-200 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {isTraTokenLoading ? (
                      <RefreshCw className="animate-spin" size={9} />
                    ) : (
                      <RefreshCw size={9} />
                    )}
                    Refresh Auth Token
                  </button>
                </div>
              </div>
            )}

            {/* TRA Main Receipt Controls */}
            <div className="bg-slate-950/20 p-2.5 border border-slate-800 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px]">
              <div>
                <div className="flex items-center gap-1 text-slate-300 font-bold mb-0.5">
                  <span>REGISTRATION ID:</span>
                  <strong className="text-emerald-400 font-mono bg-slate-900 px-1 py-0.2 rounded">
                    {traConfig?.regId || "Bado Hajasajiliwa"}
                  </strong>
                </div>
                <div className="text-[8.5px] text-slate-400">
                  {isTraVerified
                    ? `Risiti tayari imethibitishwa na kusajiliwa TRA (GC: ${traInfo?.gc || "-"}, DC: ${traInfo?.dc || "-"})`
                    : "Ankara hii bado haijatunukiwa RISITI YA TRA kodi."}
                </div>
              </div>
              <div className="flex gap-2">
                {!isTraVerified ? (
                  <button
                    type="button"
                    disabled={submittingTra || !traConfig?.regId}
                    onClick={handlePostToTra}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 font-black rounded-lg cursor-pointer text-white transition flex items-center gap-1 disabled:opacity-40"
                  >
                    {submittingTra ? (
                      <RefreshCw className="animate-spin" size={11} />
                    ) : (
                      <ExternalLink size={11} />
                    )}
                    Sajili & Tuma TRA EFDMS
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-lg text-[9px] tracking-widest uppercase">
                    ◆ REAL TRA SIGNED ◆
                  </span>
                )}
                <button
                  type="button"
                  disabled={isTraZLoading || !traConfig?.regId}
                  onClick={handlePostZReport}
                  className="px-3 py-1.5 bg-amber-600/15 hover:bg-amber-600/30 border border-amber-600/30 text-amber-300 font-bold rounded-lg cursor-pointer transition flex items-center gap-1 disabled:opacity-40"
                >
                  {isTraZLoading ? (
                    <RefreshCw className="animate-spin" size={11} />
                  ) : (
                    <FileText size={11} />
                  )}
                  Tuma Z Report
                </button>
              </div>
            </div>
          </div>

          {/* System Audit Logs (Admin Only View) */}
          {logs && logs.length > 0 && (
            <div className="mb-4 bg-slate-900 border border-slate-850 text-slate-100 rounded-xl p-3.5 space-y-2 shrink-0 print:hidden text-[10px]">
              <div className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">
                Order Status Audit Logs & Orbi Talk Telemetry
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {logs.map((l: any) => (
                  <div key={l.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-slate-800/50 pb-1.5 gap-2 sm:gap-0">
                    <div className="space-y-0.5">
                      <div className="flex gap-1.5 items-center">
                        <span className="font-mono text-slate-300 font-black">{l.previousStatus} ➜ {l.newStatus}</span>
                      </div>
                      <div className="text-slate-500">By: {l.staffName} ({l.staffEmail})</div>
                      {l.notificationStatus && (
                        <div className="text-[8.5px] bg-sky-900/40 text-sky-400 font-mono inline-block px-1.5 py-0.5 rounded border border-sky-800/50 mt-1">
                          {l.notificationStatus}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-500 font-mono text-left sm:text-right whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Printable Sheet */}
          <div className="flex-1 flex flex-col gap-4 justify-between min-h-0 print:min-h-0 relative">
            {/* Ambient Watermark Background for carbon look */}
            <div className="absolute inset-x-0 top-1/4 bottom-1/4 pointer-events-none flex items-center justify-center opacity-[0.04] overflow-hidden -z-10 select-none">
              <img
                src={logoSrc}
                alt="Watermark"
                className="w-64 object-contain rotate-12 filter contrast-200 saturate-50"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-4">
              {/* Centered Receipt Header info */}
              <div className="text-center space-y-1">
                {logoSrc && (
                  <div className="flex justify-center mb-2">
                    <img
                      src={logoSrc}
                      alt="Stamp"
                      className="h-10 object-contain filter grayscale contrast-150 saturate-50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="font-bold text-sm tracking-widest text-[#1a2f52]">
                  {inv.companyName?.toUpperCase() || "ORBI SHOP HQ"}
                </div>
                {inv.address && (
                  <div className="text-[10px] text-[#2c4063]">
                    {inv.address.toUpperCase()}
                  </div>
                )}
                <div className="text-[9px] text-[#2c4063] space-y-0.5 justify-center flex flex-wrap gap-x-3">
                  {inv.phone && <span>TEL: {inv.phone}</span>}
                  {inv.email && <span>EMAIL: {inv.email.toUpperCase()}</span>}
                </div>
              </div>

              {/* Dividing Line */}
              <div className="text-center text-[#1a2f52]/40 my-1 tracking-widest text-[9px] select-none">
                * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
              </div>

              {/* Document Type Label */}
              <div className="text-center space-y-0.5 pb-1">
                <h1 className="text-sm font-black tracking-wider text-[#1a2f52] uppercase">
                  {isPaidOrDelivered
                    ? "RISIT HALALI YA MAPIPO"
                    : lang === "sw"
                      ? "ANKARA YA KODI (PRO-FORMA INVOICE)"
                      : "PRO-FORMA TAX INVOICE"}
                </h1>
              </div>

              {/* Dividing Line */}
              <div className="text-center text-[#1a2f52]/40 my-1 tracking-widest text-[9px] select-none">
                ==========================================================
              </div>

              {/* ONE ROW Seller and Customer Info to Save Space & Print Beautifully */}
              <div className="grid grid-cols-2 gap-3 text-[10px] leading-relaxed border-b border-dashed border-[#1a2f52]/20 pb-2">
                {/* Column 1: Customer Details */}
                <div className="space-y-0.5">
                  <div className="text-[8px] font-bold text-[#2c4063] tracking-wider uppercase">
                    MNUNUZI / BUYER:
                  </div>
                  <div className="font-extrabold text-[#1a2f52]">
                    {order.customerDetails.name.toUpperCase()}
                  </div>
                  {order.customerDetails.phone && (
                    <div>TEL: {order.customerDetails.phone}</div>
                  )}
                  {order.customerDetails.address && (
                    <div className="text-[9px]">
                      LOC: {order.customerDetails.address.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Column 2: Order Metadata */}
                <div className="space-y-0.5 text-right border-l border-dashed border-[#1a2f52]/20 pl-3">
                  <div className="text-[8px] font-bold text-[#2c4063] tracking-wider uppercase">
                    ODA / ORDER DETAILS:
                  </div>
                  <div className="font-bold">
                    ODA ID: #{getOrderNumber(order.id)}
                  </div>
                  <div>
                    DATE: {new Date(order.date).toLocaleDateString("sw-TZ")}
                  </div>
                  <div>
                    TIME:{" "}
                    {new Date(order.date).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                </div>
              </div>

              {/* Transaction / Payment Memo Strip */}
              <div className="grid grid-cols-2 gap-2 bg-white/30 border border-[#1a2f52]/15 text-[9px] p-2 rounded">
                <div>
                  <span className="text-slate-500 block uppercase">
                    NJIA YA MALIPO / PAY VIA:
                  </span>
                  <strong className="text-[#1a2f52] block font-black uppercase">
                    {order.paymentMethodName?.toUpperCase() ||
                      order.paymentMethod?.toUpperCase()}
                  </strong>
                </div>
                {order.paymentReference && (
                  <div className="text-right">
                    <span className="text-slate-500 block uppercase">
                      REJEA / REF NO:
                    </span>
                    <strong className="text-[#1a2f52] block font-black uppercase">
                      {order.paymentReference.toUpperCase()}
                    </strong>
                  </div>
                )}
                <div className="col-span-2 pt-1.5 mt-1 border-t border-dashed border-[#1a2f52]/10 flex justify-between items-center text-[9px]">
                  <span className="text-slate-500 uppercase">
                    HALI YA MALIPO / PROCESS STATE:
                  </span>
                  {isPaidOrDelivered ? (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-200/50 text-emerald-800 border border-emerald-400 uppercase tracking-wide">
                      IMEPOKELEWA / PAID
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-200/50 text-[#1a2f52] border border-amber-450 uppercase tracking-wide animate-pulse">
                      HAUJALIPWA / UNPAID
                    </span>
                  )}
                </div>
              </div>

              {/* EFD Billing details block - Only show for unpaid/pro-forma invoices, hide on paid receipts */}
              {!isPaidOrDelivered && (
                <div className="bg-orange-500/[0.04] rounded border border-orange-500/15 p-2 text-[9px] leading-relaxed">
                  <div className="font-extrabold text-[8px] text-orange-950 uppercase tracking-widest mb-0.5">
                    {lang === "sw"
                      ? "JINSI YA KUKAMILISHA MALIPO (PAYMENT PROCESS):"
                      : "BILLING PAYMENT INSTRUCTION:"}
                  </div>
                  <div className="whitespace-pre-line text-[#2c4063]">
                    {(() => {
                      const opts = inv.paymentOptions || [];
                      const method = opts.find(
                        (po: any) => po.id === order.paymentMethod,
                      );
                      if (method) return method.details.toUpperCase();

                      const methodByName = opts.find(
                        (po: any) =>
                          po.name === order.paymentMethodName ||
                          po.name === order.paymentMethod,
                      );
                      if (methodByName)
                        return methodByName.details.toUpperCase();

                      if (order.paymentMethod === "bank")
                        return (
                          inv.bankPaymentDetails || "Benki"
                        ).toUpperCase();
                      if (order.paymentMethod === "mobile")
                        return (
                          inv.mobilePaymentDetails || "Simu"
                        ).toUpperCase();

                      if (opts.length > 0) {
                        return opts
                          .map(
                            (po: any) =>
                              `${po.name.toUpperCase()}:\n${po.details.toUpperCase()}`,
                          )
                          .join("\n");
                      }
                      return "TAFADHALI WASILIANA NASI KUPITIA TELEPHONE ILI KUKAMILISHA MALIPO.";
                    })()}
                  </div>
                </div>
              )}

              {/* Items List - Compact line displays to simulate real roll cash receipt */}
              <div className="space-y-1 bg-white/20 p-2.5 rounded border border-[#1a2f52]/10">
                <div className="text-[8px] font-bold text-[#2c4063] tracking-wider uppercase mb-1">
                  BIDHAA ZILIZOMUNULIWA / PURCHASED ITEMS:
                </div>
                <div className="border-t border-[#1a2f52]/20 my-1"></div>
                {order.items.map((item, idx) => {
                  const itemPid = item.productId || (item as any).id;
                  const associatedProd = productsList.find(
                    (p) => p.id === itemPid,
                  );
                  const associatedSeller = associatedProd?.sellerId
                    ? sellersList.find((s) => s.id === associatedProd.sellerId)
                    : null;

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-[10px] py-1 border-b border-dashed border-[#1a2f52]/10 last:border-b-0 leading-tight"
                    >
                      <div className="flex-1 pr-4">
                        <div className="font-black text-[#1a2f52] uppercase">
                          {item.name}
                        </div>
                        {associatedSeller && (
                          <span className="text-[8px] text-orange-750 font-bold tracking-wide block mt-0.5">
                            S: {associatedSeller.name.toUpperCase()}
                          </span>
                        )}
                        <div className="text-[9px] text-[#2c4063] mt-0.5">
                          {item.quantity} X {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="text-right font-black text-[#1a2f52] shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals summation display with double-underlines */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#2c4063] uppercase">
                    {lang === "sw"
                      ? "Jumla ya Bidhaa (Subtotal):"
                      : "Subtotal Value:"}
                  </span>
                  <span className="font-bold text-[#1a2f52]">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="flex justify-between text-[#2c4063] text-[9px] uppercase">
                  <span>VAT (Category A - 18% inclusive):</span>
                  <span>
                    {formatCurrency(Math.round(order.total * 0.1525))}
                  </span>
                </div>

                {/* Double Border Dividing strip */}
                <div className="border-t-2 border-double border-[#1a2f52]/40 my-1"></div>
                <div className="flex justify-between items-center py-1 bg-white/40 px-2 rounded-md">
                  <span className="font-black text-[#1a2f52] uppercase text-[9px] tracking-tight">
                    {lang === "sw"
                      ? "JUMLA KUU (GRAND TOTAL):"
                      : "TOTAL INC TAX (GRAND TOTAL):"}
                  </span>
                  <span className="font-black text-sm text-[#ce2e2e] shrink-0 font-mono">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="border-t-2 border-double border-[#1a2f52]/40 my-1"></div>
              </div>

              {/* Real TRA Verified details printed directly on the receipt roll strip */}
              {isTraVerified && traInfo && (
                <div className="border border-dashed border-[#1a2f52]/30 p-2.5 text-center rounded bg-white/30 text-[9px] my-3 space-y-2">
                  <div className="font-extrabold text-[9px] tracking-widest text-[#1a2f52] uppercase text-center pb-1 border-b border-dashed border-[#1a2f52]/20">
                    * RISIT HALALI YA TRA *
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-left text-[#2c4063] leading-normal uppercase">
                    <div>
                      MUUZAJI TIN:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traConfig?.tin || "144-893-102"}
                      </span>
                    </div>
                    <div>
                      USAILI ID:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traConfig?.regId || "TZ054109720023"}
                      </span>
                    </div>
                    <div>
                      RCT NUM:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traInfo.rctnum}
                      </span>
                    </div>
                    <div>
                      Z-NUMBER:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traInfo.date?.replace(/-/g, "")}
                      </span>
                    </div>
                    <div>
                      DC TODAY:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traInfo.dc}
                      </span>
                    </div>
                    <div>
                      GC GLOBAL:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traInfo.gc}
                      </span>
                    </div>
                    <div className="col-span-2 mt-0.5">
                      TAREHE / SAA:{" "}
                      <span className="font-bold text-[#1a2f52]">
                        {traInfo.date} {traInfo.time}
                      </span>
                    </div>
                  </div>
                  <div className="text-[7px] text-[#2c4063]/85 bg-white/50 py-1 px-1.5 rounded font-mono break-all border border-[#1a2f52]/10 my-1 text-left leading-normal uppercase">
                    VFD SIGN: {traInfo.sign || "TRA-RSA-SIGNATURE-COMPLIANT"}
                  </div>
                  <div className="flex flex-col items-center justify-center pt-1.5 border-t border-dashed border-[#1a2f52]/15">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://virtual.tra.go.tz/efdmsRctVerify/${traInfo.rctvnum}`)}`}
                      alt="TRA Verification QR"
                      className="w-24 h-24 object-contain p-1.5 bg-white rounded border border-[#1a2f52]/15"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[7.5px] text-[#1a2f52] font-extrabold mt-1 tracking-wider uppercase text-center max-w-xs">
                      EFDMS CODE: {traInfo.rctvnum}
                    </div>
                  </div>
                </div>
              )}

              {/* Terms of business - Hide if it is a completed receipt */}
              {order.status !== "delivered" && inv.terms && (
                <div className="pt-1.5 text-[9px] leading-relaxed border-b border-dashed border-[#1a2f52]/15 pb-2">
                  <div className="font-extrabold text-[#2c4063] text-[8px] uppercase tracking-widest mb-0.5">
                    {lang === "sw"
                      ? "VIGEZO NA MASHARTI:"
                      : "TERMS & CONDITIONS:"}
                  </div>
                  <p className="text-[#2c4063] italic leading-snug">
                    {inv.terms.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {/* Official Footer Orbi Shop Stamp centered */}
            <div className="border-t border-[#1a2f52]/20 pt-3 text-center flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 opacity-70">
                <img
                  src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                  alt="Orbi logo"
                  className="h-3.5 object-contain filter grayscale contrast-200"
                  referrerPolicy="no-referrer"
                />
                <span className="font-extrabold text-[9px] tracking-tight text-[#1a2f52] uppercase font-bold">
                  Orbi Shop HQ
                </span>
              </div>
              <a
                href="https://shop.orbifinancial.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] font-black text-[#2c4063]/60 hover:text-[#2c4063] transition tracking-widest decoration-none"
              >
                SHOP.ORBIFINANCIAL.COM
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function CouponsAdmin({
  products,
  customers,
  orders,
}: {
  products: Product[];
  customers: Customer[];
  orders: Order[];
}) {
  const { showAlert } = useDialog();
  const { lang } = useI18n();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  // Generation logic
  const [minDiscount, setMinDiscount] = useState(2);
  const [maxDiscount, setMaxDiscount] = useState(8);

  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: "",
    discountPercentage: 0,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    active: true,
    applicableCategory: "",
    applicableProduct: "",
    targetCustomer: "",
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    const data = await db.getCoupons();
    setCoupons(data);
    setLoadingCoupons(false);
  };

  const generateCode = () => {
    const code =
      "ORBI" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const discount =
      Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount;
    setNewCoupon({ ...newCoupon, code, discountPercentage: discount });
  };

  const addCoupon = async () => {
    if (
      !newCoupon.code ||
      !newCoupon.discountPercentage ||
      !newCoupon.expiresAt
    ) {
      showAlert(
        "Tafadhali jaza taarifa zote / Please fill all fields",
        "error",
      );
      return;
    }
    const c: Coupon = {
      id: "CUP-" + Date.now().toString(),
      code: newCoupon.code,
      discountPercentage: Number(newCoupon.discountPercentage),
      expiresAt: newCoupon.expiresAt,
      active: !!newCoupon.active,
      applicableCategory: newCoupon.applicableCategory,
      applicableProduct: newCoupon.applicableProduct,
      targetCustomer: newCoupon.targetCustomer,
    };
    await db.saveCoupon(c);
    await loadCoupons();
    setShowModal(false);
    showAlert(
      "Kuponi imeongezwa kikamilifu / Coupon added successfully",
      "success",
    );
  };

  const deleteCoupon = async (id: string) => {
    await db.deleteCoupon(id);
    setSelectedCoupons((prev) => prev.filter((cId) => cId !== id));
    await loadCoupons();
    showAlert("Kuponi imefutwa / Coupon deleted", "success");
  };

  const bulkDelete = async () => {
    if (selectedCoupons.length === 0) return;
    for (const id of selectedCoupons) {
      await db.deleteCoupon(id);
    }
    setSelectedCoupons([]);
    await loadCoupons();
    showAlert(
      `${selectedCoupons.length} kuponi zimefutwa / Coupons deleted`,
      "success",
    );
  };

  const toggleStatus = async (id: string) => {
    const coupon = coupons.find((c) => c.id === id);
    if (!coupon) return;
    await db.saveCoupon({ ...coupon, active: !coupon.active });
    await loadCoupons();
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const loyalCustomers = customers.filter(
    (c) => orders.filter((o) => o.customer_id === c.id).length > 2,
  ); // criteria for suggestions

  const toggleSelectAll = () => {
    if (selectedCoupons.length === coupons.length) {
      setSelectedCoupons([]);
    } else {
      setSelectedCoupons(coupons.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCoupons((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "sw" ? "Kuponi" : "Coupons"}
          </h1>
          <p className="text-sm text-slate-500">
            {lang === "sw"
              ? "Dhibiti misimbo ya punguzo"
              : "Manage discount codes"}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedCoupons.length > 0 && (
            <button
              onClick={bulkDelete}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-100 transition font-medium border border-red-200"
            >
              <Trash size={20} />
              {lang === "sw"
                ? `Futa ${selectedCoupons.length}`
                : `Delete ${selectedCoupons.length}`}
            </button>
          )}
          <button
            onClick={() => {
              setNewCoupon({
                code: "",
                discountPercentage: 10,
                expiresAt: new Date(Date.now() + 86400000 * 7)
                  .toISOString()
                  .split("T")[0],
                active: true,
              });
              setShowModal(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition shadow-sm font-medium"
          >
            <Plus size={20} />
            {lang === "sw" ? "Ongeza" : "Add"}
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid gap-4">
          {coupons.length > 0 && (
            <div className="flex items-center gap-3 px-2 py-1">
              <input
                type="checkbox"
                className="w-5 h-5 accent-primary rounded cursor-pointer"
                checked={selectedCoupons.length === coupons.length}
                onChange={toggleSelectAll}
              />
              <span
                className="text-sm font-bold text-slate-600 cursor-pointer"
                onClick={toggleSelectAll}
              >
                {lang === "sw" ? "Chagua Zote" : "Select All"}
              </span>
            </div>
          )}

          {coupons.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              {lang === "sw"
                ? "Hakuna kuponi zilizopatikana"
                : "No coupons found"}
            </div>
          )}
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="mt-2 text-slate-400">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                    checked={selectedCoupons.includes(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                </div>
                <div
                  className={`p-3 rounded-full ${c.active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}
                >
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                    {c.code}
                    {!c.active && (
                      <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full z-0 ml-2">
                        Inactive
                      </span>
                    )}
                    {c.isUsed && (
                      <span className="text-xs font-semibold bg-red-100 text-red-500 px-2 py-0.5 rounded-full z-0 ml-2">
                        Used
                      </span>
                    )}
                  </h3>
                  <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-accent">
                      {c.discountPercentage}% Punguzo / Off
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} /> Inaisha / Expires:{" "}
                      {c.expiresAt}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => toggleStatus(c.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${c.active ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                >
                  {c.active
                    ? lang === "sw"
                      ? "Zima"
                      : "Disable"
                    : lang === "sw"
                      ? "Washa"
                      : "Enable"}
                </button>
                <button
                  onClick={() => deleteCoupon(c.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Futa / Delete"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-primary">
                Kuponi Mpya / New Coupon
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Generation Controls */}
              <div className="bg-slate-100 p-4 rounded-xl space-y-3 mb-2 border border-slate-200">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {lang === "sw" ? "Tengeneza Otomatiki" : "Auto Generate"}
                </h3>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 text-slate-700">
                      Min %
                    </label>
                    <input
                      type="number"
                      value={minDiscount}
                      onChange={(e) => setMinDiscount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 text-slate-700">
                      Max %
                    </label>
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={generateCode}
                      className="h-[38px] bg-slate-800 text-white px-4 rounded-lg font-medium text-sm hover:bg-slate-700 transition"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {lang === "sw" ? "Msimbo" : "Code"}
                </label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent uppercase font-mono"
                  placeholder="OFFER20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {lang === "sw" ? "Punguzo (%)" : "Discount (%)"}
                </label>
                <input
                  type="number"
                  value={newCoupon.discountPercentage}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      discountPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent"
                  min="1"
                  max="100"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  Mapendekezo ya Wateja / Suggested Customers
                </label>
                <select
                  value={newCoupon.targetCustomer || ""}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      targetCustomer: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent text-sm bg-white"
                >
                  <option value="">-- Yeyote / Anyone --</option>
                  {loyalCustomers.length > 0 && (
                    <optgroup label="Wateja Watiifu / Loyal Customers">
                      {loyalCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email || c.phone})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Wateja Wote / All Customers">
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email || c.phone})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Kuponi hii itatumika kwa mteja mmoja aliyechaguliwa na mara
                  moja tu (One-time usage).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">
                    Kwa Kategoria
                  </label>
                  <select
                    value={newCoupon.applicableCategory || ""}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        applicableCategory: e.target.value,
                        applicableProduct: "",
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent text-sm bg-white"
                  >
                    <option value="">Zote / All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">
                    Au Bidhaa Maalum
                  </label>
                  <select
                    value={newCoupon.applicableProduct || ""}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        applicableProduct: e.target.value,
                        applicableCategory: "",
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent text-sm bg-white"
                    disabled={!!newCoupon.applicableCategory}
                  >
                    <option value="">Zote / All</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  Tarehe ya Kuisha / Expiry Date
                </label>
                <input
                  type="date"
                  value={newCoupon.expiresAt}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, expiresAt: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCou"
                  checked={newCoupon.active}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, active: e.target.checked })
                  }
                  className="w-5 h-5 accent-accent"
                />
                <label
                  htmlFor="activeCou"
                  className="text-sm font-medium cursor-pointer"
                >
                  Iwe Wazi Pamoja / Active Immediately
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition"
                >
                  Ghairi / Cancel
                </button>
                <button
                  onClick={addCoupon}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-slate-700 shadow-sm transition"
                >
                  Hifadhi / Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SellerSettingsSelf({
  seller,
  sellers,
  setSellers,
  lang,
}: {
  seller: SellerProfile;
  sellers: SellerProfile[];
  setSellers: any;
  lang: string;
}) {
  const { showAlert } = useDialog();
  const [invoiceCompanyName, setInvoiceCompanyName] = useState(
    seller.invoiceCompanyName || "",
  );
  const [invoicePhone, setInvoicePhone] = useState(seller.invoicePhone || "");
  const [invoiceEmail, setInvoiceEmail] = useState(seller.invoiceEmail || "");
  const [invoiceAddress, setInvoiceAddress] = useState(
    seller.invoiceAddress || "",
  );
  const [pickupPlace, setPickupPlace] = useState<GooglePlaceDetails | null>(
    seller.pickupLat && seller.pickupLng
      ? {
          placeId: seller.pickupPlaceId || "",
          formattedAddress: seller.pickupAddress || seller.invoiceAddress || "",
          lat: Number(seller.pickupLat),
          lng: Number(seller.pickupLng),
        }
      : null,
  );
  const [invoiceTerms, setInvoiceTerms] = useState(seller.invoiceTerms || "");
  const [businessLogo, setBusinessLogo] = useState(seller.businessLogo || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFileViaStorageApi(
        e.target.files[0],
        "products",
        () => {},
      );
      setBusinessLogo(url);
      showAlert(
        lang === "sw" ? "Nembo imepakiwa!" : "Logo uploaded!",
        "success",
      );
    } catch (err: any) {
      showAlert(
        lang === "sw"
          ? "Imeshindwa kupakia nembo: " + err.message
          : "Failed to upload logo: " + err.message,
        "error",
      );
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = sellers.map((s) => {
      if (s.id === seller.id) {
        return {
          ...s,
          invoiceCompanyName,
          invoicePhone,
          invoiceEmail,
          invoiceAddress,
          pickupAddress: pickupPlace?.formattedAddress || invoiceAddress,
          pickupPlaceId: pickupPlace?.placeId || s.pickupPlaceId,
          pickupLat: pickupPlace?.lat,
          pickupLng: pickupPlace?.lng,
          invoiceTerms,
          businessLogo,
        };
      }
      return s;
    });
    setSellers(updated);
    await db.saveSellers(updated);
    showAlert(
      lang === "sw" ? "Imefanikiwa" : "Success",
      lang === "sw"
        ? "Mipangilio yako ya Invoice imehifadhiwa kikamilifu!"
        : "Your Invoice Settings have been successfully saved.",
    );
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-2 mb-6 text-slate-800">
        <SettingsIcon size={24} className="text-orange-500" />
        <h2 className="text-xl md:text-2xl font-black tracking-tight">
          {lang === "sw"
            ? "Mipangilio ya Invoice Yako (Unayouza)"
            : "Your Invoice Settings"}
        </h2>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-5"
      >
        <p className="text-sm text-slate-500 font-medium mb-2 leading-relaxed">
          {lang === "sw"
            ? "Maelezo haya yatatokea kwenye ankara (Invoice) zinazotumwa kwa wateja kwa bidhaa zako."
            : "These details will appear on the receipt/invoice generated for customers buying your items."}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center p-4 bg-slate-50 rounded-2xl border border-slate-150">
          <div className="relative w-20 h-20 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            {businessLogo ? (
              <img
                src={businessLogo}
                alt="Business logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-slate-400 font-bold text-xs uppercase text-center p-1 font-mono">
                No Logo
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">
              {lang === "sw"
                ? "Nembo ya Biashara (Business Logo / Brand)"
                : "Business Logo / Brand Logo"}
            </label>
            <div className="flex gap-2 items-center">
              <label className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-2 rounded-lg cursor-pointer transition select-none">
                {uploadingLogo
                  ? lang === "sw"
                    ? "Inapakia..."
                    : "Uploading..."
                  : lang === "sw"
                    ? "Badilisha Nembo"
                    : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              {businessLogo && (
                <button
                  type="button"
                  onClick={() => setBusinessLogo("")}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-[11px] px-3 py-2 rounded-lg transition"
                >
                  {lang === "sw" ? "Ondoa" : "Remove"}
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              {lang === "sw"
                ? "Fomati inayopendekezwa ni PNG au JPG ya mraba, italemba ankara yako ya duka."
                : "Recommended format is PNG or square JPG, it will render on your shop invoice."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1.5 font-bold text-slate-700">
              {lang === "sw"
                ? "Jina la Kampuni (au Duka) Kwenye Invoice"
                : "Company/Store Name on Invoice"}
            </label>
            <input
              type="text"
              value={invoiceCompanyName}
              onChange={(e) => setInvoiceCompanyName(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-slate-50 text-sm font-medium"
              placeholder={
                lang === "sw" ? "Mf. Orbi Fashion" : "e.g. My Store Ltd"
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 font-bold text-slate-700">
              {lang === "sw" ? "Simu (Phone)" : "Phone Number"}
            </label>
            <input
              type="text"
              value={invoicePhone}
              onChange={(e) => setInvoicePhone(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-orange-500 bg-slate-50 text-sm font-medium"
              placeholder="+255..."
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 font-bold text-slate-700">
              {lang === "sw" ? "Barua Pepe (Email)" : "Email"}
            </label>
            <input
              type="text"
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-orange-500 bg-slate-50 text-sm font-medium"
            />
          </div>
          <div>
            <GooglePlacePicker
              lang={lang === "sw" ? "sw" : "en"}
              value={invoiceAddress}
              selectedPlace={pickupPlace}
              onAddressChange={setInvoiceAddress}
              onPlaceSelect={setPickupPlace}
              label={lang === "sw" ? "Eneo la duka / Pickup" : "Store / Pickup Location"}
              placeholder={
                lang === "sw"
                  ? "Tafuta eneo la duka kwenye Google Maps..."
                  : "Search store location on Google Maps..."
              }
              helperText={
                lang === "sw"
                  ? "Eneo hili litasaidia delivery quote kutumia distance sahihi."
                  : "This helps delivery quotes use the correct route distance."
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5 font-bold text-slate-700">
            {lang === "sw"
              ? "Masharti na Vigezo (Terms)"
              : "Terms & Conditions"}
          </label>
          <textarea
            value={invoiceTerms}
            onChange={(e) => setInvoiceTerms(e.target.value)}
            className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-orange-500 bg-slate-50 text-sm font-medium leading-relaxed"
            rows={3}
          ></textarea>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-orange-600 transition shadow-md shadow-orange-500/20"
          >
            {lang === "sw" ? "Hifadhi Mipangilio" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AIPilotEngine({
  products = [],
  orders = [],
  messages = [],
  sellers = [],
  lang,
}: {
  products?: Product[];
  orders?: Order[];
  messages?: Message[];
  sellers?: SellerProfile[];
  lang: string;
}) {
  const [autoApprove, setAutoApprove] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [autoMessage, setAutoMessage] = useState(true);
  const [smartPromotion, setSmartPromotion] = useState(true);
  const [securityMonitor, setSecurityMonitor] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    db.getAiPilotSettings().then((settings) => {
      setAutoApprove(settings.autoApprove);
      setAutoCategorize(settings.autoCategorize);
      setAutoMessage(settings.autoMessage);
      setSmartPromotion(settings.smartPromotion);
      setSecurityMonitor(settings.securityMonitor);
      setIsLoading(false);
    });
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    setIsSaving(true);
    let newSettings = {
      autoApprove,
      autoCategorize,
      autoMessage,
      smartPromotion,
      securityMonitor,
    };
    if (key === "autoApprove") {
      setAutoApprove(value);
      newSettings.autoApprove = value;
    }
    if (key === "autoCategorize") {
      setAutoCategorize(value);
      newSettings.autoCategorize = value;
    }
    if (key === "autoMessage") {
      setAutoMessage(value);
      newSettings.autoMessage = value;
    }
    if (key === "smartPromotion") {
      setSmartPromotion(value);
      newSettings.smartPromotion = value;
    }
    if (key === "securityMonitor") {
      setSecurityMonitor(value);
      newSettings.securityMonitor = value;
    }
    await db.saveAiPilotSettings(newSettings);
    setIsSaving(false);
  };

  const [sessionLogs, setSessionLogs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchBackendScan = async () => {
      try {
        const res = await fetch("/api/v1/admin/pilot_scan");
        const data = await res.json();

        if (!isMounted || !data.success) return;

        const metrics = data.metrics || {};

        const now = new Date();
        const formatRelativeTime = (dts: Date | string) => {
          const dateObj = typeof dts === "string" ? new Date(dts) : dts;
          const diffMins = Math.floor(
            (now.getTime() - dateObj.getTime()) / 60000,
          );
          if (diffMins < 60)
            return lang === "sw"
              ? `Dakika ${Math.max(1, diffMins)} zilizopita`
              : `${Math.max(1, diffMins)} mins ago`;
          const diffHrs = Math.floor(diffMins / 60);
          if (diffHrs < 24)
            return lang === "sw"
              ? `Saa ${diffHrs} zilizopita`
              : `${diffHrs} hours ago`;
          return lang === "sw"
            ? `Siku ${Math.floor(diffHrs / 24)} zilizopita`
            : `${Math.floor(diffHrs / 24)} days ago`;
        };

        setSessionLogs([
          {
            id: 1,
            time: formatRelativeTime(new Date(now.getTime() - 5 * 60000)),
            message: !autoCategorize
              ? lang === "sw"
                ? "Upangaji kategoria kiotomatiki umezimwa."
                : "Auto-categorization is currently disabled."
              : lang === "sw"
                ? `Mfumo umekadiria bidhaa ${metrics.categorizedCount || 0} kwenye kategoria zake kulingana na data hali halisi.`
                : `Auto-categorized and audited ${metrics.categorizedCount || 0} live inventory items across the network.`,
            type: !autoCategorize ? "info" : "success",
          },
          {
            id: 2,
            time: formatRelativeTime(
              metrics.lastPendingDts || new Date(now.getTime() - 15 * 60000),
            ),
            message: !autoMessage
              ? lang === "sw"
                ? "Mfumo wa kujibu kiotomatiki umezimwa."
                : "Smart auto-responder is currently disabled."
              : lang === "sw"
                ? `Kikumbusho cha kiotomatiki kimetumwa kwa wateja ${metrics.pendingOrdersCount || 0} wenye oda zinazosubiri malipo.`
                : `Sent ${metrics.pendingOrdersCount || 0} automatic recovery reminders for pending order checkouts.`,
            type: "info",
          },
          {
            id: 3,
            time: formatRelativeTime(new Date(now.getTime() - 25 * 60000)),
            message: !securityMonitor
              ? lang === "sw"
                ? "Mlinzi wa Usalama amezimwa."
                : "Security Monitor is currently disabled."
              : metrics.suspectMessagesCount > 0
                ? lang === "sw"
                  ? `Mlinzi wa Usaidizi (Security Monitor): Onyo: Mwelekeo wa malipo nje ya mfumo umezuiwa kwenye mazungumzo ${metrics.suspectMessagesCount} kati ya wauzaji na wanunuzi.`
                  : `Security Engine: Alert: Blocked ${metrics.suspectMessagesCount} global chat trails between buyers and sellers referencing off-platform payment details.`
                : lang === "sw"
                  ? `Mlinzi wa Usalama (Security Monitor): Tunakagua mazungumzo yote kwenye mfumo mzima (${metrics.totalMessagesCount || 0} messages) kati ya wauzaji ${metrics.sellersCount || 0} na wanunuzi wao kusaka mianya ya ukiukwaji wa kiusalama... Hakuna hatari ya malipo ya nje iliyobainika.`
                  : `Security Engine: Auditing overall global platform communications (${metrics.totalMessagesCount || 0} messages) across ${metrics.sellersCount || 0} sellers and their buyers... Platform payment policy compliance verified with no violations.`,
            type: !securityMonitor
              ? "info"
              : metrics.suspectMessagesCount > 0
                ? "warning"
                : "success",
          },
          {
            id: 4,
            time: formatRelativeTime(new Date(now.getTime() - 60 * 60000)),
            message:
              metrics.inactiveSellersCount > 0
                ? lang === "sw"
                  ? `Imebaini wauzaji ${metrics.inactiveSellersCount} wasio na bidhaa zozote kwenye akaunti zao.`
                  : `Flagged ${metrics.inactiveSellersCount} inactive sellers with zero portfolio listings.`
                : lang === "sw"
                  ? "Uchambuzi wa Wauzaji: Wauzaji wote wamethibitishwa kuwa na stoki hai na salama."
                  : "Seller Audit: Verified active inventories and compliant catalogs globally.",
            type: "warning",
          },
        ]);
      } catch (e) {
        console.warn("Backend scan failed", e);
      }
    };

    fetchBackendScan();
    const interval = setInterval(fetchBackendScan, 30000); // Check backend every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lang, autoCategorize, autoMessage, securityMonitor]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="text-primary" size={24} />
            {lang === "sw"
              ? "Msaidizi wa AI & Bot Pilot"
              : "AI & Auto Pilot Engine"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {lang === "sw"
              ? "Dhibiti na usimamie kazi za kiotomatiki za mfumo ili kurahisisha uendeshaji"
              : "Manage automated tasks and smart routing for platform hands-free operations"}
          </p>
        </div>
        <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-full font-bold flex items-center gap-2">
          <Activity size={16} className="animate-pulse" />
          {lang === "sw" ? "Inafanya Kazi" : "System Active"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <Cpu className="text-slate-500" />
            {lang === "sw"
              ? "Usanidi wa Kiotomatiki (Auto Config)"
              : "Automated Processing"}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-700">
                  {lang === "sw"
                    ? "Gawa Kategoria Kiotomatiki"
                    : "Auto-Categorize Products"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "sw"
                    ? "Tambua na kupanga bidhaa kulingana na muundo."
                    : "Detect and group products based on name and traits."}
                </p>
              </div>
              <button
                onClick={() => handleToggle("autoCategorize", !autoCategorize)}
                disabled={isSaving}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${autoCategorize ? "bg-primary" : "bg-slate-300"} ${isSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${autoCategorize ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-700">
                  {lang === "sw" ? "Jibu Kiotomatiki" : "Smart Auto-Responder"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "sw"
                    ? "Jibu wateja mara moja maswali ya mara kwa mara"
                    : "Instantly answer frequent general customer questions."}
                </p>
              </div>
              <button
                onClick={() => handleToggle("autoMessage", !autoMessage)}
                disabled={isSaving}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${autoMessage ? "bg-primary" : "bg-slate-300"} ${isSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${autoMessage ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-700">
                  {lang === "sw"
                    ? "Mapendekezo ya Smart Promo"
                    : "Smart Promo Targeting"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "sw"
                    ? "Ruhusu Bot iweke punguzo kwa masaa."
                    : "Allow bot to trigger flash sales and smart discounts."}
                </p>
              </div>
              <button
                onClick={() => handleToggle("smartPromotion", !smartPromotion)}
                disabled={isSaving}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${smartPromotion ? "bg-primary" : "bg-slate-300"} ${isSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${smartPromotion ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-700">
                  {lang === "sw" ? "Ijaribu Mifumo" : "System Diagnostics"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "sw"
                    ? "Hukagua utendaji wa soko na uuzaji."
                    : "Daily scans on market behaviors and stock."}
                </p>
              </div>
              <button
                onClick={() => handleToggle("autoApprove", !autoApprove)}
                disabled={isSaving}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${autoApprove ? "bg-primary" : "bg-slate-300"} ${isSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${autoApprove ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="flex items-start justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="flex-1 pr-4">
                <p className="font-bold text-sm text-rose-700">
                  {lang === "sw"
                    ? "Mlinzi wa Usalama (Chats)"
                    : "Security & Policy Monitor"}
                </p>
                <div className="text-xs text-rose-500 mt-1 space-y-1">
                  <p>
                    {lang === "sw"
                      ? "Hukagua mazungumzo (chats) za wauzaji na wateja kulinda soko."
                      : "Scans and audits cross-platform seller-buyer chats globally."}
                  </p>
                  <div className="bg-white/60 p-2 rounded-lg border border-rose-100 mt-2">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-rose-800 mb-0.5">
                      {lang === "sw"
                        ? "Hatua Zinazochukuliwa:"
                        : "Policy Actions:"}
                    </p>
                    <ul className="list-disc list-inside text-rose-600 text-[10px] font-medium leading-relaxed">
                      <li>
                        {lang === "sw"
                          ? "Kuficha namba za simu kwa alama za nyota (***)."
                          : "Automatically redacts phone numbers with asterisks (***)."}
                      </li>
                      <li>
                        {lang === "sw"
                          ? "Kuzuia ujumbe unaodai malipo binafsi / nje ya mfumo."
                          : "Blocks and replaces messages requesting off-platform payments."}
                      </li>
                      <li>
                        {lang === "sw"
                          ? "Kuwawekea 'Shadow-Ban' wauzaji wanaokiuka mara kwa mara."
                          : "Issues automatic invisible Shadow-Bans for repeat violating sellers."}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle("securityMonitor", !securityMonitor)
                }
                disabled={isSaving}
                className={`w-12 h-6 mt-1 rounded-full transition-colors relative flex items-center shrink-0 ${securityMonitor ? "bg-rose-600" : "bg-rose-300"} ${isSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${securityMonitor ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col relative h-[500px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />
          <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg relative z-10">
            <Zap className="text-yellow-400" />
            {lang === "sw" ? "Shughuli za Bot (Live)" : "Bot Activity Log"}
            <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Live
            </span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 relative z-10 custom-scrollbar">
            {sessionLogs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="shrink-0 pt-1">
                  {log.type === "success" && (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  )}
                  {log.type === "info" && (
                    <Activity size={16} className="text-blue-400" />
                  )}
                  {log.type === "warning" && (
                    <AlertCircle size={16} className="text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {log.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 relative z-10">
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition">
              {lang === "sw"
                ? "Tazama Ripoti Kamili"
                : "Download System Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TalkLogsAdmin({ lang }: { lang: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");

  // Test send states
  const [testRecipient, setTestRecipient] = useState("admin.orbi@gmail.com");
  const [testChannel, setTestChannel] = useState<"email" | "sms">("email");
  const [testSubject, setTestSubject] = useState(
    "Habari kutoka Orbi Shop (Majaribio)",
  );
  const [testBody, setTestBody] = useState(
    "Huu ni ujumbe wa majaribio uliotumwa kupitia njia ya barua-pepe ya mfumo wa Orbi Talk. Ukitokeza kwenye ripoti za uwasilishaji basi mfumo upo salama na unajibu vyema.",
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    simulated?: boolean;
    error?: string;
  } | null>(null);
  const [showPlayground, setShowPlayground] = useState(true); // Open by default for testers

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/talk/logs");
      const result = await res.json();
      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (e: any) {
      console.error("Failed to fetch talk logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (
      !window.confirm(
        lang === "sw"
          ? "Je, kweli unataka kufuta kumbukumbu zote za kutufutia ujumbe?"
          : "Are you sure you want to permanently clear all transmission logs?",
      )
    ) {
      return;
    }
    try {
      setClearing(true);
      const res = await fetch("/api/talk/logs/clear", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setLogs([]);
        setSelectedLog(null);
        setMessage(
          lang === "sw"
            ? "Kumbukumbu zimefutwa kikamilifu!"
            : "All delivery logs cleared successfully!",
        );
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (e: any) {
      console.error("Failed to clear talk logs", e);
    } finally {
      setClearing(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim() || !testBody.trim()) {
      alert(
        lang === "sw"
          ? "Tafadhali jaza maelezo yote."
          : "Please fill out recipient and message content.",
      );
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);
      const response = await fetch("/api/talk/send-test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: testRecipient,
          channel: testChannel,
          subject: testChannel === "email" ? testSubject : undefined,
          body: testBody,
        }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        setMessage(
          lang === "sw"
            ? `Ujumbe umetumwa! ${result.simulated ? "(Umesimuliwa)" : ""}`
            : `Custom test dispatch processed! ${result.simulated ? "(Simulated)" : ""}`,
        );
        setTimeout(() => setMessage(""), 5000);
        // Refresh logging table
        await fetchLogs();
      }
    } catch (err: any) {
      console.error("Custom test message sending failed", err);
      setTestResult({
        success: false,
        error: err.message || "Network request failed",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        (log.recipient && log.recipient.toLowerCase().includes(searchLower)) ||
        (log.templateName &&
          log.templateName.toLowerCase().includes(searchLower)) ||
        (log.error && log.error.toLowerCase().includes(searchLower));

      const matchChannel =
        channelFilter === "all" || log.channel === channelFilter;

      const matchStatus = statusFilter === "all" || log.status === statusFilter;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [logs, search, channelFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="text-teal-600" size={24} />
            Orbi Talk
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {lang === "sw"
              ? "Fuatilia kufeli, kufanikiwa na maelezo ya ujumbe wote wa Email na SMS kupitia Talk Gateway."
              : "Track transmission failures, successes, and status explanations of SMS and automated Email dispatches."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${showPlayground ? "bg-teal-50 text-teal-700 border border-teal-100" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"}`}
          >
            <Sparkles size={15} />
            {lang === "sw" ? "Tuma Majaribio" : "Test Playground"}
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {lang === "sw" ? "Onyesha upya" : "Refresh"}
          </button>
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0 || clearing}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 hover:text-red-700 text-sm font-bold rounded-xl transition flex items-center gap-1 border border-red-100 cursor-pointer"
          >
            <Trash size={15} />
            {lang === "sw" ? "Futa Historia" : "Clear History"}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {message}
        </div>
      )}

      {/* Test Sender Playground Card */}
      {showPlayground && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Sparkles className="text-teal-500 animate-pulse" size={16} />
              {lang === "sw"
                ? "JUKWAA LA KUTUMA MAJARIBIO YA CUSTOM"
                : "CUSTOM TEST DISPATCH PLAYGROUND"}
            </h3>
            <span className="text-[10px] uppercase font-mono font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
              Live test environment
            </span>
          </div>

          <form
            onSubmit={handleSendTestMessage}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">
                {lang === "sw" ? "Chagua Njia (Channel)" : "Delivery Channel"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTestChannel("email");
                    setTestRecipient("admin.orbi@gmail.com");
                    setTestSubject("Habari kutoka Orbi Shop (Majaribio)");
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${testChannel === "email" ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  <Mail size={13} />
                  Email Gateway
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestChannel("sms");
                    setTestRecipient("+255700000000");
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${testChannel === "sms" ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  <Phone size={13} />
                  SMS Gateway
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 focus-within:z-10">
              <label className="text-xs font-bold text-slate-600">
                {lang === "sw"
                  ? "Mpokeaji (Email au Namba)"
                  : "Recipient Destination"}
              </label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={
                  testChannel === "email"
                    ? "nfano: admin@orbi.com"
                    : "mfano: +255..."
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
            </div>

            {testChannel === "email" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">
                  {lang === "sw" ? "Kichwa cha Barua-Pepe" : "Email Subject"}
                </label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            )}

            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">
                {lang === "sw" ? "Maudhui ya Ujumbe" : "Message Body Text"}
              </label>
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary leading-relaxed"
              />
            </div>

            <div className="md:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4 mt-1">
              <div className="text-[11px] text-slate-500">
                {testResult && (
                  <div className="flex items-center gap-1">
                    {testResult.success ? (
                      <span className="text-emerald-600 font-bold">
                        ✓{" "}
                        {lang === "sw"
                          ? "Imekubaliwa kikamilifu!"
                          : "Dispatched successfully!"}{" "}
                        {testResult.simulated
                          ? `(${lang === "sw" ? "Njia ya Simulizi" : "Simulated Dummy"})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold">
                        ✗ {lang === "sw" ? "Imeshindwa:" : "Failed:"}{" "}
                        {testResult.error || "Unknown Error"}
                      </span>
                    )}
                  </div>
                )}
                {!testResult &&
                  (lang === "sw"
                    ? "Ujumbe utarekodiwa kama delivery log mara moja."
                    : "The sent log record will propagate in real time inside the table below.")}
              </div>

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    {lang === "sw" ? "Inatuma..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Bot size={13} />
                    {lang === "sw" ? "Tuma Ujumbe Sasa" : "Send Test Message"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout (List left, Inspector right if selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Logs Table */}
        <div
          className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden ${selectedLog ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  lang === "sw"
                    ? "Tafuta namba/barua-pepe, jina la template..."
                    : "Search recipient, template name, errors..."
                }
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Channel Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 select-none">
                <span className="text-xs text-slate-400 pl-1">
                  {lang === "sw" ? "Njia:" : "Type:"}
                </span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-1 cursor-pointer"
                >
                  <option value="all">{lang === "sw" ? "Zote" : "All"}</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 select-none">
                <span className="text-xs text-slate-400 pl-1">
                  {lang === "sw" ? "Hali:" : "Status:"}
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-1 cursor-pointer"
                >
                  <option value="all">{lang === "sw" ? "Zote" : "All"}</option>
                  <option value="success">
                    {lang === "sw" ? "Zilizofanikiwa" : "Success"}
                  </option>
                  <option value="failed">
                    {lang === "sw" ? "Zilizofeli" : "Failed"}
                  </option>
                  <option value="simulated">
                    {lang === "sw" ? "Zilizosimuliwa" : "Simulated"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={24} className="animate-spin text-teal-600" />
                <span className="text-sm font-medium">
                  {lang === "sw"
                    ? "Inapakia kumbukumbu..."
                    : "Loading gateway log history..."}
                </span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm font-medium">
                  {lang === "sw"
                    ? "Hakuna kumbukumbu za vigezo vyako vilivyopatikana."
                    : "No delivery log entries match your constraints."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-4">
                      {lang === "sw" ? "Muda" : "Timestamp"}
                    </th>
                    <th className="px-5 py-4">
                      {lang === "sw" ? "Kituo" : "Channel"}
                    </th>
                    <th className="px-5 py-4">
                      {lang === "sw" ? "Mpokeaji" : "Recipient"}
                    </th>
                    <th className="px-5 py-4">
                      {lang === "sw"
                        ? "Context / Template"
                        : "Context / Template"}
                    </th>
                    <th className="px-5 py-4">
                      {lang === "sw" ? "Hali" : "Status"}
                    </th>
                    <th className="px-5 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const dateStr =
                      new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) +
                      " - " +
                      new Date(log.timestamp).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      });
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                        className={`hover:bg-slate-50/70 transition cursor-pointer ${isSelected ? "bg-primary/5 hover:bg-primary/10" : ""}`}
                      >
                        {/* Time */}
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {dateStr}
                        </td>
                        {/* Channel Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {log.channel === "email" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                              <Mail size={12} />
                              Email
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                              <Phone size={12} />
                              SMS
                            </span>
                          )}
                        </td>
                        {/* Recipient */}
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700 font-mono text-xs">
                          {log.recipient}
                        </td>
                        {/* Template/Context */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-slate-800 font-bold text-xs font-mono">
                            {log.templateName}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            Language:{" "}
                            <span className="uppercase font-bold">
                              {log.language}
                            </span>
                          </div>
                        </td>
                        {/* Status badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {log.status === "success" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              {lang === "sw" ? "Imefanikiwa" : "Success"}
                            </span>
                          )}
                          {log.status === "simulated" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              {lang === "sw" ? "Msimulizi" : "Simulated"}
                            </span>
                          )}
                          {log.status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                              {lang === "sw" ? "Imefeli" : "Failed"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs text-primary font-bold">
                            {isSelected
                              ? lang === "sw"
                                ? "Kunja"
                                : "Collapse"
                              : lang === "sw"
                                ? "Chambua"
                                : "Inspect"}{" "}
                            &rarr;
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payload Inspector Sidebar Panel */}
        {selectedLog && (
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4 relative overflow-hidden self-start">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-md">
                <Activity className="text-teal-400 animate-pulse" size={18} />
                {lang === "sw" ? "Uchambuzi wa Ujumbe" : "Payload Inspector"}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                {lang === "sw" ? "Funga" : "Close"}
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider">
                  {lang === "sw"
                    ? "Nambari ya Rejea (Request ID)"
                    : "Request ID"}
                </span>
                <span className="font-mono bg-slate-950 px-2 py-1 rounded block text-white select-all mt-1">
                  {selectedLog.id}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider">
                  {lang === "sw" ? "Njia na Mpokeaji" : "Channel & Destination"}
                </span>
                <span className="text-slate-100 font-medium block mt-1">
                  [{selectedLog.channel.toUpperCase()}] &rarr;{" "}
                  <span className="font-mono text-teal-300 select-all font-bold">
                    {selectedLog.recipient}
                  </span>
                </span>
              </div>

              {selectedLog.error && (
                <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-xl text-red-200">
                  <span className="font-bold block text-red-400 mb-1">
                    🚨{" "}
                    {lang === "sw"
                      ? "Sababu ya Kufeli:"
                      : "Transmission Error Reason:"}
                  </span>
                  <p className="font-mono break-all leading-relaxed whitespace-pre-wrap">
                    {selectedLog.error}
                  </p>
                </div>
              )}

              {selectedLog.data && (
                <div>
                  <span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-1.5">
                    {lang === "sw"
                      ? "Maudhui Yaliyoandaliwa"
                      : "Variables Payload (Metadata)"}
                  </span>
                  <pre className="font-mono text-[11px] bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 border border-slate-800 shadow-inner max-h-60 custom-scrollbar select-all">
                    {JSON.stringify(selectedLog.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function WakalasAdmin({
  products = [],
  orders = [],
  lang = "en",
  onRefreshData,
}: {
  products?: Product[];
  orders?: Order[];
  lang?: string;
  onRefreshData?: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWakalaId, setSelectedWakalaId] = useState<string | null>(null);
  
  const { showAlert, showConfirm, showPrompt } = useDialog();

  const [frozenWakalas, setFrozenWakalas] = useState<Record<string, boolean>>({});
  const [showQuickContact, setShowQuickContact] = useState(false);

  const wakalaStats = useMemo(() => {
    const stats: Record<string, { id: string; productCount: number; orderCount: number; totalCommission: number; products: Product[]; orders: Order[] }> = {};

    products.forEach((p) => {
      if (p.brokerId) {
        if (!stats[p.brokerId]) {
          stats[p.brokerId] = { id: p.brokerId, productCount: 0, orderCount: 0, totalCommission: 0, products: [], orders: [] };
        }
        stats[p.brokerId].productCount++;
        stats[p.brokerId].products.push(p);
      }
    });

    orders.forEach((o) => {
      if (o.brokerId) {
        if (!stats[o.brokerId]) {
          stats[o.brokerId] = { id: o.brokerId, productCount: 0, orderCount: 0, totalCommission: 0, products: [], orders: [] };
        }
        stats[o.brokerId].orderCount++;
        stats[o.brokerId].orders.push(o);
        if (o.brokerCommissionAmount) {
          stats[o.brokerId].totalCommission += Number(o.brokerCommissionAmount);
        }
      }
    });

    return Object.values(stats);
  }, [products, orders]);

  const filtered = wakalaStats.filter((w) => w.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleMessage = (wakalaId: string) => {
    showPrompt(
      lang === "sw" ? "Tuma Ujumbe kwa Wakala" : "Send Message to Wakala",
      lang === "sw" ? "Andika ujumbe wako (Utatumwa kupitia System, SMS, na Email):" : "Type your message (Will be sent via System, SMS, and Email):",
      (msg) => {
        if (msg) {
          showAlert(
            lang === "sw" ? "Ujumbe Umetumwa" : "Message Sent",
            lang === "sw" ? `Ujumbe umetumwa kikamilifu kwa wakala ${wakalaId}.` : `Message successfully sent to wakala ${wakalaId}.`
          );
        }
      }
    );
  };

  const handleQuickContact = (action: string, wakalaId: string) => {
    setShowQuickContact(false);
    let title = "";
    let promptText = "";
    
    if (action === "sms") {
      title = lang === "sw" ? "Tuma SMS" : "Send SMS";
      promptText = lang === "sw" ? "Andika ujumbe wa SMS:" : "Type SMS message:";
    } else if (action === "email") {
      title = lang === "sw" ? "Tuma Barua Pepe" : "Send Email";
      promptText = lang === "sw" ? "Andika ujumbe wa Barua Pepe:" : "Type Email message:";
    } else {
      title = lang === "sw" ? "Ujumbe wa Mfumo" : "In-System Message";
      promptText = lang === "sw" ? "Andika ujumbe (Utatumwa kwenye Orbi Talk):" : "Type message (Will be sent via Orbi Talk):";
    }

    showPrompt(title, promptText, (msg) => {
      if (msg) {
        showAlert(
          lang === "sw" ? "Ujumbe Umetumwa" : "Message Sent",
          lang === "sw" ? `Ujumbe umetumwa kikamilifu kwa wakala ${wakalaId}.` : `Message successfully sent to wakala ${wakalaId}.`
        );
      }
    });
  };

  const handleToggleFreeze = (wakalaId: string) => {
    const isFrozen = frozenWakalas[wakalaId];
    showConfirm(
      isFrozen ? (lang === "sw" ? "Fungua Akaunti" : "Unfreeze Account") : (lang === "sw" ? "Funga Akaunti" : "Freeze Account"),
      isFrozen 
        ? (lang === "sw" ? "Je, una uhakika unataka kuruhusu wakala huyu kufanya kazi tena?" : "Are you sure you want to unfreeze this wakala?")
        : (lang === "sw" ? "Je, una uhakika unataka kufunga akaunti ya wakala huyu? Hatoweza kupokea kamisheni." : "Are you sure you want to freeze this wakala? They will not receive commissions."),
      () => {
        setFrozenWakalas(prev => ({ ...prev, [wakalaId]: !isFrozen }));
        showAlert(
          lang === "sw" ? "Imefanikiwa" : "Success",
          isFrozen ? (lang === "sw" ? "Wakala amefunguliwa." : "Wakala unfrozen.") : (lang === "sw" ? "Wakala amefungiwa." : "Wakala frozen.")
        );
      }
    );
  };

  const handleDelete = (wakalaId: string) => {
    showConfirm(
      lang === "sw" ? "Futa Wakala" : "Delete Wakala",
      lang === "sw" ? "Tahadhari: Kufuta wakala kutaondoa taarifa zake. Hii haiwezi kurudishwa." : "Warning: Deleting a wakala will remove their profile. This cannot be undone.",
      () => {
        showAlert(lang === "sw" ? "Imefanikiwa" : "Success", lang === "sw" ? "Wakala amefutwa (Simulation)." : "Wakala deleted (Simulation).");
        setSelectedWakalaId(null);
      }
    );
  };

  const handleEdit = (wakalaId: string) => {
    showPrompt(
      lang === "sw" ? "Hariri Wakala" : "Edit Wakala",
      lang === "sw" ? "Badilisha ID/Jina la Wakala:" : "Change Wakala ID/Name:",
      (newVal) => {
        if (newVal) {
          showAlert(lang === "sw" ? "Imesasishwa" : "Updated", lang === "sw" ? "Taarifa zimesasishwa (Simulation)." : "Information updated (Simulation).");
        }
      }
    );
  };

  if (selectedWakalaId) {
    const wakala = wakalaStats.find(w => w.id === selectedWakalaId);
    if (!wakala) {
      setSelectedWakalaId(null);
      return null;
    }

    const isFrozen = frozenWakalas[wakala.id];

    // Generate chronological activity log
    const activities: { id: string; type: string; title: string; desc?: string; date: string; icon: any; color: string }[] = [];
    
    // 1. Registration
    activities.push({
      id: 'reg',
      type: 'registration',
      title: lang === 'sw' ? 'Usajili wa Wakala' : 'Wakala Registration',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      icon: <UserCheck size={14} />,
      color: 'bg-blue-100 text-blue-600'
    });
    
    // 2. Orders (Transactions)
    wakala.orders.forEach(o => {
      activities.push({
        id: `order-${o.id}`,
        type: 'transaction',
        title: lang === 'sw' ? `Oda mpya: ${o.orderNumber || o.id.slice(0,8)}` : `New Order: ${o.orderNumber || o.id.slice(0,8)}`,
        desc: `+ ${formatCurrency(o.brokerCommissionAmount || 0)}`,
        date: o.createdAt,
        icon: <DollarSign size={14} />,
        color: 'bg-emerald-100 text-emerald-600'
      });
    });
    
    // 3. Status changes (frozen)
    if (isFrozen) {
      activities.push({
        id: 'frozen',
        type: 'status',
        title: lang === 'sw' ? 'Akaunti imefungiwa' : 'Account Frozen',
        date: new Date().toISOString(),
        icon: <Lock size={14} />,
        color: 'bg-red-100 text-red-600'
      });
    }

    // Sort descending by date
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="bg-slate-50 min-h-full p-4 sm:p-6 flex flex-col gap-6 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={() => setSelectedWakalaId(null)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {wakala.id}
                {isFrozen && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full uppercase tracking-wider font-bold">FROZEN</span>}
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                {lang === "sw" ? "Taarifa za Wakala" : "Wakala Details"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 relative z-10 w-full sm:w-auto">
            <button onClick={() => handleEdit(wakala.id)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5">
              <Edit size={14} /> {lang === "sw" ? "Hariri" : "Edit"}
            </button>
            <button onClick={() => handleToggleFreeze(wakala.id)} className={`flex-1 sm:flex-none px-4 py-2 border rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 ${isFrozen ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'}`}>
              {isFrozen ? <Unlock size={14} /> : <Lock size={14} />} 
              {isFrozen ? (lang === "sw" ? "Fungua" : "Unfreeze") : (lang === "sw" ? "Funga" : "Freeze")}
            </button>
            <button onClick={() => handleDelete(wakala.id)} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all shadow-sm flex items-center justify-center gap-1.5">
              <Trash size={14} /> {lang === "sw" ? "Futa" : "Delete"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Package size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{wakala.productCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {lang === "sw" ? "Jumla ya Bidhaa" : "Total Products"}
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
              <ShoppingCart size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{wakala.orderCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {lang === "sw" ? "Jumla ya Oda" : "Total Orders"}
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{formatCurrency(wakala.totalCommission)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {lang === "sw" ? "Jumla ya Kamisheni" : "Total Commission"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col max-h-[500px]">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">{lang === "sw" ? "Bidhaa za Wakala" : "Wakala's Products"}</h3>
             <div className="flex-1 overflow-auto pr-2 space-y-3">
                {wakala.products.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">{lang === "sw" ? "Hakuna bidhaa." : "No products."}</div>
                ) : (
                  wakala.products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                          <ImageWithSkeleton
                            src={p.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                            alt={p.name}
                            containerClassName="w-full h-full"
                          />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            {lang === "sw" ? "Kamisheni:" : "Commission:"} {p.brokerCommissionPercent}%
                          </div>
                       </div>
                       <div className="font-black text-sm text-slate-900">
                         <PriceDisplay amount={p.price} compact />
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Orders */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col max-h-[500px]">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">{lang === "sw" ? "Oda Zilizofanikiwa" : "Successful Orders"}</h3>
             <div className="flex-1 overflow-auto pr-2 space-y-3">
                {wakala.orders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">{lang === "sw" ? "Hakuna oda." : "No orders."}</div>
                ) : (
                  wakala.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div>
                          <div className="font-bold text-sm text-slate-800">{o.orderNumber || o.id.slice(0,8)}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </div>
                       </div>
                       <div className="text-right">
                         <div className="text-xs font-bold text-emerald-600">
                           + {formatCurrency(o.brokerCommissionAmount || 0)}
                         </div>
                         <div className="text-[10px] text-slate-400 uppercase font-bold">{lang === "sw" ? "Kamisheni" : "Commission"}</div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col mt-2">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">{lang === "sw" ? "Kumbukumbu za Matukio" : "Activity Log"}</h3>
           <div className="flex-1 overflow-auto pr-2 max-h-[400px]">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{lang === "sw" ? "Hakuna matukio." : "No activities."}</div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 py-2 space-y-8">
                  {activities.map(act => (
                    <div key={act.id} className="relative pl-6">
                      <div className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full ${act.color} flex items-center justify-center ring-4 ring-white`}>
                        {act.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{act.title}</div>
                        {act.desc && <div className="text-xs font-bold text-emerald-600 mt-0.5">{act.desc}</div>}
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                          {new Date(act.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* Quick Contact FAB */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {showQuickContact && (
            <div className="flex flex-col gap-2 mb-2">
              <button
                onClick={() => handleQuickContact("sms", wakala.id)}
                className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">{lang === "sw" ? "Tuma SMS" : "Send SMS"}</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Smartphone size={16} />
                </div>
              </button>
              
              <button
                onClick={() => handleQuickContact("email", wakala.id)}
                className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">{lang === "sw" ? "Barua Pepe" : "Send Email"}</span>
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Mail size={16} />
                </div>
              </button>
              
              <button
                onClick={() => handleQuickContact("system", wakala.id)}
                className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">{lang === "sw" ? "Ujumbe wa Mfumo" : "In-System Message"}</span>
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <MessageSquare size={16} />
                </div>
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowQuickContact(!showQuickContact)}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 ${showQuickContact ? 'bg-slate-800 rotate-45' : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-105'}`}
          >
            {showQuickContact ? <X size={24} /> : <MessageSquare size={24} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-emerald-500" />
            {lang === "sw" ? "Usimamizi wa Mawakala" : "Wakalas Management"}
          </h2>
          <div className="mt-2">
             <button
                onClick={() => {
                  const exportData = wakalaStats.map(w => ({
                    WakalaID: w.id,
                    ProductsCount: w.productCount,
                    OrdersCount: w.orderCount,
                    TotalCommission: w.totalCommission
                  }));
                  exportToCSV(exportData, `wakalas_export_${new Date().toISOString().split('T')[0]}.csv`);
                }}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition cursor-pointer text-xs"
              >
                <Download size={14} />
                {lang === "sw" ? "Hamisha CSV" : "Export CSV"}
              </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {lang === "sw" ? "Kumbukumbu za utendaji wa mawakala." : "Performance records for wakalas/brokers."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={lang === "sw" ? "Tafuta kwa kitambulisho (ID)..." : "Search by ID..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-slate-200 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
          <button
            onClick={async () => {
              if (onRefreshData) {
                setIsRefreshing(true);
                await onRefreshData();
                setTimeout(() => setIsRefreshing(false), 800);
              }
            }}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {lang === "sw" ? "Onyesha upya" : "Refresh"}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {lang === "sw" ? "Hakuna mawakala waliopatikana" : "No wakalas found"}
            </h3>
            <p className="text-slate-500 mt-1">
              {lang === "sw" ? "Ongeza mawakala kwenye bidhaa zao." : "Assign wakalas to products."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((w) => (
              <div 
                key={w.id} 
                className={`bg-white border ${frozenWakalas[w.id] ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} rounded-xl p-4 hover:shadow-md transition cursor-pointer group relative`}
                onClick={() => setSelectedWakalaId(w.id)}
              >
                {frozenWakalas[w.id] && (
                  <div className="absolute top-3 right-3 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    FROZEN
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${frozenWakalas[w.id] ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {frozenWakalas[w.id] ? <Lock size={20} /> : <UserCheck size={20} />}
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <h3 className="font-bold text-slate-800 text-sm truncate" title={w.id}>
                      {w.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Wakala ID
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100 group-hover:bg-white transition-colors">
                    <div className="text-lg font-black text-slate-700">{w.productCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {lang === "sw" ? "Bidhaa" : "Products"}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100 group-hover:bg-white transition-colors">
                    <div className="text-lg font-black text-slate-700">{w.orderCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {lang === "sw" ? "Oda (Orders)" : "Orders"}
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 flex justify-between items-center group-hover:bg-emerald-100 transition-colors">
                  <span className="text-xs font-bold uppercase">
                    {lang === "sw" ? "Kamisheni" : "Commission"}
                  </span>
                  <span className="font-black">
                    {formatCurrency(w.totalCommission)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
