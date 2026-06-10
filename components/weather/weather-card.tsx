import Image from "next/image";
import { CalendarDays, Droplets, MapPin, Wind } from "lucide-react";
import { formatTemperature } from "@/lib/utils";
import { weatherAssetForIcon } from "@/lib/weather/icons";
import type { WeatherResult } from "@/lib/weather/types";

export function WeatherCard({ weather }: { weather: WeatherResult }) {
  const icon = weatherAssetForIcon(weather.snapshot.iconCode, weather.snapshot.condition);
  const date = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(weather.snapshot.capturedAt));

  return (
    <section className="overflow-hidden rounded-xl bg-skyInk text-cloud shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-cloud/80">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden className="size-4" />
              {weather.city.name}
              {weather.city.country ? `, ${weather.city.country}` : ""}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays aria-hidden className="size-4" />
              {date}
            </span>
            {weather.isMock ? (
              <span className="rounded-full bg-horizon px-3 py-1 text-xs font-semibold text-skyInk">
                Demo weather
              </span>
            ) : null}
          </div>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg text-cloud/75">{weather.snapshot.description}</p>
              <h1 className="mt-2 text-5xl font-semibold tracking-normal sm:text-6xl">
                {formatTemperature(weather.snapshot.temperature, weather.snapshot.units)}
              </h1>
              <p className="mt-3 text-2xl font-medium text-aurora">{weather.snapshot.condition}</p>
            </div>
            <Image
              src={icon}
              alt=""
              width={144}
              height={144}
              className="h-28 w-28 sm:h-36 sm:w-36"
              priority
            />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <WeatherMetric label="Humidity" value={weather.snapshot.humidity ? `${weather.snapshot.humidity}%` : "n/a"} icon="humidity" />
            <WeatherMetric label="Wind" value={weather.snapshot.windSpeed ? `${Math.round(weather.snapshot.windSpeed)} ${weather.snapshot.units === "imperial" ? "mph" : "m/s"}` : "n/a"} icon="wind" />
            <WeatherMetric label="Comfort" value={weather.snapshot.comfortLabel ?? "recorded"} icon="comfort" />
          </div>
        </div>
        <div className="bg-cloud p-6 text-skyInk sm:p-8">
          <h2 className="text-lg font-semibold">Forecast notes</h2>
          <div className="mt-4 grid gap-3">
            {weather.forecast.length > 0 ? (
              weather.forecast.map((point) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-skyInk/10 bg-white px-3 py-2"
                  key={point.time}
                >
                  <span className="text-sm font-medium">
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                      new Date(point.time),
                    )}
                  </span>
                  <span className="text-sm text-skyInk/70">{point.condition}</span>
                  <span className="font-semibold">
                    {formatTemperature(point.temperature, weather.snapshot.units)}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-skyInk/10 bg-white p-4 text-sm text-skyInk/70">
                Forecast will appear here when the live API returns multi-day data.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function WeatherMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "humidity" | "wind" | "comfort";
}) {
  const Icon = icon === "humidity" ? Droplets : icon === "wind" ? Wind : CalendarDays;
  return (
    <div className="rounded-lg bg-cloud/10 p-4">
      <div className="flex items-center gap-2 text-sm text-cloud/70">
        <Icon aria-hidden className="size-4" />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
