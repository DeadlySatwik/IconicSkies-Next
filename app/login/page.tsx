import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AtmosphericPageShell } from "@/components/layout/atmospheric-page-shell";
import { getPostAuthRedirectPath } from "@/lib/auth/email-verification";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(getPostAuthRedirectPath(user));

  return (
    <main>
      <AtmosphericPageShell>
        <div className="mx-auto grid min-h-[calc(100vh-125px)] w-full max-w-md items-center py-6 sm:py-10">
          <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-6 text-cloud shadow-[0_22px_68px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aurora">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Sign in</h1>
            <p className="mt-3 text-sm leading-6 text-cloud/82">Return to your saved skies.</p>
            <div className="mt-6">
              <AuthForm mode="login" />
            </div>
          </section>
        </div>
      </AtmosphericPageShell>
    </main>
  );
}
