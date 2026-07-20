-- Seller payment profile references for ORBI Pay Gateway settlement.
-- Buyers checking out through OrbiShop remain transient payment actors; this is for merchants/sellers only.

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS payment_profile_id TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS payment_profile_status TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS payment_profile_scopes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS settlement_method TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS settlement_account_hint TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS settlement_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sellers_payment_profile_id
  ON public.sellers(payment_profile_id)
  WHERE payment_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sellers_settlement_method
  ON public.sellers(settlement_method)
  WHERE settlement_method IS NOT NULL;
