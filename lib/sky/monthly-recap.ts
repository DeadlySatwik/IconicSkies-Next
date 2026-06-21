import { formatTemperature } from "@/lib/utils";

export type MonthlyRecapMoment = {
  id: string;
  cityName: string;
  country: string | null;
  condition: string;
  temperature: number;
  units: "metric" | "imperial" | string;
  note: string | null;
  title?: string | null;
  moodTags?: string[] | null;
  capturedAt: Date | string;
  photoId?: string | null;
  favoriteLabel?: string | null;
};

export type MonthlyRecapSummary = {
  monthKey: string;
  monthLabel: string;
  momentCount: number;
  photoCount: number;
  topCities: Array<{ name: string; count: number }>;
  topConditions: Array<{ name: string; count: number }>;
  dominantMoods: Array<{ name: string; count: number }>;
  noteExcerpts: string[];
};

export type MonthlyTimelineGroup<T extends Pick<MonthlyRecapMoment, "capturedAt"> = MonthlyRecapMoment> = {
  monthKey: string;
  monthLabel: string;
  momentCount: number;
  moments: T[];
};

function normalizeMonthKey(monthKey?: string | null) {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  return new Date().toISOString().slice(0, 7);
}

export function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function getMonthLabel(monthKey?: string | null) {
  const resolved = normalizeMonthKey(monthKey);
  const [year, month] = resolved.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function shiftMonthKey(monthKey: string, offset: number) {
  const resolved = normalizeMonthKey(monthKey);
  const [year, month] = resolved.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function isMomentInMonth(capturedAt: Date | string, monthKey: string) {
  const resolved = normalizeMonthKey(monthKey);
  const date = capturedAt instanceof Date ? capturedAt : new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 7) === resolved;
}

export function filterMomentsForMonth<T extends Pick<MonthlyRecapMoment, "capturedAt">>(
  moments: T[],
  monthKey?: string | null,
) {
  const resolved = normalizeMonthKey(monthKey);
  return moments.filter((moment) => isMomentInMonth(moment.capturedAt, resolved));
}

function monthKeyForMoment(capturedAt: Date | string) {
  const date = capturedAt instanceof Date ? capturedAt : new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 7);
}

export function groupMomentsByMonth<T extends Pick<MonthlyRecapMoment, "capturedAt">>(moments: T[]) {
  const groups = new Map<string, T[]>();

  for (const moment of moments) {
    const monthKey = monthKeyForMoment(moment.capturedAt);
    if (!monthKey) continue;
    const current = groups.get(monthKey) ?? [];
    current.push(moment);
    groups.set(monthKey, current);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthMoments]) => ({
      monthKey,
      monthLabel: getMonthLabel(monthKey),
      momentCount: monthMoments.length,
      moments: monthMoments.sort((a, b) => {
        const aTime = a.capturedAt instanceof Date ? a.capturedAt.getTime() : new Date(a.capturedAt).getTime();
        const bTime = b.capturedAt instanceof Date ? b.capturedAt.getTime() : new Date(b.capturedAt).getTime();
        return bTime - aTime;
      }),
    })) satisfies MonthlyTimelineGroup<T>[];
}

function formatCity(moment: Pick<MonthlyRecapMoment, "cityName" | "country">) {
  return moment.country ? `${moment.cityName}, ${moment.country}` : moment.cityName;
}

function addCount(
  counts: Map<string, number>,
  key: string,
) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function topEntries(counts: Map<string, number>, limit: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function summarizeMonthlyMoments(
  moments: MonthlyRecapMoment[],
  monthKey?: string | null,
): MonthlyRecapSummary {
  const resolvedMonthKey = normalizeMonthKey(monthKey);
  const monthLabel = getMonthLabel(resolvedMonthKey);
  const cityCounts = new Map<string, number>();
  const conditionCounts = new Map<string, number>();
  const moodCounts = new Map<string, number>();
  const noteExcerpts: string[] = [];
  let photoCount = 0;

  for (const moment of moments) {
    addCount(cityCounts, formatCity(moment));
    addCount(conditionCounts, moment.condition);

    if (moment.photoId) photoCount += 1;

    if (moment.note?.trim()) {
      const excerpt = moment.note.trim().replace(/\s+/g, " ");
      noteExcerpts.push(excerpt.length > 160 ? `${excerpt.slice(0, 160)}...` : excerpt);
    }

    for (const mood of moment.moodTags ?? []) {
      if (!mood) continue;
      addCount(moodCounts, mood.toLowerCase());
    }
  }

  return {
    monthKey: resolvedMonthKey,
    monthLabel,
    momentCount: moments.length,
    photoCount,
    topCities: topEntries(cityCounts, 3),
    topConditions: topEntries(conditionCounts, 4),
    dominantMoods: topEntries(moodCounts, 4),
    noteExcerpts: noteExcerpts.slice(0, 5),
  };
}

export function formatMonthlyRecapTemperature(
  temperature: number,
  units: MonthlyRecapMoment["units"],
) {
  return formatTemperature(temperature, units === "imperial" ? "imperial" : "metric");
}

export function buildMonthlyRecapRequestMoments(
  moments: MonthlyRecapMoment[],
  monthKey?: string | null,
) {
  return filterMomentsForMonth(moments, monthKey)
    .slice(0, 20)
    .map((moment) => ({
      city: formatCity(moment),
      condition: moment.condition,
      temperature: formatMonthlyRecapTemperature(moment.temperature, moment.units),
      capturedAt: moment.capturedAt instanceof Date ? moment.capturedAt.toISOString() : moment.capturedAt,
      title: moment.title?.trim() || null,
      moodTags: (moment.moodTags ?? []).slice(0, 5),
      noteExcerpt: moment.note?.trim()
        ? moment.note.trim().replace(/\s+/g, " ").slice(0, 160)
        : null,
      hasPhoto: Boolean(moment.photoId),
      favoriteLabel: moment.favoriteLabel?.trim() || null,
    }));
}
