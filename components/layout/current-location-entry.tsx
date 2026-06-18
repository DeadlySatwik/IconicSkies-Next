"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LoaderCircle, MapPin, Navigation } from "lucide-react";
import { formatTemperature, slugifyCity } from "@/lib/utils";
import type { CurrentLocationResolution } from "@/lib/weather/current-location";
import type { WeatherResult, WeatherUnits } from "@/lib/weather/types";

type WeatherPreviewResponse = {
  ok?: boolean;
  weather?: WeatherResult;
  location?: CurrentLocationResolution;
  error?: string;
};

export function CurrentLocationEntry({ units }: { units: WeatherUnits }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error" | "denied">("idle");
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [location, setLocation] = useState<CurrentLocationResolution | null>(null);
  const [error, setError] = useState("");

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setState("error");
      setError("Your browser does not support location sharing.");
      return;
    }

    setState("loading");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch("/api/weather/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            units,
          }),
        });

        const payload = (await response.json().catch(() => null)) as WeatherPreviewResponse | null;
        if (!response.ok || !payload?.ok || !payload.weather) {
          setState("error");
          setError(payload?.error ?? "Could not preview the weather near you.");
          return;
        }

        setWeather(payload.weather);
        setLocation(payload.location ?? null);
        setState("ready");
      },
      (geoError) => {
        setState(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "error");
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission stays optional."
            : "Could not access your location right now.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  if (state === "ready" && weather) {
    const resolvedName = location?.displayName ?? weather.city.name;
    const weatherHref =
      location?.confidence !== "low" && resolvedName && !resolvedName.toLowerCase().startsWith("near ")
        ? `/city/${slugifyCity(location?.resolvedName ?? resolvedName)}?units=${weather.snapshot.units}`
        : null;

    return (
      <section className="overflow-hidden rounded-2xl border border-white/14 bg-[#09171c]/84 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="relative isolate min-h-[12rem] overflow-hidden p-4">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(123,198,164,0.14),transparent_18rem),linear-gradient(145deg,rgba(7,20,28,0.92)_0%,rgba(8,22,31,0.80)_100%)]" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/28 px-3 py-1 text-xs font-semibold text-aurora backdrop-blur">
                <Navigation aria-hidden className="size-3.5" />
                Use current location
              </p>
              <span className="rounded-full border border-white/16 bg-black/28 px-3 py-1 text-xs font-semibold text-cloud/88 backdrop-blur">
                {weather.snapshot.condition}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-cloud">{location?.displayName ?? "Near your location"}</p>
                <p className="text-xs text-cloud/78">
                  {location?.confidence === "low"
                    ? `Resolved as ${location?.resolvedName ?? "nearby weather"}`
                    : `Resolved area: ${location?.resolvedName ?? weather.city.name}`}
                </p>
                <p className="text-sm text-cloud/84">
                  {weather.city.country ? `${weather.city.country} · ` : ""}
                  {weather.snapshot.description ?? "Weather preview"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-semibold leading-none text-cloud">
                  {formatTemperature(weather.snapshot.temperature, weather.snapshot.units)}
                </p>
                <p className="mt-1 text-xs text-cloud/70">Preview only, no storage until you save it.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40"
                href={weatherHref ?? "/dashboard"}
              >
                {weatherHref ? "Open weather" : "Open dashboard"}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <span className="text-sm text-cloud/68">Use the button to preview the sky near you.</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/14 bg-[#09171c]/84 px-4 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={state === "loading"}
          type="button"
          onClick={() => void handleUseCurrentLocation()}
        >
          {state === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <MapPin aria-hidden className="size-4" />}
          Use current location
        </button>
        <p className="text-sm text-cloud/76">Preview the sky near you.</p>
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
    </section>
  );
}
