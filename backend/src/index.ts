import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from './db/schema'
import 'dotenv/config'

export const db = drizzle({
    connection: {
        connectionString: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false}
    },
    schema: schema
})