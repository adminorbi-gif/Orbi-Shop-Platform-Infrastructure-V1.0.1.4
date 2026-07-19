import { Router } from "express";
import crypto from "crypto";
import { supabase, encrypt } from "../lib/supabase.js";
import { callOrbiPayGateway, getPayServiceKey } from "../lib/orbiPayGateway.js";
import { quoteCartDelivery } from "../lib/deliveryQuote.js";
import { quoteCartRouteDelivery } from "../lib/routeDeliveryQuote.js";
import { getDeliverySettings } from "../lib/deliverySettings.js";

const router = Router();

function parseWholesaleTiersFromText(description: string = ""): any[] {
  const result: any[] = [];
  if (!description) return result;
  const lines = description.split("\n").map(l => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const current = lines[i];
    const priceMatch = current.match(/(?:TSh|sh|tzs|usd)?\s*([0-9,.]+)/i);
    if (priceMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const rangeMatch = nextLine.match(/([0-9,]+)\s*-\s*([0-9,]+)\s*(?:pcs|pieces|vipande)?/i);
      const limitMatch = nextLine.match(/(?:≥|>=|\+)?\s*([0-9,]+)\s*(?:pcs|pieces|vipande)?\s*(?:pieces|vipande|\+)?/i);
      const rawPriceStr = priceMatch[1].replace(/,/g, "");
      const parsedPrice = parseFloat(rawPriceStr);
      if (!isNaN(parsedPrice) && parsedPrice > 100 && !current.includes("-") && !current.includes("/")) {
        if (rangeMatch) {
          const minQty = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
          const maxQty = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
          result.push({ minQty, maxQty, price: parsedPrice });
          i += 2;
          continue;
        } else if (nextLine.includes("≥") || nextLine.includes("+") || nextLine.includes("pieces") || nextLine.includes("pcs") || limitMatch) {
          const singleNumMatch = nextLine.match(/([0-9,]+)/);
          if (singleNumMatch) {
            const minQty = parseInt(singleNumMatch[1].replace(/,/g, ""), 10);
            result.push({ minQty, price: parsedPrice });
            i += 2;
            continue;
          }
        }
      }
    }
    i++;
  }
  return result;
}

function getProductPriceForQty(product: any, qty: number): number {
  if (!product) return 0;
  const price = parseFloat(product.price) || 0;
  const tiers = (product.wholesaleTiers && product.wholesaleTiers.length > 0)
    ? product.wholesaleTiers
    : parseWholesaleTiersFromText(product.description || "");

  if (tiers && tiers.length > 0) {
    const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return parseFloat(tier.price) || price;
      }
    }
  }
  return price;
}

const isValidUUID = (id: any): boolean => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

function mapDbProduct(row: any, fallback: any = {}) {
  const tagsList = Array.isArray(row?.tags) ? row.tags : [];
  const sellerTag = tagsList.find((tag: string) => typeof tag === "string" && tag.startsWith("seller_id:"));
  const categoryRaw = typeof row?.category === "string" ? row.category : "";
  const [niche = fallback.niche || "Mengineyo", category = fallback.category || "General", family = fallback.family || ""] = categoryRaw.split("::");

  return {
    ...fallback,
    id: row?.id || fallback.id,
    name: row?.name || fallback.name || "Product",
    niche,
    category,
    family,
    price: Number(row?.price ?? fallback.price ?? 0),
    oldPrice: row?.old_price ? Number(row.old_price) : fallback.oldPrice,
    stock: Number(row?.stock ?? fallback.stock ?? 0),
    description: row?.description || fallback.description || "",
    tags: tagsList,
    sellerId: row?.seller_id || (sellerTag ? sellerTag.split(":")[1] : fallback.sellerId) || "system",
    wholesaleTiers: Array.isArray(row?.wholesale_tiers) ? row.wholesale_tiers : (Array.isArray(fallback.wholesaleTiers) ? fallback.wholesaleTiers : []),
    walkAwayPrice: row?.walk_away_price ? Number(row.walk_away_price) : (fallback.walkAwayPrice ? Number(fallback.walkAwayPrice) : undefined),
    brokerId: row?.broker_id || fallback.brokerId,
    brokerCommissionPercent: row?.broker_commission_percent ? Number(row.broker_commission_percent) : (fallback.brokerCommissionPercent ? Number(fallback.brokerCommissionPercent) : undefined),
    weightKg: Number(row?.weight_kg ?? fallback.weightKg ?? 1),
    lengthCm: row?.length_cm ?? fallback.lengthCm,
    widthCm: row?.width_cm ?? fallback.widthCm,
    heightCm: row?.height_cm ?? fallback.heightCm,
    deliveryClass: row?.delivery_class || fallback.deliveryClass || "standard",
    fragile: row?.fragile ?? fallback.fragile ?? false,
    oversized: row?.oversized ?? fallback.oversized ?? false,
    requiresColdChain: row?.requires_cold_chain ?? fallback.requiresColdChain ?? false,
    hazardous: row?.hazardous ?? fallback.hazardous ?? false,
    digitalProduct: row?.digital_product ?? fallback.digitalProduct ?? false,
    requiresDeliveryQuote: row?.requires_delivery_quote ?? fallback.requiresDeliveryQuote ?? false,
    deliveryScope: row?.delivery_scope || fallback.deliveryScope || "national",
    deliveryPolicySource: row?.delivery_policy_source || fallback.deliveryPolicySource || "auto",
    deliveryHandlingNotes: row?.delivery_handling_notes || fallback.deliveryHandlingNotes || "",
    blockedDeliveryZoneIds: Array.isArray(row?.blocked_delivery_zone_ids) ? row.blocked_delivery_zone_ids : (fallback.blockedDeliveryZoneIds || []),
    sellerOriginZoneId: row?.seller_origin_zone_id || fallback.sellerOriginZoneId,
    sellerPickupAddress: row?.seller_pickup_address || fallback.sellerPickupAddress,
    sellerPickupPlaceId: row?.seller_pickup_place_id || fallback.sellerPickupPlaceId,
    sellerPickupLat: row?.seller_pickup_lat ?? fallback.sellerPickupLat,
    sellerPickupLng: row?.seller_pickup_lng ?? fallback.sellerPickupLng,
  };
}

