import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import {
  createFallbackSession,
  findFallbackUserByEmail,
} from "@/lib/dev/fallback-store";
import { users } from "@/lib/db/schema";
import { loginSchema, jsonError } from "@/lib/security/validation";
import { normalizeEmail } from "@/lib/utils";

export async function POST(request: Request) {
  const isJson = request.headers.get("content-type")?.includes("application/json");
  const body = isJson
    ? await request.json().catch(() => null)
    : Object.fromEntries((await request.formData()).entries());
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check your email and password.", 422);

  const email = normalizeEmail(parsed.data.email);
  try {
    const user = await getDb().query.users.findFirst({
      where: eq(users.emailNormalized, email),
    });

    if (!user) return jsonError("Invalid email or password.", 401);

    const valid = await verifyPassword(user.passwordHash, parsed.data.password);
    if (!valid) return jsonError("Invalid email or password.", 401);

    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);

    if (!isJson) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      const fallbackUser = findFallbackUserByEmail(email);
      if (!fallbackUser) return jsonError("Invalid email or password.", 401);

      const valid = await verifyPassword(fallbackUser.passwordHash, parsed.data.password);
      if (!valid) return jsonError("Invalid email or password.", 401);

      const session = createFallbackSession(fallbackUser.id);
      await setSessionCookie(session.token, session.expiresAt);

      if (!isJson) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
      return NextResponse.json({
        ok: true,
        user: { id: fallbackUser.id, email: fallbackUser.email, name: fallbackUser.name },
      });
    }

    throw error;
  }
}
