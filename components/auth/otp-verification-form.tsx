"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

type OtpChannel = "email" | "sms";
type OtpPurpose = "register" | "login" | "verify-contact";

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
}: {
  purpose: OtpPurpose;
  channel: OtpChannel;
  identifier: string;
  title: string;
  description?: string;
  onVerified?: () => void;
  initialMessage?: string;
  requestButtonLabel?: string;
  verifyButtonLabel?: string;
  resendButtonLabel?: string;
  compact?: boolean;
  autoRequest?: boolean;
}) {
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [requested, setRequested] = useState(Boolean(initialMessage));
  const [message, setMessage] = useState(initialMessage ?? "");
  const [error, setError] = useState("");

  const cardClass = compact
    ? "rounded-xl border border-white/10 bg-[#0c1a21]/92 p-4 text-cloud shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
    : "rounded-2xl border border-white/12 bg-[#0c1a21]/92 p-5 text-cloud shadow-[0_22px_60px_rgba(0,0,0,0.28)]";
  const inputClass =
    "mt-2 min-h-11 w-full rounded-lg border border-skyInk/15 bg-white px-4 text-slate-950 placeholder:text-slate-500 focus:border-aurora focus:outline-none focus:ring-2 focus:ring-aurora/20 disabled:opacity-100 disabled:text-slate-700 disabled:placeholder:text-slate-500";
  const secondaryButtonClass =
    "inline-flex min-h-10 items-center justify-center rounded-lg border border-white/14 px-4 text-sm font-semibold text-cloud transition hover:border-white/24 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-aurora/30 disabled:cursor-not-allowed disabled:opacity-60";
  const primaryButtonClass =
    "inline-flex min-h-10 items-center justify-center rounded-lg bg-cloud px-4 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/30 disabled:cursor-not-allowed disabled:opacity-60";
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
        | { ok?: boolean; message?: string; error?: string }
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
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Invalid or expired code.");
        return;
      }

      setMessage(payload.message ?? "Code verified.");
      onVerified?.();
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-cloud">{title}</h3>
          <p className="mt-1 max-w-xl text-sm text-cloud/72">{description ?? `We’ll send a code to ${maskedIdentifier}.`}</p>
        </div>
        <span className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cloud/72">
          {channel === "email" ? "Email OTP" : "SMS OTP"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-semibold text-cloud" htmlFor={`${purpose}-${channel}-otp`}>
            6-digit code
          </label>
          <input
            className={inputClass}
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
          <button
            className={primaryButtonClass}
            type="button"
            onClick={verifyCode}
            disabled={verifying || code.trim().length !== 6}
          >
            {verifying ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
            {verifyButtonLabel}
          </button>
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={requestCode}
            disabled={requesting}
          >
            {requesting ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
            {requested ? resendButtonLabel : requestButtonLabel}
          </button>
        </div>

        {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="text-sm font-medium text-red-200">{error}</p> : null}
        <p className="text-xs text-cloud/55">
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
