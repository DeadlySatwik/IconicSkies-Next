import Image from "next/image";
import { getWeatherBackground, type WeatherBackgroundMood } from "@/lib/weather/backgrounds";

const overlayClasses = {
  "soft-light": "bg-gradient-to-br from-cloud/72 via-cloud/34 to-skyInk/26",
  night: "bg-gradient-to-br from-skyInk/78 via-night/54 to-skyInk/72",
  storm: "bg-gradient-to-br from-night/74 via-skyInk/48 to-rain/38",
  mist: "bg-gradient-to-br from-cloud/78 via-mist/52 to-skyInk/28",
  warm: "bg-gradient-to-br from-horizon/34 via-cloud/42 to-skyInk/42",
} satisfies Record<ReturnType<typeof getWeatherBackground>["overlay"], string>;

export function WeatherBackground({ mood }: { mood: WeatherBackgroundMood }) {
  const background = getWeatherBackground(mood);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-skyInk"
      data-weather-mood={mood}
      data-testid="weather-background"
    >
      <Image
        src={background.image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-100 transition-opacity duration-500 motion-reduce:transition-none"
        priority
      />
      <div className={`absolute inset-0 ${overlayClasses[background.overlay]}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,32,34,0.08)_0%,rgba(16,32,34,0.34)_100%)]" />
    </div>
  );
}
