
require('dotenv').config();
const { Client } = require('pg');

async function makeAdmin(email) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log(`Attempting to make ${email} an admin...`);
    const result = await client.query(
      `UPDATE "user" SET role = 'admin' WHERE email = $1 RETURNING *`,
      [email]
    );

    if (result.rows.length > 0) {
      console.log(`User ${email} is now an admin:`, result.rows[0]);
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (err) {
    console.error('Error making user admin:', err);
  } finally {
    await client.end();
  }
}

makeAdmin('dopetostito@gmail.com');
