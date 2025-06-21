-- Phase 2 Hardening: Add a trigger to drop a tenant's schema when their account is deleted.

-- 1. Create the function to be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_account_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- OLD holds the values of the row being deleted
  PERFORM execute_sql('DROP SCHEMA IF EXISTS ' || quote_ident(OLD.schema_name) || ' CASCADE');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger that fires AFTER a row is deleted from public.accounts
DROP TRIGGER IF EXISTS on_account_deleted ON public.accounts;
CREATE TRIGGER on_account_deleted
  AFTER DELETE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_account_deleted(); 