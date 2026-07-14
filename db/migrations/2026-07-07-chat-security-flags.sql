-- Add security tracking to both customers and sellers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS security_flags INTEGER DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS block_reason TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS security_flags INTEGER DEFAULT 0;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Ensure frozen status is available for customers (already is for sellers)
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_status_check;
ALTER TABLE public.customers ADD CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'frozen'));
