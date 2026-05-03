import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { useSettings } from "@/context/SettingsContext";
import { getUnitDef } from "@/lib/units";
import type { GridUnit, PlayerAction, TurnEvent, SkillDef } from "@/lib/types";
import { audioManager } from "@/lib/audio";
import BattleRenderer from "@/components/BattleRenderer";
import SettingsModal from "@/components/SettingsModal";

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

export default function Battle() {
  const { state, submitActions, clearPendingEvents, confirmGameOver } = useSocket();
  const { settings, setMuted } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const [myUnits, setMyUnits] = useState<GridUnit[]>(state.myUnits);
  const [enemyUnits, setEnemyUnits] = useState<GridUnit[]>(state.enemyUnits);
  const [queued, setQueued] = useState<Record<string, QueuedAction>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState<SelectMode>("none");
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);
  const [skillMenuOpen, setSkillMenuOpen] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<{ x: number; y: number; onEnemy: boolean }[]>([]);
  const [animating, setAnimating] = useState(false);
  const [flashUnits, setFlashUnits] = useState<Record<string, string>>({});
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Start battle music
  useEffect(() => {
    audioManager.play("battle");
    return () => audioManager.stop();
  }, []);

  // Always-current unit state for animation closures (avoids stale state desync)
  const latestUnitsRef = useRef<{ my: GridUnit[]; enemy: GridUnit[] }>({ my: state.myUnits, enemy: state.enemyUnits });
  useEffect(() => { latestUnitsRef.current = { my: myUnits, enemy: enemyUnits }; }, [myUnits, enemyUnits]);

  // Track pendingGameOver in a ref so animation closures can read the current value
  const pendingGameOverRef = useRef(state.pendingGameOver);
  useEffect(() => { pendingGameOverRef.current = state.pendingGameOver; }, [state.pendingGameOver]);

  // Unmount: cancel all queued animation timers to prevent stale state updates
  useEffect(() => {
    return () => {
      animTimers.current.forEach(clearTimeout);
    };
  }, []);

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
      if (pendingGameOverRef.current) {
        const goTimer = setTimeout(() => confirmGameOver(), 400);
        animTimers.current.push(goTimer);
      }
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
          const finishTimer = setTimeout(() => {
            setMyUnits(finalMy);
            setEnemyUnits(finalEnemy);
            setFlashUnits({});
            setAnimating(false);
            if (pendingGameOverRef.current) {
              const goTimer = setTimeout(() => confirmGameOver(), 800);
              animTimers.current.push(goTimer);
            }
          }, DELAY);
          animTimers.current.push(finishTimer);
        }
      }, i * DELAY);
      animTimers.current.push(t);
    });
  }

  function applyEventAnimation(ev: TurnEvent) {
    const allUnits = [...latestUnitsRef.current.my, ...latestUnitsRef.current.enemy];
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
      if (ev.newHp !== undefined) {
        const isMineTarget = state.mySide === target.side;
        const updateFn = (prev: GridUnit[]) =>
          prev.map((u) => u.instanceId === target.instanceId ? { ...u, hp: ev.newHp! } : u);
        if (isMineTarget) setMyUnits(updateFn);
        else setEnemyUnits(updateFn);
      }
    }

    if (ev.type === "miss") {
      setFlashUnits((prev) => target ? { ...prev, [target.instanceId]: "damage" } : prev);
    }

    if (ev.type === "ko") {
      // KO events carry the KO'd unit in unitInstanceId, not targetUnitId
      const koUnit = allUnits.find((u) => u.instanceId === ev.unitInstanceId);
      if (koUnit) {
        setFlashUnits((prev) => ({ ...prev, [koUnit.instanceId]: "ko" }));
        setMyUnits((prev) => prev.map((u) => u.instanceId === koUnit.instanceId ? { ...u, alive: false } : u));
        setEnemyUnits((prev) => prev.map((u) => u.instanceId === koUnit.instanceId ? { ...u, alive: false } : u));
      }
    }

    if (actor && (ev.type === "attack" || ev.type === "skill")) {
      setFlashUnits((prev) => ({ ...prev, [actor.instanceId]: "attack" }));
    }
  }

  function getValidMoves(unit: GridUnit): { x: number; y: number }[] {
    const def = getUnitDef(unit.defId);
    if (!def) return [];
    // Only same-side units occupy ally grid tiles; enemy units live on a separate grid
    const occupied = new Set(myUnits.filter((u) => u.alive && u.instanceId !== unit.instanceId).map((u) => `${u.x},${u.y}`));
    const result: { x: number; y: number }[] = [];
    for (let cx = 0; cx < 4; cx++) {
      for (let cy = 0; cy < 4; cy++) {
        const isCurrent = cx === unit.x && cy === unit.y;
        if (!isCurrent && Math.abs(cx - unit.x) + Math.abs(cy - unit.y) <= def.moveDist && !occupied.has(`${cx},${cy}`)) {
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
      // Support/healing skills highlight all alive allies (full-field support range)
      setHighlights(myUnits.filter((u) => u.alive).map((u) => ({ x: u.x, y: u.y, onEnemy: false })));
      return;
    }
    // Enemy-targeting: filter by the skill's attack range (side-aware)
    const range = getAttackRange(skill.style);
    const validTargets = aliveEnemies.filter((e) => {
      const dist = state.mySide === "A"
        ? crossGridDist(unit.x, unit.y, e.x, e.y)
        : crossGridDist(e.x, e.y, unit.x, unit.y);
      return dist <= range;
    });
    setSelectMode("skill");
    setHighlights(validTargets.map((e) => ({ x: e.x, y: e.y, onEnemy: true })));
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

  const turnOrder = [...aliveMyUnits, ...aliveEnemies].sort((a, b) => {
    const spA = getUnitDef(a.defId)?.speed ?? 0;
    const spB = getUnitDef(b.defId)?.speed ?? 0;
    return spB - spA;
  });

  return (
    <div className="battle-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');
        ${battleCSS()}
      `}</style>

      {/* HUD top */}
      <div className="b-hud-top">
        <div className="b-side-label b-side-you">YOU</div>
        <div className="b-turn-badge">Turn {state.turnNumber}</div>
        <div className="b-hud-right">
          <button
            className={`b-music-btn${settings.muted ? " b-music-btn-muted" : ""}`}
            onClick={() => setMuted(!settings.muted)}
            title={settings.muted ? "Unmute music" : "Mute music"}
            aria-label={settings.muted ? "Unmute music" : "Mute music"}
          >
            {settings.muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </button>
          <button
            className="b-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
            aria-label="Open settings"
          >⚙</button>
          <div className="b-side-label b-side-opp">OPP</div>
        </div>
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

      {/* Battlefield stage — Three.js renderer fills this container */}
      <div className="b-stage">
        <BattleRenderer
          myUnits={myUnits}
          enemyUnits={enemyUnits}
          mySide={state.mySide ?? "A"}
          selectedId={selectedId}
          highlights={highlights}
          selectMode={selectMode}
          queued={queued}
          flashUnits={flashUnits}
          onUnitClick={handleSelectUnit}
          onTileClick={handleTileClick}
        />
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
                        <button
                          className={`b-act-btn${(skillMenuOpen === unit.instanceId || (selectMode === "skill" && selectedId === unit.instanceId)) ? " active" : ""}`}
                          aria-label={`Skills ${def.name}`}
                          onClick={() => setSkillMenuOpen(skillMenuOpen === unit.instanceId ? null : unit.instanceId)}
                        >
                          Skills ▾
                        </button>
                        <button className="b-act-btn" aria-label={`Wait ${def.name}`} onClick={handleWait}>Wait</button>
                        <button className="b-act-btn" aria-label={`Defend ${def.name}`} onClick={handleDefend}>Defend</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Skill detail panel — lives outside the scroll row so nothing clips it */}
            {skillMenuOpen && (() => {
              const skUnit = aliveMyUnits.find(u => u.instanceId === skillMenuOpen);
              const skDef  = skUnit ? getUnitDef(skUnit.defId) : null;
              if (!skUnit || !skDef) return null;
              return (
                <div className="b-skill-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="b-skp-header">
                    <span className="b-skp-title">
                      <span className="b-skp-unitname">{skDef.name}</span>
                      <span className="b-skp-sub"> — Choose Skill</span>
                    </span>
                    <button className="b-skp-close" onClick={() => setSkillMenuOpen(null)} aria-label="Close skills">✕</button>
                  </div>
                  <div className="b-skp-grid">
                    {skDef.skills.map(sk => {
                      const canAfford = skUnit.ap >= sk.ap;
                      return (
                        <button
                          key={sk.id}
                          className={`b-skill-card${canAfford ? "" : " b-skill-card-poor"}`}
                          disabled={!canAfford}
                          onClick={() => handleSkillSelect(sk)}
                        >
                          <div className="b-skc-top">
                            <span className="b-skc-name">{sk.name}</span>
                            <span className="b-skc-ap">{sk.ap} AP</span>
                          </div>
                          <div className="b-skc-badges">
                            <span className={`b-skc-type b-skt-${sk.type}`}>{sk.type}</span>
                            <span className="b-skc-badge b-skc-style">{skillStyleLabel(sk.style)}</span>
                            {sk.power    != null && <span className="b-skc-badge">PWR {sk.power}</span>}
                            {sk.healAmount != null && <span className="b-skc-badge b-skc-heal">HEAL +{sk.healAmount}</span>}
                            <span className="b-skc-badge">{sk.accuracy}% acc</span>
                            {sk.aoe && <span className="b-skc-badge b-skc-aoe">AoE {sk.aoe.w}×{sk.aoe.h}</span>}
                          </div>
                          {sk.effect && <div className="b-skc-effect">{sk.effect}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}


function skillStyleLabel(s: string): string {
  if (s === "ranged-direct") return "Ranged";
  if (s === "ranged-volley") return "Volley";
  if (s === "self")          return "Self";
  if (s === "ally")          return "Ally";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function actionLabel(action: QueuedAction) {
  if (action.type === "skill") return "SK";
  if (action.type === "attack") return "ATK";
  if (action.type === "move") return "MV";
  if (action.type === "wait") return "WT";
  if (action.type === "defend") return "DEF";
  return "?";
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
    .b-hud-right {
      display: flex; align-items: center; gap: 0.55rem;
    }
    .b-music-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: rgba(240,192,64,0.08);
      border: 1px solid rgba(240,192,64,0.28);
      border-radius: 6px;
      color: #f0c040;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      padding: 0;
    }
    .b-music-btn:hover {
      background: rgba(240,192,64,0.18);
      border-color: rgba(240,192,64,0.55);
    }
    .b-music-btn-muted {
      color: rgba(240,192,64,0.38);
      border-color: rgba(240,192,64,0.15);
      background: rgba(240,192,64,0.03);
    }
    .b-music-btn-muted:hover {
      color: rgba(240,192,64,0.65);
      border-color: rgba(240,192,64,0.35);
      background: rgba(240,192,64,0.1);
    }
    .b-settings-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: rgba(240,192,64,0.08);
      border: 1px solid rgba(240,192,64,0.28);
      border-radius: 6px;
      color: rgba(200,170,100,0.75);
      cursor: pointer; font-size: 1rem; line-height: 1;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      padding: 0;
    }
    .b-settings-btn:hover {
      background: rgba(240,192,64,0.18);
      border-color: rgba(240,192,64,0.55);
      color: #f0c040;
    }

    /* Stage — Three.js fills this container */
    .b-stage {
      flex: 1;
      position: relative;
      overflow: hidden;
      min-height: 280px;
    }

    /* (old tile/battlefield CSS removed — Three.js handles rendering) */
    @keyframes tilePopIn {
      0%   { transform: scale(0.7); opacity: 0; }
      70%  { transform: scale(1.06); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes tileGlowMove {
      from { box-shadow: inset 0 0 8px rgba(60,130,255,0.2); }
      to   { box-shadow: inset 0 0 18px rgba(60,130,255,0.45); }
    }
    @keyframes tileGlowAttack {
      from { box-shadow: inset 0 0 8px rgba(255,60,60,0.2); }
      to   { box-shadow: inset 0 0 18px rgba(255,60,60,0.45); }
    }
    @keyframes tileGlowSkill {
      from { box-shadow: inset 0 0 8px rgba(60,200,120,0.2); }
      to   { box-shadow: inset 0 0 18px rgba(60,200,120,0.45); }
    }
    /* Movement tiles: blue */
    .b-tile-hl-move {
      background: rgba(60,130,255,0.22) !important;
      border-color: rgba(80,160,255,0.8) !important;
      cursor: pointer;
      animation: tilePopIn 0.18s ease-out, tileGlowMove 0.8s 0.18s ease-in-out infinite alternate;
    }
    /* Attack tiles: red */
    .b-tile-hl-attack {
      background: rgba(255,60,60,0.22) !important;
      border-color: rgba(255,80,80,0.8) !important;
      cursor: pointer;
      animation: tilePopIn 0.18s ease-out, tileGlowAttack 0.8s 0.18s ease-in-out infinite alternate;
    }
    /* Skill tiles: green */
    .b-tile-hl-skill {
      background: rgba(60,200,120,0.22) !important;
      border-color: rgba(80,220,140,0.8) !important;
      cursor: pointer;
      animation: tilePopIn 0.18s ease-out, tileGlowSkill 0.8s 0.18s ease-in-out infinite alternate;
    }
    /* Arrow dash animation */
    @keyframes arrowDash {
      from { stroke-dashoffset: 36; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes targetPulse {
      from { transform: scale(0.85); opacity: 0.3; }
      to   { transform: scale(1.35); opacity: 0.7; }
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
    .b-token-ko { opacity: 0.22; transition: opacity 0.5s; pointer-events: none; }

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
      animation: badgePop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97);
    }
    @keyframes badgePop {
      0%   { transform: scale(0); opacity: 0; }
      55%  { transform: scale(1.35); opacity: 1; }
      75%  { transform: scale(0.92); }
      100% { transform: scale(1); }
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
      animation: badgePop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97);
    }

    .b-action-menu {
      margin-top: 0.4rem;
      display: flex; flex-wrap: wrap; gap: 3px;
      border-top: 1px solid rgba(240,192,64,0.15);
      padding-top: 0.4rem;
      animation: actionMenuSlideIn 0.22s ease-out;
    }
    @keyframes actionMenuSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
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

    /* ── Skill panel (panel-level, never clipped) ── */
    .b-skill-panel {
      margin: 0.45rem 0 0.1rem;
      background: rgba(8,5,20,0.97);
      border: 1px solid rgba(240,192,64,0.22);
      border-radius: 8px;
      padding: 0.55rem 0.65rem 0.6rem;
      animation: skPanelIn 0.12s ease;
    }
    @keyframes skPanelIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .b-skp-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.45rem;
    }
    .b-skp-title { font-family: 'Cinzel', serif; }
    .b-skp-unitname { font-size: 0.72rem; font-weight: 700; color: #f0c040; }
    .b-skp-sub { font-size: 0.65rem; color: rgba(240,192,64,0.45); }
    .b-skp-close {
      background: none; border: none; cursor: pointer;
      color: rgba(200,170,100,0.5); font-size: 0.75rem; line-height: 1;
      padding: 2px 4px; border-radius: 3px; transition: color 0.12s;
    }
    .b-skp-close:hover { color: #f0c040; }

    .b-skp-grid {
      display: flex; flex-wrap: wrap; gap: 0.4rem;
    }

    .b-skill-card {
      flex: 1 1 180px;
      background: rgba(15,10,32,0.9);
      border: 1px solid rgba(240,192,64,0.2);
      border-radius: 7px; padding: 0.45rem 0.55rem;
      text-align: left; cursor: pointer;
      transition: background 0.13s, border-color 0.13s, transform 0.1s;
    }
    .b-skill-card:hover:not(:disabled) {
      background: rgba(240,192,64,0.08);
      border-color: rgba(240,192,64,0.5);
      transform: translateY(-1px);
    }
    .b-skill-card:disabled, .b-skill-card-poor {
      opacity: 0.38; cursor: not-allowed;
    }
    .b-skc-top {
      display: flex; justify-content: space-between; align-items: baseline;
      margin-bottom: 0.28rem; gap: 0.4rem;
    }
    .b-skc-name {
      font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 700;
      color: #f0e0a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .b-skc-ap {
      font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 600;
      color: #4080ff; white-space: nowrap; flex-shrink: 0;
    }
    .b-skc-badges {
      display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 0.25rem;
    }
    .b-skc-type {
      font-family: 'Cinzel', serif; font-size: 0.55rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase;
      padding: 1px 5px; border-radius: 3px;
    }
    .b-skt-physical { background: rgba(255,120,60,0.18); color: #ff8050; border: 1px solid rgba(255,120,60,0.35); }
    .b-skt-magical  { background: rgba(160,80,255,0.18); color: #b070ff; border: 1px solid rgba(160,80,255,0.35); }
    .b-skt-healing  { background: rgba(60,200,120,0.18); color: #40c880; border: 1px solid rgba(60,200,120,0.35); }
    .b-skt-buff     { background: rgba(60,130,255,0.18); color: #5090ff; border: 1px solid rgba(60,130,255,0.35); }
    .b-skt-special  { background: rgba(240,192,64,0.18); color: #f0c040; border: 1px solid rgba(240,192,64,0.35); }
    .b-skc-badge {
      font-family: 'Cinzel', serif; font-size: 0.55rem;
      color: rgba(200,170,100,0.7);
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 1px 5px; border-radius: 3px; white-space: nowrap;
    }
    .b-skc-style { color: rgba(180,160,255,0.75); border-color: rgba(160,140,255,0.2); background: rgba(160,140,255,0.07); }
    .b-skc-heal  { color: #40c880; border-color: rgba(60,200,120,0.25); background: rgba(60,200,120,0.07); }
    .b-skc-aoe   { color: #f0a040; border-color: rgba(240,160,60,0.25); background: rgba(240,160,60,0.07); }
    .b-skc-effect {
      font-size: 0.6rem; color: rgba(200,180,140,0.55);
      line-height: 1.4; margin-top: 0.15rem;
      border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.2rem;
      font-style: italic;
    }

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
