import Link from "next/link";
import { ArrowRight, BookOpen, CloudSun, MapPin } from "lucide-react";
import { LandingBackground } from "@/components/layout/landing-background";
import { SearchPanel } from "@/components/weather/search-panel";

export default function HomePage() {
  return (
    <main className="bg-[#050c12] text-cloud">
      <section className="relative isolate min-h-[calc(100vh-65px)] overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-8">
              <LandingBackground />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-sm font-semibold text-aurora backdrop-blur-xl">
              <CloudSun aria-hidden className="size-4" />
              Sky Journal weather, built around memory
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-normal text-cloud sm:text-6xl lg:text-7xl">
              Remember the sky, not just the weather.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cloud/78">
              Search a city, read the weather, then save the moment with a note and sky photo.
              IconicSkies turns a forecast into a living timeline of skies you actually felt.
            </p>
            <div className="mt-8">
              <SearchPanel variant="hero" />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-cloud/72">
              <span className="inline-flex items-center gap-2">
                <MapPin aria-hidden className="size-4" />
                Live or demo weather
              </span>
              <span className="inline-flex items-center gap-2">
                <BookOpen aria-hidden className="size-4" />
                Save moments to your timeline
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(216,138,75,0.20),transparent_24rem)]" />
            <div className="overflow-hidden rounded-2xl border border-white/16 bg-[#071417]/72 p-5 shadow-[0_34px_110px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7">
              <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-semibold text-aurora">Saved sky moment</p>
                  <p className="mt-2 text-sm text-cloud/58">Delhi, 6:12 PM</p>
                </div>
                <span className="rounded-full border border-horizon/30 bg-horizon/14 px-3 py-1 text-xs font-semibold text-[#ffd8bc]">
                  Rain
                </span>
              </div>
              <p className="mt-7 max-w-md text-3xl font-semibold leading-tight text-cloud">
                Unexpected rain before the train, the whole platform turning silver.
              </p>
              <p className="mt-5 max-w-md text-sm leading-6 text-cloud/68">
                Weather search flows straight into a sky note, a photo, and a timeline entry you can
                revisit long after the forecast expires.
              </p>
              <div className="mt-7 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-white/9 p-3">
                  <p className="text-cloud/50">Temp</p>
                  <p className="mt-1 font-semibold text-cloud">24°C</p>
                </div>
                <div className="rounded-xl bg-white/9 p-3">
                  <p className="text-cloud/50">Mood</p>
                  <p className="mt-1 font-semibold text-cloud">Silver rain</p>
                </div>
                <div className="rounded-xl bg-white/9 p-3">
                  <p className="text-cloud/50">Photo</p>
                  <p className="mt-1 font-semibold text-cloud">Attached</p>
                </div>
              </div>
              <Link
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cloud px-4 py-3 font-semibold text-skyInk transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-horizon/70"
                href="/register"
              >
                Start your journal
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
