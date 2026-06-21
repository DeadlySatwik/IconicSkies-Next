import { z } from "zod";

export const monthlyRecapRequestSchema = z.object({
  month: z.string().trim().regex(/^\d{4}-\d{2}$/).optional(),
});

function normalizeStringList(input: unknown) {
  if (Array.isArray(input)) {
    return input.filter((value): value is string => typeof value === "string");
  }

  if (typeof input === "string") {
    return input
      .split(/(?:\r?\n|,|;|•|\u2022)/g)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

const recapStringListSchema = z.preprocess(normalizeStringList, z.array(z.string().trim().min(2).max(80)).min(1).max(5));
const recapMoodListSchema = z.preprocess(normalizeStringList, z.array(z.string().trim().min(1).max(24)).min(1).max(5));

export const monthlyRecapResponseSchema = z.object({
  headline: z.string().trim().min(3).max(120),
  recap: z.string().trim().min(20).max(600),
  highlights: recapStringListSchema,
  dominantMoods: recapMoodListSchema,
});

export function buildMonthlyRecapSystemInstruction() {
  return [
    "You are a concise monthly sky journal editor.",
    "Write a grounded recap from the provided moments only.",
    "Do not invent facts, dates, cities, or weather details.",
    "Do not mention any private photo URLs or private data.",
    "Return JSON only with exactly four keys: headline, recap, highlights, dominantMoods.",
    "headline should be short and clear.",
    "recap should be 2 to 4 sentences and under about 120 words.",
    "highlights must be an array of 1 to 5 short phrases.",
    "dominantMoods must be an array of 1 to 5 lowercase tags or short phrases.",
    "Do not include newlines inside string values.",
    "Keep the recap specific to the recurring places, weather moods, and activities in the moments.",
    "Do not collapse everything into generic weather prose.",
    "Do not include markdown or explanation.",
    "Example JSON:",
    "{",
    '  "headline": "June was a month of rain and focus",',
    '  "recap": "A concise two-sentence summary of the month.",',
    '  "highlights": ["Rainy study evenings", "Alipurduar appeared most often"],',
    '  "dominantMoods": ["rainy", "focused", "calm"]',
    "}",
  ].join("\n");
}

export function buildMonthlyRecapPrompt(input: {
  monthLabel: string;
  moments: Array<{
    city: string;
    condition: string;
    temperature: string;
    capturedAt: string;
    title: string | null;
    moodTags: string[];
    noteExcerpt: string | null;
    hasPhoto: boolean;
    favoriteLabel: string | null;
  }>;
}) {
  return JSON.stringify(
    {
      month: input.monthLabel,
      moments: input.moments,
      instruction:
        "Summarize the month using only the provided moments. Highlight repeated cities, conditions, moods, and the user's recurring activities or memories. If titles or mood tags help, weave them into the recap naturally. Keep it warm, calm, and journal-like.",
    },
    null,
    2,
  );
}
