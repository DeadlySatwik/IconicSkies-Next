"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Check, LoaderCircle, MapPin, Plus, RotateCcw, Trash2 } from "lucide-react";

type FavoriteLocationSummary = {
  id: string;
  label: string;
  cityName: string;
  country: string | null;
  region: string | null;
};

export function FavoriteLocationControl({
  cityId,
  cityName,
  country,
  region,
  latitude,
  longitude,
  unitsPreference,
  signedIn,
  favorites,
}: {
  cityId: string;
  cityName: string;
  country: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  unitsPreference: "metric" | "imperial";
  signedIn: boolean;
  favorites: FavoriteLocationSummary[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState(favorites[0]?.label ?? cityName);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedFavorite = useMemo(
    () => favorites.find((favorite) => favorite.id === selectedFavoriteId) ?? null,
    [favorites, selectedFavoriteId],
  );

  if (!signedIn) {
    return (
      <section className="rounded-2xl border border-white/14 bg-[#09161b]/88 p-5 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-sm font-semibold text-aurora">Save location</p>
        <h2 className="mt-2 text-xl font-semibold text-cloud">Keep this city in your favorite skies</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-cloud/82">
          Sign in to store places like Home, Hostel, or Work and revisit their weather later.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-skyInk" href="/login">
            Sign in
          </a>
          <a className="rounded-full border border-white/16 px-4 py-2 text-sm font-semibold text-cloud/90" href="/register">
            Create account
          </a>
        </div>
      </section>
    );
  }

  async function saveFavorite(nextLabel: string) {
    const trimmedLabel = nextLabel.trim();
    if (trimmedLabel.length < 1) {
      setError("Add a short label for this place.");
      return;
    }

    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const body = {
        cityId,
        cityName,
        country,
        region,
        latitude,
        longitude,
        unitsPreference,
        label: trimmedLabel,
      };

      const response = selectedFavorite
        ? await fetch(`/api/favorites/${selectedFavorite.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: trimmedLabel }),
          })
        : await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; favorite?: { id: string; label: string } }
        | null;

      if (!response.ok || !payload?.ok || !payload.favorite) {
        setError(payload?.error ?? "Could not save this favorite location.");
        return;
      }

      setSelectedFavoriteId(payload.favorite.id);
      setLabel(payload.favorite.label);
      setMessage("Saved to your favorite places.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeFavorite() {
    if (!selectedFavorite) return;

    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/favorites/${selectedFavorite.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Could not remove this favorite location.");
        return;
      }

      const remaining = favorites.filter((favorite) => favorite.id !== selectedFavorite.id);
      const next = remaining[0] ?? null;
      setSelectedFavoriteId(next?.id ?? null);
      setLabel(next?.label ?? cityName);
      setMessage("Removed from your favorite places.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/14 bg-[#09161b]/88 p-5 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-aurora">
            <Bookmark aria-hidden className="size-3.5" />
            Save location
          </p>
          <h2 className="mt-3 text-xl font-semibold text-cloud">Keep this city in your favorite skies</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cloud/82">
            Labels stay private to you, like Home, Hostel, Work, or wherever this sky belongs.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-cloud/78 sm:flex">
          <MapPin aria-hidden className="size-4 text-aurora" />
          {country ? `${cityName}, ${country}` : cityName}
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {favorites.map((favorite) => (
            <button
              key={favorite.id}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selectedFavoriteId === favorite.id
                  ? "border-aurora/40 bg-aurora/16 text-cloud"
                  : "border-white/14 bg-white/8 text-cloud/86 hover:bg-white/12"
              }`}
              onClick={() => {
                setSelectedFavoriteId(favorite.id);
                setLabel(favorite.label);
                setMessage("");
                setError("");
              }}
            >
              {selectedFavoriteId === favorite.id ? (
                <Check aria-hidden className="size-3.5 text-aurora" />
              ) : null}
              {favorite.label}
            </button>
          ))}
          {selectedFavoriteId ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/14 px-3 py-1.5 text-sm font-medium text-cloud/84 hover:bg-white/8"
              onClick={() => {
                setSelectedFavoriteId(null);
                setLabel(cityName);
                setMessage("");
                setError("");
              }}
            >
              <RotateCcw aria-hidden className="size-3.5" />
              New label
            </button>
          ) : null}
        </div>
      ) : null}

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void saveFavorite(label);
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-cloud/90">Favorite label</span>
          <input
            className="min-h-12 w-full rounded-xl border border-white/14 bg-[#0b1a20]/92 px-4 text-sm text-slate-950 placeholder:text-slate-500 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100 focus:border-aurora focus:ring-2 focus:ring-aurora/20"
            maxLength={120}
            placeholder="Home, Hostel, Work..."
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-cloud px-4 font-semibold text-skyInk transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-aurora/40 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSaving}
          >
            {selectedFavorite ? (
              <>
                <Check aria-hidden className="size-4" />
                Update label
              </>
            ) : (
              <>
                <Plus aria-hidden className="size-4" />
                Save location
              </>
            )}
            {isSaving ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
          </button>
          {selectedFavorite ? (
            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/14 px-4 font-semibold text-cloud/88 transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-aurora/30 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled={isSaving}
              onClick={() => void removeFavorite()}
            >
              <Trash2 aria-hidden className="size-4" />
              Remove
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-cloud/80">
          {cityName}
          {country ? `, ${country}` : ""}
          {region ? ` · ${region}` : ""}
        </span>
        <span className="text-cloud/74">
          {latitude !== null && longitude !== null ? "Rounded coordinates are stored only after you save." : "City-level favorites stay private."}
        </span>
      </div>

      {message ? <p className="mt-3 text-sm font-medium text-aurora">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-medium text-danger">{error}</p> : null}
    </section>
  );
}
