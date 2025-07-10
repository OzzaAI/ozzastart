require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function seedPlans() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const sql = `
INSERT INTO public.plans(plan_id, name, monthly_price, annual_price, stripe_price_id, stripe_product_id, max_sites, max_users)
VALUES
  ('free', 'Free Plan', 0, 0, 'price_123_free', 'prod_123_free', 1, 1),
  ('pro', 'Pro Plan', 2000, 20000, 'price_456_pro', 'prod_456_pro', 5, 5)
ON CONFLICT (plan_id) DO NOTHING;
    `;

    await client.query(sql);
    console.log('Plans seeded successfully.');
  } catch (error) {
    console.error('Failed to seed plans:', error);
  } finally {
    await client.end();
  }
}

seedPlans();
