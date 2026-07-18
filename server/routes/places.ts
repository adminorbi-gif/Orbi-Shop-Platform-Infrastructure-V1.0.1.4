import { Router } from "express";

const router = Router();

const getGoogleMapsKey = () => process.env.GOOGLE_MAPS_API_KEY || "";

const normalizeLang = (lang: any) => (String(lang || "sw").toLowerCase().startsWith("sw") ? "sw" : "en");

const FALLBACK_LOCATIONS = [
  { placeId: "tz_kariakoo", description: "Kariakoo Market, Alikoma na Magira Street, Dar es Salaam, Tanzania", mainText: "Kariakoo Market", secondaryText: "Dar es Salaam, Tanzania", lat: -6.8163, lng: 39.2783 },
  { placeId: "tz_posta", description: "Posta Mpya, Samora Avenue, Dar es Salaam, Tanzania", mainText: "Posta Mpya", secondaryText: "Dar es Salaam, Tanzania", lat: -6.8185, lng: 39.2902 },
  { placeId: "tz_mlimani", description: "Mlimani City Shopping Mall, Sam Nujoma Road, Dar es Salaam, Tanzania", mainText: "Mlimani City", secondaryText: "Dar es Salaam, Tanzania", lat: -6.7760, lng: 39.2435 },
  { placeId: "tz_mwenge", description: "Mwenge Woodcarvers Market, Bagamoyo Road, Dar es Salaam, Tanzania", mainText: "Mwenge Woodcarvers", secondaryText: "Dar es Salaam, Tanzania", lat: -6.7717, lng: 39.2456 },
  { placeId: "tz_arusha", description: "Clock Tower, Arusha, Tanzania", mainText: "Clock Tower", secondaryText: "Arusha, Tanzania", lat: -3.3667, lng: 36.6833 },
  { placeId: "tz_mwanza", description: "Rock City Mall, Mwanza, Tanzania", mainText: "Rock City Mall", secondaryText: "Mwanza, Tanzania", lat: -2.5164, lng: 32.9019 },
];

const normalizePlaceSuggestion = (item: any) => {
  const prediction = item?.placePrediction || item;
  const structured = prediction?.structuredFormat || {};
  const mainText = structured?.mainText?.text || prediction?.structured_formatting?.main_text || prediction?.description || prediction?.text?.text || "";
  const secondaryText = structured?.secondaryText?.text || prediction?.structured_formatting?.secondary_text || "";
  return {
    placeId: prediction?.placeId || prediction?.place_id || "",
    description: prediction?.text?.text || prediction?.description || [mainText, secondaryText].filter(Boolean).join(", "),
    mainText,
    secondaryText,
  };
};

const searchPlacesNew = async (input: string, lang: string, apiKey: string) => {
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["tz"],
      languageCode: lang,
    }),
  });

  if (!response.ok) {
    throw new Error(`PLACES_AUTOCOMPLETE_HTTP_${response.status}`);
  }

  const json = await response.json();
  return (json?.suggestions || [])
    .map(normalizePlaceSuggestion)
    .filter((item: any) => item.placeId && item.description);
};

const searchPlacesLegacy = async (input: string, lang: string, apiKey: string) => {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("components", "country:tz");
  url.searchParams.set("language", lang);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PLACES_LEGACY_AUTOCOMPLETE_HTTP_${response.status}`);
  }

  const json = await response.json();
  if (json.status && !["OK", "ZERO_RESULTS"].includes(json.status)) {
    throw new Error(json.error_message || json.status);
  }

  return (json.predictions || [])
    .map(normalizePlaceSuggestion)
    .filter((item: any) => item.placeId && item.description);
};

const getPlaceDetailsNew = async (placeId: string, lang: string, apiKey: string) => {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${encodeURIComponent(lang)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,googleMapsUri,addressComponents",
    },
  });

  if (!response.ok) {
    throw new Error(`PLACE_DETAILS_HTTP_${response.status}`);
  }

  const json = await response.json();
  const lat = Number(json?.location?.latitude);
  const lng = Number(json?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("PLACE_DETAILS_MISSING_COORDINATES");
  }

  return {
    placeId: json.id || placeId,
    name: json?.displayName?.text || "",
    formattedAddress: json.formattedAddress || "",
    lat,
    lng,
    googleMapsUri: json.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    addressComponents: json.addressComponents || [],
  };
};

const getPlaceDetailsLegacy = async (placeId: string, lang: string, apiKey: string) => {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "place_id,name,formatted_address,geometry,url,address_component");
  url.searchParams.set("language", lang);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PLACE_LEGACY_DETAILS_HTTP_${response.status}`);
  }

  const json = await response.json();
  if (json.status && json.status !== "OK") {
    throw new Error(json.error_message || json.status);
  }

  const result = json.result || {};
  const lat = Number(result?.geometry?.location?.lat);
  const lng = Number(result?.geometry?.location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("PLACE_LEGACY_DETAILS_MISSING_COORDINATES");
  }

  return {
    placeId: result.place_id || placeId,
    name: result.name || "",
    formattedAddress: result.formatted_address || "",
    lat,
    lng,
    googleMapsUri: result.url || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    addressComponents: result.address_components || [],
  };
};

