"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";

export function FavoriteLocationActions({
  id,
  initialLabel,
}: {
  id: string;
  initialLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(initialLabel);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updateLabel() {
    setMessage("");
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/favorites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Could not update this label.");
        return;
      }

      setEditing(false);
      setMessage("Label updated.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeFavorite() {
    setMessage("");
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Could not remove this favorite.");
        return;
      }

      setMessage("Removed.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-h-10 w-full min-w-[10rem] flex-1 rounded-lg border border-white/14 bg-[#0b1a20]/92 px-3 text-sm text-slate-950 placeholder:text-slate-500 disabled:text-slate-700 disabled:placeholder:text-slate-500 disabled:opacity-100 focus:border-aurora focus:ring-2 focus:ring-aurora/20"
            maxLength={120}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-cloud px-3 text-sm font-semibold text-skyInk"
            disabled={isSaving}
            type="button"
            onClick={() => void updateLabel()}
          >
            <Check aria-hidden className="size-3.5" />
            Save
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/14 px-3 text-sm font-semibold text-cloud/88"
            disabled={isSaving}
            type="button"
            onClick={() => setEditing(false)}
          >
            <X aria-hidden className="size-3.5" />
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/14 px-3 text-sm font-semibold text-cloud/88 hover:bg-white/8"
            type="button"
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden className="size-3.5" />
            Edit
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/14 px-3 text-sm font-semibold text-cloud/86 hover:bg-white/8"
            type="button"
            onClick={() => void removeFavorite()}
          >
            <Trash2 aria-hidden className="size-3.5" />
            Remove
          </button>
        </div>
      )}
      {message ? <p className="text-xs font-medium text-aurora">{message}</p> : null}
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
