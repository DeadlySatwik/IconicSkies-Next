import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteLocation } from "@/lib/favorites/service";
import { jsonError } from "@/lib/security/validation";
import { getWeatherPreviewByCity, getWeatherPreviewByCoordinates } from "@/lib/weather/service";
import type { WeatherUnits } from "@/lib/weather/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to preview a favorite location.", 401);

  const { id } = await params;
  const favorite = await getFavoriteLocation(user.id, id);
  if (!favorite) return jsonError("Favorite location not found.", 404);

  const url = new URL(request.url);
  const units = url.searchParams.get("units") === "imperial" ? "imperial" : "metric";

  try {
    const weather =
      favorite.latitude !== null && favorite.longitude !== null
        ? await getWeatherPreviewByCoordinates(favorite.latitude, favorite.longitude, units as WeatherUnits)
        : await getWeatherPreviewByCity(favorite.cityName, units as WeatherUnits);

    return Response.json({ ok: true, weather });
  } catch {
    return jsonError("Weather preview failed.", 502);
  }
}
