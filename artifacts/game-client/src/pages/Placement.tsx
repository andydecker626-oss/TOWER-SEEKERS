import { useState } from "react";
import { useSocket } from "@/context/SocketContext";
import type { UnitDef } from "@/lib/types";

interface PlacedUnit {
  unitId: string;
  x: number;
  y: number;
}

export default function Placement() {
  const { state, submitPlacement } = useSocket();
  const [placed, setPlaced] = useState<PlacedUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const picks = state.myPicks;
  const waiting = state.isWaitingForOpponent;

  const COLS = 4;
  const ROWS = 4;

  function getPlacedAt(x: number, y: number): PlacedUnit | undefined {
    return placed.find((p) => p.x === x && p.y === y);
  }

  function getUnitPlacement(unitId: string): PlacedUnit | undefined {
    return placed.find((p) => p.unitId === unitId);
  }

  function handleTileClick(x: number, y: number) {
    if (waiting || !selectedUnit) return;
    const occupant = getPlacedAt(x, y);
    if (occupant) {
      if (occupant.unitId === selectedUnit) {
        setPlaced(placed.filter((p) => p.unitId !== selectedUnit));
        return;
      }
      const newPlaced = placed
        .filter((p) => p.unitId !== selectedUnit && !(p.x === x && p.y === y))
        .concat([{ unitId: selectedUnit, x, y }]);
      setPlaced(newPlaced);
    } else {
      setPlaced([
        ...placed.filter((p) => p.unitId !== selectedUnit),
        { unitId: selectedUnit, x, y },
      ]);
    }
    setSelectedUnit(null);
  }

  function handleConfirm() {
    if (placed.length !== 4) return;
    submitPlacement(placed);
  }

  return (
    <div className="pl-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');
        ${spriteCSS()}

        .pl-root {
          min-height: 100vh;
          background: #08060f;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
          position: relative;
        }
        .pl-bg {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(60,30,130,0.2) 0%, transparent 65%);
        }

        .pl-header { text-align: center; margin-bottom: 1.5rem; position: relative; z-index: 1; }
        .pl-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: 1.6rem; font-weight: 700;
          color: #f0c040;
          text-shadow: 0 0 16px rgba(240,192,64,0.4);
          margin: 0;
        }
        .pl-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem; letter-spacing: 0.25em;
          color: rgba(200,170,100,0.55); text-transform: uppercase;
          margin-top: 0.3rem;
        }

        .pl-body {
          display: flex; gap: 2rem; align-items: flex-start;
          position: relative; z-index: 1;
          flex-wrap: wrap; justify-content: center;
        }

        .pl-grid-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
        .pl-grid-label {
          font-family: 'Cinzel', serif; font-size: 0.7rem;
          letter-spacing: 0.2em; color: rgba(200,170,100,0.5); text-transform: uppercase;
        }
        .pl-grid {
          display: grid;
          grid-template-columns: repeat(4, 72px);
          grid-template-rows: repeat(4, 72px);
          gap: 4px;
          background: rgba(10,8,20,0.6);
          border: 1px solid rgba(240,192,64,0.2);
          border-radius: 10px;
          padding: 6px;
        }
        .pl-tile {
          width: 72px; height: 72px;
          background: rgba(20,14,36,0.7);
          border: 1px solid rgba(240,192,64,0.12);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          position: relative; overflow: hidden;
        }
        .pl-tile:hover:not(.empty-disabled) {
          border-color: rgba(240,192,64,0.5);
          background: rgba(240,192,64,0.08);
        }
        .pl-tile.targeted {
          border-color: rgba(240,192,64,0.8);
          background: rgba(240,192,64,0.12);
          box-shadow: inset 0 0 12px rgba(240,192,64,0.12);
        }
        .pl-tile.occupied-selected {
          border-color: rgba(100,200,255,0.7);
          background: rgba(100,200,255,0.1);
        }

        .tile-col-label {
          font-family: 'Cinzel', serif; font-size: 0.6rem;
          color: rgba(200,170,100,0.4); text-align: center;
        }
        .col-labels {
          display: grid; grid-template-columns: repeat(4, 72px); gap: 4px;
          padding: 0 6px;
        }

        .pl-units {
          display: flex; flex-direction: column; gap: 0.6rem;
          min-width: 160px;
        }
        .pl-units-label {
          font-family: 'Cinzel', serif; font-size: 0.7rem;
          letter-spacing: 0.2em; color: rgba(200,170,100,0.5);
          text-transform: uppercase; text-align: center;
        }
        .pl-unit-btn {
          display: flex; align-items: center; gap: 0.6rem;
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(240,192,64,0.15);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          text-align: left;
        }
        .pl-unit-btn:hover { border-color: rgba(240,192,64,0.45); background: rgba(20,14,40,0.9); }
        .pl-unit-btn.active {
          border-color: #f0c040;
          background: rgba(240,192,64,0.1);
          box-shadow: 0 0 12px rgba(240,192,64,0.2);
        }
        .pl-unit-btn.placed { border-color: rgba(80,200,120,0.45); }
        .pl-unit-name {
          font-family: 'Cinzel', serif; font-size: 0.8rem;
          font-weight: 600; color: #f0e0a0; flex: 1;
        }
        .pl-unit-status {
          font-size: 0.65rem;
          color: rgba(200,170,100,0.5);
        }
        .pl-unit-status.placed-ok { color: rgba(80,200,120,0.8); }

        .pl-footer {
          margin-top: 2rem; position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
        }
        .pl-progress {
          font-family: 'Cinzel', serif; font-size: 0.85rem;
          color: rgba(200,170,100,0.6);
        }
        .btn-confirm {
          font-family: 'Cinzel', serif; font-size: 1rem;
          font-weight: 700; letter-spacing: 0.1em;
          background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
          color: #0a0810; border: none; border-radius: 8px;
          padding: 0.9rem 2.5rem; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(240,192,64,0.3);
          min-width: 200px;
        }
        .btn-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(240,192,64,0.45); }
        .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
        .waiting-msg {
          font-family: 'Cinzel', serif; font-size: 0.85rem;
          color: rgba(240,192,64,0.6); letter-spacing: 0.1em;
          animation: blink 1.4s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .grid-row-label {
          position: absolute; left: -20px; top: 50%; transform: translateY(-50%);
          font-size: 0.6rem; color: rgba(200,170,100,0.3);
          font-family: 'Cinzel', serif;
        }
        .front-label {
          font-family: 'Cinzel', serif; font-size: 0.62rem;
          color: rgba(240,192,64,0.5); letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .back-label {
          font-family: 'Cinzel', serif; font-size: 0.62rem;
          color: rgba(200,170,100,0.3); letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .pl-arrow {
          font-size: 0.9rem; color: rgba(240,192,64,0.5);
          text-align: center; margin-top: 0.2rem;
        }
      `}</style>

      <div className="pl-bg" />

      <div className="pl-header">
        <h2 className="pl-title">Deploy Your Forces</h2>
        <div className="pl-subtitle">Place your 4 units on the battlefield</div>
      </div>

      <div className="pl-body">
        <div className="pl-grid-wrap">
          <div className="pl-grid-label">Your Side</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginRight: 4 }}>
              {Array.from({ length: ROWS }).map((_, r) => (
                <div key={r} style={{ height: 72, display: "flex", alignItems: "center" }}>
                  <div className="back-label" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", opacity: r === 0 ? 0.8 : 0.4 }}>
                    {r === 0 ? "back" : r === 3 ? "front" : ""}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="col-labels">
                {Array.from({ length: COLS }).map((_, c) => (
                  <div key={c} className="tile-col-label">{c + 1}</div>
                ))}
              </div>
              <div className="pl-grid">
                {Array.from({ length: ROWS }).map((_, r) =>
                  Array.from({ length: COLS }).map((_, c) => {
                    const p = getPlacedAt(c, r);
                    const isTargeted = !p && !!selectedUnit;
                    const isOccupiedSelected = p && p.unitId === selectedUnit;
                    const unit = p ? picks.find((u) => u.id === p.unitId) : null;
                    return (
                      <div
                        key={`${r}-${c}`}
                        role="button"
                        aria-label={`Grid tile column ${c + 1} row ${r + 1}${unit ? ` (${unit.name})` : ""}`}
                        tabIndex={selectedUnit ? 0 : -1}
                        className={`pl-tile${isTargeted ? " targeted" : ""}${isOccupiedSelected ? " occupied-selected" : ""}`}
                        style={{ cursor: selectedUnit ? "pointer" : "default" }}
                        onClick={() => handleTileClick(c, r)}
                        onKeyDown={(e) => e.key === "Enter" && handleTileClick(c, r)}
                      >
                        {unit && (
                          <div className={`sprite sprite--${unit.cls} sprite-ally sprite-idle`} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="pl-arrow">→ Facing Enemy →</div>
        </div>

        <div className="pl-units">
          <div className="pl-units-label">Your Units</div>
          {picks.map((unit) => {
            const p = getUnitPlacement(unit.id);
            const isActive = selectedUnit === unit.id;
            return (
              <button
                key={unit.id}
                className={`pl-unit-btn${isActive ? " active" : ""}${p ? " placed" : ""}`}
                onClick={() => setSelectedUnit(isActive ? null : unit.id)}
              >
                <div className={`sprite sprite--${unit.cls} sprite-ally sprite-idle`} style={{ transform: "scale(0.6)", transformOrigin: "center" }} />
                <div className="pl-unit-name">{unit.name}</div>
                <div className={`pl-unit-status${p ? " placed-ok" : ""}`}>
                  {p ? `(${p.x},${p.y}) ✓` : "—"}
                </div>
              </button>
            );
          })}
          <div style={{ fontSize: "0.7rem", color: "rgba(200,170,100,0.4)", textAlign: "center", marginTop: "0.5rem", fontFamily: "Cinzel, serif" }}>
            Col 3 = front row
          </div>
        </div>
      </div>

      <div className="pl-footer">
        <div className="pl-progress">{placed.length} / 4 units placed</div>
        {waiting ? (
          <div className="waiting-msg">Waiting for opponent…</div>
        ) : (
          <button
            className="btn-confirm"
            disabled={placed.length !== 4}
            onClick={handleConfirm}
          >
            Begin Battle
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