async function attachSellerPickupLocations(cart: any[]) {
  const sellerIds = Array.from(new Set(
    cart
      .map((item) => item.product?.sellerId)
      .filter((id) => id && id !== "system")
      .map(String),
  ));
  if (sellerIds.length === 0) return cart;

  const uuidIds = sellerIds.filter(isValidUUID);
  const legacyIds = sellerIds.filter((id) => !isValidUUID(id));
  const sellerRows: any[] = [];

  if (uuidIds.length > 0) {
    const { data, error } = await supabase
      .from("sellers")
      .select("id, legacy_id, pickup_address, pickup_place_id, pickup_lat, pickup_lng, pickup_zone_id")
      .in("id", uuidIds);
    if (!error && data) sellerRows.push(...data);
  }

  if (legacyIds.length > 0) {
    const { data, error } = await supabase
      .from("sellers")
      .select("id, legacy_id, pickup_address, pickup_place_id, pickup_lat, pickup_lng, pickup_zone_id")
      .in("legacy_id", legacyIds);
    if (!error && data) sellerRows.push(...data);
  }

  const sellersById = new Map<string, any>();
  sellerRows.forEach((seller) => {
    sellersById.set(String(seller.id), seller);
    if (seller.legacy_id) sellersById.set(String(seller.legacy_id), seller);
  });

  return cart.map((item) => {
    const seller = sellersById.get(String(item.product?.sellerId || ""));
    if (!seller) return item;
    return {
      ...item,
      product: {
        ...item.product,
        sellerOriginZoneId: item.product.sellerOriginZoneId || seller.pickup_zone_id,
        sellerPickupAddress: item.product.sellerPickupAddress || seller.pickup_address,
        sellerPickupPlaceId: item.product.sellerPickupPlaceId || seller.pickup_place_id,
        sellerPickupLat: item.product.sellerPickupLat ?? seller.pickup_lat,
        sellerPickupLng: item.product.sellerPickupLng ?? seller.pickup_lng,
      },
    };
  });
}

type GatewayPaymentCategory = "orbi" | "mobile_money" | "bank" | "card";
type GatewayPaymentRail = "orbi_wallet" | "mno_tz" | "bank_transfer_tz" | "card_gateway";
type ShopPaymentOutcome = "held" | "requires_action" | "processing" | "failed";

const routeByMethod: Record<string, { paymentCategory: GatewayPaymentCategory; paymentRail: GatewayPaymentRail; providerCode?: string }> = {
  orbi_wallet: { paymentCategory: "orbi", paymentRail: "orbi_wallet" },
  mno_tz: { paymentCategory: "mobile_money", paymentRail: "mno_tz", providerCode: "orbi_shop_mno_tz" },
  tz_bank: { paymentCategory: "card", paymentRail: "card_gateway", providerCode: "orbi_shop_card_gateway" },
  card_gateway: { paymentCategory: "card", paymentRail: "card_gateway", providerCode: "orbi_shop_card_gateway" },
  bank_transfer_tz: { paymentCategory: "bank", paymentRail: "bank_transfer_tz", providerCode: "orbi_shop_bank_transfer_tz" },
};

