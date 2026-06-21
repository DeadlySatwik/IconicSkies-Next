import "server-only";

export type SmsOtpDeliveryResult =
  | { ok: true; delivered: true }
  | { ok: true; delivered: false; configured: false; reason: "not-configured" }
  | { ok: false; delivered: false; configured: true; reason: string; status?: number };

function isConfigured() {
  return Boolean(
    process.env.SMS_OTP_PROVIDER?.trim() &&
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM?.trim(),
  );
}

export async function sendSmsOtp(input: {
  to: string;
  code: string;
  purpose: "register" | "login" | "verify-contact";
}) {
  if (!isConfigured() || process.env.SMS_OTP_PROVIDER?.trim() !== "twilio") {
    return { ok: true, delivered: false, configured: false, reason: "not-configured" } as const;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_FROM!.trim();
  const body =
    input.purpose === "login"
      ? `Your IconicSkies sign-in code is ${input.code}. It expires in 4 minutes.`
      : `Your IconicSkies verification code is ${input.code}. It expires in 4 minutes.`;

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: input.to,
      Body: body,
    }),
  });

  if (!response.ok) {
    const preview = await response.text().catch(() => "");
    return {
      ok: false,
      delivered: false,
      configured: true,
      reason: preview.trim().slice(0, 180) || response.statusText || "SMS provider failed.",
      status: response.status,
    } as const;
  }

  return { ok: true, delivered: true } as const;
}
