"use client";

import { useCallback, useEffect, useState } from "react";

export type ComfortMode = "standard" | "large" | "highContrast";

export interface ComfortSettings {
  comfortMode: ComfortMode;
  fontScale: number;
  reduceMotion: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  confirmMoves: boolean;
}

const DEFAULTS: ComfortSettings = {
  comfortMode: "standard",
  fontScale: 1,
  reduceMotion: false,
  soundEnabled: true,
  hapticsEnabled: true,
  confirmMoves: false,
};

const KEY = "lwc_comfort_settings";

function load(): ComfortSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function useComfortSettings() {
  const [settings, setSettings] = useState<ComfortSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.comfort = settings.comfortMode;
    document.documentElement.style.setProperty("--font-scale", String(settings.fontScale));
    document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
  }, [settings, ready]);

  const patch = useCallback((p: Partial<ComfortSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...p };
      // keep fontScale in sync with comfortMode
      if (p.comfortMode && !p.fontScale) {
        next.fontScale = p.comfortMode === "standard" ? 1 : p.comfortMode === "large" ? 1.15 : 1.22;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return { settings, patch, reset, ready };
}
