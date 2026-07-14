import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import fs from "fs";
import path from "path";
import { encrypt, decrypt, decryptIfEncrypted, decryptObject } from "../../src/lib/crypto.js";

const getSupabaseUrl = () => (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://127.0.0.1:9999") as string;
const getSupabaseAnonKey = () => (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "placeholder") as string;
const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Mock fetch to fail instantly if Supabase is not configured
const fastFailFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  return {
    ok: false,
    status: 400,
    statusText: "Bad Request",
    json: async () => ({ error: "Supabase not configured", code: "PGRST204" }),
    text: async () => JSON.stringify({ error: "Supabase not configured", code: "PGRST204" }),
    headers: new Headers({ "content-type": "application/json" }),
    clone: function() { return this; }
  } as any;
};



// --- PROXY INTERFACE ---
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!target.client) {
      const url = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();
      const serviceRoleKey = getSupabaseServiceRoleKey();
      
      target.client = createClient(url, serviceRoleKey || anonKey, {
        global: {
          fetch: url === "http://127.0.0.1:9999" ? fastFailFetch : undefined,
        },
        realtime: {
          transport: ws as any,
        },
      });
    }
    return target.client[prop];
  }
});

export function getUserSupabase(req?: any): any {
  let authHeader = req?.headers?.authorization || "";
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "").trim();
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          authHeader = "";
        }
      }
    } catch (e) {}
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return createClient(url, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
      fetch: url === "http://127.0.0.1:9999" ? fastFailFetch : undefined,
    },
    realtime: {
      transport: ws as any,
    },
  });
}

export function getAdminSupabase(): any {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey || !url) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and URL are required for admin database access.");
  }

  return createClient(url, serviceRoleKey, {
    global: {
      fetch: url === "http://127.0.0.1:9999" ? fastFailFetch : undefined,
    },
    realtime: {
      transport: ws as any,
    },
  });
}

export function getSupabase(req?: any): any {
  return getUserSupabase(req);
}

export { encrypt, decrypt, decryptIfEncrypted, decryptObject };
