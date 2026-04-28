import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { useSettings } from "@/context/SettingsContext";
import { getUnitDef } from "@/lib/units";
import type { GridUnit, PlayerAction, TurnEvent, SkillDef } from "@/lib/types";
import { audioManager } from "@/lib/audio";

// Local sprite map — indexed by unit def.id
const SPRITE_MAP: Record<string, string> = {
  warlock:   "/assets/units/warlock-sprite.png",
  paladin:   "/assets/units/paladin-sprite.png",
  knight:    "/assets/units/knight-sprite.png",
  cleric:    "/assets/units/cleric-sprite.png",
  mage:      "/assets/units/mage-sprite.png",
  rogue:     "/assets/units/rogue-sprite.png",
  archer:    "/assets/units/archer-sprite.png",
  shaman:    "/assets/units/shaman-sprite.png",
  lancer:    "/assets/units/lancer-sprite.png",
  berserker: "/assets/units/berserker-sprite.png",
  bard:      "/assets/units/bard-sprite.png",
  wanderer:  "/assets/units/wanderer-sprite.png",
};

const BATTLE_BACKGROUNDS = [
  "/assets/bg-castle.png",
  "/assets/bg-desert.png",
  "/assets/bg-colosseum.png",
  "/assets/bg-forest.png",
];

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
  const { state, submitActions, clearPendingEvents, confirmGameOver } = useSocket();
  const { settings, setMuted } = useSettings();

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
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number; onEnemy: boolean } | null>(null);
  const lingerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Pick a random battle background once per mount
  const battleBg = useRef(BATTLE_BACKGROUNDS[Math.floor(Math.random() * BATTLE_BACKGROUNDS.length)]);

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
      if (lingerRef.current) clearTimeout(lingerRef.current);
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

  function spawnFloat(text: string, x: number, y: number, color: string, onEnemy: boolean) {
    const id = floatId++;
    setFloats((prev) => [...prev, { id, text, x, y, color, onEnemy }]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 1200);
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
    if (lingerRef.current) clearTimeout(lingerRef.current);
    setHoveredTile(null);
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

      {/* Battlefield stage */}
      <div className="b-stage">
        <div className="b-arena-bg" style={{ backgroundImage: `url('${battleBg.current}')` }}>
          <div className="b-arena-overlay" />
          <div className="b-bokeh b-bokeh1" /><div className="b-bokeh b-bokeh2" /><div className="b-bokeh b-bokeh3" />
        </div>
        <div className="b-field-wrap">
          <div className="b-battlefield" style={{ width: ENEMY_OFFSET + 4 * STEP, height: BOARD_H }}>
            {/* Ally board tiles */}
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => {
                const hl = isHighlighted(col, row, false);
                const hlClass = hl ? ` b-tile-hl-${selectMode}` : "";
                return (
                  <div
                    key={`at-${col}-${row}`}
                    role={hl ? "button" : undefined}
                    aria-label={`Ally grid column ${col + 1} row ${row + 1}`}
                    tabIndex={hl ? 0 : -1}
                    className={`b-tile${hlClass}`}
                    style={{ left: col * STEP, top: row * STEP, width: TILE, height: TILE }}
                    onClick={() => hl && handleTileClick(col, row, false)}
                    onKeyDown={(e) => e.key === "Enter" && hl && handleTileClick(col, row, false)}
                    onMouseEnter={() => {
                      if (lingerRef.current) clearTimeout(lingerRef.current);
                      if (hl) setHoveredTile({ x: col, y: row, onEnemy: false });
                    }}
                    onMouseLeave={() => {
                      if (lingerRef.current) clearTimeout(lingerRef.current);
                      lingerRef.current = setTimeout(() => setHoveredTile(null), 320);
                    }}
                  />
                );
              })
            )}
            {/* Enemy board tiles */}
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => {
                const hl = isHighlighted(col, row, true);
                const hlClass = hl ? ` b-tile-hl-${selectMode}` : "";
                return (
                  <div
                    key={`et-${col}-${row}`}
                    role={hl ? "button" : undefined}
                    aria-label={`Enemy grid column ${col + 1} row ${row + 1}`}
                    tabIndex={hl ? 0 : -1}
                    className={`b-tile b-tile-enemy${hlClass}`}
                    style={{ left: ENEMY_OFFSET + col * STEP, top: row * STEP, width: TILE, height: TILE, zIndex: hl ? 25 : undefined }}
                    onClick={() => hl && handleTileClick(col, row, true)}
                    onKeyDown={(e) => e.key === "Enter" && hl && handleTileClick(col, row, true)}
                    onMouseEnter={() => {
                      if (lingerRef.current) clearTimeout(lingerRef.current);
                      if (hl) setHoveredTile({ x: col, y: row, onEnemy: true });
                    }}
                    onMouseLeave={() => {
                      if (lingerRef.current) clearTimeout(lingerRef.current);
                      lingerRef.current = setTimeout(() => setHoveredTile(null), 320);
                    }}
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
                isAnimating={animating}
                isHoveredTarget={false}
                flashType={flashUnits[unit.instanceId]}
                left={unit.x * STEP + TILE / 2}
                top={unit.y * STEP + TILE / 2}
                onClick={() => handleSelectUnit(unit.instanceId)}
                queuedAction={queued[unit.instanceId]}
                floats={floats.filter((f) => !f.onEnemy && f.x === unit.x && f.y === unit.y)}
              />
            ))}

            {/* Enemy units */}
            {enemyUnits.map((unit) => {
              const isHoveredTarget =
                (selectMode === "attack" || selectMode === "skill") &&
                hoveredTile !== null &&
                hoveredTile.onEnemy &&
                hoveredTile.x === unit.x &&
                hoveredTile.y === unit.y;
              return (
                <UnitToken
                  key={unit.instanceId}
                  unit={unit}
                  isAlly={false}
                  isSelected={false}
                  isAnimating={animating}
                  isHoveredTarget={isHoveredTarget}
                  flashType={flashUnits[unit.instanceId]}
                  left={ENEMY_OFFSET + unit.x * STEP + TILE / 2}
                  top={unit.y * STEP + TILE / 2}
                  onClick={() => {}}
                  queuedAction={undefined}
                  floats={floats.filter((f) => f.onEnemy && f.x === unit.x && f.y === unit.y)}
                />
              );
            })}

            {/* Targeting line SVG overlay */}
            {(() => {
              if (selectMode === "none" || !selectedId || !hoveredTile) return null;
              const actor = myUnits.find(u => u.instanceId === selectedId);
              if (!actor) return null;
              const ax = actor.x * STEP + TILE / 2;
              const ay = actor.y * STEP + TILE / 2;
              const tx = hoveredTile.onEnemy
                ? ENEMY_OFFSET + hoveredTile.x * STEP + TILE / 2
                : hoveredTile.x * STEP + TILE / 2;
              const ty = hoveredTile.y * STEP + TILE / 2;
              const bfW = ENEMY_OFFSET + 4 * STEP;
              const arrowColor = selectMode === "attack" ? "rgba(255,80,80,0.95)" : selectMode === "skill" ? "rgba(160,80,255,0.95)" : "rgba(240,192,64,0.95)";
              const lineColor = selectMode === "attack" ? "rgba(255,80,80,0.8)" : selectMode === "skill" ? "rgba(160,80,255,0.8)" : "rgba(240,192,64,0.8)";
              return (
                <svg
                  style={{ position: "absolute", inset: 0, width: bfW, height: BOARD_H, pointerEvents: "none", zIndex: 28, overflow: "visible" }}
                >
                  <defs>
                    <marker id="tgt-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
                    </marker>
                  </defs>
                  <line
                    x1={ax} y1={ay} x2={tx} y2={ty}
                    stroke={lineColor}
                    strokeWidth="3.5"
                    strokeDasharray="12 6"
                    strokeLinecap="round"
                    markerEnd="url(#tgt-arrow)"
                    style={{ animation: "arrowDash 0.5s linear infinite" }}
                  />
                  <circle cx={ax} cy={ay} r="7" fill="none" stroke={lineColor} strokeWidth="2" opacity="0.7" />
                  <circle cx={tx} cy={ty} r="14" fill="none" stroke={arrowColor} strokeWidth="2"
                    style={{ animation: "targetPulse 0.7s ease-in-out infinite alternate", transformBox: "fill-box", transformOrigin: "center" }} />
                </svg>
              );
            })()}
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
    </div>
  );
}

