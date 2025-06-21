-- Phase 1: Initial Schema Creation

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Create plans table for subscription plans
CREATE TABLE IF NOT EXISTS public.plans (
  plan_id        TEXT    PRIMARY KEY,
  name           TEXT    NOT NULL,
  monthly_price  INTEGER,
  annual_price   INTEGER,
  stripe_price_id   TEXT,
  stripe_product_id TEXT,
  max_sites      INTEGER,
  max_users      INTEGER
);

-- Grant read access to authenticated users for the plans table
GRANT SELECT ON public.plans TO authenticated;

-- Seed initial plan data
INSERT INTO public.plans(plan_id, name, monthly_price, annual_price, stripe_price_id, stripe_product_id, max_sites, max_users)
VALUES 
  ('free', 'Free Plan', 0, 0, 'price_123_free', 'prod_123_free', 1, 1),
  ('pro', 'Pro Plan', 2000, 20000, 'price_456_pro', 'prod_456_pro', 5, 5)
ON CONFLICT (plan_id) DO NOTHING;

-- Create accounts table for tenant information
CREATE TABLE IF NOT EXISTS public.accounts (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name     TEXT    NOT NULL UNIQUE,
  account_name    TEXT    NOT NULL,
  plan_id         TEXT    NOT NULL DEFAULT 'free' REFERENCES public.plans(plan_id),
  plan_status     TEXT    NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  maintenance_mode  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create account_members table to link users to accounts
CREATE TABLE IF NOT EXISTS public.account_members (
  account_id UUID    NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id    UUID    NOT NULL,
  role       TEXT    NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, user_id)
);
CREATE INDEX IF NOT EXISTS account_members_user_idx ON public.account_members(user_id);

-- Create features table for feature flags
CREATE TABLE IF NOT EXISTS public.features (
  feature_key   TEXT PRIMARY KEY,
  description   TEXT NOT NULL
);

-- Grant read access to authenticated users for the features table
GRANT SELECT ON public.features TO authenticated;

-- Seed initial feature data
INSERT INTO public.features(feature_key, description) VALUES 
  ('CUSTOM_DOMAIN', 'Enable custom domains for agency sites'),
  ('WHITE_LABEL', 'White-label option to remove Ozza branding'),
  ('ANALYTICS_DASHBOARD', 'Access to analytics dashboard feature'),
  ('AI_CONTENT_ASSISTANT', 'AI content assistant tool for site builder')
ON CONFLICT (feature_key) DO NOTHING;

-- Create account_features table to toggle features for each account
CREATE TABLE IF NOT EXISTS public.account_features (
  account_id   UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL REFERENCES public.features(feature_key) ON DELETE CASCADE,
  enabled      BOOLEAN NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, feature_key)
);

-- Create a reusable function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create domains table for custom domain mapping
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID    NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  host        TEXT    NOT NULL UNIQUE,
  site_id     UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS domains_host_idx ON public.domains(host);
COMMENT ON TABLE public.domains IS 'Maps custom domain hostnames to tenant sites';

-- Attach the trigger to the domains table
DROP TRIGGER IF EXISTS trigger_domains_updated ON public.domains;
CREATE TRIGGER trigger_domains_updated
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_updated_at();

-- Create settings table for global platform configuration
CREATE TABLE IF NOT EXISTS public.settings (
  key         TEXT    PRIMARY KEY,
  value       JSONB   NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Secure the settings table
REVOKE ALL ON public.settings FROM authenticated, anon;

-- Seed initial settings
INSERT INTO public.settings(key, value) 
VALUES ('maintenance_all', 'false') 
ON CONFLICT (key) DO NOTHING;

-- Create billing_events table to log Stripe webhooks
CREATE TABLE IF NOT EXISTS public.billing_events (
  id           TEXT    PRIMARY KEY,
  event_type   TEXT    NOT NULL,
  account_id   UUID    REFERENCES public.accounts(id) ON DELETE CASCADE,
  raw          JSONB   NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS billing_events_account_idx ON public.billing_events(account_id);

-- Enable RLS on multi-tenant tables
ALTER TABLE public.accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features        ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's ID
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get the active account_id from JWT claims
CREATE OR REPLACE FUNCTION public.get_account_id()
RETURNS UUID AS $$
DECLARE
  account_id_claim UUID;
BEGIN
  SELECT current_setting('request.jwt.claims', true)::jsonb->>'account_id'
  INTO account_id_claim;
  RETURN account_id_claim;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS POLICIES --

DROP POLICY IF EXISTS "Allow individual read access on accounts" ON public.accounts;
CREATE POLICY "Allow individual read access on accounts"
ON public.accounts
FOR SELECT USING (id = public.get_account_id());
COMMENT ON POLICY "Allow individual read access on accounts" ON public.accounts IS 'Isolates account records to the currently active account in the JWT.';

DROP POLICY IF EXISTS "Allow members to read their own account membership" ON public.account_members;
CREATE POLICY "Allow members to read their own account membership"
ON public.account_members
FOR SELECT USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow members to read their own account membership" ON public.account_members IS 'Isolates account membership records to the currently active account in the JWT.';

DROP POLICY IF EXISTS "Allow members to read their own account features" ON public.account_features;
CREATE POLICY "Allow members to read their own account features"
ON public.account_features
FOR SELECT USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow members to read their own account features" ON public.account_features IS 'Isolates account feature records to the currently active account in the JWT.';

DROP POLICY IF EXISTS "Allow members to read their own account domains" ON public.domains;
CREATE POLICY "Allow members to read their own account domains"
ON public.domains
FOR SELECT USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow members to read their own account domains" ON public.domains IS 'Isolates account domain records to the currently active account in the JWT.';

DROP POLICY IF EXISTS "Allow members to read their own billing events" ON public.billing_events;
CREATE POLICY "Allow members to read their own billing events"
ON public.billing_events
FOR SELECT USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow members to read their own billing events" ON public.billing_events IS 'Isolates billing event records to the currently active account in the JWT.';

-- Policies for public tables
DROP POLICY IF EXISTS "Allow authenticated users to read plans" ON public.plans;
CREATE POLICY "Allow authenticated users to read plans"
ON public.plans
FOR SELECT
TO authenticated
USING (true);
COMMENT ON POLICY "Allow authenticated users to read plans" ON public.plans IS 'Allows any authenticated user to read subscription plan details.';

DROP POLICY IF EXISTS "Allow authenticated users to read features" ON public.features;
CREATE POLICY "Allow authenticated users to read features"
ON public.features
FOR SELECT
TO authenticated
USING (true);
COMMENT ON POLICY "Allow authenticated users to read features" ON public.features IS 'Allows any authenticated user to read the list of available features.'; 