import type { FrameEntry } from "./myrmidonAnim";

const TICK_MS = 1000 / 30;

function t(file: string, ticks: number): FrameEntry {
  return { file, durationMs: Math.round(ticks * TICK_MS) };
}

export const idleClip: FrameEntry[] = [
  t("wanderer_atk_000", 12),
];

export const attackClip: FrameEntry[] = [
  t("wanderer_atk_000",  3),   // idle entry
  t("wanderer_atk_001",  3),   // step forward
  t("wanderer_atk_002",  4),   // wind-up
  t("wanderer_atk_003",  3),   // forward lean
  t("wanderer_atk_004",  2),   // smear start
  t("wanderer_atk_005",  1),   // smear peak (fastest)
  t("wanderer_atk_006",  1),   // smear — blade arrives
  t("wanderer_atk_007",  8),   // impact hold (longest — SFX fires here)
  t("wanderer_atk_008",  3),   // follow-through / recoil
  t("wanderer_atk_009",  4),   // return / settle
];

/** Frame at which the blade makes contact — fire SFX here. */
export const WANDERER_HIT_FRAME = "wanderer_atk_007";

export const ALL_WANDERER_FILES: string[] = Array.from(
  new Set([
    ...idleClip.map((f) => f.file),
    ...attackClip.map((f) => f.file),
  ]),
);
