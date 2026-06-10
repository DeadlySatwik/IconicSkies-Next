import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-xl bg-cloud p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-3 text-skyInk/70">
          Unit and theme preferences are represented in the database schema. The vertical slice
          keeps the main interaction focused on weather search and saved moments.
        </p>
      </section>
    </main>
  );
}
