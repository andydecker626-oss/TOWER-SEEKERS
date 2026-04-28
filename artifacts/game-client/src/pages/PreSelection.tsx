import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useParties } from "@/hooks/useParties";
import { ALL_UNITS } from "@/lib/units";
import type { UnitDef } from "@/lib/types";

function StatBar({ val, max = 160 }: { val: number; max?: number }) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return (
    <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "#f0c040", borderRadius: 2 }} />
    </div>
  );
}

function UnitCard({
  unit,
  selected,
  locked,
  enemy,
  onClick,
}: {
  unit: UnitDef;
  selected?: boolean;
  locked?: boolean;
  enemy?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`unit-card${selected ? " selected" : ""}${locked ? " locked" : ""}${enemy ? " enemy-card" : ""}`}
      onClick={locked ? undefined : onClick}
      style={{ cursor: locked ? "default" : "pointer" }}
    >
      <div className="uc-sprite-wrap">
        <div className={`sprite sprite--${unit.cls} ${enemy ? "sprite-enemy" : "sprite-ally"} sprite-idle`} />
        {selected && <div className="uc-check">✓</div>}
      </div>
      <div className="uc-name">{unit.name}</div>
      <div className="uc-cls">{unit.cls.replace(/-/g, " ")}</div>
      <div className="uc-stats">
        <div className="uc-stat-row"><span>HP</span><span>{unit.baseHp}</span></div>
        <StatBar val={unit.baseHp} />
        <div className="uc-stat-row"><span>ATK</span><span>{Math.max(unit.physAtk, unit.magAtk)}</span></div>
        <StatBar val={Math.max(unit.physAtk, unit.magAtk)} />
        <div className="uc-stat-row"><span>SPD</span><span>{unit.speed}</span></div>
        <StatBar val={unit.speed} max={100} />
      </div>
    </div>
  );
}

