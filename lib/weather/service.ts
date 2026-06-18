import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import {
  findFallbackWeatherByCityKey,
  recordFallbackWeather,
} from "@/lib/dev/fallback-store";
import { cities, searchHistory, weatherSnapshots } from "@/lib/db/schema";
import { normalizeEmail, toNumber } from "@/lib/utils";
import { getMockWeather } from "./mock";
import type { CurrentLocationResolution } from "./current-location";
import type { ForecastPoint, WeatherResult, WeatherUnits } from "./types";

type OpenWeatherCurrent = {
  name: string;
  sys?: { country?: string; sunrise?: number; sunset?: number };
  coord?: { lat?: number; lon?: number };
  weather?: Array<{ id?: number; main: string; description: string; icon: string }>;
  main?: { temp: number; feels_like?: number; humidity?: number };
  wind?: { speed?: number };
  clouds?: { all?: number };
  timezone?: number;
  cod?: number | string;
  message?: string;
};

type OpenWeatherForecast = {
  list?: Array<{
    dt_txt: string;
    main: { temp: number };
    weather: Array<{ main: string; icon: string }>;
  }>;
};

type OpenWeatherPayload = {
  current: OpenWeatherCurrent;
  forecast: OpenWeatherForecast;
};

const CACHE_MINUTES = 20;

function rawPayloadObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function optionalNumber(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

function optionalIsoDate(value: unknown) {
  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? value : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000;
    return new Date(milliseconds).toISOString();
  }

  return null;
}

function weatherMetadataFromRawPayload(value: unknown) {
  const payload = rawPayloadObject(value);
  return {
    weatherId: optionalNumber(payload.weatherId),
    cloudiness: optionalNumber(payload.cloudiness),
    timezoneOffset: optionalNumber(payload.timezoneOffset),
    sunrise: optionalIsoDate(payload.sunrise),
    sunset: optionalIsoDate(payload.sunset),
  };
}

function unixSecondsToIso(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

function normalizeCityName(city: string) {
  return city.trim().replace(/\s+/g, " ");
}

function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const rad = Math.PI / 180;
  const dLat = (latitudeB - latitudeA) * rad;
  const dLon = (longitudeB - longitudeA) * rad;
  const lat1 = latitudeA * rad;
  const lat2 = latitudeB * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearestStoredCity(latitude: number, longitude: number) {
  const rows = await getDb()
    .select({
      name: cities.name,
      country: cities.country,
      region: cities.region,
      lat: cities.lat,
      lon: cities.lon,
    })
    .from(cities);

  let nearest:
    | {
        name: string;
        country: string | null;
        region: string | null;
        distanceKm: number;
      }
    | null = null;

  for (const row of rows) {
    const lat = toNumber(row.lat);
    const lon = toNumber(row.lon);
    if (lat === null || lon === null) continue;

    const distanceKm = haversineDistanceKm(latitude, longitude, lat, lon);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = {
        name: row.name,
        country: row.country,
        region: row.region,
        distanceKm,
      };
    }
  }

  return nearest;
}

export async function resolveCurrentLocationResolution(
  latitude: number,
  longitude: number,
  input?: {
    currentName?: string | null;
    country?: string | null;
    region?: string | null;
  },
): Promise<CurrentLocationResolution> {
  const currentName = normalizeCityName(input?.currentName ?? "");
  const nearest = await findNearestStoredCity(latitude, longitude).catch(() => null);

  if (nearest) {
    if (currentName && normalizeCityName(nearest.name).toLowerCase() === currentName.toLowerCase()) {
      return {
        displayName: nearest.name,
        resolvedName: nearest.name,
        confidence: "high",
        country: nearest.country ?? input?.country ?? null,
        region: nearest.region ?? input?.region ?? null,
      };
    }

    if (nearest.distanceKm <= 5) {
      return {
        displayName: nearest.name,
        resolvedName: nearest.name,
        confidence: "high",
        country: nearest.country ?? input?.country ?? null,
        region: nearest.region ?? input?.region ?? null,
      };
    }

    if (nearest.distanceKm <= 20) {
      return {
        displayName: `Near ${nearest.name}`,
        resolvedName: nearest.name,
        confidence: "medium",
        country: nearest.country ?? input?.country ?? null,
        region: nearest.region ?? input?.region ?? null,
      };
    }
  }

  if (currentName.length > 0) {
    return {
      displayName: "Near your location",
      resolvedName: currentName,
      confidence: "low",
      country: input?.country ?? null,
      region: input?.region ?? null,
    };
  }

  return {
    displayName: "Near your location",
    resolvedName: "Near your location",
    confidence: "low",
    country: input?.country ?? null,
    region: input?.region ?? null,
  };
}

