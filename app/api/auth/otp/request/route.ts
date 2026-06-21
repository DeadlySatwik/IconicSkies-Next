import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isRedisConfigured } from "@/lib/cache/redis";
import { checkOptionalRateLimit } from "@/lib/cache/rate-limit";
import { issueOtpChallenge } from "@/lib/auth/otp-service";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import { findFallbackUserByEmail } from "@/lib/dev/fallback-store";
import { users } from "@/lib/db/schema";
import { buildOtpRateLimitIdentifier, normalizeOtpIdentifier } from "@/lib/auth/otp";
import { jsonError, otpRequestSchema } from "@/lib/security/validation";
import { normalizeEmail } from "@/lib/utils";

const REQUEST_IDENTIFIER_LIMIT = { limit: 5, duration: "15 m" as const };
const REQUEST_IP_LIMIT = { limit: 10, duration: "1 h" as const };

export async function POST(request: Request) {
  if (!isRedisConfigured()) {
    return jsonError("OTP validation is not configured yet.", 503);
  }

  const body = await request.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the OTP request details.", 422);

  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";

  const purpose = parsed.data.purpose;
  const channel = parsed.data.channel;

  const currentUser = purpose === "verify-contact" ? await getCurrentUser().catch(() => null) : null;
  if (purpose === "verify-contact" && !currentUser) {
    return jsonError("Sign in to verify your contact details.", 401);
  }

  let identifier = parsed.data.identifier;
  let subjectUserId: string | null | undefined;

  if (purpose === "verify-contact" && currentUser) {
    identifier = channel === "sms" ? currentUser.phoneNumber ?? "" : currentUser.email;
    subjectUserId = currentUser.id;
  }

  if (channel === "sms" && !identifier.trim()) {
    return jsonError("Phone OTP is not configured yet.", 503);
  }

  const normalizedIdentifier = normalizeOtpIdentifier(channel, identifier);
  const identifierLimit = await checkOptionalRateLimit({
    scope: `auth-otp-request:${purpose}:${channel}`,
    identifier: buildOtpRateLimitIdentifier({
      purpose,
      channel,
      identifier: normalizedIdentifier,
    }),
    ...REQUEST_IDENTIFIER_LIMIT,
  });
  if (!identifierLimit.allowed) {
    return jsonError("Too many OTP requests. Try again later.", 429);
  }

  const ipLimit = await checkOptionalRateLimit({
    scope: `auth-otp-request-ip:${purpose}:${channel}`,
    identifier: ip,
    ...REQUEST_IP_LIMIT,
  });
  if (!ipLimit.allowed) {
    return jsonError("Too many OTP requests. Try again later.", 429);
  }

  if (purpose === "login") {
    const email = normalizeEmail(identifier);
    const db = getDb();
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.emailNormalized, email),
      });
      if (user) subjectUserId = user.id;
    } catch (error) {
      if (!isDatabaseConnectionError(error)) throw error;
      const fallbackUser = findFallbackUserByEmail(email);
      if (fallbackUser) subjectUserId = fallbackUser.id;
    }
  }

  if (purpose === "verify-contact" && currentUser?.phoneNumber && channel === "sms") {
    identifier = currentUser.phoneNumber;
  }

  const challenge = await issueOtpChallenge({
    channel,
    purpose,
    identifier,
    subjectUserId,
  });

  if (!challenge.ok) {
    return jsonError("OTP validation is not configured yet.", 503);
  }

  if (!challenge.resendCoolingDown && !challenge.delivery.delivered && challenge.delivery.reason !== "dev-logged") {
    if (channel === "sms") {
      return jsonError("Phone OTP is not configured yet.", 503);
    }

    return jsonError("OTP validation is not configured yet.", 503);
  }

  return NextResponse.json({
    ok: true,
    message: "If the account can receive codes, we sent an OTP.",
    resendCoolingDown: challenge.resendCoolingDown,
  });
}
