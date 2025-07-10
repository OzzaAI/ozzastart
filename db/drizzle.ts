import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import { neonConfig } from '@neondatabase/serverless';
import * as schema from "./schema";
import * as aiWorkspaceSchema from "./ai-workspace-schema";

config({ path: ".env" }); // or .env.local

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Configure Neon for better connection handling
neonConfig.fetchConnectionCache = true;

// Combine all schemas
const combinedSchema = {
  ...schema,
  ...aiWorkspaceSchema,
};

export const db = drizzle(databaseUrl, { schema: combinedSchema });

// Export schemas for use in other files
export { schema, aiWorkspaceSchema };
