export function slugifyCity(city: string) {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function unslugifyCity(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ").trim();
}

export function formatTemperature(value: number, units: "metric" | "imperial") {
  return `${Math.round(value)}°${units === "imperial" ? "F" : "C"}`;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}
