import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://iconicskies:iconicskies@localhost:5432/iconicskies";

let client: postgres.Sql | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getSql() {
  if (!client) {
    client = postgres(databaseUrl, {
      max: 5,
      prepare: false,
    });
  }

  return client;
}

export function getDb() {
  if (!database) {
    database = drizzle(getSql(), { schema });
  }

  return database;
}
