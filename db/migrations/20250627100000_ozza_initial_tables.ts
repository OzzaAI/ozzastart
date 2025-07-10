import { pgTable, text, timestamp, integer, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export async function up(pgb) {
  await pgb.execute(sql`
    CREATE TABLE public.plans (
      plan_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      monthly_price INTEGER,
      annual_price INTEGER,
      stripe_price_id TEXT,
      stripe_product_id TEXT,
      max_sites INTEGER,
      max_users INTEGER
    );

    CREATE TABLE public.features (
      feature_key TEXT PRIMARY KEY,
      description TEXT NOT NULL
    );

    CREATE TABLE public.ozza_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      schema_name TEXT NOT NULL UNIQUE,
      account_name TEXT NOT NULL,
      plan_id TEXT NOT NULL REFERENCES public.plans(plan_id),
      plan_status TEXT NOT NULL DEFAULT 'active',
      stripe_customer_id TEXT,
      maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE public.account_members (
      account_id UUID NOT NULL REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, user_id)
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

    CREATE TABLE public.settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE public.billing_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      account_id UUID REFERENCES public.ozza_accounts(id) ON DELETE CASCADE,
      raw JSONB NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function down(pgb) {
  await pgb.execute(sql`
    DROP TABLE public.billing_events;
    DROP TABLE public.settings;
    DROP TABLE public.domains;
    DROP TABLE public.account_features;
    DROP TABLE public.account_members;
    DROP TABLE public.ozza_accounts;
    
    DROP TABLE public.features;
    DROP TABLE public.plans;
  `);
}