import "dotenv/config";
import crypto from "crypto";
import { getAdminSupabase, encrypt } from "../server/lib/supabase.js";

const environment = (process.env.ORBI_PAY_SDK_ENVIRONMENT || "production").trim().toLowerCase();
const merchantId = (process.env.ORBI_PAY_SDK_MERCHANT_ID || "orbi-shop").trim();
const merchantName = (process.env.ORBI_PAY_SDK_MERCHANT_NAME || "Orbi Shop").trim();
const clientId = (process.env.ORBI_PAY_SDK_CLIENT_ID || "orbi-shop").trim();
const createdBy = (process.env.ORBI_PAY_SDK_CREATED_BY || "bootstrap").trim();
const webhookUrl = (process.env.ORBI_SHOP_PAY_WEBHOOK_URL || "").trim();
const allowedOrigins = (process.env.ORBI_PAY_SDK_ALLOWED_ORIGINS || "https://shop.orbifinancial.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!["sandbox", "production"].includes(environment)) {
  throw new Error("ORBI_PAY_SDK_ENVIRONMENT must be sandbox or production.");
}

const scopes = [
  "identity.resolve",
  "payment_profiles.create",
  "payment_intents.create",
  "payment_intents.read",
  "paysafe.escrows.create",
  "paysafe.escrows.read",
  "paysafe.escrows.action",
  "webhooks.receive",
  "webhooks.replay",
];

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

const keyPrefix = environment === "production" ? "op_live" : "op_test";
const apiKey = `${keyPrefix}_${clientId.replace(/[^a-zA-Z0-9]/g, "_")}_${randomToken(24)}`;
const apiSecret = `os_${environment}_${randomToken(40)}`;
const webhookSecret = `whsec_${environment}_${randomToken(40)}`;

async function main() {
  const admin = getAdminSupabase();
  const now = new Date().toISOString();

  const payload = {
    merchant_id: merchantId,
    merchant_name: merchantName,
    client_id: clientId,
    environment,
    key_prefix: keyPrefix,
    api_key_hash: sha256(apiKey),
    api_secret_encrypted: encrypt(apiSecret),
    webhook_secret_encrypted: encrypt(webhookSecret),
    scopes,
    allowed_origins: allowedOrigins,
    webhook_url: webhookUrl || null,
    status: "active",
    created_by: createdBy,
    updated_at: now,
    metadata: {
      source: "orbi-shop-bootstrap",
      note: "Raw credentials are printed once by this script and must be stored in the server secret manager/env.",
    },
  };

  const { data: existing, error: lookupError } = await admin
    .from("orbi_pay_sdk_credentials")
    .select("id,status")
    .eq("client_id", clientId)
    .eq("environment", environment)
    .neq("status", "revoked")
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing?.id) {
    const { error: revokeError } = await admin
      .from("orbi_pay_sdk_credentials")
      .update({
        status: "rotating",
        rotated_at: now,
        updated_at: now,
        metadata: {
          rotated_by: createdBy,
          rotated_reason: "new bootstrap credentials generated",
        },
      })
      .eq("id", existing.id);

    if (revokeError) {
      throw revokeError;
    }
  }

  const { data, error } = await admin
    .from("orbi_pay_sdk_credentials")
    .insert(payload)
    .select("id,merchant_id,client_id,environment,key_prefix,status,created_at")
    .single();

  if (error) {
    throw error;
  }

  console.log("ORBI Pay SDK credentials created.");
  console.log(JSON.stringify({ credential: data, allowedOrigins, webhookUrl }, null, 2));
  console.log("");
  console.log("Store these values in the server secret manager/env. They are shown only once:");
  console.log(`ORBI_SHOP_PAY_API_KEY=${apiKey}`);
  console.log(`ORBI_SHOP_PAY_API_SECRET=${apiSecret}`);
  console.log(`ORBI_SHOP_PAY_WEBHOOK_SECRET=${webhookSecret}`);
}

main().catch((error) => {
  console.error("Failed to bootstrap ORBI Pay SDK credentials:", error?.message || error);
  process.exit(1);
});
