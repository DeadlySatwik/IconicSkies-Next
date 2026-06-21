import "server-only";

import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

function hasRedisEnv() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

export function isRedisConfigured() {
  return hasRedisEnv();
}

export function getRedisClient() {
  if (!hasRedisEnv()) return null;

  if (redisClient === undefined) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
    });
  }

  return redisClient;
}
