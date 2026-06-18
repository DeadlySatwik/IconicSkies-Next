import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import { favoriteLocations, userPreferences } from "@/lib/db/schema";
import { slugifyCity, toNumber } from "@/lib/utils";
import {
  getWeatherPreviewByCity,
  getWeatherPreviewByCoordinates,
} from "@/lib/weather/service";
import type { WeatherResult, WeatherUnits } from "@/lib/weather/types";

export type FavoriteLocationRecord = {
  id: string;
  userId: string;
  cityId: string | null;
  label: string;
  cityName: string;
  country: string | null;
  region: string | null;
  normalizedCityKey: string;
  latitude: number | null;
  longitude: number | null;
  unitsPreference: WeatherUnits | null;
  locationKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FavoriteLocationPreview = FavoriteLocationRecord & {
  weather: WeatherResult | null;
  weatherError: string | null;
};

type FavoriteLocationRow = {
  id: string;
  userId: string;
  cityId: string | null;
  label: string;
  cityName: string;
  country: string | null;
  region: string | null;
  normalizedCityKey: string;
  latitude: string | number | null;
  longitude: string | number | null;
  unitsPreference: string | null;
  locationKey: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function roundFavoriteCoordinate(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}

export function normalizeFavoriteCityKey(
  cityName: string,
  country: string | null = null,
  region: string | null = null,
) {
  return slugifyCity([cityName, country ?? "", region ?? ""].filter(Boolean).join(" "));
}

function normalizeFavoriteLabelKey(label: string) {
  return slugifyCity(label);
}

function buildFavoriteLocationKey(input: {
  cityId: string | null;
  normalizedCityKey: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const normalizedLabel = normalizeFavoriteLabelKey(input.label);
  if (input.cityId) return `city:${input.cityId}:label:${normalizedLabel}`;
  return [
    "coords",
    input.normalizedCityKey,
    input.latitude === null ? "na" : input.latitude.toFixed(3),
    input.longitude === null ? "na" : input.longitude.toFixed(3),
    normalizedLabel,
  ].join(":");
}

export function resolveFavoriteLabel(cityName: string, label?: string | null) {
  const normalized = normalizeText(label);
  return normalized.length > 0 ? normalized : cityName;
}

function toFavoriteLocationRecord(row: FavoriteLocationRow): FavoriteLocationRecord {
  return {
    ...row,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    unitsPreference: row.unitsPreference as WeatherUnits | null,
  };
}

export async function getUserUnitsPreference(userId: string) {
  try {
    const [row] = await getDb()
      .select({ units: userPreferences.units })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return (row?.units as WeatherUnits | undefined) ?? "metric";
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return "metric";
  }
}

export async function listFavoriteLocations(userId: string) {
  const rows = await getDb()
    .select({
      id: favoriteLocations.id,
      userId: favoriteLocations.userId,
      cityId: favoriteLocations.cityId,
      label: favoriteLocations.label,
      cityName: favoriteLocations.cityName,
      country: favoriteLocations.country,
      region: favoriteLocations.region,
      normalizedCityKey: favoriteLocations.normalizedCityKey,
      latitude: favoriteLocations.latitude,
      longitude: favoriteLocations.longitude,
      unitsPreference: favoriteLocations.unitsPreference,
      locationKey: favoriteLocations.locationKey,
      createdAt: favoriteLocations.createdAt,
      updatedAt: favoriteLocations.updatedAt,
    })
    .from(favoriteLocations)
    .where(eq(favoriteLocations.userId, userId))
    .orderBy(desc(favoriteLocations.createdAt))
    .limit(20);

  return rows.map((row) => ({
    ...row,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    unitsPreference: row.unitsPreference as WeatherUnits | null,
  }));
}

export async function listFavoriteLocationsForCity(
  userId: string,
  input: {
    cityId?: string | null;
    cityName: string;
    country: string | null;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
) {
  const normalizedCityKey = normalizeFavoriteCityKey(input.cityName, input.country, input.region ?? null);
  const roundedLat = roundFavoriteCoordinate(input.latitude);
  const roundedLon = roundFavoriteCoordinate(input.longitude);
  const favorites = await listFavoriteLocations(userId);

  return favorites.filter((favorite) => {
    if (input.cityId && favorite.cityId === input.cityId) return true;
    if (favorite.normalizedCityKey !== normalizedCityKey) return false;
    if (favorite.latitude === null || favorite.longitude === null) return true;
    if (roundedLat === null || roundedLon === null) return false;
    return favorite.latitude === roundedLat && favorite.longitude === roundedLon;
  });
}

export async function getFavoriteLocation(userId: string, favoriteId: string) {
  const [row] = await getDb()
    .select({
      id: favoriteLocations.id,
      userId: favoriteLocations.userId,
      cityId: favoriteLocations.cityId,
      label: favoriteLocations.label,
      cityName: favoriteLocations.cityName,
      country: favoriteLocations.country,
      region: favoriteLocations.region,
      normalizedCityKey: favoriteLocations.normalizedCityKey,
      latitude: favoriteLocations.latitude,
      longitude: favoriteLocations.longitude,
      unitsPreference: favoriteLocations.unitsPreference,
      locationKey: favoriteLocations.locationKey,
      createdAt: favoriteLocations.createdAt,
      updatedAt: favoriteLocations.updatedAt,
    })
    .from(favoriteLocations)
    .where(and(eq(favoriteLocations.userId, userId), eq(favoriteLocations.id, favoriteId)))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    unitsPreference: row.unitsPreference as WeatherUnits | null,
  };
}

export async function findFavoriteLocationForCity(
  userId: string,
  input: {
    cityId?: string | null;
    cityName: string;
    country: string | null;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
) {
  const candidates = await listFavoriteLocationsForCity(userId, input);
  return candidates[0] ?? null;
}

export async function upsertFavoriteLocation(
  userId: string,
  input: {
    cityId?: string | null;
    cityName: string;
    country?: string | null;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    label?: string | null;
    unitsPreference?: WeatherUnits | null;
  },
) {
  const normalizedCityKey = normalizeFavoriteCityKey(
    input.cityName,
    input.country ?? null,
    input.region ?? null,
  );
  const roundedLat = roundFavoriteCoordinate(input.latitude);
  const roundedLon = roundFavoriteCoordinate(input.longitude);
  const resolvedLabel = resolveFavoriteLabel(input.cityName, input.label);
  const locationKey = buildFavoriteLocationKey({
    cityId: input.cityId ?? null,
    normalizedCityKey,
    label: resolvedLabel,
    latitude: roundedLat,
    longitude: roundedLon,
  });

  const [row] = await getDb()
    .insert(favoriteLocations)
    .values({
      userId,
      cityId: input.cityId ?? null,
      label: resolvedLabel,
      cityName: input.cityName,
      country: input.country ?? null,
      region: input.region ?? null,
      normalizedCityKey,
      latitude: roundedLat === null ? null : String(roundedLat),
      longitude: roundedLon === null ? null : String(roundedLon),
      unitsPreference: input.unitsPreference ?? null,
      locationKey,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [favoriteLocations.userId, favoriteLocations.locationKey],
      set: {
        cityId: input.cityId ?? null,
        label: resolvedLabel,
        cityName: input.cityName,
        country: input.country ?? null,
        region: input.region ?? null,
        normalizedCityKey,
        latitude: roundedLat === null ? null : String(roundedLat),
        longitude: roundedLon === null ? null : String(roundedLon),
        unitsPreference: input.unitsPreference ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    ...row,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    unitsPreference: row.unitsPreference as WeatherUnits | null,
  };
}

export async function updateFavoriteLocationLabel(
  userId: string,
  favoriteId: string,
  label: string,
) {
  const current = await getFavoriteLocation(userId, favoriteId);
  if (!current) return null;

  const resolvedLabel = resolveFavoriteLabel(current.cityName, label);
  const locationKey = buildFavoriteLocationKey({
    cityId: current.cityId,
    normalizedCityKey: current.normalizedCityKey,
    label: resolvedLabel,
    latitude: current.latitude,
    longitude: current.longitude,
  });

  const [row] = await getDb()
    .update(favoriteLocations)
    .set({
      label: resolvedLabel,
      locationKey,
      updatedAt: new Date(),
    })
    .where(and(eq(favoriteLocations.userId, userId), eq(favoriteLocations.id, favoriteId)))
    .returning();

  if (!row) return null;
  return {
    ...row,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    unitsPreference: row.unitsPreference as WeatherUnits | null,
  };
}

export async function deleteFavoriteLocation(userId: string, favoriteId: string) {
  const [row] = await getDb()
    .delete(favoriteLocations)
    .where(and(eq(favoriteLocations.userId, userId), eq(favoriteLocations.id, favoriteId)))
    .returning({ id: favoriteLocations.id });

  return Boolean(row);
}

async function previewWeatherForFavorite(
  favorite: ReturnType<typeof toFavoriteLocationRecord>,
  units: WeatherUnits,
) {
  try {
    if (favorite.latitude !== null && favorite.longitude !== null) {
      return await getWeatherPreviewByCoordinates(favorite.latitude, favorite.longitude, units);
    }
    return await getWeatherPreviewByCity(favorite.cityName, units);
  } catch (error) {
    return {
      weather: null,
      weatherError: error instanceof Error ? error.message : "Weather preview failed.",
    };
  }
}

export async function listFavoriteLocationsWithPreviews(
  userId: string,
  options?: { limit?: number; defaultUnits?: WeatherUnits },
) {
  const limit = Math.min(options?.limit ?? 6, 6);
  const defaultUnits = options?.defaultUnits ?? (await getUserUnitsPreference(userId));
  const favorites = (await listFavoriteLocations(userId)).slice(0, limit).map(toFavoriteLocationRecord);

  const previewResults = await Promise.all(
    favorites.map(async (favorite) => {
      const units = (favorite.unitsPreference ?? defaultUnits) as WeatherUnits;
      const preview = await previewWeatherForFavorite(favorite, units);
      return {
        ...favorite,
        weather: "weather" in preview ? preview.weather : preview,
        weatherError: "weatherError" in preview ? preview.weatherError : null,
      } satisfies FavoriteLocationPreview;
    }),
  );

  return previewResults;
}

export function favoriteMatchesMoment(
  favorite: Pick<
    FavoriteLocationRecord,
    "cityId" | "normalizedCityKey" | "latitude" | "longitude"
  >,
  moment: {
    cityId?: string | null;
    cityName: string;
    country: string | null;
    region?: string | null;
    cityLat?: number | null;
    cityLon?: number | null;
  },
) {
  if (favorite.cityId && favorite.cityId === moment.cityId) return true;

  const momentKey = normalizeFavoriteCityKey(
    moment.cityName,
    moment.country,
    moment.region ?? null,
  );
  if (favorite.normalizedCityKey !== momentKey) return false;

  if (favorite.latitude === null || favorite.longitude === null) return true;
  const roundedLat = roundFavoriteCoordinate(moment.cityLat);
  const roundedLon = roundFavoriteCoordinate(moment.cityLon);
  if (roundedLat === null || roundedLon === null) return false;

  return favorite.latitude === roundedLat && favorite.longitude === roundedLon;
}

export function favoriteLabelForMoment(
  moment: {
    cityId?: string | null;
    cityName: string;
    country: string | null;
    region?: string | null;
    cityLat?: number | null;
    cityLon?: number | null;
  },
  favorites: Array<Pick<FavoriteLocationRecord, "cityId" | "normalizedCityKey" | "latitude" | "longitude" | "label">>,
) {
  const favorite = favorites.find((candidate) => favoriteMatchesMoment(candidate, moment));
  return favorite?.label ?? null;
}
