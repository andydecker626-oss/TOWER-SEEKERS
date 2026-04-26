import type { GridUnit, PlayerAction, TurnEvent, Side } from "./types.js";
import { getUnitDef } from "./units.js";

const LEVEL = 11;
const BASE_ATTACK_POWER = 20;
const BASE_ATTACK_ACCURACY = 110;
const STARTING_AP = 2;

export function createGridUnits(
  picks: string[],
  placements: { unitId: string; x: number; y: number }[],
  side: Side
): GridUnit[] {
  if (placements.length !== 4) throw new Error("Must place exactly 4 units");
  const posKeys = new Set<string>();
  return placements.map((p) => {
    if (!picks.includes(p.unitId)) throw new Error(`Unit ${p.unitId} not in picks`);
    if (p.x < 0 || p.x > 3 || p.y < 0 || p.y > 3) throw new Error(`Position out of bounds: (${p.x},${p.y})`);
    const key = `${p.x},${p.y}`;
    if (posKeys.has(key)) throw new Error(`Duplicate placement at (${p.x},${p.y})`);
    posKeys.add(key);
    const def = getUnitDef(p.unitId);
    if (!def) throw new Error(`Unknown unit: ${p.unitId}`);
    return {
      defId: p.unitId,
      instanceId: `${side}-${p.unitId}`,
      side,
      x: p.x,
      y: p.y,
      hp: def.baseHp,
      maxHp: def.baseHp,
      ap: STARTING_AP,
      alive: true,
    };
  });
}

