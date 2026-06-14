export type WeatherUnits = "metric" | "imperial";

export type ForecastPoint = {
  time: string;
  temperature: number;
  condition: string;
  iconCode: string;
};

export type WeatherResult = {
  city: {
    id: string;
    name: string;
    country: string | null;
    region: string | null;
    lat: number | null;
    lon: number | null;
  };
  snapshot: {
    id: string;
    source: "openweather" | "mock";
    units: WeatherUnits;
    temperature: number;
    feelsLike: number | null;
    humidity: number | null;
    windSpeed: number | null;
    condition: string;
    description: string | null;
    iconCode: string | null;
    weatherId?: number | null;
    cloudiness?: number | null;
    timezoneOffset?: number | null;
    sunrise?: string | null;
    sunset?: string | null;
    comfortLabel: string | null;
    capturedAt: string;
  };
  forecast: ForecastPoint[];
  isMock: boolean;
};
