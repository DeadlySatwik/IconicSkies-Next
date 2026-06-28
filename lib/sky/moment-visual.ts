import { getWeatherBackground } from "@/lib/weather/backgrounds";
import { resolveWeatherBackgroundMood } from "@/lib/weather/resolve-weather-background";
import type { WeatherResult } from "@/lib/weather/types";

export function getSkyMomentBackground(weather: WeatherResult) {
  return getWeatherBackground(resolveWeatherBackgroundMood(weather));
}

export function overlayClassForWeatherOverlay(mode: string) {
  switch (mode) {
    case "warm":
      return "bg-[radial-gradient(circle_at_24%_20%,rgba(216,138,75,0.22),transparent_18rem),radial-gradient(circle_at_84%_18%,rgba(123,198,164,0.12),transparent_16rem),linear-gradient(120deg,rgba(17,28,34,0.78)_0%,rgba(8,17,24,0.48)_44%,rgba(5,12,18,0.84)_100%)]";
    case "storm":
      return "bg-[radial-gradient(circle_at_18%_18%,rgba(100,121,160,0.24),transparent_18rem),radial-gradient(circle_at_82%_18%,rgba(216,138,75,0.12),transparent_16rem),linear-gradient(125deg,rgba(7,16,25,0.90)_0%,rgba(10,18,28,0.70)_48%,rgba(4,9,16,0.90)_100%)]";
    case "mist":
      return "bg-[radial-gradient(circle_at_18%_20%,rgba(202,222,224,0.20),transparent_18rem),radial-gradient(circle_at_82%_18%,rgba(216,138,75,0.10),transparent_16rem),linear-gradient(125deg,rgba(8,17,22,0.72)_0%,rgba(14,25,31,0.62)_44%,rgba(4,8,12,0.80)_100%)]";
    case "night":
      return "bg-[radial-gradient(circle_at_18%_20%,rgba(123,198,164,0.16),transparent_18rem),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_16rem),linear-gradient(125deg,rgba(3,8,16,0.88)_0%,rgba(7,16,25,0.66)_48%,rgba(2,5,10,0.92)_100%)]";
    case "soft-light":
    default:
      return "bg-[radial-gradient(circle_at_20%_20%,rgba(255,245,230,0.18),transparent_18rem),radial-gradient(circle_at_80%_18%,rgba(123,198,164,0.12),transparent_16rem),linear-gradient(120deg,rgba(7,20,28,0.60)_0%,rgba(9,18,25,0.38)_42%,rgba(5,12,18,0.76)_100%)]";
  }
}
