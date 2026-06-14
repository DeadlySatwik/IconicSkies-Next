import type { WeatherResult } from "./types";
import type { WeatherBackgroundMood } from "./backgrounds";

const fogConditions = new Set(["mist", "fog", "haze", "smoke", "dust", "sand", "ash"]);

function isNightFromIcon(iconCode: string | null | undefined) {
  return iconCode?.endsWith("n") ?? false;
}

function localDateFromSnapshot(snapshot: WeatherResult["snapshot"]) {
  const captured = new Date(snapshot.capturedAt);
  if (!Number.isFinite(captured.getTime())) return new Date();

  if (typeof snapshot.timezoneOffset !== "number") return captured;
  return new Date(captured.getTime() + snapshot.timezoneOffset * 1000);
}

function isNight(snapshot: WeatherResult["snapshot"]) {
  if (snapshot.iconCode) return isNightFromIcon(snapshot.iconCode);

  const local = localDateFromSnapshot(snapshot);
  const hour = local.getUTCHours();
  return hour < 6 || hour >= 18;
}

function timeFromIso(value: string | null | undefined) {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : undefined;
}

function withinMinutes(time: number | undefined, target: string | null | undefined, minutes: number) {
  const targetTime = timeFromIso(target);
  if (!time || !targetTime) return false;
  return Math.abs(time - targetTime) <= minutes * 60 * 1000;
}

function daySuffix(snapshot: WeatherResult["snapshot"]) {
  return isNight(snapshot) ? "night" : "day";
}

export function resolveWeatherBackgroundMood(weather: WeatherResult): WeatherBackgroundMood {
  const snapshot = weather.snapshot;
  const main = snapshot.condition.toLowerCase();
  const description = snapshot.description?.toLowerCase() ?? "";
  const weatherId = snapshot.weatherId;
  const localTime = localDateFromSnapshot(snapshot).getTime();

  if (withinMinutes(localTime, snapshot.sunrise, 45)) return "sunrise";
  if (withinMinutes(localTime, snapshot.sunset, 50)) return "sunset";

  const suffix = daySuffix(snapshot);
  const windSpeed = snapshot.windSpeed ?? 0;

  if (
    main.includes("squall") ||
    main.includes("tornado") ||
    (typeof weatherId === "number" && weatherId >= 771 && weatherId <= 781) ||
    windSpeed >= 12
  ) {
    return `wind-${suffix}` as WeatherBackgroundMood;
  }

  if (main.includes("thunder") || (typeof weatherId === "number" && weatherId >= 200 && weatherId < 300)) {
    return `thunderstorm-${suffix}` as WeatherBackgroundMood;
  }

  if (main.includes("rain") || main.includes("drizzle") || (typeof weatherId === "number" && weatherId >= 300 && weatherId < 600)) {
    return `rain-${suffix}` as WeatherBackgroundMood;
  }

  if (main.includes("snow") || (typeof weatherId === "number" && weatherId >= 600 && weatherId < 700)) {
    return `snow-${suffix}` as WeatherBackgroundMood;
  }

  if (
    fogConditions.has(main) ||
    description.includes("fog") ||
    description.includes("mist") ||
    (typeof weatherId === "number" && weatherId >= 700 && weatherId < 771)
  ) {
    return `fog-${suffix}` as WeatherBackgroundMood;
  }

  if (main.includes("cloud")) {
    const cloudiness = snapshot.cloudiness;
    if (
      description.includes("few") ||
      description.includes("scattered") ||
      (typeof cloudiness === "number" && cloudiness < 55)
    ) {
      return `partly-cloudy-${suffix}` as WeatherBackgroundMood;
    }

    return `cloudy-${suffix}` as WeatherBackgroundMood;
  }

  if (main.includes("clear") || weatherId === 800) {
    return `clear-${suffix}` as WeatherBackgroundMood;
  }

  return `default-${suffix}` as WeatherBackgroundMood;
}
