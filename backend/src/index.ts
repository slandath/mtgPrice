import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema.js";
import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: isProduction ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export const db = drizzle({ client: pool, schema });
