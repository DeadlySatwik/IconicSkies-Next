export type WeatherBackgroundMood =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy-day"
  | "cloudy-night"
  | "rain-day"
  | "rain-night"
  | "thunderstorm-day"
  | "thunderstorm-night"
  | "snow-day"
  | "snow-night"
  | "fog-day"
  | "fog-night"
  | "wind-day"
  | "wind-night"
  | "sunrise"
  | "sunset"
  | "default-day"
  | "default-night";

export type WeatherBackground = {
  image: string;
  label: string;
  overlay: "soft-light" | "night" | "storm" | "mist" | "warm";
  textTone: "dark" | "light";
  accent: string;
};

const weatherPath = "/backgrounds/weather";

export const weatherBackgrounds: Record<WeatherBackgroundMood, WeatherBackground> = {
  "clear-day": {
    image: `${weatherPath}/clear-day.webp`,
    label: "Clear day",
    overlay: "soft-light",
    textTone: "dark",
    accent: "#d88a4b",
  },
  "clear-night": {
    image: `${weatherPath}/clear-night.webp`,
    label: "Clear night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "partly-cloudy-day": {
    image: `${weatherPath}/partly-cloudy-day.webp`,
    label: "Partly cloudy day",
    overlay: "soft-light",
    textTone: "dark",
    accent: "#38767a",
  },
  "partly-cloudy-night": {
    image: `${weatherPath}/partly-cloudy-night.webp`,
    label: "Partly cloudy night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "cloudy-day": {
    image: `${weatherPath}/cloudy-day.webp`,
    label: "Cloudy day",
    overlay: "mist",
    textTone: "dark",
    accent: "#38767a",
  },
  "cloudy-night": {
    image: `${weatherPath}/cloudy-night.webp`,
    label: "Cloudy night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "rain-day": {
    image: `${weatherPath}/rain-day.webp`,
    label: "Rain day",
    overlay: "storm",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "rain-night": {
    image: `${weatherPath}/rain-night.webp`,
    label: "Rain night",
    overlay: "storm",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "thunderstorm-day": {
    image: `${weatherPath}/thunderstorm-day.webp`,
    label: "Thunderstorm day",
    overlay: "storm",
    textTone: "light",
    accent: "#d88a4b",
  },
  "thunderstorm-night": {
    image: `${weatherPath}/thunderstorm-night.webp`,
    label: "Thunderstorm night",
    overlay: "storm",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "snow-day": {
    image: `${weatherPath}/snow-day.webp`,
    label: "Snow day",
    overlay: "mist",
    textTone: "dark",
    accent: "#38767a",
  },
  "snow-night": {
    image: `${weatherPath}/snow-night.webp`,
    label: "Snow night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "fog-day": {
    image: `${weatherPath}/fog-day.webp`,
    label: "Fog day",
    overlay: "mist",
    textTone: "dark",
    accent: "#38767a",
  },
  "fog-night": {
    image: `${weatherPath}/fog-night.webp`,
    label: "Fog night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
  "wind-day": {
    image: `${weatherPath}/wind-day.webp`,
    label: "Wind day",
    overlay: "soft-light",
    textTone: "dark",
    accent: "#38767a",
  },
  "wind-night": {
    image: `${weatherPath}/wind-night.webp`,
    label: "Wind night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
  sunrise: {
    image: `${weatherPath}/sunrise.webp`,
    label: "Sunrise",
    overlay: "warm",
    textTone: "dark",
    accent: "#d88a4b",
  },
  sunset: {
    image: `${weatherPath}/sunset.webp`,
    label: "Sunset",
    overlay: "warm",
    textTone: "light",
    accent: "#d88a4b",
  },
  "default-day": {
    image: `${weatherPath}/clear-day.webp`,
    label: "Default day",
    overlay: "soft-light",
    textTone: "dark",
    accent: "#d88a4b",
  },
  "default-night": {
    image: `${weatherPath}/clear-night.webp`,
    label: "Default night",
    overlay: "night",
    textTone: "light",
    accent: "#7bc6a4",
  },
};

export function getWeatherBackground(mood: WeatherBackgroundMood) {
  return weatherBackgrounds[mood] ?? weatherBackgrounds["default-day"];
}
