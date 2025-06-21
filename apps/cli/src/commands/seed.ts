import 'dotenv/config';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { User } from '@supabase/supabase-js';
import { slugify } from '../lib/slugify.js';

export async function seedDb() {
  try {
    const supabase = getSupabaseAdmin();
    console.log('Seeding plans...');
    const { error: planError } = await supabase.from('plans').upsert([
      { plan_id: 'free', name: 'Free', max_sites: 1 },
      { plan_id: 'pro', name: 'Pro', max_sites: 10 },
    ]);
    if (planError) throw planError;
    console.log('✔ Plans seeded.');

    const founderEmail = process.env.FOUNDER_EMAIL;
    const founderPassword = process.env.FOUNDER_PASSWORD;

    if (!founderEmail || !founderPassword) {
      throw new Error('FOUNDER_EMAIL and FOUNDER_PASSWORD must be set in .env file');
    }

    console.log(`Checking for founder user: ${founderEmail}...`);
    
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    if (getUserError) throw getUserError;

    const existingUser = users.find((u: User) => u.email === founderEmail);
    let userId: string;

    if (existingUser) {
      console.log('Founder user already exists, skipping creation.');
      userId = existingUser.id;
    } else {
      console.log('Creating founder user...');
      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email: founderEmail,
        password: founderPassword,
        email_confirm: true,
      });
      if (authError) throw authError;
      if (!user) throw new Error('User creation did not return a user.');
      userId = user.id;
      console.log('✔ Founder user created.');
    }

    console.log('Checking for founder account...');
    const accountName = 'Founder Team';
    const schemaName = slugify(founderEmail.split('@')[0]);
    
    const { data: existingAccount } = await supabase.from('accounts').select('id').eq('schema_name', schemaName).single();

    if (existingAccount) {
      console.log('Founder account already exists.');
    } else {
      console.log('Creating founder account and membership...');
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          schema_name: schemaName,
          account_name: accountName,
          plan_id: 'pro',
        })
        .select('id')
        .single();
      
      if (accountError) throw accountError;
      if (!account) throw new Error('Account creation did not return an account.');
      const accountId = account.id;

      const { error: memberError } = await supabase.from('account_members').insert({
        account_id: accountId,
        user_id: userId,
        role: 'owner',
      });
      if (memberError) throw memberError;
      console.log('✔ Founder account and membership created.');
    }

    console.log('Database seeding complete! 🎉');

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ An error occurred during seeding:', err.message);
    } else {
      console.error('❌ An unknown error occurred during seeding.');
    }
    process.exit(1);
  }
} 