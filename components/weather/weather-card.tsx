import { CalendarDays, Droplets, Wind } from "lucide-react";
import { formatTemperature } from "@/lib/utils";
import type { WeatherResult } from "@/lib/weather/types";

export function WeatherCard({ weather }: { weather: WeatherResult }) {
  const date = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(weather.snapshot.capturedAt));

  return (
    <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="rounded-2xl border border-white/10 bg-[#0d2024] p-6 text-cloud shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-aurora">Current details</p>
            <p className="mt-1 text-sm text-cloud/58">{date}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs font-semibold text-cloud/76">
            {weather.snapshot.source}
          </span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <WeatherMetric
            label="Humidity"
            value={weather.snapshot.humidity ? `${weather.snapshot.humidity}%` : "n/a"}
            icon="humidity"
          />
          <WeatherMetric
            label="Wind"
            value={
              weather.snapshot.windSpeed
                ? `${Math.round(weather.snapshot.windSpeed)} ${
                    weather.snapshot.units === "imperial" ? "mph" : "m/s"
                  }`
                : "n/a"
            }
            icon="wind"
          />
          <WeatherMetric
            label="Comfort"
            value={weather.snapshot.comfortLabel ?? "recorded"}
            icon="comfort"
          />
        </div>
      </div>
      <div className="rounded-2xl border border-skyInk/10 bg-[#eef4f1] p-6 text-skyInk shadow-[0_22px_70px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Forecast notes</h2>
            <p className="mt-1 text-sm text-skyInk/60">A short-range view for planning the next sky.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {weather.forecast.length > 0 ? (
            weather.forecast.map((point) => (
              <div
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-xl border border-skyInk/8 bg-white/82 px-4 py-3 shadow-[0_1px_0_rgba(16,32,34,0.05)]"
                key={point.time}
              >
                <span className="text-sm font-semibold">
                  {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                    new Date(point.time),
                  )}
                </span>
                <span className="text-sm text-skyInk/64">{point.condition}</span>
                <span className="font-semibold">
                  {formatTemperature(point.temperature, weather.snapshot.units)}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-skyInk/10 bg-white/82 p-4 text-sm text-skyInk/68">
              Forecast will appear here when the live API returns multi-day data.
            </p>
          )}
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
    <div className="rounded-xl border border-white/8 bg-white/8 p-4">
      <div className="flex items-center gap-2 text-sm text-cloud/62">
        <Icon aria-hidden className="size-4" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
