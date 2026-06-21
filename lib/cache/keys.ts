import "server-only";

import { createHash } from "node:crypto";
import { slugifyCity } from "@/lib/utils";

const CACHE_VERSION = "v1";

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function hashCacheToken(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function normalizeVersionToken(value: string) {
  const token = value.trim().toLowerCase();
  return /^[a-f0-9]{16}$/.test(token) ? token : hashCacheToken(token);
}

export function monthlyRecapCacheKey(userId: string, month: string, journalVersion: string) {
  return [
    "ai",
    "monthly-recap",
    CACHE_VERSION,
    normalizeToken(userId),
    normalizeToken(month),
    normalizeVersionToken(journalVersion),
  ].join(":");
}

export function weatherCityCacheKey(cityName: string, country: string | null, units: string) {
  return [
    "weather",
    "city",
    CACHE_VERSION,
    slugifyCity(cityName),
    country ? slugifyCity(country) : "none",
    normalizeToken(units),
  ].join(":");
}

export function weatherCoordsCacheKey(latitude: number, longitude: number, units: string) {
  const roundedLat = Number(latitude.toFixed(3));
  const roundedLon = Number(longitude.toFixed(3));
  return [
    "weather",
    "coords",
    CACHE_VERSION,
    String(roundedLat),
    String(roundedLon),
    normalizeToken(units),
  ].join(":");
}

export function aiRateLimitKey(scope: string, identifier: string) {
  return ["rate", scope, CACHE_VERSION, hashCacheToken(identifier)].join(":");
}
