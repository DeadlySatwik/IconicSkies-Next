import { emailVerificationRequiredResponse, isEmailVerified } from "@/lib/auth/email-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { skyMomentSchema, jsonError } from "@/lib/security/validation";
import { createSkyMoment } from "@/lib/sky/service";
import {
  getWeatherSelectionContext,
  getWeatherForCity,
} from "@/lib/weather/service";
import { getHistoricalWeatherForMoment } from "@/lib/weather/historical";

const BACKDATE_LIMIT_MS = 14 * 24 * 60 * 60 * 1000;
const HISTORICAL_THRESHOLD_MS = 30 * 60 * 1000;

function normalizeCityName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to save a sky moment.", 401);
  if (!isEmailVerified(user)) return emailVerificationRequiredResponse("Verify your email to save a sky moment.");

  const parsed = skyMomentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the sky moment details.", 422);

  const capturedAt = parsed.data.capturedAt ? new Date(parsed.data.capturedAt) : new Date();
  if (Number.isNaN(capturedAt.getTime())) {
    return jsonError("Sky Moments can be backdated up to 14 days.", 422);
  }

  const now = Date.now();
  if (capturedAt.getTime() > now) {
    return jsonError("Sky Moments can be backdated up to 14 days.", 422);
  }
  if (capturedAt.getTime() < now - BACKDATE_LIMIT_MS) {
    return jsonError("Sky Moments can be backdated up to 14 days.", 422);
  }

  const currentContext = await getWeatherSelectionContext(parsed.data.cityId, parsed.data.weatherSnapshotId).catch(() => null);
  if (!currentContext) return jsonError("Check the sky moment details.", 422);

  const selectedLocation = parsed.data.capturedLocation ?? {
    name: currentContext.city.name,
    country: currentContext.city.country,
    region: currentContext.city.region,
    latitude: currentContext.city.lat,
    longitude: currentContext.city.lon,
  };

  const selectedUnits = parsed.data.units ?? currentContext.snapshot.units;
  const isPastMoment = capturedAt.getTime() < now - HISTORICAL_THRESHOLD_MS;
  const currentCityName = normalizeCityName(currentContext.city.name);
  const selectedCityName = normalizeCityName(selectedLocation.name);
  const locationChanged =
    selectedCityName !== currentCityName ||
    (selectedLocation.country
      ? selectedLocation.country.toLowerCase() !== currentContext.city.country?.toLowerCase()
      : false);

  const resolvedSelectedWeather = locationChanged
    ? await getWeatherForCity(
        [selectedLocation.name, selectedLocation.country].filter(Boolean).join(","),
        selectedUnits,
        null,
      ).catch(() => null)
    : null;

  if (locationChanged && (!resolvedSelectedWeather || resolvedSelectedWeather.isMock)) {
    return jsonError("Could not find that location. Try another city.", 422);
  }

  const resolvedLocation = resolvedSelectedWeather
    ? {
        name: resolvedSelectedWeather.city.name,
        country: resolvedSelectedWeather.city.country,
        region: resolvedSelectedWeather.city.region,
        latitude: resolvedSelectedWeather.city.lat,
        longitude: resolvedSelectedWeather.city.lon,
      }
    : {
        name: currentContext.city.name,
        country: currentContext.city.country,
        region: currentContext.city.region,
        latitude: currentContext.city.lat,
        longitude: currentContext.city.lon,
      };

  let cityId = currentContext.city.id;
  let weatherSnapshotId = currentContext.snapshot.id;

  if (isPastMoment || locationChanged) {
    const latitude = resolvedLocation.latitude;
    const longitude = resolvedLocation.longitude;

    if (latitude == null || longitude == null) {
      return jsonError("Could not find that location. Try another city.", 422);
    }

    if (isPastMoment) {
      const historicalWeather = await getHistoricalWeatherForMoment({
        latitude,
        longitude,
        capturedAt: capturedAt.toISOString(),
        units: selectedUnits,
        cityName: resolvedLocation.name,
        country: resolvedLocation.country,
        region: resolvedLocation.region,
      }).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[sky-moments] historical weather failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
        return null;
      });

      if (!historicalWeather) {
        return jsonError("Historical weather is temporarily unavailable. Try again later.", 422);
      }

      cityId = historicalWeather.city.id;
      weatherSnapshotId = historicalWeather.snapshot.id;
    } else {
      cityId = resolvedSelectedWeather!.city.id;
      weatherSnapshotId = resolvedSelectedWeather!.snapshot.id;
    }
  }

  const moment = await createSkyMoment({
    userId: user.id,
    cityId,
    weatherSnapshotId,
    photoId: parsed.data.photoId,
    title: parsed.data.title ?? null,
    moodTags: parsed.data.moodTags ?? null,
    note: parsed.data.note,
    attachMockPhoto: parsed.data.attachMockPhoto,
    capturedAt,
  }).catch(() => null);

  if (!moment) return jsonError("Could not attach that photo to this sky moment.", 422);

  return Response.json({ ok: true, moment });
}
