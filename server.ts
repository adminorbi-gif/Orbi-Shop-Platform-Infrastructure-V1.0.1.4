import dotenv from "dotenv";
dotenv.config();

// Global crash prevention hooks to prevent server crashes resulting in 502 Bad Gateway
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: UNCAUGHT EXCEPTION PREVENTED CRASH:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: UNHANDLED REJECTION PREVENTED CRASH:", reason);
});

import express from "express";
import path from "path";
import fs from "fs";
import { Server as SocketIOServer } from "socket.io";
import { GoogleGenAI } from "@google/genai";

import { supabase } from "./server/lib/supabase.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";

import adminRouter from "./server/routes/admin.js";
import adsRouter from "./server/routes/ads.js";
import aiRouter from "./server/routes/ai.js";
import analyticsRouter from "./server/routes/analytics.js";
import authRouter from "./server/routes/auth.js";
import checkoutRouter from "./server/routes/checkout.js";
import customersRouter from "./server/routes/customers.js";
import deliveryRouter from "./server/routes/delivery.js";
import messagesRouter from "./server/routes/messages.js";
import newslettersRouter from "./server/routes/newsletters.js";
import ordersRouter from "./server/routes/orders.js";
import paymentsRouter from "./server/routes/payments.js";
import placesRouter from "./server/routes/places.js";
import productsRouter from "./server/routes/products.js";
import promotionsRouter from "./server/routes/promotions.js";
import reviewsRouter from "./server/routes/reviews.js";
import searchRouter from "./server/routes/search.js";
import ecosystemSearchRouter from "./server/routes/ecosystemSearch.js";
import settingsRouter from "./server/routes/settings.js";
import sitemapRouter from "./server/routes/sitemap.js";
import stockNotificationsRouter from "./server/routes/stockNotifications.js";
import priceAlertsRouter from "./server/routes/priceAlerts.js";
import storageRouter from "./server/routes/storage.js";
import subscriptionsRouter from "./server/routes/subscriptions.js";
import talkRouter from "./server/routes/talk.js";
import traRouter from "./server/routes/tra.js";
import chatRouter from "./server/routes/chat.js";

const ORBI_SHOP_LOGO = "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 155) {
  return value.length > max ? `${value.slice(0, max - 1).trim()}...` : value;
}

