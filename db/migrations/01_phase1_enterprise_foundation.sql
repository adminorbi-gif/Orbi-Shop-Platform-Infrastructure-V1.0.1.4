-- Phase 1: Enterprise Trust & Transactions Foundation Schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Identity & Roles Module
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-seed core roles
INSERT INTO public.roles (name, description) VALUES
('buyer', 'Standard consumer or B2B buyer'),
('seller', 'Store owner'),
('broker', 'Wakala / Commission agent'),
('producer', 'Farmer or Manufacturer'),
('retailer', 'Offline shop owner'),
('driver', 'Logistics partner driver'),
('inspector', 'Quality inspector'),
('admin', 'Platform administrator')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended', 'frozen')),
  kyc_status TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'sw',
  date_of_birth DATE,
  gender TEXT,
  address_line1 TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Tanzania',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business & Store Module
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  legal_business_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tin_number TEXT,
  vrn_number TEXT,
  business_license_url TEXT,
  kyb_status TEXT DEFAULT 'unverified' CHECK (kyb_status IN ('unverified', 'pending', 'verified', 'rejected')),
  store_status TEXT DEFAULT 'pending_verification' CHECK (store_status IN ('pending_verification', 'active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_members (
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL CHECK (member_role IN ('owner', 'manager', 'sales_rep', 'support')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (store_id, user_id)
);

-- 3. Immutable Inventory Ledger
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL, -- Will reference products table (skipping strict FK for existing products for now)
  variant_id UUID,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'sale', 'return')),
  quantity_change INTEGER NOT NULL,
  reference_id TEXT, -- E.g., Order ID, POS Sync ID
  actor_id UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactional Payment Ledger (Orbi Pay Integration)
CREATE TABLE IF NOT EXISTS public.transaction_ledger_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL, -- References orders
  buyer_id UUID REFERENCES public.users(id),
  store_id UUID REFERENCES public.stores(id),
  transaction_reference TEXT UNIQUE NOT NULL, -- Orbi Pay Reference
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('m-pesa', 'tigo-pesa', 'airtel-money', 'halopesa', 'bank_transfer', 'usdc')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment_escrowed', 'escrow_released', 'refunded', 'commission_paid')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  idempotency_key TEXT UNIQUE NOT NULL,
  provider_callback_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
