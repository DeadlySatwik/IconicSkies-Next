import { geoWeatherPreviewSchema, jsonError } from "@/lib/security/validation";
import { getWeatherPreviewByCoordinatesWithLocation } from "@/lib/weather/service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = geoWeatherPreviewSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the location details.", 422);

  try {
    const preview = await getWeatherPreviewByCoordinatesWithLocation(
      parsed.data.latitude,
      parsed.data.longitude,
      parsed.data.units,
    );

    return Response.json({ ok: true, weather: preview.weather, location: preview.location });
  } catch {
    return jsonError("Current location preview failed.", 502);
  }
}
