import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  PackageOpen, 
  Truck, 
  Grid, 
  Filter, 
  Search, 
  Boxes,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
  Layers,
  MapPin,
  ClipboardList,
  ArrowUpRight,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  CreditCard
} from "lucide-react";
import { useI18n } from "../../pages/AdminApp";
import { useDialog } from "../CustomDialogContext";
import { db } from "../../lib/db";
import { Order } from "../../types";
import { formatCurrency } from "../../lib/storage";
import { exportToCSV } from "../../utils/exportUtils";
import { startConversation, sendChatMessage } from "../../lib/chat";

// Helper: extract inbound delivery & seller profile for each item
function getItemInboundDetails(order: any, item: any, products: any[], sellers: any[], formItemInboundStates?: string, currentHubStatus?: string) {
  const prod = products.find((p: any) => p.id === item.productId || p.id === item.id);
  const selId = prod?.sellerId || prod?.seller_id;
  const seller = sellers.find((s: any) => s.id === selId);
  const sName = seller?.storeName || seller?.name || prod?.soldBy || "Standard Merchant";
  
  // Use either the local form state or the order's stored state
  const stateStr = formItemInboundStates !== undefined ? formItemInboundStates : (order.itemInboundStates || "");
  
  const itemRecords = stateStr.split(",").filter(Boolean);
  const myRecord = itemRecords.find((r: any) => r.startsWith(item.productId + "="));
  
  const activeHubStatus = currentHubStatus || order.hubStatus || "PENDING_DELIVERY";
  let status = activeHubStatus === "PENDING_DELIVERY" ? "PENDING" : "ARRIVED";
  let riderName = "";
  let riderPhone = "";
  let vehicle = "";
  let failureReason = "";
  
  if (myRecord) {
    const dataPart = myRecord.replace(item.productId + "=", "");
    const parts = dataPart.split(";");
    status = parts[0] || status;
    riderName = parts[1] || "";
    riderPhone = parts[2] || "";
    vehicle = parts[3] || "";
    failureReason = parts[4] || "";
  }
  
  if (!riderName) {
    const seed = (sName + item.productId).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
    const names = ["Rashid Juma", "Amos Mwita", "Fatuma Ally", "Baraka Elias", "Neema John"];
    const phones = ["+255 788 123 456", "+255 765 432 109", "+255 655 987 654", "+255 712 345 678", "+255 744 555 666"];
    const vehicles = ["Bajaji T554 CDE", "Pikipiki MC 234 A", "Suzuki Carry T109 BCD", "Box Van T889 EF", "Pikipiki MC 890 B"];
    
    riderName = names[seed];
    riderPhone = phones[seed];
    vehicle = vehicles[seed];
  }
  
  return {
    status,
    riderName,
    riderPhone,
    vehicle,
    failureReason,
    sellerId: selId,
    sellerName: sName,
    sellerContact: seller?.email || "contact@" + sName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".co.tz",
    sellerPhone: seller?.phone || "+255 22 211 0000"
  };
}

interface ConsolidatedShippingAdminProps {
  currentStaff?: any;
}