async function findCachedWeather(cityName: string, units: WeatherUnits) {
  const db = getDb();
  const normalized = normalizeCityName(cityName).toLowerCase();
  const freshSince = new Date(Date.now() - CACHE_MINUTES * 60 * 1000);

  const rows = await db
    .select({
      cityId: cities.id,
      cityName: cities.name,
      country: cities.country,
      region: cities.region,
      lat: cities.lat,
      lon: cities.lon,
      snapshotId: weatherSnapshots.id,
      source: weatherSnapshots.source,
      units: weatherSnapshots.units,
      temperature: weatherSnapshots.temperature,
      feelsLike: weatherSnapshots.feelsLike,
      humidity: weatherSnapshots.humidity,
      windSpeed: weatherSnapshots.windSpeed,
      condition: weatherSnapshots.condition,
      description: weatherSnapshots.description,
      iconCode: weatherSnapshots.iconCode,
      comfortLabel: weatherSnapshots.comfortLabel,
      capturedAt: weatherSnapshots.capturedAt,
      rawPayload: weatherSnapshots.rawPayload,
    })
    .from(cities)
    .innerJoin(weatherSnapshots, eq(weatherSnapshots.cityId, cities.id))
    .where(
      and(
        eq(cities.normalizedName, normalized),
        eq(weatherSnapshots.units, units),
        gt(weatherSnapshots.capturedAt, freshSince),
      ),
    )
    .orderBy(desc(weatherSnapshots.capturedAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const weatherMetadata = weatherMetadataFromRawPayload(row.rawPayload);

  return {
    city: {
      id: row.cityId,
      name: row.cityName,
      country: row.country,
      region: row.region,
      lat: toNumber(row.lat),
      lon: toNumber(row.lon),
    },
    snapshot: {
      id: row.snapshotId,
      source: row.source as "openweather" | "mock",
      units: row.units as WeatherUnits,
      temperature: Number(row.temperature),
      feelsLike: toNumber(row.feelsLike),
      humidity: row.humidity,
      windSpeed: toNumber(row.windSpeed),
      condition: row.condition,
      description: row.description,
      iconCode: row.iconCode,
      weatherId: weatherMetadata.weatherId,
      cloudiness: weatherMetadata.cloudiness,
      timezoneOffset: weatherMetadata.timezoneOffset,
      sunrise: weatherMetadata.sunrise,
      sunset: weatherMetadata.sunset,
      comfortLabel: row.comfortLabel,
      capturedAt: row.capturedAt.toISOString(),
    },
    forecast: [],
    isMock: row.source === "mock",
  } satisfies WeatherResult;
}

async function fetchOpenWeather(city: string, units: WeatherUnits) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    q: city,
    appid: key,
    units,
  });

  return fetchOpenWeatherByParams(params);
}

async function fetchOpenWeatherByCoordinates(lat: number, lon: number, units: WeatherUnits) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: key,
    units,
  });

  return fetchOpenWeatherByParams(params);
}

