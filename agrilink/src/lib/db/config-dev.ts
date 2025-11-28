import { config } from 'dotenv';

// Load environment variables
config();

// Development database connection string
export const devDbConfig = {
  url: process.env.DATABASE_URL_DEV || 'postgresql://neondb_owner:npg_0Usptraqf7om@ep-divine-haze-ag9kgfk7-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  maxConnections: 10,
  connectionTimeout: 5000,
  queryTimeout: 30000,
};

// Production database connection string
export const prodDbConfig = {
  url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_0Usptraqf7om@ep-bold-night-agqqousj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  maxConnections: 10,
  connectionTimeout: 5000,
  queryTimeout: 30000,
};

// Determine which database to use based on environment
export const dbConfig = process.env.NODE_ENV === 'development' ? devDbConfig : prodDbConfig;

// Validate required environment variables
if (!dbConfig.url) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default dbConfig;
