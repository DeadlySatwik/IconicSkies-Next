import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq, gt, and } from "drizzle-orm";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import {
  createFallbackSession,
  destroyFallbackSession,
  findFallbackSessionByToken,
  findFallbackUserById,
  hasFallbackUser,
} from "@/lib/dev/fallback-store";

export const SESSION_COOKIE = "iconicskies_session";
const SESSION_DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  if (hasFallbackUser(userId)) return createFallbackSession(userId);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  try {
    await getDb().insert(sessions).values({
      userId,
      tokenHash,
      expiresAt,
    });
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return createFallbackSession(userId);
  }

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  try {
    const rows = await getDb()
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        phoneNumber: users.phoneNumber,
        phoneVerifiedAt: users.phoneVerifiedAt,
        otpRequired: users.otpRequired,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (rows[0]) return rows[0];

    const fallbackSession = findFallbackSessionByToken(token);
    if (!fallbackSession) return null;
    const fallbackUser = findFallbackUserById(fallbackSession.userId);
    if (!fallbackUser) return null;

    return {
      id: fallbackUser.id,
      email: fallbackUser.email,
      name: fallbackUser.name,
      role: fallbackUser.role,
      emailVerifiedAt: fallbackUser.emailVerifiedAt,
      phoneNumber: fallbackUser.phoneNumber,
      phoneVerifiedAt: fallbackUser.phoneVerifiedAt,
      otpRequired: fallbackUser.otpRequired,
      expiresAt: fallbackSession.expiresAt,
    };
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    const session = findFallbackSessionByToken(token);
    if (!session) return null;
    const user = findFallbackUserById(session.userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneNumber: user.phoneNumber,
      phoneVerifiedAt: user.phoneVerifiedAt,
      otpRequired: user.otpRequired,
      expiresAt: session.expiresAt,
    };
  }
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  try {
    await getDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    destroyFallbackSession(token);
  }
  await clearSessionCookie();
}
