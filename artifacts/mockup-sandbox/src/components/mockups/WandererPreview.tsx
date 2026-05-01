import { useState } from "react";

/* ── Animation slots ─────────────────────────────────────────────────────── */
interface AnimSlot {
  id:       string;
  label:    string;
  sub:      string;
  type:     "base" | "evade" | "buff" | "physical" | "magical";
  ap?:      number;
  featured?: boolean;
  liveUrl?: string;
}

const ANIM_SLOTS: AnimSlot[] = [
  {
    id: "base-attack", label: "Base Attack", sub: "Default melee slash",
    type: "base", featured: true,
    liveUrl: "/__mockup/preview/pvp-battler/SwordAttackDemo",
  },
  { id: "evade",          label: "Evade",          sub: "Evasion dodge step",                           type: "evade"                },
  { id: "feint",          label: "Feint",          sub: "Crit-set stance shift",                        type: "buff",     ap: 1      },
  { id: "rising-slash",   label: "Rising Slash",   sub: "Upward blade arc",                             type: "physical", ap: 2      },
  { id: "falling-edge",   label: "Falling Edge",   sub: "Downward combo finisher",                      type: "physical", ap: 2      },
  { id: "shadow-step",    label: "Shadow Step",    sub: "3-tile teleport + evasion buff",               type: "buff",     ap: 2      },
  { id: "phantom-strike", label: "Phantom Strike", sub: "Teleport-slash, ignores PhysDef",              type: "physical", ap: 3      },
  { id: "mirage-veil",    label: "Mirage Veil",    sub: "+40% evasion for 4 turns",                     type: "buff",     ap: 4      },
  { id: "wind-slash",     label: "Wind Slash",     sub: "Blade of wind — 4-tile range",                 type: "magical",  ap: 2      },
  { id: "arcane-tempest", label: "Arcane Tempest", sub: "AoE storm of magical blades (Phantom Stance)", type: "magical",  ap: 6      },
];

const TYPE_META: Record<AnimSlot["type"], { color: string; label: string; icon: string }> = {
  base:     { color: "#f0c040", label: "Base",     icon: "⚔" },
  evade:    { color: "#44cccc", label: "Evade",    icon: "💨" },
  buff:     { color: "#44cccc", label: "Buff",     icon: "✦" },
  physical: { color: "#ff8844", label: "Physical", icon: "🗡" },
  magical:  { color: "#aa44ff", label: "Magical",  icon: "✦" },
};

/* ── Featured live slot (Base Attack) ───────────────────────────────────── */
function FeaturedSlot({ slot }: { slot: AnimSlot }) {
  const meta = TYPE_META[slot.type];
  return (
    <div
      className="gif-slot gif-slot--featured"
      style={{ "--c": meta.color } as React.CSSProperties}
    >
      {/* Type pill */}
      <div className="gif-slot-pill">
        <span className="gif-slot-pill-icon">{meta.icon}</span>
        <span className="gif-slot-pill-label">{meta.label}</span>
        <span className="gif-slot-live-badge">● LIVE</span>
      </div>

      {/* Embedded live animation */}
      <div className="gif-frame gif-frame--featured">
        <iframe
          src={slot.liveUrl}
          className="gif-live-iframe"
          title={slot.label}
        />
      </div>

      {/* Info */}
      <div className="gif-slot-info">
        <span className="gif-slot-name">{slot.label}</span>
        <span className="gif-slot-sub">{slot.sub}</span>
      </div>
      <div className="gif-slot-status loaded">✓ Live preview</div>
    </div>
  );
}

