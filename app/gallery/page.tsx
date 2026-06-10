import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-xl bg-cloud p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Sky photo gallery</h1>
        <p className="mt-3 text-skyInk/70">
          Photo metadata is wired for mock uploads and GCS signed uploads. Saved photos appear in
          the dashboard timeline first.
        </p>
        <Link className="mt-6 inline-flex rounded-lg bg-skyInk px-4 py-2 font-semibold text-cloud" href="/dashboard">
          View timeline
        </Link>
      </section>
    </main>
  );
}
