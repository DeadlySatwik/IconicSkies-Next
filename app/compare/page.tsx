import { SearchPanel } from "@/components/weather/search-panel";

export const metadata = {
  title: "Compare weather",
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-xl bg-cloud p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Compare weather</h1>
        <p className="mt-3 text-skyInk/70">
          The full comparison view is a secondary feature. For now, search a city to open its weather
          page and save a sky moment.
        </p>
        <div className="mt-6">
          <SearchPanel compact />
        </div>
      </section>
    </main>
  );
}
