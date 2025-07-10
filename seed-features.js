require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function seedFeatures() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const sql = `
INSERT INTO public.features(feature_key, description) VALUES 
  ('CUSTOM_DOMAIN', 'Enable custom domains for agency sites'),
  ('WHITE_LABEL', 'White-label option to remove Ozza branding'),
  ('ANALYTICS_DASHBOARD', 'Access to analytics dashboard feature'),
  ('AI_CONTENT_ASSISTANT', 'AI content assistant tool for site builder')
ON CONFLICT (feature_key) DO NOTHING;
    `;

    await client.query(sql);
    console.log('Features seeded successfully.');
  } catch (error) {
    console.error('Failed to seed features:', error);
  } finally {
    await client.end();
  }
}

seedFeatures();
