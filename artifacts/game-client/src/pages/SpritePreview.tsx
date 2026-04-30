import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface UnitEntry {
  id:       string;
  name:     string;
  cls:      string;
  icon:     string;
  color:    string;
  mockup?:  string;
}

const UNITS: UnitEntry[] = [
  { id: "knight",    name: "Knight",    cls: "Blade-Knight",  icon: "⚔",  color: "#4488ff" },
  { id: "paladin",   name: "Paladin",   cls: "Guardian",      icon: "🛡",  color: "#ffcc44" },
  { id: "berserker", name: "Berserker", cls: "Blade-Knight",  icon: "🪓",  color: "#ff5522" },
  { id: "lancer",    name: "Lancer",    cls: "Lancer",        icon: "🏇",  color: "#ff9944" },
  {
    id: "wanderer", name: "Wanderer", cls: "Fell-Duelist", icon: "🌪", color: "#44cccc",
    mockup: "/__mockup/preview/wanderer-sprite/WandererSprite",
  },
  { id: "rogue",     name: "Rogue",     cls: "Fell-Duelist",  icon: "🗡",  color: "#aaaaaa" },
  { id: "archer",    name: "Archer",    cls: "Rune-Archer",   icon: "🏹",  color: "#44cc66" },
  { id: "mage",      name: "Mage",      cls: "Invoker",       icon: "🔮",  color: "#aa44ff" },
  { id: "cleric",    name: "Cleric",    cls: "Cleric",        icon: "✝",   color: "#ffffaa" },
  { id: "warlock",   name: "Warlock",   cls: "Hex-Mage",      icon: "💀",  color: "#cc44aa" },
  { id: "shaman",    name: "Shaman",    cls: "Cleric",        icon: "🌿",  color: "#44aa55" },
  { id: "bard",      name: "Bard",      cls: "Invoker",       icon: "🎵",  color: "#ff88cc" },
];

