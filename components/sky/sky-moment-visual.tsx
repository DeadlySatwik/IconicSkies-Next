"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";

type SkyMomentVisualMode = "mood" | "photo";

function getStorageKey(storageScope?: string) {
  return storageScope ? `skyMomentVisualMode:${storageScope}` : null;
}

function getStoredMode(storageScope?: string): SkyMomentVisualMode {
  if (typeof window === "undefined") return "mood";
  const storageKey = getStorageKey(storageScope);
  if (!storageKey) return "mood";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "photo" ? "photo" : "mood";
}

type SkyMomentVisualProps = {
  storageScope?: string;
  moodImageSrc: string | null;
  photoSrc: string | null;
  moodAlt?: string;
  photoAlt?: string;
  className?: string;
  overlayClassName?: string;
  children?: ReactNode;
  childrenClassName?: string;
  showToggle?: boolean;
  toggleClassName?: string;
  priority?: boolean;
  moodBadge?: string;
  photoBadge?: string;
};

export function SkyMomentVisual({
  storageScope,
  moodImageSrc,
  photoSrc,
  moodAlt = "Weather mood background",
  photoAlt = "Captured sky photo",
  className = "",
  overlayClassName = "bg-[linear-gradient(180deg,rgba(5,12,18,0.10)_0%,rgba(5,12,18,0.30)_54%,rgba(5,12,18,0.88)_100%)]",
  children,
  childrenClassName = "absolute inset-0 z-20",
  showToggle = true,
  toggleClassName = "absolute right-3 top-3 z-30",
  priority = false,
  moodBadge = "Mood",
  photoBadge = "Photo",
}: SkyMomentVisualProps) {
  const canSwap = Boolean(moodImageSrc && photoSrc);
  const [mode, setMode] = useState<SkyMomentVisualMode>(() => getStoredMode(storageScope));

  const activeMode = canSwap ? mode : moodImageSrc ? "mood" : "photo";
  const primarySrc = activeMode === "photo" ? photoSrc ?? moodImageSrc : moodImageSrc ?? photoSrc;
  const secondarySrc = activeMode === "photo" ? moodImageSrc : photoSrc;
  const secondaryBadge = activeMode === "photo" ? moodBadge : photoBadge;
  const surfaceOverlayClassName =
    activeMode === "photo"
      ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.02)_0%,rgba(5,12,18,0.12)_38%,rgba(5,12,18,0.54)_100%)]"
      : "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.08)_0%,rgba(5,12,18,0.26)_42%,rgba(5,12,18,0.86)_100%)]";

  const toggleButtons = useMemo(() => {
    if (!showToggle || !canSwap) return null;

    return (
      <button
        type="button"
        aria-label={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
        aria-pressed={activeMode === "photo"}
        className="group inline-flex h-7 items-center gap-1.5 rounded-full border border-white/16 bg-black/28 px-2 text-[0.68rem] font-semibold text-cloud/88 shadow-[0_8px_22px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:bg-black/40 hover:text-cloud focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:text-xs"
        title={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
        onClick={() => {
          if (typeof window === "undefined") return;
          const nextMode = activeMode === "mood" ? "photo" : "mood";
          setMode(nextMode);
          const storageKey = getStorageKey(storageScope);
          if (storageKey) window.localStorage.setItem(storageKey, nextMode);
        }}
      >
        <span aria-hidden className="flex items-center gap-1">
          <span
            className={`size-1.5 rounded-full transition ${
              activeMode === "mood" ? "bg-cloud" : "bg-cloud/28 group-hover:bg-cloud/48"
            }`}
          />
          <span
            className={`size-1.5 rounded-full transition ${
              activeMode === "photo" ? "bg-cloud" : "bg-cloud/28 group-hover:bg-cloud/48"
            }`}
          />
        </span>
      </button>
    );
  }, [activeMode, canSwap, showToggle, storageScope]);

  if (!primarySrc) return null;

  return (
    <div className={`relative isolate overflow-hidden ${className}`.trim()} data-sky-moment-visual-mode={activeMode}>
      <Image
        alt={activeMode === "photo" ? photoAlt : moodAlt}
        className="object-cover"
        fill
        priority={priority}
        sizes="(min-width: 1024px) 40vw, 100vw"
        src={primarySrc}
        unoptimized={activeMode === "photo"}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className={surfaceOverlayClassName} />

      {children ? <div className={childrenClassName}>{children}</div> : null}

      {toggleButtons ? <div className={toggleClassName}>{toggleButtons}</div> : null}

      {canSwap && secondarySrc ? (
        <div className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-1.5">
          <div className="overflow-hidden rounded-[1rem] border border-white/16 bg-black/30 shadow-[0_14px_34px_rgba(0,0,0,0.26)] backdrop-blur-md">
            <div className="relative aspect-[4/5] w-[5.75rem] sm:w-[6.5rem]">
              <Image
                alt={activeMode === "photo" ? moodAlt : photoAlt}
                className="object-cover"
                fill
                sizes="(min-width: 640px) 104px, 92px"
                src={secondarySrc}
                unoptimized={activeMode === "mood"}
              />
            </div>
          </div>
          <span className="rounded-full border border-white/14 bg-black/28 px-2.5 py-1 text-[0.65rem] font-semibold text-cloud/82 backdrop-blur-md">
            {secondaryBadge}
          </span>
        </div>
      ) : null}
    </div>
  );
}