function categoryBreadcrumbs(pathname: string, baseUrl: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [
    { name: "Orbi Shop", item: `${baseUrl}/` },
  ];

  if (parts[0] === "shop") {
    let current = "/shop";
    parts.slice(1).forEach((part) => {
      current += `/${part}`;
      const cleanName = part
        .replace(/--[a-zA-Z0-9-]+$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      crumbs.push({ name: cleanName || "Product", item: `${baseUrl}${current}` });
    });
  }

  return crumbs;
}

function deslugifyNiche(slug: string): string {
  if (!slug) return "Zote";
  const mapping: Record<string, string> = {
    "electronics-tech": "Electronics & Tech",
    "fashion-apparel": "Fashion & Apparel",
    "home-furniture": "Home & Furniture",
    "health-beauty": "Health & Beauty",
    "auto-motors": "Auto & Motors",
    "supermarket-food": "Supermarket & Food"
  };
  return mapping[slug.toLowerCase()] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateProductPrerenderHtml(product: any, appUrl: string) {
  const name = product?.name || "";
  const desc = product?.description || "";
  const price = Number(product?.price || 0);
  const image = Array.isArray(product?.images) && product.images[0] ? product.images[0] : "";
  const category = product?.category || "";
  
  return `
    <article style="max-width: 600px; margin: 40px auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6;">
      <header>
        <p style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #10b981; font-weight: 700; margin-bottom: 8px;">${escapeHtml(category)}</p>
        <h1 style="font-size: 2rem; font-weight: 800; margin: 0 0 16px 0; color: #0f172a; letter-spacing: -0.025em;">${escapeHtml(name)}</h1>
      </header>
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />` : ""}
      <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 24px;">
        Bei: TSh ${price.toLocaleString("en-US")}
      </div>
      <section style="margin-bottom: 32px;">
        <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 12px; color: #1e293b;">Maelezo ya Bidhaa / Product Details:</h2>
        <div style="font-size: 1rem; color: #334155;">${desc}</div>
      </section>
      <footer>
        <a href="${appUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 12px; transition: background-color 0.2s;">
          Tembelea Orbi Shop / Visit Store
        </a>
      </footer>
    </article>
  `;
}

function generateNichePrerenderHtml(nicheName: string, products: any[], appUrl: string) {
  const productListHtml = products.map(p => {
    const name = p.name || "";
    const price = Number(p.price || 0);
    const image = Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
    const productSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const productUrl = `${appUrl}/shop/${nicheName.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}/${productSlug}--${p.id}`;
    
    return `
      <li style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; margin-bottom: 12px;" />` : ""}
          <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 8px 0; color: #0f172a;"><a href="${productUrl}" style="text-decoration: none; color: inherit;">${escapeHtml(name)}</a></h3>
        </div>
        <div>
          <p style="font-weight: 700; color: #10b981; margin: 8px 0 12px 0;">TSh ${price.toLocaleString("en-US")}</p>
          <a href="${productUrl}" style="display: block; text-align: center; background: #f8fafc; color: #334155; padding: 8px; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500;">Tazama Bidhaa / View Item</a>
        </div>
      </li>
    `;
  }).join("\n");

  return `
    <div style="max-width: 1000px; margin: 40px auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif; color: #1e293b;">
      <header style="margin-bottom: 40px; text-align: center;">
        <h1 style="font-size: 2.5rem; font-weight: 900; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.025em;">${escapeHtml(nicheName)}</h1>
        <p style="color: #64748b; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">Karibu kwenye soko la ${escapeHtml(nicheName)} kwenye Orbi Shop Tanzania. Bidhaa zote zimehakikiwa.</p>
      </header>
      
      <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; margin-bottom: 40px;">
        ${productListHtml || `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 40px;">Hakuna bidhaa bado / No products listed yet.</p>`}
      </ul>
      
      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 40px;">
        <a href="${appUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 12px;">
          Nenda Ukurasa wa Mwanzo / Go to Homepage
        </a>
      </div>
    </div>
  `;
}

function generateHomePrerenderHtml(products: any[], appUrl: string) {
  const productListHtml = products.map(p => {
    const name = p.name || "";
    const price = Number(p.price || 0);
    const image = Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
    const productSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const nicheSlug = (p.niche || 'general').toLowerCase().replace(/ & /g, "-").replace(/ /g, "-");
    const productUrl = `${appUrl}/shop/${nicheSlug}/${productSlug}--${p.id}`;
    
    return `
      <li style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; margin-bottom: 12px;" />` : ""}
          <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 8px 0; color: #0f172a;"><a href="${productUrl}" style="text-decoration: none; color: inherit;">${escapeHtml(name)}</a></h3>
        </div>
        <div>
          <p style="font-weight: 700; color: #10b981; margin: 8px 0 12px 0;">TSh ${price.toLocaleString("en-US")}</p>
          <a href="${productUrl}" style="display: block; text-align: center; background: #f8fafc; color: #334155; padding: 8px; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500;">Tazama Bidhaa / View Item</a>
        </div>
      </li>
    `;
  }).join("\n");

  return `
    <div style="max-width: 1000px; margin: 40px auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif; color: #1e293b;">
      <header style="margin-bottom: 40px; text-align: center;">
        <h1 style="font-size: 2.5rem; font-weight: 900; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.025em;">Orbi Shop Tanzania</h1>
        <p style="color: #64748b; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">Soko salama zaidi la ununuzi mtandaoni Tanzania. Bidhaa zote zimehakikiwa na ulinzi kamili wa malipo ya Orbi Pay.</p>
      </header>
      
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 20px;">Duka Zetu Maalum / Our Dedicated Shopping Centers:</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
          <a href="${appUrl}/niche/electronics-tech" style="display: block; padding: 16px; background: #f8fafc; border-radius: 12px; font-weight: 600; color: #1e293b; text-decoration: none; text-align: center; border: 1px solid #e2e8f0;">Electronics & Tech</a>
          <a href="${appUrl}/niche/fashion-apparel" style="display: block; padding: 16px; background: #f8fafc; border-radius: 12px; font-weight: 600; color: #1e293b; text-decoration: none; text-align: center; border: 1px solid #e2e8f0;">Fashion & Apparel</a>
          <a href="${appUrl}/niche/home-furniture" style="display: block; padding: 16px; background: #f8fafc; border-radius: 12px; font-weight: 600; color: #1e293b; text-decoration: none; text-align: center; border: 1px solid #e2e8f0;">Home & Furniture</a>
          <a href="${appUrl}/niche/health-beauty" style="display: block; padding: 16px; background: #f8fafc; border-radius: 12px; font-weight: 600; color: #1e293b; text-decoration: none; text-align: center; border: 1px solid #e2e8f0;">Health & Beauty</a>
          <a href="${appUrl}/niche/auto-motors" style="display: block; padding: 16px; background: #f8fafc; border-radius: 12px; font-weight: 600; color: #1e293b; text-decoration: none; text-align: center; border: 1px solid #e2e8f0;">Auto & Motors</a>
          <a href="${appUrl}/niche/supermarket-food" style="display: block; padding: 16px; background: #f8fafc; border-radius: 12px; font-weight: 600; color: #1e293b; text-decoration: none; text-align: center; border: 1px solid #e2e8f0;">Supermarket & Food</a>
        </div>
      </section>

      <section>
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 20px;">Bidhaa Zinazopendekezwa / Recommended Products:</h2>
        <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px;">
          ${productListHtml}
        </ul>
      </section>
    </div>
  `;
}

function injectStructuredSeo(html: string, options: { 
  appUrl: string; 
  pathname: string; 
  product?: any; 
  nicheName?: string; 
  nicheProducts?: any[];
  topProducts?: any[];
}) {
  const pathname = options.pathname.length > 1 ? options.pathname.replace(/\/+$/, "") : "/";
  const canonicalUrl = `${options.appUrl}${pathname}`;
  
  let title = "Orbi Shop";
  let description = "Shop with Orbi - trusted e-commerce marketplace in Tanzania.";
  let productImage = ORBI_SHOP_LOGO;
  let prerenderHtml = "";

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Orbi Shop",
      url: `${options.appUrl}/`,
      logo: ORBI_SHOP_LOGO,
      sameAs: ["https://shop.orbifinancial.com"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Orbi Shop",
      url: `${options.appUrl}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${options.appUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: categoryBreadcrumbs(pathname, options.appUrl).map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
  ];

  if (options.product) {
    const product = options.product;
    const productName = product?.name ? String(product.name) : "";
    const productDescription = truncate(stripHtml(product?.description) || `Nunua ${productName || "bidhaa"} kwenye Orbi Shop Tanzania.`);
    const price = Number(product?.price || 0);
    const availability = Number(product?.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    productImage = Array.isArray(product?.images) && product.images[0] ? product.images[0] : ORBI_SHOP_LOGO;
    
    title = `Bei ya ${productName} | Orbi Shop`;
    description = `Nunua ${productName} kwa bei ya TSh ${Number.isFinite(price) ? price.toLocaleString("en-US") : "0"}. ${productDescription}`;
    
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": canonicalUrl,
      name: productName,
      description: productDescription,
      image: [productImage],
      sku: String(product.id || ""),
      category: product.category || undefined,
      brand: {
        "@type": "Brand",
        name: "Orbi Shop",
      },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "TZS",
        price: Number.isFinite(price) ? price.toFixed(2) : "0.00",
        availability,
        itemCondition: "https://schema.org/NewCondition",
      },
    });

    prerenderHtml = generateProductPrerenderHtml(product, options.appUrl);
  } else if (options.nicheName) {
    const nicheName = options.nicheName;
    title = `${nicheName} | Orbi Shop Tanzania`;
    description = `Gundua bidhaa bora za ${nicheName} kwenye Orbi Shop Tanzania. Lipa salama na kupokea bidhaa zilizohakikiwa.`;
    
    prerenderHtml = generateNichePrerenderHtml(nicheName, options.nicheProducts || [], options.appUrl);
  } else {
    title = "Orbi Shop | The Most Trusted Marketplace in Tanzania";
    description = "Orbi Shop is Tanzania's safest e-commerce platform. Shop verified products, enjoy payment protection with Orbi Pay, and track your orders in real-time. Nunua mtandaoni Tanzania.";
    
    prerenderHtml = generateHomePrerenderHtml(options.topProducts || [], options.appUrl);
  }

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`)
    .replace(/<meta name="description".*?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url".*?>/, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`)
    .replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${escapeHtml(productImage)}" />`)
    .replace(/<meta name="twitter:title".*?>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description".*?>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="twitter:image".*?>/, `<meta name="twitter:image" content="${escapeHtml(productImage)}" />`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root"><div style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">${prerenderHtml}</div><div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f8fafc;flex-direction:column;font-family:sans-serif;"><img src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" alt="Orbi Shop" style="width:80px;height:auto;margin-bottom:20px;border-radius:12px;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);"/><p style="color:#64748b;font-weight:600;font-size:14px;letter-spacing:-0.01em;">Loading Orbi Shop...</p></div></div>`)
    .replace(
      /<script id="dynamic-seo-schema"><\/script>/,
      `<script id="dynamic-seo-schema" type="application/ld+json">${JSON.stringify(schemas)}</script>`,
    );
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const runtimePorts = [
    process.env.ORBI_SHOP_PORT,
    process.env.PORT,
    "3000",
  ]
    .map((port) => Number(port))
    .filter((port) => Number.isInteger(port) && port > 0 && port < 65536);
  const PORTS = Array.from(new Set(runtimePorts));
  const appUrl = (process.env.APP_URL || "https://shop.orbifinancial.com").replace(/\/$/, "");

  const healthPayload = () => ({
    status: "ok",
    service: "orbi-shop",
    publicHealthUrl: `${appUrl}/api/health`,
    timestamp: new Date().toISOString(),
  });

  // Keep platform probes before security, CORS, rate-limit, and body parsing.
  app.get("/health", (req, res) => {
    res.status(200).json(healthPayload());
  });

  app.get("/ready", (req, res) => {
    res.status(200).json(healthPayload());
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json(healthPayload());
  });

  app.get("/api/brokers", async (req, res) => {
    try {
      const { data, error } = await supabase.from("brokers").select("*");
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/brokers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from("brokers").select("*").eq("id", id).single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/brokers", async (req, res) => {
    try {
      const { name, phone, email, companyName, commissionRate, areaOfOperation } = req.body;
      const { data, error } = await supabase.from("brokers").insert([
        { name, phone, email, company_name: companyName, commission_rate: commissionRate, area_of_operation: areaOfOperation }
      ]).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/brokers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, commissionRate } = req.body;
      const updateData: any = {};
      if (status) updateData.status = status;
      if (commissionRate !== undefined) updateData.commission_rate = commissionRate;
      if (status === 'verified') updateData.verified_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("brokers")
        .update(updateData)
        .eq("id", id)
        .select();
      
      if (error) throw error;
      res.json(data[0]);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 1. Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP to prevent blocking Vite or inline scripts
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.includes("run.app") ||
          origin.includes("aistudio") ||
          origin.includes("google.com") ||
          origin.includes("orbifinancial.com")
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  );

  // 3. Rate Limiting Configuration
  const strictLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit sensitive routes to 100 requests per minute
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const looseLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5000, // Allow 5000 requests per minute for product routes
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Checkout payloads are intentionally lean, but allow room for admin/product APIs.
  app.use(express.json({ limit: "1mb" }));

  // Database proxy endpoint for frontend Supabase customProxyFetch
  app.post("/api/db/proxy", async (req, res) => {
    try {
      const { url, options } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Missing URL in proxy payload" });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      if (supabaseUrl && !url.startsWith(supabaseUrl)) {
        return res.status(403).json({ error: "Forbidden proxy destination URL" });
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
        },
      });

      const body = await response.text();

      // Forward content type and caching headers if present
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "content-type" || lowerKey === "cache-control") {
          res.setHeader(key, value);
        }
      });

      res.status(response.status).send(body);
    } catch (err: any) {
      console.error("[Database Proxy Error]:", err.message || err);
      res.status(500).json({ success: false, error: err.message || "Failed to proxy database request" });
    }
  });

  // Mount API Routes with appropriate rate limiting
  app.use("/api/v1/admin", strictLimiter, adminRouter);
  app.use("/api/ads", looseLimiter, adsRouter);
  app.use("/api/v1/ai", looseLimiter, aiRouter);
  app.use("/api/v1/analytics", looseLimiter, analyticsRouter);
  app.use("/api/analytics", looseLimiter, analyticsRouter);
  app.use("/api/auth", strictLimiter, authRouter);
  app.use("/api/v1/checkout", strictLimiter, checkoutRouter);
  app.use("/api/checkout", strictLimiter, checkoutRouter);
  app.use("/api/v1/customers", strictLimiter, customersRouter);
  app.use("/api/v1/delivery", looseLimiter, deliveryRouter);
  app.use("/api/v1/messages", looseLimiter, messagesRouter);
  app.use("/api/v1/chat", looseLimiter, chatRouter);
  app.use("/api/v1/newsletters", looseLimiter, newslettersRouter);
  app.use("/api/v1/orders", strictLimiter, ordersRouter);
  app.use("/api/v1/payments", strictLimiter, paymentsRouter);
  app.use("/api/orbi-pay", strictLimiter, paymentsRouter);
  app.use("/api/v1/places", looseLimiter, placesRouter);
  app.use("/api/v1/products", looseLimiter, productsRouter);
  app.use("/api/v1/campaigns", looseLimiter, promotionsRouter);
  app.use("/api/v1/reviews", looseLimiter, reviewsRouter);
  app.use("/api/v1/search", looseLimiter, searchRouter);
  app.use("/api/search", looseLimiter, searchRouter);
  app.use("/api/ecosystem-search", looseLimiter, ecosystemSearchRouter);
  app.use("/api/v1/settings", looseLimiter, settingsRouter);
  app.use("/api/sitemap", looseLimiter, sitemapRouter);
  app.use("/sitemap.xml", looseLimiter, sitemapRouter);
  app.use("/api/v1/stock-notifications", looseLimiter, stockNotificationsRouter);
  app.use("/api/v1/price-alerts", looseLimiter, priceAlertsRouter);
  app.use("/api/v1/storage", looseLimiter, storageRouter);
  app.use("/api/v1/subscriptions", looseLimiter, subscriptionsRouter);
  app.use("/api/talk", looseLimiter, talkRouter);
  app.use("/api/v1/tra", looseLimiter, traRouter);

  // AI Listing Generator Endpoint
  app.post("/api/v1/ai/generate-listing", express.json({ limit: "10mb" }), async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Mock fallback if no key
        return res.json({
           title: "Awesome Product",
           nameSw: "Bidhaa Nzuri",
           category: "general",
           description: "A great product for everyday use.",
           descriptionSw: "Bidhaa nzuri kwa matumizi ya kila siku.",
           tags: ["new", "quality"],
           price: 10000
        });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert Tanzanian marketplace assistant. 
Analyze the provided product image and generate a JSON object with the following fields:
- title (English name)
- nameSw (Swahili name)
- category (One of: electronics, fashion, home, health, auto, supermarket, other)
- description (English description)
- descriptionSw (Swahili description)
- tags (array of 3-5 keywords)
- price (estimated price in TZS as an integer, if possible, else 0).

Output only the raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
            }
          }
        ]
      });

      let text = response.text || "{}";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (e: any) {
      console.error("AI Listing Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // AI Negotiation Agent Endpoint for RFQ
  app.post("/api/v1/ai/negotiate", async (req, res) => {
    try {
      const { currentOffer, walkAwayPrice, buyerMessage, previousMessages } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.json({ reply: "I cannot go lower than my best price.", newOffer: currentOffer });
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a B2B AI Negotiation Agent for a Tanzanian wholesaler. 
Your minimum walk-away price is ${walkAwayPrice} TZS. The buyer's current offer is in the chat.
Respond professionally in Swahili or English. If the buyer's offer is above the walk-away price, you can accept it or counter-offer slightly higher. If below, reject and counter with something closer to the walk-away price.
Return a JSON object: { "reply": "your message to buyer", "newOffer": number (your proposed price, or null if accepted) }

Buyer message: "${buyerMessage}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      let text = response.text || "{}";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(text));
    } catch (e: any) {
      console.error("AI Negotiation Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Serve uploads folder statically in both dev and prod
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Custom middleware to inject SEO tags and pre-render content in development
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      const pathname = req.path || "/";

      // Only intercept HTML page navigation requests
      const acceptsHtml = req.headers.accept && req.headers.accept.includes("text/html");
      if (!acceptsHtml || 
          pathname.startsWith("/api/") || 
          pathname.startsWith("/uploads/") || 
          pathname.match(/\.(?:css|js|mjs|ts|tsx|map|png|jpg|jpeg|webp|svg|ico|json|txt|webmanifest)$/i)) {
        return vite.middlewares(req, res, next);
      }
      
      try {
        const productMatch = url.match(/\/shop\/.*--([a-zA-Z0-9-]+)(?:\?.*)?$/);
        const nicheMatch = url.match(/\/niche\/([a-zA-Z0-9-]+)(?:\?.*)?$/);
        
        let html = await fs.promises.readFile(path.join(process.cwd(), "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const hasSupabase = !!(supabaseUrl && supabaseKey);
        
        if (productMatch && hasSupabase) {
          const productId = productMatch[1];
          const { data: product } = await supabase
            .from("products")
            .select("id, name, description, price, images, stock, category, niche")
            .eq("id", productId)
            .single();
            
          html = injectStructuredSeo(html, { appUrl, pathname, product });
          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } else if (nicheMatch && hasSupabase) {
          const nicheSlug = nicheMatch[1];
          const nicheName = deslugifyNiche(nicheSlug);
          const { data: nicheProducts } = await supabase
            .from("products")
            .select("id, name, description, price, images, stock, category, niche")
            .eq("niche", nicheName)
            .limit(40);
            
          html = injectStructuredSeo(html, { appUrl, pathname, nicheName, nicheProducts: nicheProducts || [] });
          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } else {
          // General / Homepage
          let topProducts: any[] = [];
          if (hasSupabase) {
            const { data } = await supabase
              .from("products")
              .select("id, name, description, price, images, stock, category, niche")
              .limit(20);
            topProducts = data || [];
          }
          
          html = injectStructuredSeo(html, { appUrl, pathname, topProducts });
          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        }
      } catch (e) {
        console.error("Error in SEO middleware:", e);
        vite.middlewares(req, res, next);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return;
          }
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            return;
          }
          if (filePath.endsWith("sw.js") || filePath.endsWith("manifest.webmanifest")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }),
    );

    app.get(/^\/assets\/.+/, (req, res) => {
      res
        .status(404)
        .type("text/plain")
        .send("Static asset not found. Refresh the app to load the latest version.");
    });

    app.get(/\.(?:css|js|mjs|map|png|jpg|jpeg|webp|svg|ico|json|txt|webmanifest)$/i, (req, res) => {
      res
        .status(404)
        .type("text/plain")
        .send("File not found.");
    });
    
    app.get("*", async (req, res) => {
      const url = req.originalUrl;
      const pathname = req.path || "/";
      
      try {
        const productMatch = url.match(/\/shop\/.*--([a-zA-Z0-9-]+)(?:\?.*)?$/);
        const nicheMatch = url.match(/\/niche\/([a-zA-Z0-9-]+)(?:\?.*)?$/);
        
        let html = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const hasSupabase = !!(supabaseUrl && supabaseKey);
        
        if (productMatch && hasSupabase) {
          const productId = productMatch[1];
          const { data: product } = await supabase
            .from("products")
            .select("id, name, description, price, images, stock, category, niche")
            .eq("id", productId)
            .single();
            
          html = injectStructuredSeo(html, { appUrl, pathname, product });
        } else if (nicheMatch && hasSupabase) {
          const nicheSlug = nicheMatch[1];
          const nicheName = deslugifyNiche(nicheSlug);
          const { data: nicheProducts } = await supabase
            .from("products")
            .select("id, name, description, price, images, stock, category, niche")
            .eq("niche", nicheName)
            .limit(40);
            
          html = injectStructuredSeo(html, { appUrl, pathname, nicheName, nicheProducts: nicheProducts || [] });
        } else {
          // General / Homepage
          let topProducts: any[] = [];
          if (hasSupabase) {
            const { data } = await supabase
              .from("products")
              .select("id, name, description, price, images, stock, category, niche")
              .limit(20);
            topProducts = data || [];
          }
          
          html = injectStructuredSeo(html, { appUrl, pathname, topProducts });
        }
        
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } catch (e) {
        console.error("Error in production static file route:", e);
        try {
          const fallbackHtml = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
          res.status(200).set({ "Content-Type": "text/html" }).send(fallbackHtml);
        } catch (err) {
          res.status(500).send("Internal Server Error");
        }
      }
    });
  }

  for (const port of PORTS) {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check: ${appUrl}/api/health`);
    });

    if (port === 3000 || PORTS.length === 1) {
      const io = new SocketIOServer(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        pingInterval: 25000,
        pingTimeout: 60000
      });

      // Map to store connected users: userId -> socketId
      const connectedUsers = new Map<string, string>();

      io.on("connection", (socket) => {
        console.log("WebSocket connected:", socket.id);

        socket.on("identify", (userId: string) => {
          connectedUsers.set(userId, socket.id);
          socket.join(userId); // Users join a room with their own ID
          console.log(`User ${userId} identified on socket ${socket.id}`);
        });

        socket.on("ping_latency", (callback: () => void) => {
          if (typeof callback === "function") {
            callback();
          }
        });

        socket.on("joinConversation", (conversationId: string) => {
          socket.join(`conv_${conversationId}`);
        });

        socket.on("leaveConversation", (conversationId: string) => {
          socket.leave(`conv_${conversationId}`);
        });

        socket.on("sendMessage", (message: any) => {
          // Broadcast to the conversation room
          if (message.conversationId) {
            io.to(`conv_${message.conversationId}`).emit("newMessage", message);
            
            // Also notify participants directly if needed
            // e.g. io.to(recipientId).emit("notification", message)
          }
        });

        socket.on("messagesRead", (payload: { conversationId: string, readByUserId: string }) => {
          if (payload.conversationId) {
            io.to(`conv_${payload.conversationId}`).emit("messagesRead", payload);
          }
        });

        socket.on("disconnect", () => {
          for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
              connectedUsers.delete(userId);
              break;
            }
          }
          console.log("WebSocket disconnected:", socket.id);
        });
      });
      
      // Store io instance on app for use in routes
      app.set("io", io);
    }

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.warn(`Port ${port} is already in use; continuing with other listeners.`);
        return;
      }
      throw error;
    });
  }
}

startServer();
