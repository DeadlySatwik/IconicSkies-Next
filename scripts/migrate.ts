import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://iconicskies:iconicskies@localhost:5432/iconicskies";

async function main() {
  const sql = postgres(databaseUrl, { max: 1 });
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  for (const file of files) {
    const applied = await sql<{ id: string }[]>`
      SELECT id FROM migrations WHERE id = ${file}
    `;

    if (applied.length > 0) {
      console.log(`Skipping ${file}`);
      continue;
    }

    const migration = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`INSERT INTO migrations (id) VALUES (${file})`;
    });
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
