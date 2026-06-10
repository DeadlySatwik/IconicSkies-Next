import Image from "next/image";
import Link from "next/link";
import { BookOpen, CloudSun, MapPin } from "lucide-react";
import { SearchPanel } from "@/components/weather/search-panel";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cloud px-3 py-1 text-sm font-semibold text-rain shadow-soft">
            <CloudSun aria-hidden className="size-4" />
            Sky Journal weather
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal text-skyInk sm:text-6xl">
            Remember the sky, not just the weather.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-skyInk/75">
            Search a city, read the weather, then save the moment with a note and sky photo.
            IconicSkies turns a forecast into a personal timeline.
          </p>
          <div className="mt-8">
            <SearchPanel />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-skyInk/70">
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
        <div className="relative min-h-[420px] overflow-hidden rounded-xl bg-skyInk shadow-soft">
          <Image
            src="/assets/bg.jpg"
            alt="Clouds over a cinematic sky"
            fill
            loading="eager"
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-skyInk/90 via-skyInk/35 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-cloud">
            <p className="text-sm font-semibold text-aurora">Saved sky moment</p>
            <p className="mt-2 max-w-sm text-2xl font-semibold">
              Unexpected rain before the train, Delhi, 6:12 PM.
            </p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-cloud px-4 py-2 font-semibold text-skyInk"
              href="/register"
            >
              Start your journal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
