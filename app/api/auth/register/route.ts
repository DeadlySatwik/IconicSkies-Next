import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import { createFallbackUser, findFallbackUserByEmail } from "@/lib/dev/fallback-store";
import { userPreferences, users } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/utils";
import { jsonError, registerSchema } from "@/lib/security/validation";

export async function POST(request: Request) {
  const isJson = request.headers.get("content-type")?.includes("application/json");
  const body = isJson
    ? await request.json().catch(() => null)
    : Object.fromEntries((await request.formData()).entries());
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check your registration details.", 422);

  try {
    const db = getDb();
    const email = normalizeEmail(parsed.data.email);
    const existing = await db.query.users.findFirst({
      where: eq(users.emailNormalized, email),
    });

    if (existing) return jsonError("An account with this email already exists.", 409);

    const passwordHash = await hashPassword(parsed.data.password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name: parsed.data.name,
        passwordHash,
      })
      .returning();

    await db.insert(userPreferences).values({ userId: user.id });
    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);

    if (!isJson) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      const email = normalizeEmail(parsed.data.email);
      const existing = findFallbackUserByEmail(email);
      if (existing) return jsonError("An account with this email already exists.", 409);

      const passwordHash = await hashPassword(parsed.data.password);
      const user = createFallbackUser({
        email,
        name: parsed.data.name,
        passwordHash,
      });

      if (!user) return jsonError("Registration failed.", 500);

      const session = await createSession(user.id);
      await setSessionCookie(session.token, session.expiresAt);

      if (!isJson) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
      return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    }

    throw error;
  }
}
