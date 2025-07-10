require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateBillingEvents() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database.');

    const eventsDataPath = path.join(__dirname, 'ozza_billing_events_export.json');
    const events = JSON.parse(fs.readFileSync(eventsDataPath, 'utf8'));

    for (const event of events) {
      try {
        const insertEvent = `
          INSERT INTO public.billing_events (id, event_type, account_id, raw, processed_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            event_type = EXCLUDED.event_type,
            account_id = EXCLUDED.account_id,
            raw = EXCLUDED.raw,
            processed_at = EXCLUDED.processed_at;
        `;
        await client.query(insertEvent, [
          event.id,
          event.event_type,
          event.account_id,
          JSON.stringify(event.raw),
          new Date(event.processed_at),
        ]);
        console.log(`Upserted billing event: ${event.id}`);
      } catch (eventError) {
        console.error(`Failed to migrate billing event ${event.id}:`, eventError);
      }
    }

    console.log('Billing events migration complete.');
  } catch (error) {
    console.error('Database connection or file read error:', error);
  } finally {
    await client.end();
  }
}

migrateBillingEvents();
