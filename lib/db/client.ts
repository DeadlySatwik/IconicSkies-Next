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

export function isDatabaseConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: string;
    errno?: number | string;
    cause?: { code?: string; errno?: number | string } | null;
  };

  const codes = [candidate.code, candidate.cause?.code];
  const errnos = [candidate.errno, candidate.cause?.errno];

  return (
    codes.includes("ECONNREFUSED") ||
    codes.includes("28P01") ||
    codes.includes("invalid_password") ||
    errnos.includes(-111)
  );
}
