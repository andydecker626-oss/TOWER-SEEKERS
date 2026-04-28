import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import type { UnitDef } from "@/lib/types";

const ROLE_COLOR: Record<string, string> = {
  physAtk: "#f0c040",
  magAtk:  "#a78bfa",
};

function MiniUnitCard({
  unit,
  selected,
  selectionOrder,
  locked,
  onClick,
  side,
}: {
  unit: UnitDef;
  selected?: boolean;
  selectionOrder?: number;
  locked?: boolean;
  onClick?: () => void;
  side: "mine" | "enemy";
}) {
  const roleColor = ROLE_COLOR[unit.primaryStat] ?? ROLE_COLOR.physAtk;
  return (
    <div
      className={`bs-card ${side}${selected ? " selected" : ""}${locked ? " locked" : ""}`}
      onClick={locked ? undefined : onClick}
    >
      <div className="bs-card-portrait-wrap">
        <img
          className="bs-card-portrait"
          src={`/assets/units/${unit.id}-portrait.png`}
          alt={unit.name}
          draggable={false}
        />
        <div className="bs-card-portrait-fade" />
        <img
          className="bs-card-sprite"
          src={`/assets/units/${unit.id}-sprite.png`}
          alt=""
          draggable={false}
        />
        {selected && side === "mine" && (
          <div className="bs-order-badge">{selectionOrder}</div>
        )}
      </div>
      <div className="bs-card-name">{unit.name}</div>
      <div className="bs-card-cls" style={{ color: roleColor }}>{unit.cls.replace(/-/g, " ")}</div>
    </div>
  );
}

