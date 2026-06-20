export const journalEnhancementStyles = [
  "Aesthetic",
  "Formal",
  "Classic",
  "Poetic",
  "Minimal",
  "Nostalgic",
  "Travel diary",
  "Weather report",
] as const;

export type JournalEnhancementStyle = (typeof journalEnhancementStyles)[number];
