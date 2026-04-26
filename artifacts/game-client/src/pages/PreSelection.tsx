import { useState } from "react";
import { useSocket } from "@/context/SocketContext";
import type { UnitDef } from "@/lib/types";

function StatBar({ val, max = 100 }: { val: number; max?: number }) {
  const pct = Math.round((val / max) * 100);
  return (
    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "#f0c040", borderRadius: 2 }} />
    </div>
  );
}

function UnitCard({
  unit,
  selected,
  canSelect,
  onClick,
}: {
  unit: UnitDef;
  selected: boolean;
  canSelect: boolean;
  onClick: () => void;
}) {
  const statMax = 160;
  return (
    <div
      className={`unit-card${selected ? " selected" : ""}${!canSelect && !selected ? " disabled" : ""}`}
      onClick={onClick}
      style={{ cursor: canSelect || selected ? "pointer" : "not-allowed" }}
    >
      <div className="uc-sprite-wrap">
        <div className={`sprite sprite--${unit.cls} sprite-ally sprite-idle`} />
        {selected && <div className="uc-check">✓</div>}
      </div>
      <div className="uc-name">{unit.name}</div>
      <div className="uc-cls">{unit.cls.replace(/-/g, " ")}</div>
      <div className="uc-stats">
        <div className="uc-stat-row"><span>HP</span><span>{unit.baseHp}</span></div>
        <StatBar val={unit.baseHp} max={statMax} />
        <div className="uc-stat-row"><span>ATK</span><span>{Math.max(unit.physAtk, unit.magAtk)}</span></div>
        <StatBar val={Math.max(unit.physAtk, unit.magAtk)} max={statMax} />
        <div className="uc-stat-row"><span>DEF</span><span>{Math.max(unit.physDef, unit.magDef)}</span></div>
        <StatBar val={Math.max(unit.physDef, unit.magDef)} max={statMax} />
        <div className="uc-stat-row"><span>SPD</span><span>{unit.speed}</span></div>
        <StatBar val={unit.speed} max={100} />
      </div>
    </div>
  );
}

