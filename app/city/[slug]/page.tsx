import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { FavoriteLocationControl } from "@/components/favorites/favorite-location-control";
import { SaveMomentForm } from "@/components/sky/save-moment-form";
import { SearchPanel } from "@/components/weather/search-panel";
import { WeatherBackground } from "@/components/weather/weather-background";
import { WeatherCard } from "@/components/weather/weather-card";
import { getCurrentUser } from "@/lib/auth/session";
import { listFavoriteLocationsForCity } from "@/lib/favorites/service";
import { isGcsConfigured } from "@/lib/gcs/service";
import { formatTemperature, unslugifyCity } from "@/lib/utils";
import { resolveWeatherBackgroundMood } from "@/lib/weather/resolve-weather-background";
import { weatherAssetForIcon } from "@/lib/weather/icons";
import { getWeatherForCity } from "@/lib/weather/service";
import type { WeatherUnits } from "@/lib/weather/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = unslugifyCity(slug);
  return {
    title: `${city} weather`,
    description: `Current weather and Sky Journal moment for ${city}.`,
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ units?: string }>;
}) {
  const [{ slug }, query, user] = await Promise.all([params, searchParams, getCurrentUser().catch(() => null)]);
  const city = unslugifyCity(slug);
  const units: WeatherUnits = query.units === "imperial" ? "imperial" : "metric";

  if (!city) notFound();

  const weather = await getWeatherForCity(city, units, user?.id ?? null).catch(() => null);
  const favoriteLocations = user
    ? await listFavoriteLocationsForCity(user.id, {
        cityId: weather?.city.id ?? null,
        cityName: weather?.city.name ?? city,
        country: weather?.city.country ?? null,
        region: weather?.city.region ?? null,
        latitude: weather?.city.lat ?? null,
        longitude: weather?.city.lon ?? null,
      }).catch(() => [])
    : [];

  if (!weather) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-danger/20 bg-cloud p-8 shadow-soft">
          <h1 className="text-3xl font-semibold">Weather lookup failed</h1>
          <p className="mt-3 text-skyInk/70">
            Try another city, or configure the local database and mock mode.
          </p>
          <div className="mt-6">
            <SearchPanel compact />
          </div>
        </div>
      </main>
    );
  }

  const backgroundMood = resolveWeatherBackgroundMood(weather);
  const weatherIcon = weatherAssetForIcon(weather.snapshot.iconCode, weather.snapshot.condition);
  const capturedAt = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(weather.snapshot.capturedAt));

  return (
    <main className="bg-[#061015] text-cloud">
      <section className="relative isolate overflow-hidden">
        <WeatherBackground mood={backgroundMood} />
        <div className="mx-auto grid min-h-[520px] max-w-6xl items-end gap-8 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1fr_0.88fr] lg:pb-24 lg:pt-16">
          <div>
            <Link className="text-sm font-semibold text-cloud/78 hover:text-cloud hover:underline" href="/">
              Search another city
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-cloud/74">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 backdrop-blur">
                <MapPin aria-hidden className="size-4" />
                {weather.city.name}
                {weather.city.country ? `, ${weather.city.country}` : ""}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 backdrop-blur">
                <CalendarDays aria-hidden className="size-4" />
                {capturedAt}
              </span>
              {weather.isMock ? (
                <span className="rounded-full border border-horizon/25 bg-horizon/16 px-3 py-1 text-xs font-semibold text-[#ffd7b8]">
                  Demo weather
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex items-end gap-5">
              <div>
                <p className="text-lg text-cloud/72">{weather.snapshot.description}</p>
                <h1 className="mt-2 text-6xl font-semibold leading-none tracking-normal text-cloud sm:text-7xl">
                  {formatTemperature(weather.snapshot.temperature, weather.snapshot.units)}
                </h1>
                <p className="mt-4 text-3xl font-semibold text-aurora">{weather.snapshot.condition}</p>
              </div>
              <Image
                src={weatherIcon}
                alt=""
                width={128}
                height={128}
                className="mb-2 hidden size-28 sm:block"
                priority
              />
            </div>
          </div>
          <div className="rounded-2xl border border-white/14 bg-[#071417]/72 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <p className="mb-3 text-sm font-semibold text-cloud/78">Change the sky you are viewing</p>
            <SearchPanel compact variant="dark" />
          </div>
        </div>
      </section>
      <section className="relative z-10 mx-auto -mt-14 grid max-w-6xl gap-6 px-4 pb-12 sm:px-6">
        <div className="grid gap-6">
          <WeatherCard weather={weather} />
          <FavoriteLocationControl
            cityId={weather.city.id}
            cityName={weather.city.name}
            country={weather.city.country}
            region={weather.city.region}
            latitude={weather.city.lat}
            longitude={weather.city.lon}
            unitsPreference={units}
            signedIn={Boolean(user)}
            favorites={favoriteLocations.map((favorite) => ({
              id: favorite.id,
              label: favorite.label,
              cityName: favorite.cityName,
              country: favorite.country,
              region: favorite.region,
            }))}
          />
          <SaveMomentForm
            cityId={weather.city.id}
            weatherSnapshotId={weather.snapshot.id}
            gcsEnabled={isGcsConfigured()}
            signedIn={Boolean(user)}
            variant="cinematic"
          />
        </div>
      </section>
    </main>
  );
}
