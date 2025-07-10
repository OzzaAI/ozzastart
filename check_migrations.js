require('dotenv').config();
const { Client } = require('pg');

async function checkMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM drizzle.__drizzle_migrations');
    console.log('Applied migrations:', res.rows);
  } catch (err) {
    console.error('Error checking migrations:', err);
  } finally {
    await client.end();
  }
}

checkMigrations();