import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { aiRateLimitKey } from "./keys";
import { getRedisClient } from "./redis";

type RatelimitDuration = Parameters<typeof Ratelimit.slidingWindow>[1];

type RateLimitResult = {
  allowed: boolean;
  skipped: boolean;
  limit: number | null;
  remaining: number | null;
  reset: number | null;
};

const limiterCache = new Map<string, Ratelimit>();

function limiterCacheKey(scope: string, limit: number, duration: RatelimitDuration) {
  return [scope, limit, String(duration)].join(":");
}

function getLimiter(scope: string, limit: number, duration: RatelimitDuration) {
  const cacheKey = limiterCacheKey(scope, limit, duration);
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const redis = getRedisClient();
  if (!redis) return null;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, duration),
    prefix: scope,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export async function checkOptionalRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  duration: RatelimitDuration;
}): Promise<RateLimitResult> {
  const limiter = getLimiter(input.scope, input.limit, input.duration);
  if (!limiter) {
    return {
      allowed: true,
      skipped: true,
      limit: null,
      remaining: null,
      reset: null,
    };
  }

  try {
    const result = await limiter.limit(aiRateLimitKey(input.scope, input.identifier));
    return {
      allowed: result.success,
      skipped: false,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    return {
      allowed: true,
      skipped: true,
      limit: null,
      remaining: null,
      reset: null,
    };
  }
}
