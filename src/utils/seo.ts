import type { Product } from "../types";
import { formatCurrency } from "../lib/storage";

export function updateDynamicProductSchema(product: Product | null) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const schemaEl = document.getElementById("dynamic-seo-schema") as HTMLScriptElement;
  if (!schemaEl) return;

  const base = window.location.origin;
  const fullUrl = base + window.location.pathname + window.location.search;
  
  // Base schemas that should always be present
  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Orbi Shop",
      "url": base + "/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": base + "/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Orbi Shop",
      "url": base + "/",
      "logo": "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
    }
  ];

  if (product) {
    const productName = product.name || "Orbi Shop Product";
    const productPrice = Number.isFinite(product.price) ? product.price.toFixed(2) : "0.00";
    const productImage = Array.isArray(product.images) && product.images[0] ? product.images[0] : "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";
    const productDesc = product.description 
      ? product.description.substring(0, 160) + "..." 
      : `Nunua ${productName} kwa bei ya ${formatCurrency(product.price)}.`;
    
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": fullUrl,
      "name": productName,
      "description": productDesc,
      "image": [productImage],
      "sku": product.id,
      "category": product.category,
      "brand": {
        "@type": "Brand",
        "name": "Orbi Shop"
      },
      "offers": {
        "@type": "Offer",
        "url": fullUrl,
        "priceCurrency": "TZS",
        "price": productPrice,
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    });
  }

  schemaEl.textContent = JSON.stringify(schemas);
}
