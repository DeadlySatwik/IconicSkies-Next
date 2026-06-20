"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronDown, Copy, LoaderCircle, RefreshCw, Save, Sparkles } from "lucide-react";
import { journalEnhancementStyles, type JournalEnhancementStyle } from "@/lib/ai/journal-styles";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxUploadSizeBytes = 8 * 1024 * 1024;

export function SaveMomentForm({
  cityId,
  weatherSnapshotId,
  gcsEnabled,
  signedIn,
  aiEnabled,
  cityName,
  condition,
  temperature,
  units,
  capturedAt,
  favoriteLabel = null,
  variant = "default",
}: {
  cityId: string;
  weatherSnapshotId: string;
  gcsEnabled: boolean;
  signedIn: boolean;
  aiEnabled?: boolean;
  cityName: string;
  condition: string;
  temperature: number;
  units: "metric" | "imperial";
  capturedAt: string;
  favoriteLabel?: string | null;
  variant?: "default" | "cinematic";
}) {
  const [note, setNote] = useState("");
  const [attachMockPhoto, setAttachMockPhoto] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [aiStyle, setAiStyle] = useState<JournalEnhancementStyle>("Aesthetic");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiNote, setAiNote] = useState("");
  const router = useRouter();
  const cinematic = variant === "cinematic";
  const aiConfigured = Boolean(aiEnabled);
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

  async function enhanceNote() {
    if (!aiConfigured || note.trim().length < 3 || aiStatus === "loading") return;

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
        setAiError(response.status === 429 && payload?.error ? payload.error : "Could not polish this note right now.");
        return;
      }

      setAiNote(payload.enhancedNote);
      setAiStatus("ready");
      setAiMessage("AI-polished note ready.");
    } catch {
      setAiStatus("error");
      setAiError("Could not polish this note right now.");
    }
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
        note,
        attachMockPhoto: gcsEnabled ? false : attachMockPhoto,
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
        <div className="rounded-xl border border-slate-200 bg-[#eef4f1] p-4 text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-slate-950">AI note assistant</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Polish your note while keeping your original meaning.
                </p>
              </div>
              {aiConfigured ? (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
                  <div className="min-w-0 sm:min-w-56">
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
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
                    disabled={aiStatus === "loading" || note.trim().length < 3}
                    type="button"
                    onClick={() => void enhanceNote()}
                  >
                    {aiStatus === "loading" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
                    {aiStatus === "loading" ? "Polishing your sky note..." : "Enhance with AI"}
                  </button>
                </div>
              ) : (
                <div className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700">
                  AI enhancement is not configured yet.
                </div>
              )}
            </div>

            {aiStatus === "loading" ? (
              <p className="text-sm text-slate-700">Polishing your sky note...</p>
            ) : null}

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
        </div>
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
          disabled={status === "saving"}
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
