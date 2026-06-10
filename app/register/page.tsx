import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-xl bg-cloud p-6 shadow-soft">
        <h1 className="text-3xl font-semibold">Create your Sky Journal</h1>
        <p className="mt-2 text-skyInk/70">Save weather moments, notes, and sky photos.</p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
      </section>
    </main>
  );
}
