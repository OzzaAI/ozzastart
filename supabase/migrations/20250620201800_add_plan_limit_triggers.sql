-- Phase 4: Plan Limit Enforcement
-- This migration adds a trigger function to enforce the max_sites limit per plan.

CREATE OR REPLACE FUNCTION public.enforce_max_sites_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_site_count INT;
  plan_max_sites INT;
  tenant_schema TEXT;
BEGIN
  -- Get the tenant's schema from the trigger's context
  tenant_schema := TG_TABLE_SCHEMA;

  -- Get the plan's site limit
  SELECT p.max_sites INTO plan_max_sites
  FROM public.accounts a
  JOIN public.plans p ON a.plan_id = p.plan_id
  WHERE a.id = NEW.account_id;

  -- Get the current number of sites for the tenant
  EXECUTE format('SELECT count(*) FROM %I.sites WHERE account_id = %L', tenant_schema, NEW.account_id)
  INTO current_site_count;

  -- Check if the limit is exceeded
  IF current_site_count >= plan_max_sites THEN
    RAISE EXCEPTION 'Cannot create new site. You have reached the maximum of % sites allowed for your current plan.', plan_max_sites;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.enforce_max_sites_limit() TO authenticated; 