export default function PreSelection() {
  const { state, submitPicks } = useSocket();
  const { parties } = useParties();
  const [picks, setPicks] = useState<string[]>([]);
  const [partyPanelOpen, setPartyPanelOpen] = useState(false);

  useEffect(() => {
    if (state.submittedPickIds && state.submittedPickIds.length > 0) {
      setPicks(state.submittedPickIds);
    }
  }, [state.submittedPickIds]);

  const myRoster = state.myRoster;
  const enemyRoster = state.enemyRoster;
  const waiting = state.isWaitingForOpponent;
  const opponentLocked = state.opponentPicksLocked;

  const allUnitIds = new Set(ALL_UNITS.map((u) => u.id));
  const matchingParties = parties.filter((p) => p.units.length === 6 && p.units.every((ul) => allUnitIds.has(ul.unitId)));

  function togglePick(id: string) {
    if (waiting) return;
    if (picks.includes(id)) {
      setPicks(picks.filter((p) => p !== id));
    } else if (picks.length < 6) {
      setPicks([...picks, id]);
    }
  }

  function loadParty(unitIds: string[]) {
    setPicks(unitIds);
    setPartyPanelOpen(false);
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
          padding: 1.5rem 1rem 7rem;
          position: relative;
          overflow-x: hidden;
        }
        .presel-bg {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(80,40,160,0.2) 0%, transparent 70%);
        }

        .presel-header {
          text-align: center;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .presel-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #f0c040;
          text-shadow: 0 0 20px rgba(240,192,64,0.4);
          margin: 0;
        }
        .presel-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          color: rgba(200,170,100,0.6);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-top: 0.3rem;
        }

        .presel-counter {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          color: #f0c040;
          background: rgba(240,192,64,0.08);
          border: 1px solid rgba(240,192,64,0.25);
          border-radius: 8px;
          padding: 0.4rem 1.2rem;
          margin-bottom: 1.2rem;
          position: relative; z-index: 1;
        }

        .load-party-bar {
          position: relative; z-index: 1;
          width: 100%;
          max-width: 1100px;
          margin-bottom: 0.8rem;
        }
        .load-party-toggle {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: transparent;
          color: rgba(200,170,100,0.55);
          border: 1px solid rgba(240,192,64,0.18);
          border-radius: 6px;
          padding: 0.38rem 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .load-party-toggle:hover { color: #f0c040; border-color: rgba(240,192,64,0.4); background: rgba(240,192,64,0.05); }
        .load-party-panel {
          margin-top: 0.6rem;
          background: rgba(12,9,24,0.92);
          border: 1px solid rgba(240,192,64,0.2);
          border-radius: 10px;
          padding: 0.9rem 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          max-height: 180px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(240,192,64,0.2) transparent;
        }
        .party-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(240,192,64,0.06);
          border: 1px solid rgba(240,192,64,0.22);
          border-radius: 7px;
          padding: 0.35rem 0.7rem;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .party-chip:hover { background: rgba(240,192,64,0.14); border-color: rgba(240,192,64,0.5); }
        .party-chip-name {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 600;
          color: #f0c040;
        }
        .party-chip-units {
          font-size: 0.62rem;
          color: rgba(200,170,100,0.5);
        }
        .party-chip-load {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,192,64,0.6);
          border: 1px solid rgba(240,192,64,0.25);
          border-radius: 4px;
          padding: 0.15rem 0.45rem;
          transition: all 0.15s;
        }
        .party-chip:hover .party-chip-load { color: #f0c040; border-color: rgba(240,192,64,0.6); }
        .load-party-empty {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          color: rgba(200,170,100,0.35);
          letter-spacing: 0.12em;
          padding: 0.25rem 0;
        }

        .presel-panels {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          position: relative; z-index: 1;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
          max-width: 1100px;
        }

        .presel-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
          min-width: 280px;
          max-width: 500px;
        }

        .panel-label {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          text-align: center;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
        }
        .panel-label.mine {
          color: #f0c040;
          background: rgba(240,192,64,0.08);
          border: 1px solid rgba(240,192,64,0.2);
        }
        .panel-label.opp {
          color: rgba(180,120,200,0.8);
          background: rgba(140,60,200,0.06);
          border: 1px solid rgba(140,60,200,0.2);
        }

        .panel-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(240,192,64,0.2) 30%, rgba(240,192,64,0.2) 70%, transparent);
          align-self: stretch;
          margin-top: 2rem;
        }

        .unit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
        }
        @media (max-width: 500px) {
          .unit-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .unit-card {
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(240,192,64,0.15);
          border-radius: 10px;
          padding: 0.75rem 0.6rem 0.65rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.18s;
          backdrop-filter: blur(8px);
        }
        .unit-card:hover:not(.locked) {
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
        .unit-card.locked { opacity: 0.55; cursor: default !important; }
        .unit-card.enemy-card {
          border-color: rgba(140,60,200,0.2);
        }

        .uc-sprite-wrap {
          position: relative;
          width: 48px; height: 56px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.15rem;
        }
        .uc-check {
          position: absolute; top: -4px; right: -4px;
          width: 18px; height: 18px;
          background: #f0c040;
          border-radius: 50%;
          font-size: 10px;
          color: #0a0810;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .uc-name {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #f0e0a0;
          text-align: center;
        }
        .uc-cls {
          font-size: 0.58rem;
          color: rgba(200,170,100,0.5);
          text-transform: capitalize;
          margin-bottom: 0.15rem;
        }
        .uc-stats { width: 100%; display: flex; flex-direction: column; gap: 3px; }
        .uc-stat-row {
          display: flex; justify-content: space-between;
          font-size: 0.58rem;
          color: rgba(200,170,100,0.65);
        }

        .presel-footer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(8,6,15,0.98) 70%, transparent);
          padding: 0.75rem 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          z-index: 10;
        }

        .selected-row {
          display: flex;
          gap: 0.4rem;
          justify-content: center;
        }
        .selected-slot {
          width: 44px; height: 44px;
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(240,192,64,0.3);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.58rem;
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
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
          color: #0a0810;
          border: none;
          border-radius: 8px;
          padding: 0.8rem 2.5rem;
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
        <div className="presel-subtitle">Select 6 from the full roster to bring into battle</div>
      </div>

      <div className="presel-counter">{picks.length} / 6 selected</div>

      {!waiting && parties.length > 0 && (
        <div className="load-party-bar">
          <button
            className="load-party-toggle"
            onClick={() => setPartyPanelOpen((v) => !v)}
          >
            ⚔ Load Party {partyPanelOpen ? "▲" : "▼"}
          </button>
          {partyPanelOpen && (
            <div className="load-party-panel">
              {matchingParties.length === 0 ? (
                <div className="load-party-empty">No saved 6-unit parties found. Build one in the Gathering Hub.</div>
              ) : (
                matchingParties.map((party) => (
                  <div key={party.id} className="party-chip" onClick={() => loadParty(party.units.map((ul) => ul.unitId))}>
                    <div>
                      <div className="party-chip-name">{party.name}</div>
                      <div className="party-chip-units">
                        {party.units.map((ul) => ALL_UNITS.find((u) => u.id === ul.unitId)?.name ?? ul.unitId).join(", ")}
                      </div>
                    </div>
                    <span className="party-chip-load">Load</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="presel-panels">
        <div className="presel-panel" style={{ maxWidth: 900, width: "100%" }}>
          <div className="panel-label mine" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Full Roster — Pick 6 to bring into battle
            {opponentLocked && (
              <span style={{ fontSize: "0.6rem", background: "#c04040", color: "#fff", borderRadius: 3, padding: "1px 6px", fontFamily: "Cinzel, serif", letterSpacing: "0.05em", verticalAlign: "middle" }}>
                Opponent locked in
              </span>
            )}
          </div>
          <div className="unit-grid">
            {ALL_UNITS.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                selected={picks.includes(unit.id)}
                locked={waiting || (!picks.includes(unit.id) && picks.length >= 6)}
                onClick={() => togglePick(unit.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="presel-footer">
        <div className="selected-row">
          {Array.from({ length: 6 }).map((_, i) => {
            const pickedId = picks[i];
            const pickedUnit = pickedId ? ALL_UNITS.find((u) => u.id === pickedId) : null;
            return (
              <div key={i} className={`selected-slot${pickedUnit ? " filled" : ""}`}>
                {pickedUnit ? (
                  <div
                    className={`sprite sprite--${pickedUnit.cls} sprite-ally sprite-idle`}
                    style={{ transform: "scale(0.5)", transformOrigin: "center" }}
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
            disabled={picks.length !== 6}
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
