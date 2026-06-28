import "server-only";

import { getJsonCache, setJsonCache } from "@/lib/cache/json-cache";
import { weatherHistoryCacheKey } from "@/lib/cache/keys";
import { persistWeatherResult } from "@/lib/weather/service";
import type { WeatherResult, WeatherUnits } from "@/lib/weather/types";

const HISTORICAL_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

type HistoricalWeatherInput = {
  latitude: number;
  longitude: number;
  capturedAt: string;
  units: WeatherUnits;
  cityName: string;
  country: string | null;
  region: string | null;
};

type OpenMeteoHistoricalResponse = {
  timezone?: string;
  utc_offset_seconds?: number;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
    cloud_cover?: number[];
  };
  daily?: {
    time?: string[];
    sunrise?: string[];
    sunset?: string[];
  };
};

type HistoricalSnapshot = {
  condition: string;
  description: string;
  iconCode: string;
  weatherId: number;
  temperature: number;
  humidity: number | null;
  windSpeed: number | null;
  cloudiness: number | null;
  sunrise: string | null;
  sunset: string | null;
  comfortLabel: string | null;
};

function logHistoricalWeather(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[weather-history] ${message}`, details);
}

function normalizeUnits(input: WeatherUnits) {
  return input === "imperial" ? "imperial" : "metric";
}

function dateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function parseOpenMeteoUtc(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function daySuffix(capturedAt: Date, sunrise: string | null, sunset: string | null) {
  const captureTime = capturedAt.getTime();
  const sunriseTime = sunrise ? parseOpenMeteoUtc(sunrise).getTime() : NaN;
  const sunsetTime = sunset ? parseOpenMeteoUtc(sunset).getTime() : NaN;
  if (Number.isFinite(sunriseTime) && Number.isFinite(sunsetTime)) {
    return captureTime < sunriseTime || captureTime > sunsetTime ? "n" : "d";
  }
  const hour = capturedAt.getUTCHours();
  return hour < 6 || hour >= 18 ? "n" : "d";
}

function weatherSnapshotFromCode(
  code: number,
  temperature: number,
  humidity: number | null,
  windSpeed: number | null,
  cloudiness: number | null,
  capturedAt: Date,
  sunrise: string | null,
  sunset: string | null,
): HistoricalSnapshot {
  let condition = "Clouds";
  let description = "Cloudy";
  let iconBase = "03";

  if (code === 0) {
    condition = "Clear";
    description = "Clear sky";
    iconBase = "01";
  } else if (code === 1) {
    condition = "Clear";
    description = "Mainly clear";
    iconBase = "01";
  } else if (code === 2) {
    condition = "Clouds";
    description = "Partly cloudy";
    iconBase = "02";
  } else if (code === 3) {
    condition = "Clouds";
    description = "Overcast";
    iconBase = "04";
  } else if (code === 45 || code === 48) {
    condition = "Fog";
    description = "Foggy";
    iconBase = "50";
  } else if (code === 51 || code === 53 || code === 55) {
    condition = "Drizzle";
    description = "Drizzle";
    iconBase = "09";
  } else if (code === 56 || code === 57) {
    condition = "Rain";
    description = "Freezing drizzle";
    iconBase = "09";
  } else if (code === 61 || code === 63 || code === 65) {
    condition = "Rain";
    description = code === 61 ? "Light rain" : code === 63 ? "Rain" : "Heavy rain";
    iconBase = "10";
  } else if (code === 66 || code === 67) {
    condition = "Rain";
    description = "Freezing rain";
    iconBase = "10";
  } else if (code === 71 || code === 73 || code === 75 || code === 77) {
    condition = "Snow";
    description = "Snow";
    iconBase = "13";
  } else if (code === 80 || code === 81 || code === 82) {
    condition = "Rain";
    description = "Rain showers";
    iconBase = "09";
  } else if (code === 85 || code === 86) {
    condition = "Snow";
    description = "Snow showers";
    iconBase = "13";
  } else if (code === 95) {
    condition = "Thunderstorm";
    description = "Thunderstorm";
    iconBase = "11";
  } else if (code === 96 || code === 99) {
    condition = "Thunderstorm";
    description = "Thunderstorm with hail";
    iconBase = "11";
  }

  const suffix = daySuffix(capturedAt, sunrise, sunset);
  const comfortLabel =
    condition === "Rain"
      ? humidity !== null && humidity >= 80
        ? "Humid"
        : "Wet"
      : condition === "Thunderstorm"
        ? "Stormy"
        : condition === "Snow"
          ? "Cold"
          : temperature >= 28
            ? "Warm"
            : temperature <= 12
              ? "Cool"
              : humidity !== null && humidity >= 78
                ? "Humid"
                : null;

  return {
    condition,
    description,
    iconCode: `${iconBase}${suffix}`,
    weatherId: code,
    temperature,
    humidity,
    windSpeed,
    cloudiness,
    sunrise,
    sunset,
    comfortLabel,
  };
}

async function fetchOpenMeteoHistorical(input: HistoricalWeatherInput) {
  const capturedAt = new Date(input.capturedAt);
  const startDate = new Date(capturedAt);
  startDate.setUTCDate(startDate.getUTCDate() - 1);
  const endDate = new Date(capturedAt);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  const params = new URLSearchParams({
    latitude: String(input.latitude),
    longitude: String(input.longitude),
    start_date: dateKey(startDate),
    end_date: dateKey(endDate),
    hourly: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover",
    daily: "sunrise,sunset",
    timezone: "UTC",
    temperature_unit: normalizeUnits(input.units) === "imperial" ? "fahrenheit" : "celsius",
    wind_speed_unit: normalizeUnits(input.units) === "imperial" ? "mph" : "kmh",
  });

  const response = await fetch(`https://historical-forecast-api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    const preview = await response.text().catch(() => "");
    throw new Error(
      `Open-Meteo historical forecast failed: ${response.status} ${response.statusText} ${preview.slice(0, 120)}`,
    );
  }

  return (await response.json()) as OpenMeteoHistoricalResponse;
}

