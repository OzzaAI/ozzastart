require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const sql = `
    -- CREATE TABLE public.plans (
    --   plan_id TEXT PRIMARY KEY,
    --   name TEXT NOT NULL,
    --   monthly_price INTEGER,
    --   annual_price INTEGER,
    --   stripe_price_id TEXT,
    --   stripe_product_id TEXT,
    --   max_sites INTEGER,
    --   max_users INTEGER
    -- );

    -- CREATE TABLE public.features (
    --   feature_key TEXT PRIMARY KEY,
    --   description TEXT NOT NULL
    -- );

    

    DROP TABLE IF EXISTS public.billing_events;
    DROP TABLE IF EXISTS public.domains;
    DROP TABLE IF EXISTS public.account_features;
    DROP TABLE IF EXISTS public.client_invitations;
    DROP TABLE IF EXISTS public.ozza_account_members;
    DROP TABLE IF EXISTS public.ozza_accounts;
    DROP TABLE IF EXISTS public.user_profiles;

    CREATE TABLE public.ozza_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      schema_name TEXT NOT NULL UNIQUE,
      account_name TEXT NOT NULL,
      plan_id TEXT NOT NULL REFERENCES public.plans(plan_id),
      plan_status TEXT NOT NULL DEFAULT 'active',
      stripe_customer_id TEXT,
      maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
      logo_url TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE public.ozza_account_members (
      account_id UUID NOT NULL REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, user_id)
    );

    CREATE TABLE public.user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL UNIQUE,
      phone_number TEXT,
      address TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE public.client_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      account_id UUID NOT NULL REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE public.account_features (
      account_id UUID NOT NULL REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      feature_key TEXT NOT NULL REFERENCES public.features(feature_key) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, feature_key)
    );

    CREATE TABLE public.domains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID NOT NULL REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      host TEXT NOT NULL UNIQUE,
      site_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- CREATE TABLE public.settings (
    --   key TEXT PRIMARY KEY,
    --   value JSONB NOT NULL,
    --   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- );

    CREATE TABLE public.billing_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      account_id UUID REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      raw JSONB NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `;

    await client.query(sql);
    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
