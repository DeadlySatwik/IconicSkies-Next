import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyEmailAuthenticity, emailAuthenticityMessage } from "@/lib/auth/email-authenticity";
import { buildVerifyEmailHref } from "@/lib/auth/email-verification";
import { hashPassword } from "@/lib/auth/password";
import { issueOtpChallenge } from "@/lib/auth/otp-service";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import {
  createFallbackUser,
  deleteFallbackUserById,
  findFallbackUserByEmail,
} from "@/lib/dev/fallback-store";
import { userPreferences, users } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/utils";
import { jsonError, registerSchema } from "@/lib/security/validation";

async function createVerificationChallenge(user: { id: string; email: string }) {
  return issueOtpChallenge({
    channel: "email",
    purpose: "verify-contact",
    identifier: user.email,
    subjectUserId: user.id,
  });
}

function canUseChallenge(
  challenge: Awaited<ReturnType<typeof createVerificationChallenge>>,
) {
  return challenge.ok && (challenge.delivery.delivered || challenge.delivery.reason === "dev-logged");
}

function challengeFailureReason(challenge: Awaited<ReturnType<typeof createVerificationChallenge>>) {
  if (!challenge.ok) return challenge.reason;
  if (!challenge.delivery.delivered && "reason" in challenge.delivery) return challenge.delivery.reason;
  return "unknown";
}

export async function POST(request: Request) {
  const isJson = request.headers.get("content-type")?.includes("application/json");
  const body = isJson
    ? await request.json().catch(() => null)
    : Object.fromEntries((await request.formData()).entries());
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check your registration details.", 422);

  const authenticity = await verifyEmailAuthenticity(parsed.data.email);
  if (!authenticity.ok) {
    return jsonError(emailAuthenticityMessage(authenticity.reason), 422);
  }

  const redirectTo = buildVerifyEmailHref("/dashboard");

  try {
    const db = getDb();
    const email = authenticity.normalizedEmail ?? normalizeEmail(parsed.data.email);
    const fallbackExisting = findFallbackUserByEmail(email);
    if (fallbackExisting) return jsonError("An account with this email already exists.", 409);
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

    const challenge = await createVerificationChallenge(user);
    if (!canUseChallenge(challenge)) {
      await db.delete(users).where(eq(users.id, user.id));
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth/register] verification OTP delivery failed", {
          reason: challengeFailureReason(challenge),
        });
      }
      return jsonError("Email verification is not configured yet.", 503);
    }

    await db.insert(userPreferences).values({ userId: user.id });
    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);

    if (!isJson) return NextResponse.redirect(new URL(redirectTo, request.url), 303);
    return NextResponse.json({
      ok: true,
      redirectTo,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      const email = authenticity.normalizedEmail ?? normalizeEmail(parsed.data.email);
      const existing = findFallbackUserByEmail(email);
      if (existing) return jsonError("An account with this email already exists.", 409);

      const passwordHash = await hashPassword(parsed.data.password);
      const user = createFallbackUser({
        email,
        name: parsed.data.name,
        passwordHash,
      });

      if (!user) return jsonError("Registration failed.", 500);

      const challenge = await createVerificationChallenge(user);
      if (!canUseChallenge(challenge)) {
        deleteFallbackUserById(user.id);
        if (process.env.NODE_ENV !== "production") {
          console.warn("[auth/register] verification OTP delivery failed", {
            reason: challengeFailureReason(challenge),
          });
        }
        return jsonError("Email verification is not configured yet.", 503);
      }

      const session = await createSession(user.id);
      await setSessionCookie(session.token, session.expiresAt);

      if (!isJson) return NextResponse.redirect(new URL(redirectTo, request.url), 303);
      return NextResponse.json({
        ok: true,
        redirectTo,
        user: { id: user.id, email: user.email, name: user.name },
      });
    }

    throw error;
  }
}
