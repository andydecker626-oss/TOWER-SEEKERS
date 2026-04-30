import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { audioManager } from "@/lib/audio";
import { useSettings } from "@/context/SettingsContext";

const MODE_CARDS = [
  { cls: "blue",  icon: "⚔",  title: "Quick PvP",      sub: "Matched opponent · Ranked",         action: "pvp" },
  { cls: "green", icon: "🤖", title: "Practice vs AI",  sub: "No stakes · Adjustable difficulty", action: "ai"  },
  { cls: "amber", icon: "🔗", title: "Custom Duel",     sub: "Coming soon · Private room",        action: "disabled" },
] as const;

const BOTTOM_TABS = [
  { icon: "🏰", label: "Hub",      action: "hub",      active: true  },
  { icon: "🏆", label: "Ranks",    action: "disabled", active: false },
  { icon: "✉",  label: "Messages", action: "disabled", active: false },
  { icon: "🛒", label: "Shop",     action: "disabled", active: false },
] as const;

// Representative unit classes shown in the roster strip
const UNIT_ROSTER = [
  { icon: "⚔",  name: "Knight",    color: "#4488ff" },
  { icon: "🛡",  name: "Paladin",   color: "#ffcc44" },
  { icon: "🪓",  name: "Berserker", color: "#ff5522" },
  { icon: "🏹",  name: "Archer",    color: "#44cc66" },
  { icon: "🔮",  name: "Mage",      color: "#aa44ff" },
  { icon: "✝",   name: "Cleric",    color: "#ffffaa" },
  { icon: "🌪",  name: "Wanderer",  color: "#44cccc" },
  { icon: "🗡",  name: "Rogue",     color: "#888888" },
  { icon: "🪃",  name: "Lancer",    color: "#ff9944" },
  { icon: "💀",  name: "Warlock",   color: "#cc44aa" },
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
    if (action === "sprites") navigate("/sprites");
  }

  return (
    <div className="wr-root">
      <style>{CSS}</style>

      {/* City panorama background */}
      <div className="wr-bg" />
      <div className="wr-overlay" />

      {/* Decorative tower pillars left + right */}
      <div className="wr-tower wr-tower-l" />
      <div className="wr-tower wr-tower-r" />

      {/* Top bar */}
      <div className={`wr-topbar${visible ? " wr-visible" : ""}`}>
        <div className="wr-logo">
          <svg className="wr-logo-sword" viewBox="0 0 18 18" fill="none" aria-hidden>
            <line x1="9" y1="1" x2="9" y2="14" stroke="#f0c040" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="4" y1="6" x2="14" y2="6" stroke="#f0c040" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="15.5" r="1.8" fill="#f0c040"/>
          </svg>
          TOWER SEEKERS
          <svg className="wr-logo-sword" viewBox="0 0 18 18" fill="none" aria-hidden style={{ transform: "scaleX(-1)" }}>
            <line x1="9" y1="1" x2="9" y2="14" stroke="#f0c040" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="4" y1="6" x2="14" y2="6" stroke="#f0c040" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="15.5" r="1.8" fill="#f0c040"/>
          </svg>
        </div>
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
          {/* Decorative unit silhouettes */}
          <div className="wr-party-strip">
            {[
              { icon: "⚔", name: "Knight",  color: "#4488ff" },
              { icon: "🏹", name: "Archer",  color: "#44cc66" },
              { icon: "🔮", name: "Mage",    color: "#aa44ff" },
            ].map((u) => (
              <div key={u.name} className="wr-unit-sil" style={{ borderColor: `${u.color}44` }}>
                <span style={{ fontSize: "clamp(12px,1.3vw,15px)" }}>{u.icon}</span>
                <span className="wr-unit-sil-name" style={{ color: u.color }}>{u.name}</span>
              </div>
            ))}
          </div>

          {/* Hub access from party panel */}
          <button className="wr-hub-btn" onClick={() => navigate("/hub")}>
            🏰 Configure Party
          </button>

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

        {/* Right: mode cards + unit roster */}
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

          {/* Unit roster strip — Tower Seekers class showcase */}
          <div className="wr-roster">
            <div className="wr-roster-label">UNIT ROSTER — 10 CLASSES</div>
            <div className="wr-roster-strip">
              {UNIT_ROSTER.map(u => (
                <div key={u.name} className="wr-roster-chip" style={{ borderColor: `${u.color}33` }}>
                  <span className="wr-roster-icon" style={{ color: u.color }}>{u.icon}</span>
                  <span className="wr-roster-name">{u.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sprite gallery link */}
          <button className="wr-sprite-link" onClick={() => handleMode("sprites")}>
            <span className="wr-sprite-link-icon">🖼</span>
            <span className="wr-sprite-link-text">
              <span className="wr-sprite-link-title">Unit Sprite Gallery</span>
              <span className="wr-sprite-link-sub">Preview all 12 unit sprites &amp; sheets</span>
            </span>
            <span className="wr-sprite-link-arrow">›</span>
          </button>

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
            className={[
              "wr-bottom-btn",
              tab.active ? "wr-bottom-active" : "",
              !tab.active ? "wr-dimmed" : "",
            ].join(" ").trim()}
            onClick={() => handleMode(tab.action)}
            disabled={!tab.active}
          >
            <span className="wr-bottom-icon">{tab.icon}</span>
            <span className="wr-bottom-lbl">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="ts-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>
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
                onChange={e => setVolume(parseFloat(e.target.value))} />
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
                {(["easy", "normal", "hard"] as const).map(d => (
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
                {(["slow", "normal", "fast"] as const).map(s => (
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

  /* ── City panorama background ── */
  .wr-bg {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-bg.png');
    background-size: cover;
    background-position: center 40%;
    filter: blur(3px) brightness(0.35);
    z-index: 0;
  }
  /* Rich CSS city/fortress skyline fallback */
  .wr-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      /* ambient sky glow */
      radial-gradient(ellipse 80% 55% at 50% 0%, rgba(60,20,120,0.55) 0%, transparent 70%),
      /* left amber torch glow */
      radial-gradient(ellipse 40% 60% at 12% 45%, rgba(200,80,20,0.18) 0%, transparent 60%),
      /* right amber torch glow */
      radial-gradient(ellipse 40% 60% at 88% 45%, rgba(200,80,20,0.18) 0%, transparent 60%),
      /* centre horizon glow */
      radial-gradient(ellipse 120% 40% at 50% 72%, rgba(120,50,10,0.35) 0%, transparent 65%),
      linear-gradient(180deg, #07040f 0%, #0d0820 25%, #110925 55%, #090612 80%, #04020a 100%);
  }
  /* Detailed city silhouette */
  .wr-bg::after {
    content: '';
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    width: min(98vw, 860px);
    height: min(55vh, 380px);
    background: linear-gradient(180deg,
      rgba(8,4,22,0) 0%,
      rgba(14,7,35,0.85) 30%,
      rgba(10,5,24,0.98) 70%,
      rgba(7,3,16,1) 100%
    );
    clip-path: polygon(
      /* far-left battlement */
      0% 100%, 0% 72%, 2% 72%, 2% 66%, 4% 66%, 4% 72%, 6% 72%, 6% 60%,
      /* left outer tower */
      4% 60%, 4% 20%, 5% 20%, 5% 15%, 6% 15%, 6% 20%, 9% 20%, 9% 60%,
      10% 60%, 10% 70%,
      /* left mid wall */
      12% 70%, 12% 62%, 14% 62%, 14% 55%, 16% 55%, 16% 62%, 18% 62%, 18% 70%,
      /* left inner tower */
      17% 70%, 17% 32%, 18% 32%, 18% 26%, 19.5% 26%, 19.5% 22%, 21% 22%,
      21% 26%, 22.5% 26%, 22.5% 32%, 24% 32%, 24% 70%,
      /* left gate arch */
      26% 70%, 26% 80%, 28% 80%, 30% 72%, 32% 72%,
      /* centre keep — tall main tower */
      32% 72%, 32% 42%, 33% 42%, 33% 36%, 34.5% 36%, 34.5% 30%, 36% 30%,
      36% 24%, 37.5% 24%, 37.5% 18%, 39% 18%, 39% 12%, 41% 12%,
      41% 6%, 43% 6%, 43% 2%, 45% 2%, 45% 0%, 46% 0%, 46% 2%,
      48% 2%, 48% 4%, 50% 4%, 50% 2%, 52% 2%, 52% 0%, 53% 0%,
      53% 2%, 55% 2%, 55% 6%, 57% 6%, 57% 12%, 59% 12%, 59% 18%,
      60.5% 18%, 60.5% 24%, 62% 24%, 62% 30%, 63.5% 30%, 63.5% 36%,
      65% 36%, 65% 42%, 66% 42%, 66% 72%,
      /* right gate arch */
      68% 72%, 70% 80%, 72% 80%, 74% 70%,
      /* right inner tower */
      74% 70%, 74% 32%, 75.5% 32%, 75.5% 26%, 77% 26%, 77% 22%,
      78.5% 22%, 78.5% 26%, 80% 26%, 80% 32%, 81% 32%, 81% 70%,
      /* right mid wall */
      82% 70%, 82% 62%, 84% 62%, 84% 55%, 86% 55%, 86% 62%, 88% 62%, 88% 70%,
      /* right outer tower */
      87% 70%, 87% 60%, 89% 60%, 89% 20%, 92% 20%, 92% 15%, 93% 15%,
      93% 20%, 94% 20%, 94% 60%, 96% 60%, 96% 72%,
      /* far-right battlement */
      96% 72%, 98% 72%, 98% 66%, 100% 66%, 100% 72%, 100% 100%
    );
  }

  .wr-overlay {
    position: absolute;
    inset: 0;
    background: rgba(4,2,10,0.62);
    z-index: 1;
    pointer-events: none;
  }

  /* Decorative flanking towers */
  .wr-tower {
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
    border-bottom: 1px solid rgba(240,192,64,0.07);
  }
  .wr-tower::before {
    content: '';
    position: absolute;
    top: clamp(60px,10vh,120px);
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: clamp(60px,12vh,110px);
    background: rgba(240,140,20,0.07);
    border-radius: 50%;
    filter: blur(8px);
  }
  .wr-tower-l { left: 0; border-right: 1px solid rgba(240,192,64,0.10); }
  .wr-tower-r { right: 0; border-left: 1px solid rgba(240,192,64,0.10); }

  /* ── Fade-in ── */
  .wr-topbar, .wr-body, .wr-bottom {
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
    padding: clamp(10px,2vh,18px) clamp(14px,3vw,28px);
    flex-shrink: 0;
  }

  .wr-logo {
    font-family: 'Cinzel', serif;
    font-size: clamp(11px, 1.4vw, 16px);
    font-weight: 700;
    letter-spacing: 0.22em;
    color: rgba(240,192,64,0.85);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wr-logo-sword {
    width: clamp(12px,1.4vw,16px);
    height: clamp(12px,1.4vw,16px);
    flex-shrink: 0;
  }

  .wr-settings-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 50%;
    width: clamp(32px,3.5vw,42px);
    height: clamp(32px,3.5vw,42px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(14px,1.6vw,18px);
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
    gap: clamp(8px,1.5vw,18px);
    padding: 0 clamp(12px,3vw,28px) clamp(8px,1.5vh,14px);
    min-height: 0;
    overflow: hidden;
  }

  /* ── Left identity panel ── */
  .wr-left {
    width: clamp(130px,22vw,220px);
    flex-shrink: 0;
    background: linear-gradient(180deg, rgba(20,12,45,0.92) 0%, rgba(12,8,28,0.95) 100%);
    border: 1px solid rgba(240,192,64,0.18);
    border-radius: 16px;
    padding: clamp(14px,2vh,22px) clamp(10px,1.5vw,18px);
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
    width: clamp(52px,7vw,80px);
    height: clamp(52px,7vw,80px);
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
    font-size: clamp(18px,2.5vw,28px);
  }

  .wr-player-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(11px,1.3vw,16px);
    font-weight: 700;
    color: #f0e0a0;
    letter-spacing: 0.06em;
    margin-top: 2px;
    text-align: center;
  }
  .wr-rank-badge {
    font-size: clamp(9px,0.9vw,11px);
    color: rgba(200,170,100,0.7);
    background: rgba(240,192,64,0.1);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 8px;
    padding: 2px 9px;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .wr-trophy-row {
    font-size: clamp(10px,1vw,13px);
    color: #f0c040;
    letter-spacing: 0.06em;
    margin-top: 3px;
  }
  .wr-trophy-row span { font-weight: 700; }

  .wr-divider {
    width: 75%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.2), transparent);
    margin: clamp(6px,1vh,10px) 0;
    flex-shrink: 0;
  }

  .wr-party-label {
    font-size: clamp(8px,0.8vw,10px);
    letter-spacing: 0.18em;
    color: rgba(240,192,64,0.5);
    text-transform: uppercase;
  }

  .wr-party-strip {
    display: flex;
    gap: 5px;
    margin-top: 5px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .wr-unit-sil {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: rgba(12,8,30,0.9);
    border: 1px solid rgba(68,136,255,0.27);
    border-radius: 8px;
    padding: 5px clamp(5px,0.6vw,8px);
    min-width: clamp(36px,3.5vw,46px);
  }
  .wr-unit-sil-name {
    font-size: clamp(6px,0.6vw,8px);
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  /* Configure party → hub button */
  .wr-hub-btn {
    width: 100%;
    margin-top: 5px;
    padding: clamp(6px,0.9vh,10px) 0;
    background: linear-gradient(135deg, rgba(30,15,70,0.85), rgba(18,8,45,0.9));
    border: 1px solid rgba(240,192,64,0.35);
    border-radius: 10px;
    color: rgba(240,192,64,0.9);
    font-family: 'Cinzel', serif;
    font-size: clamp(8px,0.85vw,10px);
    letter-spacing: 0.12em;
    cursor: pointer;
    transition: all 0.18s;
    text-transform: uppercase;
  }
  .wr-hub-btn:hover {
    background: linear-gradient(135deg, rgba(50,25,100,0.9), rgba(30,12,65,0.95));
    border-color: rgba(240,192,64,0.7);
    box-shadow: 0 0 12px rgba(240,192,64,0.15);
    color: #f0e060;
  }

  .wr-stat-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }
  .wr-stat-label {
    font-size: clamp(8px,0.8vw,10px);
    letter-spacing: 0.08em;
    color: rgba(180,150,100,0.55);
  }
  .wr-stat-val {
    font-size: clamp(9px,0.9vw,12px);
    font-weight: 600;
    color: rgba(240,192,64,0.8);
  }

  /* ── Right panel ── */
  .wr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: clamp(6px,1vh,12px);
    min-width: 0;
  }

  /* Mode cards */
  .wr-mode-card {
    border-radius: 14px;
    padding: clamp(10px,1.6vh,18px) clamp(14px,2vw,22px);
    display: flex;
    align-items: center;
    gap: clamp(10px,1.5vw,18px);
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
  .wr-mode-card:active:not(.wr-disabled) { transform: translateY(0); }
  .wr-mode-card.wr-disabled { cursor: default; opacity: 0.42; }
  .wr-mode-card.blue  { background: linear-gradient(135deg, rgba(20,40,100,0.85), rgba(10,25,70,0.92)); border-color: rgba(80,120,255,0.25); }
  .wr-mode-card.green { background: linear-gradient(135deg, rgba(15,55,30,0.85), rgba(8,35,18,0.92)); border-color: rgba(60,160,80,0.28); }
  .wr-mode-card.amber { background: linear-gradient(135deg, rgba(70,40,10,0.85), rgba(50,28,5,0.92)); border-color: rgba(200,130,40,0.28); }
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
    font-size: clamp(18px,2.2vw,28px);
    width: clamp(30px,3.2vw,42px);
    text-align: center;
    flex-shrink: 0;
  }
  .wr-mode-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .wr-mode-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(12px,1.4vw,17px);
    font-weight: 700;
    color: #f0e8d0;
    letter-spacing: 0.05em;
  }
  .wr-mode-sub {
    font-family: 'Cinzel', serif;
    font-size: clamp(9px,0.82vw,11px);
    color: rgba(200,180,140,0.55);
    letter-spacing: 0.04em;
  }
  .wr-mode-arrow {
    font-size: clamp(18px,2vw,26px);
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

  /* ── Unit roster strip ── */
  .wr-roster {
    background: linear-gradient(135deg, rgba(14,8,30,0.88), rgba(10,5,22,0.92));
    border: 1px solid rgba(240,192,64,0.14);
    border-radius: 12px;
    padding: clamp(8px,1.1vh,13px) clamp(12px,1.6vw,18px);
    flex-shrink: 0;
  }
  .wr-roster-label {
    font-size: clamp(7px,0.7vw,9px);
    letter-spacing: 0.22em;
    color: rgba(240,192,64,0.42);
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .wr-roster-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .wr-roster-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(8,4,20,0.75);
    border: 1px solid rgba(68,136,255,0.22);
    border-radius: 6px;
    padding: 3px 7px;
    flex-shrink: 0;
  }
  .wr-roster-icon { font-size: clamp(9px,0.9vw,12px); }
  .wr-roster-name {
    font-size: clamp(7px,0.72vw,9px);
    color: rgba(200,180,150,0.65);
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  /* Sprite gallery link */
  .wr-sprite-link {
    display: flex;
    align-items: center;
    gap: clamp(8px,1.2vw,14px);
    background: linear-gradient(135deg, rgba(80,40,120,0.45), rgba(50,20,80,0.55));
    border: 1px solid rgba(160,80,240,0.28);
    border-radius: 12px;
    padding: clamp(8px,1.1vh,13px) clamp(12px,1.6vw,18px);
    flex-shrink: 0;
    cursor: pointer;
    text-align: left;
    transition: filter 0.18s, transform 0.18s, box-shadow 0.18s, border-color 0.18s;
    width: 100%;
  }
  .wr-sprite-link::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 12px 12px 0 0;
    background: linear-gradient(90deg, transparent, rgba(160,80,240,0.5), transparent);
    pointer-events: none;
  }
  .wr-sprite-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 22px rgba(0,0,0,0.45);
    border-color: rgba(160,80,240,0.55);
    filter: brightness(1.1);
  }
  .wr-sprite-link-icon { font-size: clamp(14px,1.6vw,20px); flex-shrink: 0; }
  .wr-sprite-link-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .wr-sprite-link-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(10px,1.05vw,13px);
    font-weight: 700;
    color: rgba(200,160,255,0.9);
    letter-spacing: 0.05em;
  }
  .wr-sprite-link-sub {
    font-size: clamp(8px,0.75vw,9px);
    color: rgba(160,120,220,0.5);
    letter-spacing: 0.04em;
  }
  .wr-sprite-link-arrow {
    font-size: clamp(16px,1.8vw,22px);
    color: rgba(160,80,240,0.4);
    font-family: sans-serif;
    font-weight: 300;
    flex-shrink: 0;
    transition: transform 0.15s, color 0.15s;
  }
  .wr-sprite-link:hover .wr-sprite-link-arrow {
    transform: translateX(3px);
    color: rgba(160,80,240,0.8);
  }

  /* Season info card */
  .wr-season-card {
    background: linear-gradient(135deg, rgba(70,15,15,0.7), rgba(40,8,8,0.85));
    border: 1px solid rgba(200,60,40,0.22);
    border-radius: 12px;
    padding: clamp(9px,1.2vh,14px) clamp(14px,2vw,20px);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .wr-season-icon { font-size: clamp(14px,1.8vw,20px); }
  .wr-season-title {
    font-size: clamp(9px,0.9vw,11px);
    font-weight: 700;
    color: rgba(255,180,150,0.85);
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  .wr-season-sub {
    font-size: clamp(7px,0.7vw,9px);
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
    padding: clamp(8px,1.2vh,14px) clamp(16px,3vw,32px);
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
  /* Hub — active / highlighted */
  .wr-bottom-active {
    background: rgba(240,192,64,0.07);
    border: 1px solid rgba(240,192,64,0.28);
    box-shadow: 0 0 14px rgba(240,192,64,0.10);
  }
  .wr-bottom-active:hover {
    background: rgba(240,192,64,0.13);
    border-color: rgba(240,192,64,0.50);
    box-shadow: 0 0 20px rgba(240,192,64,0.18);
  }
  .wr-bottom-active .wr-bottom-lbl {
    color: rgba(240,192,64,0.9);
  }
  .wr-bottom-btn.wr-dimmed { cursor: default; opacity: 0.32; }
  .wr-bottom-icon {
    font-size: clamp(18px,2.2vw,26px);
    display: block;
  }
  .wr-bottom-lbl {
    font-family: 'Cinzel', serif;
    font-size: clamp(8px,0.75vw,10px);
    color: rgba(200,170,100,0.6);
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
