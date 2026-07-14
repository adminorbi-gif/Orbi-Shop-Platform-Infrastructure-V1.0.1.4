-- The Wakala (Broker/Agent) Commerce Mode module
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS broker_commission_percent NUMERIC DEFAULT 0;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_commission_amount NUMERIC DEFAULT 0;