export default function BattleSelect() {
  const { state, submitBattlePicks } = useSocket();
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    if (state.submittedBattlePickIds && state.submittedBattlePickIds.length > 0) {
      setChosen(state.submittedBattlePickIds);
    }
  }, [state.submittedBattlePickIds]);

  const { myPicks, enemyPicks, isWaitingForOpponent, opponentBattlePicksLocked } = state;

  function toggleChosen(id: string) {
    if (isWaitingForOpponent) return;
    if (chosen.includes(id)) {
      setChosen(chosen.filter((c) => c !== id));
    } else if (chosen.length < 4) {
      setChosen([...chosen, id]);
    }
  }

  function handleConfirm() {
    if (chosen.length === 4) submitBattlePicks(chosen);
  }

  return (
    <div className="bs-root">
      <style>{CSS}</style>
      <div className="bs-bg" />

      <div className="bs-header">
        <h2 className="bs-title">Choose Your Battle Party</h2>
        <p className="bs-subtitle">Study your opponent — select 4 champions to send into battle</p>
      </div>

      <div className="bs-arena">
        <div className="bs-team-panel mine">
          <div className="bs-team-label mine">
            <span className="bs-team-label-icon">⚔</span>
            Your Party
            <span className="bs-team-counter">{chosen.length} / 4 selected</span>
          </div>
          <div className="bs-team-grid">
            {myPicks.map((unit) => {
              const order = chosen.indexOf(unit.id) + 1;
              return (
                <MiniUnitCard
                  key={unit.id}
                  unit={unit}
                  selected={chosen.includes(unit.id)}
                  selectionOrder={order > 0 ? order : undefined}
                  locked={isWaitingForOpponent || (!chosen.includes(unit.id) && chosen.length >= 4)}
                  onClick={() => toggleChosen(unit.id)}
                  side="mine"
                />
              );
            })}
          </div>
          <p className="bs-team-hint">Click a champion to add / remove from your battle party</p>
        </div>

        <div className="bs-vs-divider">
          <div className="bs-vs-line" />
          <div className="bs-vs-badge">VS</div>
          <div className="bs-vs-line" />
        </div>

        <div className="bs-team-panel enemy">
          <div className="bs-team-label enemy">
            <span className="bs-team-label-icon">🛡</span>
            Opponent's Party
            {opponentBattlePicksLocked && (
              <span className="bs-locked-badge">Locked In</span>
            )}
          </div>
          <div className="bs-team-grid">
            {enemyPicks.map((unit) => (
              <MiniUnitCard
                key={unit.id}
                unit={unit}
                locked
                side="enemy"
              />
            ))}
          </div>
          <p className="bs-team-hint">Plan your strategy around their roster</p>
        </div>
      </div>

      <div className="bs-footer">
        <div className="bs-chosen-row">
          {Array.from({ length: 4 }).map((_, i) => {
            const unit = chosen[i] ? myPicks.find((u) => u.id === chosen[i]) : null;
            return (
              <div key={i} className={`bs-slot${unit ? " filled" : ""}`}>
                {unit ? (
                  <>
                    <img
                      src={`/assets/units/${unit.id}-sprite.png`}
                      alt={unit.name}
                      style={{ width: 36, height: 36, objectFit: "contain", imageRendering: "pixelated" }}
                    />
                    <div className="bs-slot-name">{unit.name}</div>
                  </>
                ) : (
                  <span className="bs-slot-num">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {isWaitingForOpponent ? (
          <div className="bs-waiting">Waiting for opponent to choose…</div>
        ) : (
          <button
            className="bs-btn-confirm"
            disabled={chosen.length !== 4}
            onClick={handleConfirm}
          >
            Send to Battle
          </button>
        )}
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');

  .bs-root {
    min-height: 100vh;
    background: #08060f;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1.25rem 9rem;
    position: relative;
    overflow-x: hidden;
  }
  .bs-bg {
    position: fixed; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 55% 40% at 20% 50%, rgba(200,50,50,0.07) 0%, transparent 70%),
      radial-gradient(ellipse 55% 40% at 80% 50%, rgba(60,100,220,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 80% 35% at 50% 0%, rgba(80,40,150,0.13) 0%, transparent 60%);
  }

  .bs-header {
    text-align: center;
    margin-bottom: 1rem;
    position: relative; z-index: 1;
  }
  .bs-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.5rem; font-weight: 700;
    color: #f0c040;
    text-shadow: 0 0 20px rgba(240,192,64,0.35);
    margin: 0;
  }
  .bs-subtitle {
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(200,170,100,0.45);
    margin: 0.3rem 0 0;
  }

  /* ── Arena layout ── */
  .bs-arena {
    display: flex;
    gap: 0;
    align-items: flex-start;
    width: 100%;
    max-width: 1260px;
    position: relative; z-index: 1;
  }
  @media (max-width: 750px) {
    .bs-arena { flex-direction: column; align-items: stretch; }
  }

  /* ── Team panels ── */
  .bs-team-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .bs-team-label {
    font-family: 'Cinzel', serif;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
  }
  .bs-team-label.mine {
    color: #f0c040;
    background: rgba(240,192,64,0.07);
    border: 1px solid rgba(240,192,64,0.18);
  }
  .bs-team-label.enemy {
    color: rgba(150,180,255,0.8);
    background: rgba(80,120,220,0.07);
    border: 1px solid rgba(80,120,220,0.18);
  }
  .bs-team-label-icon { font-size: 0.9rem; }
  .bs-team-counter {
    margin-left: auto;
    font-size: 0.62rem;
    font-weight: 400;
    color: rgba(240,192,64,0.55);
  }
  .bs-locked-badge {
    margin-left: auto;
    font-size: 0.6rem;
    background: #c04040;
    color: #fff;
    border-radius: 4px;
    padding: 1px 7px;
  }
  .bs-team-hint {
    font-family: 'Cinzel', serif;
    font-size: 0.58rem;
    color: rgba(200,170,100,0.28);
    letter-spacing: 0.08em;
    text-align: center;
    margin: 0;
    font-style: italic;
  }

  /* ── VS divider ── */
  .bs-vs-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
    gap: 0.4rem;
    min-height: 200px;
    flex-shrink: 0;
  }
  .bs-vs-line {
    flex: 1;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(200,150,80,0.25), transparent);
    min-height: 60px;
  }
  .bs-vs-badge {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1rem;
    font-weight: 700;
    color: rgba(240,192,64,0.5);
    letter-spacing: 0.08em;
    border: 1px solid rgba(240,192,64,0.18);
    border-radius: 50%;
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(12,8,26,0.9);
    flex-shrink: 0;
  }
  @media (max-width: 750px) {
    .bs-vs-divider { flex-direction: row; min-height: auto; padding: 0.5rem 0; }
    .bs-vs-line { height: 1px; width: auto; flex: 1; min-height: auto; }
  }

  /* ── Unit cards grid ── */
  .bs-team-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.55rem;
  }
  @media (max-width: 480px) {
    .bs-team-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Unit card ── */
  .bs-card {
    border-radius: 9px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
    user-select: none;
    border: 1px solid rgba(240,192,64,0.12);
    background: rgba(12,8,26,0.85);
  }
  .bs-card.mine:hover:not(.locked) {
    border-color: rgba(240,192,64,0.55);
    transform: translateY(-2px);
    box-shadow: 0 4px 18px rgba(240,192,64,0.14);
  }
  .bs-card.mine.selected {
    border-color: rgba(240,192,64,0.9);
    box-shadow: 0 0 18px rgba(240,192,64,0.22), inset 0 0 10px rgba(240,192,64,0.06);
  }
  .bs-card.enemy {
    border-color: rgba(80,120,220,0.2);
    cursor: default;
    opacity: 0.85;
  }
  .bs-card.enemy:hover { border-color: rgba(80,120,220,0.45); }
  .bs-card.locked:not(.enemy) { opacity: 0.38; cursor: default; pointer-events: none; }
  .bs-card.locked.selected { opacity: 1; pointer-events: none; }

  .bs-card-portrait-wrap {
    position: relative;
    height: 100px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .bs-card-portrait {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }
  .bs-card-portrait-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 55px;
    background: linear-gradient(to top, rgba(12,8,26,1) 0%, rgba(12,8,26,0.4) 65%, transparent 100%);
    pointer-events: none;
  }
  .bs-card-sprite {
    position: absolute;
    bottom: -2px; left: 50%;
    transform: translateX(-50%);
    height: 52px; width: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8));
    z-index: 2;
  }
  .bs-order-badge {
    position: absolute;
    top: 5px; left: 5px;
    width: 20px; height: 20px;
    background: #f0c040;
    border-radius: 50%;
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    font-weight: 900;
    color: #0a0810;
    display: flex; align-items: center; justify-content: center;
    z-index: 3;
    box-shadow: 0 1px 6px rgba(240,192,64,0.5);
  }
  .bs-card-name {
    font-family: 'Cinzel', serif;
    font-size: 0.67rem;
    font-weight: 700;
    color: #f0e0a0;
    padding: 0.28rem 0.5rem 0.06rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bs-card-cls {
    font-size: 0.55rem;
    padding: 0 0.5rem 0.32rem;
    text-transform: capitalize;
    letter-spacing: 0.05em;
    opacity: 0.7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Footer ── */
  .bs-footer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(8,6,15,0.99) 65%, transparent);
    padding: 0.7rem 1.5rem 1.1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    z-index: 10;
  }
  .bs-chosen-row {
    display: flex;
    gap: 0.45rem;
    justify-content: center;
  }
  .bs-slot {
    width: 58px;
    background: rgba(15,10,30,0.85);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 8px;
    padding: 0.3rem 0.2rem 0.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 56px;
    justify-content: center;
  }
  .bs-slot.filled {
    border-color: rgba(240,192,64,0.7);
    background: rgba(240,192,64,0.07);
  }
  .bs-slot-num {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    color: rgba(200,170,100,0.25);
  }
  .bs-slot-name {
    font-family: 'Cinzel', serif;
    font-size: 0.47rem;
    color: rgba(200,170,100,0.6);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 54px;
  }
  .bs-btn-confirm {
    font-family: 'Cinzel', serif;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    background: linear-gradient(135deg, #8b0000, #c0392b, #8b0000);
    color: #fff;
    border: 1px solid rgba(220,80,80,0.5);
    border-radius: 8px;
    padding: 0.75rem 2.5rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(180,40,40,0.35);
    min-width: 200px;
  }
  .bs-btn-confirm:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(180,40,40,0.5);
    background: linear-gradient(135deg, #a00000, #e05050, #a00000);
  }
  .bs-btn-confirm:disabled { opacity: 0.32; cursor: not-allowed; }
  .bs-waiting {
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    color: rgba(240,192,64,0.6);
    letter-spacing: 0.1em;
    animation: blink 1.4s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;