/* ── GIF Placeholder tile ────────────────────────────────────────────────── */
function GifSlot({ slot, onUpload }: { slot: AnimSlot; onUpload: (id: string, url: string) => void }) {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [hover,  setHover ] = useState(false);
  const meta = TYPE_META[slot.type];

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setGifUrl(url);
    onUpload(slot.id, url);
  }

  return (
    <div
      className="gif-slot"
      style={{ "--c": meta.color } as React.CSSProperties}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="gif-slot-pill">
        <span className="gif-slot-pill-icon">{meta.icon}</span>
        <span className="gif-slot-pill-label">{meta.label}</span>
        {slot.ap != null && <span className="gif-slot-ap">{slot.ap} AP</span>}
      </div>

      <div className="gif-frame">
        {gifUrl ? (
          <img src={gifUrl} alt={slot.label} className="gif-img" />
        ) : (
          <div className="gif-placeholder">
            <div className="gif-placeholder-grid" />
            <div className="gif-placeholder-icon">GIF</div>
            <div className="gif-placeholder-sub">drop or click to load</div>
          </div>
        )}
        {gifUrl && hover && (
          <label className="gif-swap-overlay">
            <input type="file" accept=".gif,image/gif" onChange={handleFile} style={{ display: "none" }} />
            ↺ Replace
          </label>
        )}
        {!gifUrl && (
          <label className="gif-upload-label">
            <input type="file" accept=".gif,image/gif" onChange={handleFile} style={{ display: "none" }} />
          </label>
        )}
      </div>

      <div className="gif-slot-info">
        <span className="gif-slot-name">{slot.label}</span>
        <span className="gif-slot-sub">{slot.sub}</span>
      </div>
      <div className={`gif-slot-status ${gifUrl ? "loaded" : "pending"}`}>
        {gifUrl ? "✓ Loaded" : "Pending"}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function WandererPreview() {
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [filter, setFilter]   = useState<AnimSlot["type"] | "all">("all");

  function handleUpload(id: string, url: string) {
    setUploads(prev => ({ ...prev, [id]: url }));
  }

  const featuredSlot  = ANIM_SLOTS.find(s => s.featured)!;
  const regularSlots  = ANIM_SLOTS.filter(s => !s.featured);

  const loadedCount = Object.keys(uploads).length + 1;
  const totalCount  = ANIM_SLOTS.length;

  const types: Array<AnimSlot["type"] | "all"> = ["all", "base", "evade", "physical", "magical", "buff"];

  const visibleRegular = filter === "all"
    ? regularSlots
    : regularSlots.filter(s => s.type === filter);

  const showFeatured = filter === "all" || filter === "base";

  return (
    <div className="wp-root">
      <style>{CSS}</style>
      <div className="wp-bg" />

      {/* Header */}
      <div className="wp-header">
        <div className="wp-header-identity">
          <div className="wp-class-badge">Fell-Duelist</div>
          <div className="wp-unit-name">Wanderer</div>
          <div className="wp-unit-sub">Animation Preview Workbench</div>
        </div>

        <div className="wp-progress">
          <div className="wp-progress-label">
            {loadedCount} / {totalCount} animations loaded
          </div>
          <div className="wp-progress-track">
            <div className="wp-progress-fill" style={{ width: `${(loadedCount / totalCount) * 100}%` }} />
          </div>
        </div>

        <div className="wp-header-note">
          Click any slot to load a .gif · Base Attack is live
        </div>
      </div>

      {/* Filter bar */}
      <div className="wp-filter-bar">
        {types.map(t => (
          <button
            key={t}
            className={`wp-filter-btn${filter === t ? " active" : ""}`}
            style={{ "--fc": t === "all" ? "#f0c040" : TYPE_META[t as AnimSlot["type"]]?.color ?? "#f0c040" } as React.CSSProperties}
            onClick={() => setFilter(t)}
          >
            {t === "all" ? "All" : TYPE_META[t as AnimSlot["type"]].label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="wp-grid">
        {/* Full-width featured Base Attack tile */}
        {showFeatured && <FeaturedSlot slot={featuredSlot} />}

        {/* Regular GIF placeholder slots */}
        {visibleRegular.map(slot => (
          <GifSlot key={slot.id} slot={slot} onUpload={handleUpload} />
        ))}
      </div>
    </div>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .wp-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    background: #07040f;
    font-family: 'Cinzel', serif;
    color: #e8d8b0;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  .wp-bg {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,10,80,0.55) 0%, transparent 65%),
      linear-gradient(180deg, #07040f 0%, #0a0618 50%, #07040f 100%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Header ── */
  .wp-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 28px;
    padding: 16px 28px;
    border-bottom: 1px solid rgba(240,192,64,0.14);
    background: rgba(5,3,12,0.7);
    backdrop-filter: blur(10px);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .wp-header-identity { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
  .wp-class-badge {
    font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(68,204,204,0.7); background: rgba(68,204,204,0.1);
    border: 1px solid rgba(68,204,204,0.25); border-radius: 6px;
    padding: 2px 8px; width: fit-content;
  }
  .wp-unit-name {
    font-family: 'Cinzel Decorative', serif; font-size: 22px;
    font-weight: 700; color: #f0e0a0; letter-spacing: 0.06em; line-height: 1.1;
  }
  .wp-unit-sub {
    font-size: 8px; letter-spacing: 0.16em;
    color: rgba(200,180,140,0.4); text-transform: uppercase;
  }

  .wp-progress { flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 6px; }
  .wp-progress-label { font-size: 9px; letter-spacing: 0.1em; color: rgba(240,192,64,0.5); text-transform: uppercase; }
  .wp-progress-track { height: 4px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
  .wp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #44cccc, #f0c040);
    border-radius: 4px; transition: width 0.4s ease;
  }

  .wp-header-note { font-size: 8px; letter-spacing: 0.1em; color: rgba(180,160,120,0.35); text-align: right; flex-shrink: 0; font-style: italic; }

  /* ── Filter bar ── */
  .wp-filter-bar {
    position: relative; z-index: 10;
    display: flex; gap: 6px; flex-wrap: wrap;
    padding: 12px 28px;
    background: rgba(4,2,10,0.4);
    border-bottom: 1px solid rgba(240,192,64,0.07);
  }
  .wp-filter-btn {
    padding: 4px 14px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(14,8,28,0.7);
    color: rgba(200,170,100,0.5);
    font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 0.12em;
    cursor: pointer; transition: all 0.15s;
  }
  .wp-filter-btn:hover {
    border-color: color-mix(in srgb, var(--fc) 40%, transparent);
    color: color-mix(in srgb, var(--fc) 80%, #fff);
  }
  .wp-filter-btn.active {
    background: color-mix(in srgb, var(--fc) 15%, transparent);
    border-color: color-mix(in srgb, var(--fc) 55%, transparent);
    color: var(--fc);
    box-shadow: 0 0 10px color-mix(in srgb, var(--fc) 12%, transparent);
  }

  /* ── Grid ── */
  .wp-grid {
    position: relative; z-index: 10; flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    padding: 24px 28px;
    align-content: start;
  }

  /* ── GIF Slot ── */
  .gif-slot {
    background: linear-gradient(180deg, rgba(18,10,38,0.92) 0%, rgba(10,5,22,0.96) 100%);
    border: 1px solid color-mix(in srgb, var(--c) 18%, rgba(240,192,64,0.1));
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .gif-slot:hover {
    border-color: color-mix(in srgb, var(--c) 45%, transparent);
    box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 18px color-mix(in srgb, var(--c) 14%, transparent);
    transform: translateY(-2px);
  }

  /* Featured slot spans full width, no hover lift */
  .gif-slot--featured {
    grid-column: 1 / -1;
    transform: none !important;
    border-color: color-mix(in srgb, var(--c) 30%, rgba(240,192,64,0.15));
    box-shadow: 0 0 32px color-mix(in srgb, var(--c) 10%, transparent);
  }
  .gif-slot--featured:hover {
    border-color: color-mix(in srgb, var(--c) 55%, transparent);
    box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 32px color-mix(in srgb, var(--c) 18%, transparent);
    transform: none;
  }

  /* Type pill */
  .gif-slot-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 7px 12px 5px;
  }
  .gif-slot-pill-icon { font-size: 10px; color: var(--c); opacity: 0.8; }
  .gif-slot-pill-label {
    font-size: 7px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--c); opacity: 0.75; flex: 1;
  }
  .gif-slot-ap {
    font-size: 7px; color: rgba(240,192,64,0.55); letter-spacing: 0.08em;
    background: rgba(240,192,64,0.08); border: 1px solid rgba(240,192,64,0.15);
    border-radius: 10px; padding: 1px 6px;
  }
  .gif-slot-live-badge {
    font-size: 7px; letter-spacing: 0.14em;
    color: color-mix(in srgb, var(--c) 90%, #fff);
    background: color-mix(in srgb, var(--c) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
    border-radius: 10px; padding: 1px 7px;
    animation: livePulse 2s ease-in-out infinite;
  }
  @keyframes livePulse {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }

  /* Frame area */
  .gif-frame {
    position: relative; width: 100%; aspect-ratio: 4 / 3;
    background: linear-gradient(180deg, rgba(8,4,20,0.8) 0%, rgba(5,3,14,0.95) 100%);
    overflow: hidden;
    border-top: 1px solid color-mix(in srgb, var(--c) 12%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--c) 12%, transparent);
    cursor: pointer;
  }

  /* Featured frame: 16:9 for the battle scene */
  .gif-frame--featured {
    aspect-ratio: 16 / 9;
    cursor: default;
  }

  /* Live iframe — fills the frame exactly */
  .gif-live-iframe {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    border: none; background: #040610;
    display: block;
  }

  .gif-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: contain; image-rendering: pixelated;
  }

  /* Empty placeholder */
  .gif-placeholder {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; pointer-events: none;
  }
  .gif-placeholder-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(color-mix(in srgb, var(--c) 5%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--c) 5%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .gif-placeholder-icon {
    position: relative; font-family: 'Cinzel', serif;
    font-size: 22px; font-weight: 700; letter-spacing: 0.2em;
    color: color-mix(in srgb, var(--c) 20%, transparent);
  }
  .gif-placeholder-sub {
    position: relative; font-size: 8px; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(200,170,100,0.18);
  }

  .gif-upload-label { position: absolute; inset: 0; cursor: pointer; }
  .gif-swap-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(4,2,10,0.65); font-size: 10px; letter-spacing: 0.14em;
    color: rgba(240,192,64,0.8); cursor: pointer;
    backdrop-filter: blur(2px); text-transform: uppercase;
  }

  .gif-slot-info { padding: 8px 12px 4px; display: flex; flex-direction: column; gap: 2px; }
  .gif-slot-name { font-size: 11px; font-weight: 700; color: #f0e0a0; letter-spacing: 0.06em; }
  .gif-slot-sub  { font-size: 8px; color: rgba(180,160,120,0.45); letter-spacing: 0.04em; line-height: 1.4; }

  .gif-slot-status {
    margin: 4px 12px 10px; font-size: 7px; letter-spacing: 0.16em;
    text-transform: uppercase; padding: 3px 8px; border-radius: 10px; width: fit-content;
  }
  .gif-slot-status.pending {
    color: rgba(200,170,100,0.3); background: rgba(200,170,100,0.06);
    border: 1px solid rgba(200,170,100,0.1);
  }
  .gif-slot-status.loaded {
    color: color-mix(in srgb, var(--c) 80%, #fff);
    background: color-mix(in srgb, var(--c) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: rgba(10,5,20,0.4); }
  ::-webkit-scrollbar-thumb { background: rgba(68,204,204,0.2); border-radius: 2px; }
`;
