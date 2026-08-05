import { useCallback, useEffect, useState } from "react";

export type Accent = "blue" | "pink" | "violet" | "mint" | "amber";

export interface Settings {
  accent: Accent;
  notifications: boolean;
  sounds: boolean;
  reduceMotion: boolean;
}

const KEY = "sc:settings";

export const DEFAULT_SETTINGS: Settings = {
  accent: "blue",
  notifications: false,
  sounds: true,
  reduceMotion: false,
};

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: "blue", label: "Ice Blue", swatch: "#60a5fa" },
  { id: "pink", label: "Blush", swatch: "#f472b6" },
  { id: "violet", label: "Violet", swatch: "#a78bfa" },
  { id: "mint", label: "Mint", swatch: "#5eead4" },
  { id: "amber", label: "Amber", swatch: "#fbbf24" },
];

export function applyAccent(accent: Accent) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.accent = accent;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
        setSettings(parsed);
        applyAccent(parsed.accent);
        return;
      }
    } catch {
      /* ignore */
    }
    applyAccent(DEFAULT_SETTINGS.accent);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      if (patch.accent) applyAccent(patch.accent);
      return next;
    });
  }, []);

  return { settings, update };
}

/** Short, soft chime used for pomodoro transitions. */
export function playChime(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    setTimeout(() => ctx.close(), 1600);
  } catch {
    /* ignore */
  }
}

export function notify(enabled: boolean, title: string, body: string) {
  if (!enabled || typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}
