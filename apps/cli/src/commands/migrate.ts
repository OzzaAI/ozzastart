import * as fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '../lib/supabase.js';

export async function migrate() {
  try {
    console.log('Running migrations...');
    const supabase = getSupabaseAdmin();
    // Resolve path from the compiled 'dist' directory
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files.filter((file) => file.endsWith('.sql')).sort();

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}...`);
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        throw new Error(`Failed to apply migration ${file}: ${error.message}`);
      }
    }
    console.log('✔ All migrations applied successfully.');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ An error occurred during migration:', err.message);
    } else {
      console.error('❌ An unknown error occurred during migration.');
    }
    process.exit(1);
  }
} 