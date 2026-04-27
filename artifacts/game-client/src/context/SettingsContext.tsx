import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { audioManager } from "@/lib/audio";

export type AiDifficulty = "easy" | "normal" | "hard";

interface Settings {
  volume: number;
  muted: boolean;
  sfxEnabled: boolean;
  aiDifficulty: AiDifficulty;
  showDamageNumbers: boolean;
  animationSpeed: "slow" | "normal" | "fast";
}

interface SettingsCtx {
  settings: Settings;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setSfxEnabled: (e: boolean) => void;
  setAiDifficulty: (d: AiDifficulty) => void;
  setShowDamageNumbers: (s: boolean) => void;
  setAnimationSpeed: (s: Settings["animationSpeed"]) => void;
  resetDefaults: () => void;
}

const DEFAULT: Settings = {
  volume: 0.33,
  muted: false,
  sfxEnabled: true,
  aiDifficulty: "normal",
  showDamageNumbers: true,
  animationSpeed: "normal",
};

function load(): Settings {
  try {
    const raw = localStorage.getItem("ts_settings");
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT };
}

function save(s: Settings) {
  try { localStorage.setItem("ts_settings", JSON.stringify(s)); } catch {}
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    audioManager.loadSettings();
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    audioManager.setVolume(v);
    update({ volume: v });
  }, [update]);

  const setMuted = useCallback((m: boolean) => {
    audioManager.setMuted(m);
    update({ muted: m });
  }, [update]);

  const setSfxEnabled = useCallback((e: boolean) => update({ sfxEnabled: e }), [update]);
  const setAiDifficulty = useCallback((d: AiDifficulty) => update({ aiDifficulty: d }), [update]);
  const setShowDamageNumbers = useCallback((s: boolean) => update({ showDamageNumbers: s }), [update]);
  const setAnimationSpeed = useCallback((s: Settings["animationSpeed"]) => update({ animationSpeed: s }), [update]);
  const resetDefaults = useCallback(() => {
    audioManager.setVolume(DEFAULT.volume);
    audioManager.setMuted(DEFAULT.muted);
    update(DEFAULT);
  }, [update]);

  return (
    <Ctx.Provider value={{ settings, setVolume, setMuted, setSfxEnabled, setAiDifficulty, setShowDamageNumbers, setAnimationSpeed, resetDefaults }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
