import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk, SignIn } from "@clerk/react";
import { audioManager, ALL_FILE_TRACKS, type FileTrack } from "@/lib/audio";
import { useSettings } from "@/context/SettingsContext";

export default function TitleScreen() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [visible, setVisible] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "music">("general");
  const [disabledSrcs, setDisabledSrcs] = useState<string[]>(() => {
    try { const r = localStorage.getItem("ts_disabled_tracks"); return r ? JSON.parse(r) as string[] : []; } catch { return []; }
  });
  const [libWarnSrc, setLibWarnSrc] = useState<string | null>(null);
  const [libPlayingSrc, setLibPlayingSrc] = useState<string | null>(null);
  const [libIsPaused, setLibIsPaused] = useState(false);
  const {
    settings, setVolume, setMuted, setSfxEnabled,
    setAiDifficulty, setShowDamageNumbers, setAnimationSpeed, resetDefaults,
  } = useSettings();

  const syncDisabled = useCallback(() => {
    try { const r = localStorage.getItem("ts_disabled_tracks"); setDisabledSrcs(r ? JSON.parse(r) as string[] : []); } catch { setDisabledSrcs([]); }
  }, []);

  useEffect(() => { if (showSettings) syncDisabled(); }, [showSettings, syncDisabled]);

  const handleLibToggle = useCallback((track: FileTrack, enabled: boolean) => {
    const ok = audioManager.setTrackEnabled(track.src, enabled);
    if (!ok) {
      setLibWarnSrc(track.src);
      setTimeout(() => setLibWarnSrc(null), 2800);
    }
    syncDisabled();
  }, [syncDisabled]);

  const handleLibPlay = useCallback((src: string) => {
    if (libPlayingSrc === src) {
      if (libIsPaused) { audioManager.resumeMusic(); setLibIsPaused(false); }
      else { audioManager.pauseMusic(); setLibIsPaused(true); }
    } else {
      audioManager.playFileTrack(src);
      setLibPlayingSrc(src);
      setLibIsPaused(false);
    }
  }, [libPlayingSrc, libIsPaused]);

  function enterWarRoom() {
    navigate("/warroom");
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    const tryPlay = () => audioManager.play("hub");
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay as EventListener, { once: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay as EventListener);
      // Do NOT stop music — let it persist to war room and other menu screens
    };
  }, []);


  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="ts-root">
      <style>{CSS}</style>

      <div className="ts-bg" />
      <div className="ts-overlay" />
      <div className="ts-tower ts-tower-l" />
      <div className="ts-tower ts-tower-r" />

      <div className="ts-corner-credit">Alta Studios</div>

      <button
        className="ts-sound-toggle"
        onClick={() => setMuted(!settings.muted)}
        aria-label={settings.muted ? "Unmute music" : "Mute music"}
        title={settings.muted ? "Unmute music" : "Mute music"}
      >
        {settings.muted ? "🔇" : "♪"}
      </button>

      <div className={`ts-content${visible ? " ts-visible" : ""}`}>
        <div className="ts-logo-block">
          <span className="ts-logo-text">TOWER SEEKERS</span>
        </div>
        <div className="ts-tagline">Climb the Four. Claim the Sky.</div>

        <div className="ts-menu">
          {isLoaded && isSignedIn ? (
            <button className="ts-menu-btn ts-btn-login" onClick={enterWarRoom}>
              Continue
            </button>
          ) : (
            <button className="ts-menu-btn ts-btn-login" onClick={() => setShowLogin(true)}>
              Begin Your Journey
            </button>
          )}
          <button className="ts-menu-btn ts-btn-settings" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="ts-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-title">Settings</div>

            <div className="ts-tabs">
              <button
                className={`ts-tab${settingsTab === "general" ? " active" : ""}`}
                onClick={() => setSettingsTab("general")}
              >
                General
              </button>
              <button
                className={`ts-tab${settingsTab === "music" ? " active" : ""}`}
                onClick={() => setSettingsTab("music")}
              >
                🎵 Music Library
              </button>
            </div>

            {settingsTab === "general" && (
              <>
                <div className="ts-section-label">Audio</div>
                <div className="ts-setting-row">
                  <label className="ts-lbl">Music</label>
                  <button className={`ts-toggle${settings.muted ? " off" : " on"}`} onClick={() => setMuted(!settings.muted)}>
                    {settings.muted ? "Off" : "On"}
                  </button>
                </div>
                <div className="ts-setting-row">
                  <label className="ts-lbl">Volume</label>
                  <input type="range" min={0} max={1} step={0.01} value={settings.volume} className="ts-slider"
                    onChange={(e) => setVolume(parseFloat(e.target.value))} />
                  <span className="ts-val">{Math.round(settings.volume * 100)}%</span>
                </div>
                <div className="ts-setting-row">
                  <label className="ts-lbl">Sound FX</label>
                  <button className={`ts-toggle${settings.sfxEnabled ? " on" : " off"}`} onClick={() => setSfxEnabled(!settings.sfxEnabled)}>
                    {settings.sfxEnabled ? "On" : "Off"}
                  </button>
                </div>

                <div className="ts-section-label">AI Opponent</div>
                <div className="ts-setting-row">
                  <label className="ts-lbl">Difficulty</label>
                  <div className="ts-radio-group">
                    {(["easy", "normal", "hard"] as const).map((d) => (
                      <button key={d} className={`ts-radio${settings.aiDifficulty === d ? " active" : ""}`} onClick={() => setAiDifficulty(d)}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ts-section-label">Battle</div>
                <div className="ts-setting-row">
                  <label className="ts-lbl">Damage Numbers</label>
                  <button className={`ts-toggle${settings.showDamageNumbers ? " on" : " off"}`} onClick={() => setShowDamageNumbers(!settings.showDamageNumbers)}>
                    {settings.showDamageNumbers ? "On" : "Off"}
                  </button>
                </div>
                <div className="ts-setting-row">
                  <label className="ts-lbl">Animation Speed</label>
                  <div className="ts-radio-group">
                    {(["slow", "normal", "fast"] as const).map((s) => (
                      <button key={s} className={`ts-radio${settings.animationSpeed === s ? " active" : ""}`} onClick={() => setAnimationSpeed(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {settingsTab === "music" && (
              <>
                <div className="ts-section-label">Music Library</div>
                <div className="ts-lib-list">
                  {ALL_FILE_TRACKS.map(track => {
                    const enabled = !disabledSrcs.includes(track.src);
                    const isActive = libPlayingSrc === track.src && !libIsPaused;
                    const isThisPaused = libPlayingSrc === track.src && libIsPaused;
                    return (
                      <div key={track.src} className={`ts-lib-row${enabled ? "" : " ts-lib-disabled"}`}>
                        <label className="ts-lib-toggle-wrap">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={e => handleLibToggle(track, e.target.checked)}
                          />
                          <span className="ts-lib-toggle-track" />
                          <span className="ts-lib-toggle-thumb" />
                        </label>
                        <div className="ts-lib-info">
                          <div className="ts-lib-title">{track.title}</div>
                          <div className="ts-lib-meta">
                            <span className={`ts-lib-badge ts-lib-badge-${track.category}`}>
                              {track.category === "battle" ? "Battle" : "Ambient"}
                            </span>
                            <span className="ts-lib-duration">{track.duration}</span>
                          </div>
                        </div>
                        <button
                          className={`ts-lib-play${isActive ? " ts-lib-play-active" : ""}`}
                          onClick={() => handleLibPlay(track.src)}
                          title={isActive ? "Pause" : isThisPaused ? "Resume" : "Play"}
                          aria-label={isActive ? `Pause ${track.title}` : `Play ${track.title}`}
                        >
                          {isActive ? "⏸" : "▶"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {libWarnSrc && (
                  <div className="ts-lib-warn">
                    ⚠ At least one {ALL_FILE_TRACKS.find(t => t.src === libWarnSrc)?.category ?? ""} track must stay enabled
                  </div>
                )}
              </>
            )}

            <div className="ts-modal-footer">
              {settingsTab === "general" && (
                <button className="ts-btn-sm" onClick={resetDefaults}>Reset Defaults</button>
              )}
              <button className="ts-btn-sm ts-btn-sm-primary" onClick={() => setShowSettings(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Clerk sign-in modal */}
      {showLogin && (
        <div className="ts-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="ts-clerk-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="ts-close-clerk" onClick={() => setShowLogin(false)} aria-label="Close">✕</button>
            <SignIn
              routing="hash"
              forceRedirectUrl={`${basePath}/`}
              fallbackRedirectUrl={`${basePath}/`}
            />
          </div>
        </div>
      )}

    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&family=Orbitron:wght@300&display=swap');

  .ts-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #07040f;
    font-family: 'Cinzel', serif;
  }

  .ts-bg {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-menu-bg.png');
    background-size: cover;
    background-position: center 40%;
    filter: brightness(0.72);
    z-index: 0;
  }

  .ts-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(4,2,10,0.22) 0%,
      rgba(4,2,10,0.18) 45%,
      rgba(4,2,10,0.65) 100%
    );
    z-index: 1;
    pointer-events: none;
  }

  .ts-tower {
    position: absolute;
    top: 0;
    bottom: 0;
    width: clamp(24px, 3.5vw, 52px);
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(180deg,
      rgba(30,14,60,0.0) 0%,
      rgba(20,10,40,0.55) 40%,
      rgba(10,5,22,0.82) 100%
    );
  }
  .ts-tower-l { left: 0; border-right: 1px solid rgba(240,192,64,0.10); }
  .ts-tower-r { right: 0; border-left: 1px solid rgba(240,192,64,0.10); }

  .ts-corner-credit {
    position: absolute;
    bottom: clamp(10px,1.8vh,18px);
    right: clamp(14px,2.5vw,24px);
    z-index: 10;
    font-family: 'Orbitron', 'Cinzel', serif;
    font-size: clamp(9px,0.9vw,12px);
    font-weight: 300;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.18);
    pointer-events: none;
    user-select: none;
  }

  .ts-sound-toggle {
    position: absolute;
    top: clamp(12px,2vh,20px);
    right: clamp(14px,2.5vw,24px);
    z-index: 20;
    background: rgba(10,6,22,0.72);
    border: 1px solid rgba(240,192,64,0.28);
    border-radius: 50%;
    width: clamp(36px,3.5vw,46px);
    height: clamp(36px,3.5vw,46px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(16px,1.6vw,20px);
    cursor: pointer;
    color: rgba(240,192,64,0.8);
    transition: all 0.18s;
    backdrop-filter: blur(6px);
  }
  .ts-sound-toggle:hover {
    background: rgba(20,12,40,0.9);
    border-color: rgba(240,192,64,0.55);
    color: #f0c040;
    transform: scale(1.08);
  }

  .ts-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(20px,4vh,48px);
    padding: clamp(20px,4vw,48px);
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 1.1s ease, transform 1.1s ease;
  }
  .ts-content.ts-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .ts-logo-block {
    display: flex;
    align-items: center;
    gap: clamp(10px,1.5vw,18px);
  }
  .ts-logo-text {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(32px, 6.2vw, 84px);
    font-weight: 900;
    color: #f5d97a;
    letter-spacing: 0.18em;
    text-shadow:
      0 1px 0 rgba(120, 80, 20, 0.9),
      0 2px 0 rgba(80, 50, 10, 0.85),
      0 4px 14px rgba(0, 0, 0, 0.95),
      0 0 40px rgba(240, 192, 64, 0.35),
      0 0 80px rgba(240, 192, 64, 0.15);
    white-space: nowrap;
  }

  .ts-tagline {
    font-family: 'Cinzel', serif;
    font-size: clamp(11px, 1.2vw, 15px);
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: rgba(240, 215, 150, 0.78);
    text-shadow: 0 2px 8px rgba(0,0,0,0.9);
    margin-top: -8px;
    text-align: center;
  }



  .ts-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(10px,1.5vh,16px);
    width: 100%;
    max-width: 340px;
  }

  .ts-menu-btn {
    width: 100%;
    padding: clamp(14px,2vh,20px) clamp(20px,3vw,32px);
    border-radius: 12px;
    font-family: 'Cinzel', serif;
    font-size: clamp(12px,1.3vw,16px);
    letter-spacing: 0.12em;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    border: 1px solid transparent;
    position: relative;
  }
  .ts-menu-btn::before,
  .ts-menu-btn::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1px solid rgba(240, 192, 64, 0);
    transition: border-color 0.2s, width 0.2s, height 0.2s;
    pointer-events: none;
  }
  .ts-menu-btn::before {
    top: 4px; left: 4px;
    border-right: none; border-bottom: none;
  }
  .ts-menu-btn::after {
    bottom: 4px; right: 4px;
    border-left: none; border-top: none;
  }
  .ts-menu-btn:hover::before,
  .ts-menu-btn:hover::after {
    border-color: rgba(255, 220, 120, 0.75);
    width: 14px;
    height: 14px;
  }

  .ts-btn-login {
    background: linear-gradient(180deg, rgba(60, 38, 14, 0.92), rgba(36, 22, 8, 0.94));
    border: 1px solid rgba(240, 192, 64, 0.55);
    color: #f5d97a;
    box-shadow:
      0 2px 14px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 220, 120, 0.18),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
  .ts-btn-login:hover {
    background: linear-gradient(180deg, rgba(80, 52, 20, 0.96), rgba(50, 32, 12, 0.96));
    border-color: rgba(255, 220, 120, 0.85);
    color: #fde7a3;
    box-shadow:
      0 4px 20px rgba(240, 192, 64, 0.25),
      inset 0 1px 0 rgba(255, 230, 140, 0.25),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    transform: translateY(-1px);
  }
  .ts-btn-login:active { transform: translateY(0); }

  .ts-btn-settings {
    background: rgba(10,6,22,0.88);
    border-color: rgba(240,192,64,0.4);
    color: rgba(240,192,64,0.9);
    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
  }
  .ts-btn-settings:hover {
    background: rgba(18,10,38,0.94);
    border-color: rgba(240,192,64,0.65);
    color: #f0d060;
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(0,0,0,0.6);
  }
  .ts-btn-settings:active { transform: translateY(0); }

  /* ── Clerk wrapper ── */
  .ts-clerk-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ts-close-clerk {
    position: absolute;
    top: -12px;
    right: -12px;
    z-index: 10;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(10,5,24,0.95);
    border: 1px solid rgba(240,192,64,0.3);
    color: rgba(240,192,64,0.7);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .ts-close-clerk:hover {
    border-color: rgba(240,192,64,0.6);
    color: #f0c040;
    background: rgba(20,10,40,0.98);
  }

  /* ── Settings modal ── */
  .ts-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(6px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .ts-modal {
    background: linear-gradient(160deg, #0d0921 0%, #070511 100%);
    border: 1px solid rgba(240,192,64,0.25);
    border-radius: 14px;
    padding: 2rem;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(240,192,64,0.08) inset;
    max-height: 90vh;
    overflow-y: auto;
  }
  .ts-modal-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f0e0a0;
    text-align: center;
    margin-bottom: 1.5rem;
    letter-spacing: 0.08em;
  }
  .ts-section-label {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(240,192,64,0.5);
    border-bottom: 1px solid rgba(240,192,64,0.12);
    padding-bottom: 0.3rem;
    margin: 1.2rem 0 0.8rem;
  }
  .ts-setting-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.7rem;
  }
  .ts-lbl {
    font-family: 'Cinzel', serif;
    font-size: 0.78rem;
    color: rgba(200,170,100,0.8);
    min-width: 120px;
  }
  .ts-toggle {
    padding: 0.3rem 0.9rem;
    border-radius: 6px;
    border: 1px solid rgba(240,192,64,0.25);
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    cursor: pointer;
    letter-spacing: 0.08em;
    transition: all 0.15s;
  }
  .ts-toggle.on  { background: rgba(240,192,64,0.15); color: #f0c040; }
  .ts-toggle.off { background: rgba(80,60,40,0.15); color: rgba(180,150,100,0.5); }
  .ts-slider {
    flex: 1;
    accent-color: #f0c040;
  }
  .ts-val {
    font-size: 0.75rem;
    color: rgba(240,192,64,0.7);
    min-width: 38px;
    text-align: right;
  }
  .ts-radio-group { display: flex; gap: 6px; }
  .ts-radio {
    padding: 0.28rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(240,192,64,0.18);
    background: rgba(20,12,40,0.6);
    color: rgba(180,150,100,0.6);
    font-family: 'Cinzel', serif;
    font-size: 0.68rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ts-radio.active {
    background: rgba(240,192,64,0.18);
    border-color: rgba(240,192,64,0.5);
    color: #f0c040;
  }
  .ts-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    border-top: 1px solid rgba(240,192,64,0.1);
    padding-top: 1rem;
  }
  .ts-btn-sm {
    padding: 0.38rem 1rem;
    border-radius: 7px;
    border: 1px solid rgba(240,192,64,0.22);
    background: rgba(20,12,40,0.7);
    color: rgba(200,170,100,0.7);
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.06em;
  }
  .ts-btn-sm:hover { border-color: rgba(240,192,64,0.45); color: #f0d070; }
  .ts-btn-sm-primary {
    background: rgba(240,192,64,0.16);
    border-color: rgba(240,192,64,0.45);
    color: #f0c040;
  }
  .ts-btn-sm-primary:hover {
    background: rgba(240,192,64,0.26);
    box-shadow: 0 0 12px rgba(240,192,64,0.15);
  }

  /* ── Settings tabs ── */
  .ts-tabs {
    display: flex; gap: 4px; margin-bottom: 1rem;
  }
  .ts-tab {
    font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    border: 1px solid rgba(240,192,64,0.18); border-radius: 6px;
    padding: 0.3rem 0.75rem; cursor: pointer;
    background: rgba(255,255,255,0.03); color: rgba(200,170,100,0.45);
    transition: all 0.14s;
  }
  .ts-tab:hover { color: rgba(240,192,64,0.75); border-color: rgba(240,192,64,0.32); }
  .ts-tab.active {
    background: rgba(240,192,64,0.14); border-color: rgba(240,192,64,0.5);
    color: #f0c040;
  }

  /* ── Music Library ── */
  .ts-lib-list {
    display: flex; flex-direction: column;
    border: 1px solid rgba(240,192,64,0.1); border-radius: 8px;
    overflow: hidden; max-height: 300px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: rgba(240,192,64,0.15) transparent;
  }
  .ts-lib-list::-webkit-scrollbar { width: 3px; }
  .ts-lib-list::-webkit-scrollbar-thumb { background: rgba(240,192,64,0.15); border-radius: 2px; }

  .ts-lib-row {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid rgba(240,192,64,0.06);
    transition: background 0.12s;
  }
  .ts-lib-row:last-child { border-bottom: none; }
  .ts-lib-row:hover { background: rgba(240,192,64,0.04); }
  .ts-lib-disabled { opacity: 0.35; }

  .ts-lib-toggle-wrap {
    position: relative; display: inline-flex;
    width: 32px; height: 17px; flex-shrink: 0; cursor: pointer;
  }
  .ts-lib-toggle-wrap input { opacity: 0; width: 0; height: 0; }
  .ts-lib-toggle-track {
    position: absolute; inset: 0; border-radius: 9px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(240,192,64,0.15);
    transition: background 0.18s, border-color 0.18s;
  }
  .ts-lib-toggle-wrap input:checked ~ .ts-lib-toggle-track {
    background: rgba(240,192,64,0.22); border-color: rgba(240,192,64,0.5);
  }
  .ts-lib-toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 11px; height: 11px; border-radius: 50%;
    background: rgba(200,170,100,0.4);
    transition: transform 0.18s, background 0.18s;
  }
  .ts-lib-toggle-wrap input:checked ~ .ts-lib-toggle-thumb {
    transform: translateX(15px); background: #f0c040;
  }

  .ts-lib-info { flex: 1; min-width: 0; }
  .ts-lib-title {
    font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 600;
    color: rgba(220,200,140,0.88); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .ts-lib-meta { display: flex; align-items: center; gap: 0.4rem; margin-top: 2px; }
  .ts-lib-duration {
    font-family: 'Cinzel', serif; font-size: 0.55rem; font-weight: 600;
    color: rgba(180,155,100,0.42); white-space: nowrap;
  }
  .ts-lib-badge {
    display: inline-block; font-family: 'Cinzel', serif;
    font-size: 0.5rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; border-radius: 3px;
    padding: 1px 5px; margin-top: 2px;
  }
  .ts-lib-badge-battle {
    background: rgba(220,80,60,0.18); color: rgba(240,130,110,0.8);
    border: 1px solid rgba(220,80,60,0.25);
  }
  .ts-lib-badge-ambient {
    background: rgba(60,160,220,0.15); color: rgba(110,190,240,0.8);
    border: 1px solid rgba(60,160,220,0.22);
  }

  .ts-lib-play {
    flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(240,192,64,0.28);
    background: rgba(240,192,64,0.05);
    color: rgba(240,192,64,0.55);
    font-size: 0.55rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; line-height: 1; padding: 0; margin-left: auto;
  }
  .ts-lib-play:hover {
    background: rgba(240,192,64,0.14); color: rgba(240,192,64,0.9);
    border-color: rgba(240,192,64,0.55);
  }
  .ts-lib-play.ts-lib-play-active {
    background: rgba(240,192,64,0.18); color: #f0c040;
    border-color: #f0c040; box-shadow: 0 0 7px rgba(240,192,64,0.35);
  }
  .ts-lib-disabled .ts-lib-play { pointer-events: none; opacity: 0.3; }

  .ts-lib-warn {
    font-family: 'Cinzel', serif; font-size: 0.6rem; font-weight: 600;
    color: rgba(240,160,80,0.9); letter-spacing: 0.05em;
    margin-top: 0.4rem;
    padding: 0.3rem 0.6rem;
    background: rgba(240,160,80,0.08);
    border: 1px solid rgba(240,160,80,0.2);
    border-radius: 5px;
  }
`;
