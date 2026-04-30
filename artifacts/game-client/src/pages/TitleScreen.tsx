import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { audioManager } from "@/lib/audio";
import { useSettings } from "@/context/SettingsContext";

const MODE_CARDS = [
  {
    cls: "blue",
    icon: "⚔",
    title: "Quick PvP",
    sub: "Matched opponent · Ranked",
    action: "pvp",
  },
  {
    cls: "green",
    icon: "🤖",
    title: "Practice vs AI",
    sub: "No stakes · Adjustable difficulty",
    action: "ai",
  },
  {
    cls: "amber",
    icon: "🔗",
    title: "Custom Duel",
    sub: "Coming soon · Private room",
    action: "disabled",
  },
] as const;

const BOTTOM_TABS = [
  { icon: "🏰", label: "Hub", action: "hub" },
  { icon: "🏆", label: "Ranks", action: "disabled" },
  { icon: "✉",  label: "Messages", action: "disabled" },
  { icon: "🛒", label: "Shop", action: "disabled" },
] as const;

export default function TitleScreen() {
  const navigate = useNavigate();
  const {
    settings, setVolume, setMuted, setSfxEnabled,
    setAiDifficulty, setShowDamageNumbers, setAnimationSpeed, resetDefaults,
  } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    const tryPlay = () => audioManager.play("title");
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay as EventListener, { once: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay as EventListener);
    };
  }, []);

  function handleMode(action: string) {
    if (action === "pvp" || action === "ai") navigate("/lobby");
    if (action === "hub") navigate("/hub");
  }

  return (
    <div className="wr-root">
      <style>{CSS}</style>

      {/* Background */}
      <div className="wr-bg" />
      <div className="wr-overlay" />

      {/* Top bar */}
      <div className={`wr-topbar${visible ? " wr-visible" : ""}`}>
        <div className="wr-logo">⚔ TOWER SEEKERS</div>
        <button className="wr-settings-btn" onClick={() => setShowSettings(true)}>⚙</button>
      </div>

      {/* Main body */}
      <div className={`wr-body${visible ? " wr-visible" : ""}`}>

        {/* Left: identity panel */}
        <div className="wr-left">
          <div className="wr-portrait-ring">
            <div className="wr-portrait">⚔</div>
          </div>
          <div className="wr-player-name">Adventurer</div>
          <div className="wr-rank-badge">🏅 Unranked</div>
          <div className="wr-trophy-row">🏆 <span>0</span></div>

          <div className="wr-divider" />

          <div className="wr-party-label">Your Party</div>
          <div className="wr-party-strip">
            {["🗡", "🏹", "🔮"].map((icon, i) => (
              <div key={i} className="wr-unit-sil">{icon}</div>
            ))}
          </div>
          <div className="wr-party-more">Ready for battle</div>

          <div className="wr-divider" />

          <div className="wr-stat-row">
            <span className="wr-stat-label">Season</span>
            <span className="wr-stat-val">1</span>
          </div>
          <div className="wr-stat-row">
            <span className="wr-stat-label">Iron Age</span>
            <span className="wr-stat-val">⚔</span>
          </div>
        </div>

        {/* Right: mode cards */}
        <div className="wr-right">
          {MODE_CARDS.map(card => (
            <button
              key={card.title}
              className={`wr-mode-card ${card.cls}${card.action === "disabled" ? " wr-disabled" : ""}`}
              onClick={() => handleMode(card.action)}
              disabled={card.action === "disabled"}
            >
              <span className="wr-mode-icon">{card.icon}</span>
              <span className="wr-mode-content">
                <span className="wr-mode-title">{card.title}</span>
                <span className="wr-mode-sub">{card.sub}</span>
              </span>
              <span className="wr-mode-arrow">›</span>
            </button>
          ))}

          <div className="wr-season-card">
            <span className="wr-season-icon">🔥</span>
            <div>
              <div className="wr-season-title">Season 1 · The Iron Age</div>
              <div className="wr-season-sub">Climb the ranks, claim glory</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className={`wr-bottom${visible ? " wr-visible" : ""}`}>
        {BOTTOM_TABS.map(tab => (
          <button
            key={tab.label}
            className={`wr-bottom-btn${tab.action === "disabled" ? " wr-dimmed" : ""}`}
            onClick={() => handleMode(tab.action)}
            disabled={tab.action === "disabled"}
          >
            <span className="wr-bottom-icon">{tab.icon}</span>
            <span className="wr-bottom-lbl">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings modal (preserved from original) */}
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
                type="range" min={0} max={1} step={0.01}
                value={settings.volume} className="ts-slider"
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

  /* ── Root ── */
  .wr-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #07040f;
    font-family: 'Cinzel', serif;
  }

  /* ── Background ── */
  .wr-bg {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-bg.png');
    background-size: cover;
    background-position: center 40%;
    filter: blur(3px) brightness(0.35);
    z-index: 0;
  }
  /* CSS fallback when no image is available */
  .wr-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 120% 80% at 65% 35%, rgba(20,10,60,0.9) 0%, transparent 65%),
      linear-gradient(160deg, #07040f 0%, #0d0a22 35%, #0b0819 65%, #07040f 100%);
  }
  /* Castle silhouette (shows when no image) */
  .wr-bg::after {
    content: '';
    position: absolute;
    bottom: 18%;
    left: 50%;
    transform: translateX(-50%);
    width: min(90vw, 700px);
    height: min(50vh, 340px);
    opacity: 0.28;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(22,11,58,1) 45%,
      rgba(14,8,40,1) 100%
    );
    clip-path: polygon(
      0% 100%, 3% 55%, 8% 55%, 8% 45%, 12% 45%, 12% 55%, 17% 55%,
      17% 30%, 20% 30%, 20% 22%, 25% 22%, 25% 30%, 30% 30%,
      30% 52%, 38% 52%, 38% 15%, 42% 15%, 42% 8%, 46% 8%, 46% 3%,
      50% 3%, 54% 3%, 54% 8%, 58% 8%, 58% 15%, 62% 15%, 62% 52%,
      70% 52%, 70% 30%, 75% 30%, 75% 22%, 80% 22%, 80% 30%,
      83% 30%, 83% 55%, 88% 55%, 88% 45%, 92% 45%, 92% 55%, 97% 55%,
      100% 100%
    );
  }

  .wr-overlay {
    position: absolute;
    inset: 0;
    background: rgba(4,2,10,0.68);
    z-index: 1;
    pointer-events: none;
  }

  /* ── Fade-in ── */
  .wr-topbar,
  .wr-body,
  .wr-bottom {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.9s ease, transform 0.9s ease;
  }
  .wr-topbar.wr-visible { opacity: 1; transform: translateY(0); }
  .wr-body.wr-visible   { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
  .wr-bottom.wr-visible { opacity: 1; transform: translateY(0); transition-delay: 0.18s; }

  /* ── Top bar ── */
  .wr-topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(10px, 2vh, 18px) clamp(14px, 3vw, 28px);
    flex-shrink: 0;
  }

  .wr-logo {
    font-family: 'Cinzel', serif;
    font-size: clamp(11px, 1.4vw, 16px);
    font-weight: 700;
    letter-spacing: 0.22em;
    color: rgba(240,192,64,0.8);
  }

  .wr-settings-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 50%;
    width: clamp(32px, 3.5vw, 42px);
    height: clamp(32px, 3.5vw, 42px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(14px, 1.6vw, 18px);
    color: rgba(200,170,100,0.7);
    cursor: pointer;
    transition: all 0.2s;
  }
  .wr-settings-btn:hover {
    background: rgba(240,192,64,0.1);
    border-color: rgba(240,192,64,0.5);
    color: #f0c040;
  }

  /* ── Main body ── */
  .wr-body {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    gap: clamp(8px, 1.5vw, 18px);
    padding: 0 clamp(12px, 3vw, 28px) clamp(8px, 1.5vh, 14px);
    min-height: 0;
    overflow: hidden;
  }

  /* ── Left identity panel ── */
  .wr-left {
    width: clamp(130px, 22vw, 220px);
    flex-shrink: 0;
    background: linear-gradient(180deg, rgba(20,12,45,0.92) 0%, rgba(12,8,28,0.95) 100%);
    border: 1px solid rgba(240,192,64,0.18);
    border-radius: 16px;
    padding: clamp(14px, 2vh, 22px) clamp(10px, 1.5vw, 18px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    position: relative;
    overflow: hidden;
  }

  .wr-left::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.6), transparent);
    border-radius: 16px 16px 0 0;
  }

  .wr-portrait-ring {
    width: clamp(52px, 7vw, 80px);
    height: clamp(52px, 7vw, 80px);
    border-radius: 50%;
    border: 2px solid rgba(240,192,64,0.55);
    padding: 3px;
    background: linear-gradient(135deg, rgba(240,192,64,0.12), transparent);
    box-shadow: 0 0 20px rgba(240,192,64,0.18);
    margin-bottom: 4px;
    flex-shrink: 0;
  }

  .wr-portrait {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a0d3a, #2a1555);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(18px, 2.5vw, 28px);
  }

  .wr-player-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(11px, 1.3vw, 16px);
    font-weight: 700;
    color: #f0e0a0;
    letter-spacing: 0.06em;
    margin-top: 2px;
    text-align: center;
  }

  .wr-rank-badge {
    font-size: clamp(9px, 0.9vw, 11px);
    color: rgba(200,170,100,0.7);
    background: rgba(240,192,64,0.1);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 8px;
    padding: 2px 9px;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  .wr-trophy-row {
    font-size: clamp(10px, 1vw, 13px);
    color: #f0c040;
    letter-spacing: 0.06em;
    margin-top: 3px;
  }
  .wr-trophy-row span { font-weight: 700; }

  .wr-divider {
    width: 75%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.2), transparent);
    margin: clamp(6px, 1vh, 10px) 0;
    flex-shrink: 0;
  }

  .wr-party-label {
    font-size: clamp(8px, 0.8vw, 10px);
    letter-spacing: 0.18em;
    color: rgba(240,192,64,0.5);
    text-transform: uppercase;
  }

  .wr-party-strip {
    display: flex;
    gap: 6px;
    margin-top: 5px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .wr-unit-sil {
    width: clamp(28px, 3vw, 36px);
    height: clamp(28px, 3vw, 36px);
    border-radius: 8px;
    background: rgba(15,10,35,0.9);
    border: 1px solid rgba(240,192,64,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(13px, 1.4vw, 16px);
  }

  .wr-party-more {
    font-size: clamp(8px, 0.75vw, 10px);
    color: rgba(180,150,100,0.5);
    letter-spacing: 0.08em;
    margin-top: 3px;
    text-align: center;
  }

  .wr-stat-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }
  .wr-stat-label {
    font-size: clamp(8px, 0.8vw, 10px);
    letter-spacing: 0.08em;
    color: rgba(180,150,100,0.55);
  }
  .wr-stat-val {
    font-size: clamp(9px, 0.9vw, 12px);
    font-weight: 600;
    color: rgba(240,192,64,0.8);
  }

  /* ── Right panel: mode cards ── */
  .wr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.2vh, 14px);
    min-width: 0;
  }

  .wr-mode-card {
    border-radius: 14px;
    padding: clamp(12px, 1.8vh, 20px) clamp(14px, 2vw, 22px);
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.5vw, 18px);
    cursor: pointer;
    flex: 1;
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;
    text-align: left;
    transition: filter 0.18s, transform 0.18s, box-shadow 0.18s;
    width: 100%;
  }
  .wr-mode-card:hover:not(.wr-disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.5);
    filter: brightness(1.08);
  }
  .wr-mode-card:active:not(.wr-disabled) {
    transform: translateY(0);
  }
  .wr-mode-card.wr-disabled {
    cursor: default;
    opacity: 0.42;
  }

  .wr-mode-card.blue {
    background: linear-gradient(135deg, rgba(20,40,100,0.85), rgba(10,25,70,0.92));
    border-color: rgba(80,120,255,0.25);
  }
  .wr-mode-card.green {
    background: linear-gradient(135deg, rgba(15,55,30,0.85), rgba(8,35,18,0.92));
    border-color: rgba(60,160,80,0.28);
  }
  .wr-mode-card.amber {
    background: linear-gradient(135deg, rgba(70,40,10,0.85), rgba(50,28,5,0.92));
    border-color: rgba(200,130,40,0.28);
  }

  .wr-mode-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 14px 14px 0 0;
  }
  .wr-mode-card.blue::before  { background: linear-gradient(90deg, transparent, rgba(80,120,255,0.55), transparent); }
  .wr-mode-card.green::before { background: linear-gradient(90deg, transparent, rgba(60,200,90,0.45), transparent); }
  .wr-mode-card.amber::before { background: linear-gradient(90deg, transparent, rgba(240,150,50,0.5), transparent); }

  .wr-mode-icon {
    font-size: clamp(20px, 2.5vw, 30px);
    width: clamp(32px, 3.5vw, 44px);
    text-align: center;
    flex-shrink: 0;
  }

  .wr-mode-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .wr-mode-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(13px, 1.5vw, 18px);
    font-weight: 700;
    color: #f0e8d0;
    letter-spacing: 0.05em;
  }
  .wr-mode-sub {
    font-family: 'Cinzel', serif;
    font-size: clamp(9px, 0.85vw, 11px);
    color: rgba(200,180,140,0.55);
    letter-spacing: 0.04em;
  }

  .wr-mode-arrow {
    font-size: clamp(20px, 2.2vw, 28px);
    color: rgba(240,192,64,0.35);
    font-family: sans-serif;
    font-weight: 300;
    flex-shrink: 0;
    transition: transform 0.15s, color 0.15s;
  }
  .wr-mode-card:hover:not(.wr-disabled) .wr-mode-arrow {
    transform: translateX(3px);
    color: rgba(240,192,64,0.7);
  }

  /* Season info card */
  .wr-season-card {
    background: linear-gradient(135deg, rgba(70,15,15,0.7), rgba(40,8,8,0.85));
    border: 1px solid rgba(200,60,40,0.22);
    border-radius: 12px;
    padding: clamp(10px, 1.4vh, 16px) clamp(14px, 2vw, 20px);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .wr-season-icon { font-size: clamp(16px, 2vw, 22px); }
  .wr-season-title {
    font-size: clamp(9px, 0.9vw, 11px);
    font-weight: 700;
    color: rgba(255,180,150,0.85);
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  .wr-season-sub {
    font-size: clamp(8px, 0.75vw, 10px);
    color: rgba(200,140,120,0.55);
    letter-spacing: 0.06em;
  }

  /* ── Bottom strip ── */
  .wr-bottom {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(5,3,12,0.88);
    border-top: 1px solid rgba(240,192,64,0.12);
    padding: clamp(8px, 1.2vh, 14px) clamp(16px, 3vw, 32px);
    flex-shrink: 0;
    backdrop-filter: blur(8px);
  }

  .wr-bottom-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 10px;
    transition: background 0.15s;
  }
  .wr-bottom-btn:hover:not(.wr-dimmed) {
    background: rgba(240,192,64,0.07);
  }
  .wr-bottom-btn.wr-dimmed {
    cursor: default;
    opacity: 0.35;
  }

  .wr-bottom-icon {
    font-size: clamp(18px, 2.2vw, 26px);
    display: block;
  }
  .wr-bottom-lbl {
    font-family: 'Cinzel', serif;
    font-size: clamp(8px, 0.75vw, 10px);
    color: rgba(200,170,100,0.7);
    letter-spacing: 0.12em;
    text-transform: uppercase;
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
  .ts-toggle.on  { background: rgba(80,200,120,0.15); border-color: rgba(80,200,120,0.5); color: #60e890; }
  .ts-toggle.off { background: rgba(200,60,60,0.1);  border-color: rgba(200,60,60,0.35); color: rgba(200,100,100,0.8); }

  .ts-slider { flex: 1; accent-color: #f0c040; height: 4px; cursor: pointer; }

  .ts-val {
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    color: rgba(200,170,100,0.6);
    min-width: 36px;
    text-align: right;
  }

  .ts-radio-group { display: flex; gap: 0.4rem; }

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
  .ts-radio.active { background: rgba(240,192,64,0.15); border-color: #f0c040; color: #f0c040; }
  .ts-radio:hover:not(.active) { border-color: rgba(240,192,64,0.45); color: rgba(200,170,100,0.8); }

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
  .ts-btn-sm:hover { border-color: rgba(240,192,64,0.5); color: rgba(200,170,100,0.9); }
  .ts-btn-sm-primary {
    background: linear-gradient(135deg, #b87800, #f0c040, #b87800);
    color: #0a0508;
    border-color: transparent;
  }
  .ts-btn-sm-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(240,192,64,0.35); }
`;
