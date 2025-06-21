-- Phase 3: Custom JWT Trigger and Auth Wiring

-- Step 1: Create the account_members table to link users to accounts
CREATE TABLE IF NOT EXISTS public.account_members (
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'coach', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, user_id)
);

-- Enable RLS for the account_members table
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

-- Step 2: Create the custom JWT claims function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  uid UUID;
  claims JSONB;
  acct_record RECORD;
BEGIN
  uid := (event->>'user_id')::UUID;
  claims := event->'claims';

  SELECT account_id, role
  INTO acct_record
  FROM public.account_members
  WHERE user_id = uid
  ORDER BY created_at ASC
  LIMIT 1;

  IF acct_record.account_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{account_id}', to_jsonb(acct_record.account_id));
    claims := jsonb_set(claims, '{role}', to_jsonb(acct_record.role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Step 3: Grant permissions for the JWT hook function
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.account_members TO supabase_auth_admin;

-- Revoke execute from other roles for security
REVOKE ALL ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC;

-- Step 4: Create RLS policies for account_members
-- Allow auth admin to read all memberships for the JWT hook
DROP POLICY IF EXISTS "Allow auth admin to read all memberships" ON public.account_members;
CREATE POLICY "Allow auth admin to read all memberships"
  ON public.account_members
  FOR SELECT
  TO supabase_auth_admin
  USING (true);
COMMENT ON POLICY "Allow auth admin to read all memberships" ON public.account_members IS 'Allows the auth service to read all memberships for populating JWT claims.';

-- Allow users to see other members of their own account
DROP POLICY IF EXISTS "Allow users to see members of their own account" ON public.account_members;
CREATE POLICY "Allow users to see members of their own account"
  ON public.account_members
  FOR SELECT
  USING (account_id = (SELECT public.get_account_id()));
COMMENT ON POLICY "Allow users to see members of their own account" ON public.account_members IS 'Isolates membership view to the active account in the JWT.';

-- Step 5: Add RLS policy for accounts table
-- Allow users to see their own account record
DROP POLICY IF EXISTS "Allow users to see their own account" ON public.accounts;
CREATE POLICY "Allow users to see their own account"
  ON public.accounts
  FOR SELECT
  USING (id = (SELECT public.get_account_id()));
COMMENT ON POLICY "Allow users to see their own account" ON public.accounts IS 'Isolates account view to the active account in the JWT.'; 