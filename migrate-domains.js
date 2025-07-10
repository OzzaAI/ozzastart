require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDomains() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const domainsDataPath = path.join(__dirname, 'ozza_domains_export.json');
    const domains = JSON.parse(fs.readFileSync(domainsDataPath, 'utf8'));

    for (const domain of domains) {
      try {
        const insertDomain = `
          INSERT INTO public.domains (id, account_id, host, site_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            account_id = EXCLUDED.account_id,
            host = EXCLUDED.host,
            site_id = EXCLUDED.site_id,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(insertDomain, [
          domain.id,
          domain.account_id,
          domain.host,
          domain.site_id,
          new Date(domain.created_at),
          new Date(domain.updated_at),
        ]);
        console.log(`Upserted domain: ${domain.host}`);
      } catch (domainError) {
        console.error(`Failed to migrate domain ${domain.host}:`, domainError);
      }
    }

    console.log('Domains migration complete.');
  } catch (error) {
    console.error('Database connection or file read error:', error);
  } finally {
    await client.end();
  }
}

migrateDomains();