const categoryForRail: Record<GatewayPaymentRail, GatewayPaymentCategory> = {
  orbi_wallet: "orbi",
  mno_tz: "mobile_money",
  bank_transfer_tz: "bank",
  card_gateway: "card",
};

function normalizeGatewayPaySafeRoute(input: {
  paymentMethod?: string;
  paymentCategory?: string;
  paymentRail?: string;
  providerCode?: string;
  paymentAccount?: string;
}) {
  const methodRoute = routeByMethod[String(input.paymentMethod || "").trim().toLowerCase()];
  const paymentCategory = String(input.paymentCategory || methodRoute?.paymentCategory || "").trim().toLowerCase();
  const paymentRail = String(input.paymentRail || methodRoute?.paymentRail || "").trim().toLowerCase();
  const providerCode = String(input.providerCode || methodRoute?.providerCode || "").trim();

  if (!paymentCategory || !paymentRail) {
    throw new Error("Gateway Error: Missing paymentCategory or paymentRail. Every PaySafe request must declare a funding route.");
  }

  if (!["orbi", "mobile_money", "bank", "card"].includes(paymentCategory)) {
    throw new Error(`Gateway Error: Unsupported paymentCategory '${paymentCategory}'.`);
  }

  if (!["orbi_wallet", "mno_tz", "bank_transfer_tz", "card_gateway"].includes(paymentRail)) {
    throw new Error(`Gateway Error: Unsupported paymentRail '${paymentRail}'.`);
  }

  if (categoryForRail[paymentRail as GatewayPaymentRail] !== paymentCategory) {
    throw new Error("Gateway Error: paymentCategory and paymentRail do not match.");
  }

  if (paymentCategory !== "orbi" && !providerCode) {
    throw new Error("Gateway Error: External PaySafe rails require providerCode.");
  }

  return {
    paymentCategory: paymentCategory as GatewayPaymentCategory,
    paymentRail: paymentRail as GatewayPaymentRail,
    providerCode: providerCode || undefined,
    paymentAccount: String(input.paymentAccount || "").trim(),
  };
}

function normalizeGatewayOutcome(result: any, fallbackReference: string, route: ReturnType<typeof normalizeGatewayPaySafeRoute>) {
  const intent = result?.data || result?.paymentIntent || result?.intent || {};
  const coreData = result?.core?.data || result?.core || intent?.coreResult || {};
  const rawStatus = String(coreData?.status || intent?.status || result?.status || "processing").trim().toLowerCase();
  const failed = result?.success === false || ["failed", "declined", "cancelled", "rejected"].includes(rawStatus);
  const held = ["held", "completed", "settled", "authorized", "payment_held"].includes(rawStatus);
  const requiresAction = ["requires_action", "challenge_required", "requires_confirmation"].includes(rawStatus);
  const status: ShopPaymentOutcome = failed ? "failed" : held ? "held" : requiresAction ? "requires_action" : "processing";

  const defaultMessage: Record<ShopPaymentOutcome, string> = {
    held: "Payment accepted and funds are protected in ORBI PaySafe.",
    requires_action: "Customer authorization is required before ORBI Core can complete the hold.",
    processing: "Payment request accepted. ORBI PaySafe is processing the funding route.",
    failed: "Payment was declined or could not be completed.",
  };

  return {
    status,
    rawStatus,
    message: String(coreData?.message || intent?.coreResult?.message || result?.message || defaultMessage[status]),
    paymentIntentId: intent?.id || coreData?.intentId || null,
    reference: intent?.reference || coreData?.reference || fallbackReference,
    transactionId: coreData?.transactionId || intent?.coreResult?.transactionId || null,
    challenge: coreData?.challenge || intent?.coreResult?.challenge || null,
    challengeMode: intent?.challengeMode || coreData?.challengeMode || null,
    challengeUrl: intent?.challengeUrl || coreData?.challengeUrl || null,
    paymentCategory: route.paymentCategory,
    paymentRail: route.paymentRail,
    providerCode: route.providerCode || null,
  };
}

