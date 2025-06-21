import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

// Load environment variables from .env file
// Note: This might be redundant if 'dotenv/config' is already loaded, but it's explicit.
import('dotenv').then(dotenv => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
});

// This is a singleton to ensure we only have one admin client instance.
let supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env file');
  }

  supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
};

// NO OTHER EXPORTS - supabase client should be retrieved via getSupabaseAdmin 