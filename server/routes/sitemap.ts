import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { SitemapStream, streamToPromise } from "sitemap";

const router = Router();

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

router.get("/", async (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  const baseUrl = process.env.APP_URL
    ? process.env.APP_URL.replace(/\/$/, "")
    : `${protocol}://${host}`;

  res.header("Content-Type", "application/xml");

  const smStream = new SitemapStream({ hostname: baseUrl });

  smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });

  try {
    // Dynamically retrieve active niches from the database
    const { data: dbNiches, error: nicheError } = await supabase
      .from("niches")
      .select("name");

    if (dbNiches && dbNiches.length > 0) {
      dbNiches.forEach((n: any) => {
        smStream.write({ url: `/niche/${slugify(n.name)}`, changefreq: 'daily', priority: 0.8 });
      });
    } else {
      // Fallback
      smStream.write({ url: '/niche/electronics-tech', changefreq: 'daily', priority: 0.8 });
      smStream.write({ url: '/niche/fashion-apparel', changefreq: 'daily', priority: 0.8 });
      smStream.write({ url: '/niche/home-furniture', changefreq: 'daily', priority: 0.8 });
      smStream.write({ url: '/niche/health-beauty', changefreq: 'daily', priority: 0.8 });
      smStream.write({ url: '/niche/auto-motors', changefreq: 'daily', priority: 0.8 });
      smStream.write({ url: '/niche/supermarket-food', changefreq: 'daily', priority: 0.8 });
    }
  } catch (err) {
    console.warn("Sitemap niches fetch failed, using fallback list:", err);
    smStream.write({ url: '/niche/electronics-tech', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/niche/fashion-apparel', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/niche/home-furniture', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/niche/health-beauty', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/niche/auto-motors', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/niche/supermarket-food', changefreq: 'daily', priority: 0.8 });
  }

  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, created_at, category, niche")
      .limit(1000);
      
    if (error) {
        console.error("Sitemap query error:", error);
    }

    if (products) {
      products.forEach((p: any) => {
        const lastMod = p.created_at
          ? new Date(p.created_at).toISOString()
          : new Date().toISOString();

        const catRaw = typeof p.category === "string" ? p.category : "";
        const parts = catRaw.split("::");
        const nicheFromCat = parts.length > 1 ? parts[0] : "Electronics";
        const subCategory = parts.length > 1 ? parts.slice(1).join("::") : catRaw;

        const nicheName = p.niche || nicheFromCat;
        const nicheSlug = slugify(nicheName);
        const subCategoryPath = subCategory
          .split("::")
          .map((part) => slugify(part))
          .filter(Boolean)
          .join("/");

        const productSlug = slugify(p.name);
        const fullCategoryPath = subCategoryPath
          ? `${nicheSlug}/${subCategoryPath}`
          : nicheSlug;
        const productPath = `/shop/${fullCategoryPath}/${productSlug}--${p.id}`;

        smStream.write({
          url: productPath,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: lastMod
        });
      });
    }
  } catch (err: any) {
    // Search engines should still receive a valid sitemap even if the
    // product catalog provider is temporarily slow or unavailable.
    console.error("Sitemap product feed unavailable; serving core sitemap:", err.message || err);
  }

  smStream.end();

  const sitemapOutput = await streamToPromise(smStream);
  res.status(200).send(sitemapOutput.toString());
});

export default router;
