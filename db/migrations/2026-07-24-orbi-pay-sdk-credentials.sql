-- ORBI Pay SDK credentials registry.
-- Secrets are not stored in plaintext. Operators can view key metadata in admin UI,
-- while live SDK verification must compare hashes and decrypt only when strictly required.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.orbi_pay_sdk_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  key_prefix TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_secret_encrypted TEXT NOT NULL,
  webhook_secret_encrypted TEXT,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_origins JSONB NOT NULL DEFAULT '[]'::jsonb,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'revoked')),
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orbi_pay_sdk_credentials_client_env
  ON public.orbi_pay_sdk_credentials(client_id, environment)
  WHERE status <> 'revoked';

CREATE INDEX IF NOT EXISTS idx_orbi_pay_sdk_credentials_merchant
  ON public.orbi_pay_sdk_credentials(merchant_id, environment, status);

COMMENT ON TABLE public.orbi_pay_sdk_credentials IS
  'Encrypted ORBI Pay SDK credentials issued to merchant platforms such as OrbiShop.';

COMMENT ON COLUMN public.orbi_pay_sdk_credentials.api_key_hash IS
  'SHA-256 hash of the SDK API key. Never store raw API keys in database.';

COMMENT ON COLUMN public.orbi_pay_sdk_credentials.api_secret_encrypted IS
  'Encrypted SDK API secret. Decrypt only inside trusted gateway/server flows.';
