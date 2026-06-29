import Link from "next/link";
import { ArrowRight, BookOpen, CloudSun, MapPin } from "lucide-react";
import { LandingBackground } from "@/components/layout/landing-background";
import { CurrentLocationEntry } from "@/components/layout/current-location-entry";
import { LandingSkyMomentCard } from "@/components/sky/landing-sky-moment-card";
import { SearchPanel } from "@/components/weather/search-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { listSkyMoments } from "@/lib/sky/service";
import { getSkyMomentBackground, overlayClassForWeatherOverlay } from "@/lib/sky/moment-visual";

type LandingMoment = Awaited<ReturnType<typeof listSkyMoments>>[number] & {
  weatherId?: number | null;
  cloudiness?: number | null;
  timezoneOffset?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
  createdAt: Date;
};

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  const moments = user ? await listSkyMoments(user.id).catch(() => []) : [];
  const latestMoment = [...moments].sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  })[0] ?? null;

  return (
    <main className="overflow-x-clip bg-[#050c12] text-cloud">
      <section className="relative isolate min-h-[calc(100vh-65px)] overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.16fr_0.84fr] lg:items-start lg:py-16">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-8">
              <LandingBackground />
            </div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-sm font-semibold text-aurora backdrop-blur-xl">
              <CloudSun aria-hidden className="size-4" />
              <span className="truncate sm:text-wrap">Sky Journal weather, built around memory</span>
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1] tracking-normal text-cloud text-wrap-balance sm:text-6xl lg:text-7xl">
              Remember the sky, not just the weather.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cloud/78">
              Search a city, read the weather, then save the moment with a note and sky photo.
              IconicSkies turns a forecast into a living timeline of skies you actually felt.
            </p>
            <div className="mt-8">
              <SearchPanel variant="hero" />
            </div>
            <div className="mt-4 max-w-3xl">
              <CurrentLocationEntry units="metric" />
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
          <div className="relative min-w-0 max-w-full lg:ml-auto lg:mt-8 lg:max-w-[31rem]">
            <div className="absolute inset-0 -z-10 rounded-[1.75rem] bg-[radial-gradient(circle_at_50%_20%,rgba(216,138,75,0.16),transparent_20rem)] blur-2xl sm:-inset-4 lg:-inset-8 lg:rounded-[2rem]" />
            <LandingPreview moment={latestMoment} signedIn={Boolean(user)} />
          </div>
        </div>
      </section>
    </main>
  );
}

function LandingPreview({
  moment,
  signedIn,
}: {
  moment: LandingMoment | null;
  signedIn: boolean;
}) {
  if (!moment) {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#071417]/74 shadow-[0_28px_88px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <div className="relative aspect-[4/3] min-h-[18rem] overflow-hidden sm:min-h-[20rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(123,198,164,0.18),transparent_20rem),radial-gradient(circle_at_82%_28%,rgba(216,138,75,0.16),transparent_18rem),linear-gradient(145deg,rgba(7,20,28,0.95)_0%,rgba(7,20,28,0.82)_42%,rgba(11,25,34,0.92)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.10)_0%,rgba(5,12,18,0.62)_100%)]" />
          <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-aurora backdrop-blur-xl sm:text-sm">
              <CloudSun aria-hidden className="size-4" />
              Saved sky moment
            </div>
            <span className="rounded-full border border-white/14 bg-black/20 px-3 py-1 text-xs font-semibold text-cloud/75 backdrop-blur">
              Waiting
            </span>
          </div>
          <div className="absolute inset-x-5 bottom-5 max-w-md">
            <p className="text-sm uppercase tracking-[0.24em] text-cloud/50">Your latest entry</p>
            <h2 className="mt-3 max-w-[18ch] text-balance text-2xl font-semibold leading-[1.12] text-cloud sm:text-[2.1rem]">
              The first saved sky becomes the face of your journal.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-cloud/68">
              Search a city, save the weather, and the preview will turn into your newest memory.
            </p>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 className="text-base font-semibold text-cloud">Ready when you are</h3>
            <p className="mt-1 text-sm leading-6 text-cloud/62">
              {signedIn
                ? "Save one weather moment and it will appear here with the same sky, place, and note."
                : "Sign in or create an account to keep your saved skies in one place."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-cloud px-4 py-2.5 text-sm font-semibold text-skyInk transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-horizon/70"
              href={signedIn ? "/dashboard" : "/register"}
            >
              {signedIn ? "Open journal" : "Start your journal"}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <span className="text-sm text-cloud/50">Weather-first, memory-second.</span>
          </div>
        </div>
      </div>
    );
  }

  const capturedAt = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(moment.capturedAt));
  const title = moment.title?.trim() || null;
  const moodTags = Array.isArray(moment.moodTags)
    ? moment.moodTags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).slice(0, 4)
    : [];
  const note = moment.note?.trim() || moment.description || "Weather snapshot saved.";
  const photoLabel = moment.photoId ? (moment.isMockPhoto ? "Mock photo" : "Uploaded photo") : null;
  const photoSrc = moment.photoId ? `/api/photos/${moment.photoId}` : null;
  const weatherBackground = getSkyMomentBackground({
    city: {
      id: "",
      name: moment.cityName,
      country: moment.country,
      region: null,
      lat: null,
      lon: null,
    },
    snapshot: {
      id: moment.id,
      source: moment.isMockPhoto ? "mock" : "openweather",
      units: moment.units as "metric" | "imperial",
      temperature: moment.temperature,
      feelsLike: null,
      humidity: null,
      windSpeed: null,
      condition: moment.condition,
      description: moment.description,
      iconCode: moment.iconCode,
      weatherId: moment.weatherId ?? null,
      cloudiness: moment.cloudiness ?? null,
      timezoneOffset: moment.timezoneOffset ?? null,
      sunrise: moment.sunrise ?? null,
      sunset: moment.sunset ?? null,
      comfortLabel: moment.comfortLabel,
      capturedAt: moment.capturedAt instanceof Date ? moment.capturedAt.toISOString() : moment.capturedAt,
    },
    forecast: [],
    isMock: Boolean(moment.isMockPhoto),
  });
  const savedLater =
    moment.createdAt &&
    new Date(moment.createdAt).getTime() - new Date(moment.capturedAt).getTime() > 5 * 60 * 1000;

  return (
    <LandingSkyMomentCard
      capturedAtLabel={capturedAt}
      cityName={moment.cityName}
      comfortLabel={moment.comfortLabel}
      condition={moment.condition}
      country={moment.country}
      momentId={moment.id}
      moodImageSrc={weatherBackground.image}
      moodOverlayClassName={overlayClassForWeatherOverlay(weatherBackground.overlay)}
      moodTags={moodTags}
      note={note}
      photoLabel={photoLabel}
      photoSrc={photoSrc}
      savedLater={savedLater}
      temperature={moment.temperature}
      title={title}
      units={moment.units === "imperial" ? "imperial" : "metric"}
    />
  );
}
