import type { OtpChallengeRecord } from "./otp-store";

type OtpMemoryStore = Map<string, OtpChallengeRecord>;

const memoryStoreKey = Symbol.for("iconicskies.otp.memory-store");

function getMemoryStore(): OtpMemoryStore {
  const globalState = globalThis as typeof globalThis & {
    [memoryStoreKey]?: OtpMemoryStore;
  };

  if (!globalState[memoryStoreKey]) {
    globalState[memoryStoreKey] = new Map();
  }

  return globalState[memoryStoreKey]!;
}

function isExpired(record: Pick<OtpChallengeRecord, "expiresAt">) {
  return new Date(record.expiresAt).getTime() <= Date.now();
}

function cloneRecord(record: OtpChallengeRecord) {
  return { ...record };
}

export function storeMemoryOtpChallenge(key: string, record: OtpChallengeRecord) {
  getMemoryStore().set(key, cloneRecord(record));
  return true;
}

export function getMemoryOtpChallenge(key: string) {
  const store = getMemoryStore();
  const record = store.get(key);
  if (!record) return null;

  if (isExpired(record)) {
    store.delete(key);
    return null;
  }

  return cloneRecord(record);
}

export function deleteMemoryOtpChallenge(key: string) {
  return getMemoryStore().delete(key);
}

export function updateMemoryOtpChallenge(key: string, record: OtpChallengeRecord) {
  if (!getMemoryOtpChallenge(key)) return false;
  getMemoryStore().set(key, cloneRecord(record));
  return true;
}
