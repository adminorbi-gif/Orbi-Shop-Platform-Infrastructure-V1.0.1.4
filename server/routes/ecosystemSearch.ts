import { Router } from "express";
import Redis from "ioredis";
import { getGeminiClient } from "../lib/gemini.js";

const router = Router();

// ============================================================================
// ENVIRONMENT VARIABLES & CONFIGURATION
// ============================================================================
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Initialize Valkey/Redis client
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    retryStrategy: (times) => {
      console.warn(`[Redis] Connection lost. Retrying in ${Math.min(times * 50, 2000)}ms...`);
      if (times >= 10) {
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 1,
  });

  redis.on("error", (err) => {
    console.error("[Redis Error] Cache service offline or unreachable:", err.message);
  });
}

/**
 * Mfumo wa Utafutaji wa Kisasa wa Orbi Shop (Ecosystem Search)
 */
async function dynamicEcosystemSearch(userQuery: string, userCountry: string = "TZ") {
    const ai = getGeminiClient();

    const countryNames: Record<string, string> = { TZ: "Tanzania", KE: "Kenya", UG: "Uganda" };
    const currentCountryName = countryNames[userCountry.toUpperCase()] || "Tanzania";

    const systemPrompt = `Wewe ni mfumo wa utafutaji wa kibiashara ndani ya Orbi Shop. 
    Tafuta maduka ya bidhaa, viwanda, wasambazaji (suppliers), au bei ya bidhaa hii nchini ${currentCountryName}: "${userQuery}".
    Ondoa kabisa kurasa za habari, blogu za udaku, na Wikipedia. Leta tovuti za biashara halisi tu.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemPrompt,
            tools: [{ googleSearch: {} }],
        });

        const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
        const searchChunks = groundingMetadata?.groundingChunks || [];

        const blacklistedDomains = ['wikipedia.org', 'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'pinterest.com', 'linkedin.com'];

        const cleanResults = searchChunks
            .map((chunk: any) => {
                const title = chunk.web?.title || "Bidhaa/Biashara Kutoka Mtandao";
                const link = chunk.web?.uri || "";
                
                return {
                    title: title,
                    link: link,
                    is_available_in_geo: userCountry.toUpperCase(),
                    source: "External Network"
                };
            })
            .filter((item: any) => {
                if (!item.link) return false;
                return !blacklistedDomains.some(domain => item.link.includes(domain));
            });

        return {
            status: "success",
            country_context: currentCountryName,
            ai_summary: typeof response.text === 'function' ? response.text() : (response as any).text,
            products: cleanResults
        };

    } catch (error: any) {
        console.error("Backend Error [Orbi Search]:", error.message);
        return {
            status: "error",
            message: "Imeshindikana kukamilisha utafutaji kwa sasa.",
            products: []
        };
    }
}

/**
 * GET /api/ecosystem-search
 */
router.get("/", async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const loc = typeof req.query.loc === "string" ? req.query.loc.trim().toUpperCase() : "TZ";

    if (!rawQuery) {
      return res.status(400).json({ success: false, error: "Missing query parameter 'q'" });
    }

    // Caching Strategy
    const cacheKey = `ecosystem_search:${loc}:${rawQuery.toLowerCase()}`;
    try {
      if (redis && redis.status === "ready") {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            source: "cache",
            data: JSON.parse(cachedData)
          });
        }
      }
    } catch (cacheErr) {
      console.warn("[Ecosystem Search] Redis cache read failed:", cacheErr);
    }

    const searchData = await dynamicEcosystemSearch(rawQuery, loc);
    
    if (searchData.status === "error") {
      return res.status(500).json({ success: false, error: searchData.message });
    }

    // Save to cache (24 hours)
    try {
      if (redis && redis.status === "ready") {
        await redis.setex(cacheKey, 86400, JSON.stringify(searchData.products));
      }
    } catch (cacheWriteErr) {
      console.warn("[Ecosystem Search] Redis cache write failed:", cacheWriteErr);
    }

    return res.json({
      success: true,
      source: "api",
      data: searchData.products,
      ai_summary: searchData.ai_summary
    });

  } catch (err: any) {
    console.error("[Ecosystem Search] Critical error in search controller:", err);
    res.status(500).json({ success: false, error: "Internal server error during ecosystem search" });
  }
});

export default router;
