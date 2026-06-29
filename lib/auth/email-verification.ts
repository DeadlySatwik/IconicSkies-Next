import "server-only";

import { jsonError } from "@/lib/security/validation";

export const EMAIL_VERIFICATION_REQUIRED_CODE = "EMAIL_VERIFICATION_REQUIRED";

type UserWithVerification = {
  emailVerifiedAt?: Date | string | null;
};

export function isEmailVerified(user: UserWithVerification | null | undefined) {
  return Boolean(user?.emailVerifiedAt);
}

export function sanitizeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.startsWith("/api/")) return fallback;
  return next;
}

export function buildVerifyEmailHref(next?: string | null) {
  const safeNext = sanitizeNextPath(next, "/dashboard");
  const search = new URLSearchParams({ next: safeNext });
  return `/verify-email?${search.toString()}`;
}

export function getPostAuthRedirectPath(user: UserWithVerification | null | undefined, next?: string | null) {
  const safeNext = sanitizeNextPath(next, "/dashboard");
  if (!isEmailVerified(user)) {
    return buildVerifyEmailHref(safeNext);
  }

  return safeNext;
}

export function emailVerificationRequiredResponse(message = "Verify your email to continue.") {
  return jsonError(message, 403, EMAIL_VERIFICATION_REQUIRED_CODE);
}
