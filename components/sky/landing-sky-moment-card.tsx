"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, CloudSun, MapPin } from "lucide-react";
import { useSkyMomentVisualMode, writeStoredSkyMomentVisualMode } from "@/lib/sky/moment-visual-client";
import { formatTemperature } from "@/lib/utils";

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
  const [storedMode] = useSkyMomentVisualMode(momentId);

  const canSwap = Boolean(moodImageSrc && photoSrc);
  const activeMode = canSwap ? storedMode : moodImageSrc ? "mood" : "photo";
  const primarySrc = activeMode === "photo" ? photoSrc ?? moodImageSrc : moodImageSrc ?? photoSrc;
  const secondarySrc = activeMode === "photo" ? moodImageSrc : photoSrc;
  const secondaryAlt = activeMode === "photo" ? `${cityName} weather mood` : `${cityName} sky photo`;
  const secondaryLabel = activeMode === "photo" ? "Weather mood" : "Captured for your journal";
  const showSecondaryAccent = activeMode === "mood" && Boolean(secondarySrc);
  const surfaceOverlayClassName =
    activeMode === "photo"
      ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.02)_0%,rgba(5,12,18,0.10)_36%,rgba(5,12,18,0.48)_100%)]"
      : "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.04)_0%,rgba(5,12,18,0.24)_38%,rgba(5,12,18,0.84)_100%)]";

  return (
    <div className="group w-full min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#071417]/76 shadow-[0_30px_92px_rgba(0,0,0,0.40)] backdrop-blur-2xl transition duration-300 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_38px_112px_rgba(0,0,0,0.46)]">
      <div className="relative isolate overflow-hidden border-b border-white/10">
        <div className="relative aspect-[16/12] min-h-[17rem] bg-[#071417] sm:aspect-[16/11] sm:min-h-[21rem]">
          {primarySrc ? (
            <Image
              alt={activeMode === "photo" ? `${cityName} sky photo` : `${cityName} weather mood`}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 31rem, (min-width: 640px) 92vw, 100vw"
              src={primarySrc}
              unoptimized={activeMode === "photo"}
            />
          ) : null}
          <div className={`absolute inset-0 ${moodOverlayClassName}`} />
          <div className={surfaceOverlayClassName} />

          <div className="absolute inset-x-4 top-4 flex min-w-0 items-start justify-between gap-3 max-[390px]:flex-wrap sm:inset-x-6 sm:top-5 sm:gap-4">
            <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/18 bg-black/18 px-3 py-1.5 text-[0.72rem] font-semibold text-aurora backdrop-blur-xl max-[390px]:max-w-full max-[390px]:px-2.5 sm:text-sm">
              <CloudSun aria-hidden className="size-4" />
              <span className="truncate max-[390px]:hidden sm:inline">Saved sky moment</span>
              <span className="truncate min-[391px]:hidden">Saved moment</span>
            </span>
            <div className="flex shrink-0 items-center gap-1.5 max-[390px]:ml-auto max-[390px]:w-full max-[390px]:justify-end sm:gap-2">
              {canSwap ? (
                <button
                  type="button"
                  aria-label={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-white/16 bg-black/28 px-2 text-cloud/88 shadow-[0_8px_22px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 max-[390px]:h-6.5 max-[390px]:px-1.5"
                  title={activeMode === "mood" ? "Switch to photo view" : "Switch to mood view"}
                  onClick={() => {
                    const nextMode = activeMode === "mood" ? "photo" : "mood";
                    writeStoredSkyMomentVisualMode(momentId, nextMode);
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
              <span className="max-w-[6.5rem] truncate rounded-full border border-white/18 bg-black/18 px-2.5 py-1.5 text-[0.68rem] font-semibold text-cloud/90 backdrop-blur-xl max-[390px]:max-w-[5rem] max-[390px]:px-2 max-[390px]:py-1 sm:max-w-none sm:px-3 sm:text-xs">
                {condition}
              </span>
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-4 grid grid-cols-[minmax(0,1fr)_4.75rem] items-end gap-3 max-[390px]:grid-cols-[minmax(0,1fr)_3.75rem] max-[390px]:gap-2 sm:inset-x-6 sm:bottom-6 sm:grid-cols-[minmax(0,1fr)_8.25rem] sm:gap-5">
            <div className="min-w-0 text-cloud">
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

            {showSecondaryAccent && secondarySrc ? (
              <div className="min-w-0 justify-self-end">
                <div className="overflow-hidden rounded-[1.15rem] border border-white/16 bg-black/24 shadow-[0_14px_34px_rgba(0,0,0,0.28)] backdrop-blur-md">
                  <div className="relative aspect-[5/6] w-[4.75rem] max-[390px]:w-[3.75rem] sm:w-[8.25rem]">
                    <Image
                      alt={secondaryAlt}
                      className="object-cover"
                      fill
                      sizes="(min-width: 640px) 132px, 60px"
                      src={secondarySrc}
                      unoptimized
                    />
                  </div>
                </div>
                <p className="mt-2 max-w-[4.75rem] text-center text-[0.68rem] leading-4 text-cloud/82 max-[390px]:hidden sm:max-w-none sm:text-xs">
                  {secondaryLabel}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-[#162027]/86 px-4 py-5 sm:px-6">
        <div className="grid min-w-0 gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aurora">Latest sky moment</p>
          {title ? <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cloud/78">{title}</p> : null}
          <h2 className="max-w-full text-balance text-[1.18rem] font-medium leading-[1.38] text-cloud sm:max-w-[22ch] sm:text-[1.5rem]">
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
          <span className="min-w-0 text-sm text-cloud/50">Your next memory is waiting in the timeline.</span>
        </div>
      </div>
    </div>
  );
}
