"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

type OtpChannel = "email" | "sms";
type OtpPurpose = "register" | "login" | "verify-contact";
type OtpTone = "dark" | "light";

export function OtpVerificationForm({
  purpose,
  channel,
  identifier,
  title,
  description,
  onVerified,
  initialMessage,
  requestButtonLabel = "Send code",
  verifyButtonLabel = "Verify code",
  resendButtonLabel = "Resend code",
  compact = false,
  autoRequest = false,
  tone = "dark",
}: {
  purpose: OtpPurpose;
  channel: OtpChannel;
  identifier: string;
  title: string;
  description?: string;
  onVerified?: (redirectTo?: string) => void;
  initialMessage?: string;
  requestButtonLabel?: string;
  verifyButtonLabel?: string;
  resendButtonLabel?: string;
  compact?: boolean;
  autoRequest?: boolean;
  tone?: OtpTone;
}) {
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [requested, setRequested] = useState(Boolean(initialMessage));
  const [message, setMessage] = useState(initialMessage ?? "");
  const [error, setError] = useState("");

  const toneClasses =
    tone === "light"
      ? {
          card: compact
            ? "rounded-xl border border-slate-200 bg-[#f5f8f6] p-4 text-slate-950 shadow-[0_16px_42px_rgba(15,23,42,0.08)]"
            : "rounded-2xl border border-slate-200 bg-[#f5f8f6] p-5 text-slate-950 shadow-[0_20px_52px_rgba(15,23,42,0.08)]",
          helper: "text-slate-700",
          badge: "border-slate-300 bg-white text-slate-700",
          label: "text-slate-950",
          input:
            "mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-950 placeholder:text-slate-500 focus:border-rain focus:outline-none focus:ring-2 focus:ring-rain/20 disabled:opacity-100 disabled:text-slate-700 disabled:placeholder:text-slate-500",
          primaryButton:
            "inline-flex min-h-10 items-center justify-center rounded-lg bg-skyInk px-4 text-sm font-semibold text-cloud transition hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain/30 disabled:cursor-not-allowed disabled:opacity-60",
          secondaryButton:
            "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rain/25 disabled:cursor-not-allowed disabled:opacity-60",
          message: "text-emerald-700",
          error: "text-rose-700",
          footer: "text-slate-600",
        }
      : {
          card: compact
            ? "rounded-xl border border-white/14 bg-[#09171c]/94 p-4 text-cloud shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
            : "rounded-2xl border border-white/16 bg-[#09171c]/94 p-5 text-cloud shadow-[0_22px_60px_rgba(0,0,0,0.28)]",
          helper: "text-cloud/84",
          badge: "border-white/16 bg-black/30 text-cloud/84",
          label: "text-cloud",
          input:
            "mt-2 min-h-11 w-full rounded-lg border border-white/14 bg-black/20 px-4 text-cloud placeholder:text-cloud/38 shadow-inner shadow-black/20 outline-none transition focus:border-aurora focus:ring-2 focus:ring-aurora/20 disabled:opacity-100 disabled:text-cloud/70 disabled:placeholder:text-cloud/30",
          primaryButton:
            "inline-flex min-h-10 items-center justify-center rounded-lg bg-cloud px-4 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/30 disabled:cursor-not-allowed disabled:opacity-60",
          secondaryButton:
            "inline-flex min-h-10 items-center justify-center rounded-lg border border-white/16 bg-white/6 px-4 text-sm font-semibold text-cloud transition hover:border-white/24 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-aurora/30 disabled:cursor-not-allowed disabled:opacity-60",
          message: "text-emerald-100",
          error: "text-rose-100",
          footer: "text-cloud/60",
        };
  const maskedIdentifier = useMemo(() => maskIdentifier(identifier), [identifier]);

  useEffect(() => {
    if (!autoRequest) return;
    void requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]);

  async function requestCode() {
    if (requesting) return;
    setRequesting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier, purpose }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Could not send a code right now.");
        return;
      }

      setRequested(true);
      setMessage(payload.message ?? "If the account can receive codes, we sent an OTP.");
    } catch {
      setError("Could not send a code right now.");
    } finally {
      setRequesting(false);
    }
  }

  async function verifyCode() {
    if (verifying || code.trim().length !== 6) return;
    setVerifying(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier, purpose, code }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Invalid or expired code.");
        return;
      }

      setMessage(payload.message ?? "Code verified.");
      onVerified?.(payload.redirectTo);
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section className={toneClasses.card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`text-lg font-semibold ${toneClasses.label}`}>{title}</h3>
          <p className={`mt-1 max-w-xl text-sm leading-6 ${toneClasses.helper}`}>{description ?? `We’ll send a code to ${maskedIdentifier}.`}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses.badge}`}>
          {channel === "email" ? "Email OTP" : "SMS OTP"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className={`text-sm font-semibold ${toneClasses.label}`} htmlFor={`${purpose}-${channel}-otp`}>
            6-digit code
          </label>
          <input
            className={toneClasses.input}
            id={`${purpose}-${channel}-otp`}
            name="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(next);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button className={toneClasses.primaryButton} type="button" onClick={verifyCode} disabled={verifying || code.trim().length !== 6}>
            {verifying ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
            {verifyButtonLabel}
          </button>
          <button className={toneClasses.secondaryButton} type="button" onClick={requestCode} disabled={requesting}>
            {requesting ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
            {requested ? resendButtonLabel : requestButtonLabel}
          </button>
        </div>

        {message ? <p className={`text-sm font-medium ${toneClasses.message}`}>{message}</p> : null}
        {error ? <p className={`text-sm font-medium ${toneClasses.error}`}>{error}</p> : null}
        <p className={`text-xs ${toneClasses.footer}`}>
          We only use this code for {purpose === "login" ? "sign in" : purpose === "verify-contact" ? "verification" : "account setup"}.
        </p>
      </div>
    </section>
  );
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
