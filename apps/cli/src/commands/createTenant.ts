import 'dotenv/config';
import * as fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { slugify } from '../lib/slugify.js';
import cuid from 'cuid';
import { fileURLToPath } from 'url';
import { User } from '@supabase/supabase-js';

export async function createTenant(accountName: string, ownerEmail: string) {
  try {
    const supabase = getSupabaseAdmin();
    let ownerId: string | null = null;
    
    console.log(`Finding user with email: ${ownerEmail}`);
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if(userError) throw userError;

    const foundUser = users.find((u: User) => u.email === ownerEmail);
    if (foundUser) {
      ownerId = foundUser.id;
      console.log(`Found user ID: ${ownerId}`);
    } else {
      throw new Error(`User with email ${ownerEmail} not found.`);
    }

    const newCuid = cuid();
    const schemaName = `${slugify(accountName)}_${newCuid}`;
    console.log(`Generated schema name: ${schemaName}`);

    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({ account_name: accountName, schema_name: schemaName })
      .select()
      .single();

    if (accountError) throw accountError;
    if (!newAccount) throw new Error('Could not create account record.');
    const accountId = newAccount.id;
    console.log(`Account created successfully with ID: ${accountId}`);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatePath = path.resolve(__dirname, '../templates/tenant_schema.sql');
    const templateSql = await fs.readFile(templatePath, 'utf8');
    const tenantSql = templateSql.replace(/{{schema_name}}/g, schemaName);

    const { error: rpcError } = await supabase.rpc('execute_sql', { sql: tenantSql });
    if (rpcError) throw rpcError;
    console.log('Tenant schema and tables created successfully.');
    
    if (ownerId) {
      console.log(`Linking owner ${ownerId} to account ${accountId}...`);
      const { error: memberError } = await supabase
        .from('account_members')
        .insert({ account_id: accountId, user_id: ownerId, role: 'owner' });
      if (memberError) throw memberError;
      console.log('Owner linked successfully.');
    }

    console.log(`✔ Tenant ${accountName} created successfully.`);

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ An error occurred during tenant creation:', err.message);
    } else {
      console.error('❌ An unknown error occurred during tenant creation.');
    }
    process.exit(1);
  }
} 