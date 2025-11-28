import { config } from 'dotenv';

// Load environment variables
config();

export const dbConfig = {
  url: process.env.DATABASE_URL!,
  // Add other database configuration options here
  maxConnections: 10,
  connectionTimeout: 5000,
  queryTimeout: 30000,
};

// Validate required environment variables
if (!dbConfig.url) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default dbConfig;
