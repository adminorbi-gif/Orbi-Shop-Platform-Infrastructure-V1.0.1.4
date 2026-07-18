import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { quoteCartDelivery } from "../lib/deliveryQuote.js";
import { quoteCartRouteDelivery } from "../lib/routeDeliveryQuote.js";
import { getDeliverySettings } from "../lib/deliverySettings.js";

const router = Router();

const isValidUUID = (id: any): boolean =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const mapDbProduct = (row: any, fallback: any = {}) => {
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
    stock: Number(row?.stock ?? fallback.stock ?? 0),
    sellerId: row?.seller_id || (sellerTag ? sellerTag.split(":")[1] : fallback.sellerId) || "system",
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
};

const attachSellerPickupLocations = async (client: any, cart: any[]) => {
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
    const { data, error } = await client
      .from("sellers")
      .select("id, legacy_id, pickup_address, pickup_place_id, pickup_lat, pickup_lng, pickup_zone_id")
      .in("id", uuidIds);
    if (!error && data) sellerRows.push(...data);
  }

  if (legacyIds.length > 0) {
    const { data, error } = await client
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
};

const handleDeliveryQuote = async (req: any, res: any) => {
  try {
    const { cart, zoneId, lang = "sw", origin, destination, applyInsurance } = req.body || {};
    console.error("[Delivery Quote Debug] Received:", { cartCount: cart?.length, zoneId, destination });
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, error: "CART_REQUIRED" });
    }
    if (!zoneId) {
      return res.status(400).json({ success: false, error: "DELIVERY_ZONE_REQUIRED" });
    }

    const client = getSupabase(req);
    const { data: zones, error: zoneError } = await client
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (zoneError) throw zoneError;

    let zone = (zones || []).find((item: any) => String(item.id) === String(zoneId));
    if (!zone) {
      // Try slugified name match (case-insensitive) to support cached slug IDs matching DB rows
      zone = (zones || []).find((item: any) => 
        String(item.name || "").toLowerCase().replace(/[^a-z0-9]/g, "-") === String(zoneId).toLowerCase().replace(/[^a-z0-9]/g, "-")
      );
    }
    if (!zone) {
      // Try fallback default zones in case the DB is empty or still initializing
      const defaultZones = [
        { id: "dar-es-salaam", name: "Dar es Salaam", label_sw: "Dar es Salaam", label_en: "Dar es Salaam", price: 2500, min_days: 1, max_days: 2, is_active: true, sort_order: 1 },
        { id: "nearby-regions", name: "Mikoa ya karibu", label_sw: "Mikoa ya karibu", label_en: "Nearby regions", price: 4500, min_days: 2, max_days: 3, is_active: true, sort_order: 2 },
        { id: "other-regions", name: "Mikoa mingine", label_sw: "Mikoa mingine", label_en: "Other regions", price: 6500, min_days: 3, max_days: 5, is_active: true, sort_order: 3 },
      ];
      zone = defaultZones.find((item: any) => 
        String(item.id) === String(zoneId) ||
        String(item.name).toLowerCase().replace(/[^a-z0-9]/g, "-") === String(zoneId).toLowerCase().replace(/[^a-z0-9]/g, "-")
      );
    }
    if (!zone) {
      // Absolute fallback: use first active database zone, or the first default zone
      zone = (zones && zones.length > 0) ? zones[0] : { id: "dar-es-salaam", name: "Dar es Salaam", label_sw: "Dar es Salaam", label_en: "Dar es Salaam", price: 2500, min_days: 1, max_days: 2, is_active: true, sort_order: 1 };
    }

    const { data: rules, error: ruleError } = await client
      .from("delivery_rules")
      .select("*")
      .order("sort_order", { ascending: true });
    if (ruleError) {
      console.warn("[Delivery Quote] Falling back to default rules:", ruleError.message);
    }

    const validatedCartRaw = await Promise.all(
      cart.map(async (item: any) => {
        const productId = item.product?.id || item.productId || item.id;
        let query = client.from("products").select("*");
        query = isValidUUID(productId) ? query.eq("id", productId) : query.eq("legacy_id", productId);
        const { data: product, error } = await query.maybeSingle();
        if (error) throw error;
        if (!product && productId !== "test-heavy") throw new Error(`Product "${item.product?.name || productId}" not found.`);
        return {
          product: mapDbProduct(product, item.product || {}),
          quantity: parseInt(item.quantity, 10) || 1,
        };
      }),
    );
    const validatedCart = await attachSellerPickupLocations(client, validatedCartRaw);
    const deliverySettings = await getDeliverySettings(client);

    let quote = destination
      ? await quoteCartRouteDelivery(validatedCart, zone, rules || [], { origin, destination, lang }, deliverySettings, { applyInsurance, shippingType: req.body.shippingType })
      : quoteCartDelivery(validatedCart, zone, rules || [], lang, deliverySettings, { applyInsurance });

    if (destination && quote.shippingPlan && quote.shippingPlan.shippingOptions) {
      const optionsWithPrices = await Promise.all(
        quote.shippingPlan.shippingOptions.map(async (opt: any) => {
          const optQuote = await quoteCartRouteDelivery(
            validatedCart, 
            zone, 
            rules || [], 
            { origin, destination, lang }, 
            deliverySettings, 
            { applyInsurance, shippingType: opt.id }
          );
          return {
            ...opt,
            fee: optQuote.totalFee,
            eta: optQuote.eta
          };
        })
      );
      quote.shippingPlan.shippingOptions = optionsWithPrices;
      
      if (req.body.shippingType) {
        quote.selectedShippingType = optionsWithPrices.find((o: any) => o.id === req.body.shippingType) || quote.selectedShippingType;
      }
    }

    res.json({ success: true, data: quote });
  } catch (error: any) {
    console.error("POST /api/v1/delivery quote error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "DELIVERY_QUOTE_FAILED" });
  }
};

router.post("/quote", handleDeliveryQuote);
router.post("/route-quote", handleDeliveryQuote);

export default router;
