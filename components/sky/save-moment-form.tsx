"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, Save } from "lucide-react";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxUploadSizeBytes = 8 * 1024 * 1024;

export function SaveMomentForm({
  cityId,
  weatherSnapshotId,
  gcsEnabled,
  signedIn,
}: {
  cityId: string;
  weatherSnapshotId: string;
  gcsEnabled: boolean;
  signedIn: boolean;
}) {
  const [note, setNote] = useState("");
  const [attachMockPhoto, setAttachMockPhoto] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  function validateSelectedFile(file: File) {
    if (!allowedTypes.has(file.type)) {
      return "Choose a JPG, PNG, WebP, or GIF image.";
    }

    if (file.size > maxUploadSizeBytes) {
      return "Choose an image under 8 MB.";
    }

    return "";
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
      <section className="rounded-xl border border-skyInk/10 bg-cloud p-6 shadow-soft">
        <h2 className="text-2xl font-semibold text-skyInk">Save this sky moment</h2>
        <p className="mt-2 text-skyInk/70">
          Sign in to save this weather, add a note, and keep a personal timeline of skies.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-skyInk px-4 py-2 font-semibold text-cloud" href="/login">
            Sign in
          </Link>
          <Link className="rounded-lg border border-skyInk/20 px-4 py-2 font-semibold" href="/register">
            Create account
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-skyInk/10 bg-cloud p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-horizon text-skyInk">
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
            className="mt-2 min-h-28 w-full rounded-lg border border-skyInk/15 bg-white px-4 py-3 text-skyInk placeholder:text-skyInk/45 focus:border-rain focus:ring-2 focus:ring-rain/25"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1200}
            placeholder="First day of college, rain before the train, sunset after exams..."
          />
        </div>
        {gcsEnabled ? (
          <div className="rounded-lg border border-skyInk/10 bg-white p-3">
            <label className="flex items-center gap-3 text-sm font-semibold text-skyInk" htmlFor="sky-photo">
              <Camera aria-hidden className="size-4" />
              Upload sky photo
            </label>
            <input
              id="sky-photo"
              className="mt-3 block w-full text-sm text-skyInk file:mr-4 file:rounded-md file:border-0 file:bg-skyInk file:px-4 file:py-2 file:font-semibold file:text-cloud hover:file:bg-night focus:outline-none focus:ring-2 focus:ring-rain"
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
          <label className="flex items-center gap-3 rounded-lg border border-skyInk/10 bg-white p-3 text-sm font-medium text-skyInk">
            <input
              className="rounded border-skyInk/30 text-rain focus:ring-rain"
              type="checkbox"
              checked={attachMockPhoto}
              onChange={(event) => setAttachMockPhoto(event.target.checked)}
            />
            <Camera aria-hidden className="size-4" />
            Attach demo sky photo when GCS is not configured
          </label>
        )}
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-skyInk px-5 font-semibold text-cloud hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain disabled:cursor-not-allowed disabled:opacity-70"
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
