import type { FrameEntry } from "./myrmidonAnim";

const TICK_MS = 1000 / 30;

function t(file: string, ticks: number): FrameEntry {
  return { file, durationMs: Math.round(ticks * TICK_MS) };
}

export const idleClip: FrameEntry[] = [
  t("wanderer_atk_000", 12),
];

export const attackClip: FrameEntry[] = [
  t("wanderer_atk_000",  3),
  t("wanderer_atk_001",  3),
  t("wanderer_atk_002",  4),
  t("wanderer_atk_003",  3),
  t("wanderer_atk_004",  2),
  t("wanderer_atk_005",  1),
  t("wanderer_atk_006",  8),
  t("wanderer_atk_007",  2),
  t("wanderer_atk_008",  3),
  t("wanderer_atk_009",  5),
];

/** Frame at which the blade makes contact — fire SFX here. */
export const WANDERER_HIT_FRAME = "wanderer_atk_006";

export const ALL_WANDERER_FILES: string[] = Array.from(
  new Set([
    ...idleClip.map((f) => f.file),
    ...attackClip.map((f) => f.file),
  ]),
);
