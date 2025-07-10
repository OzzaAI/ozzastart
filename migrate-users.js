require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const usersDataPath = path.join(__dirname, 'ozza_users_export.json');
    const users = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));

    for (const user of users) {
      try {
        

        // Insert into user_profiles table
        const userProfileInsert = `
          INSERT INTO public.user_profiles (user_id, phone_number, address, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6);
        `;
        await client.query(userProfileInsert, [
          user.id,
          user.phone_number,
          user.address,
          JSON.stringify(user.metadata),
          new Date(),
          new Date(),
        ]);
        console.log(`Upserted user profile for: ${user.email}`);

      } catch (userError) {
        console.error(`Failed to migrate user ${user.email}:`, userError);
      }
    }

    console.log('User migration complete.');
  } catch (error) {
    console.error('Database connection or file read error:', error);
  } finally {
    await client.end();
  }
}

migrateUsers();
