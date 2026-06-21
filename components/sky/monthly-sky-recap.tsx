"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Copy, LoaderCircle, Sparkles } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { MonthlyRecapSummary } from "@/lib/sky/monthly-recap";
import { shiftMonthKey } from "@/lib/sky/monthly-recap";

type RecapResponse = {
  headline?: string;
  recap?: string;
  highlights?: string[];
  dominantMoods?: string[];
  error?: string;
};

export function MonthlySkyRecap({
  summary,
}: {
  summary: MonthlyRecapSummary;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [headline, setHeadline] = useState("");
  const [recap, setRecap] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [dominantMoods, setDominantMoods] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const prevMonthKey = shiftMonthKey(summary.monthKey, -1);
  const nextMonthKey = shiftMonthKey(summary.monthKey, 1);
  const hasMoments = summary.momentCount > 0;

  async function generateRecap() {
    if (!hasMoments || status === "loading") return;

    setOpen(true);
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/ai/monthly-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: summary.monthKey }),
      });

      const payload = (await response.json().catch(() => null)) as RecapResponse | null;
      if (!response.ok || !payload?.headline || !payload?.recap) {
        setStatus("error");
        setError(response.status === 429 && payload?.error ? payload.error : "Could not generate this recap right now.");
        return;
      }

      setHeadline(payload.headline);
      setRecap(payload.recap);
      setHighlights((payload.highlights ?? []).slice(0, 5));
      setDominantMoods((payload.dominantMoods ?? []).slice(0, 5));
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Could not generate this recap right now.");
    }
  }

  async function copyRecap() {
    if (!headline && !recap) return;
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText([headline, recap].filter(Boolean).join("\n\n"));
  }

  const headerSummary = status === "ready" && headline
    ? `Recap ready for ${summary.monthLabel}`
    : `Generate a recap for ${summary.monthLabel}`;

  return (
    <CollapsibleSection
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-sm font-semibold text-cloud/88 transition hover:bg-white/12"
            href={`/dashboard?month=${prevMonthKey}`}
          >
            <ChevronLeft aria-hidden className="size-4" />
            Prev
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-sm font-semibold text-cloud/88 transition hover:bg-white/12"
            href="/dashboard"
          >
            Current
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-sm font-semibold text-cloud/88 transition hover:bg-white/12"
            href={`/dashboard?month=${nextMonthKey}`}
          >
            Next
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        </div>
      }
      className="text-cloud"
      contentClassName="bg-transparent"
      defaultOpen={false}
      open={open}
      subtitle={`A calm overview of the skies you saved in ${summary.monthLabel}. Open it when you want the AI recap.`}
      summary={headerSummary}
      title="Monthly Sky Recap"
      variant="dark"
      onOpenChange={setOpen}
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/12 bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cloud/56">Saved moments</p>
              <p className="mt-2 text-2xl font-semibold text-cloud">{summary.momentCount}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cloud/56">Photos</p>
              <p className="mt-2 text-2xl font-semibold text-cloud">{summary.photoCount}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cloud/56">Top city</p>
              <p className="mt-2 text-sm font-semibold text-cloud">
                {summary.topCities[0]?.name ?? "No city yet"}
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cloud/56">Dominant moods</p>
              <p className="mt-2 text-sm font-semibold text-cloud">
                {summary.dominantMoods[0]?.name ?? "Awaiting recap"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {summary.topCities.slice(0, 3).map((city, index) => (
              <span key={`${city.name}-${index}`} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/88">
                {city.name}
              </span>
            ))}
            {summary.topConditions.slice(0, 4).map((condition, index) => (
              <span key={`${condition.name}-${index}`} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/88">
                {condition.name}
              </span>
            ))}
            {summary.dominantMoods.slice(0, 4).map((mood, index) => (
              <span key={`${mood.name}-${index}`} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/88">
                {mood.name}
              </span>
            ))}
          </div>

          {!hasMoments ? (
            <div className="rounded-xl border border-white/12 bg-black/18 p-4">
              <p className="text-sm font-semibold text-cloud">No saved skies this month yet.</p>
              <p className="mt-2 text-sm leading-6 text-cloud/74">
                Save a few weather moments and come back here for a recap of the skies you actually kept.
              </p>
              <Link
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40"
                href="/"
              >
                Search weather
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-white/12 bg-black/18 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cloud/56">AI recap</p>
                  <p className="mt-1 text-sm text-cloud/74">Generate a concise monthly reflection from your saved skies.</p>
                </div>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={status === "loading"}
                  type="button"
                  onClick={() => void generateRecap()}
                >
                  {status === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
                  {status === "loading" ? "Generating..." : "Generate monthly recap"}
                </button>
              </div>

              {status === "ready" && headline && recap ? (
                <div className="mt-4 space-y-4 rounded-xl border border-white/12 bg-[#071417]/80 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-aurora">Monthly recap</p>
                    <h3 className="mt-2 text-xl font-semibold text-cloud">{headline}</h3>
                    <p className="mt-3 text-sm leading-7 text-cloud/82">{recap}</p>
                  </div>
                  {highlights.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {highlights.map((highlight) => (
                        <span key={highlight} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/88">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {dominantMoods.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dominantMoods.map((mood) => (
                        <span key={mood} className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-cloud/88">
                          {mood}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40"
                      type="button"
                      onClick={() => void copyRecap()}
                    >
                      <Copy aria-hidden className="size-4" />
                      Copy recap
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-cloud/88 transition hover:bg-white/12"
                      type="button"
                      onClick={() => void generateRecap()}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-white/12 bg-black/10 p-4 text-sm leading-6 text-cloud/70">
                  The recap will appear here after you generate it.
                </div>
              )}

              {error ? <p className="mt-3 text-sm font-medium text-danger">{error}</p> : null}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/12 bg-black/16 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cloud/56">Snapshot</p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-cloud/56">Month</p>
              <p className="mt-1 text-sm font-semibold text-cloud">{summary.monthLabel}</p>
            </div>
            <div>
              <p className="text-xs text-cloud/56">Notes</p>
              <ul className="mt-2 space-y-2">
                {summary.noteExcerpts.length > 0 ? (
                  summary.noteExcerpts.map((excerpt, index) => (
                    <li key={`${excerpt}-${index}`} className="rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm leading-6 text-cloud/80">
                      {excerpt}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm leading-6 text-cloud/60">
                    No note excerpts yet.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
