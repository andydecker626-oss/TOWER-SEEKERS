import { useSettings } from "@/context/SettingsContext";

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
    box-shadow: 0 24px 72px rgba(0,0,0,0.85), 0 0 40px rgba(240,192,64,0.06);
  }
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
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 1.6rem; padding-top: 1rem;
    border-top: 1px solid rgba(240,192,64,0.1);
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

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
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

          <div className="sm-toggle-row">
            <label className="sm-toggle">
              <input type="checkbox" checked={!settings.muted} onChange={e => setMuted(!e.target.checked)} />
              <span className="sm-toggle-track" />
              <span className="sm-toggle-thumb" />
            </label>
            <span className="sm-label" style={{ minWidth: 0 }}>Music On</span>
          </div>

          <div className="sm-toggle-row">
            <label className="sm-toggle">
              <input type="checkbox" checked={settings.sfxEnabled} onChange={e => setSfxEnabled(e.target.checked)} />
              <span className="sm-toggle-track" />
              <span className="sm-toggle-thumb" />
            </label>
            <span className="sm-label" style={{ minWidth: 0 }}>Sound FX On</span>
          </div>

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

          <div className="sm-toggle-row">
            <label className="sm-toggle">
              <input type="checkbox" checked={settings.showDamageNumbers} onChange={e => setShowDamageNumbers(e.target.checked)} />
              <span className="sm-toggle-track" />
              <span className="sm-toggle-thumb" />
            </label>
            <span className="sm-label" style={{ minWidth: 0 }}>Damage Numbers</span>
          </div>

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

          <div className="sm-footer">
            <button className="sm-reset-btn" onClick={resetDefaults}>Reset Defaults</button>
            <button className="sm-done-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </>
  );
}
