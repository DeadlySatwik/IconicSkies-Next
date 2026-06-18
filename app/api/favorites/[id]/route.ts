import { getCurrentUser } from "@/lib/auth/session";
import {
  deleteFavoriteLocation,
  getFavoriteLocation,
  updateFavoriteLocationLabel,
} from "@/lib/favorites/service";
import { favoriteLocationUpdateSchema, jsonError } from "@/lib/security/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to update a favorite location.", 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = favoriteLocationUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the favorite label.", 422);

  try {
    const favorite = await updateFavoriteLocationLabel(user.id, id, parsed.data.label);
    if (!favorite) return jsonError("Favorite location not found.", 404);
    return Response.json({ ok: true, favorite });
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      return jsonError("That label already belongs to another favorite.", 409);
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to delete a favorite location.", 401);

  const { id } = await params;
  const favorite = await getFavoriteLocation(user.id, id);
  if (!favorite) return jsonError("Favorite location not found.", 404);

  await deleteFavoriteLocation(user.id, id);
  return Response.json({ ok: true });
}
