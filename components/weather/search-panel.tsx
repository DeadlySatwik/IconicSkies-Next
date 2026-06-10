"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { slugifyCity } from "@/lib/utils";

export function SearchPanel({ compact = false }: { compact?: boolean }) {
  const [city, setCity] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [error, setError] = useState("");
  const router = useRouter();

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
      className={compact ? "space-y-3" : "mx-auto max-w-3xl rounded-xl bg-cloud/90 p-3 shadow-soft"}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="city-search">
          Search city
        </label>
        <input
          id="city-search"
          name="city"
          className="min-h-12 flex-1 rounded-lg border border-skyInk/15 bg-white px-4 text-base text-skyInk shadow-none outline-none placeholder:text-skyInk/55 focus:border-rain focus:ring-2 focus:ring-rain/25"
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
          className="min-h-12 rounded-lg border border-skyInk/15 bg-white px-3 text-skyInk focus:border-rain focus:ring-2 focus:ring-rain/25"
          value={units}
          onChange={(event) => setUnits(event.target.value as "metric" | "imperial")}
        >
          <option value="metric">Celsius</option>
          <option value="imperial">Fahrenheit</option>
        </select>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-skyInk px-5 font-semibold text-cloud transition hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain"
          type="submit"
        >
          <Search aria-hidden className="size-4" />
          View weather
        </button>
      </div>
      {error ? <p className="px-1 text-sm font-medium text-danger">{error}</p> : null}
    </form>
  );
}
