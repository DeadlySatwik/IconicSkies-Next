import { redirect } from "next/navigation";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { AtmosphericPageShell } from "@/components/layout/atmospheric-page-shell";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getPostAuthRedirectPath,
  isEmailVerified,
  sanitizeNextPath,
} from "@/lib/auth/email-verification";

export const metadata = {
  title: "Verify email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  const query = await searchParams.catch(() => ({ next: undefined as string | undefined }));
  const next = sanitizeNextPath(query.next, "/dashboard");

  if (isEmailVerified(user)) {
    redirect(getPostAuthRedirectPath(user, next));
  }

  return (
    <main>
      <AtmosphericPageShell>
        <div className="mx-auto grid min-h-[calc(100vh-125px)] w-full max-w-2xl items-center py-6 sm:py-10">
          <VerifyEmailPanel email={user.email} next={next} />
        </div>
      </AtmosphericPageShell>
    </main>
  );
}
