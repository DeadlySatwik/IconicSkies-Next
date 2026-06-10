import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveMomentForm } from "@/components/sky/save-moment-form";
import { SearchPanel } from "@/components/weather/search-panel";
import { WeatherCard } from "@/components/weather/weather-card";
import { getCurrentUser } from "@/lib/auth/session";
import { isGcsConfigured } from "@/lib/gcs/service";
import { unslugifyCity } from "@/lib/utils";
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-rain hover:underline" href="/">
            Search another city
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-skyInk">Weather in {weather.city.name}</h1>
        </div>
        <div className="w-full sm:max-w-md">
          <SearchPanel compact />
        </div>
      </div>
      <div className="grid gap-6">
        <WeatherCard weather={weather} />
        <SaveMomentForm
          cityId={weather.city.id}
          weatherSnapshotId={weather.snapshot.id}
          gcsEnabled={isGcsConfigured()}
          signedIn={Boolean(user)}
        />
      </div>
    </main>
  );
}
