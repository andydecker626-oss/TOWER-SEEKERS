import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk, SignIn } from "@clerk/react";
import { audioManager } from "@/lib/audio";
import { useSettings } from "@/context/SettingsContext";

type SplashPhase = "altaris" | "copyright" | null;

export default function TitleScreen() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [visible, setVisible] = useState(false);
  const [splashActive, setSplashActive] = useState(false);
  const [splashPhase, setSplashPhase] = useState<SplashPhase>(null);
  const [splashOpacity, setSplashOpacity] = useState(0);
  const splashMounted = useRef(true);
  const {
    settings, setVolume, setMuted, setSfxEnabled,
    setAiDifficulty, setShowDamageNumbers, setAnimationSpeed, resetDefaults,
  } = useSettings();

  useEffect(() => {
    splashMounted.current = true;
    return () => { splashMounted.current = false; };
  }, []);

  async function enterWarRoom() {
    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    setSplashActive(true);
    // Altaris splash
    setSplashPhase("altaris");
    setSplashOpacity(0);
    await delay(50);
    if (!splashMounted.current) return;
    setSplashOpacity(1);
    await delay(3500);
    if (!splashMounted.current) return;
    setSplashOpacity(0);
    await delay(1100);
    if (!splashMounted.current) return;
    // Copyright splash
    setSplashPhase("copyright");
    setSplashOpacity(0);
    await delay(50);
    if (!splashMounted.current) return;
    setSplashOpacity(1);
    await delay(3500);
    if (!splashMounted.current) return;
    setSplashOpacity(0);
    await delay(1100);
    if (!splashMounted.current) return;
    navigate("/warroom");
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    const tryPlay = () => audioManager.play("skyforge");
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

      <div className="ts-corner-credit">Altaris &mdash; e. 2026</div>

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

        <div className="ts-menu">
          {isLoaded && isSignedIn ? (
            <button className="ts-menu-btn ts-btn-login" onClick={enterWarRoom}>
              Enter the War Room
            </button>
          ) : (
            <button className="ts-menu-btn ts-btn-login" onClick={() => setShowLogin(true)}>
              Login to Tower Seekers
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

            <div className="ts-modal-footer">
              <button className="ts-btn-sm" onClick={resetDefaults}>Reset Defaults</button>
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

      {/* Post-login splash overlay — outer stays solid black, only inner content fades */}
      {splashActive && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{ opacity: splashOpacity, transition: "opacity 1s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {splashPhase === "altaris" && (
              <img
                src="/assets/altaris-logo.png"
                alt="Altaris"
                style={{ width: "90vw", maxWidth: "960px", maxHeight: "60vh", objectFit: "contain" }}
              />
            )}
            {splashPhase === "copyright" && (
              <p style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(27px, 3.5vw, 35px)",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.06em",
                textAlign: "center",
                margin: 0,
              }}>
                &copy; 2026 Seekers Franchise
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

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
    background-image: url('/assets/title-bg.png');
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
    font-family: 'Cinzel', serif;
    font-size: clamp(32px,3vw,40px);
    letter-spacing: 0.14em;
    color: rgba(200,170,100,0.45);
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
    font-size: clamp(28px,5.5vw,72px);
    font-weight: 900;
    color: #f0c040;
    letter-spacing: 0.14em;
    -webkit-text-stroke: 1.5px rgba(255,255,255,0.75);
    text-shadow: 0 0 50px rgba(240,192,64,0.4), 0 2px 12px rgba(0,0,0,0.95);
    white-space: nowrap;
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
  }

  .ts-btn-login {
    background: linear-gradient(135deg, #b8860b, #d4a017, #c8920e);
    border-color: rgba(255,220,100,0.6);
    color: #0a0608;
    box-shadow: 0 4px 20px rgba(180,130,0,0.45), inset 0 1px 0 rgba(255,240,160,0.3);
  }
  .ts-btn-login:hover {
    background: linear-gradient(135deg, #c8960d, #e8b820, #d4a017);
    border-color: rgba(255,230,120,0.85);
    box-shadow: 0 6px 28px rgba(200,150,0,0.55), inset 0 1px 0 rgba(255,245,180,0.35);
    color: #050304;
    transform: translateY(-2px);
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
`;
