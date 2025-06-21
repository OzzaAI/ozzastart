-- Create the public schema if it doesn't exist. This makes the db:reset command resilient.
CREATE SCHEMA IF NOT EXISTS public;

-- Creates a function to execute raw SQL as the service role.
-- This is necessary for the migration CLI to work.
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 