import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { audioManager } from "@/lib/audio";
import { useSettings } from "@/context/SettingsContext";

export default function TitleScreen() {
  const navigate = useNavigate();
  const { settings, setVolume, setMuted, setSfxEnabled, setAiDifficulty, setShowDamageNumbers, setAnimationSpeed, resetDefaults } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    // Fade in title
    const t = setTimeout(() => setTitleVisible(true), 100);

    // Try to start title music immediately; retry on first user click (browser autoplay policy)
    const tryPlay = () => audioManager.play("title");
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay as EventListener, { once: true });

    return () => {
      clearTimeout(t);
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay as EventListener);
      // Don't stop music on unmount — let the next screen (lobby/hub) take over
    };
  }, []);

  function handleStart() {
    navigate("/lobby");
  }

  function handleOpenSettings() {
    setShowSettings(true);
  }

  return (
    <div className="ts-root">
      <style>{CSS}</style>

      {/* Background art */}
      <div className="ts-bg" />

      {/* Vignette */}
      <div className="ts-vignette" />

      {/* Main content */}
      <div className={`ts-content${titleVisible ? " ts-visible" : ""}`}>
        <div className="ts-logo-block">
          <h1 className="ts-title">TOWER<br />SEEKERS</h1>
        </div>

        <div className="ts-menu">
          <button className="ts-btn ts-btn-primary" onClick={handleStart}>
            Begin Quest
          </button>
          <button className="ts-btn ts-btn-secondary" onClick={handleOpenSettings}>
            Settings
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="ts-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>
            <div className="ts-modal-title">Settings</div>

            <div className="ts-section-label">Audio</div>

            <div className="ts-setting-row">
              <label className="ts-lbl">Music</label>
              <button
                className={`ts-toggle${settings.muted ? " off" : " on"}`}
                onClick={() => setMuted(!settings.muted)}
              >
                {settings.muted ? "Off" : "On"}
              </button>
            </div>

            <div className="ts-setting-row">
              <label className="ts-lbl">Volume</label>
              <input
                type="range"
                min={0} max={1} step={0.01}
                value={settings.volume}
                className="ts-slider"
                onChange={e => setVolume(parseFloat(e.target.value))}
              />
              <span className="ts-val">{Math.round(settings.volume * 100)}%</span>
            </div>

            <div className="ts-setting-row">
              <label className="ts-lbl">Sound FX</label>
              <button
                className={`ts-toggle${settings.sfxEnabled ? " on" : " off"}`}
                onClick={() => setSfxEnabled(!settings.sfxEnabled)}
              >
                {settings.sfxEnabled ? "On" : "Off"}
              </button>
            </div>

            <div className="ts-section-label">AI Opponent</div>

            <div className="ts-setting-row">
              <label className="ts-lbl">Difficulty</label>
              <div className="ts-radio-group">
                {(["easy", "normal", "hard"] as const).map(d => (
                  <button
                    key={d}
                    className={`ts-radio${settings.aiDifficulty === d ? " active" : ""}`}
                    onClick={() => setAiDifficulty(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="ts-section-label">Battle</div>

            <div className="ts-setting-row">
              <label className="ts-lbl">Damage Numbers</label>
              <button
                className={`ts-toggle${settings.showDamageNumbers ? " on" : " off"}`}
                onClick={() => setShowDamageNumbers(!settings.showDamageNumbers)}
              >
                {settings.showDamageNumbers ? "On" : "Off"}
              </button>
            </div>

            <div className="ts-setting-row">
              <label className="ts-lbl">Animation Speed</label>
              <div className="ts-radio-group">
                {(["slow", "normal", "fast"] as const).map(s => (
                  <button
                    key={s}
                    className={`ts-radio${settings.animationSpeed === s ? " active" : ""}`}
                    onClick={() => setAnimationSpeed(s)}
                  >
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
    background: #05030d;
  }

  .ts-bg {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-bg.png');
    background-size: 110%;
    background-position: center 60%;
    transition: background-size 30s ease-out;
  }
  .ts-root:hover .ts-bg {
    background-size: 105%;
  }

  .ts-vignette {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(5,3,13,0.55) 0%, transparent 65%),
      linear-gradient(to bottom, rgba(5,3,13,0.5) 0%, transparent 30%, transparent 60%, rgba(5,3,13,0.7) 88%, rgba(5,3,13,0.88) 100%),
      linear-gradient(to right, rgba(5,3,13,0.35) 0%, transparent 18%, transparent 82%, rgba(5,3,13,0.35) 100%);
    pointer-events: none;
  }

  .ts-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 1.2s ease, transform 1.2s ease;
    padding: 2rem;
  }
  .ts-content.ts-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .ts-logo-block {
    text-align: center;
  }

  .ts-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(3rem, 10vw, 6.5rem);
    font-weight: 900;
    line-height: 0.9;
    color: #fff8e8;
    text-shadow:
      0 0 60px rgba(240,192,64,0.55),
      0 0 120px rgba(240,192,64,0.25),
      0 4px 20px rgba(0,0,0,0.9);
    letter-spacing: 0.04em;
    margin: 0;
  }

  .ts-menu {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 240px;
  }

  .ts-btn {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0.85rem 2.5rem;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.22s;
    width: 100%;
  }
  .ts-btn-primary {
    background: linear-gradient(135deg, #b87800, #f0c040, #b87800);
    color: #0a0508;
    box-shadow: 0 4px 24px rgba(240,192,64,0.35);
  }
  .ts-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(240,192,64,0.5);
  }
  .ts-btn-secondary {
    background: rgba(255,255,255,0.04);
    color: rgba(200,170,100,0.85);
    border: 1px solid rgba(240,192,64,0.3);
    backdrop-filter: blur(4px);
  }
  .ts-btn-secondary:hover {
    background: rgba(240,192,64,0.08);
    border-color: rgba(240,192,64,0.6);
    color: #f0c040;
  }

  /* Settings modal */
  .ts-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
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
    flex-shrink: 0;
  }

  .ts-toggle {
    font-family: 'Cinzel', serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 0.3rem 0.9rem;
    border-radius: 20px;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.15s;
    min-width: 52px;
  }
  .ts-toggle.on {
    background: rgba(80,200,120,0.15);
    border-color: rgba(80,200,120,0.5);
    color: #60e890;
  }
  .ts-toggle.off {
    background: rgba(200,60,60,0.1);
    border-color: rgba(200,60,60,0.35);
    color: rgba(200,100,100,0.8);
  }

  .ts-slider {
    flex: 1;
    accent-color: #f0c040;
    height: 4px;
    cursor: pointer;
  }

  .ts-val {
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    color: rgba(200,170,100,0.6);
    min-width: 36px;
    text-align: right;
  }

  .ts-radio-group {
    display: flex;
    gap: 0.4rem;
  }

  .ts-radio {
    font-family: 'Cinzel', serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0.28rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid rgba(240,192,64,0.2);
    background: rgba(15,10,30,0.8);
    color: rgba(200,170,100,0.55);
    transition: all 0.13s;
  }
  .ts-radio.active {
    background: rgba(240,192,64,0.15);
    border-color: #f0c040;
    color: #f0c040;
  }
  .ts-radio:hover:not(.active) {
    border-color: rgba(240,192,64,0.45);
    color: rgba(200,170,100,0.8);
  }

  .ts-modal-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(240,192,64,0.12);
  }

  .ts-btn-sm {
    font-family: 'Cinzel', serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 0.45rem 1.2rem;
    border-radius: 7px;
    cursor: pointer;
    border: 1px solid rgba(240,192,64,0.2);
    background: transparent;
    color: rgba(200,170,100,0.65);
    transition: all 0.15s;
  }
  .ts-btn-sm:hover {
    border-color: rgba(240,192,64,0.5);
    color: rgba(200,170,100,0.9);
  }
  .ts-btn-sm-primary {
    background: linear-gradient(135deg, #b87800, #f0c040, #b87800);
    color: #0a0508;
    border-color: transparent;
  }
  .ts-btn-sm-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(240,192,64,0.35);
  }
`;
