require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateAccountsAndMembers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    // Migrate ozza_accounts
    const accountsDataPath = path.join(__dirname, 'ozza_accounts_export.json');
    const accounts = JSON.parse(fs.readFileSync(accountsDataPath, 'utf8'));

    for (const account of accounts) {
      try {
        const insertAccount = `
          INSERT INTO public.ozza_accounts (id, schema_name, account_name, plan_id, plan_status, stripe_customer_id, maintenance_mode, logo_url, primary_color, secondary_color, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            schema_name = EXCLUDED.schema_name,
            account_name = EXCLUDED.account_name,
            plan_id = EXCLUDED.plan_id,
            plan_status = EXCLUDED.plan_status,
            stripe_customer_id = EXCLUDED.stripe_customer_id,
            maintenance_mode = EXCLUDED.maintenance_mode,
            logo_url = EXCLUDED.logo_url,
            primary_color = EXCLUDED.primary_color,
            secondary_color = EXCLUDED.secondary_color,
            created_at = EXCLUDED.created_at;
        `;
        await client.query(insertAccount, [
          account.id,
          account.schema_name,
          account.account_name,
          account.plan_id,
          account.plan_status,
          account.stripe_customer_id,
          account.maintenance_mode,
          account.logo_url,
          account.primary_color,
          account.secondary_color,
          new Date(account.created_at),
        ]);
        console.log(`Upserted account: ${account.account_name}`);
      } catch (accountError) {
        console.error(`Failed to migrate account ${account.account_name}:`, accountError);
      }
    }
    console.log('Ozza accounts migration complete.');

    // Migrate ozza_account_members
    const membersDataPath = path.join(__dirname, 'ozza_account_members_export.json');
    const members = JSON.parse(fs.readFileSync(membersDataPath, 'utf8'));

    for (const member of members) {
      try {
        const insertMember = `
          INSERT INTO public.ozza_account_members (account_id, user_id, role, created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (account_id, user_id) DO UPDATE SET
            role = EXCLUDED.role,
            created_at = EXCLUDED.created_at;
        `;
        await client.query(insertMember, [
          member.account_id,
          member.user_id,
          member.role,
          new Date(member.created_at),
        ]);
        console.log(`Upserted account member: ${member.user_id} for account ${member.account_id}`);
      } catch (memberError) {
        console.error(`Failed to migrate account member ${member.user_id} for account ${member.account_id}:`, memberError);
      }
    }
    console.log('Ozza account members migration complete.');

  } catch (error) {
    console.error('Database connection or file read error:', error);
  } finally {
    await client.end();
  }
}

migrateAccountsAndMembers();
