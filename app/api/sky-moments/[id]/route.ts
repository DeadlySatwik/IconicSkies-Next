import { and, eq } from "drizzle-orm";
import { emailVerificationRequiredResponse, isEmailVerified } from "@/lib/auth/email-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { skyMoments } from "@/lib/db/schema";
import { jsonError } from "@/lib/security/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to update a sky moment.", 401);
  if (!isEmailVerified(user)) return emailVerificationRequiredResponse("Verify your email to update a sky moment.");

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { note?: unknown } | null;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1200) : "";

  const [moment] = await getDb()
    .update(skyMoments)
    .set({ note, updatedAt: new Date() })
    .where(and(eq(skyMoments.id, id), eq(skyMoments.userId, user.id)))
    .returning();

  if (!moment) return jsonError("Sky moment not found.", 404);
  return Response.json({ ok: true, moment });
}
