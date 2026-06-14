"use client";

import { useEffect, useState } from "react";

type BackgroundMode = "image" | "video";

const storageKey = "iconicskies:landing-background-mode";
const desktopPosterPath = "/backgrounds/landing/landing-poster.webp";
const mobilePosterPath = "/backgrounds/landing/landing-poster-mobile.webp";
const videoPath = "/backgrounds/landing/landing-loop.mp4";

export function LandingBackground() {
  const [mode, setMode] = useState<BackgroundMode>("image");
  const [canUseVideo, setCanUseVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px)");

    const syncMode = () => {
      const videoAllowed = !reducedMotion.matches && !mobile.matches;
      setCanUseVideo(videoAllowed);

      if (!videoAllowed) {
        setMode("image");
        return;
      }

      const stored = window.localStorage.getItem(storageKey);
      setMode(stored === "video" ? "video" : "image");
    };

    syncMode();
    reducedMotion.addEventListener("change", syncMode);
    mobile.addEventListener("change", syncMode);

    return () => {
      reducedMotion.removeEventListener("change", syncMode);
      mobile.removeEventListener("change", syncMode);
    };
  }, []);

  function chooseMode(nextMode: BackgroundMode) {
    if (nextMode === "video" && !canUseVideo) return;
    setMode(nextMode);
    window.localStorage.setItem(storageKey, nextMode);
  }

  const showVideo = canUseVideo && mode === "video" && !videoFailed;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-skyInk"
        data-background-mode={showVideo ? "video" : "image"}
        data-testid="landing-background"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:center_42%] md:hidden"
          data-testid="landing-poster-mobile"
          style={{ backgroundImage: `url(${mobilePosterPath})` }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center md:block"
          data-testid="landing-poster-desktop"
          style={{ backgroundImage: `url(${desktopPosterPath})` }}
        />
        {showVideo ? (
          <video
            className="absolute inset-0 size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={desktopPosterPath}
            onError={() => setVideoFailed(true)}
          >
            <source src={videoPath} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_22%,rgba(216,138,75,0.20),transparent_28rem),linear-gradient(105deg,rgba(5,12,18,0.93)_0%,rgba(7,20,28,0.78)_38%,rgba(7,20,28,0.44)_66%,rgba(5,12,18,0.70)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.18)_0%,rgba(5,12,18,0.58)_100%)]" />
      </div>

      <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-[#071417]/58 p-1 text-xs font-semibold text-cloud/82 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl md:inline-flex">
        <button
          type="button"
          aria-label="Image background"
          aria-pressed={mode === "image"}
          className={`rounded-full px-3 py-1.5 transition ${
            mode === "image" ? "bg-cloud text-skyInk" : "hover:bg-white/10 hover:text-cloud"
          }`}
          onClick={() => chooseMode("image")}
        >
          Image
        </button>
        <button
          type="button"
          aria-label="Video background"
          aria-pressed={mode === "video"}
          className={`rounded-full px-3 py-1.5 transition ${
            mode === "video" ? "bg-cloud text-skyInk" : "hover:bg-white/10 hover:text-cloud"
          } ${canUseVideo ? "" : "cursor-not-allowed opacity-50"}`}
          disabled={!canUseVideo}
          onClick={() => chooseMode("video")}
        >
          Video
        </button>
      </div>
    </>
  );
}
