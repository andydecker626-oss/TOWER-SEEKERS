export type Side = "A" | "B";

export type Phase =
  | "lobby"
  | "waiting"
  | "preselection"
  | "battleselect"
  | "placement"
  | "battle"
  | "gameover";

export type AttackStyle = "melee" | "ranged-direct" | "ranged-volley";
export type PrimaryStat = "physAtk" | "magAtk";
export type SkillType = "physical" | "magical" | "healing" | "buff" | "special";

export interface SkillDef {
  id: string;
  name: string;
  type: SkillType;
  power?: number;
  ap: number;
  style: AttackStyle | "self" | "ally";
  accuracy: number;
  aoe?: { w: number; h: number };
  healAmount?: number;
  effect?: string;
}

export interface PassiveDef {
  id: string;
  name: string;
  description: string;
}

export interface UnitDef {
  id: string;
  name: string;
  cls: string;
  description: string;
  baseAttackStyle: AttackStyle;
  primaryStat: PrimaryStat;
  baseHp: number;
  physAtk: number;
  magAtk: number;
  physDef: number;
  magDef: number;
  speed: number;
  moveDist: number;
  evasion: number;
  skills: SkillDef[];
  passives: PassiveDef[];
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
