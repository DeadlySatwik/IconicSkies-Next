import { emailVerificationRequiredResponse, isEmailVerified } from "@/lib/auth/email-verification";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listFavoriteLocations,
  listFavoriteLocationsWithPreviews,
  upsertFavoriteLocation,
} from "@/lib/favorites/service";
import { jsonError, favoriteLocationCreateSchema } from "@/lib/security/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to view your favorite locations.", 401);
  if (!isEmailVerified(user)) return emailVerificationRequiredResponse("Verify your email to view favorite locations.");

  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "1" || url.searchParams.get("withWeather") === "1";
  const limit = Number(url.searchParams.get("limit") ?? "6");

  if (preview) {
    const favorites = await listFavoriteLocationsWithPreviews(user.id, {
      limit: Number.isFinite(limit) && limit > 0 ? limit : 6,
    }).catch(() => []);
    return Response.json({ ok: true, favorites });
  }

  const favorites = await listFavoriteLocations(user.id).catch(() => []);
  return Response.json({ ok: true, favorites });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to save a favorite location.", 401);
  if (!isEmailVerified(user)) return emailVerificationRequiredResponse("Verify your email to save a favorite location.");

  const body = await request.json().catch(() => null);
  const parsed = favoriteLocationCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the favorite location details.", 422);

  try {
    const favorite = await upsertFavoriteLocation(user.id, parsed.data);
    return Response.json({ ok: true, favorite });
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      return jsonError("That favorite location already exists.", 409);
    }

    throw error;
  }
}
