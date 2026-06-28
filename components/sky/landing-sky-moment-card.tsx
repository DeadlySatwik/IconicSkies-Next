"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, CloudSun, MapPin } from "lucide-react";
import { useState } from "react";
import { formatTemperature } from "@/lib/utils";

type SkyMomentVisualMode = "mood" | "photo";

function getStorageKey(storageScope: string) {
  return `skyMomentVisualMode:${storageScope}`;
}

function getStoredMode(storageScope: string): SkyMomentVisualMode {
  if (typeof window === "undefined") return "mood";
  const stored = window.localStorage.getItem(getStorageKey(storageScope));
  return stored === "photo" ? "photo" : "mood";
}

type LandingSkyMomentCardProps = {
  momentId: string;
  cityName: string;
  country: string | null;
  condition: string;
  comfortLabel: string | null;
  capturedAtLabel: string;
  savedLater: boolean;
  note: string;
  title: string | null;
  photoLabel: string | null;
  moodTags: string[];
  dashboardHref?: string;
  moodImageSrc: string | null;
  moodOverlayClassName: string;
  photoSrc: string | null;
  temperature: number;
  units: "metric" | "imperial";
};

export function LandingSkyMomentCard({
  momentId,
  cityName,
  country,
  condition,
  comfortLabel,
  capturedAtLabel,
  savedLater,
  note,
  title,
  photoLabel,
  moodTags,
  dashboardHref = "/dashboard",
  moodImageSrc,
  moodOverlayClassName,
  photoSrc,
  temperature,
  units,
}: LandingSkyMomentCardProps) {
  const [storedMode, setStoredMode] = useState<SkyMomentVisualMode>(() => getStoredMode(momentId));

  const canSwap = Boolean(moodImageSrc && photoSrc);
  const activeMode = canSwap ? storedMode : moodImageSrc ? "mood" : "photo";
  const primarySrc = activeMode === "photo" ? photoSrc ?? moodImageSrc : moodImageSrc ?? photoSrc;
  const secondarySrc = activeMode === "photo" ? moodImageSrc : photoSrc;
  const secondaryAlt = activeMode === "photo" ? `${cityName} weather mood` : `${cityName} sky photo`;
  const secondaryLabel = activeMode === "photo" ? "Weather mood" : "Captured for your journal";
  const surfaceOverlayClassName =
    activeMode === "photo"
      ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.02)_0%,rgba(5,12,18,0.10)_36%,rgba(5,12,18,0.48)_100%)]"
      : "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.04)_0%,rgba(5,12,18,0.24)_38%,rgba(5,12,18,0.84)_100%)]";

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#071417]/76 shadow-[0_30px_92px_rgba(0,0,0,0.40)] backdrop-blur-2xl transition duration-300 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_38px_112px_rgba(0,0,0,0.46)]">
      <div className="relative isolate overflow-hidden border-b border-white/10">
        <div className="relative aspect-[16/11] min-h-[21rem] bg-[#071417]">
          {primarySrc ? (
            <Image
              alt={activeMode === "photo" ? `${cityName} sky photo` : `${cityName} weather mood`}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 31rem, 100vw"
              src={primarySrc}
              unoptimized={activeMode === "photo"}
            />
          ) : null}
          <div className={`absolute inset-0 ${moodOverlayClassName}`} />
          <div className={surfaceOverlayClassName} />

          <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-4 sm:inset-x-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/18 px-3 py-1.5 text-xs font-semibold text-aurora backdrop-blur-xl sm:text-sm">
              <CloudSun aria-hidden className="size-4" />
              Saved sky moment
            </span>
            <div className="flex items-center gap-2">
              {canSwap ? (
                <button
                  type="button"
                  aria-label={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-white/16 bg-black/28 px-2 text-cloud/88 shadow-[0_8px_22px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  title={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const nextMode = activeMode === "mood" ? "photo" : "mood";
                    setStoredMode(nextMode);
                    window.localStorage.setItem(getStorageKey(momentId), nextMode);
                  }}
                >
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${activeMode === "mood" ? "bg-cloud" : "bg-cloud/28"}`}
                  />
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${activeMode === "photo" ? "bg-cloud" : "bg-cloud/28"}`}
                  />
                </button>
              ) : null}
              <span className="rounded-full border border-white/18 bg-black/18 px-3 py-1.5 text-[0.68rem] font-semibold text-cloud/90 backdrop-blur-xl sm:text-xs">
                {condition}
              </span>
            </div>
          </div>

          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-5 sm:inset-x-6 sm:bottom-6">
            <div className="max-w-[16rem] text-cloud">
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-cloud/62">
                {cityName}
                {country ? `, ${country}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-cloud/84 sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/16 px-2.5 py-1.5 backdrop-blur">
                  <Clock3 aria-hidden className="size-4" />
                  {capturedAtLabel}
                </span>
                <span className="rounded-full border border-white/14 bg-black/16 px-2.5 py-1.5 backdrop-blur">
                  {comfortLabel ?? "Humid"}
                </span>
                <span className="rounded-full border border-white/14 bg-black/16 px-2.5 py-1.5 font-semibold text-cloud/92 backdrop-blur">
                  {formatTemperature(temperature, units)}
                </span>
                {savedLater ? (
                  <span className="rounded-full border border-white/14 bg-black/16 px-2.5 py-1.5 backdrop-blur">
                    Saved later
                  </span>
                ) : null}
              </div>
            </div>

            {secondarySrc ? (
              <div className="shrink-0">
                <div className="overflow-hidden rounded-[1.15rem] border border-white/16 bg-black/24 shadow-[0_14px_34px_rgba(0,0,0,0.28)] backdrop-blur-md">
                  <div className="relative aspect-[5/6] w-[7.75rem] sm:w-[8.25rem]">
                    <Image
                      alt={secondaryAlt}
                      className="object-cover"
                      fill
                      sizes="132px"
                      src={secondarySrc}
                      unoptimized={activeMode === "mood"}
                    />
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-cloud/82">{secondaryLabel}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-[#162027]/86 px-5 py-5 sm:px-6">
        <div className="grid gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aurora">Latest sky moment</p>
          {title ? <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cloud/78">{title}</p> : null}
          <h2 className="max-w-[22ch] text-balance text-[1.22rem] font-medium leading-[1.38] text-cloud sm:text-[1.5rem]">
            {note}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs text-cloud/72 sm:text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-2.5 py-1.5">
            <MapPin aria-hidden className="size-4" />
            {cityName}
            {country ? `, ${country}` : ""}
          </span>
          {photoLabel ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-2.5 py-1.5">
              {photoLabel}
            </span>
          ) : null}
          {moodTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {moodTags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/6 px-2.5 py-1.5 font-semibold text-cloud/78">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-cloud px-4 py-2.5 text-sm font-semibold text-skyInk transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-horizon/70"
            href={dashboardHref}
          >
            Open journal
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <span className="text-sm text-cloud/50">Your next memory is waiting in the timeline.</span>
        </div>
      </div>
    </div>
  );
}
