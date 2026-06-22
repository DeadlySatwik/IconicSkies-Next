"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOtpMessage("");

    const formData = new FormData(event.currentTarget);
    const body =
      mode === "register"
        ? {
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
          }
        : {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (response.headers.get("content-type")?.includes("application/json")
      ? await response.json().catch(() => null)
      : null) as { ok?: boolean; error?: string; otpRequired?: boolean; message?: string } | null;

    if (!response.ok || !payload?.ok) {
      setError(payload?.error ?? "Authentication failed.");
      setLoading(false);
      return;
    }

    if (mode === "login" && payload.otpRequired) {
      setPendingEmail(body.email);
      setOtpRequired(true);
      setOtpMessage(payload.message ?? "Check your email for a verification code.");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      router.push("/dashboard?verify=email");
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function handleOtpVerified() {
    setOtpRequired(false);
    setPendingEmail("");
    setError("");
    setOtpMessage("");
    router.push("/dashboard");
    router.refresh();
  }

  const isRegister = mode === "register";

  if (mode === "login" && otpRequired) {
    return (
      <div className="space-y-4 text-cloud">
        <OtpVerificationForm
          purpose="login"
          channel="email"
          identifier={pendingEmail}
          title="Enter your sign-in code"
          description={otpMessage || "We sent a code to your email to finish signing in."}
          initialMessage={otpMessage}
          onVerified={handleOtpVerified}
          tone="dark"
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/6 px-5 font-semibold text-cloud transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-aurora/30"
          type="button"
          onClick={() => {
            setOtpRequired(false);
            setPendingEmail("");
            setOtpMessage("");
            setError("");
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4 text-cloud" onSubmit={onSubmit} action={`/api/auth/${mode}`} method="post">
      {isRegister ? (
        <div>
          <label className="text-sm font-semibold text-cloud" htmlFor="name">
            Name
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-lg border border-white/14 bg-black/20 px-4 text-cloud placeholder:text-cloud/38 shadow-inner shadow-black/20 outline-none transition focus:border-aurora focus:ring-2 focus:ring-aurora/20"
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
          />
        </div>
      ) : null}
      <div>
        <label className="text-sm font-semibold text-cloud" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-white/14 bg-black/20 px-4 text-cloud placeholder:text-cloud/38 shadow-inner shadow-black/20 outline-none transition focus:border-aurora focus:ring-2 focus:ring-aurora/20"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-cloud" htmlFor="password">
          Password
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-white/14 bg-black/20 px-4 text-cloud placeholder:text-cloud/38 shadow-inner shadow-black/20 outline-none transition focus:border-aurora focus:ring-2 focus:ring-aurora/20"
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 10 : 1}
          placeholder={isRegister ? "At least 10 characters" : "Your password"}
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-200">{error}</p> : null}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-cloud px-5 font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora disabled:opacity-70"
        type="submit"
        disabled={loading}
      >
        {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
        {isRegister ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-cloud/70">
        {isRegister ? "Already have an account?" : "New to IconicSkies?"} {" "}
        <Link className="font-semibold text-aurora underline-offset-4 hover:underline" href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
