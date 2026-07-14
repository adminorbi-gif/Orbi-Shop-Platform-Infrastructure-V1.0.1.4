import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const gmpKey = process.env.GOOGLE_MAPS_ROUTES_API_KEY || env.GOOGLE_MAPS_ROUTES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_PLACES_API_KEY || env.GOOGLE_MAPS_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY || env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || env.VITE_GOOGLE_MAPS_PLATFORM_KEY || "";
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        input: {
          main: 'index.html',
          admin: 'admin.html'
        },
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, "/");
            if (normalizedId.includes("/src/pages/ClientApp/components/")) return "client-components";
            if (normalizedId.includes("/src/pages/ClientApp/profile/")) return "client-profile";
            if (normalizedId.includes("/src/pages/ProductDetailPage")) return "product-detail";
            if (normalizedId.includes("/src/components/seller/")) return "seller-widgets";
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('motion')) return 'vendor-motion';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-documents';
            if (id.includes('html5-qrcode')) return 'vendor-scanner';
            if (id.includes('@supabase')) return 'vendor-auth';
            return undefined;
          }
        }
      }
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl || ""),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey || ""),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(gmpKey || "")
    }
  };
});
