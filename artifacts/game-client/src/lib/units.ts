import type { UnitDef } from "./types";

export const ALL_UNITS: UnitDef[] = [
  {
    id: "warlock", name: "Warlock", cls: "hex-mage",
    baseAttackStyle: "ranged-volley", primaryStat: "magAtk",
    baseHp: 90, physAtk: 25, magAtk: 65, physDef: 40, magDef: 50, speed: 38, moveDist: 2, evasion: 0.1,
    skills: [
      { id: "drain-life", name: "Drain Life", type: "special", power: 55, ap: 3, style: "ranged-direct", accuracy: 110, effect: "Heals 50% of dmg dealt" },
      { id: "curse", name: "Curse", type: "buff", ap: 2, style: "ranged-direct", accuracy: 105, effect: "+20% dmg taken for 2 turns" },
      { id: "soul-rend", name: "Soul Rend", type: "special", power: 70, ap: 3, style: "ranged-volley", accuracy: 105 },
      { id: "necrotic-burst", name: "Necrotic Burst", type: "special", power: 65, ap: 5, style: "ranged-volley", accuracy: 90 },
    ],
  },
  {
    id: "paladin", name: "Paladin", cls: "guardian",
    baseAttackStyle: "melee", primaryStat: "physAtk",
    baseHp: 130, physAtk: 60, magAtk: 40, physDef: 65, magDef: 55, speed: 25, moveDist: 2, evasion: 0.05,
    skills: [
      { id: "holy-strike", name: "Holy Strike", type: "physical", power: 55, ap: 1, style: "melee", accuracy: 110 },
      { id: "shield-slam", name: "Shield Slam", type: "physical", power: 50, ap: 2, style: "melee", accuracy: 110, effect: "PhysDef −20% for 2t" },
      { id: "smite", name: "Smite", type: "physical", power: 75, ap: 3, style: "melee", accuracy: 105 },
      { id: "aegis", name: "Aegis", type: "buff", ap: 2, style: "ally", accuracy: 100, effect: "Ally −40% dmg next turn" },
    ],
  },
  {
    id: "knight", name: "Knight", cls: "blade-knight",
    baseAttackStyle: "melee", primaryStat: "physAtk",
    baseHp: 150, physAtk: 65, magAtk: 15, physDef: 80, magDef: 40, speed: 20, moveDist: 1, evasion: 0.05,
    skills: [
      { id: "slash", name: "Slash", type: "physical", power: 55, ap: 1, style: "melee", accuracy: 110 },
      { id: "shield-bash", name: "Shield Bash", type: "physical", power: 45, ap: 2, style: "melee", accuracy: 110, effect: "Stun next action" },
      { id: "fortress-stance", name: "Fortress Stance", type: "buff", ap: 2, style: "self", accuracy: 100, effect: "+40% PhysDef 2 turns" },
      { id: "decisive-strike", name: "Decisive Strike", type: "physical", power: 90, ap: 4, style: "melee", accuracy: 105 },
    ],
  },
  {
    id: "cleric", name: "Cleric", cls: "cleric",
    baseAttackStyle: "ranged-volley", primaryStat: "magAtk",
    baseHp: 90, physAtk: 20, magAtk: 55, physDef: 45, magDef: 78, speed: 30, moveDist: 2, evasion: 0.1,
    skills: [
      { id: "mend", name: "Mend", type: "healing", ap: 1, style: "ally", accuracy: 100, healAmount: 20 },
      { id: "holy-light", name: "Holy Light", type: "healing", ap: 2, style: "ally", accuracy: 100, healAmount: 40 },
      { id: "holy-bolt", name: "Holy Bolt", type: "special", power: 50, ap: 2, style: "ranged-volley", accuracy: 110 },
      { id: "judgment", name: "Judgment", type: "special", power: 75, ap: 3, style: "ranged-direct", accuracy: 105 },
    ],
  },
  {
    id: "mage", name: "Mage", cls: "invoker",
    baseAttackStyle: "ranged-volley", primaryStat: "magAtk",
    baseHp: 80, physAtk: 15, magAtk: 80, physDef: 25, magDef: 55, speed: 35, moveDist: 2, evasion: 0.1,
    skills: [
      { id: "arcane-bolt", name: "Arcane Bolt", type: "magical", power: 55, ap: 2, style: "ranged-direct", accuracy: 110 },
      { id: "frost-lance", name: "Frost Lance", type: "magical", power: 60, ap: 2, style: "ranged-direct", accuracy: 110, effect: "−15 Speed 2 turns" },
      { id: "fireball", name: "Fireball", type: "magical", power: 70, ap: 3, style: "ranged-volley", accuracy: 90, aoe: { w: 2, h: 2 } },
      { id: "arcane-cataclysm", name: "Arcane Cataclysm", type: "magical", power: 120, ap: 7, style: "ranged-volley", accuracy: 90, aoe: { w: 3, h: 3 } },
    ],
  },
  {
    id: "rogue", name: "Rogue", cls: "fell-duelist",
    baseAttackStyle: "melee", primaryStat: "physAtk",
    baseHp: 85, physAtk: 55, magAtk: 25, physDef: 35, magDef: 35, speed: 80, moveDist: 4, evasion: 0.2,
    skills: [
      { id: "backstab", name: "Backstab", type: "physical", power: 50, ap: 2, style: "melee", accuracy: 110, effect: "+50% from flank" },
      { id: "poison-blade", name: "Poison Blade", type: "physical", power: 45, ap: 2, style: "melee", accuracy: 110, effect: "Poison 10/turn 3t" },
      { id: "blade-flurry", name: "Blade Flurry", type: "physical", power: 40, ap: 3, style: "melee", accuracy: 95 },
      { id: "marked-for-death", name: "Marked for Death", type: "physical", power: 85, ap: 4, style: "melee", accuracy: 105 },
    ],
  },
  {
    id: "archer", name: "Archer", cls: "rune-archer",
    baseAttackStyle: "ranged-direct", primaryStat: "physAtk",
    baseHp: 100, physAtk: 72, magAtk: 40, physDef: 40, magDef: 40, speed: 50, moveDist: 2, evasion: 0.15,
    skills: [
      { id: "double-shot", name: "Double Shot", type: "physical", power: 35, ap: 2, style: "ranged-direct", accuracy: 110 },
      { id: "pinning-arrow", name: "Pinning Arrow", type: "physical", power: 45, ap: 2, style: "ranged-direct", accuracy: 110, effect: "Root 1 turn" },
      { id: "piercing-arrow", name: "Piercing Arrow", type: "physical", power: 65, ap: 3, style: "ranged-direct", accuracy: 110, effect: "Ignores PhysDef" },
      { id: "sniper-shot", name: "Sniper Shot", type: "physical", power: 80, ap: 4, style: "ranged-direct", accuracy: 130 },
    ],
  },
  {
    id: "berserker", name: "Berserker", cls: "blade-knight",
    baseAttackStyle: "melee", primaryStat: "physAtk",
    baseHp: 145, physAtk: 85, magAtk: 25, physDef: 45, magDef: 35, speed: 48, moveDist: 2, evasion: 0.1,
    skills: [
      { id: "cleave", name: "Cleave", type: "physical", power: 55, ap: 2, style: "melee", accuracy: 110 },
      { id: "reckless-strike", name: "Reckless Strike", type: "physical", power: 90, ap: 3, style: "melee", accuracy: 105 },
      { id: "bloodlust", name: "Bloodlust", type: "physical", power: 50, ap: 2, style: "melee", accuracy: 110, effect: "Heals 30% dmg dealt" },
      { id: "berserker-charge", name: "Berserker Charge", type: "physical", power: 70, ap: 3, style: "melee", accuracy: 110 },
    ],
  },
  {
    id: "lancer", name: "Lancer", cls: "lancer",
    baseAttackStyle: "melee", primaryStat: "physAtk",
    baseHp: 120, physAtk: 68, magAtk: 50, physDef: 60, magDef: 43, speed: 45, moveDist: 2, evasion: 0.1,
    skills: [
      { id: "lancet", name: "Lancet", type: "physical", power: 55, ap: 2, style: "melee", accuracy: 110, effect: "Drain 20% dmg as HP" },
      { id: "jump", name: "Jump", type: "physical", power: 100, ap: 4, style: "melee", accuracy: 105, effect: "Untargetable 1 turn" },
      { id: "skewer", name: "Skewer", type: "physical", power: 70, ap: 3, style: "melee", accuracy: 110 },
      { id: "dragon-fang", name: "Dragon Fang", type: "physical", power: 75, ap: 3, style: "melee", accuracy: 105, effect: "35% Armor Break 2t" },
    ],
  },
  {
    id: "wanderer", name: "Wanderer", cls: "fell-duelist",
    baseAttackStyle: "melee", primaryStat: "physAtk",
    baseHp: 110, physAtk: 72, magAtk: 55, physDef: 47, magDef: 48, speed: 75, moveDist: 3, evasion: 0.3,
    skills: [
      { id: "rising-slash", name: "Rising Slash", type: "physical", power: 50, ap: 2, style: "melee", accuracy: 110 },
      { id: "falling-edge", name: "Falling Edge", type: "physical", power: 65, ap: 2, style: "melee", accuracy: 110 },
      { id: "phantom-strike", name: "Phantom Strike", type: "physical", power: 72, ap: 3, style: "melee", accuracy: 105 },
      { id: "mirage-veil", name: "Mirage Veil", type: "buff", ap: 4, style: "self", accuracy: 100, effect: "+40% evasion 4 turns" },
    ],
  },
  {
    id: "shaman", name: "Shaman", cls: "cleric",
    baseAttackStyle: "ranged-direct", primaryStat: "magAtk",
    baseHp: 160, physAtk: 38, magAtk: 60, physDef: 60, magDef: 75, speed: 25, moveDist: 1, evasion: 0.05,
    skills: [
      { id: "spore-sting", name: "Spore Sting", type: "magical", power: 20, ap: 1, style: "ranged-direct", accuracy: 110, effect: "35% Poison 6% HP 2t" },
      { id: "poison-spores", name: "Poison Spores", type: "buff", ap: 2, style: "ranged-direct", accuracy: 105, effect: "Poison 8% HP 3 turns" },
      { id: "natures-embrace", name: "Nature's Embrace", type: "healing", ap: 3, style: "ally", accuracy: 100, healAmount: 30 },
      { id: "spore-cloud", name: "Spore Cloud", type: "magical", power: 35, ap: 3, style: "ranged-volley", accuracy: 90, effect: "Paralysis AoE" },
    ],
  },
  {
    id: "bard", name: "Bard", cls: "invoker",
    baseAttackStyle: "ranged-direct", primaryStat: "magAtk",
    baseHp: 100, physAtk: 50, magAtk: 63, physDef: 43, magDef: 60, speed: 48, moveDist: 2, evasion: 0.12,
    skills: [
      { id: "dissonance", name: "Dissonance", type: "magical", power: 25, ap: 1, style: "ranged-direct", accuracy: 110, effect: "Drain 1 AP from target" },
      { id: "mockery", name: "Mockery", type: "magical", power: 45, ap: 3, style: "ranged-direct", accuracy: 110, effect: "MagAtk −20% 2 turns" },
      { id: "war-song", name: "War Song", type: "buff", ap: 4, style: "self", accuracy: 100, effect: "All allies +20% Atk 2t" },
      { id: "ballad-of-swiftness", name: "Ballad of Swiftness", type: "buff", ap: 4, style: "self", accuracy: 100, effect: "All allies +25% Speed 3t" },
    ],
  },
];

export function getUnitDef(id: string): UnitDef | undefined {
  return ALL_UNITS.find((u) => u.id === id);
}
