import { z } from "zod";
import { journalEnhancementStyles, type JournalEnhancementStyle } from "./journal-styles";

export const journalInsightStyleSchema = z.enum(journalEnhancementStyles).optional();

export const journalInsightRequestSchema = z.object({
  note: z.string().trim().min(1).max(1200),
  style: journalInsightStyleSchema,
  city: z.string().trim().min(1).max(160),
  condition: z.string().trim().min(1).max(120),
  temperature: z.number().finite().min(-100).max(200),
  units: z.enum(["metric", "imperial"]),
  capturedAt: z.string().trim().min(1).max(64),
  favoriteLabel: z.string().trim().max(120).optional().nullable(),
  hasPhoto: z.boolean().optional().default(false),
});

export const journalInsightResponseSchema = z.object({
  title: z.string().trim().min(3).max(80),
  moodTags: z.array(z.string().trim().min(1).max(24)).min(1).max(5),
});

const genericMoodTags = new Set([
  "calm",
  "calmer",
  "calmness",
  "focused",
  "focus",
  "rainy",
  "rain",
  "rains",
  "rain-washed",
  "cloudy",
  "misty",
  "foggy",
  "stormy",
  "sunny",
  "warm",
  "cool",
  "cooler",
  "humid",
  "cozy",
  "peaceful",
  "reflective",
  "nostalgic",
  "growth",
  "study",
  "studying",
  "learning",
  "practice",
  "travel",
  "night",
  "sunrise",
  "sunset",
  "monsoon",
  "breezy",
  "breeze",
  "quiet",
  "productive",
  "work",
  "coding",
  "developer",
  "development",
  "dsa",
]);

const activityTags = new Set([
  "dsa",
  "algorithm",
  "algorithms",
  "algorithmic",
  "coding",
  "code",
  "dev",
  "development",
  "developer",
  "programming",
  "skills",
  "skill",
  "practice",
  "study",
  "studying",
  "grinding",
  "grind",
  "learning",
  "college",
  "campus",
  "hostel",
  "dorm",
  "train",
  "commute",
  "exam",
  "work",
  "travel",
  "trip",
]);

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeMoodTag(tag: string) {
  return normalizeText(tag.toLowerCase())
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

export function normalizeMoodTags(tags: unknown) {
  if (!Array.isArray(tags)) return [];

  const normalized: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const value = normalizeMoodTag(tag);
    if (!value) continue;
    if (!normalized.includes(value)) normalized.push(value);
    if (normalized.length >= 5) break;
  }

  return normalized;
}

export function moodTagsReflectMeaning(tags: string[]) {
  return tags.some((tag) => activityTags.has(tag) || genericMoodTags.has(tag));
}

export function normalizeJournalInsightTitle(title: string) {
  return normalizeText(title)
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim()
    .slice(0, 80);
}

export function isAcceptableJournalInsightTitle(title: string) {
  const cleaned = normalizeJournalInsightTitle(title);
  if (cleaned.length < 3) return false;
  if (/[,:;—-]$/.test(cleaned)) return false;
  return true;
}

export function isAcceptableMoodTags(tags: string[], originalNote: string) {
  if (tags.length < 1 || tags.length > 5) return false;
  if (tags.some((tag) => tag.length === 0 || tag.length > 24)) return false;
  if (!moodTagsReflectMeaning(tags)) return false;

  const originalLower = originalNote.toLowerCase();
  if (originalLower.includes("dsa")) {
    return moodTagsReflectMeaning(tags);
  }

  return true;
}

export function buildJournalInsightSystemInstruction(style?: JournalEnhancementStyle) {
  return [
    "You are a concise personal journal editor for a weather memory app.",
    "Your job is to suggest a short title and mood tags while preserving the user's original meaning, concrete activity, and weather mood.",
    "Do not invent new facts.",
    "Do not remove important activity or context terms.",
    "Do not produce markdown.",
    "Return strict JSON only, with exactly two keys: title and moodTags.",
    "title must be one short sentence fragment or title case phrase, not a full note.",
    "moodTags must be an array of 1 to 5 lowercase tags or short phrases.",
    "Keep the output compact and user-friendly.",
    "Prefer titles that feel clear and poetic, not generic.",
    "Example JSON: {\"title\":\"Rain Before the Grind\",\"moodTags\":[\"focused\",\"rainy\",\"calm\",\"growth\"]}",
    "If the note mentions DSA, coding, dev skills, or another concrete activity, preserve that activity in the title or tags instead of turning everything into weather-only language.",
    style ? `Style context: ${style}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildJournalInsightPrompt(input: {
  note: string;
  style?: JournalEnhancementStyle | null;
  city: string;
  condition: string;
  temperature: string;
  units: "metric" | "imperial";
  capturedAt: string;
  favoriteLabel?: string | null;
  hasPhoto?: boolean;
}) {
  return JSON.stringify(
    {
      originalNote: input.note,
      selectedStyle: input.style ?? null,
      city: input.city,
      condition: input.condition,
      temperature: input.temperature,
      units: input.units,
      capturedAt: input.capturedAt,
      favoriteLabel: input.favoriteLabel?.trim() || null,
      hasPhoto: Boolean(input.hasPhoto),
    },
    null,
    2,
  );
}
