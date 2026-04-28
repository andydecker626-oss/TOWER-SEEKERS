import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useParties } from "@/hooks/useParties";
import { ALL_UNITS } from "@/lib/units";
import type { UnitDef } from "@/lib/types";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  physAtk: { label: "Physical", color: "#f0c040" },
  magAtk:  { label: "Magical",  color: "#a78bfa" },
};

function StatRow({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return (
    <div className="sr-row">
      <span className="sr-label">{label}</span>
      <div className="sr-track">
        <div className="sr-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="sr-val">{val}</span>
    </div>
  );
}

function UnitCard({
  unit,
  selected,
  locked,
  onClick,
}: {
  unit: UnitDef;
  selected?: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  const role = ROLE_LABELS[unit.primaryStat] ?? ROLE_LABELS.physAtk;
  const isPhys = unit.primaryStat === "physAtk";
  const sigSkill = unit.skills[0];

  return (
    <div
      className={`uc-card${selected ? " selected" : ""}${locked ? " locked" : ""}`}
      onClick={locked ? undefined : onClick}
    >
      {/* Portrait section */}
      <div className="uc-portrait-area">
        <img
          className="uc-portrait-img"
          src={`/assets/units/${unit.id}-portrait.png`}
          alt={unit.name}
          draggable={false}
        />
        <div className="uc-portrait-fade" />

        {/* Sprite overlaid at bottom of portrait */}
        <img
          className="uc-sprite-img"
          src={`/assets/units/${unit.id}-sprite.png`}
          alt=""
          draggable={false}
        />

        {/* Role badge top-right */}
        <div className="uc-role-badge" style={{ background: `${role.color}22`, borderColor: `${role.color}66`, color: role.color }}>
          {role.label}
        </div>

        {/* Selected check */}
        {selected && (
          <div className="uc-check-badge">✓</div>
        )}
      </div>

      {/* Info section */}
      <div className="uc-info">
        <div className="uc-name">{unit.name}</div>
        <div className="uc-cls">{unit.cls.replace(/-/g, " ")}</div>

        <p className="uc-desc">{unit.description}</p>

        <div className="uc-divider" />

        <div className="uc-stats">
          <StatRow label="HP"  val={unit.baseHp}                                  max={160} color="#ef4444" />
          <StatRow label={isPhys ? "ATK" : "MAG"} val={isPhys ? unit.physAtk : unit.magAtk} max={100} color={role.color} />
          <StatRow label={isPhys ? "DEF" : "MDF"} val={isPhys ? unit.physDef : unit.magDef} max={100} color="#60a5fa" />
          <StatRow label="SPD" val={unit.speed}                                   max={80}  color="#34d399" />
          <StatRow label="MOV" val={unit.moveDist}                                max={4}   color="#fb923c" />
        </div>

        {sigSkill && (
          <div className="uc-sig-skill">
            <span className="uc-sig-label">Signature</span>
            <span className="uc-sig-name">{sigSkill.name}</span>
            <span className="uc-sig-effect">{sigSkill.effect}</span>
          </div>
        )}
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

  const waiting = state.isWaitingForOpponent;
  const opponentLocked = state.opponentPicksLocked;

  const allUnitIds = new Set(ALL_UNITS.map((u) => u.id));
  const matchingParties = parties.filter(
    (p) => p.units.length === 6 && p.units.every((ul) => allUnitIds.has(ul.unitId))
  );

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
      <style>{CSS}</style>
      <div className="presel-bg" />

      <div className="presel-header">
        <h2 className="presel-title">Choose Your Champions</h2>
        <div className="presel-subtitle">Select 6 from the full roster to bring into battle</div>
      </div>

      <div className="presel-topbar">
        <div className="presel-counter">
          {picks.length} <span className="presel-counter-of">/ 6</span> selected
          {opponentLocked && (
            <span className="opp-locked-badge">Opponent locked in</span>
          )}
        </div>

        {!waiting && parties.length > 0 && (
          <div className="load-party-wrap">
            <button
              className="load-party-toggle"
              onClick={() => setPartyPanelOpen((v) => !v)}
            >
              ⚔ Load Party {partyPanelOpen ? "▲" : "▼"}
            </button>
            {partyPanelOpen && (
              <div className="load-party-panel">
                {matchingParties.length === 0 ? (
                  <div className="load-party-empty">No saved 6-unit parties. Build one in the Gathering Hub.</div>
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
      </div>

      <div className="uc-grid">
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

      <div className="presel-footer">
        <div className="selected-row">
          {Array.from({ length: 6 }).map((_, i) => {
            const pickedUnit = picks[i] ? ALL_UNITS.find((u) => u.id === picks[i]) : null;
            return (
              <div key={i} className={`selected-slot${pickedUnit ? " filled" : ""}`}>
                {pickedUnit ? (
                  <img
                    src={`/assets/units/${pickedUnit.id}-sprite.png`}
                    alt={pickedUnit.name}
                    style={{ width: 36, height: 36, objectFit: "contain", imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="slot-num">{i + 1}</span>
                )}
                {pickedUnit && <div className="slot-name">{pickedUnit.name}</div>}
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
            Confirm Party
          </button>
        )}
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');

  .presel-root {
    min-height: 100vh;
    background: #08060f;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1.5rem 9rem;
    position: relative;
    overflow-x: hidden;
  }
  .presel-bg {
    position: fixed; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 90% 50% at 50% 0%, rgba(80,40,160,0.18) 0%, transparent 65%);
  }

  .presel-header {
    text-align: center;
    margin-bottom: 1rem;
    position: relative; z-index: 1;
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
    font-size: 0.75rem;
    color: rgba(200,170,100,0.55);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-top: 0.25rem;
  }

  .presel-topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 1.25rem;
    position: relative; z-index: 2;
    width: 100%; max-width: 1300px;
  }

  .presel-counter {
    font-family: 'Cinzel', serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #f0c040;
    background: rgba(240,192,64,0.07);
    border: 1px solid rgba(240,192,64,0.22);
    border-radius: 8px;
    padding: 0.4rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .presel-counter-of { color: rgba(240,192,64,0.5); font-weight: 400; }
  .opp-locked-badge {
    font-size: 0.6rem;
    background: #c04040;
    color: #fff;
    border-radius: 3px;
    padding: 1px 6px;
    letter-spacing: 0.05em;
  }

  .load-party-wrap { position: relative; }
  .load-party-toggle {
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
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
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 340px;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(12,9,24,0.97);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 10px;
    padding: 0.8rem;
    display: flex; flex-wrap: wrap; gap: 0.5rem;
    z-index: 20;
    scrollbar-width: thin;
    scrollbar-color: rgba(240,192,64,0.2) transparent;
  }
  .party-chip {
    display: flex; align-items: center; gap: 0.5rem;
    background: rgba(240,192,64,0.06);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 7px;
    padding: 0.35rem 0.7rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .party-chip:hover { background: rgba(240,192,64,0.14); border-color: rgba(240,192,64,0.5); }
  .party-chip-name { font-family: 'Cinzel', serif; font-size: 0.7rem; font-weight: 600; color: #f0c040; }
  .party-chip-units { font-size: 0.58rem; color: rgba(200,170,100,0.5); }
  .party-chip-load {
    font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(240,192,64,0.6); border: 1px solid rgba(240,192,64,0.25);
    border-radius: 4px; padding: 0.12rem 0.45rem; transition: all 0.15s;
  }
  .party-chip:hover .party-chip-load { color: #f0c040; border-color: rgba(240,192,64,0.6); }
  .load-party-empty { font-family: 'Cinzel', serif; font-size: 0.7rem; color: rgba(200,170,100,0.35); }

  /* ── Hero card grid ── */
  .uc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.85rem;
    width: 100%;
    max-width: 1300px;
    position: relative; z-index: 1;
  }
  @media (max-width: 1100px) { .uc-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 700px)  { .uc-grid { grid-template-columns: repeat(2, 1fr); } }

  /* ── Hero card ── */
  .uc-card {
    background: rgba(12, 8, 26, 0.9);
    border: 1px solid rgba(240,192,64,0.14);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
    display: flex;
    flex-direction: column;
    user-select: none;
  }
  .uc-card:hover:not(.locked) {
    border-color: rgba(240,192,64,0.5);
    transform: translateY(-3px);
    box-shadow: 0 6px 28px rgba(240,192,64,0.14);
  }
  .uc-card.selected {
    border-color: rgba(240,192,64,0.85);
    box-shadow: 0 0 22px rgba(240,192,64,0.25), inset 0 0 12px rgba(240,192,64,0.06);
  }
  .uc-card.locked { opacity: 0.45; cursor: default; pointer-events: none; }
  .uc-card.locked.selected { opacity: 1; pointer-events: none; }

  /* Portrait area */
  .uc-portrait-area {
    position: relative;
    height: 150px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .uc-portrait-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
    image-rendering: auto;
  }
  .uc-portrait-fade {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(to top, rgba(12,8,26,1) 0%, rgba(12,8,26,0.5) 60%, transparent 100%);
    pointer-events: none;
  }

  /* Sprite overlaid on portrait */
  .uc-sprite-img {
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    height: 72px;
    width: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));
    z-index: 2;
  }

  /* Role badge */
  .uc-role-badge {
    position: absolute;
    top: 7px; right: 7px;
    font-family: 'Cinzel', serif;
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 1px solid;
    border-radius: 4px;
    padding: 2px 7px;
    z-index: 3;
    backdrop-filter: blur(4px);
  }

  /* Selected badge */
  .uc-check-badge {
    position: absolute;
    top: 7px; left: 7px;
    width: 22px; height: 22px;
    background: #f0c040;
    border-radius: 50%;
    font-size: 12px;
    color: #0a0810;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900;
    z-index: 4;
    box-shadow: 0 2px 8px rgba(240,192,64,0.5);
  }

  /* Info section */
  .uc-info {
    padding: 0.55rem 0.7rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
  }
  .uc-name {
    font-family: 'Cinzel', serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #f0e0a0;
  }
  .uc-cls {
    font-size: 0.6rem;
    color: rgba(200,170,100,0.5);
    text-transform: capitalize;
    letter-spacing: 0.06em;
    margin-top: -0.1rem;
  }
  .uc-desc {
    font-size: 0.6rem;
    color: rgba(200,170,100,0.6);
    line-height: 1.45;
    margin: 0.2rem 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .uc-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(240,192,64,0.15), transparent);
    margin: 0.25rem 0;
  }

  /* Stat rows */
  .uc-stats { display: flex; flex-direction: column; gap: 3px; }
  .sr-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .sr-label {
    font-family: 'Cinzel', serif;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(200,170,100,0.55);
    min-width: 28px;
    text-transform: uppercase;
  }
  .sr-track {
    flex: 1;
    height: 4px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
  }
  .sr-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .sr-val {
    font-family: 'Cinzel', serif;
    font-size: 0.55rem;
    color: rgba(200,170,100,0.65);
    min-width: 20px;
    text-align: right;
  }

  /* Signature skill */
  .uc-sig-skill {
    margin-top: 0.3rem;
    background: rgba(240,192,64,0.04);
    border: 1px solid rgba(240,192,64,0.1);
    border-radius: 5px;
    padding: 0.3rem 0.45rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .uc-sig-label {
    font-family: 'Cinzel', serif;
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(240,192,64,0.4);
  }
  .uc-sig-name {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    font-weight: 700;
    color: #f0c040;
  }
  .uc-sig-effect {
    font-size: 0.57rem;
    color: rgba(200,170,100,0.55);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Footer ── */
  .presel-footer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(8,6,15,0.99) 65%, transparent);
    padding: 0.75rem 1.5rem 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    z-index: 10;
  }
  .selected-row {
    display: flex;
    gap: 0.45rem;
    justify-content: center;
  }
  .selected-slot {
    width: 54px;
    background: rgba(15,10,30,0.85);
    border: 1px solid rgba(240,192,64,0.25);
    border-radius: 8px;
    padding: 0.3rem 0.2rem 0.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 56px;
    justify-content: center;
  }
  .selected-slot.filled {
    border-color: rgba(240,192,64,0.65);
    background: rgba(240,192,64,0.06);
  }
  .slot-num {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    color: rgba(200,170,100,0.3);
  }
  .slot-name {
    font-family: 'Cinzel', serif;
    font-size: 0.48rem;
    color: rgba(200,170,100,0.6);
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 50px;
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
    padding: 0.75rem 2.5rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(240,192,64,0.3);
    min-width: 200px;
  }
  .btn-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(240,192,64,0.45); }
  .btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; }
  .waiting-msg {
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    color: rgba(240,192,64,0.6);
    letter-spacing: 0.1em;
    animation: blink 1.4s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;
