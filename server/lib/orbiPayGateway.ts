import crypto from "crypto";

type PayGatewayRequestOptions = {
  method?: string;
  body?: Record<string, unknown>;
  serviceKey?: string;
  idempotencyKey?: string;
  runtimeEnvironment?: "demo" | "production";
};

export function getOrbiPayGatewayBaseUrl() {
  return (process.env.ORBI_PAY_GATEWAY_BASE_URL || process.env.ORBI_PAY_GATEWAY_URL || "").replace(/\/$/, "");
}

export function requireOrbiPayGatewayBaseUrl() {
  const baseUrl = getOrbiPayGatewayBaseUrl();
  if (!baseUrl) {
    throw new Error("ORBI_PAY_GATEWAY_BASE_URL is required for live ORBI Shop payment integration.");
  }
  return baseUrl;
}

export function getPayServiceKey(req?: any) {
  const incomingServiceKey =
    req?.headers?.["x-orbi-pay-service-key"] ||
    req?.headers?.["x-api-key"] ||
    "";
  return String(
    incomingServiceKey ||
      process.env.ORBI_SHOP_PAY_API_KEY ||
      process.env.ORBI_PAY_SERVICE_API_KEY ||
      "",
  ).trim();
}

async function callOrbiPayGateway(path: string, options: PayGatewayRequestOptions = {}) {
  const baseUrl = requireOrbiPayGatewayBaseUrl();
  const serviceKey = options.serviceKey || getPayServiceKey();
  const runtimeEnvironment = options.runtimeEnvironment ||
    (process.env.ORBI_PAY_GATEWAY_ENVIRONMENT || process.env.ORBI_PAY_ENVIRONMENT || "production").trim().toLowerCase();
  const idempotencyKey = String(
    options.idempotencyKey ||
      (options.body as any)?.idempotencyKey ||
      (options.body as any)?.idempotency_key ||
      "",
  ).trim();
  if (!serviceKey) {
    throw new Error("ORBI Shop Pay Gateway service key is required. Set ORBI_SHOP_PAY_API_KEY.");
  }

  const requestPath = path.startsWith("/") ? path : `/${path}`;
  const requestBody = options.body ? JSON.stringify(options.body) : undefined;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(18).toString("base64url");
  const bodyHash = crypto.createHash("sha256").update(requestBody || "").digest("hex");
  const canonical = [
    timestamp,
    nonce,
    (options.method || "GET").toUpperCase(),
    requestPath,
    bodyHash,
  ].join(".");
  const signature = crypto.createHmac("sha256", serviceKey).update(canonical).digest("hex");

  const timeoutMs = Number(process.env.ORBI_PAY_GATEWAY_TIMEOUT_MS || 45000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${requestPath}`, {
      method: options.method || "GET",
      headers: {
        "content-type": "application/json",
        "x-orbi-pay-service-key": serviceKey,
        "x-orbi-app-id": process.env.ORBI_CORE_APP_ID || "orbi-shop",
        "x-orbi-app-origin": process.env.ORBI_CORE_APP_ORIGIN || "https://shop.orbifinancial.com",
        "x-orbi-environment": runtimeEnvironment === "demo" || runtimeEnvironment === "sandbox" ? "demo" : "production",
        "x-orbi-pay-environment": runtimeEnvironment === "demo" || runtimeEnvironment === "sandbox" ? "sandbox" : "live",
        "x-orbi-timestamp": timestamp,
        "x-orbi-nonce": nonce,
        "x-orbi-signature": `sha256=${signature}`,
        ...(idempotencyKey
          ? {
              "idempotency-key": idempotencyKey,
              "x-idempotency-key": idempotencyKey,
              "x-orbi-idempotency-key": idempotencyKey,
            }
          : {}),
      },
      body: requestBody,
      signal: controller.signal,
    });
  } catch (error: any) {
    const message = error?.name === "AbortError"
      ? `ORBI Pay Gateway timed out after ${timeoutMs}ms`
      : error?.message || "ORBI Pay Gateway is unreachable";
    const gatewayError = new Error(message);
    (gatewayError as any).status = error?.name === "AbortError" ? 504 : 502;
    (gatewayError as any).code = error?.name === "AbortError" ? "ORBI_PAY_GATEWAY_TIMEOUT" : "ORBI_PAY_GATEWAY_UNREACHABLE";
    (gatewayError as any).details = { gateway: baseUrl, path, timeoutMs, retryable: true };
    throw gatewayError;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `ORBI Pay Gateway request failed with HTTP ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).code = response.status === 504
      ? "ORBI_PAY_GATEWAY_TIMEOUT"
      : response.status >= 500
        ? "ORBI_PAY_GATEWAY_UPSTREAM_ERROR"
        : "ORBI_PAY_GATEWAY_DECLINED";
    (error as any).details = data;
    throw error;
  }

  return data;
}

export const orbiPayGateway = {
  identity: {
    resolve(input: Record<string, unknown>) {
      return callOrbiPayGateway("/v1/identity/resolve", {
        method: "POST",
        body: input,
      });
    },
  },
  paymentProfiles: {
    create(input: Record<string, unknown>, options: Pick<PayGatewayRequestOptions, "idempotencyKey" | "serviceKey" | "runtimeEnvironment"> = {}) {
      return callOrbiPayGateway("/v1/payment-profiles", {
        method: "POST",
        body: input,
        ...options,
      });
    },
  },
  paysafe: {
    createEscrow(input: Record<string, unknown>, options: Pick<PayGatewayRequestOptions, "idempotencyKey" | "serviceKey" | "runtimeEnvironment"> = {}) {
      return callOrbiPayGateway("/v1/paysafe/escrows", {
        method: "POST",
        body: input,
        ...options,
      });
    },
    getEscrow(escrowId: string, options: Pick<PayGatewayRequestOptions, "serviceKey" | "runtimeEnvironment"> = {}) {
      return callOrbiPayGateway(`/v1/paysafe/escrows/${encodeURIComponent(escrowId)}`, {
        method: "GET",
        ...options,
      });
    },
    action(escrowId: string, input: Record<string, unknown>, options: Pick<PayGatewayRequestOptions, "idempotencyKey" | "serviceKey" | "runtimeEnvironment"> = {}) {
      return callOrbiPayGateway(`/v1/paysafe/escrows/${encodeURIComponent(escrowId)}`, {
        method: "POST",
        body: input,
        ...options,
      });
    },
  },
};

export function getPaySafeHoldMinutes() {
  return Number(process.env.ORBI_CORE_PAYSAFE_HOLD_MINUTES || process.env.ORBI_PAYSAFE_HOLD_MINUTES || 1440);
}
