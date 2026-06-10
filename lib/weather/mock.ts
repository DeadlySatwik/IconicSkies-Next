import { slugifyCity } from "@/lib/utils";
import type { WeatherResult, WeatherUnits } from "./types";

const conditions = [
  { condition: "Clear", description: "golden open sky", iconCode: "01d" },
  { condition: "Clouds", description: "soft layered clouds", iconCode: "03d" },
  { condition: "Rain", description: "brief silver rain", iconCode: "10d" },
  { condition: "Mist", description: "quiet morning haze", iconCode: "50d" },
];

function seeded(city: string) {
  return city.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getMockWeather(cityName: string, units: WeatherUnits): WeatherResult {
  const seed = seeded(cityName);
  const weather = conditions[seed % conditions.length];
  const metricTemp = 16 + (seed % 18);
  const temperature = units === "imperial" ? metricTemp * 1.8 + 32 : metricTemp;
  const windSpeed = units === "imperial" ? 5 + (seed % 12) : 2 + (seed % 8);
  const capturedAt = new Date().toISOString();
  const citySlug = slugifyCity(cityName);

  return {
    city: {
      id: `mock-city-${citySlug}`,
      name: cityName,
      country: "Demo",
      region: null,
      lat: 28.6139,
      lon: 77.209,
    },
    snapshot: {
      id: `mock-snapshot-${citySlug}-${units}`,
      source: "mock",
      units,
      temperature,
      feelsLike: temperature - 1,
      humidity: 52 + (seed % 36),
      windSpeed,
      condition: weather.condition,
      description: weather.description,
      iconCode: weather.iconCode,
      comfortLabel: metricTemp > 31 ? "hot" : metricTemp < 8 ? "crisp" : "comfortable",
      capturedAt,
    },
    forecast: Array.from({ length: 5 }).map((_, index) => ({
      time: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      temperature: temperature + ((index % 3) - 1) * 2,
      condition: conditions[(seed + index + 1) % conditions.length].condition,
      iconCode: conditions[(seed + index + 1) % conditions.length].iconCode,
    })),
    isMock: true,
  };
}