export function ConsolidatedShippingAdmin({ currentStaff }: ConsolidatedShippingAdminProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useI18n();
  const { showAlert, showConfirm } = useDialog();

  const [searchQuery, setSearchQuery] = useState("");
  const [hubStatusFilter, setHubStatusFilter] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  
  // Selection for bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  const handleSelectOrder = (id: string, checked: boolean) => {
    setSelectedOrderIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const renderHubStatusBadge = (order: Order) => {
    const s = order.status;
    return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{s}</span>;
  };

  const renderOrderStatusBadge = (order: Order) => {
    const s = order.status;
    return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{s}</span>;
  };

  const openOrderUpdates = (order: Order) => {
    setActiveOrder(order);
    setShowUpdateModal(true);
  };
  
  // Modals / Dialog States
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState<"pallet" | "ship" | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Edit Form Fields for Single Order
  const [formHubStatus, setFormHubStatus] = useState("DELIVERED_TO_HUB");
  const [formHubNotes, setFormHubNotes] = useState("");
  const [formPalletId, setFormPalletId] = useState("");
  const [formShipmentDetails, setFormShipmentDetails] = useState("");
  const [formRiderName, setFormRiderName] = useState("");
  const [formRiderPhone, setFormRiderPhone] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [formItemInboundStates, setFormItemInboundStates] = useState<string>("");

  // Bulk Form Fields
  const [bulkPalletId, setBulkPalletId] = useState("");
  const [bulkShipmentDetails, setBulkShipmentDetails] = useState("");
  const [bulkRiderName, setBulkRiderName] = useState("");
  const [bulkRiderPhone, setBulkRiderPhone] = useState("");

  const isSw = lang === "sw";

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [fetched, fetchedProducts, fetchedSellers] = await Promise.all([
        db.getOrders(),
        db.getProducts(),
        db.getSellers()
      ]);
      setOrders(fetched || []);
      setProducts(fetchedProducts || []);
      setSellers(fetchedSellers || []);
    } catch (err) {
      console.error("Failed to load orders or catalog in ConsolidatedShippingAdmin", err);
      showAlert(isSw ? "Imeshindwa kupakia taarifa za oda na muuzaji." : "Failed to load orders or seller records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (expandedOrderId) {
      const order = orders.find(o => o.id === expandedOrderId);
      if (order) {
        const parsed = parseHubStatus(order.riderVehicle);
        setFormHubStatus(parsed.hubStatus);
        setFormHubNotes(parsed.hubNotes);
        setFormPalletId(parsed.palletId);
        setFormShipmentDetails(parsed.shipmentDetails);
        setFormRiderName(order.riderName || "");
        setFormRiderPhone(order.riderPhone || "");
        setFormItemInboundStates(parsed.itemInboundStates || "");
      }
    } else {
      setFormItemInboundStates("");
    }
  }, [expandedOrderId, orders]);

  // Helper: parse serialized HUB_STATUS from riderVehicle
  const parseHubStatus = (riderVehicle: string | undefined) => {
    if (!riderVehicle || !riderVehicle.startsWith("HUB_STATUS:")) {
      return { 
        hubStatus: "PENDING_DELIVERY", 
        hubNotes: "", 
        palletId: "", 
        shipmentDetails: "",
        arrivedTime: "",
        inspectedTime: "",
        packedTime: "",
        shippedTime: "",
        itemInboundStates: ""
      };
    }
    const parts = riderVehicle.split("||");
    let hubStatus = "PENDING_DELIVERY";
    let hubNotes = "";
    let palletId = "";
    let shipmentDetails = "";
    let arrivedTime = "";
    let inspectedTime = "";
    let packedTime = "";
    let shippedTime = "";
    let itemInboundStates = "";

    parts.forEach(part => {
      if (part.startsWith("HUB_STATUS:")) {
        hubStatus = part.replace("HUB_STATUS:", "");
      } else if (part.startsWith("NOTES:")) {
        hubNotes = part.replace("NOTES:", "");
      } else if (part.startsWith("PALL:")) {
        palletId = part.replace("PALL:", "");
      } else if (part.startsWith("SHIP:")) {
        shipmentDetails = part.replace("SHIP:", "");
      } else if (part.startsWith("ARR_TIME:")) {
        arrivedTime = part.replace("ARR_TIME:", "");
      } else if (part.startsWith("INS_TIME:")) {
        inspectedTime = part.replace("INS_TIME:", "");
      } else if (part.startsWith("PAC_TIME:")) {
        packedTime = part.replace("PAC_TIME:", "");
      } else if (part.startsWith("SHI_TIME:")) {
        shippedTime = part.replace("SHI_TIME:", "");
      } else if (part.startsWith("ITEMS_INB:")) {
        itemInboundStates = part.replace("ITEMS_INB:", "");
      }
    });

    return { 
      hubStatus, 
      hubNotes, 
      palletId, 
      shipmentDetails, 
      arrivedTime, 
      inspectedTime, 
      packedTime, 
      shippedTime,
      itemInboundStates
    };
  };

  // Helper: serialize HUB_STATUS to riderVehicle
  const serializeHubStatus = (
    hubStatus: string, 
    hubNotes: string, 
    palletId: string, 
    shipmentDetails: string,
    arrivedTime: string = "",
    inspectedTime: string = "",
    packedTime: string = "",
    shippedTime: string = "",
    itemInboundStates: string = ""
  ) => {
    return `HUB_STATUS:${hubStatus}||NOTES:${hubNotes}||PALL:${palletId}||SHIP:${shipmentDetails}||ARR_TIME:${arrivedTime}||INS_TIME:${inspectedTime}||PAC_TIME:${packedTime}||SHI_TIME:${shippedTime}||ITEMS_INB:${itemInboundStates}`;
  };

  // Helper: get timeline timestamps based on stored dates or realistic offset fallbacks
  const getTimelineTimestamps = (order: any) => {
    const baseDate = new Date(order.date || Date.now());
    
    // Check if we have saved times
    const parsed = parseHubStatus(order.riderVehicle);
    
    const addMinutes = (date: Date, mins: number) => {
      return new Date(date.getTime() + mins * 60000);
    };

    // Stored times or dynamic defaults
    const arrived = parsed.arrivedTime ? new Date(parsed.arrivedTime) : addMinutes(baseDate, 35);
    const inspected = parsed.inspectedTime ? new Date(parsed.inspectedTime) : addMinutes(baseDate, 85);
    const packed = parsed.packedTime ? new Date(parsed.packedTime) : addMinutes(baseDate, 175);
    const shipped = parsed.shippedTime ? new Date(parsed.shippedTime) : addMinutes(baseDate, 270);

    return { arrived, inspected, packed, shipped };
  };

  const renderTimelineStepper = (order: any) => {
    const { arrived, inspected, packed, shipped } = getTimelineTimestamps(order);
    const status = order.hubStatus;

    // Define steps
    // 1. Hub Arrival
    // 2. Inspection Pass (or fail)
    // 3. Packed
    // 4. In Transit
    
    const steps = [
      {
        key: "arrival",
        label: isSw ? "Kufika Ghalani" : "Hub Arrival",
        description: isSw ? "Oda imepokelewa na kuandikishwa" : "Received & scanned in",
        date: arrived,
        isActive: ["DELIVERED_TO_HUB", "PASSED", "FAILED", "RETURNED", "PALLET_PACKED", "SHIPPED"].includes(status),
        isCompleted: ["DELIVERED_TO_HUB", "PASSED", "FAILED", "RETURNED", "PALLET_PACKED", "SHIPPED"].includes(status),
        icon: "📥",
        color: "indigo"
      },
      {
        key: "inspection",
        label: status === "FAILED" || status === "RETURNED" 
          ? (isSw ? "Ubora Umefeli" : "Inspection Failed")
          : (isSw ? "Ubora Umepita" : "Inspection Pass"),
        description: status === "FAILED" || status === "RETURNED"
          ? (isSw ? "Imerejeshwa kwa muuzaji" : "Returned to seller")
          : (isSw ? "Ukaguzi wa QA umekamilika" : "QA checklist verified"),
        date: inspected,
        isActive: ["DELIVERED_TO_HUB", "PASSED", "FAILED", "RETURNED", "PALLET_PACKED", "SHIPPED"].includes(status),
        isCompleted: ["PASSED", "FAILED", "RETURNED", "PALLET_PACKED", "SHIPPED"].includes(status),
        icon: status === "FAILED" || status === "RETURNED" ? "❌" : "✓",
        color: status === "FAILED" || status === "RETURNED" ? "red" : "emerald"
      },
      {
        key: "packed",
        label: isSw ? "Kwenye Paleti" : "Packed",
        description: isSw ? `Imefungwa Paleti: ${order.palletId || "N/A"}` : `Consolidated to Pallet: ${order.palletId || "N/A"}`,
        date: packed,
        isActive: ["PASSED", "PALLET_PACKED", "SHIPPED"].includes(status),
        isCompleted: ["PALLET_PACKED", "SHIPPED"].includes(status),
        icon: "📦",
        color: "purple"
      },
      {
        key: "transit",
        label: isSw ? "Njia Kwenda Kwako" : "In Transit",
        description: isSw ? "Mteja amearifiwa, gari linaondoka" : "Container dispatched to destination",
        date: shipped,
        isActive: ["PALLET_PACKED", "SHIPPED"].includes(status),
        isCompleted: status === "SHIPPED",
        icon: "🚚",
        color: "blue"
      }
    ];

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(lang === "sw" ? "sw-TZ" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    return (
      <div className="relative py-4">
        {/* Progress Line */}
        <div className="absolute top-[39px] left-8 right-8 h-1 bg-slate-100 -z-10 hidden md:block">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-blue-500 transition-all duration-500"
            style={{
              width: status === "PENDING_DELIVERY" ? "0%" 
                : status === "DELIVERED_TO_HUB" ? "12%"
                : ["PASSED", "FAILED", "RETURNED"].includes(status) ? "45%"
                : status === "PALLET_PACKED" ? "78%"
                : "100%"
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const isDone = step.isCompleted;
            const isCurrent = step.isActive && !step.isCompleted;
            const isPending = !step.isActive;

            return (
              <div 
                key={step.key} 
                className={`flex md:flex-col items-start md:items-center text-left md:text-center gap-4 relative ${
                  isPending ? "opacity-40" : "opacity-100"
                }`}
              >
                {/* Visual Indicator Bubble */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 shadow-sm shrink-0 transition ${
                    isDone 
                      ? step.color === "red" 
                        ? "bg-red-50 text-red-600 border-red-500 ring-4 ring-red-50"
                        : "bg-emerald-50 text-emerald-600 border-emerald-500 ring-4 ring-emerald-50"
                      : isCurrent 
                        ? "bg-indigo-600 text-white border-indigo-600 animate-pulse ring-4 ring-indigo-50"
                        : "bg-white text-slate-300 border-slate-200"
                  }`}
                >
                  {isDone ? step.icon : (idx + 1)}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center md:justify-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                      {step.label}
                    </span>
                    {isDone && (
                      <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-1 rounded">
                        {isSw ? "Tayari" : "Done"}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="bg-indigo-100 text-indigo-800 text-[8px] font-black uppercase px-1 rounded animate-pulse">
                        {isSw ? "Sasa" : "Active"}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-500 font-semibold max-w-[180px] leading-tight">
                    {step.description}
                  </p>

                  {/* Timestamp info */}
                  {step.isActive && (
                    <div className="font-mono text-[9px] text-slate-400 font-bold pt-0.5 space-y-0.5">
                      <span className="block">{formatDate(step.date)}</span>
                      <span className="block text-slate-500 font-black">{formatTime(step.date)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Process and filter orders
  const processedOrders = useMemo(() => {
    return orders.map(order => {
      const parsed = parseHubStatus(order.riderVehicle);
      // Let's identify if it is a multi-seller order or routed to hub.
      // Multiple items with different sellers, or we can assume any order can be hub-routed.
      // But typically orders from multi-seller checkouts are routed to hub by default.
      // If we look at order legacyId or items or if it has some custom payload.
      const isMultiSeller = order.items && order.items.length > 1; // simple rule for multi-seller / consolidated candidates
      
      return {
        ...order,
        isMultiSeller,
        ...parsed
      };
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return processedOrders.filter(order => {
      // Search term match
      const query = searchQuery.toLowerCase();
      const customerName = (order.customerDetails?.name || "").toLowerCase();
      const orderId = order.id.toLowerCase();
      const phone = (order.customerDetails?.phone || "").toLowerCase();
      
      const matchesSearch = customerName.includes(query) || orderId.includes(query) || phone.includes(query);
      
      // Hub Status filter
      const matchesHub = hubStatusFilter === "all" || order.hubStatus === hubStatusFilter;
      
      // Main Order Status filter
      const matchesMain = orderStatusFilter === "all" || (order.status || "").toLowerCase() === orderStatusFilter.toLowerCase();
      
      return matchesSearch && matchesHub && matchesMain;
    });
  }, [processedOrders, searchQuery, hubStatusFilter, orderStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let total = 0;
    let pendingHub = 0;
    let inspecting = 0;
    let passed = 0;
    let failed = 0;
    let palletPacked = 0;
    let shipped = 0;

    processedOrders.forEach(o => {
      total++;
      if (o.hubStatus === "PENDING_DELIVERY") pendingHub++;
      else if (o.hubStatus === "DELIVERED_TO_HUB") inspecting++;
      else if (o.hubStatus === "PASSED" || o.hubStatus === "INSPECTED") passed++;
      else if (o.hubStatus === "FAILED" || o.hubStatus === "RETURNED") failed++;
      else if (o.hubStatus === "PALLET_PACKED") palletPacked++;
      else if (o.hubStatus === "SHIPPED") shipped++;
    });

    return { total, pendingHub, inspecting, passed, failed, palletPacked, shipped };
  }, [processedOrders]);

  // Handle single order update form load
  const openUpdateModal = (order: any) => {
    setActiveOrder(order);
    setFormHubStatus(order.hubStatus);
    setFormHubNotes(order.hubNotes);
    setFormPalletId(order.palletId);
    setFormShipmentDetails(order.shipmentDetails);
    setFormRiderName(order.riderName || "");
    setFormRiderPhone(order.riderPhone || "");
    setFormItemInboundStates(order.itemInboundStates || "");
    setShowUpdateModal(true);
  };

  const notifySellersIfFailed = async (order: any, itemStates: string) => {
    try {
      for (const item of order.items) {
        const details = getItemInboundDetails(order, item, products, sellers, itemStates, formHubStatus);
        if (details.status === "FAILED_QA" || details.status === "FAILED") {
          const sellerId = details.sellerId;
          if (sellerId) {
            const conversation = await startConversation([
              { id: "support", name: "Orbi Support", role: "admin" },
              { id: sellerId, name: details.sellerName, role: "seller" }
            ]);
            if (conversation && conversation.id) {
              await sendChatMessage(conversation.id, {
                senderId: "support",
                senderRole: "admin",
                senderName: "Orbi Hub Inspector",
                content: `⚠️ HUB INSPECTION ALERT:\nOrder #${order.id.split("-")[0].toUpperCase()} item "${item.name}" FAILED quality control checks at the Hub.\nReason: "${details.failureReason || "Item arrived defective or incorrect"}"\nImmediate action is required. Please check your Fulfillment Stream to coordinate a return.`
              });
            }
          }
        }
      }
    } catch (chatErr) {
      console.warn("Could not dispatch automated failure notifications:", chatErr);
    }
  };

  // Save single order update
  const handleSaveSingleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    try {
      const parsed = parseHubStatus(activeOrder.riderVehicle);
      let arrivedTime = parsed.arrivedTime || "";
      let inspectedTime = parsed.inspectedTime || "";
      let packedTime = parsed.packedTime || "";
      let shippedTime = parsed.shippedTime || "";

      const nowStr = new Date().toISOString();

      if (formHubStatus === "DELIVERED_TO_HUB") {
        if (!arrivedTime) arrivedTime = nowStr;
      } else if (["PASSED", "FAILED", "RETURNED", "INSPECTED"].includes(formHubStatus)) {
        if (!arrivedTime) arrivedTime = nowStr;
        if (!inspectedTime) inspectedTime = nowStr;
      } else if (formHubStatus === "PALLET_PACKED") {
        if (!arrivedTime) arrivedTime = nowStr;
        if (!inspectedTime) inspectedTime = nowStr;
        if (!packedTime) packedTime = nowStr;
      } else if (formHubStatus === "SHIPPED") {
        if (!arrivedTime) arrivedTime = nowStr;
        if (!inspectedTime) inspectedTime = nowStr;
        if (!packedTime) packedTime = nowStr;
        if (!shippedTime) shippedTime = nowStr;
      }

      const serialized = serializeHubStatus(
        formHubStatus, 
        formHubNotes, 
        formPalletId, 
        formShipmentDetails,
        arrivedTime,
        inspectedTime,
        packedTime,
        shippedTime,
        formItemInboundStates
      );
      
      // If hub status is SHIPPED, we should optionally prompt or advance the main order status to "shipped"
      let newStatus = activeOrder.status;
      if (formHubStatus === "SHIPPED" && activeOrder.status !== "shipped" && activeOrder.status !== "delivered") {
        newStatus = "shipped";
      }

      await db.saveOrder({
        id: activeOrder.id,
        riderVehicle: serialized,
        riderName: formRiderName || "Orbi Hub Logistics",
        riderPhone: formRiderPhone || "ORBI-HUB-01",
        status: newStatus
      });

      await notifySellersIfFailed(activeOrder, formItemInboundStates);

      showAlert(
        isSw ? "Hali ya oda imesasishwa kikamilifu!" : "Consolidated shipping details updated successfully!",
        "success"
      );
      setShowUpdateModal(false);
      loadOrders();
    } catch (err: any) {
      console.error(err);
      showAlert(isSw ? `Makosa: ${err.message}` : `Error: ${err.message}`, "error");
    }
  };

  // Save updates made directly from the broader inline detail view
  const handleSaveExpandedUpdate = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setLoading(true);
    try {
      const parsed = parseHubStatus(order.riderVehicle);
      let arrivedTime = parsed.arrivedTime || "";
      let inspectedTime = parsed.inspectedTime || "";
      let packedTime = parsed.packedTime || "";
      let shippedTime = parsed.shippedTime || "";

      const nowStr = new Date().toISOString();

      if (formHubStatus === "DELIVERED_TO_HUB") {
        if (!arrivedTime) arrivedTime = nowStr;
      } else if (["PASSED", "FAILED", "RETURNED", "INSPECTED"].includes(formHubStatus)) {
        if (!arrivedTime) arrivedTime = nowStr;
        if (!inspectedTime) inspectedTime = nowStr;
      } else if (formHubStatus === "PALLET_PACKED") {
        if (!arrivedTime) arrivedTime = nowStr;
        if (!inspectedTime) inspectedTime = nowStr;
        if (!packedTime) packedTime = nowStr;
      } else if (formHubStatus === "SHIPPED") {
        if (!arrivedTime) arrivedTime = nowStr;
        if (!inspectedTime) inspectedTime = nowStr;
        if (!packedTime) packedTime = nowStr;
        if (!shippedTime) shippedTime = nowStr;
      }

      const serialized = serializeHubStatus(
        formHubStatus, 
        formHubNotes, 
        formPalletId, 
        formShipmentDetails,
        arrivedTime,
        inspectedTime,
        packedTime,
        shippedTime,
        formItemInboundStates
      );
      
      let newStatus = order.status;
      if (formHubStatus === "SHIPPED" && order.status !== "shipped" && order.status !== "delivered") {
        newStatus = "shipped";
      }

      await db.saveOrder({
        id: order.id,
        riderVehicle: serialized,
        riderName: formRiderName || "Orbi Hub Logistics",
        riderPhone: formRiderPhone || "ORBI-HUB-01",
        status: newStatus
      });

      await notifySellersIfFailed(order, formItemInboundStates);

      showAlert(
        isSw ? "Hali ya oda na usafirishaji imesasishwa kikamilifu!" : "Hub operations and transport logistics saved successfully!",
        "success"
      );
      loadOrders();
    } catch (err: any) {
      console.error(err);
      showAlert(isSw ? `Makosa: ${err.message}` : `Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateItemInboundField = (productId: string, updates: { status?: string, riderName?: string, riderPhone?: string, vehicle?: string, failureReason?: string }) => {
    const itemRecords = formItemInboundStates.split(",").filter(Boolean);
    const existingIndex = itemRecords.findIndex(r => r.startsWith(productId + "="));
    
    let status = "PENDING";
    let riderName = "";
    let riderPhone = "";
    let vehicle = "";
    let failureReason = "";
    
    if (existingIndex !== -1) {
      const parts = itemRecords[existingIndex].replace(productId + "=", "").split(";");
      status = parts[0] || "PENDING";
      riderName = parts[1] || "";
      riderPhone = parts[2] || "";
      vehicle = parts[3] || "";
      failureReason = parts[4] || "";
    } else {
      const activeOrd = orders.find(o => o.id === expandedOrderId);
      if (activeOrd) {
        const item = activeOrd.items?.find((i: any) => i.productId === productId || i.id === productId);
        if (item) {
          const defaults = getItemInboundDetails(activeOrd, item, products, sellers, "", formHubStatus);
          status = defaults.status;
          riderName = defaults.riderName;
          riderPhone = defaults.riderPhone;
          vehicle = defaults.vehicle;
          failureReason = defaults.failureReason;
        }
      }
    }
    
    if (updates.status !== undefined) status = updates.status;
    if (updates.riderName !== undefined) riderName = updates.riderName;
    if (updates.riderPhone !== undefined) riderPhone = updates.riderPhone;
    if (updates.vehicle !== undefined) vehicle = updates.vehicle;
    if (updates.failureReason !== undefined) failureReason = updates.failureReason;
    
    const newRecord = `${productId}=${status};${riderName};${riderPhone};${vehicle};${failureReason}`;
    
    if (existingIndex !== -1) {
      itemRecords[existingIndex] = newRecord;
    } else {
      itemRecords.push(newRecord);
    }
    
    setFormItemInboundStates(itemRecords.join(","));
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelect = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Bulk Arrive at Hub
  const handleBulkArriveAtHub = async () => {
    if (selectedOrderIds.length === 0) {
      showAlert(isSw ? "Tafadhali chagua angalau oda moja." : "Please select at least one order.", "warning");
      return;
    }

    const confirm = await showConfirm(
      isSw 
        ? `Je, una uhakika unataka kuandikisha oda hizi ${selectedOrderIds.length} zimefika Ghalani (Hub)?`
        : `Are you sure you want to mark these ${selectedOrderIds.length} orders as Arrived at Hub?`
    );

    if (!confirm) return;

    setLoading(true);
    try {
      const nowStr = new Date().toISOString();
      for (const id of selectedOrderIds) {
        const order = orders.find(o => o.id === id);
        if (order) {
          const parsed = parseHubStatus(order.riderVehicle);
          const serialized = serializeHubStatus(
            "DELIVERED_TO_HUB", 
            parsed.hubNotes || "Bulk received at hub", 
            parsed.palletId, 
            parsed.shipmentDetails,
            parsed.arrivedTime || nowStr,
            parsed.inspectedTime,
            parsed.packedTime,
            parsed.shippedTime
          );
          await db.saveOrder({
            id: order.id,
            riderVehicle: serialized
          });
        }
      }
      showAlert(isSw ? "Oda zote zimeandikishwa ghalani!" : "Selected orders marked as Received at Hub!", "success");
      setSelectedOrderIds([]);
      loadOrders();
    } catch (err: any) {
      console.error(err);
      showAlert(isSw ? "Kuna hitilafu iliyotokea." : "An error occurred during bulk update.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Pack to Pallet
  const handleBulkPackToPalletSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPalletId.trim()) {
      showAlert(isSw ? "Weka Namba ya Paleti." : "Please enter a Pallet ID.", "warning");
      return;
    }

    setLoading(true);
    try {
      const nowStr = new Date().toISOString();
      for (const id of selectedOrderIds) {
        const order = orders.find(o => o.id === id);
        if (order) {
          const parsed = parseHubStatus(order.riderVehicle);
          const arrived = parsed.arrivedTime || nowStr;
          const inspected = parsed.inspectedTime || nowStr;
          const serialized = serializeHubStatus(
            "PALLET_PACKED", 
            parsed.hubNotes, 
            bulkPalletId.trim(), 
            parsed.shipmentDetails,
            arrived,
            inspected,
            parsed.packedTime || nowStr,
            parsed.shippedTime
          );
          await db.saveOrder({
            id: order.id,
            riderVehicle: serialized
          });
        }
      }
      showAlert(isSw ? "Paleti imefungwa na oda zimeunganishwa!" : "Pallet packing updated successfully for selected orders!", "success");
      setShowBulkModal(null);
      setBulkPalletId("");
      setSelectedOrderIds([]);
      loadOrders();
    } catch (err: any) {
      console.error(err);
      showAlert(isSw ? "Kuna hitilafu iliyotokea." : "An error occurred during bulk update.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Consolidated Dispatch Shipping
  const handleBulkShipSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkShipmentDetails.trim()) {
      showAlert(isSw ? "Weka maelezo ya usafirishaji." : "Please enter shipment carrier/dispatch details.", "warning");
      return;
    }

    setLoading(true);
    try {
      const nowStr = new Date().toISOString();
      for (const id of selectedOrderIds) {
        const order = orders.find(o => o.id === id);
        if (order) {
          const parsed = parseHubStatus(order.riderVehicle);
          const arrived = parsed.arrivedTime || nowStr;
          const inspected = parsed.inspectedTime || nowStr;
          const packed = parsed.packedTime || nowStr;
          const serialized = serializeHubStatus(
            "SHIPPED", 
            parsed.hubNotes, 
            parsed.palletId, 
            bulkShipmentDetails.trim(),
            arrived,
            inspected,
            packed,
            parsed.shippedTime || nowStr
          );
          
          await db.saveOrder({
            id: order.id,
            riderVehicle: serialized,
            riderName: bulkRiderName || "Consolidated Carrier",
            riderPhone: bulkRiderPhone || "ORBI-FLEET",
            status: "shipped" // Advance main state so customers are notified
          });
        }
      }
      showAlert(isSw ? "Msafara wa pamoja umeandikishwa na kusafirishwa!" : "Consolidated container shipped! Customers notified.", "success");
      setShowBulkModal(null);
      setBulkShipmentDetails("");
      setBulkRiderName("");
      setBulkRiderPhone("");
      setSelectedOrderIds([]);
      loadOrders();
    } catch (err: any) {
      console.error(err);
      showAlert(isSw ? "Kuna hitilafu iliyotokea." : "An error occurred during bulk dispatch.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-0 bg-[#f8fafc] text-slate-800 animate-in fade-in duration-300">
      
      {/* Dashboard Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-2xl text-lg font-bold">🏢</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isSw ? "Usafirishaji wa Pamoja Ghalani" : "Consolidated Cross-Dock Shipping"}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const exportData = filteredOrders.map(o => ({
                  OrderID: o.id,
                  CustomerName: o.customerInfo.name,
                  Phone: o.customerInfo.phone,
                  DeliveryRegion: o.shippingDetails?.address || o.customerInfo.region,
                  Status: o.status,
                  HubStatus: o.hubStatus || 'N/A',
                  Date: new Date(o.createdAt).toLocaleDateString()
                }));
                exportToCSV(exportData, `shipping_export_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="flex items-center gap-1.5 self-start md:self-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              <ArrowUpRight size={14} />
              <span>{isSw ? "Hamisha CSV" : "Export CSV"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-semibold max-w-2xl leading-relaxed">
            {isSw 
              ? "Kusanya, kagua ubora, funga kwenye paleti za pamoja na safirisha makontena ya oda za wauzaji wengi kwenda kwa mteja mara moja."
              : "Consolidate multi-seller checkouts, manage inbound hub receipt, run quality inspection checks, pack pallets, and ship consolidated containers."}
          </p>
        </div>
        
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 self-start md:self-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>{isSw ? "Pakua Upya" : "Reload Data"}</span>
        </button>
      </div>

      {/* Overview Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 shadow-xs transition hover:shadow-md">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
            <Boxes size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Oda Zote</span>
            <span className="text-lg font-black text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 shadow-xs transition hover:shadow-md">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <Building2 size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Ghalani (Transit)</span>
            <span className="text-lg font-black text-amber-700">{stats.pendingHub}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 shadow-xs transition hover:shadow-md">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <ClipboardList size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Inakaguliwa</span>
            <span className="text-lg font-black text-blue-700">{stats.inspecting}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 shadow-xs transition hover:shadow-md">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Passed Checks</span>
            <span className="text-lg font-black text-emerald-700">{stats.passed}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 shadow-xs transition hover:shadow-md">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Layers size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">Kwenye Paleti</span>
            <span className="text-lg font-black text-purple-700">{stats.palletPacked}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 shadow-xs transition hover:shadow-md">
          <div className="p-3 bg-orange-50 text-orange-700 rounded-2xl">
            <Truck size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider block">Zimesafiri</span>
            <span className="text-lg font-black text-orange-700">{stats.shipped}</span>
          </div>
        </div>

      </div>

      {/* Control Actions Panel & Search Filters */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl space-y-4 shadow-xs">
        
        {/* Filtering Options and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={isSw ? "Tafuta kwa Mteja, Namba ya Oda..." : "Search Customer, Order ID..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-semibold"
              />
            </div>

            {/* Hub Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{isSw ? "Hali ya Hub:" : "Hub Status:"}</span>
              <select
                value={hubStatusFilter}
                onChange={e => setHubStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white font-bold text-slate-700 outline-none"
              >
                <option value="all">{isSw ? "Zote" : "All"}</option>
                <option value="PENDING_DELIVERY">{isSw ? "Inasubiri Kuwasilishwa Hub" : "Pending Delivery to Hub"}</option>
                <option value="DELIVERED_TO_HUB">{isSw ? "Zilizofika Ghalani (Hub)" : "Arrived at Hub"}</option>
                <option value="PASSED">{isSw ? "Kipimo cha Ubora Kimepita" : "Inspection Passed"}</option>
                <option value="FAILED">{isSw ? "Kipimo cha Ubora Kimegonga" : "Inspection Failed"}</option>
                <option value="PALLET_PACKED">{isSw ? "Zilizowekwa Kwenye Paleti" : "Pallet Packed"}</option>
                <option value="SHIPPED">{isSw ? "Zilizosafirishwa kwa Mteja" : "Shipped Consolidated"}</option>
              </select>
            </div>

            {/* Main status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{isSw ? "Oda Kuu:" : "Main Order:"}</span>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white font-bold text-slate-700 outline-none"
              >
                <option value="all">{isSw ? "Zote" : "All"}</option>
                <option value="CREATED">{isSw ? "Mpya / Created" : "Created"}</option>
                <option value="PAYMENT_HELD">{isSw ? "Malipo Held" : "Payment Held"}</option>
                <option value="BUYER_CONFIRMED">{isSw ? "Mteja Ameidhinisha" : "Customer Confirmed"}</option>
                <option value="SHIPPED">{isSw ? "Zilizosafiri / Shipped" : "Shipped"}</option>
                <option value="DELIVERED">{isSw ? "Imewasilishwa" : "Delivered"}</option>
              </select>
            </div>

          </div>

          {/* Bulk Actions Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 border-t lg:border-t-0 pt-4 lg:pt-0">
            {selectedOrderIds.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-3 py-1.5 flex items-center gap-2.5 text-indigo-700 font-bold text-xs">
                <span>{selectedOrderIds.length} {isSw ? "Oda Zimechaguliwa" : "Selected"}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleBulkArriveAtHub}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                  >
                    📥 Arrive at Hub
                  </button>
                  <button
                    onClick={() => setShowBulkModal("pallet")}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                  >
                    📦 Pack to Pallet
                  </button>
                  <button
                    onClick={() => setShowBulkModal("ship")}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                  >
                    🚚 Ship Consolidated
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Master Tracking Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                </th>
                <th className="p-4">{isSw ? "Namba ya Oda" : "Order ID"}</th>
                <th className="p-4">{isSw ? "Mteja & Mahali" : "Customer & Address"}</th>
                <th className="p-4 text-center">{isSw ? "Vitu (Items)" : "Items"}</th>
                <th className="p-4">{isSw ? "Dau Kuu (Total)" : "Total"}</th>
                <th className="p-4">{isSw ? "Njia ya Malipo" : "Payment"}</th>
                <th className="p-4 text-center">{isSw ? "Hali ya Hub" : "Hub Tracking Status"}</th>
                <th className="p-4 text-center">{isSw ? "Oda Kuu" : "Main Status"}</th>
                <th className="p-4 text-right">{isSw ? "Kitendo" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    {isSw ? "Inatafuta na kuandaa duka la data..." : "Retrieving system ledger logs..."}
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    {isSw ? "Hakuna oda zinazolingana na utafutaji." : "No orders matching current filter parameters."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr className={`hover:bg-slate-50/50 transition border-b border-slate-50 ${isExpanded ? "bg-indigo-50/20" : ""}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => handleToggleSelect(order.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-slate-900 font-black block uppercase">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold font-mono">
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-800 font-bold block">{order.customerDetails?.name || "Premium Client"}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">{order.customerDetails?.address || "Dar Es Salaam"}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                            {order.items?.length || 0}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">
                          TZS {formatCurrency(order.total)}
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 inline-block uppercase font-bold">
                            {order.paymentMethodName || order.paymentMethod || "M-PESA"}
                          </span>
                        </td>
                        
                        {/* Hub Tracking Status Badge */}
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-extrabold uppercase border ${
                            order.hubStatus === "PENDING_DELIVERY" 
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : order.hubStatus === "DELIVERED_TO_HUB"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : order.hubStatus === "PASSED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : order.hubStatus === "FAILED" || order.hubStatus === "RETURNED"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : order.hubStatus === "PALLET_PACKED"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}>
                            {order.hubStatus === "PENDING_DELIVERY" && (isSw ? "Inasubiri Ghalani" : "Pending Hub")}
                            {order.hubStatus === "DELIVERED_TO_HUB" && (isSw ? "Imefika Ghalani" : "Arrived at Hub")}
                            {order.hubStatus === "PASSED" && (isSw ? "Ubora Umepita" : "Passed Q.A.")}
                            {order.hubStatus === "FAILED" && (isSw ? "Ubora Umefeli" : "Failed Q.A.")}
                            {order.hubStatus === "RETURNED" && (isSw ? "Imerejeshwa" : "Returned to Seller")}
                            {order.hubStatus === "PALLET_PACKED" && (isSw ? `Paleti: ${order.palletId || ""}` : `Pallet Packed (${order.palletId || "N/A"})`)}
                            {order.hubStatus === "SHIPPED" && (isSw ? "Inasafirishwa" : "Shipped")}
                          </span>
                        </td>

                        {/* Main Order Status Badge */}
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            order.status === "shipped" 
                              ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : order.status === "delivered"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : order.status === "confirmed"
                                  ? "bg-sky-100 text-sky-700 border border-sky-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {order.status}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              className={`px-2.5 py-1.5 border rounded-xl text-[10px] font-black flex items-center gap-1.5 transition cursor-pointer ${
                                isExpanded
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                              title={isSw ? "Angalia Ratiba" : "View Shipment Timeline"}
                            >
                              <Clock size={11} />
                              <span>{isSw ? "Ratiba" : "Timeline"}</span>
                              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>

                            <button
                              onClick={() => openUpdateModal(order)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-[10px] transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>{isSw ? "Sasisha Hub" : "Manage Hub"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Timeline Expandable Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 transition-all duration-300">
                          <td colSpan={9} className="p-6 border-b border-slate-100">
                            <div className="bg-white rounded-3xl border border-slate-150 p-8 shadow-xl space-y-8 animate-fade-in">
                              
                              {/* Header info */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black uppercase text-indigo-700 font-mono tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
                                      #{order.id.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-slate-300 font-bold">•</span>
                                    <span className="text-xs font-mono text-indigo-950 font-black tracking-wide uppercase">
                                      {isSw ? "Kituo Kikuu cha Udhibiti & Usafirishaji wa Pamoja" : "Consolidated Hub, Inbound Logistics & Fleet Dispatch"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">
                                    {isSw 
                                      ? "Dhibiti hifadhi ya ghalani, rekodi wauzaji, na amua njia ya msafirishaji wa mwisho kutoka kwenye jopo hili mapana."
                                      : "Broad dashboard to audit inbound seller delivery couriers, check items, approve quality control (QA), track pallets, and dispatch fleets."}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 self-start md:self-center">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
                                    {isSw ? "Paleti Iliyopangwa:" : "Pallet Assignment:"}
                                  </span>
                                  <span className="bg-white border border-slate-200 text-indigo-950 font-mono font-black px-3 py-1 rounded-xl text-xs shadow-3xs">
                                    {order.palletId || (isSw ? "Bado kupangwa" : "Unassigned")}
                                  </span>
                                </div>
                              </div>

                              {/* Timeline Stepper Component */}
                              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-4">
                                  {isSw ? "Safari ya Usafirishaji ya Pamoja (Timeline):" : "Consolidated Transit Journey Stepper:"}
                                </h4>
                                {renderTimelineStepper(order)}
                              </div>

                              {/* Massive Interactive 3-Column Workspace */}
                              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                
                                {/* COLUMN 1: Recipient Customer Destination & Outbound Transport */}
                                <div className="space-y-6 bg-slate-50/40 p-6 rounded-2xl border border-slate-100/70">
                                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                      <User size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                      {isSw ? "👤 Mpokeaji & Gari la Mwisho" : "Recipient & Last-Mile Fleet"}
                                    </h3>
                                  </div>

                                  {/* Customer Recipient details */}
                                  <div className="space-y-4 text-xs">
                                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
                                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                                        {isSw ? "Mteja Mpokeaji (Recipient):" : "Destination Recipient:"}
                                      </span>
                                      <p className="font-extrabold text-slate-800 text-sm">
                                        {order.customerDetails?.name || order.customer?.name || "Standard Buyer"}
                                      </p>
                                      <p className="font-bold text-slate-600 flex items-center gap-1.5">
                                        <Phone size={12} className="text-slate-400" />
                                        <span>{order.customerDetails?.phone || "No Phone Contact"}</span>
                                      </p>
                                      <p className="font-bold text-slate-600 flex items-center gap-1.5">
                                        <MapPin size={12} className="text-slate-400 shrink-0" />
                                        <span className="leading-tight">{order.customerDetails?.address || "No Delivery Address"}</span>
                                      </p>
                                      {order.customer_tin && (
                                        <p className="font-mono text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded inline-block">
                                          TIN: {order.customer_tin}
                                        </p>
                                      )}
                                    </div>

                                    {/* Financial & Shipping Zone Details */}
                                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
                                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                                        {isSw ? "Njia ya Usafirishaji na Malipo:" : "Shipping Route & Financials:"}
                                      </span>
                                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
                                        <div>
                                          <span className="text-slate-400 block text-[9px]">{isSw ? "Eneo:" : "Zone:"}</span>
                                          <span className="text-slate-800 font-extrabold">{order.deliveryZoneName || "SGR Consolidated Hub"}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[9px]">{isSw ? "Gharama ya Usafiri:" : "Delivery Fee:"}</span>
                                          <span className="text-slate-800 font-extrabold">{formatCurrency(order.deliveryFee)}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[9px]">{isSw ? "Malipo:" : "Method:"}</span>
                                          <span className="text-slate-800 font-extrabold">{order.paymentMethodName || order.paymentMethod || "COD"}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[9px]">{isSw ? "Jumla ya Oda:" : "Grand Total:"}</span>
                                          <span className="text-indigo-600 font-black">{formatCurrency(order.total)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Edit Outbound Courier parameters */}
                                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
                                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                                        {isSw ? "Msafirishaji wa Mwisho (Outbound Carrier):" : "Last-Mile Delivery Dispatch:"}
                                      </span>
                                      
                                      <div className="space-y-2">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                            {isSw ? "Jina la Dereva / Carrier:" : "Driver Name / Carrier:"}
                                          </label>
                                          <input
                                            type="text"
                                            value={formRiderName}
                                            onChange={(e) => setFormRiderName(e.target.value)}
                                            placeholder="e.g. Orbi Logistics Fleet 12"
                                            className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                            {isSw ? "Simu ya Dereva / Kielelezo:" : "Driver Phone / Dispatch Ref:"}
                                          </label>
                                          <input
                                            type="text"
                                            value={formRiderPhone}
                                            onChange={(e) => setFormRiderPhone(e.target.value)}
                                            placeholder="e.g. +255 765 888 999"
                                            className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* COLUMN 2: Inbound products with their sellers and courier info */}
                                <div className="space-y-6 bg-slate-50/40 p-6 rounded-2xl border border-slate-100/70 xl:col-span-1">
                                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                      <Building2 size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                      {isSw ? "🏪 Bidhaa, Wauzaji na Courier" : "Catalog & Inbound Sellers"}
                                    </h3>
                                  </div>

                                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                    {order.items.map((item, idx) => {
                                      const details = getItemInboundDetails(order, item, products, sellers, formItemInboundStates, formHubStatus);
                                      return (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-150 shadow-3xs space-y-3.5">
                                          {/* Product info */}
                                          <div className="flex justify-between items-start gap-2 border-b border-slate-50 pb-2">
                                            <div className="space-y-0.5">
                                              <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2">
                                                {item.name}
                                              </h4>
                                              <p className="text-[10px] text-slate-400 font-bold font-mono">
                                                Qty: {item.quantity} × {formatCurrency(item.price)}
                                              </p>
                                            </div>
                                            <span className="text-xs font-black text-slate-900 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-mono">
                                              {formatCurrency(item.price * item.quantity)}
                                            </span>
                                          </div>

                                          {/* Seller Details (Recipient Seller) */}
                                          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] font-black uppercase text-indigo-700 font-mono tracking-wider">
                                                {isSw ? "MUUZAJI (RECIPIENT SELLER):" : "RECIPIENT SELLER:"}
                                              </span>
                                              <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded text-[8px] uppercase">
                                                {isSw ? "Msambazaji" : "Merchant"}
                                              </span>
                                            </div>
                                            <p className="font-extrabold text-slate-800 flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                              {details.sellerName}
                                            </p>
                                            <p className="text-slate-500 font-medium font-mono text-[10px]">Contact: {details.sellerContact}</p>
                                            <p className="text-slate-500 font-medium font-mono text-[10px]">Phone: {details.sellerPhone}</p>
                                          </div>

                                          {/* Inbound Courier details (Who delivered it) */}
                                          <div className="space-y-2 pt-1 border-t border-dashed border-slate-100">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                                                {isSw ? "Nani alileta (Who Delivered It):" : "Who Delivered to Hub:"}
                                              </span>
                                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                                                details.status === "ARRIVED" 
                                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                                  : details.status === "FAILED_QA"
                                                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                                                  : details.status === "IN_TRANSIT"
                                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                                              }`}>
                                                {details.status}
                                              </span>
                                            </div>

                                            {/* Live Inputs for Inbound Courier Rider */}
                                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                              <div>
                                                <label className="text-[8px] font-bold text-slate-400 block">{isSw ? "Jina la Rider:" : "Rider Name:"}</label>
                                                <input
                                                  type="text"
                                                  value={details.riderName}
                                                  onChange={(e) => updateItemInboundField(item.productId || item.id, { riderName: e.target.value })}
                                                  placeholder="e.g. Amos Mwita"
                                                  className="w-full p-1 border border-slate-200 rounded text-[10px] font-bold bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[8px] font-bold text-slate-400 block">{isSw ? "Simu / Simu:" : "Rider Phone:"}</label>
                                                <input
                                                  type="text"
                                                  value={details.riderPhone}
                                                  onChange={(e) => updateItemInboundField(item.productId || item.id, { riderPhone: e.target.value })}
                                                  placeholder="e.g. +255 765..."
                                                  className="w-full p-1 border border-slate-200 rounded text-[10px] font-bold bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                                />
                                              </div>
                                              <div className="col-span-2 grid grid-cols-5 gap-1 pt-1">
                                                <div className="col-span-3">
                                                  <label className="text-[8px] font-bold text-slate-400 block">{isSw ? "Gari / Pikipiki:" : "Bajaj / Vehicle Plate:"}</label>
                                                  <input
                                                    type="text"
                                                    value={details.vehicle}
                                                    onChange={(e) => updateItemInboundField(item.productId || item.id, { vehicle: e.target.value })}
                                                    placeholder="e.g. Bajaj T554 CDE"
                                                    className="w-full p-1 border border-slate-200 rounded text-[10px] font-bold bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                                  />
                                                </div>
                                                <div className="col-span-2">
                                                  <label className="text-[8px] font-bold text-slate-400 block">{isSw ? "Inbound Hub:" : "Inbound Status:"}</label>
                                                  <select
                                                    value={details.status}
                                                    onChange={(e) => updateItemInboundField(item.productId || item.id, { status: e.target.value })}
                                                    className="w-full p-1 border border-slate-200 rounded text-[10px] font-bold bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                                  >
                                                    <option value="PENDING">{isSw ? "Inasubiriwa" : "Pending"}</option>
                                                    <option value="IN_TRANSIT">{isSw ? "Njia ya Ghala" : "In Transit"}</option>
                                                    <option value="ARRIVED">{isSw ? "Imewasili" : "Arrived"}</option>
                                                    <option value="FAILED_QA">{isSw ? "Ilikataliwa" : "Failed QA"}</option>
                                                  </select>
                                                </div>
                                              </div>

                                              {/* Interactive Quality Assurance & Inspection Panel */}
                                              <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[9px] font-black uppercase text-indigo-750 font-mono tracking-wider">
                                                    {isSw ? "🔎 UKAGUZI WA UBORA (QA CHECK):" : "🔎 HUB QUALITY INSPECTION (QA Check):"}
                                                  </span>
                                                  <span className="text-[8px] text-slate-400 font-bold">
                                                    {isSw ? "Mchunguzi Bonyeza" : "Inspector Click"}
                                                  </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                  {/* PASS BUTTON */}
                                                  <button
                                                    type="button"
                                                    onClick={() => updateItemInboundField(item.productId || item.id, { status: "ARRIVED", failureReason: "" })}
                                                    className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                                                      details.status === "ARRIVED"
                                                        ? "bg-emerald-600 text-white shadow-sm font-black"
                                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                                                    }`}
                                                  >
                                                    <Check size={11} className={details.status === "ARRIVED" ? "stroke-[3]" : ""} />
                                                    {isSw ? "Imepita" : "Pass Check"}
                                                  </button>

                                                  {/* FAIL BUTTON */}
                                                  <button
                                                    type="button"
                                                    onClick={() => updateItemInboundField(item.productId || item.id, { status: "FAILED_QA" })}
                                                    className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                                                      details.status === "FAILED_QA"
                                                        ? "bg-rose-600 text-white shadow-sm font-black"
                                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                                                    }`}
                                                  >
                                                    <X size={11} className={details.status === "FAILED_QA" ? "stroke-[3]" : ""} />
                                                    {isSw ? "Imefeli" : "Fail Check"}
                                                  </button>
                                                </div>

                                                {/* IF FAIL: REASON FOR FAILURE INPUT */}
                                                {details.status === "FAILED_QA" && (
                                                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                    <label className="text-[8px] font-black uppercase text-rose-700 block">
                                                      {isSw ? "SABABU YA KUFELI (REASON):" : "REASON FOR FAILURE:"}
                                                    </label>
                                                    <input
                                                      type="text"
                                                      value={details.failureReason}
                                                      onChange={(e) => updateItemInboundField(item.productId || item.id, { failureReason: e.target.value })}
                                                      placeholder={isSw ? "Andika sababu ya kufeli hapa..." : "Write failure reason..."}
                                                      className="w-full p-1.5 border border-rose-300 rounded text-[9px] font-bold bg-rose-50 text-rose-900 placeholder-rose-400 focus:outline-rose-500 focus:bg-white"
                                                    />

                                                    {/* Quick Failure reasons */}
                                                    <div className="flex flex-wrap gap-1">
                                                      {[
                                                        { label: isSw ? "Imeharibika" : "Damaged", val: "Physical damage to retail item packaging" },
                                                        { label: isSw ? "Sio Yenyewe" : "Incorrect", val: "Incorrect item model, size or specifications" },
                                                        { label: isSw ? "Inapungua" : "Incomplete", val: "Missing components or auxiliary pieces" },
                                                        { label: isSw ? "Feki" : "Counterfeit", val: "Suspected non-genuine brand quality issue" }
                                                      ].map((t, idx) => (
                                                        <button
                                                          key={idx}
                                                          type="button"
                                                          onClick={() => updateItemInboundField(item.productId || item.id, { failureReason: t.val })}
                                                          className="text-[7.5px] font-extrabold px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                                                        >
                                                          {t.label}
                                                        </button>
                                                      ))}
                                                    </div>
                                                    <p className="text-[8px] text-rose-600 font-bold leading-tight">
                                                      {isSw 
                                                        ? "★ Muuzaji atajulishwa mara moja duka lake likihifadhiwa." 
                                                        : "★ Seller gets notified immediately in Support Chat upon save."}
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* COLUMN 3: Hub QA, pallet and status controls */}
                                <div className="space-y-6 bg-slate-50/40 p-6 rounded-2xl border border-slate-100/70">
                                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                      <ClipboardList size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                      {isSw ? "⚙️ Udhibiti wa Ghala na QA" : "Hub Quality Assurance & Status"}
                                    </h3>
                                  </div>

                                  <div className="space-y-4 text-xs">
                                    {/* Overall status selector */}
                                    <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
                                      <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                                        {isSw ? "Hali ya Pamoja ya Usafirishaji:" : "Consolidated Hub Status:"}
                                      </label>
                                      <select
                                        value={formHubStatus}
                                        onChange={(e) => setFormHubStatus(e.target.value)}
                                        className="w-full text-xs font-black border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-indigo-950 focus:bg-white focus:outline-indigo-500"
                                      >
                                        <option value="PENDING_DELIVERY">{isSw ? "Inasubiri Kufika Ghalani (Pending Inbound)" : "Awaiting Inbound Seller Deliveries"}</option>
                                        <option value="DELIVERED_TO_HUB">{isSw ? "Yote Yamefika - Ukaguzi Unaanza" : "All Arrived - Undergoing QA Checks"}</option>
                                        <option value="PASSED">{isSw ? "Yamepita Ukaguzi (Passed QA)" : "Passed Quality Control Checklist"}</option>
                                        <option value="FAILED">{isSw ? "Yamekataliwa (Failed QA)" : "Failed Inspection / Cargo Exception"}</option>
                                        <option value="PALLET_PACKED">{isSw ? "Imepakiwa Kwenye Paleti (Palletized)" : "Palletized & Wrapped for Transit"}</option>
                                        <option value="SHIPPED">{isSw ? "Yamesafirishwa (Dispatched / Shipped)" : "Dispatched on Consolidated Cargo Fleet"}</option>
                                      </select>
                                    </div>

                                    {/* QA checklist */}
                                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-3xs text-[11px] text-slate-600 font-bold">
                                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-2">
                                        {isSw ? "Orodha ya Ukaguzi wa Ghala:" : "Cross-Dock Verification Checklist:"}
                                      </span>
                                      <label className="flex items-center gap-2 cursor-pointer py-1 hover:text-slate-900">
                                        <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0" />
                                        <span>{isSw ? "Idadi ya bidhaa imelingana na manifest" : "Verify item quantities match order manifest"}</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer py-1 hover:text-slate-900">
                                        <input type="checkbox" defaultChecked={["PASSED", "PALLET_PACKED", "SHIPPED"].includes(formHubStatus)} className="rounded text-indigo-600 focus:ring-0" />
                                        <span>{isSw ? "Ufungaji hauna uharibifu wowote" : "Confirm packing boxes are secure & undamaged"}</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer py-1 hover:text-slate-900">
                                        <input type="checkbox" defaultChecked={["PASSED", "PALLET_PACKED", "SHIPPED"].includes(formHubStatus)} className="rounded text-indigo-600 focus:ring-0" />
                                        <span>{isSw ? "Nambari za QR / Barcode zimeskaniwa" : "Scan barcodes / apply cross-dock route labeling"}</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer py-1 hover:text-slate-900">
                                        <input type="checkbox" defaultChecked={["PALLET_PACKED", "SHIPPED"].includes(formHubStatus)} className="rounded text-indigo-600 focus:ring-0" />
                                        <span>{isSw ? "Chombo cha pamoja (Pallet) kimefungwa" : "Pallet wrapper & transit seal secured"}</span>
                                      </label>
                                    </div>

                                    {/* Pallet Assignment & Notes */}
                                    <div className="space-y-2.5 bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-1">
                                          {isSw ? "Nambari ya Paleti:" : "Assign Pallet ID / Container:"}
                                        </label>
                                        <input
                                          type="text"
                                          value={formPalletId}
                                          onChange={(e) => setFormPalletId(e.target.value)}
                                          placeholder="e.g. PAL-TZ-908"
                                          className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-1">
                                          {isSw ? "Maelezo / Maoni ya Ghala:" : "Hub Receiving & Inspection Notes:"}
                                        </label>
                                        <textarea
                                          value={formHubNotes}
                                          onChange={(e) => setFormHubNotes(e.target.value)}
                                          placeholder={isSw ? "e.g. Mzigo wote umewasili kwa usalama, ukiwa na ubora vya kutosha." : "e.g. All seller consignments arrived safely. Verified weight: 14.5 kg."}
                                          rows={2}
                                          className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 resize-none"
                                        />
                                      </div>
                                    </div>

                                  </div>
                                </div>

                              </div>

                              {/* Action Footer Bar */}
                              <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(null)}
                                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-extrabold rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                                >
                                  {isSw ? "Funga Jopo" : "Close Panel"}
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleSaveExpandedUpdate(order.id)}
                                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {loading ? (
                                    <>
                                      <RefreshCw className="animate-spin" size={14} />
                                      <span>{isSw ? "Inahifadhi..." : "Saving..."}</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={14} />
                                      <span>{isSw ? "Hifadhi Mabadiliko" : "Save Logistics & Transport"}</span>
                                    </>
                                  )}
                                </button>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
          {/* Mobile view for orders */}
          <div className="md:hidden flex flex-col gap-4 mt-4">
            {loading ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                {isSw ? "Inatafuta na kuandaa duka la data..." : "Retrieving system ledger logs..."}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                <Boxes size={32} className="mx-auto mb-2 opacity-50" />
                {isSw ? "Hakuna oda inayokidhi vigezo hivi kwa sasa." : "No orders matching current filter criteria."}
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col gap-3 relative">
                   <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={e => handleSelectOrder(order.id, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                   </div>
                   <div className="pr-8">
                     <div className="font-mono text-slate-400 text-[10px] mb-1">{new Date(order.date).toLocaleString()}</div>
                     <div className="font-bold text-slate-800 break-all">{order.id}</div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 text-xs">
                     <div>
                       <div className="text-slate-500 font-bold">{isSw ? "Mteja" : "Customer"}</div>
                       <div className="font-semibold text-slate-800">{order.customerInfo.name}</div>
                       <div className="text-slate-500">{order.customerInfo.phone}</div>
                       <div className="text-slate-500 line-clamp-1">{order.shippingDetails?.address || order.customerInfo.region}</div>
                     </div>
                     <div>
                       <div className="text-slate-500 font-bold">{isSw ? "Kiasi" : "Total"}</div>
                       <div className="font-black text-indigo-700">{formatCurrency(order.total)}</div>
                       <div className="mt-1">
                         {order.paymentMethod === 'PAYSAFE' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-black text-[9px] border border-emerald-100">PAYSAFE</span>
                          ) : (
                            <span className="text-slate-500 font-medium text-[10px]">{order.paymentMethod}</span>
                          )}
                       </div>
                     </div>
                   </div>

                   <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mt-2">
                     <div className="flex flex-col gap-1">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Hub Status</div>
                       {renderHubStatusBadge(order.hubStatus)}
                     </div>
                     <div className="flex flex-col gap-1 items-end">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Main Status</div>
                       {renderOrderStatusBadge(order.status)}
                     </div>
                   </div>

                   <div className="mt-2 flex justify-end">
                     <button
                        onClick={() => openOrderUpdates(order)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg transition"
                      >
                        {isSw ? "Fungua" : "Manage"} <ArrowRight size={14} />
                      </button>
                   </div>
                </div>
              ))
            )}
          </div>


      </div>

      {/* SINGLE ORDER UPDATE MODAL */}
      {showUpdateModal && activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Update Hub State</span>
                <h3 className="text-sm font-black tracking-tight">
                  {isSw ? `Usimamizi wa Ghalani: Oda #${activeOrder.id.slice(0, 8).toUpperCase()}` : `Manage Consolidation Hub: Order #${activeOrder.id.slice(0, 8).toUpperCase()}`}
                </h3>
              </div>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveSingleUpdate} className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{isSw ? "Mteja wetu:" : "Client Detail:"}</span>
                  <span className="font-bold text-slate-800">{activeOrder.customerDetails?.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{isSw ? "Anwani ya Mteja:" : "Destination Address:"}</span>
                  <span className="font-bold text-slate-800 text-right max-w-[280px] truncate">{activeOrder.customerDetails?.address}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-400">{isSw ? "Orodha ya Bidhaa:" : "Products included:"}</span>
                  <span className="font-mono font-black text-slate-900">({activeOrder.items?.length || 0} items)</span>
                </div>
                <div className="space-y-1 pt-1">
                  {activeOrder.items?.map((item, idx) => (
                    <div key={idx} className="text-[10px] font-bold text-indigo-950 flex justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                      <span>• {item.name}</span>
                      <span className="font-mono text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Stepper Preview */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  {isSw ? "Hakiki ya Mabadiliko ya Ratiba (Live Timeline Preview):" : "Live Shipment Timeline Status Preview:"}
                </div>
                {renderTimelineStepper({
                  ...activeOrder,
                  hubStatus: formHubStatus,
                  palletId: formPalletId
                })}
              </div>

              {/* Status Stepper Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                  {isSw ? "Chagua Hatua ya Usafirishaji wa Hub:" : "Set Hub tracking state:"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { key: "PENDING_DELIVERY", label: isSw ? "Inasubiri kuwasilishwa Hub" : "Pending delivery", color: "bg-slate-100 text-slate-800" },
                    { key: "DELIVERED_TO_HUB", label: isSw ? "Imefika Ghalani (Hub)" : "Received at Hub", color: "bg-blue-50 text-blue-700" },
                    { key: "PASSED", label: isSw ? "Quality Passed" : "Inspected Pass", color: "bg-emerald-50 text-emerald-700" },
                    { key: "FAILED", label: isSw ? "Quality Failed" : "Inspected Fail", color: "bg-red-50 text-red-700" },
                    { key: "PALLET_PACKED", label: isSw ? "Packed & Palleted" : "Pallet Packed", color: "bg-purple-50 text-purple-700" },
                    { key: "SHIPPED", label: isSw ? "Shipped Consolidated" : "Consolidated Shipped", color: "bg-indigo-50 text-indigo-700" }
                  ].map(statusItem => (
                    <button
                      key={statusItem.key}
                      type="button"
                      onClick={() => setFormHubStatus(statusItem.key)}
                      className={`p-3 rounded-2xl border text-left font-bold text-xs transition cursor-pointer flex flex-col justify-between h-18 ${
                        formHubStatus === statusItem.key 
                          ? `${statusItem.color} border-indigo-500 ring-2 ring-indigo-500/10` 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-tight block">{statusItem.key.replace("_", " ")}</span>
                      <span>{statusItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Pallet ID Box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                    {isSw ? "Namba ya Paleti / Sanduku (Pallet/Box ID):" : "Pallet / Container Box ID:"}
                  </label>
                  <input
                    type="text"
                    value={formPalletId}
                    onChange={e => setFormPalletId(e.target.value)}
                    placeholder="E.g. PAL-1049A"
                    className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                {/* Dispatch Carrier Driver Details */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                    {isSw ? "Dereva / Msafirishaji (Carrier Name):" : "Carrier Name:"}
                  </label>
                  <input
                    type="text"
                    value={formRiderName}
                    onChange={e => setFormRiderName(e.target.value)}
                    placeholder="E.g. DHL Express Cargo"
                    className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tracking Ref or Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                    {isSw ? "Kumbukumbu ya Safari (Tracking/Phone):" : "Tracking Ref / Driver Contact:"}
                  </label>
                  <input
                    type="text"
                    value={formRiderPhone}
                    onChange={e => setFormRiderPhone(e.target.value)}
                    placeholder="E.g. TRK-91824"
                    className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                {/* Dispatch Details */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                    {isSw ? "Maelezo ya Safari (Consolidated Details):" : "Dispatch Details / Container #:"}
                  </label>
                  <input
                    type="text"
                    value={formShipmentDetails}
                    onChange={e => setFormShipmentDetails(e.target.value)}
                    placeholder="E.g. Container #C43, Ship Voyage #3"
                    className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Hub Inspection Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                  {isSw ? "Maelezo ya Ukaguzi wa Ghalani (QA / Inspection Notes):" : "Hub Quality Inspection Notes:"}
                </label>
                <textarea
                  value={formHubNotes}
                  onChange={e => setFormHubNotes(e.target.value)}
                  placeholder="E.g. Verified items match checklist. Inspected box, passed with high premium quality."
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold min-h-[60px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
                >
                  {isSw ? "Ghairi" : "Close"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  {isSw ? "Hifadhi Taarifa" : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* BULK PACK TO PALLET MODAL */}
      {showBulkModal === "pallet" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Bulk Consolidation</span>
                <h3 className="text-sm font-black tracking-tight">{isSw ? "Funga Pamoja Kwenye Paleti" : "Consolidate to Pallet"}</h3>
              </div>
              <button onClick={() => setShowBulkModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBulkPackToPalletSave} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {isSw 
                  ? `Utajumuisha oda hizi ${selectedOrderIds.length} zilizochaguliwa kwenye sanduku la kontena au paleti moja ya pamoja.` 
                  : `You are assigning ${selectedOrderIds.length} selected orders to a single pallet/container box for consolidated dispatch.`}
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Weka Namba ya Paleti (Pallet ID):</label>
                <input
                  type="text"
                  value={bulkPalletId}
                  onChange={e => setBulkPalletId(e.target.value)}
                  placeholder="E.g. BULK-PALL-749"
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowBulkModal(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer">
                  {isSw ? "Ghairi" : "Cancel"}
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition cursor-pointer">
                  {isSw ? "Funga Paleti" : "Consolidate & Pack"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK SHIP CONSOLIDATED MODAL */}
      {showBulkModal === "ship" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Consolidated Container Dispatch</span>
                <h3 className="text-sm font-black tracking-tight">{isSw ? "Safirisha Mzigo wa Pamoja" : "Consolidated Dispatch"}</h3>
              </div>
              <button onClick={() => setShowBulkModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBulkShipSave} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {isSw 
                  ? `Utafungua msafara na kusafirishia pamoja oda hizi ${selectedOrderIds.length}. Hii itabadilisha hali kuu ya oda kuwa SHIPPED kuwajulisha wateja.` 
                  : `You are dispatching ${selectedOrderIds.length} orders in a consolidated cargo container. This will advance all their main order states to SHIPPED.`}
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Driver / Carrier Name:</label>
                <input
                  type="text"
                  value={bulkRiderName}
                  onChange={e => setBulkRiderName(e.target.value)}
                  placeholder="E.g. SGR Cargo Freight Express"
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Tracking Reference / Driver Phone:</label>
                <input
                  type="text"
                  value={bulkRiderPhone}
                  onChange={e => setBulkRiderPhone(e.target.value)}
                  placeholder="E.g. SGR-TX-91204"
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Shipment Details / Container Number:</label>
                <input
                  type="text"
                  value={bulkShipmentDetails}
                  onChange={e => setBulkShipmentDetails(e.target.value)}
                  placeholder="E.g. Packed in Container #309A SGR Train Dispatch"
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowBulkModal(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer">
                  {isSw ? "Ghairi" : "Cancel"}
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition cursor-pointer">
                  {isSw ? "Safirisha Makontena" : "Dispatch Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