export function pokemonDamage(
  power: number,
  attackStat: number,
  defenseStat: number
): number {
  const levelFactor = (2 * LEVEL) / 5 + 2;
  return Math.max(1, Math.floor((levelFactor * power * attackStat) / defenseStat / 50 + 2));
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function unitAt(state: GridUnit[], x: number, y: number, side?: Side): GridUnit | undefined {
  return state.find(
    (u) => u.alive && u.x === x && u.y === y && (side === undefined || u.side === side)
  );
}
function enemySide(side: Side): Side {
  return side === "A" ? "B" : "A";
}

function rollHit(accuracy: number, evasion: number): boolean {
  const chance = Math.min(100, Math.max(5, accuracy - evasion * 100));
  return Math.random() * 100 < chance;
}

export function resolveTurn(
  battleState: GridUnit[],
  actionsA: PlayerAction[],
  actionsB: PlayerAction[]
): { events: TurnEvent[]; newState: GridUnit[] } {
  const state: GridUnit[] = battleState.map((u) => ({ ...u }));
  const events: TurnEvent[] = [];

  const allActions = [...actionsA, ...actionsB];

  const withSpeed = allActions.map((action) => {
    const unit = state.find((u) => u.instanceId === action.unitInstanceId);
    if (!unit) return { action, speed: 0 };
    const def = getUnitDef(unit.defId);
    return { action, speed: def?.speed ?? 0 };
  });

  withSpeed.sort((a, b) => {
    if (b.speed !== a.speed) return b.speed - a.speed;
    return Math.random() > 0.5 ? 1 : -1;
  });

  for (const { action } of withSpeed) {
    const actor = state.find((u) => u.instanceId === action.unitInstanceId && u.alive);
    if (!actor) continue;
    const actorDef = getUnitDef(actor.defId);
    if (!actorDef) continue;

    switch (action.type) {
      case "wait": {
        actor.ap = Math.min(10, actor.ap + 1);
        events.push({ type: "wait", unitInstanceId: actor.instanceId, side: actor.side });
        break;
      }

      case "defend": {
        events.push({ type: "defend", unitInstanceId: actor.instanceId, side: actor.side });
        break;
      }

      case "move": {
        if (action.targetX === undefined || action.targetY === undefined) break;
        if (action.targetX < 0 || action.targetX > 3 || action.targetY < 0 || action.targetY > 3) break;
        // Only same-side units block movement; opponents live on a separate grid
        const occupied = unitAt(state, action.targetX, action.targetY, actor.side);
        if (occupied) break;
        const dist = manhattan(actor.x, actor.y, action.targetX, action.targetY);
        if (dist > actorDef.moveDist) break;

        const fromX = actor.x;
        const fromY = actor.y;
        actor.x = action.targetX;
        actor.y = action.targetY;
        actor.ap = Math.max(0, actor.ap - 1);
        events.push({
          type: "move",
          unitInstanceId: actor.instanceId,
          side: actor.side,
          fromX,
          fromY,
          toX: actor.x,
          toY: actor.y,
        });
        break;
      }

      case "attack": {
        if (action.targetX === undefined || action.targetY === undefined) break;
        if (action.targetX < 0 || action.targetX > 3 || action.targetY < 0 || action.targetY > 3) break;
        // Attack targets must be on the opposing side's grid
        const target = unitAt(state, action.targetX, action.targetY, enemySide(actor.side));
        if (!target) break;
        const targetDef = getUnitDef(target.defId);
        if (!targetDef) break;

        const range = getAttackRange(actorDef.baseAttackStyle);
        const dist = actor.side === "A"
          ? crossGridDist(actor.x, actor.y, target.x, target.y)
          : crossGridDist(target.x, target.y, actor.x, actor.y);
        if (dist > range) break;

        if (!rollHit(BASE_ATTACK_ACCURACY, targetDef.evasion)) {
          events.push({
            type: "miss",
            unitInstanceId: actor.instanceId,
            side: actor.side,
            targetUnitId: target.instanceId,
            targetX: target.x,
            targetY: target.y,
          });
          break;
        }

        const atkStat =
          actorDef.primaryStat === "physAtk" ? actorDef.physAtk : actorDef.magAtk;
        const defStat =
          actorDef.primaryStat === "physAtk" ? targetDef.physDef : targetDef.magDef;
        const dmg = pokemonDamage(BASE_ATTACK_POWER, atkStat, defStat);
        target.hp = Math.max(0, target.hp - dmg);
        actor.ap = Math.min(10, actor.ap + 2);

        events.push({
          type: "attack",
          unitInstanceId: actor.instanceId,
          side: actor.side,
          targetUnitId: target.instanceId,
          targetX: target.x,
          targetY: target.y,
          damage: dmg,
          newHp: target.hp,
        });

        if (target.hp <= 0) {
          target.alive = false;
          events.push({
            type: "ko",
            unitInstanceId: target.instanceId,
            side: target.side,
            targetX: target.x,
            targetY: target.y,
          });
        }
        break;
      }

      case "skill": {
        if (!action.skillId) break;
        const skill = actorDef.skills.find((s) => s.id === action.skillId);
        if (!skill) break;
        if (actor.ap < skill.ap) break;
        if (
          action.targetX !== undefined &&
          (action.targetX < 0 || action.targetX > 3 || (action.targetY ?? 0) < 0 || (action.targetY ?? 0) > 3)
        ) break;

        actor.ap = Math.max(0, actor.ap - skill.ap);

        if (skill.type === "healing") {
          const tgt =
            action.targetX !== undefined
              ? state.find((u) => u.x === action.targetX && u.y === action.targetY && u.side === actor.side && u.alive)
              : actor;
          if (tgt) {
            const healed = skill.healAmount ?? 20;
            tgt.hp = Math.min(tgt.maxHp, tgt.hp + healed);
            events.push({
              type: "heal",
              unitInstanceId: actor.instanceId,
              side: actor.side,
              targetUnitId: tgt.instanceId,
              targetX: tgt.x,
              targetY: tgt.y,
              heal: healed,
              newHp: tgt.hp,
              skillName: skill.name,
            });
          }
          break;
        }

        if (skill.type === "buff") {
          events.push({
            type: "skill",
            unitInstanceId: actor.instanceId,
            side: actor.side,
            skillName: skill.name,
          });
          break;
        }

        if (action.targetX === undefined || action.targetY === undefined) break;

        // Offensive skill targets must be on the opposing side's grid
        const skillTarget = unitAt(state, action.targetX, action.targetY, enemySide(actor.side));
        if (!skillTarget) break;
        const skillTargetDef = getUnitDef(skillTarget.defId);
        if (!skillTargetDef) break;

        // Authoritative server-side skill range validation
        const skillRange = getAttackRange(skill.style);
        const skillDist = actor.side === "A"
          ? crossGridDist(actor.x, actor.y, skillTarget.x, skillTarget.y)
          : crossGridDist(skillTarget.x, skillTarget.y, actor.x, actor.y);
        if (skillDist > skillRange) break;

        if (!rollHit(skill.accuracy, skillTargetDef.evasion)) {
          events.push({
            type: "miss",
            unitInstanceId: actor.instanceId,
            side: actor.side,
            targetUnitId: skillTarget.instanceId,
            targetX: skillTarget.x,
            targetY: skillTarget.y,
            skillName: skill.name,
          });
          break;
        }

        const power = skill.power ?? 0;
        const isPhys = skill.type === "physical";
        const atkStat2 = isPhys ? actorDef.physAtk : actorDef.magAtk;
        const defStat2 = isPhys ? skillTargetDef.physDef : skillTargetDef.magDef;
        const dmg2 = pokemonDamage(power, atkStat2, defStat2);
        skillTarget.hp = Math.max(0, skillTarget.hp - dmg2);
        actor.ap = Math.min(10, actor.ap + 2);

        events.push({
          type: "skill",
          unitInstanceId: actor.instanceId,
          side: actor.side,
          targetUnitId: skillTarget.instanceId,
          targetX: skillTarget.x,
          targetY: skillTarget.y,
          damage: dmg2,
          newHp: skillTarget.hp,
          skillName: skill.name,
        });

        if (skillTarget.hp <= 0) {
          skillTarget.alive = false;
          events.push({
            type: "ko",
            unitInstanceId: skillTarget.instanceId,
            side: skillTarget.side,
            targetX: skillTarget.x,
            targetY: skillTarget.y,
          });
        }
        break;
      }
    }
  }

  return { events, newState: state };
}

export function checkWinner(state: GridUnit[]): Side | null {
  const aliveA = state.some((u) => u.side === "A" && u.alive);
  const aliveB = state.some((u) => u.side === "B" && u.alive);
  if (!aliveA && !aliveB) return "A";
  if (!aliveA) return "B";
  if (!aliveB) return "A";
  return null;
}

export function getValidMoves(
  unit: GridUnit,
  allUnits: GridUnit[]
): { x: number; y: number }[] {
  const def = getUnitDef(unit.defId);
  if (!def) return [];
  const range = def.moveDist;
  const results: { x: number; y: number }[] = [];

  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      if (x === unit.x && y === unit.y) continue;
      if (manhattan(unit.x, unit.y, x, y) > range) continue;
      const occupied = allUnits.some((u) => u.alive && u.x === x && u.y === y);
      if (!occupied) results.push({ x, y });
    }
  }
  return results;
}

export function crossGridDist(
  allyX: number, allyY: number,
  enemyX: number, enemyY: number
): number {
  // Combined grid: ally at column allyX, enemy at column (4 + enemyX)
  // Distance = (4 + enemyX - allyX) + |allyY - enemyY|
  return (4 + enemyX - allyX) + Math.abs(allyY - enemyY);
}

export function getAttackRange(style: string): number {
  if (style === "melee") return 4;
  if (style === "ranged-volley") return 6;
  return 8; // ranged-direct
}

export function getValidAttacks(
  unit: GridUnit,
  enemies: GridUnit[]
): { x: number; y: number }[] {
  const def = getUnitDef(unit.defId);
  if (!def) return [];
  const range = getAttackRange(def.baseAttackStyle);
  const results: { x: number; y: number }[] = [];

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = unit.side === "A"
      ? crossGridDist(unit.x, unit.y, enemy.x, enemy.y)
      : crossGridDist(enemy.x, enemy.y, unit.x, unit.y);
    if (dist <= range) {
      results.push({ x: enemy.x, y: enemy.y });
    }
  }
  return results;
}