function mapOrderStateFromGateway(outcome: ReturnType<typeof normalizeGatewayOutcome>) {
  if (outcome.status === "held") {
    return {
      dbStatus: "confirmed",
      paymentReference: `ESCROW:PAYMENT_HELD:held||${outcome.transactionId || outcome.paymentIntentId || outcome.reference}`,
    };
  }

  if (outcome.status === "failed") {
    return {
      dbStatus: "cancelled",
      paymentReference: `ESCROW:PAYMENT_FAILED:${outcome.rawStatus}||${outcome.paymentIntentId || outcome.reference}`,
    };
  }

  return {
    dbStatus: "pending",
    paymentReference: `ESCROW:${outcome.status.toUpperCase()}:${outcome.rawStatus}||${outcome.paymentIntentId || outcome.reference}`,
  };
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function sanitizeIdempotencyKey(value: any) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 96);
}

function resolveCheckoutIdempotencyKey(req: any) {
  return sanitizeIdempotencyKey(
    req.get("idempotency-key") ||
      req.get("x-idempotency-key") ||
      req.get("x-orbi-idempotency-key") ||
      req.body?.idempotencyKey ||
      req.body?.idempotency_key,
  );
}

function checkoutOrderIdFromIdempotencyKey(key: string) {
  const digest = crypto
    .createHash("sha256")
    .update(key)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();
  return `ORD-${digest}`;
}

async function findExistingCheckoutByBaseOrderId(baseOrderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id,legacy_id,status,payment_method,payment_method_name,total")
    .or(`legacy_id.eq.${baseOrderId},legacy_id.like.${baseOrderId}-%`)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const orders = data || [];
  if (orders.length === 0) return null;

  const heldStates = ["confirmed", "shipped", "delivered", "customer_confirmed"];
  const checkoutStatus = orders.every((order: any) =>
    heldStates.includes(String(order.status).toLowerCase()),
  )
    ? "held"
    : orders.some((order: any) => String(order.status).toLowerCase() === "cancelled")
      ? "failed"
      : "processing";

  return {
    success: true,
    replayed: true,
    baseOrderId,
    successfulOrders: orders.map((order: any) => order.legacy_id || order.id),
    gatewayResponse: {
      status: checkoutStatus,
      rawStatus: "idempotent_replay",
      message: "Checkout request already exists. Returning the original order references safely.",
      reference: baseOrderId,
    },
    gatewayResults: orders.map((order: any) => {
      const status = heldStates.includes(String(order.status).toLowerCase())
        ? "held"
        : String(order.status).toLowerCase() === "cancelled"
          ? "failed"
          : "processing";
      return {
        status,
        reference: order.legacy_id || order.id,
        amount: order.total || 0,
        paymentRail: order.payment_method || null,
        paymentCategory: order.payment_method_name || null,
      };
    }),
  };
}

function buildSellerAllocation(
  sellerGroups: Record<string, any[]>,
  payableTotalInput: number,
) {
  const sellerEntries = Object.entries(sellerGroups).map(([sellerId, sellerItems]) => {
    const grossTotal = roundMoney(
      sellerItems.reduce((sum: number, item: any) => {
        const actualPrice = getProductPriceForQty(item.product, item.quantity);
        return sum + actualPrice * (parseInt(item.quantity, 10) || 1);
      }, 0),
    );

    const walkAwayFloor = roundMoney(
      sellerItems.reduce((sum: number, item: any) => {
        const floorPrice = Number(item.product.walkAwayPrice) || (Number(item.product.price) * 0.75);
        return sum + floorPrice * (parseInt(item.quantity, 10) || 1);
      }, 0),
    );

    return {
      sellerId,
      sellerItems,
      grossTotal,
      walkAwayFloor,
      payableTotal: 0,
    };
  });

  const grossCartTotal = roundMoney(
    sellerEntries.reduce((sum, item) => sum + item.grossTotal, 0),
  );
  const walkAwayCartTotal = roundMoney(
    sellerEntries.reduce((sum, item) => sum + item.walkAwayFloor, 0),
  );

  const targetPayableTotal = Number(payableTotalInput) || grossCartTotal;
  const payableTotal = roundMoney(
    Math.max(walkAwayCartTotal, Math.min(targetPayableTotal, grossCartTotal)),
  );

  if (grossCartTotal <= 0 || payableTotal <= 0) {
    throw new Error("Checkout total must be greater than zero.");
  }

  let allocated = 0;
  sellerEntries.forEach((entry, index) => {
    const share = grossCartTotal > 0 ? (entry.grossTotal / grossCartTotal) : 0;
    let sellerPayable = roundMoney(payableTotal * share);
    
    if (sellerPayable < entry.walkAwayFloor) {
      sellerPayable = entry.walkAwayFloor;
    }

    if (index === sellerEntries.length - 1) {
      entry.payableTotal = roundMoney(Math.max(entry.walkAwayFloor, payableTotal - allocated));
      return;
    }

    entry.payableTotal = sellerPayable;
    allocated = roundMoney(allocated + entry.payableTotal);
  });

  return {
    grossCartTotal,
    payableTotal,
    sellerEntries,
  };
}

