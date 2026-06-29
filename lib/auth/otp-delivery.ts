import "server-only";

import { getOtpTtlSeconds, shouldLogOtpCodes } from "./otp";
import { sendEmailOtp } from "./email-otp-provider";
import { sendSmsOtp } from "./sms-otp-provider";

export type OtpDeliveryOutcome =
  | { ok: true; delivered: true; provider: "email" | "sms" }
  | { ok: true; delivered: false; provider: "email" | "sms"; reason: "not-configured" | "dev-logged" }
  | { ok: false; delivered: false; provider: "email" | "sms"; reason: string; status?: number };

function isDev() {
  return process.env.NODE_ENV !== "production";
}

export async function deliverOtpCode(input: {
  channel: "email" | "sms";
  identifier: string;
  code: string;
  purpose: "register" | "login" | "verify-contact";
}): Promise<OtpDeliveryOutcome> {
  if (input.channel === "email") {
    if (isDev() && shouldLogOtpCodes()) {
      console.info("[otp] dev email code", {
        purpose: input.purpose,
        identifier: maskIdentifier(input.identifier),
        code: input.code,
        ttlSeconds: getOtpTtlSeconds(),
      });
      return { ok: true, delivered: false, provider: "email" as const, reason: "dev-logged" as const };
    }

    const emailResult = await sendEmailOtp({ to: input.identifier, code: input.code, purpose: input.purpose });
    if (emailResult.ok && emailResult.delivered) {
      return { ok: true, delivered: true, provider: "email" as const };
    }

    if (emailResult.ok && !emailResult.delivered && emailResult.reason === "not-configured") {
      if (isDev()) {
        console.warn("[otp] email delivery skipped because RESEND_API_KEY / EMAIL_FROM is missing", {
          purpose: input.purpose,
          identifier: maskIdentifier(input.identifier),
        });
      }

      return { ok: true, delivered: false, provider: "email" as const, reason: "not-configured" as const };
    }

    return {
      ok: false,
      delivered: false,
      provider: "email" as const,
      reason: emailResult.reason,
      status: emailResult.status,
    };
  }

  const smsResult = await sendSmsOtp({ to: input.identifier, code: input.code, purpose: input.purpose });
  if (smsResult.ok && smsResult.delivered) {
    return { ok: true, delivered: true, provider: "sms" as const };
  }

  if (smsResult.ok && !smsResult.delivered && smsResult.reason === "not-configured") {
    if (isDev()) {
      console.warn("[otp] sms delivery skipped because SMS provider is not configured", {
        purpose: input.purpose,
        identifier: maskIdentifier(input.identifier),
      });
    }
    return { ok: true, delivered: false, provider: "sms" as const, reason: "not-configured" as const };
  }

  return {
    ok: false,
    delivered: false,
    provider: "sms" as const,
    reason: smsResult.reason,
    status: smsResult.status,
  };
}

function maskIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    const [name, domain] = trimmed.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }

  if (trimmed.length <= 4) return "***";
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}
