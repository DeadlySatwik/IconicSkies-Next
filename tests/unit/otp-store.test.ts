import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  deleteMemoryOtpChallenge,
  getMemoryOtpChallenge,
  storeMemoryOtpChallenge,
  updateMemoryOtpChallenge,
} from "@/lib/auth/otp-memory-store";
import { getOtpStoreProvider } from "@/lib/auth/otp-store-provider";

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalProvider = process.env.OTP_STORE_PROVIDER;

type OtpRecord = {
  otpHash: string;
  purpose: "register" | "login" | "verify-contact";
  channel: "email" | "sms";
  identifierHash: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  resendAvailableAt: string;
  subjectUserId?: string | null;
};

function createRecord(overrides: Partial<OtpRecord> = {}): OtpRecord {
  return {
    otpHash: "hmac-digest-only",
    purpose: "register",
    channel: "email",
    identifierHash: "hashed-identifier",
    attempts: 0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 240_000).toISOString(),
    resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
    subjectUserId: null,
    ...overrides,
  };
}

afterEach(() => {
  if (originalNodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = originalNodeEnv;

  if (originalProvider === undefined) delete env.OTP_STORE_PROVIDER;
  else env.OTP_STORE_PROVIDER = originalProvider;
});

test("memory OTP store preserves hashed records and consumes on delete", () => {
  const key = `unit:otp:${Date.now()}:roundtrip`;
  const record = createRecord();

  assert.equal(storeMemoryOtpChallenge(key, record), true);
  assert.deepEqual(getMemoryOtpChallenge(key), record);
  assert.equal(getMemoryOtpChallenge(key)?.otpHash, "hmac-digest-only");
  assert.equal(deleteMemoryOtpChallenge(key), true);
  assert.equal(getMemoryOtpChallenge(key), null);
});

test("memory OTP store expires records from their stored TTL timestamp", async () => {
  const key = `unit:otp:${Date.now()}:expiry`;
  const record = createRecord({
    expiresAt: new Date(Date.now() + 10).toISOString(),
    resendAvailableAt: new Date().toISOString(),
  });

  storeMemoryOtpChallenge(key, record);
  await new Promise((resolve) => setTimeout(resolve, 25));

  assert.equal(getMemoryOtpChallenge(key), null);
});

test("memory OTP store supports attempt updates and resend cooldown metadata", () => {
  const key = `unit:otp:${Date.now()}:attempts`;
  const record = createRecord();

  storeMemoryOtpChallenge(key, record);
  const updated = { ...record, attempts: 5 };
  assert.equal(updateMemoryOtpChallenge(key, updated), true);
  assert.equal(getMemoryOtpChallenge(key)?.attempts, 5);
  assert.equal(new Date(record.resendAvailableAt).getTime() > Date.now(), true);
});

test("memory OTP storage is rejected in production", () => {
  env.NODE_ENV = "production";
  env.OTP_STORE_PROVIDER = "memory";

  assert.throws(
    () => getOtpStoreProvider(),
    /not allowed in production/i,
  );
});