function chooseClosestHourlyIndex(times: string[] | undefined, capturedAt: Date) {
  if (!times || times.length === 0) return -1;

  let chosenIndex = 0;
  let chosenDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < times.length; index += 1) {
    const time = parseOpenMeteoUtc(times[index]).getTime();
    if (!Number.isFinite(time)) continue;
    const distance = Math.abs(time - capturedAt.getTime());
    if (distance < chosenDistance) {
      chosenIndex = index;
      chosenDistance = distance;
    }
  }

  return chosenIndex;
}

function chooseDailySnapshot(data: OpenMeteoHistoricalResponse, capturedAt: Date) {
  const capturedDay = dateKey(capturedAt);
  const days = data.daily?.time ?? [];
  const dayIndex = days.findIndex((day) => day === capturedDay);
  if (dayIndex < 0) return { sunrise: null, sunset: null };

  const sunrise = data.daily?.sunrise?.[dayIndex];
  const sunset = data.daily?.sunset?.[dayIndex];

  return {
    sunrise: sunrise ? parseOpenMeteoUtc(sunrise).toISOString() : null,
    sunset: sunset ? parseOpenMeteoUtc(sunset).toISOString() : null,
  };
}

export async function getHistoricalWeatherForMoment(input: HistoricalWeatherInput): Promise<WeatherResult> {
  const capturedAt = new Date(input.capturedAt);
  const cacheKey = weatherHistoryCacheKey(input.latitude, input.longitude, capturedAt.toISOString(), input.units);

  const cached = await getJsonCache<WeatherResult>(cacheKey).catch(() => null);
  logHistoricalWeather(cached ? "cache hit" : "cache miss", {
    key: cacheKey,
    city: input.cityName,
    capturedAt: capturedAt.toISOString(),
    units: input.units,
  });
  if (cached) return cached;

  const data = await fetchOpenMeteoHistorical(input);
  const hourly = data.hourly ?? {};
  const index = chooseClosestHourlyIndex(hourly.time, capturedAt);
  if (index < 0) {
    throw new Error("Historical weather data was unavailable for that moment.");
  }

  const sunriseSunset = chooseDailySnapshot(data, capturedAt);
  const temperature = hourly.temperature_2m?.[index];
  const weatherCode = hourly.weather_code?.[index];

  if (typeof temperature !== "number" || typeof weatherCode !== "number") {
    throw new Error("Historical weather data was incomplete.");
  }

  const resolved = weatherSnapshotFromCode(
    weatherCode,
    temperature,
    typeof hourly.relative_humidity_2m?.[index] === "number" ? hourly.relative_humidity_2m[index] : null,
    typeof hourly.wind_speed_10m?.[index] === "number" ? hourly.wind_speed_10m[index] : null,
    typeof hourly.cloud_cover?.[index] === "number" ? hourly.cloud_cover[index] : null,
    capturedAt,
    sunriseSunset.sunrise,
    sunriseSunset.sunset,
  );

  const weather: WeatherResult = {
    city: {
      id: "",
      name: input.cityName,
      country: input.country,
      region: input.region,
      lat: input.latitude,
      lon: input.longitude,
    },
    snapshot: {
      id: "",
      source: "openmeteo",
      units: input.units,
      temperature: resolved.temperature,
      feelsLike: null,
      humidity: resolved.humidity,
      windSpeed: resolved.windSpeed,
      condition: resolved.condition,
      description: resolved.description,
      iconCode: resolved.iconCode,
      weatherId: resolved.weatherId,
      cloudiness: resolved.cloudiness,
      timezoneOffset: 0,
      sunrise: resolved.sunrise,
      sunset: resolved.sunset,
      comfortLabel: resolved.comfortLabel,
      capturedAt: capturedAt.toISOString(),
    },
    forecast: [],
    isMock: false,
  };

  const persisted = await persistWeatherResult(weather);
  await setJsonCache(cacheKey, persisted, HISTORICAL_CACHE_TTL_SECONDS).catch(() => undefined);
  logHistoricalWeather("cache store", {
    key: cacheKey,
    city: input.cityName,
    capturedAt: capturedAt.toISOString(),
    units: input.units,
  });
  return persisted;
}
