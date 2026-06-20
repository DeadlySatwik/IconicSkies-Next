import { z } from "zod";
import { journalEnhancementStyles, type JournalEnhancementStyle } from "./journal-styles";

export const journalEnhancementStyleSchema = z.enum(journalEnhancementStyles);

export type JournalEnhancementInput = {
  note: string;
  style: JournalEnhancementStyle;
  city: string;
  condition: string;
  temperature: string;
  units: "metric" | "imperial";
  capturedAt: string;
  favoriteLabel?: string | null;
  hasPhoto?: boolean;
};

const genericWeatherWords = new Set([
  "weather",
  "cool",
  "rain",
  "rains",
  "raining",
  "rainy",
  "rainfall",
  "breeze",
  "breezes",
  "wind",
  "winds",
  "night",
  "evening",
  "morning",
  "afternoon",
  "sky",
  "cloud",
  "clouds",
  "cloudy",
  "sunny",
  "storm",
  "fog",
  "mist",
  "heat",
  "humid",
  "soothing",
  "calm",
  "air",
]);

const fillerWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "my",
  "your",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "was",
  "were",
  "is",
  "are",
  "be",
  "been",
  "being",
  "felt",
  "feel",
  "feels",
  "like",
  "as",
  "at",
  "by",
  "it",
  "from",
  "into",
  "through",
  "over",
  "under",
  "before",
  "after",
  "during",
  "still",
  "very",
  "too",
  "more",
  "most",
  "just",
  "only",
  "tonight",
  "today",
  "tomorrow",
  "yesterday",
]);

const synonymGroups = [
  ["dsa", "algorithm", "algorithms", "algorithmic", "coding", "code", "dev", "development", "developer", "programming", "skills", "skill", "practice", "study", "studying", "grinding", "grind", "learning"],
  ["college", "campus", "class", "classes", "semester"],
  ["hostel", "dorm", "room"],
  ["exam", "exams", "test", "tests", "revision"],
  ["train", "station", "platform", "commute", "journey"],
  ["work", "office", "job", "shift"],
  ["travel", "trip", "road", "journey"],
];

const styleGuidance: Record<JournalEnhancementStyle, string> = {
  Aesthetic:
    "Use soft, modern, emotionally polished language. Preserve the real activity. Example: Lost in algorithms and ambition, while cool rain-kissed breezes turn the evening into a quiet space for growth.",
  Formal:
    "Clear, professional, composed. Example: Spent the evening strengthening DSA fundamentals and development skills, accompanied by the calm and refreshing atmosphere of rainfall.",
  Classic:
    "Timeless, literary, restrained. Example: With rain drifting through the evening air, I devoted the hours to sharpening my understanding of algorithms and software development.",
  Poetic:
    "Imagery-rich but still grounded in the original activity. Example: As gentle monsoon winds whispered through the night, I wandered through mazes of logic, shaping skill from every challenge solved.",
  Minimal:
    "Short, punchy, no extra explanation. Example: Rain outside. DSA on screen. Progress in motion.",
  Nostalgic:
    "Warm, reflective, memory-like. Example: The scent of rain, a glowing screen, and another evening spent learning, one of those moments I will look back on fondly.",
  "Travel diary":
    "Observational, place-and-moment oriented. Example: The rainy evening brought cool breezes and a peaceful backdrop for a journey through algorithms, code, and continuous learning.",
  "Weather report":
    "Weather-aware but still personal. Example: Heavy rain and cool winds created the perfect setting for an evening of DSA practice and developer skill-building.",
};

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeToken(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function extractImportantNoteKeywords(note: string) {
  const words = note
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  const unique = new Set<string>();
  for (const word of words) {
    if (word.length <= 2) continue;
    if (fillerWords.has(word)) continue;
    if (genericWeatherWords.has(word)) continue;
    unique.add(word);
  }

  return [...unique];
}

function containsSynonymGroup(originalKeywords: string[], enhancedText: string) {
  const normalizedEnhanced = enhancedText.toLowerCase();

  return synonymGroups.some((group) => {
    const originalHasGroup = originalKeywords.some((keyword) => group.includes(keyword));
    if (!originalHasGroup) return false;
    return group.some((keyword) => normalizedEnhanced.includes(keyword));
  });
}

export function notePreservesImportantKeywords(originalNote: string, enhancedNote: string) {
  const importantKeywords = extractImportantNoteKeywords(originalNote);
  if (importantKeywords.length === 0) return true;

  const normalizedEnhanced = enhancedNote.toLowerCase();
  if (containsSynonymGroup(importantKeywords, normalizedEnhanced)) return true;

  return importantKeywords.some((keyword) => normalizedEnhanced.includes(keyword));
}

export function buildJournalEnhancementSystemInstruction(style: JournalEnhancementStyle) {
  return [
    "You are a concise personal journal editor for a weather memory app.",
    "Your job is to polish the user's note while preserving the original meaning, concrete activity, and weather mood.",
    "Do not invent new facts.",
    "Do not remove important activity or context terms.",
    "Do not produce a fragment.",
    "Return only one enhanced note, no label, no markdown, no explanation.",
    "",
    "Hard rules:",
    "- Preserve the main non-weather activity or context from the original note.",
    "- Preserve important terms like DSA, coding, dev skills, college, hostel, train, exam, work, and travel when present.",
    "- Preserve the weather mood when present, such as rain, cool breeze, storm, fog, heat, sunset, or night.",
    "- Fix spelling and grammar naturally.",
    "- Output 1 complete sentence for Minimal.",
    "- Output 1 to 2 complete sentences for every other style.",
    "- Keep under 55 words.",
    "- Do not end with a comma, colon, semicolon, dash, or unfinished phrase.",
    "- For technical terms like DSA, keep the term exactly when it appears.",
    "",
    "Style guidance:",
    styleGuidance[style],
    "Use the example as style guidance, not as an exact output unless the input is nearly identical.",
  ].join("\n");
}

export function buildJournalEnhancementPrompt(input: JournalEnhancementInput) {
  return JSON.stringify(
    {
      originalNote: input.note,
      selectedStyle: input.style,
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

export function normalizeEnhancedJournalNote(text: string) {
  const cleaned = text
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();

  return cleaned.replace(/\n{3,}/g, "\n\n");
}

export function isWeakEnhancedJournalNote(note: string, originalNote?: string) {
  const cleaned = note.trim();
  if (!cleaned) {
    return { weak: true, reason: "empty output" as const };
  }

  if (countWords(cleaned) < 4) {
    return { weak: true, reason: "too short" as const };
  }

  if (/[,:;—-]$/.test(cleaned)) {
    return { weak: true, reason: "ends with punctuation fragment" as const };
  }

  if (/(\b(?:and|or|but|with|to|for|of|in|on)\b)$/i.test(cleaned)) {
    return { weak: true, reason: "ends with unfinished phrase" as const };
  }

  if (originalNote && !notePreservesImportantKeywords(originalNote, cleaned)) {
    return { weak: true, reason: "missing meaningful context" as const };
  }

  return { weak: false as const, reason: null };
}
