"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, CloudSun, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { formatTemperature } from "@/lib/utils";
import { getWeatherBackground } from "@/lib/weather/backgrounds";
import type { CurrentLocationResolution } from "@/lib/weather/current-location";
import { resolveWeatherBackgroundMood } from "@/lib/weather/resolve-weather-background";
import type { WeatherResult, WeatherUnits } from "@/lib/weather/types";

type WeatherPreviewResponse = {
  ok?: boolean;
  weather?: WeatherResult;
  location?: CurrentLocationResolution;
  error?: string;
};

export function CurrentLocationCard({
  units,
}: {
  units: WeatherUnits;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error" | "denied">("idle");
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<CurrentLocationResolution | null>(null);
  const [displayCityName, setDisplayCityName] = useState("");
  const [label, setLabel] = useState("Current place");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const mood = useMemo(() => (weather ? resolveWeatherBackgroundMood(weather) : "default-day"), [weather]);
  const background = useMemo(() => getWeatherBackground(mood), [mood]);
  const capturedAt = useMemo(() => {
    if (!weather) return "";
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(weather.snapshot.capturedAt));
  }, [weather]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setState("error");
      setError("Your browser does not support location sharing.");
      return;
    }

    setState("loading");
    setError("");
    setWeather(null);
    setResolvedLocation(null);
    setDisplayCityName("");
    setSaveMessage("");
    setSaveError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        const response = await fetch("/api/weather/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, units }),
        });

        const payload = (await response.json().catch(() => null)) as WeatherPreviewResponse | null;
        if (!response.ok || !payload?.ok || !payload.weather) {
          setState("error");
          setError(payload?.error ?? "Could not preview the weather near you.");
          return;
        }

        setWeather(payload.weather);
        setResolvedLocation(payload.location ?? null);
        const resolvedCityName = payload.location?.resolvedName ?? payload.weather.city.name;
        setDisplayCityName(resolvedCityName);
        setLabel(resolvedCityName === "Near your location" ? "Current place" : resolvedCityName);
        setState("ready");
      },
      (geoError) => {
        setState(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "error");
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission stays optional. You can try again whenever you like."
            : "Could not access your location right now.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  async function saveFavorite() {
    if (!weather || !coords) return;

    setSaveError("");
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: weather.city.id || undefined,
          cityName: displayCityName.trim() || weather.city.name,
          country: weather.city.country,
          region: weather.city.region,
          latitude: coords.latitude,
          longitude: coords.longitude,
          unitsPreference: weather.snapshot.units,
          label,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setSaveError(payload?.error ?? "Could not save this location.");
        return;
      }

      setSaveMessage("Saved as a favorite location.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/14 bg-[#09171c]/86 text-cloud shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <div className="relative isolate min-h-[18rem] overflow-hidden">
        {weather ? (
          <>
            <Image
              alt=""
              fill
              sizes="(min-width: 1024px) 1100px, 100vw"
              src={background.image}
              className="object-cover"
              priority
            />
            <div
              className={`absolute inset-0 ${
                background.overlay === "warm"
                  ? "bg-[radial-gradient(circle_at_18%_18%,rgba(216,138,75,0.20),transparent_18rem),linear-gradient(120deg,rgba(5,12,18,0.34)_0%,rgba(5,12,18,0.76)_100%)]"
                  : background.overlay === "night"
                    ? "bg-[radial-gradient(circle_at_16%_18%,rgba(123,198,164,0.14),transparent_18rem),linear-gradient(120deg,rgba(5,12,18,0.50)_0%,rgba(5,12,18,0.90)_100%)]"
                    : background.overlay === "storm"
                      ? "bg-[radial-gradient(circle_at_18%_18%,rgba(216,138,75,0.16),transparent_18rem),linear-gradient(120deg,rgba(5,12,18,0.50)_0%,rgba(5,12,18,0.90)_100%)]"
                      : "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.14),transparent_18rem),linear-gradient(120deg,rgba(5,12,18,0.38)_0%,rgba(5,12,18,0.84)_100%)]"
              }`}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.10)_0%,rgba(5,12,18,0.30)_54%,rgba(5,12,18,0.88)_100%)]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(123,198,164,0.14),transparent_18rem),radial-gradient(circle_at_80%_20%,rgba(216,138,75,0.14),transparent_16rem),linear-gradient(145deg,rgba(7,20,28,0.96)_0%,rgba(8,22,31,0.86)_100%)]" />
        )}

        <div className="relative z-10 flex min-h-[18rem] flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/30 px-3 py-1 text-xs font-semibold text-aurora backdrop-blur">
                <MapPin aria-hidden className="size-3.5" />
                Near you
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-cloud">Current Sky</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-cloud/84">
                Use your location once, preview the nearby weather, then choose whether to save it.
              </p>
            </div>
            {weather ? (
              <span className="rounded-full border border-white/16 bg-black/30 px-3 py-1.5 text-xs font-semibold text-cloud backdrop-blur">
                {weather.snapshot.condition}
              </span>
            ) : null}
          </div>

          {weather ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_11.25rem] lg:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-cloud/80">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/24 px-3 py-1.5 text-cloud/92 backdrop-blur">
                    <CloudSun aria-hidden className="size-4" />
                    {weather.city.name}
                    {weather.city.country ? `, ${weather.city.country}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/24 px-3 py-1.5 text-cloud/90 backdrop-blur">
                    {capturedAt}
                  </span>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <h3 className="text-4xl font-semibold leading-none tracking-tight text-cloud sm:text-5xl">
                    {formatTemperature(weather.snapshot.temperature, weather.snapshot.units)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/14 bg-[#0b1a20]/92 px-3 py-1.5 text-sm font-medium text-cloud/88">
                      {weather.snapshot.comfortLabel ?? "Humid"}
                    </span>
                    <span className="rounded-full border border-white/14 bg-[#0b1a20]/92 px-3 py-1.5 text-sm font-medium text-cloud/88">
                      {weather.snapshot.description ?? "Weather preview"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="overflow-hidden rounded-[1.1rem] border border-white/16 bg-[#08171c]/84 shadow-[0_18px_34px_rgba(0,0,0,0.28)]">
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      alt={`${weather.city.name} weather preview`}
                      fill
                      sizes="(min-width: 1024px) 12rem, 8rem"
                      src={background.image}
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.08)_0%,rgba(5,12,18,0.36)_100%)]" />
                    <div className="absolute inset-0 grid place-items-end p-3">
                      <div className="rounded-full border border-white/16 bg-black/34 px-3 py-1 text-[0.68rem] font-semibold text-cloud backdrop-blur">
                        Weather near you
                      </div>
                    </div>
                  </div>
                </div>
                <p className="px-1 text-[0.68rem] font-medium text-cloud/72">Captured for your journal</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 max-w-2xl space-y-4">
              <p className="text-sm leading-6 text-cloud/84">
                {state === "denied"
                  ? "Permission is optional. If you want to try again later, the button will still be here."
                  : "We only ask after you click the button. Nothing tracks in the background."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cloud px-4 font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={state === "loading"}
                  type="button"
                  onClick={() => void handleUseCurrentLocation()}
                >
                  {state === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <MapPin aria-hidden className="size-4" />}
                  Use my location
                </button>
                <span className="text-sm text-cloud/76">Preview only, no storage until you choose to save.</span>
              </div>
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
            </div>
          )}

          {weather ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-cloud/92">Display city</span>
                    <input
                      className="min-h-11 w-full rounded-xl border border-white/16 bg-[#0b1a20]/92 px-4 text-sm text-slate-950 placeholder:text-slate-500 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100 focus:border-aurora focus:ring-2 focus:ring-aurora/20"
                      maxLength={160}
                      placeholder="Alipurduar"
                      value={displayCityName}
                      onChange={(event) => setDisplayCityName(event.target.value)}
                    />
                    <p className="mt-1 text-xs text-cloud/62">
                      {resolvedLocation?.confidence === "low"
                        ? `Resolved as ${resolvedLocation?.resolvedName ?? "nearby weather"}`
                        : `Resolved area: ${resolvedLocation?.resolvedName ?? weather.city.name}`}
                    </p>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-cloud/92">Favorite label</span>
                    <input
                      className="min-h-11 w-full rounded-xl border border-white/16 bg-[#0b1a20]/92 px-4 text-sm text-slate-950 placeholder:text-slate-500 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100 focus:border-aurora focus:ring-2 focus:ring-aurora/20"
                      maxLength={120}
                      placeholder="Home, Hostel, Work..."
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                    />
                    <p className="mt-1 text-xs text-cloud/62">This stays private to your journal.</p>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cloud px-4 font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSaving}
                  type="button"
                  onClick={() => void saveFavorite()}
                >
                  {isSaving ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <BookmarkPlus aria-hidden className="size-4" />}
                  Save this as favorite
                </button>
                <p className="flex items-center gap-2 text-xs text-cloud/78">
                  <ShieldCheck aria-hidden className="size-3.5 text-aurora" />
                  Coordinates stay ephemeral until you save this place.
                </p>
              </div>
            </div>
          ) : null}

          {saveMessage ? <p className="mt-3 text-sm font-medium text-aurora">{saveMessage}</p> : null}
          {saveError ? <p className="mt-3 text-sm font-medium text-danger">{saveError}</p> : null}
        </div>
      </div>
    </section>
  );
}
