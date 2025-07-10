
require('dotenv').config();
const { Client } = require('pg');

async function resetDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Dropping all tables...');
    await client.query(`
      DROP TABLE IF EXISTS "user" CASCADE;
      DROP TABLE IF EXISTS "session" CASCADE;
      DROP TABLE IF EXISTS "account" CASCADE;
      DROP TABLE IF EXISTS "verification" CASCADE;
      DROP TABLE IF EXISTS "subscription" CASCADE;
      DROP TABLE IF EXISTS "ozza_accounts" CASCADE;
      DROP TABLE IF EXISTS "ozza_account_members" CASCADE;
      DROP TABLE IF EXISTS "user_profiles" CASCADE;
      DROP TABLE IF EXISTS "client_invitations" CASCADE;
      DROP TABLE IF EXISTS "plans" CASCADE;
      DROP TABLE IF EXISTS "features" CASCADE;
      DROP TABLE IF EXISTS "account_features" CASCADE;
      DROP TABLE IF EXISTS "domains" CASCADE;
      DROP TABLE IF EXISTS "settings" CASCADE;
      DROP TABLE IF EXISTS "billing_events" CASCADE;
      DROP TABLE IF EXISTS "community_links" CASCADE;
      DROP TABLE IF EXISTS "agency_invitations" CASCADE;
      DROP TABLE IF EXISTS "drizzle.__drizzle_migrations" CASCADE;
    `);
    console.log('All tables dropped successfully.');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await client.end();
  }
}

resetDatabase();
