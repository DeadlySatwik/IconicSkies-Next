import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, uploadSignSchema } from "@/lib/security/validation";
import { signUpload } from "@/lib/gcs/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to upload a sky photo.", 401);

  const parsed = uploadSignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Upload must be a JPG, PNG, WebP, or GIF under 8 MB.", 422);

  const signed = await signUpload({ userId: user.id, ...parsed.data }).catch(() => null);
  if (!signed) return jsonError("Could not prepare a signed upload URL.", 502);

  return Response.json({ ok: true, upload: signed });
}
