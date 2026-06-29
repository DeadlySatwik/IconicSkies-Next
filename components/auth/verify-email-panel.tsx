"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";

export function VerifyEmailPanel({
  email,
  next,
}: {
  email: string;
  next: string;
}) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-6 text-cloud shadow-[0_22px_68px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aurora">Verify once</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Verify your email</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-cloud/82">
        Enter the code we sent to <span className="font-semibold text-cloud">{email}</span>. Once this inbox is verified, normal password sign-in works without another verification step unless OTP sign-in is explicitly enabled for your account.
      </p>
      <div className="mt-6">
        <OtpVerificationForm
          purpose="verify-contact"
          channel="email"
          identifier={email}
          title="Email verification code"
          description="Use the one-time code from your inbox to unlock your account."
          initialMessage="Check your email for a verification code."
          requestButtonLabel="Send code again"
          resendButtonLabel="Resend code"
          tone="dark"
          onVerified={() => {
            router.push(next);
            router.refresh();
          }}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-cloud/74">
        <Link className="font-semibold text-aurora underline-offset-4 hover:underline" href="/settings">
          Account Security
        </Link>
        <Link className="font-semibold text-cloud hover:text-aurora" href="/">
          Back to weather
        </Link>
      </div>
    </section>
  );
}
