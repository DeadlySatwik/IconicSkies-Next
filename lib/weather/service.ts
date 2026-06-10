import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { cities, searchHistory, weatherSnapshots } from "@/lib/db/schema";
import { normalizeEmail, toNumber } from "@/lib/utils";
import { getMockWeather } from "./mock";
import type { ForecastPoint, WeatherResult, WeatherUnits } from "./types";

type OpenWeatherCurrent = {
  name: string;
  sys?: { country?: string };
  coord?: { lat?: number; lon?: number };
  weather?: Array<{ main: string; description: string; icon: string }>;
  main?: { temp: number; feels_like?: number; humidity?: number };
  wind?: { speed?: number };
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

const CACHE_MINUTES = 20;

function normalizeCityName(city: string) {
  return city.trim().replace(/\s+/g, " ");
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
      rawPayload: { isMock: result.isMock },
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

async function persistSearch(query: string, units: WeatherUnits, userId: string | null, cityId: string) {
  const db = getDb();
  await db.insert(searchHistory).values({
    query,
    units,
    userId,
    cityId,
  });
}

export async function getWeatherForCity(
  cityName: string,
  units: WeatherUnits,
  userId: string | null = null,
): Promise<WeatherResult> {
  const city = normalizeCityName(cityName);

  const cached = await findCachedWeather(city, units).catch(() => null);
  if (cached) {
    if (userId) await persistSearch(city, units, userId, cached.city.id).catch(() => undefined);
    return cached;
  }

  const openWeather = await fetchOpenWeather(city, units).catch((error) => {
    if (process.env.OPENWEATHER_API_KEY) throw error;
    return null;
  });

  if (!openWeather) {
    const mock = getMockWeather(city, units);
    const persisted = await persistWeather(mock).catch(() => mock);
    if (userId && !persisted.city.id.startsWith("mock-")) {
      await persistSearch(city, units, userId, persisted.city.id).catch(() => undefined);
    }
    return persisted;
  }

  const current = openWeather.current;
  const weather = current.weather?.[0];
  const result: WeatherResult = {
    city: {
      id: "",
      name: current.name || city,
      country: current.sys?.country ?? null,
      region: null,
      lat: current.coord?.lat ?? null,
      lon: current.coord?.lon ?? null,
    },
    snapshot: {
      id: "",
      source: "openweather",
      units,
      temperature: current.main?.temp ?? 0,
      feelsLike: current.main?.feels_like ?? null,
      humidity: current.main?.humidity ?? null,
      windSpeed: current.wind?.speed ?? null,
      condition: weather?.main ?? "Clouds",
      description: weather?.description ?? null,
      iconCode: weather?.icon ?? null,
      comfortLabel: null,
      capturedAt: new Date().toISOString(),
    },
    forecast: forecastFromOpenWeather(openWeather.forecast),
    isMock: false,
  };

  const persisted = await persistWeather(result);
  if (userId) await persistSearch(city, units, userId, persisted.city.id).catch(() => undefined);
  return persisted;
}

export function cityDisplayKey(city: string) {
  return normalizeEmail(normalizeCityName(city));
}
