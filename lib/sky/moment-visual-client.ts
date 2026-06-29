"use client";

import { useCallback, useSyncExternalStore } from "react";

export type SkyMomentVisualMode = "mood" | "photo";

const SKY_MOMENT_VISUAL_MODE_EVENT = "sky-moment-visual-mode-change";

export function getSkyMomentVisualStorageKey(storageScope?: string) {
  return storageScope ? `skyMomentVisualMode:${storageScope}` : null;
}

export function readStoredSkyMomentVisualMode(storageScope?: string): SkyMomentVisualMode {
  if (typeof window === "undefined") return "mood";
  const storageKey = getSkyMomentVisualStorageKey(storageScope);
  if (!storageKey) return "mood";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "photo" ? "photo" : "mood";
}

export function writeStoredSkyMomentVisualMode(storageScope: string | undefined, nextMode: SkyMomentVisualMode) {
  if (typeof window === "undefined") return;
  const storageKey = getSkyMomentVisualStorageKey(storageScope);
  if (!storageKey) return;

  window.localStorage.setItem(storageKey, nextMode);
  window.dispatchEvent(new CustomEvent(SKY_MOMENT_VISUAL_MODE_EVENT, { detail: { key: storageKey } }));
}

export function useSkyMomentVisualMode(storageScope?: string) {
  const storageKey = getSkyMomentVisualStorageKey(storageScope);

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined" || !storageKey) return () => {};

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) onStoreChange();
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (detail?.key === storageKey) onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SKY_MOMENT_VISUAL_MODE_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SKY_MOMENT_VISUAL_MODE_EVENT, handleCustomEvent as EventListener);
    };
  }, [storageKey]);

  const getSnapshot = useCallback(() => readStoredSkyMomentVisualMode(storageScope), [storageScope]);
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => "mood");

  const setMode = useCallback((nextMode: SkyMomentVisualMode) => {
    writeStoredSkyMomentVisualMode(storageScope, nextMode);
  }, [storageScope]);

  return [mode, setMode] as const;
}
