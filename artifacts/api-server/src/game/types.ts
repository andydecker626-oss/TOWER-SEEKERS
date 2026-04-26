import type { Side, Phase, GridUnit, PlayerAction } from "@workspace/game-data";

export type {
  Side,
  Phase,
  AttackStyle,
  PrimaryStat,
  SkillType,
  SkillDef,
  UnitDef,
  GridUnit,
  PlayerAction,
  TurnEvent,
} from "@workspace/game-data";

export interface SideState {
  socketId: string;
  roster: string[];
  picks?: string[];
  placement?: { unitId: string; x: number; y: number }[];
  actions?: PlayerAction[];
}

export interface RoomState {
  code: string;
  phase: Phase;
  sideA: SideState;
  sideB?: SideState;
  battleState: GridUnit[];
  turnNumber: number;
  winner?: Side;
}