export default function PreSelection() {
  const { state, submitPicks } = useSocket();
  const [picks, setPicks] = useState<string[]>([]);

  const roster = state.myRoster;
  const waiting = state.isWaitingForOpponent;

  function togglePick(id: string) {
    if (waiting) return;
    if (picks.includes(id)) {
      setPicks(picks.filter((p) => p !== id));
    } else if (picks.length < 4) {
      setPicks([...picks, id]);
    }
  }

  return (
    <div className="presel-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');
        ${spriteCSS()}

        .presel-root {
          min-height: 100vh;
          background: #08060f;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem 6rem;
          position: relative;
          overflow-x: hidden;
        }
        .presel-bg {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(80,40,160,0.2) 0%, transparent 70%);
        }

        .presel-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        .presel-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #f0c040;
          text-shadow: 0 0 20px rgba(240,192,64,0.4);
          margin: 0;
        }
        .presel-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          color: rgba(200,170,100,0.6);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-top: 0.3rem;
        }

        .presel-counter {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f0c040;
          background: rgba(240,192,64,0.08);
          border: 1px solid rgba(240,192,64,0.25);
          border-radius: 8px;
          padding: 0.5rem 1.5rem;
          margin-bottom: 1.5rem;
          position: relative; z-index: 1;
        }

        .unit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.8rem;
          max-width: 720px;
          width: 100%;
          position: relative; z-index: 1;
        }
        @media (max-width: 600px) {
          .unit-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .unit-card {
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(240,192,64,0.15);
          border-radius: 10px;
          padding: 0.8rem 0.7rem 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.18s;
          backdrop-filter: blur(8px);
        }
        .unit-card:hover:not(.disabled) {
          border-color: rgba(240,192,64,0.45);
          background: rgba(20,14,40,0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(240,192,64,0.15);
        }
        .unit-card.selected {
          border-color: rgba(240,192,64,0.8);
          background: rgba(240,192,64,0.08);
          box-shadow: 0 0 20px rgba(240,192,64,0.2), inset 0 0 10px rgba(240,192,64,0.05);
        }
        .unit-card.disabled { opacity: 0.45; }

        .uc-sprite-wrap {
          position: relative;
          width: 56px; height: 64px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.2rem;
        }
        .uc-check {
          position: absolute; top: -4px; right: -4px;
          width: 20px; height: 20px;
          background: #f0c040;
          border-radius: 50%;
          font-size: 11px;
          color: #0a0810;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .uc-name {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: #f0e0a0;
          text-align: center;
        }
        .uc-cls {
          font-size: 0.65rem;
          color: rgba(200,170,100,0.5);
          text-transform: capitalize;
          margin-bottom: 0.2rem;
        }
        .uc-stats { width: 100%; display: flex; flex-direction: column; gap: 3px; }
        .uc-stat-row {
          display: flex; justify-content: space-between;
          font-size: 0.62rem;
          color: rgba(200,170,100,0.65);
        }

        .presel-footer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(8,6,15,0.98) 70%, transparent);
          padding: 1rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          z-index: 10;
        }

        .selected-row {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .selected-slot {
          width: 48px; height: 48px;
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(240,192,64,0.3);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem;
          color: rgba(200,170,100,0.4);
          font-family: 'Cinzel', serif;
          overflow: hidden;
          position: relative;
        }
        .selected-slot.filled {
          border-color: rgba(240,192,64,0.7);
          background: rgba(240,192,64,0.06);
        }

        .btn-confirm {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
          color: #0a0810;
          border: none;
          border-radius: 8px;
          padding: 0.9rem 2.5rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(240,192,64,0.3);
          min-width: 200px;
        }
        .btn-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(240,192,64,0.45); }
        .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

        .waiting-msg {
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          color: rgba(240,192,64,0.6);
          letter-spacing: 0.1em;
          animation: blink 1.4s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="presel-bg" />

      <div className="presel-header">
        <h2 className="presel-title">Choose Your Champions</h2>
        <div className="presel-subtitle">Select 4 units from your roster</div>
      </div>

      <div className="presel-counter">{picks.length} / 4 selected</div>

      <div className="unit-grid">
        {roster.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            selected={picks.includes(unit.id)}
            canSelect={picks.length < 4}
            onClick={() => togglePick(unit.id)}
          />
        ))}
      </div>

      <div className="presel-footer">
        <div className="selected-row">
          {Array.from({ length: 4 }).map((_, i) => {
            const pickedId = picks[i];
            const pickedUnit = pickedId ? roster.find((u) => u.id === pickedId) : null;
            return (
              <div key={i} className={`selected-slot${pickedUnit ? " filled" : ""}`}>
                {pickedUnit ? (
                  <div
                    className={`sprite sprite--${pickedUnit.cls} sprite-ally sprite-idle`}
                    style={{ transform: "scale(0.55)", transformOrigin: "center" }}
                  />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {waiting ? (
          <div className="waiting-msg">Waiting for opponent…</div>
        ) : (
          <button
            className="btn-confirm"
            disabled={picks.length !== 4}
            onClick={() => submitPicks(picks)}
          >
            Confirm Selection
          </button>
        )}
      </div>
    </div>
  );
}

function spriteCSS() {
  return `
    .sprite {
      image-rendering: pixelated;
      background-repeat: no-repeat;
      flex-shrink: 0;
      display: block;
    }
    .sprite-ally { filter: none; }
    .sprite-enemy { filter: hue-rotate(180deg) saturate(1.3); }

    .sprite--blade-knight { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/3/30/Blade_Knight.png'); width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--rune-archer  { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/d/dd/Rune_Archer.png');   width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--cleric       { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/a/a4/Cleric.png');        width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--guardian     { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/2/2b/Guardian.png');      width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--lancer       { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/e/e7/Lancer.png');        width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--hex-mage     { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/0/03/Hex_Mage.png');      width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--invoker      { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/5/50/Invoker.png');       width:48px; height:64px; background-size:contain; background-position:center bottom; }
    .sprite--fell-duelist { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/8/8c/Fell_Duelist.png');  width:48px; height:64px; background-size:contain; background-position:center bottom; }
  `;
}
