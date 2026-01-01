import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Environment-aware database URL selection
const getDatabaseUrl = () => {
  console.log('🔍 Database connection initialization:');
  console.log('🔍 Environment variables check:');
  console.log('  DATABASE_URL_DEV:', process.env.DATABASE_URL_DEV ? '✅ SET' : '❌ NOT SET');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
  
  // Priority 1: Use DATABASE_URL_DEV if available (for development)
  if (process.env.DATABASE_URL_DEV) {
    console.log('🎯 Using DATABASE_URL_DEV');
    return process.env.DATABASE_URL_DEV;
  }
  
  // Priority 2: Use DATABASE_URL_STAGING if available and NODE_ENV is staging
  if (process.env.DATABASE_URL_STAGING && process.env.NODE_ENV === 'staging') {
    console.log('🎯 Using DATABASE_URL_STAGING');
    return process.env.DATABASE_URL_STAGING;
  }
  
  // Priority 3: Use main DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('🎯 Using DATABASE_URL');
    return process.env.DATABASE_URL;
  }
  
  // No fallback - require explicit DATABASE_URL
  console.log('❌ No DATABASE_URL found');
  throw new Error('DATABASE_URL environment variable is required');
};

let databaseUrl = getDatabaseUrl();

// Remove channel_binding parameter as it's not supported by Neon serverless driver
// The serverless driver uses HTTP/WebSocket, not direct TCP connections
if (databaseUrl.includes('channel_binding=')) {
  // Remove channel_binding parameter (can be ?channel_binding= or &channel_binding=)
  databaseUrl = databaseUrl.replace(/[?&]channel_binding=[^&]*/g, (match) => {
    // If it starts with ?, replace with ?, otherwise remove the whole match
    return match.startsWith('?') ? '?' : '';
  });
  // Clean up any double question marks, ampersands, or trailing separators
  databaseUrl = databaseUrl.replace(/\?\?+/g, '?').replace(/&+/g, '&').replace(/[?&]$/, '');
  // If we removed a ? but there are still query params, ensure we have a ?
  if (databaseUrl.includes('&') && !databaseUrl.includes('?')) {
    const [base, ...params] = databaseUrl.split('&');
    databaseUrl = `${base}?${params.join('&')}`;
  }
}

console.log('🔗 Database URL:', databaseUrl.includes('ep-weathered-sea') ? '✅ DEVELOPMENT' : '✅ PRODUCTION/STAGING');

// Initialize Neon connection
const sql = neon(databaseUrl);

// Initialize Drizzle with normalized schema
export const db = drizzle(sql, { schema });

// Export the raw SQL client for custom queries
export { sql };

// Export schema for use in API routes
export * from './schema';