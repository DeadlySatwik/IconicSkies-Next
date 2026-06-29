import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { FavoriteLocationControl } from "@/components/favorites/favorite-location-control";
import { AtmosphericPageShell } from "@/components/layout/atmospheric-page-shell";
import { SaveMomentForm } from "@/components/sky/save-moment-form";
import { SearchPanel } from "@/components/weather/search-panel";
import { WeatherBackground } from "@/components/weather/weather-background";
import { WeatherCard } from "@/components/weather/weather-card";
import { buildVerifyEmailHref, isEmailVerified } from "@/lib/auth/email-verification";
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
      <main>
        <AtmosphericPageShell variant="error">
          <section className="mx-auto max-w-3xl rounded-2xl border border-white/14 bg-[#09171c]/88 p-6 text-cloud shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/28 px-3 py-1 text-xs font-semibold text-aurora">
              <MapPin aria-hidden className="size-3.5" />
              Weather search
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-cloud sm:text-4xl">We couldn’t find that sky</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cloud/78 sm:text-base">
              Try another city name, check the spelling, or search a nearby place.
            </p>
            <div className="mt-6">
              <SearchPanel compact variant="dark" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Darjeeling", "Delhi", "Tokyo"].map((cityName) => (
                <Link
                  className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-sm font-medium text-cloud/88 transition hover:bg-white/12"
                  href={`/city/${cityName.toLowerCase()}?units=${units}`}
                  key={cityName}
                >
                  {cityName}
                </Link>
              ))}
            </div>
          </section>
        </AtmosphericPageShell>
      </main>
    );
  }

  const backgroundMood = resolveWeatherBackgroundMood(weather);
  const weatherIcon = weatherAssetForIcon(weather.snapshot.iconCode, weather.snapshot.condition);
  const emailVerified = isEmailVerified(user);
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
            emailVerified={emailVerified}
            aiEnabled={Boolean(process.env.GROQ_API_KEY)}
            cityName={weather.city.name}
            cityCountry={weather.city.country}
            cityRegion={weather.city.region}
            cityLatitude={weather.city.lat}
            cityLongitude={weather.city.lon}
            condition={weather.snapshot.condition}
            temperature={weather.snapshot.temperature}
            units={weather.snapshot.units}
            capturedAt={weather.snapshot.capturedAt}
            verifyEmailHref={buildVerifyEmailHref(`/city/${slug}?units=${units}`)}
            variant="cinematic"
          />
        </div>
      </section>
    </main>
  );
}
