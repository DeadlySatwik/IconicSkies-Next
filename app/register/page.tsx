import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AtmosphericPageShell } from "@/components/layout/atmospheric-page-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <main>
      <AtmosphericPageShell>
        <div className="mx-auto grid min-h-[calc(100vh-125px)] w-full max-w-md items-center py-6 sm:py-10">
          <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-6 text-cloud shadow-[0_22px_68px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aurora">Join IconicSkies</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Create account</h1>
            <p className="mt-3 text-sm leading-6 text-cloud/82">Save weather moments, notes, and sky photos.</p>
            <div className="mt-6">
              <AuthForm mode="register" />
            </div>
          </section>
        </div>
      </AtmosphericPageShell>
    </main>
  );
}
