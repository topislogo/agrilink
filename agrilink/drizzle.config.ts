import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv';


config({ path: '.env.local' });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string
  },
  verbose:true,
  strict:true,
})

