import Link from "next/link";
import { redirect } from "next/navigation";
import { CurrentLocationCard } from "@/components/favorites/current-location-card";
import { FavoriteLocationsGrid } from "@/components/favorites/favorite-locations-grid";
import { SkyTimeline } from "@/components/sky/timeline";
import { getCurrentUser } from "@/lib/auth/session";
import {
  favoriteLabelForMoment,
  getUserUnitsPreference,
  listFavoriteLocationsWithPreviews,
} from "@/lib/favorites/service";
import { listSkyMoments } from "@/lib/sky/service";

export const metadata = {
  title: "Sky Journal",
};

export default async function DashboardPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  const [moments, units, favoriteLocations] = await Promise.all([
    listSkyMoments(user.id).catch(() => []),
    getUserUnitsPreference(user.id).catch(() => "metric" as const),
    listFavoriteLocationsWithPreviews(user.id, { limit: 6 }).catch(() => []),
  ]);
  const timelineMoments = moments.map((moment) => ({
    ...moment,
    favoriteLabel: favoriteLabelForMoment(moment, favoriteLocations),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-8 rounded-xl bg-skyInk p-6 text-cloud shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-aurora">Sky Journal timeline</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Saved skies for {user.name ?? user.email}</h1>
            <p className="mt-3 max-w-2xl text-cloud/82">
              Every entry starts as a weather search, then becomes a memory with place, time,
              condition, note, and photo context.
            </p>
          </div>
          <Link className="rounded-lg bg-cloud px-4 py-2 font-semibold text-skyInk" href="/">
            Search weather
          </Link>
        </div>
      </section>
      <div className="space-y-6">
        <CurrentLocationCard units={units} />
        <FavoriteLocationsGrid favorites={favoriteLocations} />
        <SkyTimeline moments={timelineMoments} />
      </div>
    </main>
  );
}
