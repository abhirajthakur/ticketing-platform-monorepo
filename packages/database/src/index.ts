import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);

const db = drizzle(client, { schema: schema });

export * from "drizzle-orm";
export { db };
