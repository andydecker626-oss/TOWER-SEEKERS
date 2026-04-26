import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { getUnitDef } from "@/lib/units";
import type { GridUnit, PlayerAction, TurnEvent, SkillDef } from "@/lib/types";

type SelectMode = "none" | "move" | "attack" | "skill";

const AP_MAX = 10;

function crossGridDist(allyX: number, allyY: number, enemyX: number, enemyY: number): number {
  return (4 + enemyX - allyX) + Math.abs(allyY - enemyY);
}

function getAttackRange(style: string): number {
  if (style === "melee") return 4;
  if (style === "ranged-volley") return 6;
  return 8;
}

interface QueuedAction {
  unitInstanceId: string;
  type: "move" | "attack" | "skill" | "wait" | "defend";
  targetX?: number;
  targetY?: number;
  skillId?: string;
}

interface FloatText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  onEnemy: boolean;
}

let floatId = 0;

export default function Battle() {
  const { state, submitActions, clearPendingEvents } = useSocket();

  const [myUnits, setMyUnits] = useState<GridUnit[]>(state.myUnits);
  const [enemyUnits, setEnemyUnits] = useState<GridUnit[]>(state.enemyUnits);
  const [queued, setQueued] = useState<Record<string, QueuedAction>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState<SelectMode>("none");
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);
  const [skillMenuOpen, setSkillMenuOpen] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<{ x: number; y: number; onEnemy: boolean }[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [animating, setAnimating] = useState(false);
  const [flashUnits, setFlashUnits] = useState<Record<string, string>>({});
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const aliveMyUnits = myUnits.filter((u) => u.alive);
  const aliveEnemies = enemyUnits.filter((u) => u.alive);
  const allQueued = aliveMyUnits.every((u) => queued[u.instanceId]);
  const isWaiting = state.isWaitingForOpponent || animating;

  // Sync units from state when battle starts
  useEffect(() => {
    setMyUnits(state.myUnits);
    setEnemyUnits(state.enemyUnits);
  }, []);

  // Play pending events from server
  useEffect(() => {
    if (!state.pendingEvents || animating) return;
    const events = state.pendingEvents;
    clearPendingEvents();
    playEvents(events, state.myUnits, state.enemyUnits);
  }, [state.pendingEvents]);

  function playEvents(events: TurnEvent[], finalMy: GridUnit[], finalEnemy: GridUnit[]) {
    if (events.length === 0) {
      setMyUnits(finalMy);
      setEnemyUnits(finalEnemy);
      return;
    }
    setAnimating(true);
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
    const DELAY = 600;

    events.forEach((ev, i) => {
      const t = setTimeout(() => {
        applyEventAnimation(ev);
        if (i === events.length - 1) {
          setTimeout(() => {
            setMyUnits(finalMy);
            setEnemyUnits(finalEnemy);
            setFlashUnits({});
            setAnimating(false);
          }, DELAY);
        }
      }, i * DELAY);
      animTimers.current.push(t);
    });
  }

  function applyEventAnimation(ev: TurnEvent) {
    const allUnits = [...myUnits, ...enemyUnits];
    const actor = allUnits.find((u) => u.instanceId === ev.unitInstanceId);
    const target = ev.targetUnitId ? allUnits.find((u) => u.instanceId === ev.targetUnitId) : null;

    if (ev.type === "move" && actor && ev.toX !== undefined) {
      setMyUnits((prev) =>
        prev.map((u) => u.instanceId === ev.unitInstanceId ? { ...u, x: ev.toX!, y: ev.toY! } : u)
      );
      setEnemyUnits((prev) =>
        prev.map((u) => u.instanceId === ev.unitInstanceId ? { ...u, x: ev.toX!, y: ev.toY! } : u)
      );
    }

    if (ev.type === "attack" || ev.type === "skill") {
      if (target && ev.damage !== undefined) {
        const isEnemyTarget = state.mySide !== target.side;
        spawnFloat(`-${ev.damage}`, target.x, target.y, "#ff6060", isEnemyTarget);
        setFlashUnits((prev) => ({ ...prev, [target.instanceId]: "damage" }));
        if (ev.newHp !== undefined) {
          const updateFn = (prev: GridUnit[]) =>
            prev.map((u) => u.instanceId === target.instanceId ? { ...u, hp: ev.newHp! } : u);
          if (isEnemyTarget) setEnemyUnits(updateFn);
          else setMyUnits(updateFn);
        }
      }
    }

    if (ev.type === "heal" && target && ev.heal !== undefined) {
      const isMineTarget = state.mySide === target.side;
      spawnFloat(`+${ev.heal}`, target.x, target.y, "#60ff90", !isMineTarget);
      if (ev.newHp !== undefined) {
        const updateFn = (prev: GridUnit[]) =>
          prev.map((u) => u.instanceId === target.instanceId ? { ...u, hp: ev.newHp! } : u);
        if (isMineTarget) setMyUnits(updateFn);
        else setEnemyUnits(updateFn);
      }
    }

    if (ev.type === "miss" && target) {
      const isEnemyTarget = state.mySide !== target.side;
      spawnFloat("MISS", target.x, target.y, "#aaaaff", isEnemyTarget);
    }

    if (ev.type === "ko" && target) {
      setFlashUnits((prev) => ({ ...prev, [target.instanceId]: "ko" }));
    }

    if (actor && (ev.type === "attack" || ev.type === "skill")) {
      setFlashUnits((prev) => ({ ...prev, [actor.instanceId]: "attack" }));
    }
  }

  function spawnFloat(text: string, x: number, y: number, color: string, onEnemy: boolean) {
    const id = floatId++;
    setFloats((prev) => [...prev, { id, text, x, y, color, onEnemy }]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 1200);
  }

  function getValidMoves(unit: GridUnit): { x: number; y: number }[] {
    const def = getUnitDef(unit.defId);
    if (!def) return [];
    const occupied = new Set([...myUnits, ...enemyUnits].filter((u) => u.alive && u.instanceId !== unit.instanceId).map((u) => `${u.x},${u.y}`));
    const result: { x: number; y: number }[] = [];
    for (let cx = 0; cx < 4; cx++) {
      for (let cy = 0; cy < 4; cy++) {
        if (Math.abs(cx - unit.x) + Math.abs(cy - unit.y) <= def.moveDist && !occupied.has(`${cx},${cy}`)) {
          result.push({ x: cx, y: cy });
        }
      }
    }
    return result;
  }

  function handleSelectUnit(unitId: string) {
    if (isWaiting) return;
    if (selectedId === unitId) {
      setSelectedId(null);
      setSelectMode("none");
      setSelectedSkill(null);
      setHighlights([]);
      setSkillMenuOpen(null);
    } else {
      setSelectedId(unitId);
      setSelectMode("none");
      setSelectedSkill(null);
      setHighlights([]);
      setSkillMenuOpen(null);
    }
  }

  function handleMove() {
    if (!selectedId) return;
    const unit = myUnits.find((u) => u.instanceId === selectedId);
    if (!unit) return;
    const moves = getValidMoves(unit);
    setSelectMode("move");
    setHighlights(moves.map((m) => ({ ...m, onEnemy: false })));
    setSkillMenuOpen(null);
  }

  function handleAttack() {
    if (!selectedId) return;
    const unit = myUnits.find((u) => u.instanceId === selectedId);
    if (!unit) return;
    const def = getUnitDef(unit.defId);
    if (!def) return;
    const range = getAttackRange(def.baseAttackStyle);
    const validTargets = aliveEnemies.filter((e) => {
      const dist = state.mySide === "A"
        ? crossGridDist(unit.x, unit.y, e.x, e.y)
        : crossGridDist(e.x, e.y, unit.x, unit.y);
      return dist <= range;
    });
    setSelectMode("attack");
    setHighlights(validTargets.map((e) => ({ x: e.x, y: e.y, onEnemy: true })));
    setSkillMenuOpen(null);
  }

  function handleSkillSelect(skill: SkillDef) {
    if (!selectedId) return;
    const unit = myUnits.find((u) => u.instanceId === selectedId);
    if (!unit) return;
    if (unit.ap < skill.ap) return;
    setSelectedSkill(skill);
    setSkillMenuOpen(null);

    if (skill.style === "self") {
      queueAction({ unitInstanceId: selectedId, type: "skill", skillId: skill.id });
      resetSelection();
      return;
    }
    if (skill.style === "ally" || skill.type === "healing") {
      setSelectMode("skill");
      setHighlights(myUnits.filter((u) => u.alive).map((u) => ({ x: u.x, y: u.y, onEnemy: false })));
      return;
    }
    setSelectMode("skill");
    setHighlights(aliveEnemies.map((e) => ({ x: e.x, y: e.y, onEnemy: true })));
  }

  function handleWait() {
    if (!selectedId) return;
    queueAction({ unitInstanceId: selectedId, type: "wait" });
    resetSelection();
  }

  function handleDefend() {
    if (!selectedId) return;
    queueAction({ unitInstanceId: selectedId, type: "defend" });
    resetSelection();
  }

  function handleTileClick(x: number, y: number, onEnemy: boolean) {
    if (!selectedId || selectMode === "none") return;
    if (selectMode === "move" && !onEnemy) {
      queueAction({ unitInstanceId: selectedId, type: "move", targetX: x, targetY: y });
      resetSelection();
    } else if (selectMode === "attack" && onEnemy) {
      queueAction({ unitInstanceId: selectedId, type: "attack", targetX: x, targetY: y });
      resetSelection();
    } else if (selectMode === "skill") {
      queueAction({ unitInstanceId: selectedId, type: "skill", skillId: selectedSkill?.id, targetX: x, targetY: y });
      resetSelection();
    }
  }

  function queueAction(action: QueuedAction) {
    setQueued((prev) => ({ ...prev, [action.unitInstanceId]: action }));
  }

  function resetSelection() {
    setSelectedId(null);
    setSelectMode("none");
    setSelectedSkill(null);
    setHighlights([]);
    setSkillMenuOpen(null);
  }

  function handleSubmit() {
    const actions: PlayerAction[] = aliveMyUnits.map((u) => {
      const q = queued[u.instanceId];
      return q
        ? { unitInstanceId: u.instanceId, type: q.type, targetX: q.targetX, targetY: q.targetY, skillId: q.skillId }
        : { unitInstanceId: u.instanceId, type: "wait" };
    });
    submitActions(actions);
    setQueued({});
    resetSelection();
  }

  const isHighlighted = useCallback(
    (x: number, y: number, onEnemy: boolean) =>
      highlights.some((h) => h.x === x && h.y === y && h.onEnemy === onEnemy),
    [highlights]
  );

  const STEP = 78;
  const TILE = 70;
  const ENEMY_OFFSET = 4 * STEP + 36;
  const BOARD_H = 4 * STEP;

  const turnOrder = [...aliveMyUnits, ...aliveEnemies].sort((a, b) => {
    const spA = getUnitDef(a.defId)?.speed ?? 0;
    const spB = getUnitDef(b.defId)?.speed ?? 0;
    return spB - spA;
  });

  return (
    <div className="battle-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');
        ${spriteCSS()}
        ${battleCSS()}
      `}</style>

      {/* HUD top */}
      <div className="b-hud-top">
        <div className="b-side-label b-side-you">YOU</div>
        <div className="b-turn-badge">Turn {state.turnNumber}</div>
        <div className="b-side-label b-side-opp">OPP</div>
      </div>

      {/* Turn-order strip */}
      <div className="b-order-strip">
        <div className="b-order-label">Speed Order</div>
        <div className="b-order-units">
          {turnOrder.map((u, i) => {
            const def = getUnitDef(u.defId);
            const isAlly = u.side === state.mySide;
            return (
              <div key={u.instanceId} className={`b-order-chip${isAlly ? " b-order-ally" : " b-order-enemy"}`} title={def?.name}>
                <span className="b-order-num">{i + 1}</span>
                <span className="b-order-name">{def?.name.slice(0, 4)}</span>
                <span className="b-order-spd">{def?.speed}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Battlefield stage */}
      <div className="b-stage">
        <div className="b-arena-bg">
          <div className="b-bokeh b-bokeh1" /><div className="b-bokeh b-bokeh2" /><div className="b-bokeh b-bokeh3" />
        </div>
        <div className="b-field-wrap">
          <div className="b-battlefield" style={{ width: ENEMY_OFFSET + 4 * STEP, height: BOARD_H }}>
            {/* Ally board tiles */}
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => {
                const hl = isHighlighted(col, row, false);
                return (
                  <div
                    key={`at-${col}-${row}`}
                    role={hl ? "button" : undefined}
                    aria-label={`Ally grid column ${col + 1} row ${row + 1}`}
                    tabIndex={hl ? 0 : -1}
                    className={`b-tile${hl ? " b-tile-hl" : ""}`}
                    style={{ left: col * STEP, top: row * STEP, width: TILE, height: TILE }}
                    onClick={() => hl && handleTileClick(col, row, false)}
                    onKeyDown={(e) => e.key === "Enter" && hl && handleTileClick(col, row, false)}
                  />
                );
              })
            )}
            {/* Enemy board tiles */}
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => {
                const hl = isHighlighted(col, row, true);
                return (
                  <div
                    key={`et-${col}-${row}`}
                    role={hl ? "button" : undefined}
                    aria-label={`Enemy grid column ${col + 1} row ${row + 1}`}
                    tabIndex={hl ? 0 : -1}
                    className={`b-tile b-tile-enemy${hl ? " b-tile-hl" : ""}`}
                    style={{ left: ENEMY_OFFSET + col * STEP, top: row * STEP, width: TILE, height: TILE, zIndex: hl ? 25 : undefined }}
                    onClick={() => hl && handleTileClick(col, row, true)}
                    onKeyDown={(e) => e.key === "Enter" && hl && handleTileClick(col, row, true)}
                  />
                );
              })
            )}
            {/* Divider */}
            <div className="b-divider" style={{ left: 4 * STEP + 2, height: BOARD_H }} />

            {/* Ally units */}
            {myUnits.map((unit) => (
              <UnitToken
                key={unit.instanceId}
                unit={unit}
                isAlly
                isSelected={selectedId === unit.instanceId}
                flashType={flashUnits[unit.instanceId]}
                left={unit.x * STEP + TILE / 2}
                top={unit.y * STEP + TILE / 2}
                onClick={() => handleSelectUnit(unit.instanceId)}
                queuedAction={queued[unit.instanceId]}
                floats={floats.filter((f) => !f.onEnemy && f.x === unit.x && f.y === unit.y)}
              />
            ))}

            {/* Enemy units */}
            {enemyUnits.map((unit) => (
              <UnitToken
                key={unit.instanceId}
                unit={unit}
                isAlly={false}
                isSelected={false}
                flashType={flashUnits[unit.instanceId]}
                left={ENEMY_OFFSET + unit.x * STEP + TILE / 2}
                top={unit.y * STEP + TILE / 2}
                onClick={() => {}}
                queuedAction={undefined}
                floats={floats.filter((f) => f.onEnemy && f.x === unit.x && f.y === unit.y)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="b-panel">
        {isWaiting ? (
          <div className="b-waiting-overlay">
            <div className="b-waiting-text">
              {animating ? "Resolving turn…" : "Waiting for opponent…"}
            </div>
          </div>
        ) : (
          <>
            <div className="b-units-row">
              {aliveMyUnits.map((unit) => {
                const def = getUnitDef(unit.defId);
                if (!def) return null;
                const isSelected = selectedId === unit.instanceId;
                const qAction = queued[unit.instanceId];

                return (
                  <div
                    key={unit.instanceId}
                    role="button"
                    aria-label={`Unit card ${def.name}`}
                    className={`b-unit-card${isSelected ? " b-unit-card-sel" : ""}${qAction ? " b-unit-card-queued" : ""}`}
                    onClick={() => handleSelectUnit(unit.instanceId)}
                  >
                    <div className="b-uc-sprite">
                      <div className={`sprite sprite--${def.cls} sprite-ally sprite-idle`} />
                      {qAction && <div className="b-action-badge" aria-hidden="true">{actionLabel(qAction)}</div>}
                    </div>
                    <div className="b-uc-name">{def.name}</div>
                    <div className="b-uc-bars">
                      <div className="b-hp-bar-wrap">
                        <div className="b-hp-fill" style={{ width: `${Math.round((unit.hp / unit.maxHp) * 100)}%` }} />
                      </div>
                      <div className="b-hp-text">{unit.hp}/{unit.maxHp}</div>
                    </div>
                    <div className="b-ap-row" aria-label={`${unit.ap} AP`}>
                      {Array.from({ length: AP_MAX }).map((_, i) => (
                        <div key={i} className={`b-ap-pip${i < unit.ap ? " filled" : " empty"}`} />
                      ))}
                    </div>

                    {isSelected && (
                      <div className="b-action-menu" onClick={(e) => e.stopPropagation()}>
                        <button className={`b-act-btn${selectMode === "move" ? " active" : ""}`} aria-label={`Move ${def.name}`} onClick={handleMove}>Move</button>
                        <button className={`b-act-btn${selectMode === "attack" ? " active" : ""}`} aria-label={`Attack ${def.name}`} onClick={handleAttack}>Attack</button>
                        <div className="b-skill-wrap">
                          <button
                            className={`b-act-btn${selectMode === "skill" ? " active" : ""}`}
                            aria-label={`Skill ${def.name}`}
                            onClick={() => setSkillMenuOpen(skillMenuOpen === unit.instanceId ? null : unit.instanceId)}
                          >
                            Skill ▾
                          </button>
                          {skillMenuOpen === unit.instanceId && (
                            <div className="b-skill-dropdown">
                              {def.skills.map((sk) => (
                                <button
                                  key={sk.id}
                                  className="b-skill-item"
                                  disabled={unit.ap < sk.ap}
                                  onClick={() => handleSkillSelect(sk)}
                                >
                                  <span className="b-sk-name">{sk.name}</span>
                                  <span className="b-sk-ap">{sk.ap} AP</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button className="b-act-btn" aria-label={`Wait ${def.name}`} onClick={handleWait}>Wait</button>
                        <button className="b-act-btn" aria-label={`Defend ${def.name}`} onClick={handleDefend}>Defend</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="b-submit-row">
              <div className="b-queue-status">
                {aliveMyUnits.filter((u) => queued[u.instanceId]).length} / {aliveMyUnits.length} actions set
              </div>
              <button
                className="b-submit-btn"
                aria-label="End Turn"
                disabled={!allQueued}
                onClick={handleSubmit}
              >
                End Turn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UnitToken({
  unit, isAlly, isSelected, flashType, left, top, onClick, queuedAction, floats,
}: {
  unit: GridUnit;
  isAlly: boolean;
  isSelected: boolean;
  flashType?: string;
  left: number;
  top: number;
  onClick: () => void;
  queuedAction?: QueuedAction;
  floats: FloatText[];
}) {
  const def = getUnitDef(unit.defId);
  if (!def) return null;

  const hpPct = Math.round((unit.hp / unit.maxHp) * 100);
  const isKo = !unit.alive;

  return (
    <div
      className={`b-unit-token${isSelected ? " b-token-sel" : ""}${isKo ? " b-token-ko" : ""}${flashType === "damage" ? " b-token-damage" : ""}${flashType === "attack" ? " b-token-attack" : ""}`}
      style={{
        position: "absolute",
        left: left,
        top: top,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 20 : unit.y + 5,
        cursor: isAlly && !isKo ? "pointer" : "default",
        transition: "left 0.45s ease, top 0.45s ease",
      }}
      onClick={onClick}
    >
      <div className={`sprite sprite--${def.cls} ${isAlly ? "sprite-ally" : "sprite-enemy"} sprite-idle`} />

      {/* Nameplate */}
      <div className="b-nameplate">
        <div className="b-nameplate-name">{def.name}</div>
        <div className="b-nameplate-hpbar">
          <div
            className="b-nameplate-hpfill"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 50 ? "#40c060" : hpPct > 25 ? "#e0a030" : "#e03030",
            }}
          />
        </div>
        <div className="b-nameplate-stats">{unit.hp}/{unit.maxHp}</div>
        <div className="b-nameplate-ap">
          {Array.from({ length: AP_MAX }).map((_, i) => (
            <div key={i} className={`b-np-pip${i < unit.ap ? " filled" : " empty"}`} />
          ))}
        </div>
      </div>

      {/* Floating texts */}
      {floats.map((f) => (
        <div key={f.id} className="b-float-text" style={{ color: f.color }}>
          {f.text}
        </div>
      ))}

      {/* Queued badge */}
      {queuedAction && (
        <div className="b-queued-badge">{actionLabel(queuedAction)}</div>
      )}
    </div>
  );
}

function actionLabel(action: QueuedAction) {
  if (action.type === "skill") return "SK";
  if (action.type === "attack") return "ATK";
  if (action.type === "move") return "MV";
  if (action.type === "wait") return "WT";
  if (action.type === "defend") return "DEF";
  return "?";
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
    .sprite-enemy { filter: hue-rotate(180deg) saturate(1.3) brightness(1.1); }
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

function battleCSS() {
  return `
    .battle-root {
      min-height: 100vh;
      background: #060410;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    /* HUD top */
    .b-hud-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1.5rem;
      background: rgba(6,4,16,0.95);
      border-bottom: 1px solid rgba(240,192,64,0.15);
      position: relative; z-index: 10;
      flex-shrink: 0;
    }
    .b-side-label {
      font-family: 'Cinzel', serif;
      font-size: 0.75rem; font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
    }
    .b-side-you { color: #60aaff; }
    .b-side-opp { color: #ff6060; }
    .b-turn-badge {
      font-family: 'Cinzel', serif;
      font-size: 0.85rem; font-weight: 600;
      color: #f0c040; letter-spacing: 0.15em;
      background: rgba(240,192,64,0.08);
      border: 1px solid rgba(240,192,64,0.25);
      border-radius: 6px; padding: 0.3rem 0.8rem;
    }

    /* Stage */
    .b-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 1rem 0.5rem 0.5rem;
      min-height: 280px;
    }
    .b-arena-bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 90% 60% at 50% 40%, rgba(30,15,70,0.8) 0%, #060410 70%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, transparent 1px, transparent 24px),
        repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, transparent 1px, transparent 24px);
    }
    .b-bokeh {
      position: absolute; border-radius: 50%;
      filter: blur(60px); pointer-events: none;
    }
    .b-bokeh1 { width:300px; height:200px; background:rgba(80,30,180,0.18); top:-60px; left:10%; }
    .b-bokeh2 { width:250px; height:150px; background:rgba(20,60,160,0.15); bottom:0; right:5%; }
    .b-bokeh3 { width:200px; height:200px; background:rgba(180,60,20,0.12); top:20%; right:30%; }

    .b-field-wrap {
      position: relative; z-index: 1;
      perspective: 700px;
    }

    .b-battlefield {
      position: relative;
      transform: rotateX(22deg);
      transform-style: preserve-3d;
    }

    /* Tiles */
    .b-tile {
      position: absolute;
      border: 1px solid rgba(80,120,200,0.25);
      border-radius: 3px;
      background: rgba(20,15,45,0.6);
      transition: background 0.15s, border-color 0.15s;
    }
    .b-tile-enemy {
      border-color: rgba(200,60,60,0.2);
      background: rgba(40,10,20,0.6);
    }
    .b-tile-hl {
      background: rgba(240,192,64,0.22) !important;
      border-color: rgba(240,192,64,0.7) !important;
      cursor: pointer;
      box-shadow: inset 0 0 8px rgba(240,192,64,0.15);
      animation: tileGlow 0.8s ease-in-out infinite alternate;
    }
    @keyframes tileGlow {
      from { box-shadow: inset 0 0 8px rgba(240,192,64,0.15); }
      to   { box-shadow: inset 0 0 16px rgba(240,192,64,0.3); }
    }

    .b-divider {
      position: absolute;
      width: 2px;
      background: linear-gradient(to bottom, transparent, rgba(240,192,64,0.3), transparent);
      top: 0;
    }

    /* Unit tokens */
    .b-unit-token {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .b-token-sel .sprite { filter: brightness(1.4) drop-shadow(0 0 8px #f0c040) !important; }
    .b-token-ko { opacity: 0.2; transition: opacity 0.5s; }
    .b-token-damage .sprite { animation: damageFlash 0.5s; }
    .b-token-attack .sprite { animation: attackBob 0.3s; }
    @keyframes damageFlash {
      0%,100% { filter: none; }
      30%,70% { filter: brightness(2) saturate(0) sepia(1) hue-rotate(-60deg); }
    }
    @keyframes attackBob {
      0%,100% { transform: translateX(0); }
      40% { transform: translateX(6px); }
    }

    .b-nameplate {
      background: rgba(6,4,16,0.88);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      padding: 2px 5px;
      min-width: 60px;
      text-align: center;
    }
    .b-nameplate-name {
      font-family: 'Cinzel', serif;
      font-size: 0.55rem; font-weight: 600;
      color: #e8d880; white-space: nowrap;
    }
    .b-nameplate-hpbar {
      width: 100%; height: 3px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px; margin: 1px 0;
      overflow: hidden;
    }
    .b-nameplate-hpfill {
      height: 100%; border-radius: 2px;
      transition: width 0.4s ease, background 0.3s;
    }
    .b-nameplate-stats {
      font-size: 0.48rem; color: rgba(200,180,100,0.55);
    }
    .b-nameplate-ap {
      display: flex; gap: 1px; justify-content: center; margin-top: 2px;
    }
    .b-np-pip {
      width: 4px; height: 4px; border-radius: 50%;
    }
    .b-np-pip.filled { background: #60aaff; box-shadow: 0 0 3px rgba(96,170,255,0.7); }
    .b-np-pip.empty  { background: rgba(96,170,255,0.18); }

    .b-float-text {
      position: absolute;
      top: -30px; left: 50%;
      transform: translateX(-50%);
      font-family: 'Cinzel', serif;
      font-size: 0.9rem; font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      animation: floatUp 1.2s ease-out forwards;
      pointer-events: none; white-space: nowrap;
      z-index: 30;
    }
    @keyframes floatUp {
      0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.2); }
      60%  { opacity: 1; }
      100% { opacity: 0; transform: translateX(-50%) translateY(-32px) scale(0.9); }
    }

    .b-queued-badge {
      position: absolute;
      top: -4px; right: -4px;
      background: #f0c040;
      color: #0a0810;
      font-family: 'Cinzel', serif;
      font-size: 0.5rem; font-weight: 700;
      border-radius: 4px; padding: 1px 4px;
    }

    /* Action panel */
    .b-panel {
      background: rgba(6,4,16,0.97);
      border-top: 1px solid rgba(240,192,64,0.15);
      padding: 0.75rem;
      flex-shrink: 0;
      min-height: 180px;
      position: relative; z-index: 10;
    }

    .b-waiting-overlay {
      display: flex; align-items: center; justify-content: center;
      height: 100%; min-height: 120px;
    }
    .b-waiting-text {
      font-family: 'Cinzel', serif;
      font-size: 0.95rem;
      color: rgba(240,192,64,0.6);
      letter-spacing: 0.15em;
      animation: blink 1.4s ease-in-out infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .b-units-row {
      display: flex; gap: 0.5rem; overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .b-units-row::-webkit-scrollbar { height: 3px; }
    .b-units-row::-webkit-scrollbar-thumb { background: rgba(240,192,64,0.3); border-radius: 2px; }

    .b-unit-card {
      background: rgba(15,10,30,0.9);
      border: 1px solid rgba(240,192,64,0.15);
      border-radius: 8px;
      padding: 0.5rem 0.6rem;
      cursor: pointer; min-width: 100px;
      transition: all 0.15s;
      position: relative;
      flex-shrink: 0;
    }
    .b-unit-card:hover { border-color: rgba(240,192,64,0.4); }
    .b-unit-card-sel { border-color: #f0c040 !important; background: rgba(240,192,64,0.08) !important; }
    .b-unit-card-queued { border-color: rgba(80,200,120,0.45) !important; }

    .b-uc-sprite { display: flex; justify-content: center; margin-bottom: 0.2rem; position: relative; }
    .b-uc-name { font-family: 'Cinzel', serif; font-size: 0.68rem; font-weight: 600; color: #f0e0a0; text-align: center; }
    .b-uc-bars { margin-top: 0.25rem; }
    .b-hp-bar-wrap { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .b-hp-fill { height: 100%; background: #40c060; border-radius: 2px; transition: width 0.4s; }
    .b-hp-text { font-size: 0.58rem; color: rgba(200,180,100,0.5); text-align: center; margin-top: 1px; }
    .b-ap-row { display: flex; align-items: center; gap: 2px; margin-top: 0.25rem; flex-wrap: wrap; }
    .b-ap-pip { width: 5px; height: 5px; border-radius: 1px; }
    .b-ap-pip.filled { background: #4080ff; }
    .b-ap-pip.empty { background: rgba(40,60,120,0.35); border: 1px solid rgba(64,128,255,0.18); }

    /* Turn-order strip */
    .b-order-strip {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.3rem 1rem;
      background: rgba(4,3,12,0.9);
      border-bottom: 1px solid rgba(240,192,64,0.1);
      overflow-x: auto; flex-shrink: 0;
    }
    .b-order-strip::-webkit-scrollbar { height: 2px; }
    .b-order-strip::-webkit-scrollbar-thumb { background: rgba(240,192,64,0.2); }
    .b-order-label {
      font-family: 'Cinzel', serif; font-size: 0.58rem;
      color: rgba(200,170,100,0.4); letter-spacing: 0.15em;
      text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
    }
    .b-order-units { display: flex; gap: 4px; align-items: center; }
    .b-order-chip {
      display: flex; flex-direction: column; align-items: center;
      padding: 3px 6px; border-radius: 5px;
      font-family: 'Cinzel', serif;
      border: 1px solid; flex-shrink: 0;
      min-width: 36px;
    }
    .b-order-ally { border-color: rgba(80,160,255,0.4); background: rgba(40,80,200,0.12); }
    .b-order-enemy { border-color: rgba(200,60,60,0.35); background: rgba(160,30,30,0.1); }
    .b-order-num { font-size: 0.45rem; color: rgba(200,170,100,0.45); line-height: 1; }
    .b-order-name { font-size: 0.58rem; font-weight: 600; color: #e8d880; line-height: 1.2; }
    .b-order-spd { font-size: 0.45rem; color: rgba(200,170,100,0.5); }

    .b-action-badge {
      position: absolute; top: -4px; right: -4px;
      background: rgba(80,200,120,0.9);
      color: #050310; font-size: 0.55rem;
      font-family: 'Cinzel', serif; font-weight: 700;
      border-radius: 3px; padding: 1px 4px;
    }

    .b-action-menu {
      margin-top: 0.4rem;
      display: flex; flex-wrap: wrap; gap: 3px;
      border-top: 1px solid rgba(240,192,64,0.15);
      padding-top: 0.4rem;
    }
    .b-act-btn {
      font-family: 'Cinzel', serif; font-size: 0.62rem;
      font-weight: 600; letter-spacing: 0.04em;
      background: rgba(20,14,40,0.9);
      color: rgba(200,170,100,0.9);
      border: 1px solid rgba(240,192,64,0.2);
      border-radius: 5px; padding: 3px 7px;
      cursor: pointer; transition: all 0.13s;
      white-space: nowrap;
    }
    .b-act-btn:hover { background: rgba(240,192,64,0.12); border-color: rgba(240,192,64,0.5); }
    .b-act-btn.active { background: rgba(240,192,64,0.2); border-color: #f0c040; color: #f0c040; }

    .b-skill-wrap { position: relative; }
    .b-skill-dropdown {
      position: absolute; bottom: 100%; left: 0;
      background: rgba(10,7,24,0.98);
      border: 1px solid rgba(240,192,64,0.3);
      border-radius: 7px; padding: 0.3rem;
      min-width: 180px; z-index: 50;
      box-shadow: 0 -8px 24px rgba(0,0,0,0.7);
    }
    .b-skill-item {
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; background: none; border: none;
      padding: 0.35rem 0.5rem; border-radius: 4px;
      cursor: pointer; transition: background 0.12s;
      gap: 0.5rem;
    }
    .b-skill-item:hover:not(:disabled) { background: rgba(240,192,64,0.1); }
    .b-skill-item:disabled { opacity: 0.35; cursor: not-allowed; }
    .b-sk-name { font-family: 'Cinzel', serif; font-size: 0.68rem; color: #f0e0a0; }
    .b-sk-ap { font-family: 'Cinzel', serif; font-size: 0.6rem; color: #4080ff; }

    .b-submit-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 0.5rem;
    }
    .b-queue-status {
      font-family: 'Cinzel', serif; font-size: 0.72rem;
      color: rgba(200,170,100,0.55);
    }
    .b-submit-btn {
      font-family: 'Cinzel', serif; font-size: 0.9rem;
      font-weight: 700; letter-spacing: 0.08em;
      background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
      color: #0a0810; border: none; border-radius: 7px;
      padding: 0.6rem 1.8rem; cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 3px 14px rgba(240,192,64,0.25);
    }
    .b-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(240,192,64,0.4); }
    .b-submit-btn:disabled { opacity: 0.38; cursor: not-allowed; }
  `;
}
