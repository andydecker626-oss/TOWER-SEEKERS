export interface FrameEntry {
  file: string;
  durationMs: number;
}

const TICK_MS = 1000 / 30;

function t(file: string, ticks: number): FrameEntry {
  return { file, durationMs: Math.round(ticks * TICK_MS) };
}

export const idleClip: FrameEntry[] = [
  t("Sword_000", 8),
];

export const attackClip: FrameEntry[] = [
  t("Sword_000",  1),
  t("Sword_001",  2),
  t("Sword_002",  2),
  t("Sword_003",  2),
  t("Sword_004",  4),
  t("Sword_005",  3),
  t("Sword_006",  6),
  t("Sword_007",  3),
  t("Sword_008",  3),
  t("Sword_009",  2),
  t("Sword_010",  8),
  t("Sword_012",  1),
  t("Sword_011",  1),
  t("Sword_013",  1),
  t("Sword_014",  1),
  t("Sword_015",  1),
  t("Sword_016",  1),
  t("Sword_017",  1),
  t("Sword_018",  1),
  t("Sword_019",  1),
  t("Sword_020",  1),
  t("Sword_021",  2),
  t("Sword_022",  1),
  t("Sword_023",  2),
  t("Sword_024",  2),
  t("Sword_025",  3),
  t("Sword_026",  2),
  t("Sword_027",  2),
  t("Sword_028",  1),
  t("Sword_029",  1),
  t("Sword_030",  1),
  t("Sword_031",  1),
  t("Sword_032",  1),
  t("Sword_033",  1),
  t("Sword_034",  1),
  t("Sword_035",  3),
  t("Sword_036",  3),
  t("Sword_037",  3),
  t("Sword_038",  3),
];

export const ALL_MYRMIDON_FILES: string[] = Array.from(
  new Set([
    ...idleClip.map((f) => f.file),
    ...attackClip.map((f) => f.file),
  ]),
);
