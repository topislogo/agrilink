import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema-normalized';
import { devDbConfig } from './config-dev';

// Initialize Neon connection for development database
const sql = neon(devDbConfig.url);

// Initialize Drizzle with normalized schema
export const db = drizzle(sql, { schema });

// Export the raw SQL client for custom queries
export { sql };

// Export schema for use in API routes
export * from './schema-normalized';
