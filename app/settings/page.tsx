import { redirect } from "next/navigation";
import { OtpVerificationBanner } from "@/components/auth/otp-verification-banner";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  const smsConfigured = Boolean(
    process.env.SMS_OTP_PROVIDER?.trim() &&
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM?.trim(),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-xl bg-cloud p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-3 text-skyInk/70">
          Unit and theme preferences are represented in the database schema. The vertical slice
          keeps the main interaction focused on weather search and saved moments.
        </p>
      </section>

      <div className="mt-6 space-y-4">
        {!user.emailVerifiedAt ? (
          <OtpVerificationBanner
            purpose="verify-contact"
            channel="email"
            identifier={user.email}
            title="Verify your email"
            description="Use the code sent to your inbox to confirm this account."
            compact
          />
        ) : (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-cloud">
            <h2 className="text-lg font-semibold text-emerald-100">Email verified</h2>
            <p className="mt-1 text-sm text-emerald-50/80">Your email is confirmed for IconicSkies.</p>
          </section>
        )}

        {smsConfigured && user.phoneNumber ? (
          <OtpVerificationBanner
            purpose="verify-contact"
            channel="sms"
            identifier={user.phoneNumber}
            title="Verify your phone number"
            description="Use the code sent to your phone to confirm this number."
            compact
          />
        ) : (
          <section className="rounded-2xl border border-white/10 bg-[#0c1a21]/92 p-5 text-cloud">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Verify phone number</h2>
                <p className="mt-1 text-sm text-cloud/72">
                  {smsConfigured
                    ? "Add a phone number before phone OTP can be used."
                    : "Phone OTP is not configured yet."}
                </p>
              </div>
              <span className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cloud/72">
                SMS
              </span>
            </div>
            <button
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-white/12 px-4 text-sm font-semibold text-cloud/70 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled
            >
              Not available yet
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
