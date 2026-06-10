export function weatherAssetForIcon(iconCode: string | null | undefined, condition: string) {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes("thunder")) return "/assets/weather/thunderstorm.svg";
  if (lowerCondition.includes("drizzle")) return "/assets/weather/drizzle.svg";
  if (lowerCondition.includes("rain")) return "/assets/weather/rain.svg";
  if (lowerCondition.includes("snow")) return "/assets/weather/snow.svg";
  if (lowerCondition.includes("mist") || lowerCondition.includes("haze")) {
    return "/assets/weather/atmosphere.svg";
  }
  if (lowerCondition.includes("cloud")) return "/assets/weather/clouds.svg";
  if (iconCode?.startsWith("01") || lowerCondition.includes("clear")) {
    return "/assets/weather/clear.svg";
  }

  return "/assets/weather/clouds.svg";
}
