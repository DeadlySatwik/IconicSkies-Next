import { and, eq } from "drizzle-orm";
import { emailVerificationRequiredResponse, isEmailVerified } from "@/lib/auth/email-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { skyPhotos } from "@/lib/db/schema";
import { downloadPrivatePhoto, isGcsConfigured } from "@/lib/gcs/service";
import { jsonError } from "@/lib/security/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to view this sky photo.", 401);
  if (!isEmailVerified(user)) return emailVerificationRequiredResponse("Verify your email to view this sky photo.");

  const { id } = await params;
  const photo = await getDb().query.skyPhotos.findFirst({
    where: and(eq(skyPhotos.id, id), eq(skyPhotos.uploaderUserId, user.id)),
  });

  if (!photo) return jsonError("Sky photo not found.", 404);

  if (photo.isMock && photo.publicUrl) {
    return Response.redirect(new URL(photo.publicUrl, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  if (!photo.bucket || !isGcsConfigured()) {
    return jsonError("Sky photo storage is not configured.", 404);
  }

  const image = await downloadPrivatePhoto({
    bucket: photo.bucket,
    objectPath: photo.objectPath,
  }).catch(() => null);

  if (!image) return jsonError("Sky photo could not be loaded.", 404);

  return new Response(new Uint8Array(image), {
    headers: {
      "Cache-Control": "private, max-age=60",
      "Content-Type": photo.contentType,
      "Content-Length": String(image.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
