import "server-only";

import { formatOtpMessage, getOtpTtlSeconds } from "./otp";

export type EmailOtpDeliveryResult =
  | { ok: true; delivered: true }
  | { ok: true; delivered: false; configured: false; reason: "not-configured" }
  | { ok: false; delivered: false; configured: true; reason: string; status?: number };

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmailOtp(input: {
  to: string;
  code: string;
  purpose: "register" | "login" | "verify-contact";
}) {
  if (!isConfigured()) {
    return { ok: true, delivered: false, configured: false, reason: "not-configured" } as const;
  }

  const ttlMinutes = Math.ceil(getOtpTtlSeconds() / 60);
  const subject =
    input.purpose === "login"
      ? "Your IconicSkies sign-in code"
      : input.purpose === "verify-contact"
        ? "Verify your IconicSkies contact details"
        : "Verify your IconicSkies account";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: [input.to],
      subject,
      text: `${formatOtpMessage(input.code, input.purpose)}\n\nThis code expires in about ${ttlMinutes} minutes.`,
    }),
  });

  if (!response.ok) {
    const preview = await response.text().catch(() => "");
    return {
      ok: false,
      delivered: false,
      configured: true,
      reason: preview.trim().slice(0, 180) || response.statusText || "Email provider failed.",
      status: response.status,
    } as const;
  }

  return { ok: true, delivered: true } as const;
}
