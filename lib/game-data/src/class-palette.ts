/**
 * Canonical class palette.
 *
 * Sampled from the dominant fill in each shipped <class>-sigil.svg
 * (artifacts/game-client/public/assets/units/<class>-sigil.svg) on 2026-05-29.
 *
 * The shipped sigil art is the source of truth. If a sigil is ever re-rolled,
 * re-sample and update this table. Do NOT change a class's color here without
 * also re-rolling that class's sigil.
 *
 * Use cases:
 *   - Tint masked silhouettes (CSS mask-image + background-color).
 *   - Tinted accent strips, dividers, focus rings, chips.
 *   - Role/category coloring across PreSelection, BattleSelect, GatheringHub.
 *
 * Replaces ad-hoc per-page palettes such as the role colors in PreSelection
 * (#f0c040 / #a78bfa) and SpritePreview's bespoke per-class colors.
 */

export interface ClassColors {
  /** Dominant sigil hex; the canonical "this class" color. */
  primary: string;
  /** Muted variant for backgrounds, low-emphasis chips. ~22% alpha primary. */
  primarySoft: string;
  /** Border / outline variant. ~55% alpha primary. */
  primaryOutline: string;
}

function softAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeEntry(primary: string): ClassColors {
  return {
    primary,
    primarySoft: softAlpha(primary, 0.22),
    primaryOutline: softAlpha(primary, 0.55),
  };
}

export const CLASS_PALETTE: Record<string, ClassColors> = {
  knight:    makeEntry("#225172"),
  paladin:   makeEntry("#D4A857"),
  berserker: makeEntry("#A83A3A"),
  lancer:    makeEntry("#3F8A5C"),
  wanderer:  makeEntry("#A7C4A0"),
  rogue:     makeEntry("#6A4A8A"),
  archer:    makeEntry("#4A7A4A"),
  mage:      makeEntry("#4A6FB0"),
  cleric:    makeEntry("#DACA69"),
  warlock:   makeEntry("#9A3A8A"),
  bard:      makeEntry("#9A4960"),
  shaman:    makeEntry("#7A5A3A"),
};

/**
 * Safe lookup. Falls back to a neutral pearl color if a class id is unknown.
 * Use this in components, never read CLASS_PALETTE directly with a dynamic key.
 */
export function getClassColors(classId: string): ClassColors {
  return CLASS_PALETTE[classId] ?? {
    primary: "#dde2ec",
    primarySoft: "rgba(221, 226, 236, 0.22)",
    primaryOutline: "rgba(221, 226, 236, 0.55)",
  };
}
