import { getCurrentUser } from "@/lib/auth/session";
import { completeUpload } from "@/lib/gcs/service";
import { jsonError, uploadCompleteSchema } from "@/lib/security/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to complete an upload.", 401);

  const parsed = uploadCompleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Upload metadata is invalid.", 422);

  const photo = await completeUpload({ userId: user.id, ...parsed.data }).catch(() => null);
  if (!photo) return jsonError("Could not save upload metadata.", 422);

  return Response.json({ ok: true, photo });
}
