export type CurrentLocationResolution = {
  displayName: string;
  resolvedName: string;
  confidence: "high" | "medium" | "low";
  country: string | null;
  region: string | null;
};
