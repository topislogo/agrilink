import { neon } from '@neondatabase/serverless';

/**
 * Get a cleaned database connection string suitable for Neon serverless driver
 * Removes unsupported parameters and quotes
 */
export function getCleanedDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  let databaseUrl = process.env.DATABASE_URL;

  // Remove surrounding quotes if present (common in .env files)
  databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');

  // Remove parameters not supported by Neon serverless driver
  // The serverless driver uses HTTP/WebSocket, not direct TCP connections
  // Remove channel_binding and sslmode parameters
  const paramsToRemove = ['channel_binding', 'sslmode'];
  let modified = false;

  for (const param of paramsToRemove) {
    if (databaseUrl.includes(`${param}=`)) {
      databaseUrl = databaseUrl.replace(new RegExp(`[?&]${param}=[^&]*`, 'g'), '');
      modified = true;
    }
  }

  if (modified) {
    // Clean up any double question marks, ampersands, or trailing separators
    databaseUrl = databaseUrl.replace(/\?\?+/g, '?').replace(/&+/g, '&').replace(/[?&]$/, '');
  }

  return databaseUrl;
}

/**
 * Get a Neon SQL client with cleaned connection string
 */
export function getNeonSql() {
  const cleanedUrl = getCleanedDatabaseUrl();
  return neon(cleanedUrl);
}

