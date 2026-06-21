import "server-only";

import { createHash } from "node:crypto";
import type { MonthlyRecapMoment } from "@/lib/sky/monthly-recap";

export function buildMonthlyRecapJournalVersion(moments: MonthlyRecapMoment[]) {
  const stablePayload = moments
    .slice()
    .sort((a, b) => {
      const timeDiff = toStableMillis(a.capturedAt) - toStableMillis(b.capturedAt);
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    })
    .map((moment) => [
      moment.id,
      toStableIso(moment.updatedAt ?? moment.capturedAt),
      toStableIso(moment.capturedAt),
      stableText(moment.cityName),
      stableText(moment.country),
      stableText(moment.condition),
      String(moment.temperature),
      stableText(moment.units),
      stableText(moment.title),
      stableText(moment.note),
      Array.isArray(moment.moodTags)
        ? moment.moodTags.map(stableText).filter(Boolean).sort().join(",")
        : "",
      moment.photoId ? "has-photo" : "no-photo",
      stableText(moment.favoriteLabel),
    ].join("|"))
    .join("\n");

  return createHash("sha256").update(stablePayload).digest("hex").slice(0, 16);
}

function toStableIso(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toStableMillis(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function stableText(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}
