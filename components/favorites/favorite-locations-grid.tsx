import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudSun, MapPin, Sparkles, TriangleAlert } from "lucide-react";
import { FavoriteLocationActions } from "@/components/favorites/favorite-location-actions";
import { formatTemperature, slugifyCity } from "@/lib/utils";
import { getWeatherBackground } from "@/lib/weather/backgrounds";
import { resolveWeatherBackgroundMood } from "@/lib/weather/resolve-weather-background";
import type { FavoriteLocationPreview } from "@/lib/favorites/service";
import type { WeatherResult } from "@/lib/weather/types";

function overlayClassFor(mood: string) {
  switch (mood) {
    case "warm":
      return "bg-[radial-gradient(circle_at_18%_18%,rgba(216,138,75,0.18),transparent_14rem),linear-gradient(120deg,rgba(5,12,18,0.30)_0%,rgba(5,12,18,0.80)_100%)]";
    case "storm":
      return "bg-[radial-gradient(circle_at_16%_18%,rgba(216,138,75,0.14),transparent_14rem),linear-gradient(120deg,rgba(5,12,18,0.42)_0%,rgba(5,12,18,0.88)_100%)]";
    case "mist":
      return "bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.14),transparent_14rem),linear-gradient(120deg,rgba(5,12,18,0.24)_0%,rgba(5,12,18,0.78)_100%)]";
    case "night":
      return "bg-[radial-gradient(circle_at_16%_18%,rgba(123,198,164,0.12),transparent_14rem),linear-gradient(120deg,rgba(5,12,18,0.42)_0%,rgba(5,12,18,0.88)_100%)]";
    default:
      return "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.12),transparent_14rem),linear-gradient(120deg,rgba(5,12,18,0.24)_0%,rgba(5,12,18,0.76)_100%)]";
  }
}

function previewMood(weather: WeatherResult | null) {
  if (!weather) return "default-day" as const;
  return resolveWeatherBackgroundMood(weather);
}

export function FavoriteLocationsGrid({
  favorites,
}: {
  favorites: FavoriteLocationPreview[];
}) {
  if (favorites.length === 0) {
    return (
      <section className="rounded-2xl border border-white/14 bg-[#09161b]/88 p-5 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-aurora/16 text-aurora">
            <Sparkles aria-hidden className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-aurora">My Places</p>
            <h2 className="mt-1 text-2xl font-semibold text-cloud">Save cities like Home, Hostel, or Work</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cloud/82">
              Your favorite skies appear here with a live preview so you can check the weather at a glance.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link className="rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk" href="/">
            Search weather
          </Link>
          <span className="text-sm text-cloud/76">Up to 6 favorites, each with a calm live preview.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-aurora">My Places</p>
          <h2 className="text-2xl font-semibold text-cloud">Favorite skies</h2>
        </div>
        <Link className="hidden items-center gap-2 text-sm font-semibold text-cloud/86 hover:text-cloud sm:inline-flex" href="/">
          Search another city
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {favorites.map((favorite) => {
          const weather = favorite.weather;
          const hasWeather = Boolean(weather);
          const mood = previewMood(weather);
          const background = getWeatherBackground(mood);
          const temperature = weather ? formatTemperature(weather.snapshot.temperature, weather.snapshot.units) : null;
          const condition = weather?.snapshot.condition ?? null;
          const weatherTime = weather
            ? new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(weather.snapshot.capturedAt))
            : null;
          const slug = slugifyCity(favorite.cityName);

          return (
            <article
              className="overflow-hidden rounded-2xl border border-white/14 bg-[#09161b]/88 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl"
              key={favorite.id}
            >
              <div className="relative isolate h-44 overflow-hidden">
                {hasWeather ? (
                  <>
                    <Image
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 1024px) 50vw, 100vw"
                      src={background.image}
                      className="object-cover"
                      priority={false}
                    />
                    <div className={`absolute inset-0 ${overlayClassFor(background.overlay)}`} />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.06)_0%,rgba(5,12,18,0.36)_58%,rgba(5,12,18,0.90)_100%)]" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(123,198,164,0.10),transparent_14rem),linear-gradient(145deg,rgba(7,20,28,0.94)_0%,rgba(6,15,22,0.86)_100%)]" />
                )}

                <div className="relative z-10 flex h-full flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex max-w-[70%] items-center gap-2 rounded-full border border-white/14 bg-black/26 px-3 py-1 text-xs font-semibold text-aurora backdrop-blur">
                      <MapPin aria-hidden className="size-3.5" />
                      {favorite.label}
                    </div>
                    {condition ? (
                      <span className="rounded-full border border-white/14 bg-black/28 px-3 py-1 text-xs font-semibold text-cloud/90 backdrop-blur">
                        {condition}
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/14 bg-black/28 px-3 py-1 text-xs font-semibold text-cloud/80 backdrop-blur">
                        Weather preview unavailable
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-cloud/86">
                          {favorite.cityName}
                          {favorite.country ? `, ${favorite.country}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-cloud/70">
                          {favorite.region ?? "Saved place"}
                          {weatherTime ? ` · ${weatherTime}` : ""}
                        </p>
                      </div>
                      {temperature ? (
                        <p className="text-3xl font-semibold leading-none text-cloud">{temperature}</p>
                      ) : null}
                    </div>

                    {hasWeather ? (
                      <p className="max-w-[28ch] text-sm leading-6 text-cloud/82">
                        {weather?.snapshot.description ?? weather?.snapshot.comfortLabel ?? "A live sky preview for your place."}
                      </p>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-cloud/78">
                        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-horizon" />
                        <p>{favorite.weatherError ?? "We could not load this preview just now."}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-cloud/78">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-2.5 py-1">
                    <CloudSun aria-hidden className="size-3.5" />
                    {favorite.unitsPreference ?? "metric"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-2.5 py-1">
                    {favorite.weather ? "Live preview" : "Fallback state"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk transition hover:bg-mist"
                    href={`/city/${slug}`}
                  >
                    Open city
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                  <FavoriteLocationActions id={favorite.id} initialLabel={favorite.label} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
