import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

interface PlacedUnit {
  unitId: string;
  x: number;
  y: number;
}

export default function Placement() {
  const { state, submitPlacement, requestGoBack } = useSocket();
  const [placed, setPlaced] = useState<PlacedUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (state.submittedPlacement && state.submittedPlacement.length > 0) {
      setPlaced(state.submittedPlacement);
    }
  }, [state.submittedPlacement]);

  const picks = state.myBattlePicks;
  const waiting = state.isWaitingForOpponent;

  const COLS = 4;
  const ROWS = 4;

  function getPlacedAt(x: number, y: number): PlacedUnit | undefined {
    return placed.find((p) => p.x === x && p.y === y);
  }

  function getUnitPlacement(unitId: string): PlacedUnit | undefined {
    return placed.find((p) => p.unitId === unitId);
  }

  function handleUnitClick(unitId: string) {
    if (waiting) return;
    const existing = getUnitPlacement(unitId);
    if (existing) {
      setPlaced((prev) => prev.filter((p) => p.unitId !== unitId));
      setSelectedUnitId(unitId);
    } else {
      setSelectedUnitId((prev) => (prev === unitId ? null : unitId));
    }
  }

  function handleTileClick(x: number, y: number) {
    if (waiting) return;
    const occupying = getPlacedAt(x, y);
    if (occupying) {
      setPlaced((prev) => prev.filter((p) => !(p.x === x && p.y === y)));
      setSelectedUnitId(occupying.unitId);
    } else if (selectedUnitId) {
      setPlaced((prev) => {
        const without = prev.filter(
          (p) => p.unitId !== selectedUnitId && !(p.x === x && p.y === y)
        );
        return [...without, { unitId: selectedUnitId, x, y }];
      });
      setSelectedUnitId(null);
    }
  }

  function handleConfirm() {
    if (placed.length !== picks.length) return;
    submitPlacement(placed);
  }

  return (
    <div className="pl-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');

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
        .back-btn {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          background: none; border: 1px solid rgba(240,192,64,0.3);
          color: rgba(240,192,64,0.65); font-family: 'Cinzel', serif;
          font-size: 0.75rem; letter-spacing: 0.05em;
          padding: 0.28rem 0.7rem; border-radius: 4px; cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: rgba(240,192,64,0.1); color: #f0c040;
          border-color: rgba(240,192,64,0.6);
        }
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
          transition: all 0.12s;
          position: relative; overflow: hidden;
          cursor: pointer;
        }
        .pl-tile:hover:not(.occupied) {
          border-color: rgba(240,192,64,0.45);
          background: rgba(240,192,64,0.08);
        }
        .pl-tile.drop-target {
          border-color: rgba(240,192,64,0.8);
          background: rgba(240,192,64,0.16);
          box-shadow: inset 0 0 14px rgba(240,192,64,0.2);
          animation: pulse-tile 0.7s ease-in-out infinite alternate;
        }
        @keyframes pulse-tile { from { box-shadow: inset 0 0 6px rgba(240,192,64,0.1); } to { box-shadow: inset 0 0 18px rgba(240,192,64,0.3); } }
        .pl-tile.occupied {
          border-color: rgba(80,200,120,0.4);
          cursor: pointer;
        }
        .pl-tile.occupied:hover {
          border-color: rgba(240,100,100,0.6);
          background: rgba(240,100,100,0.07);
        }
        .pl-tile-remove {
          position: absolute; top: 2px; right: 3px;
          font-size: 0.55rem;
          color: rgba(240,100,100,0.6);
          cursor: pointer;
          line-height: 1;
          padding: 2px;
          z-index: 2;
          pointer-events: none;
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
          display: flex; flex-direction: column; gap: 0.45rem;
          min-width: 165px;
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
          user-select: none;
        }
        .pl-unit-btn:hover:not(.placed):not(.unit-selected) {
          border-color: rgba(240,192,64,0.45);
          background: rgba(20,14,40,0.9);
        }
        .pl-unit-btn.unit-selected {
          border-color: rgba(240,192,64,0.9);
          background: rgba(240,192,64,0.12);
          box-shadow: 0 0 12px rgba(240,192,64,0.2);
        }
        .pl-unit-btn.placed {
          border-color: rgba(80,200,120,0.45);
          opacity: 0.65;
        }
        .pl-unit-btn.placed:hover {
          opacity: 0.85;
          border-color: rgba(240,100,100,0.5);
        }
        .pl-click-hint {
          font-size: 0.6rem; color: rgba(200,170,100,0.35);
          text-align: center; margin-top: 0.25rem;
          font-family: 'Cinzel', serif;
          font-style: italic;
        }
        .pl-unit-portrait {
          width: 32px; height: 32px;
          border-radius: 4px;
          object-fit: cover;
          object-position: center top;
          flex-shrink: 0;
        }
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

        .back-label {
          font-family: 'Cinzel', serif; font-size: 0.62rem;
          color: rgba(200,170,100,0.3); letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .pl-arrow {
          font-size: 0.9rem; color: rgba(240,192,64,0.5);
          text-align: center; margin-top: 0.2rem;
        }

        .tile-sprite {
          image-rendering: pixelated;
          width: 44px;
          height: 44px;
          object-fit: contain;
          filter: drop-shadow(0 1px 4px rgba(0,0,0,0.7));
        }
      `}</style>

      <div className="pl-bg" />

      <div className="pl-header">
        <button className="back-btn" onClick={requestGoBack}>← Back</button>
        <h2 className="pl-title">Deploy Your Forces</h2>
        <div className="pl-subtitle">Select a unit, then click a grid tile to place it</div>
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
                    const unit = p ? picks.find((u) => u.id === p.unitId) : null;
                    const isDropTarget = !!selectedUnitId && !p;
                    return (
                      <div
                        key={`${r}-${c}`}
                        role="button"
                        aria-label={`Grid tile column ${c + 1} row ${r + 1}${unit ? ` (${unit.name})` : ""}`}
                        className={`pl-tile${p ? " occupied" : ""}${isDropTarget ? " drop-target" : ""}`}
                        onClick={() => handleTileClick(c, r)}
                      >
                        {unit && (
                          <>
                            <img
                              className="tile-sprite"
                              src={`/assets/units/${unit.id}-sprite.png`}
                              alt={unit.name}
                            />
                            <div className="pl-tile-remove">✕</div>
                          </>
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
            const isSel = selectedUnitId === unit.id;
            return (
              <button
                key={unit.id}
                className={`pl-unit-btn${p ? " placed" : ""}${isSel ? " unit-selected" : ""}`}
                onClick={() => handleUnitClick(unit.id)}
              >
                <img
                  className="pl-unit-portrait"
                  src={`/assets/units/${unit.id}-portrait.png`}
                  alt={unit.name}
                />
                <div className="pl-unit-name">{unit.name}</div>
                <div className={`pl-unit-status${p ? " placed-ok" : ""}`}>
                  {isSel ? "◉" : p ? "✓" : "—"}
                </div>
              </button>
            );
          })}
          <div className="pl-click-hint">
            {selectedUnitId
              ? `Click a tile to place ${picks.find((u) => u.id === selectedUnitId)?.name ?? ""}`
              : "Click a unit to select it"}
          </div>
        </div>
      </div>

      <div className="pl-footer">
        <div className="pl-progress">{placed.length} / {picks.length} units placed</div>
        {waiting ? (
          <div className="waiting-msg">Waiting for opponent…</div>
        ) : (
          <button
            className="btn-confirm"
            disabled={placed.length !== picks.length}
            onClick={handleConfirm}
          >
            Begin Battle
          </button>
        )}
      </div>
    </div>
  );
}
