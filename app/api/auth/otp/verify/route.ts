import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createSession, setSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { isRedisConfigured } from "@/lib/cache/redis";
import { checkOptionalRateLimit } from "@/lib/cache/rate-limit";
import { verifyOtpChallenge } from "@/lib/auth/otp-service";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import {
  findFallbackUserByEmail,
  findFallbackUserById,
  updateFallbackUserById,
} from "@/lib/dev/fallback-store";
import { users } from "@/lib/db/schema";
import {
  buildOtpRateLimitIdentifier,
  normalizeOtpIdentifier,
} from "@/lib/auth/otp";
import { jsonError, otpVerifySchema } from "@/lib/security/validation";

const VERIFY_IDENTIFIER_LIMIT = { limit: 10, duration: "15 m" as const };

export async function POST(request: Request) {
  if (!isRedisConfigured()) {
    return jsonError("OTP validation is not configured yet.", 503);
  }

  const body = await request.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the OTP code.", 422);

  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";

  const currentUser = parsed.data.purpose === "verify-contact" ? await getCurrentUser().catch(() => null) : null;
  if (parsed.data.purpose === "verify-contact" && !currentUser) {
    return jsonError("Sign in to verify your contact details.", 401);
  }

  const identifier =
    parsed.data.purpose === "verify-contact" && currentUser
      ? parsed.data.channel === "sms"
        ? currentUser.phoneNumber ?? ""
        : currentUser.email
      : parsed.data.identifier;

  if (!identifier.trim()) {
    return jsonError("Invalid or expired code.", 400);
  }

  const normalizedIdentifier = normalizeOtpIdentifier(parsed.data.channel, identifier);
  const identifierLimit = await checkOptionalRateLimit({
    scope: `auth-otp-verify:${parsed.data.purpose}:${parsed.data.channel}`,
    identifier: buildOtpRateLimitIdentifier({
      purpose: parsed.data.purpose,
      channel: parsed.data.channel,
      identifier: normalizedIdentifier,
    }),
    ...VERIFY_IDENTIFIER_LIMIT,
  });
  if (!identifierLimit.allowed) {
    return jsonError("Too many verification attempts. Try again later.", 429);
  }

  const ipLimit = await checkOptionalRateLimit({
    scope: `auth-otp-verify-ip:${parsed.data.purpose}:${parsed.data.channel}`,
    identifier: ip,
    ...VERIFY_IDENTIFIER_LIMIT,
  });
  if (!ipLimit.allowed) {
    return jsonError("Too many verification attempts. Try again later.", 429);
  }

  const result = await verifyOtpChallenge({
    channel: parsed.data.channel,
    purpose: parsed.data.purpose,
    identifier,
    code: parsed.data.code,
    subjectUserId: currentUser?.id ?? null,
  });

  if (!result.ok) {
    if (result.reason === "locked") {
      return jsonError("You’ve tried this code too many times. Request a new one.", 429);
    }

    return jsonError("Invalid or expired code.", 400);
  }

  if (parsed.data.purpose === "login") {
    const userId = result.record.subjectUserId;
    if (!userId) return jsonError("Invalid or expired code.", 400);

    const dbSession = await createSession(userId);
    await setSessionCookie(dbSession.token, dbSession.expiresAt);

    return NextResponse.json({
      ok: true,
      message: "Code verified. You’re signed in.",
    });
  }

  if (!currentUser) {
    return jsonError("Sign in to verify your contact details.", 401);
  }

  try {
    const now = new Date();
    const db = getDb();
    if (parsed.data.channel === "email") {
      await db
        .update(users)
        .set({
          emailVerifiedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, currentUser.id));
    } else {
      await db
        .update(users)
        .set({
          phoneVerifiedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, currentUser.id));
    }
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;

    const fallbackUser = findFallbackUserById(currentUser.id) ?? findFallbackUserByEmail(currentUser.email);
    if (!fallbackUser) return jsonError("Could not update verification status.", 500);

    updateFallbackUserById(fallbackUser.id, {
      emailVerifiedAt: parsed.data.channel === "email" ? new Date() : fallbackUser.emailVerifiedAt,
      phoneVerifiedAt: parsed.data.channel === "sms" ? new Date() : fallbackUser.phoneVerifiedAt,
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Code verified.",
  });
}
