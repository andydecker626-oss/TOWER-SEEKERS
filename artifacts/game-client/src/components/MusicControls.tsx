import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "@/context/SettingsContext";
import { audioManager } from "@/lib/audio";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

  .mc-wrap {
    position: fixed;
    bottom: 1.1rem;
    right: 1.1rem;
    z-index: 8800;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
    pointer-events: none;
  }

  .mc-track-toast {
    pointer-events: none;
    font-family: 'Cinzel', serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #ffffff;
    background: rgba(8,6,24,0.82);
    border: 1px solid rgba(240,192,64,0.22);
    border-radius: 7px;
    padding: 0.38rem 0.75rem;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.6);
    white-space: nowrap;
    animation: mc-toast-in 0.2s ease forwards;
  }
  .mc-track-toast.mc-toast-out {
    animation: mc-toast-out 0.35s ease forwards;
  }
  @keyframes mc-toast-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mc-toast-out {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-4px); }
  }

  .mc-popout {
    pointer-events: all;
    background: linear-gradient(160deg, #0e0a22 0%, #080618 100%);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    width: 210px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.75), 0 0 24px rgba(255,255,255,0.03);
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .mc-popout-label {
    font-family: 'Cinzel', serif;
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.38);
  }

  .mc-slider-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mc-slider {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 4px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    background: linear-gradient(to right, #ffffff var(--pct, 100%), rgba(255,255,255,0.1) var(--pct, 100%));
  }
  .mc-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 5px rgba(255,255,255,0.45);
    cursor: pointer;
    transition: transform 0.1s;
  }
  .mc-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
  .mc-slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: none;
    background: #ffffff;
    box-shadow: 0 0 5px rgba(255,255,255,0.45);
    cursor: pointer;
  }

  .mc-vol-pct {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    min-width: 30px;
    text-align: right;
  }

  .mc-next-btn {
    font-family: 'Cinzel', serif;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 6px;
    color: rgba(255,255,255,0.7);
    padding: 0.38rem 0.6rem;
    cursor: pointer;
    transition: background 0.14s, border-color 0.14s, color 0.14s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .mc-next-btn:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.38);
    color: #ffffff;
  }

  .mc-btns {
    pointer-events: all;
    display: flex;
    gap: 0.3rem;
  }

  .mc-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid rgba(240,192,64,0.22);
    background: rgba(8,6,24,0.82);
    backdrop-filter: blur(6px);
    color: rgba(200,170,100,0.65);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    transition: background 0.14s, border-color 0.14s, color 0.14s;
    box-shadow: 0 4px 14px rgba(0,0,0,0.55);
  }
  .mc-icon-btn:hover {
    background: rgba(240,192,64,0.1);
    border-color: rgba(240,192,64,0.42);
    color: #f0c040;
  }
  .mc-icon-btn.active {
    background: rgba(240,192,64,0.14);
    border-color: rgba(240,192,64,0.48);
    color: #f0c040;
  }
  .mc-icon-btn.muted {
    color: rgba(200,100,100,0.6);
    border-color: rgba(200,100,100,0.22);
  }
`;

const TOAST_HOLD_MS = 1650;
const TOAST_FADE_MS = 350;

export default function MusicControls() {
  const { settings, setMuted, setMusicVolume } = useSettings();
  const [popoutOpen, setPopoutOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; fading: boolean } | null>(null);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const clearToastTimers = () => {
    toastTimers.current.forEach(clearTimeout);
    toastTimers.current = [];
  };

  const showToast = useCallback((title: string) => {
    clearToastTimers();
    setToast({ title, fading: false });
    const holdTimer = setTimeout(() => {
      setToast(prev => prev ? { ...prev, fading: true } : null);
      const fadeTimer = setTimeout(() => setToast(null), TOAST_FADE_MS);
      toastTimers.current.push(fadeTimer);
    }, TOAST_HOLD_MS);
    toastTimers.current.push(holdTimer);
  }, []);

  useEffect(() => {
    return () => clearToastTimers();
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
      setPopoutOpen(false);
    }
  }, []);

  useEffect(() => {
    if (popoutOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoutOpen, handleClickOutside]);

  const toggleMute = () => setMuted(!settings.muted);
  const togglePopout = () => setPopoutOpen(p => !p);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMusicVolume(parseFloat(e.target.value));
  };

  const handleNextTrack = () => {
    audioManager.onTrackChange((title) => {
      showToast(title);
      audioManager.onTrackChange(null);
    });
    audioManager.nextTrack();
  };

  const pct = `${Math.round(settings.musicVolume * 100)}%`;

  return (
    <>
      <style>{CSS}</style>
      <div className="mc-wrap" ref={wrapRef}>
        {toast && (
          <div className={`mc-track-toast${toast.fading ? " mc-toast-out" : ""}`}>
            ♪ {toast.title}
          </div>
        )}
        {popoutOpen && (
          <div className="mc-popout">
            <div className="mc-popout-label">Music Volume</div>
            <div className="mc-slider-row">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.musicVolume}
                className="mc-slider"
                style={{ "--pct": pct } as React.CSSProperties}
                onChange={handleVolumeChange}
              />
              <span className="mc-vol-pct">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <button className="mc-next-btn" onClick={handleNextTrack}>
              ⏭ Next Track
            </button>
          </div>
        )}
        <div className="mc-btns">
          <button
            className={`mc-icon-btn${settings.muted ? " muted" : ""}`}
            onClick={toggleMute}
            aria-label={settings.muted ? "Unmute music" : "Mute music"}
            title={settings.muted ? "Unmute music" : "Mute music"}
          >
            {settings.muted ? "🔇" : "🔊"}
          </button>
          <button
            className={`mc-icon-btn${popoutOpen ? " active" : ""}`}
            onClick={togglePopout}
            aria-label="Music controls"
            title="Music volume & next track"
          >
            🎵
          </button>
        </div>
      </div>
    </>
  );
}