/* ── Sprite card ─────────────────────────────────────────────────────────── */
function SpriteCard({
  unit,
  onClick,
}: {
  unit: UnitEntry;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError ] = useState(false);
  const spriteSrc = `/assets/sprites/${unit.id}.png`;
  const hasMockup = !!unit.mockup;

  return (
    <div
      className={`sp-card${hasMockup ? " sp-card--has-mockup" : ""}`}
      style={{ "--accent": unit.color } as React.CSSProperties}
      onClick={onClick}
      role={hasMockup ? "button" : undefined}
      tabIndex={hasMockup ? 0 : undefined}
      onKeyDown={hasMockup ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      <div className="sp-sprite-area">
        {!error && (
          <img
            src={spriteSrc}
            alt={unit.name}
            className={`sp-sprite-img${loaded ? " loaded" : ""}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        {(!loaded || error) && (
          <div className="sp-placeholder">
            <span className="sp-placeholder-icon">{unit.icon}</span>
            <span className="sp-placeholder-label">No sprite yet</span>
          </div>
        )}
        <div className="sp-sprite-frame" />

        {/* "View mockup" badge — only on Wanderer */}
        {hasMockup && (
          <div className="sp-mockup-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            Preview
          </div>
        )}
      </div>
      <div className="sp-card-info">
        <span className="sp-unit-name">{unit.name}</span>
        <span className="sp-unit-cls">{unit.cls}</span>
      </div>
    </div>
  );
}

/* ── Mockup modal ────────────────────────────────────────────────────────── */
function MockupModal({
  unit,
  onClose,
}: {
  unit: UnitEntry;
  onClose: () => void;
}) {
  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div
        className="sp-modal"
        style={{ "--accent": unit.color } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sp-modal-header">
          <div className="sp-modal-title">
            <span className="sp-modal-title-sub">SPRITE PREVIEW</span>
            {unit.name}
          </div>
          <button className="sp-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Embedded mockup */}
        <div className="sp-modal-iframe-wrap">
          <iframe
            src={unit.mockup}
            className="sp-modal-iframe"
            title={`${unit.name} Sprite Preview`}
            allow="cross-origin-isolated"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function SpritePreview() {
  const navigate = useNavigate();
  const [filter,    setFilter   ] = useState<string>("all");
  const [openUnit,  setOpenUnit ] = useState<UnitEntry | null>(null);

  const clsOptions = ["all", ...Array.from(new Set(UNITS.map(u => u.cls)))];
  const visible    = filter === "all" ? UNITS : UNITS.filter(u => u.cls === filter);

  function handleCardClick(unit: UnitEntry) {
    if (unit.mockup) {
      setOpenUnit(unit);
    }
  }

  return (
    <div className="sp-root">
      <style>{CSS}</style>

      <div className="sp-bg" />
      <div className="sp-overlay" />

      {/* Header */}
      <div className="sp-header">
        <button className="sp-back-btn" onClick={() => navigate("/")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Main Menu
        </button>
        <div className="sp-title">
          <span className="sp-title-sub">TOWER SEEKERS</span>
          Unit Sprite Gallery
        </div>
        <div className="sp-count">{UNITS.length} units</div>
      </div>

      {/* Filter bar */}
      <div className="sp-filter-bar">
        {clsOptions.map(cls => (
          <button
            key={cls}
            className={`sp-filter-btn${filter === cls ? " active" : ""}`}
            onClick={() => setFilter(cls)}
          >
            {cls === "all" ? "All Classes" : cls}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="sp-grid">
        {visible.map(unit => (
          <SpriteCard
            key={unit.id}
            unit={unit}
            onClick={() => handleCardClick(unit)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="sp-footer">
        Place sprite sheets in <code>public/assets/sprites/&#123;unit-id&#125;.png</code> — they will appear here automatically.
        &nbsp;·&nbsp; Cards with a <strong>Preview</strong> badge open the full unit mockup.
      </div>

      {/* Mockup modal */}
      {openUnit && (
        <MockupModal unit={openUnit} onClose={() => setOpenUnit(null)} />
      )}
    </div>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');

  .sp-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    background: #07040f;
    font-family: 'Cinzel', serif;
    overflow-x: hidden;
  }

  /* Background */
  .sp-bg {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(50,15,100,0.45) 0%, transparent 65%),
      linear-gradient(180deg, #07040f 0%, #0c0820 50%, #07040f 100%);
    z-index: 0;
  }
  .sp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(4,2,10,0.55);
    z-index: 1;
    pointer-events: none;
  }

  /* ── Header ── */
  .sp-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(12px,2vh,20px) clamp(16px,3vw,32px);
    border-bottom: 1px solid rgba(240,192,64,0.14);
    flex-shrink: 0;
    background: rgba(5,3,12,0.6);
    backdrop-filter: blur(8px);
  }

  .sp-back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(240,192,64,0.22);
    border-radius: 8px;
    padding: 7px 14px;
    color: rgba(220,190,120,0.8);
    font-family: 'Cinzel', serif;
    font-size: clamp(9px,0.9vw,11px);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.18s;
    flex-shrink: 0;
  }
  .sp-back-btn:hover {
    background: rgba(240,192,64,0.08);
    border-color: rgba(240,192,64,0.5);
    color: #f0c040;
  }

  .sp-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(14px,1.8vw,22px);
    font-weight: 700;
    color: #f0e0a0;
    letter-spacing: 0.06em;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .sp-title-sub {
    font-family: 'Cinzel', serif;
    font-size: clamp(7px,0.7vw,9px);
    letter-spacing: 0.28em;
    color: rgba(240,192,64,0.45);
    font-weight: 400;
    text-transform: uppercase;
  }

  .sp-count {
    font-size: clamp(8px,0.8vw,10px);
    color: rgba(200,170,100,0.45);
    letter-spacing: 0.08em;
    text-align: right;
    flex-shrink: 0;
  }

  /* ── Filter bar ── */
  .sp-filter-bar {
    position: relative;
    z-index: 10;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: clamp(10px,1.5vh,16px) clamp(16px,3vw,32px);
    background: rgba(4,2,10,0.4);
    border-bottom: 1px solid rgba(240,192,64,0.08);
  }
  .sp-filter-btn {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid rgba(240,192,64,0.18);
    background: rgba(14,8,28,0.7);
    color: rgba(200,170,100,0.55);
    font-family: 'Cinzel', serif;
    font-size: clamp(8px,0.8vw,10px);
    letter-spacing: 0.10em;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .sp-filter-btn:hover {
    border-color: rgba(240,192,64,0.38);
    color: rgba(240,192,64,0.8);
  }
  .sp-filter-btn.active {
    background: rgba(240,192,64,0.14);
    border-color: rgba(240,192,64,0.55);
    color: #f0c040;
    box-shadow: 0 0 10px rgba(240,192,64,0.1);
  }

  /* ── Grid ── */
  .sp-grid {
    position: relative;
    z-index: 10;
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(140px,14vw,180px), 1fr));
    gap: clamp(10px,1.5vw,18px);
    padding: clamp(16px,2.5vh,28px) clamp(16px,3vw,32px);
    align-content: start;
  }

  /* ── Sprite card ── */
  .sp-card {
    background: linear-gradient(180deg, rgba(18,10,38,0.92) 0%, rgba(10,5,22,0.96) 100%);
    border: 1px solid rgba(240,192,64,0.14);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    cursor: default;
    position: relative;
  }
  .sp-card--has-mockup {
    cursor: pointer;
  }
  .sp-card--has-mockup:hover {
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
    box-shadow: 0 6px 28px rgba(0,0,0,0.55), 0 0 22px color-mix(in srgb, var(--accent) 18%, transparent);
    transform: translateY(-3px);
  }
  .sp-card:hover:not(.sp-card--has-mockup) {
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    box-shadow: 0 4px 18px rgba(0,0,0,0.4), 0 0 12px color-mix(in srgb, var(--accent) 8%, transparent);
    transform: translateY(-1px);
  }

  /* Sprite display area */
  .sp-sprite-area {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1.1;
    background:
      linear-gradient(180deg, rgba(8,4,20,0.8) 0%, rgba(6,3,16,0.95) 100%),
      repeating-linear-gradient(
        45deg,
        transparent, transparent 10px,
        rgba(240,192,64,0.02) 10px, rgba(240,192,64,0.02) 11px
      );
    overflow: hidden;
  }

  .sp-sprite-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
    opacity: 0;
    transition: opacity 0.3s;
    padding: 8px;
  }
  .sp-sprite-img.loaded { opacity: 1; }

  .sp-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .sp-placeholder-icon {
    font-size: clamp(28px,4vw,44px);
    opacity: 0.35;
    filter: grayscale(0.4);
  }
  .sp-placeholder-label {
    font-size: clamp(7px,0.7vw,9px);
    color: rgba(200,170,100,0.22);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  /* Corner frame */
  .sp-sprite-frame {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 30%),
      linear-gradient(315deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 25%);
  }
  .sp-sprite-frame::before,
  .sp-sprite-frame::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    border-style: solid;
    border-width: 0;
  }
  .sp-sprite-frame::before {
    top: 6px; left: 6px;
    border-top-width: 1.5px;
    border-left-width: 1.5px;
  }
  .sp-sprite-frame::after {
    bottom: 6px; right: 6px;
    border-bottom-width: 1.5px;
    border-right-width: 1.5px;
  }

  /* "Preview" badge on Wanderer */
  .sp-mockup-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    background: color-mix(in srgb, var(--accent) 18%, rgba(4,2,10,0.85));
    border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: 20px;
    padding: 3px 9px 3px 6px;
    color: var(--accent);
    font-family: 'Cinzel', serif;
    font-size: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    pointer-events: none;
    backdrop-filter: blur(4px);
    transition: opacity 0.2s;
  }
  .sp-card--has-mockup:hover .sp-mockup-badge {
    opacity: 1;
    box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  /* Card info strip */
  .sp-card-info {
    padding: 8px 12px 10px;
    border-top: 1px solid rgba(240,192,64,0.08);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sp-unit-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(10px,1vw,13px);
    font-weight: 700;
    color: #f0e0a0;
    letter-spacing: 0.06em;
  }
  .sp-unit-cls {
    font-size: clamp(7px,0.7vw,9px);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--accent) 70%, rgba(200,170,100,0.5));
  }

  /* ── Modal backdrop ── */
  .sp-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(4,2,10,0.82);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: sp-fade-in 0.2s ease;
  }
  @keyframes sp-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Modal box ── */
  .sp-modal {
    position: relative;
    width: 100%;
    max-width: 1000px;
    height: 88vh;
    max-height: 780px;
    background: #07040f;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    border-radius: 18px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.6),
      0 24px 80px rgba(0,0,0,0.7),
      0 0 60px color-mix(in srgb, var(--accent) 10%, transparent);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sp-modal-in 0.22s ease;
  }
  @keyframes sp-modal-in {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }

  /* Modal header */
  .sp-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
    background: rgba(5,3,12,0.75);
    backdrop-filter: blur(8px);
    flex-shrink: 0;
  }
  .sp-modal-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 16px;
    font-weight: 700;
    color: #f0e0a0;
    letter-spacing: 0.06em;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .sp-modal-title-sub {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    letter-spacing: 0.28em;
    color: color-mix(in srgb, var(--accent) 60%, transparent);
    font-weight: 400;
    text-transform: uppercase;
  }
  .sp-modal-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(240,192,64,0.22);
    background: rgba(255,255,255,0.04);
    color: rgba(220,190,120,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.18s;
    flex-shrink: 0;
  }
  .sp-modal-close:hover {
    background: rgba(240,50,50,0.12);
    border-color: rgba(240,80,80,0.45);
    color: #ff8888;
  }

  /* iframe container */
  .sp-modal-iframe-wrap {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  .sp-modal-iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    background: #07040f;
  }

  /* Footer */
  .sp-footer {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: clamp(12px,2vh,20px);
    font-size: clamp(8px,0.8vw,10px);
    color: rgba(180,150,100,0.35);
    letter-spacing: 0.06em;
    border-top: 1px solid rgba(240,192,64,0.06);
    background: rgba(4,2,10,0.5);
  }
  .sp-footer code {
    font-family: 'Courier New', monospace;
    color: rgba(240,192,64,0.45);
    font-size: inherit;
  }
  .sp-footer strong {
    color: rgba(240,192,64,0.55);
    font-weight: 600;
  }
`;
