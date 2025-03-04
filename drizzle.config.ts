
import { defineConfig } from "drizzle-kit";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: process.env.DATABASE_URL.startsWith('postgres') ? "postgresql" : "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
