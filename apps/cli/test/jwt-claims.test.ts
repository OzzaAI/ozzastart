import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'jsonwebtoken';
import 'dotenv/config';

// Ensure environment variables are loaded
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const founderEmail = process.env.FOUNDER_EMAIL || 'founder@example.com';
const founderPassword = process.env.FOUNDER_PASSWORD || 'password';

if (!supabaseUrl || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your .env file');
}

describe('JWT Claims Hook', () => {
  it('should include account_id and role in the JWT for a seeded user', async () => {
    // 1. Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 2. Fetch the seeded user and their account details to get expected values
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', founderEmail)
      .single();

    expect(userError, 'Error fetching user').toBeNull();
    expect(userData, 'Founder user not found in auth.users').toBeDefined();
    const userId = userData!.id;

    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', userId)
      .single();
    
    expect(memberError, 'Error fetching account membership').toBeNull();
    expect(memberData, 'Founder membership not found in public.account_members').toBeDefined();
    const { account_id: expectedAccountId, role: expectedRole } = memberData!;

    // 3. Sign in as the user to get an access token
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: founderEmail,
      password: founderPassword,
    });

    expect(signInError, 'Sign-in failed').toBeNull();
    expect(signInData.session, 'No session returned after sign-in').toBeDefined();
    const token = signInData.session!.access_token;

    // 4. Decode the JWT to inspect its claims
    const decodedToken = decode(token) as { [key: string]: string } | null;
    expect(decodedToken).not.toBeNull();

    if (!decodedToken) {
      // This should not be reached due to the expect assertion above, but it satisfies the linter.
      throw new Error('decodedToken is null');
    }

    // 5. Assert that the custom claims exist and match the seed data
    expect(decodedToken.account_id).toBeDefined();
    expect(decodedToken.role).toBeDefined();
    expect(decodedToken.account_id).toBe(expectedAccountId);
    expect(decodedToken.role).toBe(expectedRole);
  }, 30000);
}); 