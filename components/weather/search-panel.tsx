"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { slugifyCity } from "@/lib/utils";

type SearchPanelVariant = "default" | "hero" | "dark";

export function SearchPanel({
  compact = false,
  variant,
}: {
  compact?: boolean;
  variant?: SearchPanelVariant;
}) {
  const [city, setCity] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [error, setError] = useState("");
  const router = useRouter();
  const resolvedVariant = variant ?? (compact ? "dark" : "default");

  const formClass =
    resolvedVariant === "hero"
      ? "max-w-3xl rounded-2xl border border-white/14 bg-[#071417]/68 p-2 shadow-[0_26px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl"
      : resolvedVariant === "dark"
        ? "rounded-2xl border border-white/12 bg-[#071417]/70 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        : "mx-auto max-w-3xl rounded-xl bg-cloud/90 p-3 shadow-soft";

  const inputClass =
    resolvedVariant === "default"
      ? "min-h-12 flex-1 rounded-lg border border-skyInk/15 bg-white px-4 text-base text-skyInk shadow-none outline-none placeholder:text-skyInk/55 focus:border-rain focus:ring-2 focus:ring-rain/25"
      : "min-h-12 flex-1 rounded-xl border border-white/10 bg-cloud px-4 text-base text-skyInk shadow-none outline-none placeholder:text-skyInk/52 focus:border-horizon focus:ring-2 focus:ring-horizon/30";

  const selectClass =
    resolvedVariant === "default"
      ? "min-h-12 rounded-lg border border-skyInk/15 bg-white px-3 text-skyInk focus:border-rain focus:ring-2 focus:ring-rain/25"
      : "min-h-12 rounded-xl border border-white/10 bg-cloud px-3 text-skyInk focus:border-horizon focus:ring-2 focus:ring-horizon/30";

  const buttonClass =
    resolvedVariant === "default"
      ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-skyInk px-5 font-semibold text-cloud transition hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain"
      : "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-horizon px-5 font-semibold text-skyInk transition hover:bg-[#f0a15f] focus:outline-none focus:ring-2 focus:ring-cloud/70";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCity = city.trim();
    if (nextCity.length < 2) {
      setError("Enter at least two characters.");
      return;
    }

    setError("");
    router.push(`/city/${slugifyCity(nextCity)}?units=${units}`);
  }

  return (
    <form
      action="/city"
      method="get"
      onSubmit={onSubmit}
      className={formClass}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="city-search">
          Search city
        </label>
        <input
          id="city-search"
          name="city"
          className={inputClass}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Search Darjeeling, Delhi, Tokyo..."
        />
        <label className="sr-only" htmlFor="units">
          Units
        </label>
        <select
          id="units"
          name="units"
          className={selectClass}
          value={units}
          onChange={(event) => setUnits(event.target.value as "metric" | "imperial")}
        >
          <option value="metric">Celsius</option>
          <option value="imperial">Fahrenheit</option>
        </select>
        <button
          className={buttonClass}
          type="submit"
        >
          <Search aria-hidden className="size-4" />
          View weather
        </button>
      </div>
      {error ? (
        <p className={resolvedVariant === "default" ? "px-1 text-sm font-medium text-danger" : "px-2 pt-1 text-sm font-medium text-[#ffd6c7]"}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
