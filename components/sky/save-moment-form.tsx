"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { journalEnhancementStyles, type JournalEnhancementStyle } from "@/lib/ai/journal-styles";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxUploadSizeBytes = 8 * 1024 * 1024;

function toDateTimeLocalValue(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number: number) => String(number).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-")
    .concat("T")
    .concat([pad(date.getHours()), pad(date.getMinutes())].join(":"));
}

function parseDateTimeLocalValue(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocationLabel(location: {
  name: string;
  country: string | null;
}) {
  return location.country ? `${location.name}, ${location.country}` : location.name;
}

function formatHumanDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SaveMomentForm({
  cityId,
  weatherSnapshotId,
  gcsEnabled,
  signedIn,
  emailVerified = true,
  aiEnabled,
  cityName,
  cityCountry = null,
  cityRegion = null,
  cityLatitude = null,
  cityLongitude = null,
  condition,
  temperature,
  units,
  capturedAt,
  favoriteLabel = null,
  verifyEmailHref = "/verify-email?next=/dashboard",
  variant = "default",
}: {
  cityId: string;
  weatherSnapshotId: string;
  gcsEnabled: boolean;
  signedIn: boolean;
  emailVerified?: boolean;
  aiEnabled?: boolean;
  cityName: string;
  cityCountry?: string | null;
  cityRegion?: string | null;
  cityLatitude?: number | null;
  cityLongitude?: number | null;
  condition: string;
  temperature: number;
  units: "metric" | "imperial";
  capturedAt: string;
  favoriteLabel?: string | null;
  verifyEmailHref?: string;
  variant?: "default" | "cinematic";
}) {
  const [note, setNote] = useState("");
  const [attachMockPhoto, setAttachMockPhoto] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [moodTagsInput, setMoodTagsInput] = useState("");
  const [aiStyle, setAiStyle] = useState<JournalEnhancementStyle>("Aesthetic");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [insightStatus, setInsightStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [insightError, setInsightError] = useState("");
  const [insightMessage, setInsightMessage] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggestedMoodTags, setSuggestedMoodTags] = useState<string[]>([]);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [timePlaceOpen, setTimePlaceOpen] = useState(false);
  const [usePastTime, setUsePastTime] = useState(false);
  const [capturedAtInput, setCapturedAtInput] = useState(() => toDateTimeLocalValue(capturedAt));
  const [locationQuery, setLocationQuery] = useState(cityName);
  const [selectedLocation, setSelectedLocation] = useState({
    name: cityName,
    country: cityCountry,
    region: cityRegion,
    latitude: cityLatitude,
    longitude: cityLongitude,
  });
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [locationError, setLocationError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const router = useRouter();
  const cinematic = variant === "cinematic";
  const aiConfigured = Boolean(aiEnabled);
  const currentMoodTags = parseMoodTagsInput(moodTagsInput);
  const selectedCapturedDate = usePastTime ? parseDateTimeLocalValue(capturedAtInput) : new Date(capturedAt);
  const selectedLocationLabel = formatLocationLabel(selectedLocation);
  const momentTimeSummary = usePastTime
    ? `${selectedCapturedDate ? formatHumanDateTime(selectedCapturedDate) : "Backdated moment"} · ${selectedLocationLabel}`
    : `Now · ${selectedLocationLabel}`;
  const sectionClass = cinematic
    ? "rounded-2xl border border-skyInk/10 bg-[#eef4f1] p-6 text-skyInk shadow-[0_22px_70px_rgba(0,0,0,0.18)] sm:p-7"
    : "rounded-xl border border-skyInk/10 bg-cloud p-6 shadow-soft";
  const primaryButtonClass = cinematic
    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-skyInk px-5 font-semibold text-cloud transition hover:bg-night focus:outline-none focus:ring-2 focus:ring-horizon/50 disabled:cursor-not-allowed disabled:opacity-70"
    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-skyInk px-5 font-semibold text-cloud hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain disabled:cursor-not-allowed disabled:opacity-70";
  const inputSurfaceClass = cinematic
    ? "rounded-xl border border-skyInk/10 bg-white/86 p-4"
    : "rounded-lg border border-skyInk/10 bg-white p-3";
  const photoPresent = Boolean(selectedFile) || (!gcsEnabled && attachMockPhoto);

  function validateSelectedFile(file: File) {
    if (!allowedTypes.has(file.type)) {
      return "Choose a JPG, PNG, WebP, or GIF image.";
    }

    if (file.size > maxUploadSizeBytes) {
      return "Choose an image under 8 MB.";
    }

    return "";
  }

  function parseMoodTagsInput(value: string) {
    return value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
  }

  function formatMoodTagsInput(tags: string[]) {
    return tags.join(", ");
  }

  async function enhanceNote() {
    if (!aiConfigured || note.trim().length < 3 || aiStatus === "loading") return;

    setAiAssistantOpen(true);
    setAiStatus("loading");
    setAiError("");
    setAiMessage("");

    try {
      const response = await fetch("/api/ai/journal-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          style: aiStyle,
          city: cityName,
          condition,
          temperature,
          units,
          capturedAt,
          favoriteLabel,
          hasPhoto: photoPresent,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        enhancedNote?: string;
      } | null;

      if (!response.ok || !payload?.enhancedNote) {
        setAiStatus("error");
        setAiAssistantOpen(true);
        setAiError(response.status === 429 && payload?.error ? payload.error : "Could not polish this note right now.");
        return;
      }

      setAiNote(payload.enhancedNote);
      setAiStatus("ready");
      setAiAssistantOpen(true);
      setAiMessage("AI-polished note ready.");
    } catch {
      setAiStatus("error");
      setAiAssistantOpen(true);
      setAiError("Could not polish this note right now.");
    }
  }

  async function suggestTitleAndMood() {
    const journalNote = aiNote.trim() || note.trim();
    if (!aiConfigured || journalNote.length < 3 || insightStatus === "loading") return;

    setInsightOpen(true);
    setInsightStatus("loading");
    setInsightError("");
    setInsightMessage("");

    try {
      const response = await fetch("/api/ai/journal-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: journalNote,
          style: aiStyle,
          city: cityName,
          condition,
          temperature,
          units,
          capturedAt,
          favoriteLabel,
          hasPhoto: photoPresent,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        title?: string;
        moodTags?: string[];
      } | null;

      if (!response.ok || !payload?.title || !payload?.moodTags?.length) {
        setInsightStatus("error");
        setInsightOpen(true);
        setInsightError(response.status === 429 && payload?.error ? payload.error : "Could not suggest a title right now.");
        return;
      }

      setSuggestedTitle(payload.title);
      setSuggestedMoodTags(payload.moodTags.slice(0, 5));
      setInsightStatus("ready");
      setInsightOpen(true);
      setInsightError("");
      setInsightMessage("AI title and mood tags ready.");
    } catch {
      setInsightStatus("error");
      setInsightOpen(true);
      setInsightError("Could not suggest a title right now.");
    }
  }

  function applySuggestedInsights() {
    if (!suggestedTitle && suggestedMoodTags.length === 0) return;
    if (suggestedTitle) setTitle(suggestedTitle);
    if (suggestedMoodTags.length > 0) setMoodTagsInput(formatMoodTagsInput(suggestedMoodTags));
    setInsightError("");
    setInsightMessage("Applied AI title and mood tags.");
  }

  function clearSuggestedInsights() {
    setTitle("");
    setMoodTagsInput("");
    setSuggestedTitle("");
    setSuggestedMoodTags([]);
    setInsightStatus("idle");
    setInsightError("");
    setInsightMessage("Cleared the AI suggestions.");
  }

  function handleUseEnhancedNote() {
    if (!aiNote) return;
    setNote(aiNote);
    setAiStatus("idle");
    setAiError("");
    setAiNote("");
    setAiMessage("Enhanced note placed in the textarea.");
  }

  function keepOriginalNote() {
    setAiStatus("idle");
    setAiError("");
    setAiNote("");
    setAiMessage("Kept your original note.");
  }

  async function copyEnhancedNote() {
    if (!aiNote || !navigator.clipboard) return;

    await navigator.clipboard.writeText(aiNote);
    setAiMessage("Copied the AI-polished note.");
  }

  async function resolveCapturedLocation() {
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationStatus("error");
      setLocationError("Enter a city or town.");
      return;
    }

    setTimePlaceOpen(true);
    setLocationStatus("loading");
    setLocationError("");
    setLocationMessage("");

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(query)}&units=${units}`, {
        method: "GET",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            weather?: {
              isMock?: boolean;
              city?: {
                name: string;
                country: string | null;
                region: string | null;
                lat: number | null;
                lon: number | null;
              };
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.weather?.city) {
        throw new Error(payload?.error ?? "Could not find that location. Try another city.");
      }

      if (payload.weather.isMock) {
        throw new Error("Could not find that location. Try another city.");
      }

      setSelectedLocation({
        name: payload.weather.city.name,
        country: payload.weather.city.country,
        region: payload.weather.city.region,
        latitude: payload.weather.city.lat,
        longitude: payload.weather.city.lon,
      });
      setLocationQuery(payload.weather.city.name);
      setLocationMessage(
        `Using ${formatLocationLabel({
          name: payload.weather.city.name,
          country: payload.weather.city.country,
        })}.`,
      );
      setLocationStatus("ready");
    } catch (error) {
      setLocationStatus("error");
      setLocationError(error instanceof Error ? error.message : "Could not find that location. Try another city.");
    }
  }

  function resetCapturedLocation() {
    setSelectedLocation({
      name: cityName,
      country: cityCountry,
      region: cityRegion,
      latitude: cityLatitude,
      longitude: cityLongitude,
    });
    setLocationQuery(cityName);
    setLocationStatus("idle");
    setLocationError("");
    setLocationMessage("Using the current city from this page.");
  }

  async function uploadSelectedFile(file: File) {
    const signResponse = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        cityId,
        weatherSnapshotId,
      }),
    });

    const signPayload = (await signResponse.json()) as {
      ok?: boolean;
      error?: string;
      upload?: {
        mode: "gcs" | "mock";
        uploadUrl: string | null;
        method: "PUT" | "mock";
        bucket?: string;
        objectPath: string;
        publicUrl?: string | null;
      };
    };

    if (!signResponse.ok || !signPayload.ok || !signPayload.upload) {
      throw new Error(signPayload.error ?? "Could not prepare the upload.");
    }

    if (signPayload.upload.mode !== "gcs" || !signPayload.upload.uploadUrl) {
      throw new Error("GCS upload is not configured on the server.");
    }

    const uploadResponse = await fetch(signPayload.upload.uploadUrl, {
      method: signPayload.upload.method,
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("The upload to Google Cloud Storage failed.");
    }

    const completeResponse = await fetch("/api/uploads/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        cityId,
        weatherSnapshotId,
        objectPath: signPayload.upload.objectPath,
        isMock: false,
      }),
    });

    const completePayload = (await completeResponse.json()) as {
      ok?: boolean;
      error?: string;
      photo?: { id: string };
    };

    if (!completeResponse.ok || !completePayload.ok || !completePayload.photo?.id) {
      throw new Error(completePayload.error ?? "Could not save upload metadata.");
    }

    return completePayload.photo.id;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    if (locationStatus === "loading") {
      setStatus("error");
      setMessage("Wait for the location lookup to finish.");
      return;
    }

    const capturedMomentAt = usePastTime ? parseDateTimeLocalValue(capturedAtInput) : new Date(capturedAt);
    if (!capturedMomentAt) {
      setStatus("error");
      setMessage("Sky Moments can be backdated up to 14 days.");
      return;
    }

    const now = Date.now();
    if (capturedMomentAt.getTime() > now || capturedMomentAt.getTime() < now - 14 * 24 * 60 * 60 * 1000) {
      setStatus("error");
      setMessage("Sky Moments can be backdated up to 14 days.");
      return;
    }

    let photoId: string | undefined;

    try {
      if (gcsEnabled && selectedFile) {
        const validationError = validateSelectedFile(selectedFile);
        if (validationError) throw new Error(validationError);
        photoId = await uploadSelectedFile(selectedFile);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Photo upload failed.");
      return;
    }

    const response = await fetch("/api/sky-moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        weatherSnapshotId,
        photoId,
        title: title.trim() || null,
        moodTags: parseMoodTagsInput(moodTagsInput),
        note,
        attachMockPhoto: gcsEnabled ? false : attachMockPhoto,
        units,
        capturedAt: capturedMomentAt.toISOString(),
        capturedLocation: {
          name: selectedLocation.name,
          country: selectedLocation.country,
          region: selectedLocation.region,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
      }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.error ?? "Could not save this sky moment.");
      return;
    }

    setStatus("saved");
    setMessage(photoId ? "Uploaded photo and saved this sky moment." : "Saved to your Sky Journal timeline.");
    router.refresh();
  }

  if (!signedIn) {
    return (
      <section className={sectionClass}>
        <h2 className="text-2xl font-semibold text-skyInk">Save this sky moment</h2>
        <p className="mt-2 text-skyInk/70">
          Sign in to save this weather, add a note, and keep a personal timeline of skies.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={cinematic ? "rounded-xl bg-skyInk px-4 py-2 font-semibold text-cloud hover:bg-night" : "rounded-lg bg-skyInk px-4 py-2 font-semibold text-cloud"} href="/login">
            Sign in
          </Link>
          <Link className={cinematic ? "rounded-xl border border-skyInk/20 px-4 py-2 font-semibold hover:bg-white/65" : "rounded-lg border border-skyInk/20 px-4 py-2 font-semibold"} href="/register">
            Create account
          </Link>
        </div>
      </section>
    );
  }

  if (!emailVerified) {
    return (
      <section className={sectionClass}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-horizon text-skyInk">
            <Save aria-hidden className="size-5" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-skyInk">Save this sky moment</h2>
            <p className="mt-1 text-skyInk/70">
              Verify your email to save Sky Moments, upload photos, and keep your journal timeline unlocked.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={primaryButtonClass} href={verifyEmailHref}>
            Verify your email
          </Link>
          <Link
            className={cinematic ? "rounded-xl border border-skyInk/20 px-4 py-2 font-semibold hover:bg-white/65" : "rounded-lg border border-skyInk/20 px-4 py-2 font-semibold"}
            href="/settings"
          >
            Account Security
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-horizon text-skyInk">
          <Save aria-hidden className="size-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-skyInk">Save this sky moment</h2>
          <p className="mt-1 text-skyInk/70">
            Add one sentence now. Your dashboard will keep it in a timeline.
          </p>
        </div>
      </div>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-semibold text-skyInk" htmlFor="moment-note">
            Journal note
          </label>
          <textarea
            id="moment-note"
            className="mt-2 min-h-32 w-full rounded-xl border border-skyInk/15 bg-white px-4 py-3 text-skyInk placeholder:text-skyInk/45 focus:border-horizon focus:ring-2 focus:ring-horizon/25"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              if (aiNote) {
                setAiNote("");
                setAiStatus("idle");
                setAiError("");
                setAiMessage("");
              }
            }}
            maxLength={1200}
            placeholder="First day of college, rain before the train, sunset after exams..."
          />
        </div>
        <CollapsibleSection
          action={null}
          className="border-slate-200 bg-[#f4f7f4] text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
          contentClassName="pt-0"
          defaultOpen={false}
          open={timePlaceOpen}
          subtitle="Backdate up to 14 days and choose the city where this moment happened."
          summary={momentTimeSummary}
          title="Moment time & place"
          variant="light"
          onOpenChange={setTimePlaceOpen}
        >
          <div className="space-y-4 px-4 pb-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm">
              <input
                className="mt-1 rounded border-slate-400 text-slate-900 focus:ring-slate-400/30"
                checked={usePastTime}
                type="checkbox"
                onChange={(event) => {
                  setUsePastTime(event.target.checked);
                  setTimePlaceOpen(true);
                  if (!event.target.checked) {
                    setLocationError("");
                    setLocationStatus("idle");
                  }
                }}
              />
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">Use a past time</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  You can save moments from the last 14 days.
                </p>
              </div>
            </label>

            <div className={usePastTime ? "grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : "grid gap-4"}>
              <div className={usePastTime ? "space-y-2" : "space-y-2 sm:max-w-sm"}>
                <label className="text-sm font-semibold text-slate-950" htmlFor="moment-captured-time">
                  Date and time
                </label>
                <input
                  id="moment-captured-time"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100"
                  max={toDateTimeLocalValue(new Date())}
                  min={toDateTimeLocalValue(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))}
                  type="datetime-local"
                  value={capturedAtInput}
                  onChange={(event) => {
                    setCapturedAtInput(event.target.value);
                    setTimePlaceOpen(true);
                  }}
                  disabled={!usePastTime}
                />
                <p className="text-xs text-slate-600">
                  {usePastTime ? "The moment time will be used to fetch historical weather." : "Leave this off to save the sky as it is right now."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950" htmlFor="captured-location">
                  Captured location
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="captured-location"
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100"
                    placeholder="Search a city or town"
                    value={locationQuery}
                    onChange={(event) => {
                      setLocationQuery(event.target.value);
                      setLocationStatus("idle");
                      setLocationError("");
                      setLocationMessage("");
                      setTimePlaceOpen(true);
                    }}
                  />
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
                    disabled={locationStatus === "loading"}
                    type="button"
                    onClick={() => void resolveCapturedLocation()}
                  >
                    {locationStatus === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Search aria-hidden className="size-4" />}
                    Find city
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Use the city where the moment actually happened.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                    <MapPin aria-hidden className="size-3.5" />
                    {selectedLocationLabel}
                  </span>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                    type="button"
                    onClick={() => resetCapturedLocation()}
                  >
                    Use current city
                  </button>
                </div>
                {locationMessage ? <p className="text-sm font-medium text-slate-700">{locationMessage}</p> : null}
                {locationError ? <p className="text-sm font-medium text-red-700">{locationError}</p> : null}
              </div>
            </div>
          </div>
        </CollapsibleSection>
        <CollapsibleSection
          action={null}
          className="border-slate-200 bg-[#eef4f1] text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.10)]"
          contentClassName="pt-0"
          defaultOpen={false}
          open={aiAssistantOpen}
          subtitle={
            aiStatus === "loading"
              ? "Polishing your journal note in the chosen style."
              : aiStatus === "ready" && aiNote
                ? "Review the polished version before saving."
                : aiError || aiMessage || "Polish your journal note in a chosen style."
          }
          summary={
            aiStatus === "ready" && aiNote
              ? "AI-polished note ready"
              : aiStatus === "loading"
                ? "Working on your note"
                : "Optional"
          }
          title="Enhance note with AI"
          variant="light"
          onOpenChange={setAiAssistantOpen}
        >
          <div className="space-y-4 px-4 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 sm:max-w-2xl">
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ai-style">
                  Writing style
                </label>
                <div className="relative">
                  <select
                    id="ai-style"
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-950 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-700 disabled:opacity-100"
                    disabled={aiStatus === "loading"}
                    value={aiStyle}
                    onChange={(event) => setAiStyle(event.target.value as JournalEnhancementStyle)}
                  >
                    {journalEnhancementStyles.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
              {aiConfigured ? (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
                  disabled={aiStatus === "loading" || note.trim().length < 3}
                  type="button"
                  onClick={() => void enhanceNote()}
                >
                  {aiStatus === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
                  {aiStatus === "loading" ? "Polishing your sky note..." : "Enhance with AI"}
                </button>
              ) : (
                <div className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700">
                  AI enhancement is not configured yet.
                </div>
              )}
            </div>

            {aiStatus === "loading" ? <p className="text-sm text-slate-700">Polishing your sky note...</p> : null}

            {aiNote ? (
              <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI-polished note</p>
                    <p className="mt-1 text-xs text-slate-700">Review it before saving.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[0.68rem] font-semibold text-slate-800">
                    {aiStyle}
                  </div>
                </div>
                <div className="p-4">
                  <p className="whitespace-pre-wrap text-[0.98rem] leading-7 text-slate-950">{aiNote}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                      type="button"
                      disabled={aiStatus === "loading"}
                      onClick={() => handleUseEnhancedNote()}
                    >
                      <Check aria-hidden className="size-4" />
                      Use enhanced note
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      type="button"
                      disabled={aiStatus === "loading"}
                      onClick={() => void enhanceNote()}
                    >
                      <RefreshCw aria-hidden className="size-4" />
                      Regenerate
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      type="button"
                      disabled={aiStatus === "loading"}
                      onClick={() => keepOriginalNote()}
                    >
                      Keep original
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      type="button"
                      disabled={aiStatus === "loading"}
                      onClick={() => void copyEnhancedNote()}
                    >
                      <Copy aria-hidden className="size-4" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {aiError ? <p className="text-sm font-medium text-red-700">{aiError}</p> : null}
            {aiMessage ? <p className="text-sm font-medium text-slate-700">{aiMessage}</p> : null}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          action={null}
          className="border-slate-200 bg-[#f4f7f4] text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
          contentClassName="pt-0"
          defaultOpen={false}
          open={insightOpen}
          subtitle={
            insightStatus === "ready" && (suggestedTitle || suggestedMoodTags.length > 0)
              ? "Review the suggested title and mood tags before saving."
              : insightError || insightMessage || "Generate or edit a short title and up to 5 tags."
          }
          summary={
            title.trim() || currentMoodTags.length > 0
              ? `${title.trim() || "Untitled"} · ${currentMoodTags.length} tag${currentMoodTags.length === 1 ? "" : "s"}`
              : "Optional"
          }
          title="Add title & mood tags"
          variant="light"
          onOpenChange={setInsightOpen}
        >
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
                <Tag aria-hidden className="size-4" />
              </span>
              <div className="max-w-2xl">
                <p className="text-sm leading-6 text-slate-700">
                  Optional. Add a short title and a few mood tags for this sky moment.
                </p>
              </div>
              {aiConfigured ? (
                <button
                  className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
                  disabled={insightStatus === "loading" || (aiNote.trim().length < 3 && note.trim().length < 3)}
                  type="button"
                  onClick={() => void suggestTitleAndMood()}
                >
                  {insightStatus === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
                  {insightStatus === "loading" ? "Suggesting title..." : "Suggest with AI"}
                </button>
              ) : (
                <div className="ml-auto inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700">
                  AI enhancement is not configured yet.
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="moment-title">
                  Title
                </label>
                <input
                  id="moment-title"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100"
                  maxLength={80}
                  placeholder="Rain Before the Grind"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <p className="mt-2 text-xs text-slate-600">Optional. Short and descriptive works best.</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="moment-tags">
                  Mood tags
                </label>
                <input
                  id="moment-tags"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100"
                  maxLength={160}
                  placeholder="focused, rainy, calm, growth"
                  value={moodTagsInput}
                  onChange={(event) => setMoodTagsInput(event.target.value)}
                />
                <p className="mt-2 text-xs text-slate-600">Comma-separated, up to 5 simple tags.</p>
              </div>
            </div>

            {aiConfigured && (suggestedTitle || suggestedMoodTags.length > 0) ? (
              <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      AI title suggestion
                    </p>
                    <p className="mt-1 text-sm text-slate-700">Review this before saving your moment.</p>
                  </div>
                  {aiStyle ? (
                    <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[0.68rem] font-semibold text-slate-800">
                      {aiStyle}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-4 p-4">
                  {suggestedTitle ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Title</p>
                      <p className="mt-1 text-[1.02rem] font-semibold leading-7 text-slate-950">{suggestedTitle}</p>
                    </div>
                  ) : null}
                  {suggestedMoodTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {suggestedMoodTags.map((tag) => (
                        <span
                          className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
                      disabled={insightStatus === "loading" || (!suggestedTitle && suggestedMoodTags.length === 0)}
                      type="button"
                      onClick={applySuggestedInsights}
                    >
                      <Check aria-hidden className="size-4" />
                      Use suggestions
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100"
                      disabled={insightStatus === "loading"}
                      type="button"
                      onClick={() => void suggestTitleAndMood()}
                    >
                      <RefreshCw aria-hidden className="size-4" />
                      Regenerate
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100"
                      disabled={insightStatus === "loading"}
                      type="button"
                      onClick={clearSuggestedInsights}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {insightStatus === "loading" ? <p className="text-sm text-slate-700">Suggesting a title and mood tags...</p> : null}
            {insightError ? <p className="text-sm font-medium text-red-700">{insightError}</p> : null}
            {insightMessage ? <p className="text-sm font-medium text-slate-700">{insightMessage}</p> : null}
          </div>
        </CollapsibleSection>
        {gcsEnabled ? (
          <div className={inputSurfaceClass}>
            <label className="flex items-center gap-3 text-sm font-semibold text-skyInk" htmlFor="sky-photo">
              <Camera aria-hidden className="size-4" />
              Upload sky photo
            </label>
            <input
              id="sky-photo"
              className="mt-3 block w-full text-sm text-skyInk file:mr-4 file:rounded-lg file:border-0 file:bg-skyInk file:px-4 file:py-2 file:font-semibold file:text-cloud hover:file:bg-night focus:outline-none focus:ring-2 focus:ring-horizon/40"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                if (!file) {
                  setMessage("");
                  return;
                }

                const validationError = validateSelectedFile(file);
                setMessage(validationError);
                if (validationError) setStatus("error");
                else setStatus("idle");
              }}
            />
            <p className="mt-2 text-xs text-skyInk/60">JPG, PNG, WebP, or GIF. Max 8 MB.</p>
          </div>
        ) : (
          <label className="flex items-center gap-3 rounded-xl border border-skyInk/10 bg-white/86 p-4 text-sm font-medium text-skyInk">
            <input
              className="rounded border-skyInk/30 text-rain focus:ring-horizon"
              type="checkbox"
              checked={attachMockPhoto}
              onChange={(event) => setAttachMockPhoto(event.target.checked)}
            />
            <Camera aria-hidden className="size-4" />
            Attach demo sky photo when GCS is not configured
          </label>
        )}
        <button
          className={primaryButtonClass}
          type="submit"
          disabled={status === "saving" || locationStatus === "loading"}
        >
          {status === "saving" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
          Save sky moment
        </button>
        {message ? (
          <p className={status === "error" ? "text-sm font-medium text-danger" : "text-sm font-medium text-rain"}>
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
