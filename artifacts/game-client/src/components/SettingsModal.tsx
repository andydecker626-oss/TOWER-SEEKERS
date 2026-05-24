import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { useSocket } from "@/context/SocketContext";
import { audioManager, ALL_FILE_TRACKS, type FileTrack } from "@/lib/audio";

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap');

  .sm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .sm-modal {
    background: linear-gradient(160deg, #0e0a22 0%, #080618 100%);
    border: 1px solid rgba(240,192,64,0.28);
    border-radius: 14px; padding: 2rem;
    width: 100%; max-width: 440px;
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 72px rgba(0,0,0,0.85), 0 0 40px rgba(240,192,64,0.06);
    scrollbar-width: thin; scrollbar-color: rgba(240,192,64,0.2) transparent;
  }
  .sm-modal::-webkit-scrollbar { width: 4px; }
  .sm-modal::-webkit-scrollbar-track { background: transparent; }
  .sm-modal::-webkit-scrollbar-thumb { background: rgba(240,192,64,0.2); border-radius: 2px; }

  .sm-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.6rem;
    border-bottom: 1px solid rgba(240,192,64,0.12);
    padding-bottom: 0.9rem;
  }
  .sm-title {
    font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase; color: #f0c040;
  }
  .sm-close-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(200,170,100,0.4); font-size: 1.1rem; line-height: 1;
    padding: 2px 6px; border-radius: 5px; transition: color 0.15s;
  }
  .sm-close-btn:hover { color: #f0c040; }

  .sm-tabs {
    display: flex; gap: 4px; margin-bottom: 1.4rem;
  }
  .sm-tab {
    font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid rgba(240,192,64,0.18); border-radius: 6px;
    padding: 0.32rem 0.75rem; cursor: pointer;
    background: rgba(255,255,255,0.03); color: rgba(200,170,100,0.45);
    transition: all 0.14s;
  }
  .sm-tab:hover { color: rgba(240,192,64,0.75); border-color: rgba(240,192,64,0.32); }
  .sm-tab.active {
    background: rgba(240,192,64,0.14); border-color: rgba(240,192,64,0.5);
    color: #f0c040;
  }

  .sm-section-label {
    font-family: 'Cinzel', serif; font-size: 0.6rem; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(200,170,100,0.42); margin-bottom: 0.75rem; margin-top: 1.25rem;
  }
  .sm-section-label:first-of-type { margin-top: 0; }

  .sm-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.85rem; gap: 0.75rem;
  }
  .sm-label {
    font-family: 'Cinzel', serif; font-size: 0.78rem; font-weight: 600;
    color: rgba(200,170,100,0.82); white-space: nowrap; min-width: 110px;
  }
  .sm-slider-wrap {
    display: flex; align-items: center; gap: 0.55rem; flex: 1;
  }
  .sm-slider {
    -webkit-appearance: none; appearance: none;
    flex: 1; height: 4px; border-radius: 2px; outline: none; cursor: pointer;
    background: linear-gradient(to right, #f0c040 var(--pct, 50%), rgba(255,255,255,0.1) var(--pct, 50%));
  }
  .sm-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: #f0c040; box-shadow: 0 0 6px rgba(240,192,64,0.55);
    cursor: pointer; transition: transform 0.1s;
  }
  .sm-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
  .sm-slider::-moz-range-thumb {
    width: 14px; height: 14px; border-radius: 50%; border: none;
    background: #f0c040; box-shadow: 0 0 6px rgba(240,192,64,0.55);
    cursor: pointer;
  }
  .sm-vol-pct {
    font-family: 'Cinzel', serif; font-size: 0.68rem; font-weight: 600;
    color: rgba(200,170,100,0.6); min-width: 34px; text-align: right;
  }

  .sm-toggle-row {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.7rem;
  }
  .sm-toggle {
    position: relative; display: inline-flex;
    width: 38px; height: 20px; flex-shrink: 0; cursor: pointer;
  }
  .sm-toggle input { opacity: 0; width: 0; height: 0; }
  .sm-toggle-track {
    position: absolute; inset: 0; border-radius: 10px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(240,192,64,0.18);
    transition: background 0.18s, border-color 0.18s;
  }
  .sm-toggle input:checked ~ .sm-toggle-track {
    background: rgba(240,192,64,0.25); border-color: rgba(240,192,64,0.55);
  }
  .sm-toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 14px; height: 14px; border-radius: 50%;
    background: rgba(200,170,100,0.45);
    transition: transform 0.18s, background 0.18s;
  }
  .sm-toggle input:checked ~ .sm-toggle-thumb {
    transform: translateX(18px); background: #f0c040;
  }

  .sm-select {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(240,192,64,0.2);
    border-radius: 7px; color: rgba(200,170,100,0.85);
    font-family: 'Cinzel', serif; font-size: 0.72rem;
    padding: 0.35rem 0.6rem; cursor: pointer; outline: none; transition: border-color 0.15s;
  }
  .sm-select:focus { border-color: rgba(240,192,64,0.5); }
  .sm-select option { background: #0e0a22; color: #f0c040; }

  .sm-seg {
    display: flex; gap: 3px;
  }
  .sm-seg-btn {
    font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.05em;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(240,192,64,0.18);
    border-radius: 5px; padding: 0.28rem 0.6rem; cursor: pointer; color: rgba(200,170,100,0.55);
    transition: all 0.13s;
  }
  .sm-seg-btn:hover { color: rgba(240,192,64,0.8); border-color: rgba(240,192,64,0.35); }
  .sm-seg-btn.active { background: rgba(240,192,64,0.18); border-color: rgba(240,192,64,0.5); color: #f0c040; }

  .sm-footer {
    display: flex; flex-direction: column; gap: 0.75rem;
    margin-top: 1.6rem; padding-top: 1rem;
    border-top: 1px solid rgba(240,192,64,0.1);
  }
  .sm-footer-row {
    display: flex; justify-content: space-between; align-items: center;
  }
  .sm-reset-btn {
    font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase;
    background: none; border: 1px solid rgba(240,192,64,0.18); border-radius: 6px;
    color: rgba(200,170,100,0.45); padding: 0.4rem 0.85rem; cursor: pointer; transition: all 0.15s;
  }
  .sm-reset-btn:hover { color: rgba(200,170,100,0.75); border-color: rgba(240,192,64,0.35); }
  .sm-done-btn {
    font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
    color: #0a0810; border: none; border-radius: 7px;
    padding: 0.5rem 1.5rem; cursor: pointer; transition: filter 0.15s;
  }
  .sm-done-btn:hover { filter: brightness(1.12); }
  .sm-mainmenu-btn {
    width: 100%;
    font-family: 'Cinzel', serif; font-size: 0.68rem; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(200,100,100,0.25);
    border-radius: 7px; color: rgba(220,140,140,0.55);
    padding: 0.5rem 1rem; cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .sm-mainmenu-btn:hover {
    background: rgba(200,60,60,0.1);
    border-color: rgba(220,80,80,0.45);
    color: rgba(240,160,160,0.85);
  }

  /* ── Music Library ──────────────────────────────────────────────────────── */
  .sm-lib-list {
    display: flex; flex-direction: column; gap: 0px;
    border: 1px solid rgba(240,192,64,0.1); border-radius: 8px;
    overflow: hidden; max-height: 280px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: rgba(240,192,64,0.15) transparent;
  }
  .sm-lib-list::-webkit-scrollbar { width: 3px; }
  .sm-lib-list::-webkit-scrollbar-thumb { background: rgba(240,192,64,0.15); border-radius: 2px; }

  .sm-lib-row {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid rgba(240,192,64,0.06);
    transition: background 0.12s;
  }
  .sm-lib-row:last-child { border-bottom: none; }
  .sm-lib-row:hover { background: rgba(240,192,64,0.04); }
  .sm-lib-row.disabled { opacity: 0.38; }

  .sm-lib-toggle {
    position: relative; display: inline-flex;
    width: 32px; height: 17px; flex-shrink: 0; cursor: pointer;
  }
  .sm-lib-toggle input { opacity: 0; width: 0; height: 0; }
  .sm-lib-toggle-track {
    position: absolute; inset: 0; border-radius: 9px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(240,192,64,0.15);
    transition: background 0.18s, border-color 0.18s;
  }
  .sm-lib-toggle input:checked ~ .sm-lib-toggle-track {
    background: rgba(240,192,64,0.22); border-color: rgba(240,192,64,0.5);
  }
  .sm-lib-toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 11px; height: 11px; border-radius: 50%;
    background: rgba(200,170,100,0.4);
    transition: transform 0.18s, background 0.18s;
  }
  .sm-lib-toggle input:checked ~ .sm-lib-toggle-thumb {
    transform: translateX(15px); background: #f0c040;
  }

  .sm-lib-info { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
  .sm-lib-title {
    font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 600;
    color: rgba(220,200,140,0.88); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .sm-lib-duration {
    font-family: 'Cinzel', serif; font-size: 0.58rem; font-weight: 600;
    color: rgba(180,155,100,0.45); white-space: nowrap; margin-left: auto;
  }
  .sm-lib-meta { display: flex; align-items: center; gap: 0.4rem; }
  .sm-lib-badge {
    display: inline-block; font-family: 'Cinzel', serif;
    font-size: 0.52rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; border-radius: 3px;
    padding: 1px 5px; margin-top: 2px;
  }
  .sm-lib-badge.battle {
    background: rgba(220,80,60,0.18); color: rgba(240,130,110,0.8);
    border: 1px solid rgba(220,80,60,0.25);
  }
  .sm-lib-badge.ambient {
    background: rgba(60,160,220,0.15); color: rgba(110,190,240,0.8);
    border: 1px solid rgba(60,160,220,0.22);
  }

  .sm-lib-play {
    flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(240,192,64,0.28);
    background: rgba(240,192,64,0.05);
    color: rgba(240,192,64,0.55);
    font-size: 0.55rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; line-height: 1;
    padding: 0; margin-left: auto;
  }
  .sm-lib-play:hover {
    background: rgba(240,192,64,0.14); color: rgba(240,192,64,0.9);
    border-color: rgba(240,192,64,0.55);
  }
  .sm-lib-play.sm-lib-play-active {
    background: rgba(240,192,64,0.18); color: #f0c040;
    border-color: #f0c040; box-shadow: 0 0 7px rgba(240,192,64,0.35);
  }
  .sm-lib-row.disabled .sm-lib-play { pointer-events: none; opacity: 0.3; }

  .sm-lib-warn {
    font-family: 'Cinzel', serif; font-size: 0.6rem; font-weight: 600;
    color: rgba(240,160,80,0.9); letter-spacing: 0.05em;
    margin-top: 0.45rem;
    padding: 0.3rem 0.6rem;
    background: rgba(240,160,80,0.08);
    border: 1px solid rgba(240,160,80,0.2);
    border-radius: 5px;
    animation: sm-warn-in 0.18s ease;
  }
  @keyframes sm-warn-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = `${Math.round(value * 100)}%`;
  return (
    <div className="sm-slider-wrap">
      <input
        type="range"
        min={0} max={1} step={0.01}
        value={value}
        className="sm-slider"
        style={{ "--pct": pct } as React.CSSProperties}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <span className="sm-vol-pct">{Math.round(value * 100)}%</span>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="sm-toggle-row">
      <label className="sm-toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="sm-toggle-track" />
        <span className="sm-toggle-thumb" />
      </label>
      <span className="sm-label" style={{ minWidth: 0 }}>{label}</span>
    </div>
  );
}

function MusicLibraryPanel() {
  const [disabledSrcs, setDisabledSrcs] = useState<string[]>(() => {
    try { const r = localStorage.getItem("ts_disabled_tracks"); return r ? JSON.parse(r) as string[] : []; } catch { return []; }
  });
  const [warnSrc, setWarnSrc] = useState<string | null>(null);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const syncDisabled = useCallback(() => {
    try { const r = localStorage.getItem("ts_disabled_tracks"); setDisabledSrcs(r ? JSON.parse(r) as string[] : []); } catch { setDisabledSrcs([]); }
  }, []);

  const handleToggle = useCallback((track: FileTrack, enabled: boolean) => {
    const ok = audioManager.setTrackEnabled(track.src, enabled);
    if (!ok) {
      setWarnSrc(track.src);
      setTimeout(() => setWarnSrc(null), 2800);
    }
    syncDisabled();
  }, [syncDisabled]);

  const handlePlay = useCallback((src: string) => {
    if (playingSrc === src) {
      if (isPaused) { audioManager.resumeMusic(); setIsPaused(false); }
      else { audioManager.pauseMusic(); setIsPaused(true); }
    } else {
      audioManager.playFileTrack(src);
      setPlayingSrc(src);
      setIsPaused(false);
    }
  }, [playingSrc, isPaused]);

  return (
    <div>
      <div className="sm-lib-list">
        {ALL_FILE_TRACKS.map(track => {
          const enabled = !disabledSrcs.includes(track.src);
          const isActive = playingSrc === track.src && !isPaused;
          const isThisPaused = playingSrc === track.src && isPaused;
          return (
            <div key={track.src} className={`sm-lib-row${enabled ? "" : " disabled"}`}>
              <label className="sm-lib-toggle">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => handleToggle(track, e.target.checked)}
                />
                <span className="sm-lib-toggle-track" />
                <span className="sm-lib-toggle-thumb" />
              </label>
              <div className="sm-lib-info">
                <div className="sm-lib-title">{track.title}</div>
                <div className="sm-lib-meta">
                  <span className={`sm-lib-badge ${track.category}`}>
                    {track.category === "battle" ? "Battle" : "Ambient"}
                  </span>
                  <span className="sm-lib-duration">{track.duration}</span>
                </div>
              </div>
              <button
                className={`sm-lib-play${isActive ? " sm-lib-play-active" : ""}`}
                onClick={() => handlePlay(track.src)}
                title={isActive ? "Pause" : isThisPaused ? "Resume" : "Play"}
                aria-label={isActive ? `Pause ${track.title}` : `Play ${track.title}`}
              >
                {isActive ? "⏸" : "▶"}
              </button>
            </div>
          );
        })}
      </div>
      {warnSrc && (
        <div className="sm-lib-warn">
          ⚠ At least one {ALL_FILE_TRACKS.find(t => t.src === warnSrc)?.category ?? ""} track must stay enabled
        </div>
      )}
    </div>
  );
}

type Tab = "general" | "music";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { reset } = useSocket();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const {
    settings,
    setVolume, setMusicVolume, setSfxVolume,
    setMuted, setSfxEnabled,
    setAiDifficulty, setShowDamageNumbers, setAnimationSpeed,
    resetDefaults,
  } = useSettings();

  return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="sm-overlay" onClick={onClose}>
        <div className="sm-modal" onClick={e => e.stopPropagation()}>

          <div className="sm-header">
            <span className="sm-title">⚙ Settings</span>
            <button className="sm-close-btn" onClick={onClose} aria-label="Close settings">✕</button>
          </div>

          <div className="sm-tabs">
            <button
              className={`sm-tab${activeTab === "general" ? " active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              General
            </button>
            <button
              className={`sm-tab${activeTab === "music" ? " active" : ""}`}
              onClick={() => setActiveTab("music")}
            >
              🎵 Music Library
            </button>
          </div>

          {activeTab === "general" && (
            <>
              {/* ── Audio ── */}
              <div className="sm-section-label">Audio</div>

              <div className="sm-row">
                <span className="sm-label">Master Volume</span>
                <VolumeSlider value={settings.volume} onChange={setVolume} />
              </div>

              <div className="sm-row">
                <span className="sm-label">Music Volume</span>
                <VolumeSlider value={settings.musicVolume} onChange={setMusicVolume} />
              </div>

              <div className="sm-row">
                <span className="sm-label">SFX Volume</span>
                <VolumeSlider value={settings.sfxVolume} onChange={setSfxVolume} />
              </div>

              <Toggle
                checked={!settings.muted}
                onChange={v => setMuted(!v)}
                label="Music On"
              />

              <Toggle
                checked={settings.sfxEnabled}
                onChange={setSfxEnabled}
                label="Sound FX On"
              />

              {/* ── Gameplay ── */}
              <div className="sm-section-label">Gameplay</div>

              <div className="sm-row">
                <span className="sm-label">AI Difficulty</span>
                <select
                  className="sm-select"
                  value={settings.aiDifficulty}
                  onChange={e => setAiDifficulty(e.target.value as "easy" | "normal" | "hard")}
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <Toggle
                checked={settings.showDamageNumbers}
                onChange={setShowDamageNumbers}
                label="Damage Numbers"
              />

              <div className="sm-row">
                <span className="sm-label">Animation Speed</span>
                <div className="sm-seg">
                  {(["slow", "normal", "fast"] as const).map(s => (
                    <button
                      key={s}
                      className={`sm-seg-btn${settings.animationSpeed === s ? " active" : ""}`}
                      onClick={() => setAnimationSpeed(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "music" && (
            <>
              <div className="sm-section-label">Music Library</div>
              <MusicLibraryPanel />
            </>
          )}

          <div className="sm-footer">
            <div className="sm-footer-row">
              <button className="sm-reset-btn" onClick={resetDefaults}>Reset Defaults</button>
              <button className="sm-done-btn" onClick={onClose}>Done</button>
            </div>
            <button
              className="sm-mainmenu-btn"
              onClick={() => { reset(); audioManager.stop(); navigate("/warroom"); onClose(); }}
            >
              ← Return to Main Menu
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
