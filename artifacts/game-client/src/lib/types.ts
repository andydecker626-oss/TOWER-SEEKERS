export type Side = "A" | "B";
export type Phase =
  | "lobby"
  | "waiting"
  | "preselection"
  | "placement"
  | "battle"
  | "gameover";

export interface SkillDef {
  id: string;
  name: string;
  type: "physical" | "magical" | "healing" | "buff" | "special";
  power?: number;
  ap: number;
  style: "melee" | "ranged-direct" | "ranged-volley" | "self" | "ally";
  accuracy: number;
  aoe?: { w: number; h: number };
  healAmount?: number;
  effect?: string;
}

export interface UnitDef {
  id: string;
  name: string;
  cls: string;
  baseAttackStyle: "melee" | "ranged-direct" | "ranged-volley";
  primaryStat: "physAtk" | "magAtk";
  baseHp: number;
  physAtk: number;
  magAtk: number;
  physDef: number;
  magDef: number;
  speed: number;
  moveDist: number;
  evasion: number;
  skills: SkillDef[];
}

export interface GridUnit {
  defId: string;
  instanceId: string;
  side: Side;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  ap: number;
  alive: boolean;
}

export interface PlayerAction {
  unitInstanceId: string;
  type: "move" | "attack" | "skill" | "wait" | "defend";
  targetX?: number;
  targetY?: number;
  skillId?: string;
}

export interface TurnEvent {
  type: "move" | "attack" | "skill" | "wait" | "miss" | "ko" | "heal" | "defend";
  unitInstanceId: string;
  side: Side;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  targetUnitId?: string;
  targetX?: number;
  targetY?: number;
  damage?: number;
  heal?: number;
  newHp?: number;
  skillName?: string;
}
