import { getCurrentUser } from "@/lib/auth/session";
import { skyMomentSchema, jsonError } from "@/lib/security/validation";
import { createSkyMoment } from "@/lib/sky/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to save a sky moment.", 401);

  const parsed = skyMomentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the sky moment details.", 422);

  const moment = await createSkyMoment({
    userId: user.id,
    cityId: parsed.data.cityId,
    weatherSnapshotId: parsed.data.weatherSnapshotId,
    photoId: parsed.data.photoId,
    title: parsed.data.title ?? null,
    moodTags: parsed.data.moodTags ?? null,
    note: parsed.data.note,
    attachMockPhoto: parsed.data.attachMockPhoto,
  }).catch(() => null);

  if (!moment) return jsonError("Could not attach that photo to this sky moment.", 422);

  return Response.json({ ok: true, moment });
}
