import 'dotenv/config';
import prompts from 'prompts';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { migrate } from './migrate.js';
import { seedDb } from './seed.js';

export async function resetDb(force: boolean) {
  if (!force) {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'This will wipe all data in your local public schema. Continue?',
      initial: false,
    });

    if (!response.value) {
      console.log('Reset cancelled.');
      return;
    }
  }

  try {
    console.log('Resetting database...');
    const supabase = getSupabaseAdmin();

    // The order of operations is critical here to avoid dependency issues.
    console.log('Dropping public schema...');
    await supabase.rpc('execute_sql', { sql: 'DROP SCHEMA public CASCADE;' });
    
    console.log('Recreating public schema and granting access...');
    await supabase.rpc('execute_sql', { sql: 'CREATE SCHEMA public;' });
    await supabase.rpc('execute_sql', { sql: 'GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;' });

    console.log('Recreating required extensions...');
    await supabase.rpc('execute_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";' });
    await supabase.rpc('execute_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";' });
    await supabase.rpc('execute_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";' });
    await supabase.rpc('execute_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";' });
    await supabase.rpc('execute_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";' });
    await supabase.rpc('execute_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";' });

    console.log('✔ Database reset complete. Running migrations...');
    await migrate();

    console.log('Rerunning seed...');
    await seedDb();

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ An error occurred during database reset:', err.message);
    } else {
      console.error('❌ An unknown error occurred during database reset.');
    }
    process.exit(1);
  }
} 