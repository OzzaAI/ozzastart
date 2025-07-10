require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateSettings() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const settingsDataPath = path.join(__dirname, 'ozza_settings_export.json');
    const settings = JSON.parse(fs.readFileSync(settingsDataPath, 'utf8'));

    for (const setting of settings) {
      try {
        const insertSetting = `
          INSERT INTO public.settings (key, value, updated_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(insertSetting, [
          setting.key,
          JSON.stringify(setting.value),
          new Date(setting.updated_at),
        ]);
        console.log(`Upserted setting: ${setting.key}`);
      } catch (settingError) {
        console.error(`Failed to migrate setting ${setting.key}:`, settingError);
      }
    }

    console.log('Settings migration complete.');
  } catch (error) {
    console.error('Database connection or file read error:', error);
  } finally {
    await client.end();
  }
}

migrateSettings();