router.get("/autocomplete", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    const input = String(req.query.q || req.query.input || "").trim();
    const lang = normalizeLang(req.query.lang);

    if (input.length < 2) {
      return res.json({ success: true, data: [] });
    }

    let suggestions: any[] = [];
    if (apiKey) {
      try {
        try {
          suggestions = await searchPlacesNew(input, lang, apiKey);
        } catch (newApiError) {
          console.log("[Places] Info: New autocomplete API status (will try legacy):", (newApiError as any)?.message || newApiError);
          suggestions = await searchPlacesLegacy(input, lang, apiKey);
        }
      } catch (apiErr) {
        console.log("[Places] Info: API autocomplete fallback active (using local database):", (apiErr as any)?.message || apiErr);
      }
    }

    if (suggestions.length === 0) {
      const qLower = input.toLowerCase();
      suggestions = FALLBACK_LOCATIONS.filter(
        (loc) => loc.description.toLowerCase().includes(qLower) || loc.mainText.toLowerCase().includes(qLower)
      ).map(({ placeId, description, mainText, secondaryText }) => ({
        placeId,
        description,
        mainText,
        secondaryText,
      }));
    }

    res.json({ success: true, data: suggestions.slice(0, 8) });
  } catch (error: any) {
    console.error("GET /api/v1/places/autocomplete error:", error.message || error);
    res.json({ success: true, data: FALLBACK_LOCATIONS.slice(0, 5) });
  }
});

router.get("/details", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    const placeId = String(req.query.placeId || req.query.place_id || "").trim();
    const lang = normalizeLang(req.query.lang);

    if (!placeId) {
      return res.status(400).json({ success: false, error: "PLACE_ID_REQUIRED" });
    }

    let place: any = null;
    if (placeId.startsWith("tz_")) {
      const found = FALLBACK_LOCATIONS.find((l) => l.placeId === placeId);
      if (found) {
        place = {
          placeId: found.placeId,
          name: found.mainText,
          formattedAddress: found.description,
          lat: found.lat,
          lng: found.lng,
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${found.lat},${found.lng}`,
          addressComponents: [],
        };
      }
    }

    if (!place && apiKey) {
      try {
        try {
          place = await getPlaceDetailsNew(placeId, lang, apiKey);
        } catch (newApiError) {
          console.log("[Places] Info: New details API status (will try legacy):", (newApiError as any)?.message || newApiError);
          place = await getPlaceDetailsLegacy(placeId, lang, apiKey);
        }
      } catch (apiErr) {
        console.log("[Places] Info: API details fallback active (using local coordinate):", (apiErr as any)?.message || apiErr);
      }
    }

    if (!place) {
      place = {
        placeId,
        name: placeId,
        formattedAddress: placeId,
        lat: -6.8163,
        lng: 39.2783,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=-6.8163,39.2783`,
        addressComponents: [],
      };
    }

    res.json({ success: true, data: place });
  } catch (error: any) {
    console.error("GET /api/v1/places/details error:", error.message || error);
    res.json({
      success: true,
      data: {
        placeId: String(req.query.placeId || "fallback"),
        name: "Location",
        formattedAddress: "Dar es Salaam, Tanzania",
        lat: -6.8163,
        lng: 39.2783,
        googleMapsUri: "https://www.google.com/maps/search/?api=1&query=-6.8163,39.2783",
        addressComponents: [],
      },
    });
  }
});

router.get("/static-map", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const zoom = Math.min(18, Math.max(8, Number(req.query.zoom || 15)));
    const size = String(req.query.size || "640x260").replace(/[^0-9x]/g, "") || "640x260";

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: "VALID_LAT_LNG_REQUIRED" });
    }

    if (apiKey) {
      const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
      url.searchParams.set("center", `${lat},${lng}`);
      url.searchParams.set("zoom", String(zoom));
      url.searchParams.set("size", size);
      url.searchParams.set("scale", "2");
      url.searchParams.set("maptype", "roadmap");
      url.searchParams.set("markers", `color:orange|label:O|${lat},${lng}`);
      url.searchParams.set("key", apiKey);

      const response = await fetch(url);
      if (response.ok && response.body) {
        res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        const buffer = Buffer.from(await response.arrayBuffer());
        return res.send(buffer);
      }
    }

    // Fallback SVG map placeholder when static map API fails or billing is missing
    const [w, h] = size.split("x").map(Number);
    const svgWidth = w || 640;
    const svgHeight = h || 260;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <path d="M 0 ${svgHeight/2} Q ${svgWidth/4} ${svgHeight/3} ${svgWidth/2} ${svgHeight/2} T ${svgWidth} ${svgHeight/2}" fill="none" stroke="#cbd5e1" stroke-width="4"/>
      <circle cx="${svgWidth/2}" cy="${svgHeight/2}" r="16" fill="#f97316" fill-opacity="0.2"/>
      <circle cx="${svgWidth/2}" cy="${svgHeight/2}" r="8" fill="#f97316"/>
      <text x="${svgWidth/2}" y="${svgHeight/2 + 32}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle">Dar es Salaam, Tanzania (${lat.toFixed(4)}, ${lng.toFixed(4)})</text>
    </svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(svg));
  } catch (error: any) {
    console.error("GET /api/v1/places/static-map error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "STATIC_MAP_FAILED" });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    if (!apiKey) {
      return res.status(400).json({ success: false, error: "API_KEY_REQUIRED" });
    }

    const { address, regionCode = "TZ" } = req.body;
    if (!address) {
      return res.status(400).json({ success: false, error: "ADDRESS_REQUIRED" });
    }

    const response = await fetch("https://addressvalidation.googleapis.com/v1:validateAddress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        address: {
          regionCode,
          addressLines: [address],
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Address validation failed: ${response.status} - ${text}`);
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("POST /api/v1/places/validate error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "ADDRESS_VALIDATION_FAILED" });
  }
});

export default router;
