import { redirect } from "next/navigation";
import { OtpVerificationBanner } from "@/components/auth/otp-verification-banner";
import { AtmosphericPageShell } from "@/components/layout/atmospheric-page-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Account Security",
};

export default async function SettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  const emailOtpStatus = user.emailVerifiedAt ? "Verified" : "Pending";
  const otpSignInStatus = user.otpRequired ? "Enabled" : "Disabled";

  return (
    <main>
      <AtmosphericPageShell>
        <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-6 text-cloud shadow-[0_22px_68px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aurora">Security</p>
              <h1 className="mt-3 text-4xl font-semibold">Account Security</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-cloud/82">
                Manage email verification and sign-in protection for your IconicSkies account.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-cloud/68">
                Email verification is required once after registration. OTP sign-in after every login is separate and only enabled for selected accounts.
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/6 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cloud/56">Email</p>
              <p className="mt-1 text-sm font-semibold text-cloud">{user.email}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-5 text-cloud shadow-[0_18px_54px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center rounded-full border border-white/14 bg-black/24 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cloud/76">
                  Email verification
                </p>
                <p className="mt-3 text-sm leading-6 text-cloud/82">
                  Verify your inbox once so saved skies, uploads, and journal tools stay available to your account.
                </p>
              </div>
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/84">
                {emailOtpStatus}
              </span>
            </div>

            <div className="mt-4">
              {!user.emailVerifiedAt ? (
                <OtpVerificationBanner
                  purpose="verify-contact"
                  channel="email"
                  identifier={user.email}
                  title="Verify your email"
                  description="Use the code sent to your inbox to confirm this account."
                  compact
                  tone="dark"
                />
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-50">
                  <h2 className="text-lg font-semibold text-emerald-50">Email verified</h2>
                  <p className="mt-1 text-sm leading-6 text-emerald-50/80">
                    Your email is confirmed for IconicSkies.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-5 text-cloud shadow-[0_18px_54px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center rounded-full border border-white/14 bg-black/24 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cloud/76">
                  OTP sign-in protection
                </p>
                <p className="mt-3 text-sm leading-6 text-cloud/82">
                  When OTP sign-in is enabled for your account, IconicSkies asks for an email code after your password.
                </p>
              </div>
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/84">
                {otpSignInStatus}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-white/12 bg-white/6 p-4">
              <p className="text-sm font-semibold text-cloud">Current sign-in mode</p>
              <p className="mt-2 text-sm leading-6 text-cloud/74">
                {user.otpRequired
                  ? "Password sign-in is followed by an email code before access is granted."
                  : "Password-only sign-in is active right now."
                }
              </p>
            </div>
          </section>
        </div>
      </AtmosphericPageShell>
    </main>
  );
}
