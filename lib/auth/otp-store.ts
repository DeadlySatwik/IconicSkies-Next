import "server-only";

import { deleteCache, getJsonCache, setJsonCache } from "@/lib/cache/json-cache";
import type { OtpChannel, OtpPurpose } from "@/lib/security/validation";
import {
  deleteMemoryOtpChallenge,
  getMemoryOtpChallenge,
  storeMemoryOtpChallenge,
  updateMemoryOtpChallenge,
} from "./otp-memory-store";
import { getOtpStoreProvider } from "./otp-store-provider";

export type OtpChallengeRecord = {
  otpHash: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  identifierHash: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  resendAvailableAt: string;
  subjectUserId?: string | null;
};

export async function storeOtpChallenge(key: string, record: OtpChallengeRecord, ttlSeconds: number) {
  if (getOtpStoreProvider() === "memory") {
    return storeMemoryOtpChallenge(key, record);
  }

  return setJsonCache(key, record, ttlSeconds);
}

export async function getOtpChallenge(key: string) {
  if (getOtpStoreProvider() === "memory") {
    return getMemoryOtpChallenge(key);
  }

  const record = await getJsonCache<OtpChallengeRecord>(key);
  if (!record) return null;

  if (isChallengeExpired(record)) {
    await deleteCache(key);
    return null;
  }

  return record;
}

export async function deleteOtpChallenge(key: string) {
  if (getOtpStoreProvider() === "memory") {
    return deleteMemoryOtpChallenge(key);
  }

  return deleteCache(key);
}

export async function updateOtpChallenge(key: string, record: OtpChallengeRecord, ttlSeconds: number) {
  if (getOtpStoreProvider() === "memory") {
    return updateMemoryOtpChallenge(key, record);
  }

  return setJsonCache(key, record, ttlSeconds);
}

export function createOtpChallengeRecord(input: {
  otpHash: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  identifierHash: string;
  ttlSeconds: number;
  resendCooldownSeconds: number;
  subjectUserId?: string | null;
}): OtpChallengeRecord {
  const now = new Date();
  return {
    otpHash: input.otpHash,
    purpose: input.purpose,
    channel: input.channel,
    identifierHash: input.identifierHash,
    attempts: 0,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + input.ttlSeconds * 1000).toISOString(),
    resendAvailableAt: new Date(now.getTime() + input.resendCooldownSeconds * 1000).toISOString(),
    subjectUserId: input.subjectUserId ?? null,
  };
}

export function isChallengeExpired(record: Pick<OtpChallengeRecord, "expiresAt">) {
  return new Date(record.expiresAt).getTime() <= Date.now();
}

export function canResendChallenge(record: Pick<OtpChallengeRecord, "resendAvailableAt">) {
  return new Date(record.resendAvailableAt).getTime() <= Date.now();
}

export function hasExceededChallengeAttempts(record: Pick<OtpChallengeRecord, "attempts">, maxAttempts: number) {
  return record.attempts >= maxAttempts;
}
