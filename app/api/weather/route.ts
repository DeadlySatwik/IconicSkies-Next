import { getCurrentUser } from "@/lib/auth/session";
import { citySearchSchema, jsonError } from "@/lib/security/validation";
import { getWeatherForCity } from "@/lib/weather/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = citySearchSchema.safeParse({
    city: url.searchParams.get("city"),
    units: url.searchParams.get("units") ?? "metric",
  });

  if (!parsed.success) return jsonError("Enter a valid city name.", 422);

  try {
    const user = await getCurrentUser().catch(() => null);
    const weather = await getWeatherForCity(parsed.data.city, parsed.data.units, user?.id ?? null);
    return Response.json({ ok: true, weather });
  } catch {
    return jsonError("Weather lookup failed. Try another city or use demo mode.", 502);
  }
}
