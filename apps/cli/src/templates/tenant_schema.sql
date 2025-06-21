-- Template for creating a new tenant's schema and tables.
-- The placeholder '{{schema_name}}' will be replaced by the CLI.

CREATE SCHEMA IF NOT EXISTS "{{schema_name}}";

CREATE TABLE IF NOT EXISTS "{{schema_name}}".sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "{{schema_name}}".sites IS 'Stores site/portal records for an agency.';

CREATE TABLE IF NOT EXISTS "{{schema_name}}".pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES "{{schema_name}}".sites(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL,
  title       TEXT NOT NULL,
  content     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "{{schema_name}}".pages IS 'Stores individual pages within a site.';

CREATE TABLE IF NOT EXISTS "{{schema_name}}".posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES "{{schema_name}}".sites(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL,
  title       TEXT NOT NULL,
  content     JSONB,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "{{schema_name}}".posts IS 'Stores blog posts for a site.';

CREATE TABLE IF NOT EXISTS "{{schema_name}}".site_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES "{{schema_name}}".sites(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "{{schema_name}}".site_users IS 'Manages end-user access to specific sites.';

-- Add other tenant-specific tables here as needed (e.g., forms, leads)

-- Apply RLS to the new tables
ALTER TABLE "{{schema_name}}".sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE "{{schema_name}}".pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE "{{schema_name}}".posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE "{{schema_name}}".site_users ENABLE ROW LEVEL SECURITY;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trigger_sites_updated ON "{{schema_name}}".sites;
CREATE TRIGGER trigger_sites_updated
  BEFORE UPDATE ON "{{schema_name}}".sites
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trigger_pages_updated ON "{{schema_name}}".pages;
CREATE TRIGGER trigger_pages_updated
  BEFORE UPDATE ON "{{schema_name}}".pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trigger_posts_updated ON "{{schema_name}}".posts;
CREATE TRIGGER trigger_posts_updated
  BEFORE UPDATE ON "{{schema_name}}".posts
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_updated_at();

-- Plan limit enforcement trigger
DROP TRIGGER IF EXISTS check_site_limit_before_insert ON "{{schema_name}}".sites;
CREATE TRIGGER check_site_limit_before_insert
  BEFORE INSERT ON "{{schema_name}}".sites
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_sites_limit();

-- Grant permissions to the authenticated role
GRANT USAGE ON SCHEMA "{{schema_name}}" TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA "{{schema_name}}" TO authenticated;

-- RLS Policies
CREATE POLICY "Allow full access to own tenant data on sites"
ON "{{schema_name}}".sites
FOR ALL USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow full access to own tenant data on sites" ON "{{schema_name}}".sites IS 'Isolates all site operations to the active account in the JWT.';

CREATE POLICY "Allow full access to own tenant data on pages"
ON "{{schema_name}}".pages
FOR ALL USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow full access to own tenant data on pages" ON "{{schema_name}}".pages IS 'Isolates all page operations to the active account in the JWT.';

CREATE POLICY "Allow full access to own tenant data on posts"
ON "{{schema_name}}".posts
FOR ALL USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow full access to own tenant data on posts" ON "{{schema_name}}".posts IS 'Isolates all post operations to the active account in the JWT.';

CREATE POLICY "Allow full access to own tenant data on site_users"
ON "{{schema_name}}".site_users
FOR ALL USING (account_id = public.get_account_id());
COMMENT ON POLICY "Allow full access to own tenant data on site_users" ON "{{schema_name}}".site_users IS 'Isolates all site_user operations to the active account in the JWT.'; 