async function fetchOpenWeatherByParams(params: URLSearchParams): Promise<OpenWeatherPayload> {
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, {
      next: { revalidate: 60 },
    }),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`, {
      next: { revalidate: 60 },
    }),
  ]);

  const current = (await currentResponse.json()) as OpenWeatherCurrent;

  if (!currentResponse.ok || Number(current.cod) === 404) {
    throw new Error(current.message ?? "City not found");
  }

  const forecast = forecastResponse.ok
    ? ((await forecastResponse.json()) as OpenWeatherForecast)
    : { list: [] };

  return { current, forecast };
}

function forecastFromOpenWeather(payload: OpenWeatherForecast): ForecastPoint[] {
  return (payload.list ?? [])
    .filter((item) => item.dt_txt.includes("12:00:00"))
    .slice(0, 5)
    .map((item) => ({
      time: new Date(item.dt_txt.replace(" ", "T")).toISOString(),
      temperature: item.main.temp,
      condition: item.weather[0]?.main ?? "Clouds",
      iconCode: item.weather[0]?.icon ?? "03d",
    }));
}

async function persistWeather(result: Omit<WeatherResult, "isMock"> & { isMock: boolean }) {
  const db = getDb();
  const [city] = await db
    .insert(cities)
    .values({
      name: result.city.name,
      country: result.city.country,
      region: result.city.region,
      lat: result.city.lat?.toString(),
      lon: result.city.lon?.toString(),
      source: result.snapshot.source,
    })
    .onConflictDoUpdate({
      target: [cities.source, cities.normalizedName],
      set: {
        name: result.city.name,
        country: result.city.country,
        lat: result.city.lat?.toString(),
        lon: result.city.lon?.toString(),
      },
    })
    .returning();

  const [snapshot] = await db
    .insert(weatherSnapshots)
    .values({
      cityId: city.id,
      source: result.snapshot.source,
      units: result.snapshot.units,
      temperature: result.snapshot.temperature.toString(),
      feelsLike: result.snapshot.feelsLike?.toString(),
      humidity: result.snapshot.humidity,
      windSpeed: result.snapshot.windSpeed?.toString(),
      condition: result.snapshot.condition,
      description: result.snapshot.description,
      iconCode: result.snapshot.iconCode,
      capturedAt: new Date(result.snapshot.capturedAt),
      rawPayload: {
        isMock: result.isMock,
        weatherId: result.snapshot.weatherId ?? null,
        cloudiness: result.snapshot.cloudiness ?? null,
        timezoneOffset: result.snapshot.timezoneOffset ?? null,
        sunrise: result.snapshot.sunrise ?? null,
        sunset: result.snapshot.sunset ?? null,
      },
    })
    .returning();

  return {
    ...result,
    city: {
      ...result.city,
      id: city.id,
    },
    snapshot: {
      ...result.snapshot,
      id: snapshot.id,
      comfortLabel: snapshot.comfortLabel,
    },
  } satisfies WeatherResult;
}

function weatherResultFromOpenWeather(
  payload: OpenWeatherPayload,
  units: WeatherUnits,
  cityNameFallback: string,
  source: "openweather" | "mock" = "openweather",
): WeatherResult {
  const current = payload.current;
  const weather = current.weather?.[0];

  return {
    city: {
      id: "",
      name: current.name || cityNameFallback,
      country: current.sys?.country ?? null,
      region: null,
      lat: current.coord?.lat ?? null,
      lon: current.coord?.lon ?? null,
    },
    snapshot: {
      id: "",
      source,
      units,
      temperature: current.main?.temp ?? 0,
      feelsLike: current.main?.feels_like ?? null,
      humidity: current.main?.humidity ?? null,
      windSpeed: current.wind?.speed ?? null,
      condition: weather?.main ?? "Clouds",
      description: weather?.description ?? null,
      iconCode: weather?.icon ?? null,
      weatherId: weather?.id ?? null,
      cloudiness: current.clouds?.all ?? null,
      timezoneOffset: current.timezone ?? null,
      sunrise: unixSecondsToIso(current.sys?.sunrise),
      sunset: unixSecondsToIso(current.sys?.sunset),
      comfortLabel: null,
      capturedAt: new Date().toISOString(),
    },
    forecast: forecastFromOpenWeather(payload.forecast),
    isMock: source === "mock",
  };
}

function weatherResultFromMock(cityName: string, units: WeatherUnits, latitude?: number | null, longitude?: number | null) {
  const mock = getMockWeather(cityName, units);
  return {
    ...mock,
    city: {
      ...mock.city,
      name: cityName,
      lat: latitude ?? mock.city.lat,
      lon: longitude ?? mock.city.lon,
    },
  } satisfies WeatherResult;
}

function fallbackWeatherToResult(result: Omit<WeatherResult, "isMock"> & { isMock: boolean }) {
  const persisted = recordFallbackWeather({
    snapshot: {
      id: randomUUID(),
      source: result.snapshot.source,
      units: result.snapshot.units,
      temperature: result.snapshot.temperature,
      feelsLike: result.snapshot.feelsLike,
      humidity: result.snapshot.humidity,
      windSpeed: result.snapshot.windSpeed,
      condition: result.snapshot.condition,
      description: result.snapshot.description,
      iconCode: result.snapshot.iconCode,
      weatherId: result.snapshot.weatherId ?? null,
      cloudiness: result.snapshot.cloudiness ?? null,
      timezoneOffset: result.snapshot.timezoneOffset ?? null,
      sunrise: result.snapshot.sunrise ?? null,
      sunset: result.snapshot.sunset ?? null,
      comfortLabel: result.snapshot.comfortLabel,
      capturedAt: result.snapshot.capturedAt,
    },
    city: {
      name: result.city.name,
      country: result.city.country,
      region: result.city.region,
      lat: result.city.lat,
      lon: result.city.lon,
      source: result.snapshot.source,
    },
    cityKey: normalizeCityName(result.city.name).toLowerCase(),
  });

  return {
    ...result,
    city: persisted.city,
    snapshot: persisted.snapshot,
  } satisfies WeatherResult;
}

async function persistSearch(query: string, units: WeatherUnits, userId: string | null, cityId: string) {
  const db = getDb();
  await db.insert(searchHistory).values({
    query,
    units,
    userId,
    cityId,
  });
}

export async function getWeatherPreviewByCity(cityName: string, units: WeatherUnits) {
  const city = normalizeCityName(cityName);
  const openWeather = await fetchOpenWeather(city, units).catch((error) => {
    if (process.env.OPENWEATHER_API_KEY) throw error;
    return null;
  });

  if (!openWeather) {
    const mock = weatherResultFromMock(city, units);
    return mock;
  }

  return weatherResultFromOpenWeather(openWeather, units, city);
}

export async function getWeatherPreviewByCoordinatesWithLocation(
  latitude: number,
  longitude: number,
  units: WeatherUnits,
) {
  const openWeather = await fetchOpenWeatherByCoordinates(latitude, longitude, units).catch((error) => {
    if (process.env.OPENWEATHER_API_KEY) throw error;
    return null;
  });

  if (!openWeather) {
    const location = await resolveCurrentLocationResolution(latitude, longitude).catch(() => ({
      displayName: "Near your location",
      resolvedName: "Near your location",
      confidence: "low" as const,
      country: null,
      region: null,
    }));
    return {
      weather: weatherResultFromMock(location.displayName, units, latitude, longitude),
      location,
    };
  }

  const location = await resolveCurrentLocationResolution(latitude, longitude, {
    currentName: openWeather.current.name ?? null,
    country: openWeather.current.sys?.country ?? null,
    region: null,
  }).catch(() => ({
    displayName: openWeather.current.name || "Near your location",
    resolvedName: openWeather.current.name || "Near your location",
    confidence: "low" as const,
    country: openWeather.current.sys?.country ?? null,
    region: null,
  }));

  const weather = weatherResultFromOpenWeather(
    openWeather,
    units,
    location.displayName,
  );

  return {
    weather: {
      ...weather,
      city: {
        ...weather.city,
        name: location.displayName,
        country: location.country ?? weather.city.country,
        region: location.region ?? weather.city.region,
      },
    },
    location,
  };
}

export async function getWeatherPreviewByCoordinates(
  latitude: number,
  longitude: number,
  units: WeatherUnits,
) {
  return (await getWeatherPreviewByCoordinatesWithLocation(latitude, longitude, units)).weather;
}

export async function getWeatherForCity(
  cityName: string,
  units: WeatherUnits,
  userId: string | null = null,
): Promise<WeatherResult> {
  const city = normalizeCityName(cityName);
  let databaseUnavailable = false;

  const cached = await findCachedWeather(city, units).catch((error) => {
    if (!isDatabaseConnectionError(error)) throw error;
    databaseUnavailable = true;
    return null;
  });
  if (cached) {
    if (userId) await persistSearch(city, units, userId, cached.city.id).catch(() => undefined);
    return cached;
  }

  if (databaseUnavailable) {
    const fallbackCached = findFallbackWeatherByCityKey(city.toLowerCase(), units);
    if (fallbackCached) {
      const result = {
        city: fallbackCached.city,
        snapshot: fallbackCached.snapshot,
        forecast: [],
        isMock: fallbackCached.snapshot.source === "mock",
      } satisfies WeatherResult;
      if (userId) await persistSearch(city, units, userId, fallbackCached.city.id).catch(() => undefined);
      return result;
    }
  }

  const preview = await getWeatherPreviewByCity(city, units).catch((error) => {
    if (process.env.OPENWEATHER_API_KEY) throw error;
    return weatherResultFromMock(city, units);
  });

  if (preview.isMock) {
    const persisted = databaseUnavailable
      ? fallbackWeatherToResult(preview)
      : await persistWeather(preview).catch((error) => {
          if (!isDatabaseConnectionError(error)) throw error;
          return fallbackWeatherToResult(preview);
        });

    if (userId && !databaseUnavailable) {
      await persistSearch(city, units, userId, persisted.city.id).catch(() => undefined);
    }
    return persisted;
  }

  const result = preview;

  const persisted = databaseUnavailable
    ? fallbackWeatherToResult(result)
    : await persistWeather(result).catch((error) => {
        if (!isDatabaseConnectionError(error)) throw error;
        return fallbackWeatherToResult(result);
      });

  if (userId && !databaseUnavailable) {
    await persistSearch(city, units, userId, persisted.city.id).catch(() => undefined);
  }
  return persisted;
}

export function cityDisplayKey(city: string) {
  return normalizeEmail(normalizeCityName(city));
}