router.post("/", async (req, res) => {
  try {
    const { cart, user, paymentMethod, paymentCategory, paymentRail, providerCode, paymentAccount, operation, appliedCoupon, finalTotal, name, phone, address, options, tin, lang, deliveryZone, deliveryZoneId, deliveryFee, deliveryEta, deliveryOrigin, deliveryDestination, applyInsurance, identity } = req.body;

    // Gateway contract validation
    if (!paymentCategory || !paymentRail || !operation) {
      return res.status(400).json({ success: false, error: "Gateway Error: Missing paymentCategory, paymentRail, or operation. Every request must declare these fields." });
    }

    if (operation !== "paysafe") {
      return res.status(400).json({ success: false, error: "Gateway Error: Only 'paysafe' operation is supported for this checkout." });
    }

    const paymentRoute = normalizeGatewayPaySafeRoute({
      paymentMethod,
      paymentCategory,
      paymentRail,
      providerCode,
      paymentAccount,
    });
    const resolvedIdentity = identity && typeof identity === "object" ? identity : null;
    const resolvedIdentityId = String(resolvedIdentity?.id || "").trim();
    if (paymentRoute.paymentRail === "orbi_wallet" && !isValidUUID(resolvedIdentityId)) {
      return res.status(400).json({
        success: false,
        error: "ORBI_IDENTITY_REQUIRED",
        message: lang === "sw"
          ? "Thibitisha ORBI ID, simu, au email kabla ya kuendelea na malipo."
          : "Confirm the ORBI ID, phone, or email before continuing payment.",
      });
    }

    const gatewayResults: ReturnType<typeof normalizeGatewayOutcome>[] = [];

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty." });
    }

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, error: "Name, phone, and address are required fields." });
    }

    const stockCheckPromises = cart.map(async (c: any) => {
      const prodId = c.product?.id || c.productId || c.id;
      let query = supabase.from("products").select("*");
      if (isValidUUID(prodId)) {
        query = query.eq("id", prodId);
      } else {
        query = query.eq("legacy_id", prodId);
      }
      const { data: p } = await query.maybeSingle();
      if (!p) throw new Error(`Product "${c.product?.name || 'product'}" not found.`);
      if (p.stock < c.quantity) throw new Error(`Insufficient stock for ${p.name}.`);
      return {
        ...c,
        product: mapDbProduct(p, c.product || {}),
        quantity: parseInt(c.quantity, 10) || 1,
        dbProductId: p.id,
        currentStock: Number(p.stock) || 0,
      };
    });
    const validatedCart = await attachSellerPickupLocations(await Promise.all(stockCheckPromises));

    const sellerGroups: { [key: string]: any[] } = {};
    validatedCart.forEach((c: any) => {
      const sellerId = c.product.sellerId || "system";
      if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
      sellerGroups[sellerId].push(c);
    });

    const selectedZoneId = deliveryZoneId || deliveryZone?.id;
    let serverDeliveryQuote: any = null;
    if (selectedZoneId) {
      const { data: zones } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      const resolvedZone = (zones || []).find((zone: any) => String(zone.id) === String(selectedZoneId));
      if (resolvedZone) {
        const { data: rules } = await supabase
          .from("delivery_rules")
          .select("*")
          .order("sort_order", { ascending: true });
        const deliverySettings = await getDeliverySettings(supabase);
        serverDeliveryQuote = deliveryDestination
          ? await quoteCartRouteDelivery(validatedCart, resolvedZone, rules || [], {
              origin: deliveryOrigin,
              destination: deliveryDestination,
              lang: lang || "sw",
            }, deliverySettings, { applyInsurance })
          : quoteCartDelivery(validatedCart, resolvedZone, rules || [], lang || "sw", deliverySettings, { applyInsurance });
        if (!serverDeliveryQuote.available) {
          return res.status(400).json({
            success: false,
            error: "DELIVERY_UNAVAILABLE",
            message: lang === "sw"
              ? "Baadhi ya bidhaa haziwezi kufikishwa kwenye eneo ulilochagua."
              : "Some cart items cannot be delivered to the selected zone.",
            deliveryQuote: serverDeliveryQuote,
          });
        }
      }
    }

    const requestIdempotencyKey = resolveCheckoutIdempotencyKey(req);
    const oIdBase = requestIdempotencyKey
      ? checkoutOrderIdFromIdempotencyKey(requestIdempotencyKey)
      : "ORD-" + Math.floor(10000 + Math.random() * 90000);
    if (requestIdempotencyKey) {
      const existingCheckout = await findExistingCheckoutByBaseOrderId(oIdBase);
      if (existingCheckout) {
        return res.json({
          ...existingCheckout,
          idempotencyKey: requestIdempotencyKey,
        });
      }
    }
    const deliveryFeeAmount = roundMoney(Math.max(0, Number(serverDeliveryQuote?.totalFee ?? deliveryZone?.price ?? deliveryFee ?? 0)));
    const deliveryInsuranceFee = roundMoney(Number(serverDeliveryQuote?.insurance?.fee || serverDeliveryQuote?.costBreakdown?.insuranceFee || 0));
    const deliveryInsuranceCoverage = roundMoney(Number(serverDeliveryQuote?.insurance?.coverage || serverDeliveryQuote?.costBreakdown?.insuranceCoverage || 0));
    const resolvedDeliveryZoneName = serverDeliveryQuote?.zoneName || deliveryZone?.name || null;
    const resolvedDeliveryEta = serverDeliveryQuote?.eta || deliveryEta || deliveryZone?.eta || null;
    const checkoutAllocation = buildSellerAllocation(
      sellerGroups,
      Math.max(0, Number(finalTotal || 0) - deliveryFeeAmount),
    );
    const productSettlementSplits = checkoutAllocation.sellerEntries.map((entry) => ({
      orderId: `${oIdBase}-${entry.sellerId}`,
      sellerId: entry.sellerId,
      grossAmount: entry.grossTotal,
      payableAmount: entry.payableTotal,
      currency: "TZS",
      settlementAccount: "paysafe",
      itemCount: entry.sellerItems.reduce(
        (sum: number, item: any) => sum + (parseInt(item.quantity, 10) || 1),
        0,
      ),
    }));
    const settlementSplits = [
      ...productSettlementSplits,
      ...(deliveryFeeAmount > 0
        ? [{
            orderId: `${oIdBase}-delivery`,
            sellerId: "orbi-shop-delivery",
            grossAmount: deliveryFeeAmount,
            payableAmount: deliveryFeeAmount,
            currency: "TZS",
            settlementAccount: "delivery_operations",
            itemCount: 0,
          }]
        : []),
    ];
    const gatewayChargeTotal = roundMoney(checkoutAllocation.payableTotal + deliveryFeeAmount);

    const oIds: string[] = [];
    const successfulOrders: any[] = [];
    
    // Resolve valid customer ID from public.customers to avoid FK constraint violation
    let dbCustomerId: string | null = null;
    if (user?.id && isValidUUID(user.id)) {
      const { data: custExists } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (custExists) {
        dbCustomerId = user.id;
      }
    }
    
    const serviceKey = getPayServiceKey();
    if (!serviceKey) {
      console.error("[PAYSAFE_GATEWAY] ORBI_SHOP_PAY_API_KEY is not configured in the environment.");
      return res.status(500).json({ success: false, error: "Payment Gateway configuration error. Please contact support." });
    }

    let aggregateGatewayOutcome: ReturnType<typeof normalizeGatewayOutcome>;
    try {
      const result = await callOrbiPayGateway("/v1/paysafe/escrows", {
        method: "POST",
        idempotencyKey: requestIdempotencyKey || undefined,
        body: {
          ...(requestIdempotencyKey
            ? {
                idempotencyKey: requestIdempotencyKey,
                idempotency_key: requestIdempotencyKey,
              }
            : {}),
          reference: String(oIdBase),
          amount: gatewayChargeTotal,
          currency: "TZS",
          paymentCategory: paymentRoute.paymentCategory,
          paymentRail: paymentRoute.paymentRail,
          providerCode: paymentRoute.providerCode,
          confirm: true,
          description: "ORBI Shop protected checkout",
          buyer: {
            type: resolvedIdentityId ? "user" : dbCustomerId ? "user" : "external_customer",
            userId: resolvedIdentityId || dbCustomerId,
            name: resolvedIdentity?.displayName || name,
            phone: paymentRoute.paymentRail === "orbi_wallet" ? undefined : phone,
            email: paymentRoute.paymentRail === "orbi_wallet" ? undefined : user?.email || "",
          },
          seller: {
            userId: "orbi-shop-paysafe",
            walletId: "paysafe",
          },
          settlementSplits,
          metadata: {
            orderId: oIdBase,
            idempotencyKey: requestIdempotencyKey || undefined,
            checkoutMode: "secure_escrow",
            checkoutType: settlementSplits.length > 1 ? "multi_seller_split" : "single_seller",
            paymentCategory: paymentRoute.paymentCategory,
            paymentRail: paymentRoute.paymentRail,
            providerCode: paymentRoute.providerCode,
            identity: resolvedIdentityId
              ? {
                  id: resolvedIdentityId,
                  customerId: resolvedIdentity?.customerId || null,
                  displayName: resolvedIdentity?.displayName || null,
                  phoneHint: resolvedIdentity?.phoneHint || null,
                  emailHint: resolvedIdentity?.emailHint || null,
                }
              : undefined,
            paymentAccountHint: paymentRoute.paymentAccount ? `${paymentRoute.paymentAccount.slice(0, 3)}***${paymentRoute.paymentAccount.slice(-3)}` : undefined,
            settlementPolicy: "paysafe_hold_required",
            grossCartTotal: checkoutAllocation.grossCartTotal,
            productPayableTotal: checkoutAllocation.payableTotal,
            deliveryFee: deliveryFeeAmount,
            payableTotal: gatewayChargeTotal,
            deliveryZone: resolvedDeliveryZoneName,
            deliveryEta: resolvedDeliveryEta,
            deliveryQuote: serverDeliveryQuote,
            settlementSplits,
          },
        },
      });
      console.log(`[PAYSAFE_GATEWAY] Live aggregate escrow created for ${oIdBase} ->`, result);
      aggregateGatewayOutcome = normalizeGatewayOutcome(result, oIdBase, paymentRoute);
    } catch (e: any) {
      console.error(`[PAYSAFE_GATEWAY] Live Orbi Pay split checkout error for ${oIdBase}:`, e.message);
      const timeoutLike = e.status === 504 || e.code === "ORBI_PAY_GATEWAY_TIMEOUT";
      return res.status(e.status || 400).json({
        success: false,
        error: timeoutLike
          ? "Payment route timed out before confirmation. No order was finalized. Please wait a moment and retry, or contact support if money was deducted."
          : e.message || "Payment Gateway failed to process transaction.",
        code: e.code || (timeoutLike ? "ORBI_PAY_GATEWAY_TIMEOUT" : "ORBI_PAY_GATEWAY_ERROR"),
        retryable: timeoutLike || e.status >= 500,
        details: e.details || null,
        settlementSplits,
      });
    }

    for (const [entryIndex, entry] of checkoutAllocation.sellerEntries.entries()) {
      const sellerId = entry.sellerId;
      const sellerItems = entry.sellerItems;
      const sellerTotal = entry.payableTotal;
      const oId = `${oIdBase}-${sellerId}`;

      const gatewayOutcome = {
        ...aggregateGatewayOutcome,
        reference: oId,
        splitReference: aggregateGatewayOutcome.reference,
        splitAmount: sellerTotal,
        grossAmount: entry.grossTotal,
        sellerId,
      };
      gatewayResults.push(gatewayOutcome as any);
      const orderState = mapOrderStateFromGateway(gatewayOutcome);

      // Enterprise Phase 1: Wakala Commission Calculation
      let orderBrokerId: string | null = null;
      let orderBrokerCommission = 0;
      
      sellerItems.forEach((c: any) => {
        if (c.product.brokerId && c.product.brokerCommissionPercent) {
          orderBrokerId = c.product.brokerId;
          const itemPrice = getProductPriceForQty(c.product, c.quantity);
          const qty = parseInt(c.quantity, 10) || 1;
          const itemGrossTotal = itemPrice * qty;
          
          // Proportional discount ratio for this seller's total vs gross total
          const discountRatio = entry.grossTotal > 0 ? (sellerTotal / entry.grossTotal) : 1;
          const itemNetTotal = itemGrossTotal * discountRatio;
          
          const comm = (itemNetTotal * parseFloat(c.product.brokerCommissionPercent)) / 100;
          orderBrokerCommission += comm;
        }
      });

      const { data: oRow, error: oError } = await supabase
        .from("orders")
        .insert([{
          legacy_id: oId,
          customer_name: encrypt(name),
          customer_phone: encrypt(phone),
          customer_address: encrypt(address),
          customer_tin: tin ? encrypt(tin) : null,
          customer_id: dbCustomerId,
          payment_method: paymentRoute.paymentRail,
          payment_method_name: paymentRoute.paymentCategory,
          total: sellerTotal,
          status: orderState.dbStatus,
          broker_id: orderBrokerId,
          broker_commission_amount: orderBrokerCommission,
          delivery_zone_id: selectedZoneId || null,
          delivery_zone_name: resolvedDeliveryZoneName,
          delivery_fee: entryIndex === 0 ? deliveryFeeAmount : 0,
          delivery_eta: resolvedDeliveryEta,
          delivery_quote_id: serverDeliveryQuote?.quoteId || null,
          delivery_quote_breakdown: serverDeliveryQuote || {},
          delivery_unavailable_items: serverDeliveryQuote?.unavailableItems || [],
          delivery_distance_km: serverDeliveryQuote?.items?.find((item: any) => item.route?.distanceKm)?.route?.distanceKm || null,
          delivery_duration_minutes: serverDeliveryQuote?.items?.find((item: any) => item.route?.durationMinutes)?.route?.durationMinutes || null,
          delivery_quote_mode: serverDeliveryQuote?.quoteMode || null,
          delivery_route_provider: serverDeliveryQuote?.routeProvider || null,
          delivery_insurance_fee: entryIndex === 0 ? deliveryInsuranceFee : 0,
          delivery_insurance_coverage: entryIndex === 0 ? deliveryInsuranceCoverage : 0,
          payment_reference: encrypt(
            `${orderState.paymentReference}||SPLIT:${oIdBase}:${sellerId}:${sellerTotal}`,
          )
        }])
        .select("id")
        .single();

      if (oError || !oRow) throw new Error(oError?.message || "Failed to insert order");
      oIds.push(oId);

      await supabase.from("order_items").insert(
        sellerItems.map((c: any) => ({
          order_id: oRow.id,
          product_id: c.dbProductId,
          name: c.product.name,
          price: getProductPriceForQty(c.product, c.quantity),
          quantity: parseInt(c.quantity, 10) || 1,
        }))
      );

      const stockUpdatePromises = sellerItems.map((c: any) => {
        const qty = parseInt(c.quantity, 10) || 1;
        const newStock = Math.max(0, c.currentStock - qty);
        return supabase.from("products").update({ stock: newStock }).eq("id", c.dbProductId);
      });
      await Promise.all(stockUpdatePromises);
      
      // Enterprise: Immutable Inventory Ledger
      try {
        const movementPromises = sellerItems.map((c: any) => {
          const qty = parseInt(c.quantity, 10) || 1;
          return supabase.from("inventory_movements").insert({
            product_id: c.dbProductId,
            movement_type: 'sale',
            quantity_change: -qty,
            reference_id: `order_${oRow.id}`,
            actor_id: (req as any).user?.id || null,
            notes: `Sold in order ${oId}`
          });
        });
        await Promise.all(movementPromises);
      } catch (movErr: any) {
        console.error("[Inventory Ledger] Failed to create movement record for checkout:", movErr.message || movErr);
      }

      successfulOrders.push({ oId, orderRowId: oRow.id, sellerId, sellerTotal, sellerItems, grossTotal: entry.grossTotal });
    }

    // Fire-and-forget notifications
    setTimeout(async () => {
      try {
        const { sendOrbiTalkTemplate } = await import("./talk.js");
        for (const orderData of successfulOrders) {
           // Simplified notification logic
           await sendOrbiTalkTemplate({
             templateName: "SHOP_ORDER_CREATED",
             recipient: phone,
             channel: "sms",
             language: "sw",
             requestId: `customer-checkout-sms-${orderData.oId}`,
             data: { customerName: name, orderId: orderData.oId, currency: "TZS", amount: String(orderData.sellerTotal) }
           }).catch(() => {});
        }
      } catch (e) {}
    }, 0);

    res.json({ 
      success: true, 
      idempotencyKey: requestIdempotencyKey || null,
      baseOrderId: oIdBase, 
      successfulOrders: oIds,
      gatewayResponse: gatewayResults.length === 1 ? gatewayResults[0] : {
        status: gatewayResults.every((item) => item.status === "held") ? "held" : gatewayResults.some((item) => item.status === "failed") ? "failed" : "processing",
        rawStatus: "multi_seller_checkout",
        message: "Checkout was routed across multiple seller PaySafe holds. Review each order reference below.",
        reference: oIdBase,
        paymentCategory: paymentRoute.paymentCategory,
        paymentRail: paymentRoute.paymentRail,
        providerCode: paymentRoute.providerCode || null,
      },
      gatewayResults
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
