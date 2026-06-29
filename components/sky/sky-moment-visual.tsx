"use client";

import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import {
  useSkyMomentVisualMode,
  writeStoredSkyMomentVisualMode,
} from "@/lib/sky/moment-visual-client";

type SkyMomentVisualProps = {
  storageScope?: string;
  moodImageSrc: string | null;
  photoSrc: string | null;
  variant?: "default" | "timeline";
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
  variant = "default",
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
  const [mode] = useSkyMomentVisualMode(storageScope);

  const activeMode = canSwap ? mode : moodImageSrc ? "mood" : "photo";
  const primarySrc = activeMode === "photo" ? photoSrc ?? moodImageSrc : moodImageSrc ?? photoSrc;
  const secondarySrc = activeMode === "photo" ? moodImageSrc : photoSrc;
  const secondaryBadge = activeMode === "photo" ? moodBadge : photoBadge;
  const showSecondaryAccent = canSwap && activeMode === "mood" && Boolean(secondarySrc);
  const resolvedOverlayClassName =
    variant === "timeline"
      ? `${overlayClassName} opacity-70`
      : overlayClassName;
  const surfaceOverlayClassName =
    variant === "timeline"
      ? activeMode === "photo"
        ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.01)_0%,rgba(5,12,18,0.08)_38%,rgba(5,12,18,0.36)_100%)]"
        : "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.03)_0%,rgba(5,12,18,0.14)_42%,rgba(5,12,18,0.62)_100%)]"
      : activeMode === "photo"
        ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.02)_0%,rgba(5,12,18,0.12)_38%,rgba(5,12,18,0.54)_100%)]"
        : "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.08)_0%,rgba(5,12,18,0.26)_42%,rgba(5,12,18,0.86)_100%)]";
  const resolvedToggleClassName =
    variant === "timeline" ? "absolute right-2.5 top-2.5 z-30" : toggleClassName;
  const secondaryContainerClassName =
    variant === "timeline"
      ? "absolute bottom-2.5 right-2.5 z-30 flex flex-col items-end gap-1.5"
      : "absolute bottom-3 right-3 z-30 flex flex-col items-end gap-1.5";
  const secondaryFrameClassName =
    variant === "timeline"
      ? "overflow-hidden rounded-[1rem] border border-white/16 bg-black/32 shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-md"
      : "overflow-hidden rounded-[1rem] border border-white/16 bg-black/30 shadow-[0_14px_34px_rgba(0,0,0,0.26)] backdrop-blur-md";
  const secondaryInnerClassName =
    variant === "timeline"
      ? "relative aspect-[4/5] w-[5.75rem] sm:w-[6.25rem]"
      : "relative aspect-[4/5] w-[5.75rem] sm:w-[6.5rem]";
  const secondaryBadgeClassName =
    variant === "timeline"
      ? "rounded-full border border-white/14 bg-black/34 px-2.5 py-1 text-[0.65rem] font-semibold text-cloud/86 backdrop-blur-md"
      : "rounded-full border border-white/14 bg-black/28 px-2.5 py-1 text-[0.65rem] font-semibold text-cloud/82 backdrop-blur-md";

  const toggleButtons = useMemo(() => {
    if (!showToggle || !canSwap) return null;

    return (
      <button
        type="button"
        aria-label={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
        aria-pressed={activeMode === "photo"}
        className={`group inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-black/28 text-[0.68rem] font-semibold text-cloud/88 shadow-[0_8px_22px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:bg-black/40 hover:text-cloud focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:text-xs ${
          variant === "timeline" ? "h-6.5 px-1.5" : "h-7 px-2"
        }`}
        title={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
        onClick={() => {
          const nextMode = activeMode === "mood" ? "photo" : "mood";
          writeStoredSkyMomentVisualMode(storageScope, nextMode);
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
  }, [activeMode, canSwap, showToggle, storageScope, variant]);

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
      <div className={`absolute inset-0 ${resolvedOverlayClassName}`} />
      <div className={surfaceOverlayClassName} />

      {children ? <div className={childrenClassName}>{children}</div> : null}

      {toggleButtons ? <div className={resolvedToggleClassName}>{toggleButtons}</div> : null}

      {showSecondaryAccent && secondarySrc ? (
        <div className={secondaryContainerClassName}>
          <div className={secondaryFrameClassName}>
            <div className={secondaryInnerClassName}>
              <Image
                alt={photoAlt}
                className="object-cover"
                fill
                sizes={variant === "timeline" ? "(min-width: 640px) 100px, 92px" : "(min-width: 640px) 104px, 92px"}
                src={secondarySrc}
                unoptimized
              />
            </div>
          </div>
          <span className={secondaryBadgeClassName}>
            {secondaryBadge}
          </span>
        </div>
      ) : null}
    </div>
  );
}
