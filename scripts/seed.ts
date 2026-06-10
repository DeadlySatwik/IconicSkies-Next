import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { getDb, getSql } from "../lib/db/client";
import { userPreferences, users } from "../lib/db/schema";

async function main() {
  const db = getDb();
  const demoEmail = "demo@iconicskies.local";
  const existing = await db.query.users.findFirst({
    where: eq(users.emailNormalized, demoEmail),
  });

  if (existing) {
    console.log("Demo user already exists.");
    await getSql().end();
    return;
  }

  const passwordHash = await hash("IconicSkiesDemo123!", {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const [user] = await db
    .insert(users)
    .values({
      email: demoEmail,
      name: "Demo Sky Keeper",
      passwordHash,
    })
    .returning();

  await db.insert(userPreferences).values({
    userId: user.id,
    units: "metric",
    theme: "system",
  });

  console.log("Seeded demo user: demo@iconicskies.local / IconicSkiesDemo123!");
  await getSql().end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