function UnitToken({
  unit, isAlly, isSelected, isAnimating, isHoveredTarget, flashType, left, top, onClick, queuedAction, floats,
}: {
  unit: GridUnit;
  isAlly: boolean;
  isSelected: boolean;
  isAnimating: boolean;
  isHoveredTarget: boolean;
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
      className={`b-unit-token${isSelected ? " b-token-sel" : ""}${isKo ? " b-token-ko" : ""}${flashType === "damage" ? " b-token-damage" : ""}${flashType === "attack" ? " b-token-attack" : ""}${flashType === "skill" ? " b-token-skill" : ""}${flashType === "defend" ? " b-token-defend" : ""}${flashType === "wait" ? " b-token-wait" : ""}${isHoveredTarget ? " b-token-hovered-target" : ""}`}
      style={{
        position: "absolute",
        left: left,
        top: top,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 20 : unit.y + 5,
        cursor: isAlly && !isKo ? "pointer" : "default",
        transition: isAnimating ? "left 0.45s ease, top 0.45s ease" : "none",
        filter: unit.y === 0 ? "blur(0.6px) brightness(0.78)" : unit.y === 1 ? "blur(0.25px) brightness(0.9)" : "none",
      }}
      onClick={onClick}
    >
      {/* Selected glow ring beneath sprite */}
      {isSelected && (
        <div className="b-glow-ring" aria-hidden="true" />
      )}

      {/* Sprite lift wrapper — handles scale/lift independently from idle animation */}
      <div className={`b-sprite-lift${isSelected ? " b-sprite-lift-sel" : ""}`}>
        <img
          src={SPRITE_MAP[def.id] ?? "/assets/units/knight-sprite.png"}
          alt={def.name}
          className={`unit-sprite${isAlly ? "" : " sprite-enemy"}${flashType === "wait" ? " sprite-wait" : " sprite-idle"}`}
          draggable={false}
        />
      </div>

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

function spriteCSS() {
  return `
    .unit-sprite {
      image-rendering: pixelated;
      display: block;
      width: 64px;
      height: 80px;
      object-fit: contain;
      object-position: center bottom;
      flex-shrink: 0;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));
    }

    /* Enemy tint — cooler hue */
    .unit-sprite.sprite-enemy {
      filter: hue-rotate(170deg) saturate(1.4) brightness(1.05) drop-shadow(0 4px 8px rgba(0,0,0,0.6));
    }

    /* Idle breathing bob */
    .unit-sprite.sprite-idle {
      animation: unitIdleBob 2.4s ease-in-out infinite;
    }

    /* Wait = slow gentle sway */
    .unit-sprite.sprite-wait {
      animation: unitWaitSway 3s ease-in-out infinite;
    }

    @keyframes unitIdleBob {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-3px); }
    }
    @keyframes unitWaitSway {
      0%,100% { transform: translateY(0) rotate(0deg); }
      33%     { transform: translateY(-2px) rotate(-1.5deg); }
      66%     { transform: translateY(-1px) rotate(1deg); }
    }

    /* Sprite lift wrapper — composes with sprite's own idle/wait animation */
    .b-sprite-lift {
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s ease;
    }
    .b-sprite-lift-sel {
      transform: scale(1.12) translateY(-5px);
    }

    /* Selected unit — glow on sprite (no transform here, handled by wrapper) */
    .b-token-sel .unit-sprite {
      filter: brightness(1.35) drop-shadow(0 0 10px rgba(240,192,64,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)) !important;
    }

    /* Glow ring beneath selected token */
    .b-glow-ring {
      position: absolute;
      bottom: 52px;
      left: 50%; transform: translateX(-50%);
      width: 56px; height: 14px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(240,192,64,0.55) 0%, rgba(240,192,64,0) 70%);
      animation: glowRingPulse 1s ease-in-out infinite alternate;
      pointer-events: none;
    }
    @keyframes glowRingPulse {
      from { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
      to   { opacity: 1;   transform: translateX(-50%) scaleX(1.15); }
    }

    /* Enemy token hover in targeting mode */
    .b-token-hovered-target .unit-sprite {
      animation: enemyHoverPulse 0.45s ease-in-out infinite alternate !important;
    }
    @keyframes enemyHoverPulse {
      from { filter: hue-rotate(170deg) saturate(1.4) brightness(1.05) drop-shadow(0 4px 8px rgba(0,0,0,0.6)); }
      to   { filter: hue-rotate(170deg) saturate(2) brightness(1.6) drop-shadow(0 0 16px rgba(255,60,60,1)); }
    }

    /* Damage taken flash + shake */
    .b-token-damage .unit-sprite {
      animation: unitDamageFlash 0.55s ease !important;
    }
    @keyframes unitDamageFlash {
      0%   { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); transform: translateX(0); }
      15%  { filter: brightness(2.5) saturate(0) sepia(1) hue-rotate(-30deg) drop-shadow(0 0 12px rgba(255,80,80,0.9)); transform: translateX(-6px); }
      30%  { transform: translateX(6px); }
      45%  { filter: brightness(2) saturate(0) sepia(1) hue-rotate(-30deg) drop-shadow(0 0 8px rgba(255,80,80,0.7)); transform: translateX(-4px); }
      60%  { transform: translateX(4px); }
      75%  { transform: translateX(-2px); }
      100% { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); transform: translateX(0); }
    }

    /* Attack lunge */
    .b-token-attack .unit-sprite {
      animation: unitAttackLunge 0.42s ease !important;
    }
    @keyframes unitAttackLunge {
      0%     { transform: translateX(0) translateY(0); }
      35%    { transform: translateX(14px) translateY(-5px) scale(1.08); filter: drop-shadow(0 4px 12px rgba(240,192,64,0.5)); }
      65%    { transform: translateX(8px) translateY(-2px) scale(1.04); }
      100%   { transform: translateX(0) translateY(0); }
    }

    /* Skill cast — burst flash */
    .b-token-skill .unit-sprite {
      animation: unitSkillFlash 0.65s ease !important;
    }
    @keyframes unitSkillFlash {
      0%   { transform: scale(1); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); }
      15%  { transform: scale(1.18) translateY(-6px); filter: brightness(2) drop-shadow(0 0 20px rgba(150,80,255,0.9)); }
      35%  { transform: scale(1.12) translateY(-4px); filter: brightness(1.6) drop-shadow(0 0 14px rgba(150,80,255,0.7)); }
      60%  { transform: scale(1.05); }
      100% { transform: scale(1); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); }
    }

    /* Defend stance — shield up pulse */
    .b-token-defend .unit-sprite {
      animation: unitDefendPulse 0.7s ease !important;
    }
    @keyframes unitDefendPulse {
      0%   { transform: scale(1); }
      20%  { transform: scale(0.9) translateY(4px); filter: brightness(0.7) drop-shadow(0 0 10px rgba(60,120,255,0.8)); }
      50%  { transform: scale(0.93) translateY(2px); filter: brightness(0.8) drop-shadow(0 0 6px rgba(60,120,255,0.5)); }
      100% { transform: scale(1); }
    }

    /* KO'd unit */
    .b-token-ko .unit-sprite {
      opacity: 0.15;
      filter: saturate(0) brightness(0.4);
      animation: none !important;
    }
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
      background-size: cover;
      background-position: center center;
      background-color: #0a0614;
    }
    .b-arena-overlay {
      position: absolute; inset: 0;
      background:
        linear-gradient(to bottom, rgba(6,4,16,0.35) 0%, rgba(6,4,16,0.15) 40%, rgba(6,4,16,0.55) 100%),
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(6,4,16,0.7) 0%, transparent 70%);
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
    /* Tile highlight pop-in */
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
