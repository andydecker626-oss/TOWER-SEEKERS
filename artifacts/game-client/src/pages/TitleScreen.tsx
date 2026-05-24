import { useEffect, useState, useCallback } from "react";
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
    const tryPlay = () => audioManager.play("hub");
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay as EventListener, { once: true });
    return () => {
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay as EventListener);
    };
  }, []);


  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="ts-root">
      <style>{CSS}</style>

      <div className="ts-bg">
        <div className="ts-bg-inner" />
      </div>
      <div className="ts-overlay" />
      <div className="ts-vignette" />

      <div className="ts-motes">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>

      <div className="ts-tower ts-tower-l" />
      <div className="ts-tower ts-tower-r" />

      <button
        className="ts-sound-toggle"
        onClick={() => setMuted(!settings.muted)}
        aria-label={settings.muted ? "Unmute music" : "Mute music"}
        title={settings.muted ? "Unmute music" : "Mute music"}
      >
        {settings.muted ? "🔇" : "♪"}
      </button>

      <div className="ts-content">
        <div className="ts-logo-block">
          <div className="ts-sigil">
            <svg viewBox="0 0 44 44" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2 L42 22 L22 42 L2 22 Z" stroke="#c8960d" strokeWidth="1.4" fill="rgba(200,150,13,0.04)"/>
              <line x1="22" y1="14" x2="22" y2="30" stroke="#c8960d" strokeWidth="0.7" strokeOpacity="0.5"/>
              <line x1="14" y1="22" x2="30" y2="22" stroke="#c8960d" strokeWidth="0.7" strokeOpacity="0.5"/>
              <rect x="19.5" y="7" width="5" height="7" fill="#c8960d" rx="0.4"/>
              <rect x="18.5" y="7" width="1.8" height="2.5" fill="#07040f"/>
              <rect x="21.1" y="7" width="1.8" height="2.5" fill="#07040f"/>
              <rect x="23.7" y="7" width="1.3" height="2.5" fill="#07040f"/>
              <rect x="19.5" y="30" width="5" height="7" fill="#c8960d" rx="0.4"/>
              <rect x="18.5" y="34.5" width="1.8" height="2.5" fill="#07040f"/>
              <rect x="21.1" y="34.5" width="1.8" height="2.5" fill="#07040f"/>
              <rect x="23.7" y="34.5" width="1.3" height="2.5" fill="#07040f"/>
              <rect x="7" y="19.5" width="7" height="5" fill="#c8960d" rx="0.4"/>
              <rect x="30" y="19.5" width="7" height="5" fill="#c8960d" rx="0.4"/>
              <circle cx="22" cy="22" r="2.2" fill="#c8960d"/>
              <circle cx="22" cy="22" r="1.1" fill="#07040f"/>
            </svg>
          </div>
          <span className="ts-logo-text">TOWER SEEKERS</span>
          <div className="ts-tagline">An age of towers. A world to wake.</div>
        </div>

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

      <footer className="ts-footer">
        <span className="ts-footer-left">Alta Studios</span>
        <span className="ts-footer-right">v0.1.0&nbsp;·&nbsp;Pre-Alpha</span>
      </footer>

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
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@700;900&family=Orbitron:wght@300&display=swap');

  :root {
    --ts-fg:        #e8edf5;
    --ts-fg-dim:    rgba(180,190,210,0.65);
    --ts-pearl-1:   #ffffff;
    --ts-pearl-2:   #dde2ec;
    --ts-pearl-3:   #aab2c2;
    --ts-cool-glow: rgba(120,140,220,0.22);
    --ts-deep:      #07040f;
    --ts-ink:       rgba(4,2,10,0.92);
    --ts-gold-deep: #c8960d;
    --ts-vignette:  rgba(4,2,10,0.82);
  }

  @keyframes tsRise {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes tsBreath {
    0%, 100% { box-shadow: 0 2px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(200,220,255,0.1), 0 0 0 0 rgba(120,150,255,0); }
    50%       { box-shadow: 0 4px 22px rgba(0,0,0,0.7), inset 0 1px 0 rgba(200,220,255,0.14), 0 0 18px 2px rgba(100,130,220,0.12); }
  }

  @keyframes tsMoteRise {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(-100vh) translateX(calc((var(--i, 0) % 3 - 1) * 40px)) scale(0.5); opacity: 0; }
  }

  .ts-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ts-deep);
    font-family: 'Cinzel', serif;
  }

  .ts-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .ts-bg-inner {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-menu-bg.png');
    background-size: cover;
    background-position: center 40%;
    filter: brightness(0.72);
  }

  .ts-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(4,2,10,0.18) 0%,
      rgba(4,2,10,0.12) 40%,
      rgba(4,2,10,0.62) 100%
    );
    z-index: 1;
    pointer-events: none;
  }

  .ts-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(4,2,10,0.55) 72%, rgba(4,2,10,0.88) 100%);
    z-index: 2;
    pointer-events: none;
  }

  .ts-motes {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    overflow: hidden;
  }
  .ts-motes span {
    position: absolute;
    bottom: -10px;
    left: calc(6% + (var(--i, 0) * 6.5%));
    width: clamp(1px, 0.18vw, 2.5px);
    height: clamp(1px, 0.18vw, 2.5px);
    border-radius: 50%;
    background: rgba(160,180,240,0.55);
    animation: tsMoteRise calc(14s + (var(--i, 0) * 2.1s)) calc(var(--i, 0) * -3.3s) linear infinite;
  }
  .ts-motes span:nth-child(3n+2) { background: rgba(180,200,255,0.4); width: 1.5px; height: 1.5px; }
  .ts-motes span:nth-child(5n)   { background: rgba(200,220,255,0.3); }

  .ts-tower {
    position: absolute;
    top: 0;
    bottom: 0;
    width: clamp(20px, 3vw, 44px);
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(180deg,
      rgba(30,14,60,0.0) 0%,
      rgba(20,10,40,0.14) 40%,
      rgba(10,5,22,0.22) 100%
    );
  }
  .ts-tower-l { left: 0;  border-right: 1px solid rgba(160,180,240,0.06); }
  .ts-tower-r { right: 0; border-left:  1px solid rgba(160,180,240,0.06); }

  .ts-sound-toggle {
    position: absolute;
    top: clamp(12px,2vh,20px);
    right: clamp(14px,2.5vw,24px);
    z-index: 20;
    background: rgba(10,6,22,0.72);
    border: 1px solid rgba(160,180,240,0.22);
    border-radius: 50%;
    width: clamp(36px,3.5vw,46px);
    height: clamp(36px,3.5vw,46px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(16px,1.6vw,20px);
    cursor: pointer;
    color: rgba(180,200,240,0.7);
    transition: all 0.18s;
    backdrop-filter: blur(6px);
  }
  .ts-sound-toggle:hover {
    background: rgba(20,12,40,0.9);
    border-color: rgba(180,200,255,0.45);
    color: var(--ts-pearl-2);
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
  }

  .ts-logo-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(6px,1vh,12px);
  }

  .ts-sigil {
    opacity: 0;
    animation: tsRise 0.9s ease forwards;
    animation-delay: 0ms;
    filter: drop-shadow(0 0 10px rgba(200,150,13,0.35));
  }

  .ts-logo-text {
    font-family: 'Cinzel', serif;
    font-size: clamp(28px, 5.8vw, 80px);
    font-weight: 500;
    letter-spacing: 0.18em;
    background: linear-gradient(180deg, var(--ts-pearl-1) 0%, var(--ts-pearl-2) 50%, var(--ts-pearl-3) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 2px 8px rgba(80,100,180,0.28));
    white-space: nowrap;
    opacity: 0;
    animation: tsRise 0.9s ease forwards;
    animation-delay: 200ms;
  }

  .ts-tagline {
    font-family: 'Cinzel', serif;
    font-size: clamp(10px, 1.05vw, 13px);
    font-style: italic;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--ts-fg-dim);
    text-shadow: 0 2px 8px rgba(0,0,0,0.9);
    text-align: center;
    opacity: 0;
    animation: tsRise 0.9s ease forwards;
    animation-delay: 1100ms;
  }

  .ts-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(10px,1.5vh,16px);
    width: 100%;
    max-width: 340px;
    opacity: 0;
    animation: tsRise 0.9s ease forwards;
    animation-delay: 1600ms;
  }

  .ts-menu-btn {
    width: 100%;
    padding: clamp(14px,2vh,20px) clamp(20px,3vw,32px);
    border-radius: 12px;
    font-family: 'Cinzel', serif;
    font-size: clamp(11px,1.2vw,15px);
    letter-spacing: 0.12em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    position: relative;
  }
  .ts-menu-btn::before,
  .ts-menu-btn::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1px solid transparent;
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
    border-color: rgba(180,200,255,0.55);
    width: 14px;
    height: 14px;
  }

  .ts-btn-login {
    background: rgba(10,8,28,0.82);
    border: 1px solid rgba(180,200,255,0.38);
    color: var(--ts-pearl-2);
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    animation: tsBreath 3.5s ease-in-out infinite;
    animation-delay: 2s;
  }
  .ts-btn-login:hover {
    background: rgba(16,14,40,0.92);
    border-color: rgba(200,220,255,0.65);
    color: var(--ts-pearl-1);
    box-shadow: 0 4px 22px rgba(80,110,220,0.22), inset 0 1px 0 rgba(200,220,255,0.15);
    transform: translateY(-1px);
  }
  .ts-btn-login:active { transform: translateY(0); }

  .ts-btn-settings {
    background: rgba(8,6,20,0.72);
    border: 1px solid rgba(140,160,220,0.22);
    color: rgba(160,180,220,0.72);
  }
  .ts-btn-settings:hover {
    background: rgba(14,10,32,0.88);
    border-color: rgba(160,180,240,0.42);
    color: var(--ts-pearl-2);
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(0,0,0,0.5);
  }
  .ts-btn-settings:active { transform: translateY(0); }

  .ts-footer {
    position: absolute;
    bottom: clamp(8px,1.5vh,16px);
    left: clamp(14px,2.5vw,24px);
    right: clamp(14px,2.5vw,24px);
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    pointer-events: none;
    user-select: none;
  }
  .ts-footer-left {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(160,180,220,0.28);
  }
  .ts-footer-right {
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: rgba(140,160,200,0.25);
  }

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
    border: 1px solid rgba(160,180,240,0.25);
    color: rgba(160,180,240,0.6);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .ts-close-clerk:hover {
    border-color: rgba(180,200,255,0.5);
    color: var(--ts-pearl-2);
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
    border: 1px solid rgba(160,180,240,0.18);
    border-radius: 14px;
    padding: 2rem;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(160,180,240,0.06) inset;
    max-height: 90vh;
    overflow-y: auto;
  }
  .ts-modal-title {
    font-family: 'Cinzel', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--ts-pearl-2);
    text-align: center;
    margin-bottom: 1.5rem;
    letter-spacing: 0.12em;
  }
  .ts-section-label {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(160,180,240,0.45);
    border-bottom: 1px solid rgba(160,180,240,0.1);
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
    color: rgba(180,195,225,0.7);
    min-width: 120px;
  }
  .ts-toggle {
    padding: 0.3rem 0.9rem;
    border-radius: 6px;
    border: 1px solid rgba(160,180,240,0.22);
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    cursor: pointer;
    letter-spacing: 0.08em;
    transition: all 0.15s;
  }
  .ts-toggle.on  { background: rgba(140,160,240,0.14); color: var(--ts-pearl-2); }
  .ts-toggle.off { background: rgba(60,60,80,0.15); color: rgba(140,155,190,0.45); }
  .ts-slider {
    flex: 1;
    accent-color: var(--ts-pearl-3);
  }
  .ts-val {
    font-size: 0.75rem;
    color: rgba(160,180,240,0.6);
    min-width: 38px;
    text-align: right;
  }
  .ts-radio-group { display: flex; gap: 6px; }
  .ts-radio {
    padding: 0.28rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(160,180,240,0.15);
    background: rgba(20,12,40,0.6);
    color: rgba(150,165,200,0.55);
    font-family: 'Cinzel', serif;
    font-size: 0.68rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ts-radio.active {
    background: rgba(140,160,240,0.16);
    border-color: rgba(160,180,240,0.45);
    color: var(--ts-pearl-2);
  }
  .ts-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    border-top: 1px solid rgba(160,180,240,0.08);
    padding-top: 1rem;
  }
  .ts-btn-sm {
    padding: 0.38rem 1rem;
    border-radius: 7px;
    border: 1px solid rgba(160,180,240,0.18);
    background: rgba(20,12,40,0.7);
    color: rgba(170,185,220,0.65);
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.06em;
  }
  .ts-btn-sm:hover { border-color: rgba(180,200,255,0.38); color: var(--ts-pearl-2); }
  .ts-btn-sm-primary {
    background: rgba(140,160,240,0.14);
    border-color: rgba(160,180,240,0.38);
    color: var(--ts-pearl-2);
  }
  .ts-btn-sm-primary:hover {
    background: rgba(140,160,240,0.22);
    box-shadow: 0 0 12px rgba(120,140,220,0.15);
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
