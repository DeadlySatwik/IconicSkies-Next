import "server-only";

import { createHmac, randomInt } from "node:crypto";
import { normalizeEmail } from "@/lib/utils";
import type { OtpChannel, OtpPurpose } from "@/lib/security/validation";

export const DEFAULT_OTP_TTL_SECONDS = 240;
export const DEFAULT_OTP_RESEND_COOLDOWN_SECONDS = 60;
export const DEFAULT_OTP_MAX_VERIFY_ATTEMPTS = 5;

function envNumber(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getOtpTtlSeconds() {
  return envNumber("OTP_TTL_SECONDS", DEFAULT_OTP_TTL_SECONDS);
}

export function getOtpResendCooldownSeconds() {
  return envNumber("OTP_RESEND_COOLDOWN_SECONDS", DEFAULT_OTP_RESEND_COOLDOWN_SECONDS);
}

export function getOtpMaxVerifyAttempts() {
  return envNumber("OTP_MAX_VERIFY_ATTEMPTS", DEFAULT_OTP_MAX_VERIFY_ATTEMPTS);
}

export function shouldLogOtpCodes() {
  return process.env.NODE_ENV !== "production" && process.env.OTP_DEV_LOG_CODES === "true";
}

export function getOtpSecret() {
  const secret = process.env.OTP_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("OTP secret is not configured.");
  }
  return secret;
}

export function normalizeOtpIdentifier(channel: OtpChannel, identifier: string) {
  if (channel === "email") return normalizeEmail(identifier);
  return identifier.trim().replace(/[^\d+]/g, "");
}

export function hashOtpIdentifier(channel: OtpChannel, identifier: string) {
  const secret = getOtpSecret();
  const normalized = normalizeOtpIdentifier(channel, identifier);
  return createHmac("sha256", secret).update(`${channel}:${normalized}`).digest("hex");
}

export function hashOtpCode(channel: OtpChannel, purpose: OtpPurpose, identifier: string, code: string) {
  const secret = getOtpSecret();
  const normalized = normalizeOtpIdentifier(channel, identifier);
  return createHmac("sha256", secret)
    .update(`${normalized}:${purpose}:${code}`)
    .digest("hex");
}

export function generateOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function buildOtpRedisKey(input: {
  purpose: OtpPurpose;
  channel: OtpChannel;
  identifier: string;
}) {
  const identifierHash = hashOtpIdentifier(input.channel, input.identifier);
  return `auth:otp:v1:${input.purpose}:${input.channel}:${identifierHash}`;
}

export function buildOtpRateLimitIdentifier(input: {
  purpose: OtpPurpose;
  channel: OtpChannel;
  identifier: string;
}) {
  const identifierHash = hashOtpIdentifier(input.channel, input.identifier);
  return `${input.purpose}:${input.channel}:${identifierHash}`;
}

export function formatOtpMessage(code: string, purpose: OtpPurpose) {
  const reason =
    purpose === "login"
      ? "sign in to your Sky Journal"
      : purpose === "verify-contact"
        ? "verify your contact details"
        : "finish setting up your IconicSkies account";

  return [
    `Your IconicSkies verification code is ${code}.`,
    `Enter it within 4 minutes to ${reason}.`,
  ].join(" ");
}
