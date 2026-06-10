"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

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

    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Authentication failed.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const isRegister = mode === "register";

  return (
    <form className="space-y-4" onSubmit={onSubmit} action={`/api/auth/${mode}`} method="post">
      {isRegister ? (
        <div>
          <label className="text-sm font-semibold" htmlFor="name">
            Name
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-lg border border-skyInk/15 px-4 focus:border-rain focus:ring-2 focus:ring-rain/25"
            id="name"
            name="name"
            autoComplete="name"
            required
          />
        </div>
      ) : null}
      <div>
        <label className="text-sm font-semibold" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-skyInk/15 px-4 focus:border-rain focus:ring-2 focus:ring-rain/25"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-skyInk/15 px-4 focus:border-rain focus:ring-2 focus:ring-rain/25"
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 10 : 1}
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-skyInk px-5 font-semibold text-cloud hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain disabled:opacity-70"
        type="submit"
        disabled={loading}
      >
        {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
        {isRegister ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-skyInk/70">
        {isRegister ? "Already have an account?" : "New to IconicSkies?"}{" "}
        <Link className="font-semibold text-rain underline-offset-4 hover:underline" href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
