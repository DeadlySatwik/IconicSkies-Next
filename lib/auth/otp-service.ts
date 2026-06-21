import "server-only";

import { timingSafeEqual } from "node:crypto";
import {
  buildOtpRedisKey,
  generateOtpCode,
  getOtpMaxVerifyAttempts,
  getOtpResendCooldownSeconds,
  getOtpTtlSeconds,
  hashOtpCode,
  hashOtpIdentifier,
  normalizeOtpIdentifier,
} from "./otp";
import {
  canResendChallenge,
  createOtpChallengeRecord,
  deleteOtpChallenge,
  getOtpChallenge,
  hasExceededChallengeAttempts,
  storeOtpChallenge,
  updateOtpChallenge,
  type OtpChallengeRecord,
} from "./otp-store";
import { deliverOtpCode } from "./otp-delivery";
import type { OtpChannel, OtpPurpose } from "@/lib/security/validation";

export type IssueOtpChallengeInput = {
  channel: OtpChannel;
  purpose: OtpPurpose;
  identifier: string;
  subjectUserId?: string | null;
  skipDeliveryIfCoolingDown?: boolean;
};

export type IssueOtpChallengeResult =
  | {
      ok: true;
      key: string;
      code: string;
      record: OtpChallengeRecord;
      delivery:
        | { ok: true; delivered: true; provider: "email" | "sms" }
        | { ok: true; delivered: false; provider: "email" | "sms"; reason: "not-configured" | "dev-logged" }
        | { ok: false; delivered: false; provider: "email" | "sms"; reason: string; status?: number };
      resendCoolingDown: boolean;
    }
  | { ok: false; reason: string; status?: number };

export async function issueOtpChallenge(input: IssueOtpChallengeInput): Promise<IssueOtpChallengeResult> {
  try {
    const identifier = normalizeOtpIdentifier(input.channel, input.identifier);
    const key = buildOtpRedisKey({
      channel: input.channel,
      purpose: input.purpose,
      identifier,
    });

    const existing = await getOtpChallenge(key);
    if (existing && !canResendChallenge(existing) && !input.skipDeliveryIfCoolingDown) {
      return {
        ok: true,
        key,
        code: "",
        record: existing,
        delivery: { ok: true, delivered: false, provider: input.channel, reason: "not-configured" },
        resendCoolingDown: true,
      };
    }

    const code = generateOtpCode();
    const identifierHash = hashOtpIdentifier(input.channel, identifier);
    const record = createOtpChallengeRecord({
      otpHash: hashOtpCode(input.channel, input.purpose, identifier, code),
      purpose: input.purpose,
      channel: input.channel,
      identifierHash,
      ttlSeconds: getOtpTtlSeconds(),
      resendCooldownSeconds: getOtpResendCooldownSeconds(),
      subjectUserId: input.subjectUserId ?? existing?.subjectUserId ?? null,
    });

    const stored = await storeOtpChallenge(key, record, getOtpTtlSeconds());
    if (!stored) {
      return { ok: false, reason: "Could not store OTP challenge." };
    }

    const delivery = await deliverOtpCode({
      channel: input.channel,
      identifier,
      code,
      purpose: input.purpose,
    });

    return {
      ok: true,
      key,
      code,
      record,
      delivery,
      resendCoolingDown: false,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "OTP challenge failed.",
    };
  }
}

export type VerifyOtpChallengeInput = {
  channel: OtpChannel;
  purpose: OtpPurpose;
  identifier: string;
  code: string;
  subjectUserId?: string | null;
};

export type VerifyOtpChallengeResult =
  | { ok: true; record: OtpChallengeRecord }
  | { ok: false; reason: "missing" | "expired" | "invalid" | "locked" | "mismatch"; status?: number };

export async function verifyOtpChallenge(input: VerifyOtpChallengeInput): Promise<VerifyOtpChallengeResult> {
  try {
    const normalizedIdentifier = normalizeOtpIdentifier(input.channel, input.identifier);
    const key = buildOtpRedisKey({
      channel: input.channel,
      purpose: input.purpose,
      identifier: normalizedIdentifier,
    });
    const record = await getOtpChallenge(key);
    if (!record) {
      return { ok: false, reason: "missing" };
    }

    if (input.subjectUserId && record.subjectUserId && input.subjectUserId !== record.subjectUserId) {
      return { ok: false, reason: "invalid" };
    }

    if (hasExceededChallengeAttempts(record, getOtpMaxVerifyAttempts())) {
      await deleteOtpChallenge(key);
      return { ok: false, reason: "locked" };
    }

    const expected = record.otpHash;
    const actual = hashOtpCode(input.channel, input.purpose, normalizedIdentifier, input.code);
    const expectedBuffer = Buffer.from(expected, "hex");
    const actualBuffer = Buffer.from(actual, "hex");

    const matches =
      expectedBuffer.length === actualBuffer.length &&
      timingSafeEqual(expectedBuffer, actualBuffer);

    if (!matches) {
      const updated = {
        ...record,
        attempts: record.attempts + 1,
      };
      if (hasExceededChallengeAttempts(updated, getOtpMaxVerifyAttempts())) {
        await deleteOtpChallenge(key);
        return { ok: false, reason: "locked" };
      }

      await updateOtpChallenge(key, updated, getOtpTtlSeconds());
      return { ok: false, reason: "mismatch" };
    }

    await deleteOtpChallenge(key);
    return { ok: true, record };
  } catch {
    return {
      ok: false,
      reason: "invalid",
    };
  }
}
