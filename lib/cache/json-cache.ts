import "server-only";

import { getRedisClient } from "./redis";

export async function getJsonCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get<unknown>(key);
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      return JSON.parse(trimmed) as T;
    }
    if (typeof value === "object") {
      return value as T;
    }
    return value as T;
  } catch (error) {
    console.warn("[cache] get failed", {
      key,
      error: getSafeErrorMessage(error),
    });
    return null;
  }
}

export async function setJsonCache<T>(key: string, value: T, ttlSeconds: number) {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.warn("[cache] set failed", {
      key,
      error: getSafeErrorMessage(error),
    });
    return false;
  }
}

export async function deleteCache(key: string) {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch {
    return false;
  }
}

export async function getOrSetJsonCache<T>(key: string, ttlSeconds: number, getter: () => Promise<T>) {
  const cached = await getJsonCache<T>(key);
  if (cached !== null) return cached;

  const value = await getter();
  await setJsonCache(key, value, ttlSeconds);
  return value;
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown cache error";
}
