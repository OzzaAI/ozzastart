import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "./schema";
import * as aiWorkspaceSchema from "./ai-workspace-schema";

config({ path: ".env" }); // or .env.local

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Create explicit Neon connection to fix connection issues
const sql = neon(databaseUrl);

// Combine all schemas
const combinedSchema = {
  ...schema,
  ...aiWorkspaceSchema,
};

// Use explicit Neon client instead of serverless to fix transaction/connection issues
export const db = drizzle(sql, { 
  schema: combinedSchema,
  logger: process.env.NODE_ENV === 'development'
});

// Export schemas for use in other files
export { schema, aiWorkspaceSchema };
