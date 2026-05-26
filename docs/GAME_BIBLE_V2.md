# Tower Seekers — Game Bible v2.0

---

## Changelog from v1.0

The following changes were made between v1.0 and v2.0. Everything else in this document is carried over from v1.0 verbatim.

- **Starting AP raised from 2 to 3.**
- **Baseline AP income added:** all units gain +1 AP every turn, always (regardless of action taken).
- **Basic Attack now costs 1 AP** (was 0 AP); the on-hit bonus remains +2 AP, so a landed hit yields net +2 AP with the baseline (+1 baseline −1 cost +2 on-hit).
- **Wait now costs 0 AP and grants +1 AP** (net +2 with baseline, no damage).
- **Defend costs 1 AP** (was 0 AP); grants 40% damage mitigation.
- **Status Effects replaced with a three-tier system:** Core Afflictions (mutually exclusive per unit), Tactical Conditions (stackable), and Field / Tile Effects (occupy grid cells).
- **Paralysis removed** from the game. Replaced by Stun wherever it previously appeared (specifically Shaman's Spore Cloud).
- **Old Slow removed** ("movement costs double AP"). New Slow = Move Distance −1 (minimum 1).
- **Root renamed to Rooted** in the Tactical Conditions list (same mechanic).
- **Curse as a status name renamed to Vulnerable** (Tactical Condition). Warlock's *Curse* skill keeps its name; its effect now references the Vulnerable condition.
- **Wither effect is no longer a named status** — it is modeled as a per-skill stat-debuff rider. Skills that previously applied it keep working unchanged.
- **Knight — Iron Guard passive rewritten:** Defend costs 0 AP for Knight and grants 60% damage mitigation (the "+1 AP" clause from v1.0 is removed).
- **Shaman — Spore Cloud:** Paralysis replaced with Stun (1 turn, skip turn, ignores damage).
- **Shaman — Mycelium Web:** "movement costs double AP" slow replaced with Move Distance −1 (Slow) for 5 turns.
- **Rogue — Smokescreen:** clarified as a single field-wide Smoke field effect blanketing Rogue's entire 4×4 side for 2 turns.
- **Warlock — Doom:** noted as a Core Affliction (mutually exclusive slot).
- **Warlock — Curse:** effect text updated to reference the Vulnerable Tactical Condition.
- **Gathering Hub — loadout model changed to party-level configuration:** the same unit may appear in multiple parties with different skill/passive loadouts per party slot.

---

## Table of Contents

- Changelog from v1.0
- 1. Vision & Ethos
- 2. Core Rules & Mechanics
- 3. All 12 Units
- 4. Master Stats Reference
- 5. Navigation & Playlists
- 6. Gathering Hub
- 7. Release Roadmap
- 8. Future PvE — The Tower
- New Moves — In Design (placeholder)
- Open Discussion Items for Andy

---

## 1. Vision & Ethos

Tower Seekers is an online competitive turn-based tactical battler built around JRPG class archetypes and deep unit customization. Two players each bring a roster of 6 units, draft 4 into battle after seeing each other's picks, place them on a 4×4 grid, and resolve simultaneous action selections in speed order — creating a competitive experience that rewards preparation, reads, and in-battle adaptation.

The game draws from a deep well of inspiration:

- **Octopath Traveler** — HD-2D visual direction: pixel-art characters on richly lit, dimensional environments
- **Final Fantasy** — Class archetypes (Knight, Paladin, Dragoon/Lancer, Mage, Bard, etc.), iconic abilities like Dragoon Jump
- **Slay the Spire** — Roguelike tower PvE structure: risk/reward decisions, run variety, incremental power
- **Darkest Dungeon** — Roster tension, unit vulnerability, the weight of losing a unit in a run
- **Clash Royale** — Quick competitive sessions, counterpick-driven meta, roster building at the core of the experience

The ethos of Tower Seekers is that every decision matters. Skill picks, passive choices, unit placement, and action selection all feed into a layered system where knowledge of your opponent's kit is as important as knowing your own. There are no filler choices — every slot in a party, every skill in a loadout, is meaningful.

---

## 2. Core Rules & Mechanics

### The Grid

- Each player controls one 4×4 grid. The two grids face each other.
- Players bring 6 units to a match and pick 4 after seeing the opponent's full roster (draft phase).
- Picked units are placed on the player's own grid before combat begins.
- No unit may remain in the enemy grid. Any move that sends a unit into the enemy grid must return that unit to their own side at the end of the action. (Future special moves may introduce exceptions.)

### Action Menu Order

When a unit's turn is active, the action menu is presented in this order:

**Move → Attack → Defend → Wait → Skill**

### AP Economy

| Rule | Value |
|---|---|
| Starting AP | 3 |
| AP cap | 10 |
| Baseline income | +1 AP every turn, always |
| Basic Attack | Cost 1 AP, +2 AP on hit (net +2 with baseline, plus damage) |
| Wait | Cost 0 AP, +1 AP gained (net +2 with baseline, no damage) |
| Defend | Cost 1 AP, 40% damage mitigation |
| Move | Cost 1 AP flat, default 2 tiles (per-unit overrides per v1.0) |
| Skill | Cost varies per move, no AP return |

AP carries across turns. Unused AP is not lost. Managing AP flow is a core strategic layer.

### Movement

- Move costs 1 AP flat.
- Default move range: 2 tiles per Move action.
- Units with a listed Move Range stat use that value instead (e.g. Shaman: 1 tile).

### Base Attack

- Base power: 20
- Scales off the unit's Primary Stat
- Default accuracy: 110% (standard single-target; see global accuracy standards)
- Landing a base attack triggers the standard +2 AP on-hit rule.

### Attack Styles

Grid geometry:

- The two 4×4 grids are directly adjacent with no gap. The full combat space is effectively 4×8.
- Range is measured in Manhattan distance (no diagonals): each tile moved up, down, left, or right = 1.
- Units always end their turn in their own grid. No unit may occupy an enemy grid tile.

| Style | Range | Blocking |
|---|---|---|
| Melee | 4 tiles (Manhattan) | Expanding cone shadow — a line is drawn from attacker to target; any unit on that path casts a shadow that widens ±1 row per column of depth behind it, projected from the attacker's angle. Attackers at extreme row angles have natural sight past centrally-placed blockers. |
| Ranged-Direct | 8 tiles (Manhattan) | Straight-line only — any unit on the direct path between attacker and target blocks the shot. |
| Ranged-Volley | 6 tiles (Manhattan) | None — arc projectile; always lands on the selected target tile if in range. |

Global targeting rule: All skills — damaging or otherwise, AoE or single-target — follow the range and blocking rules for their style unless the skill explicitly states otherwise (e.g. "always hits", "ignores cover", "ignores blocking"). AoE skills: the area of effect is applied centered on the selected target tile. The target tile must be within range and pass the relevant blocking check; the AoE spread from that tile is then applied regardless of blocking.

### Damage Formula

Tower Seekers uses the Pokémon damage formula, applied at the unit's current level:

```
Damage = ((2 × Level / 5 + 2) × Power × Attacker_Stat / Defender_Stat / 50 + 2) × Modifiers
```

- Tournament standard level: 11. All stats in this document are calibrated for level 11 units.
- Max level in-game: 16. (Subject to change.)
- Attacker_Stat = PhysAtk (for Physical moves) or MagAtk (for Magical moves).
- Defender_Stat = PhysDef (for Physical moves) or MagDef (for Magical moves).

### Accuracy & Evasion

- Accuracy is a per-move stat, not a unit stat.
- Evasion is a unit stat.
- Formula: Hit Chance = Move Accuracy% − Defender Evasion% (minimum 5%, maximum 100%)
- Accuracy intentionally exceeds 100% on most moves so that evasion is meaningful without making attacks feel unreliable.

Global accuracy standards (locked):

| Move category | Accuracy |
|---|---|
| Standard single-target | 110% |
| Powerful single-target | 105% |
| AoE | 90% |
| Very accurate (e.g. Sniper Shot) | 130% |
| Unreliable / high-reward | 95% |

### Turn Resolution

- All players select actions simultaneously.
- Actions resolve in Speed order (highest Speed acts first).
- Ties in Speed are resolved by a 50/50 coin toss — each tied unit has an equal chance of going first, determined randomly at the moment of resolution.

### Status Effects

#### Core Afflictions — only ONE may be active on a unit at a time. A new Core Affliction replaces any existing one.

| Status | Effect |
|---|---|
| Burn | PhysAtk −30%, 8 damage/turn |
| Poison | Pure DoT; stacks intensity on reapply (10 → 18 → 24 damage/turn) |
| Bleed | 6 damage/turn; doubles to 12 if target moved that turn |
| Sleep | Skip turn; breaks on damage taken |
| Stun | Skip turn; ignores damage |
| Silence | Cannot use Skills (Basic Attack / Move / Defend / Wait still allowed) |
| Doom | Boss-tier; target takes fixed damage per turn for X turns (Warlock's Doom skill is the canonical applier on player units; bosses in PvE may also apply it) |

#### Tactical Conditions — multiple may stack on the same unit.

| Condition | Effect |
|---|---|
| Marked | +25% damage taken from next attack only, then consumed |
| Rooted | Cannot move |
| Taunted | Must target the taunter with single-target offensive actions |
| Vulnerable | +20% damage taken from all sources for 2 turns |
| Shielded | Absorbs X HP until depleted |
| AP Block | Prevents AP gain (caps current AP, no income) |
| Evasion Up | +30% evasion for 2 turns |
| Slow | Move Distance −1 (minimum 1) |
| Armor Break | PhysDef −25% for duration |

#### Field / Tile Effects — occupy grid cells, separate from units.

| Field | Notes |
|---|---|
| Trap | Triggers on entering tile |
| Mire | Slows movement on tiles |
| Fire tile | DoT on units standing in |
| Smoke | Obscures targeting |
| Holy zone | Heals/buffs allies inside (Paladin's Blessed Ground, Cleric's Sacred Ground are existing Holy zones) |

#### Removed / Migrated Statuses (for reference)

- **Paralysis (v1.0):** REMOVED. Replaced by Stun where it appeared (Shaman Spore Cloud).
- **Slow (v1.0 form: "movement costs double AP"):** REMOVED. Replaced by new Slow (Move Distance −1).
- **Root (v1.0):** renamed to Rooted in the Tactical Conditions list. Same mechanic.
- **Curse as a status name:** renamed to Vulnerable. Warlock's Curse skill keeps its name; it now applies the Vulnerable condition.
- **Wither effect:** not a status. Modeled as a per-skill stat-debuff rider. Skills that apply it keep working — they apply temporary stat modifiers, not a tagged status.

### Critical Hits

Crits are not passive random chance. They are triggered by specific skill mechanics and conditions — e.g. Wanderer combo chains, Feint setup, Archer's Sharpshooter stacks. When a crit is triggered, it deals additional damage as defined by the triggering skill.

---

## 3. All 12 Units

Each unit equips 4 skills + 1 passive (Bard exception: 1 instrument passive + 1 standard passive). In addition to the 4 equipped skills, every unit always has these universal actions available: Basic Attack, Move, Defend, Wait.

---

### 1. Warlock

**Primary Stat:** MagAtk | **Base Attack:** Ranged-Volley

| Stat | Value |
|---|---|
| HP | 90 |
| PhysAtk | 25 |
| MagAtk | 65 |
| PhysDef | 40 |
| MagDef | 50 |
| Speed | 38 |
| Move Dist | 2 |
| Evasion | 10% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Drain Life | Special | 55 | 3 | Ranged-Direct | Heals Warlock for 50% of damage dealt |
| Curse | — | — | 2 | Ranged-Direct | Applies the Vulnerable Tactical Condition — target takes +20% damage from all sources for 2 turns |
| Wither | — | — | 3 | Ranged-Volley | AoE 2×2 — MagAtk −20% on all hit for 2 turns |
| Soul Rend | Special | 70 | 3 | Ranged-Volley | +15 damage per active debuff on target |
| Doom | — | — | 3 | Ranged-Direct | Target takes 20 damage/turn for 3 turns. Doom is a Core Affliction — it occupies the single Core Affliction slot, mutually exclusive with Burn/Poison/Bleed/Sleep/Stun/Silence. On Warlock's kit it is the canonical Doom applier for player units; bosses in PvE may also apply it. |
| Necrotic Burst | Special | 65 | 5 | Ranged-Volley | AoE full row |
| Spellblade | — | — | 4 | Self | Swaps MagAtk and PhysAtk; base attacks become melee (ethereal blade); can base attack one additional time per turn for 5 turns |
| Soul Siphon | — | — | 3 | Ranged-Direct | Permanently drains 20 MagAtk from target — added to Warlock's MagAtk until Warlock is defeated |

**Passives**

- *Spite* — Attacker loses 1 AP whenever they hit Warlock
- *Hex Toll* — Debuffed enemies spend +1 extra AP to use any skill
- *Eldritch Blast* — Warlock fires two base attacks in one Attack action, each at 75% damage

---

### 2. Paladin

**Primary Stat:** PhysAtk | **Base Attack:** Melee

| Stat | Value |
|---|---|
| HP | 130 |
| PhysAtk | 60 |
| MagAtk | 40 |
| PhysDef | 65 |
| MagDef | 55 |
| Speed | 25 |
| Move Dist | 2 |
| Evasion | 5% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Holy Strike | Physical | 55 | 1 | Melee-Direct | Basic blessed swing |
| Inspiring Strike | Physical | 30 | 2 | Melee-Direct | If landed, adjacent allies gain +50% evasion for 2 turns |
| Shield Slam | Physical | 50 | 2 | Melee-Direct | Target PhysDef −20% for 2 turns |
| Consecrating Slam | Special | 45 | 4 | Melee-Direct | AoE 2×2 on opponent's side within melee reach |
| Smite | Physical | 75 | 3 | Melee-Direct | +30% damage vs debuffed targets |
| Aegis | — | — | 2 | Single Ally | Target ally takes −40% damage until end of the following turn |
| Divine Aura | — | — | 5 | Self + AoE | Paladin and adjacent allies gain +25% evasion and +25% PhysAtk for 5 turns |
| Blessed Ground | Healing | — | 4 | AoE | 2×2 blessed field; allies inside heal 10 HP/turn for 3 turns |

**Passives**

- *Holy Presence* — Adjacent allies take −15% damage from all sources
- *Devotion* — Gains +1 AP the first time each turn Paladin buffs or heals a teammate
- *Sacred Vow* — When any ally drops to 0 HP, Paladin gains +2 AP immediately

---

### 3. Knight

**Primary Stat:** PhysAtk | **Base Attack:** Melee

| Stat | Value |
|---|---|
| HP | 150 |
| PhysAtk | 65 |
| MagAtk | 15 |
| PhysDef | 80 |
| MagDef | 40 |
| Speed | 20 |
| Move Dist | 1 |
| Evasion | 5% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Slash | Physical | 55 | 1 | Melee-Direct | Reliable sword strike |
| Shield Bash | Physical | 45 | 2 | Melee-Direct | Stuns target — they lose their next action |
| Challenge | — | — | 2 | Ranged-Direct | Forces target to attack Knight next turn or take 25 chip damage |
| Fortress Stance | — | — | 2 | Self | +40% PhysDef for 2 turns; Knight cannot move while active |
| Lance Charge | Physical | 70 | 4 | Melee-Piercing | Pierces through the entire column |
| Iron Wall | — | — | 2 | Self | Completely absorbs the next 50 damage received |
| Bulwark | — | — | 3 | AoE | All allies in a 2×2 area gain +25% PhysDef for 2 turns |
| Decisive Strike | Physical | 90 | 4 | Melee-Direct | Massive hit; Knight cannot move on its next turn |
| Last Bastion | — | — | 4 | Self | For one full turn, all damage dealt to any ally is redirected to Knight instead (calculated with Knight's own defenses) |

**Passives**

- *Steadfast* — Knight cannot be displaced, pushed, or have its position altered by any effect
- *Iron Guard* — Defend costs 0 AP for Knight and grants 60% damage mitigation (vs the standard 40%)
- *Ironclad* — Knight takes −20% damage from all sources while at or above 50% HP

---

### 4. Cleric

**Primary Stat:** MagAtk | **Base Attack:** Ranged-Volley

| Stat | Value |
|---|---|
| HP | 90 |
| PhysAtk | 20 |
| MagAtk | 55 |
| PhysDef | 45 |
| MagDef | 78 |
| Speed | 30 |
| Move Dist | 2 |
| Evasion | 10% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Mend | Healing | — | 1 | Single Ally | Restores 20 HP to a single ally |
| Holy Light | Healing | — | 2 | Single Ally | Restores 40 HP to a single ally |
| Cleanse | — | — | 2 | Single Ally | Removes all debuffs from target ally; that ally gains +1 AP |
| Inspire | — | — | 3 | Single Ally | Target ally gains +2 AP immediately |
| Benediction | Healing | — | 3 | AoE 2×2 | Restores 20 HP to all allies in area |
| Purifying Wave | — | — | 3 | AoE 2×2 | Removes all debuffs from all allies in area; each cleansed ally gains +1 AP |
| Sacred Ground | Healing | — | 4 | AoE 2×2 | Allies inside regenerate 10 HP and +1 AP per turn for 3 turns |
| Divine Intervention | Healing | — | 5 | Single Ally | Revives a KO'd ally at 30% HP with all debuffs removed |
| Holy Bolt | Special | 50 | 2 | Ranged-Volley | Basic holy energy blast |
| Judgment | Special | 75 | 3 | Ranged-Direct | Deals +5 bonus damage for each heal Cleric has performed so far in the match |
| Holy Shell | — | — | 3 | AoE 2×3 | All allies in the area gain +35% MagDef for 3 turns |

**Passives**

- *Blessed Touch* — Each time Cleric heals an ally, Cleric gains +1 AP
- *Mana Spring* — At the start of each turn, all adjacent allies gain +1 AP
- *Guardian Angel* — The first time any ally would be KO'd each turn, Cleric automatically heals them for 15 HP (can prevent the KO)

---

### 5. Mage

**Primary Stat:** MagAtk | **Base Attack:** Ranged-Volley

| Stat | Value |
|---|---|
| HP | 80 |
| PhysAtk | 15 |
| MagAtk | 80 |
| PhysDef | 25 |
| MagDef | 55 |
| Speed | 35 |
| Move Dist | 2 |
| Evasion | 10% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Arcane Bolt | Special | 55 | 2 | Ranged-Direct | Reliable magic shot |
| Frost Lance | Special | 60 | 2 | Ranged-Direct | Reduces target Speed by 15 for 2 turns |
| Arcane Surge | — | — | 2 | Self | Next skill used this match deals +50% damage |
| Fireball | Special | 70 | 3 | Ranged-Volley | AoE 2×2 explosion |
| Chain Lightning | Special | 65 | 3 | Ranged-Piercing | Deals 60% damage to the nearest additional enemy |
| Blizzard | Special | 55 | 4 | Ranged-Volley | AoE 3×3; all hit units lose 10 Speed for 2 turns |
| Frost Barrier | — | — | 3 | Self | Creates an ice wall that intercepts the next direct attack aimed at Mage; if triggered, Mage gains +3 AP; 3-turn cooldown |
| Arcane Cataclysm | Special | 120 | 7 | Ranged-Volley | AoE 3×3 ultimate; requires significant AP buildup |

**Passives**

- *Spell Mastery* — After using 3 different skills in a match, all skill AP costs are reduced by 1 (minimum 1)
- *Overload* — Each time Mage deals damage with a skill, gains +5 MagAtk permanently (stacks up to 5×)
- *Arcane Echo* — 30% chance any damaging skill bounces to a second random enemy target for 50% damage

---

### 6. Rogue

**Primary Stat:** PhysAtk | **Base Attack:** Melee

| Stat | Value |
|---|---|
| HP | 85 |
| PhysAtk | 55 |
| MagAtk | 25 |
| PhysDef | 35 |
| MagDef | 35 |
| Speed | 80 |
| Move Dist | 4 |
| Evasion | 20% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Backstab | Physical | 50 | 2 | Melee-Direct | +50% damage if attacking from a non-frontal angle |
| Smokescreen | — | — | 3 | Self | Blankets Rogue's entire 4×4 side of the field with a Smoke field effect for 2 turns; enemy cannot accurately target specific tiles on Rogue's side. (This is a single field-wide Smoke effect, not a tile patch.) |
| Shadowstep | — | — | 1 | Movement | Teleports to any tile within Move Distance, ignoring blocking units |
| Poison Blade | Physical | 45 | 2 | Melee-Direct | Target takes 10 damage/turn for 3 turns |
| Cheap Shot | Physical | 40 | 2 | Melee-Direct | Reduces target Speed by 20 for 2 turns |
| Death Mark | — | — | 3 | Ranged-Direct | Target takes +30% damage from all sources for 2 turns |
| Blade Flurry | Physical | 40 | 3 | Melee-Direct | Strikes 3 times; each hit checked for evasion separately |
| Marked for Death | Physical | 85 | 4 | Melee-Direct | Only usable if target has a debuff; always crits (×1.5) |
| Mug | Physical | 30 | 2 | Melee-Direct | Steals 2 AP from target on hit |
| Rip | — | — | 3 | Melee-Direct | Strips one active buff from target and applies it to Rogue instead |
| Knock Off | Physical | 25 | 2 | Melee-Direct | Low damage; removes target's equipped item for the rest of the match |

**Passives**

- *Sneak Attack* — Hitting an enemy from a different row than Rogue adds +15% damage
- *Predator* — Moving and attacking on the same turn deals +25% damage
- *Scout* — In PvP: reveals opponent's queued action for one unit per turn; in PvE: Rogue can see fully hidden enemy intentions

---

### 7. Archer

**Primary Stat:** PhysAtk | **Base Attack:** Ranged-Direct

| Stat | Value |
|---|---|
| HP | 100 |
| PhysAtk | 72 |
| MagAtk | 40 |
| PhysDef | 40 |
| MagDef | 40 |
| Speed | 50 |
| Move Dist | 2 |
| Evasion | 15% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Double Shot | Physical | 35×2 | 2 | Ranged-Direct | Fires twice at the same target |
| Pinning Arrow | Physical | 45 | 2 | Ranged-Direct | Inflicts Root (can't move) for 1 turn |
| Crippling Shot | Physical | 40 | 2 | Ranged-Direct | Reduces target PhysAtk by 20% for 2 turns |
| Marked Shot | Physical | 55 | 3 | Ranged-Direct | Target takes +20% damage from all sources for 2 turns |
| Piercing Arrow | Physical | 65 | 3 | Ranged-Direct | Ignores PhysDef |
| Volley | Physical | 30 | 3 | Ranged-Volley | Hits all enemies in a 2-tile radius |
| Rain of Arrows | Physical | 25×3 | 4 | Ranged-Volley | Hits all enemies in target zone 3 times |
| Steady Aim | — | — | 1 | — | Next attack this turn gains +30% accuracy and +20% power |
| Sniper Shot | Physical | 80 | 4 | Ranged-Direct | Range 10 tiles; ignores all blocking (Very Accurate category) |

**Passives**

- *Sharpshooter* — Each successful hit adds +5% accuracy (stacks up to +30%); resets fully on a miss
- *Flow State* — Every 2 landed hits grants +1 AP
- *Double Tap* — Every other base attack fires twice (alternates: single → double → single → double)

---

### 8. Berserker

**Primary Stat:** PhysAtk | **Base Attack:** Melee

| Stat | Value |
|---|---|
| HP | 145 |
| PhysAtk | 85 |
| MagAtk | 25 |
| PhysDef | 45 |
| MagDef | 35 |
| Speed | 48 |
| Move Dist | 2 |
| Evasion | 10% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Cleave | Physical | 55 | 2 | Melee | Hits target and one adjacent enemy |
| Reckless Strike | Physical | 90 | 3 | Melee | Deals 15% of damage dealt back to self |
| Bloodlust | Physical | 50 | 2 | Melee | Heals self for 30% of damage dealt |
| Fury | — | — | 1 | — | Gain +15% PhysAtk for 2 turns; lose 5% max HP |
| Rampage | Physical | 40×3 | 4 | Melee | Hits random enemies 3 times |
| Whirlwind | Physical | 45 | 3 | Melee | Leap to an unoccupied tile up to 4 spaces away adjacent to an enemy; spin and deal damage to all enemies adjacent to that tile; return to starting tile |
| Berserker Charge | Physical | 70 | 3 | Melee | Move 2 tiles then strike |
| Sunder | Physical | 60 | 3 | Melee | Reduces target PhysDef by 25% for 2 turns |
| Last Stand | — | — | 2 | — | Below 25% HP: gain +40% PhysAtk until end of turn |
| Earth Rend | Physical | 50 | 8 | Melee | Slams the ground; deals 50 power to all enemies on the outer 10 tiles and forces them into the 4 interior tiles (always hits; enemies already in the interior take no damage) |

**Passives**

- *Frenzy* — Each consecutive melee hit on the same target stacks +8% damage bonus; resets if Berserker switches targets
- *Undying* — Once per match, survive a lethal hit at 1 HP instead of dying
- *Bloodthirst* — Each kill restores 20% max HP

---

### 9. Lancer

**Primary Stat:** PhysAtk | **Base Attack:** Melee

| Stat | Value |
|---|---|
| HP | 120 |
| PhysAtk | 68 |
| MagAtk | 50 |
| PhysDef | 60 |
| MagDef | 43 |
| Speed | 45 |
| Move Dist | 2 |
| Evasion | 10% |

**Jump / High Jump rule:** While airborne, Lancer is innately untargetable. This is a baseline mechanic, not a passive. Lancer gains +2 AP for each turn spent airborne.

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Lancet | Physical | 55 | 2 | Melee | Drains 20% of damage dealt as HP |
| Jump | Physical | 100 | 4 | Melee | Lancer becomes untargetable and airborne for 1 turn, gains 2 AP while airborne, then crashes down on chosen tile |
| High Jump | Physical | 140 | 6 | Melee | Airborne for 2 turns; gains 2 AP each turn airborne; heavier crash landing damage |
| Skewer | Physical | 70 | 3 | Melee | Pierces through target, also hitting the unit directly behind them |
| Steady Thrust | Physical | 60 | 2 | Melee | Ignores 30% of target's PhysDef |
| Dragon Fang | Physical | 75 | 3 | Melee | 35% chance to inflict Armor Break (−25% PhysDef) for 2 turns |
| Impulse | Physical | 40 | 3 | Melee | Hits all enemies in a straight line directly ahead |
| Spear Volley | Physical | 50 | 3 | Ranged-Volley | Hurls spear in an arc; range 8; hits a tile and all adjacent to it |
| Aerial Drive | Physical | 65 | 3 | Melee | Strikes target and one diagonal tile simultaneously |
| Dragon's Roar | Magical | 60 | 3 | — | Releases draconic energy; hits all enemies in a 2-tile radius |
| Tempest Lance | Magical | 70 | 3 | Ranged-Direct | Wind-infused strike; reaches up to 4 tiles |

**Passives**

- *Dragon's Blood* — Lancer heals 20% max HP while airborne during Jump or High Jump
- *Spear Reach* — Base attacks naturally strike 2 spaces in a line, hitting the target and the unit directly behind them
- *Lance Mastery* — Lancet heals an additional 10% of Lancer's max HP on top of the damage drained

---

### 10. Wanderer

**Primary Stat:** PhysAtk / MagAtk (hybrid)

| Stat | Value |
|---|---|
| HP | 110 |
| PhysAtk | 72 |
| MagAtk | 55 |
| PhysDef | 47 |
| MagDef | 48 |
| Speed | 75 |
| Move Dist | 3 |
| Evasion | 30% |

**Phantom Stance rule:** While Phantom Stance is active, Arcane Tempest is unlocked and appears in the skill menu. When Phantom Stance ends, Arcane Tempest is unavailable again.

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Feint | — | — | 1 | — | Next offensive move on any future turn is a guaranteed crit |
| Rising Slash | Physical | 50 | 2 | Melee | Upward strike; if Falling Edge is used after this turn, it crits |
| Falling Edge | Physical | 65 | 2 | Melee | Downward strike; crits and gains +20 power if Rising Slash was used this turn |
| Shadow Step | — | — | 2 | — | Move up to 3 tiles and gain +15% evasion for 2 turns |
| Phantom Strike | Physical | 72 | 3 | Melee | Teleport-slash; crits and ignores PhysDef if Shadow Step was used this turn |
| Mirage Veil | — | — | 4 | — | Gain +40% evasion for 4 turns |
| Phantom Stance | — | — | 2 | — | Base attack transforms into 2 magical volleys for 5 turns; unlocks Arcane Tempest |
| Arcane Tempest | Magical | 85 | 6 | Ranged-Volley | Unleashes a storm of magical blades hitting all enemies across the entire enemy grid; only usable while Phantom Stance is active |
| Wind Slash | Magical | 50 | 2 | Ranged-Direct | Blade of wind up to 4 tiles; if Elemental Surge follows, it crits |
| Blur | — | — | 1 | — | Gain +25% evasion until next turn |

**Passives**

- *Nomad's Instinct* — Each successful attack or evasion raises evasion by +5%; resets fully when Wanderer takes a hit
- *Blade Flow* — Successful crits restore 2 AP
- *Ghost Stride* — Movement costs 0 AP while Wanderer's total evasion is above 30%

---

### 11. Shaman

**Primary Stat:** MagAtk | **Base Attack:** Ranged-Volley

| Stat | Value |
|---|---|
| HP | 160 |
| PhysAtk | 38 |
| MagAtk | 60 |
| PhysDef | 60 |
| MagDef | 75 |
| Speed | 25 |
| Evasion | 5% |
| Move Range | 1 tile |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Wither | — | — | 1 | Ranged-Direct | Reduces target's PhysAtk by 10% for 1 turn |
| Spore Sting | Magical | 20 | 1 | Ranged-Direct | Small nature hit; 35% chance to poison target (6% max HP/turn for 2 turns) |
| Entangle | — | — | 2 | Ranged-Direct | Roots single target for 1 turn |
| Poison Spores | — | — | 2 | Ranged-Direct | Poisons target (8% max HP/turn for 3 turns) |
| Nature's Embrace | — | — | 3 | — | Heals self or one ally for 30% of Shaman's MagAtk |
| Spore Cloud | Magical | 35 | 3 | Ranged-Volley | Hits 2-tile radius; inflicts Stun on all hit enemies for 1 turn |
| Regrowth | — | — | 4 | — | Shaman regenerates 7% max HP/turn for 4 turns and removes one debuff |
| Spore Veil | — | — | 4 | — | Reduces all enemies' MagAtk by 25% for 3 turns |
| Earthbind | — | — | 5 | Ranged-Volley | Roots all enemies in a 3×1 row for 1 turn |
| Mycelium Web | — | — | 5 | — | Claims up to 4 tiles; enemies on or entering those tiles have Move Distance −1 (Slow) for 5 turns |
| Grand Blight | Magical | — | 7 | — | Poisons all enemies for heavy DOT (12% max HP/turn for 3 turns); always hits |

**Passives**

- *Thick Skin* — Incoming magical damage reduced by 20%
- *Spore Aura* — Enemies that hit Shaman with a melee attack have a 35% chance to be poisoned
- *Nature's Bounty* — At the start of each turn, Shaman regenerates 5% max HP

---

### 12. Bard

**Primary Stat:** MagAtk | **Base Attack:** Ranged (instrument-dependent)

| Stat | Value |
|---|---|
| HP | 100 |
| PhysAtk | 50 |
| MagAtk | 63 |
| PhysDef | 43 |
| MagDef | 60 |
| Speed | 48 |
| Move Dist | 2 |
| Evasion | 12% |

**Skill Pool**

| Move | Type | Power | AP | Style | Effect |
|---|---|---|---|---|---|
| Dissonance | Magical | 25 | 1 | Ranged-Direct | Discordant note; deals minor damage and drains 1 AP from target |
| Inspire | — | — | 2 | — | Grant one ally +2 AP immediately |
| Mend | — | — | 2 | — | Heal one ally for 20% of Bard's MagAtk |
| Mockery | Magical | 45 | 3 | Ranged-Direct | Deals damage and reduces target's MagAtk by 20% for 2 turns |
| Battle Hymn | — | — | 3 | — | All allies gain +1 AP at the start of each of their next 2 turns |
| Cleanse | — | — | 3 | — | Remove all debuffs from one ally |
| Lullaby | — | — | 4 | Ranged-Volley | 65% chance to inflict Sleep on all enemies in a 2-tile radius for 1 turn |
| War Song | — | — | 4 | — | All allies gain +20% PhysAtk and MagAtk for 2 turns |
| Ballad of Swiftness | — | — | 4 | — | All allies gain +25% Speed for 3 turns |
| Mass Cleanse | — | — | 5 | — | Remove all debuffs from all allies |
| Anthem of Resilience | — | — | 5 | — | All allies gain +25% PhysDef and MagDef for 3 turns |
| Magnum Opus | — | — | 7 | — | All allies gain +3 AP and +15% to all stats for 2 turns |

**Standard Passives (pick 1)**

- *Encore* — When any ally scores a kill, Bard gains 2 AP
- *Resonance* — All of Bard's buffs last 1 additional turn
- *Harmonics* — Whenever Bard buffs an ally, Bard heals for 10% of their max HP

**Instrument Passives / Subclasses (pick 1 — also grants a second passive slot)**

Bard is the only unit with subclass passives. Picking an instrument passive unlocks a second passive slot, making the instrument passive + one standard passive your full loadout.

- *Swordsbard* — Wield a sword; PhysAtk +10; base attacks deal 35 power scaling off PhysAtk
- *Crossbowbard* — Equip two crossbows; Evasion +10%; base attacks target two enemies dealing 15 power each (Ranged-Direct, 8 spaces, line of sight), scaling off PhysAtk
- *Harpbard* — Wield a harp; MagAtk +10; base attack becomes a Ranged-Direct magical attack (30 base power) against enemies; can also target allies — targeting an ally deals no damage but grants them +1 AP, cannot miss, and still triggers Bard's +2 AP on-hit gain

---

## 4. Master Stats Reference

All base stats at level 50, fully locked. Move = Move Distance in tiles.

| # | Unit | HP | PhysAtk | MagAtk | PhysDef | MagDef | Speed | Move | Evasion |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Warlock | 90 | 25 | 65 | 40 | 50 | 38 | 2 | 10% |
| 2 | Paladin | 130 | 60 | 40 | 65 | 55 | 25 | 2 | 5% |
| 3 | Knight | 150 | 65 | 15 | 80 | 40 | 20 | 1 | 5% |
| 4 | Cleric | 90 | 20 | 55 | 45 | 78 | 30 | 2 | 10% |
| 5 | Mage | 80 | 15 | 80 | 25 | 55 | 35 | 2 | 10% |
| 6 | Rogue | 85 | 55 | 25 | 35 | 35 | 80 | 4 | 20% |
| 7 | Archer | 100 | 72 | 40 | 40 | 40 | 50 | 2 | 15% |
| 8 | Berserker | 145 | 85 | 25 | 45 | 35 | 48 | 2 | 10% |
| 9 | Lancer | 120 | 68 | 50 | 60 | 43 | 45 | 2 | 10% |
| 10 | Wanderer | 110 | 72 | 55 | 47 | 48 | 75 | 3 | 30% |
| 11 | Shaman | 160 | 38 | 60 | 60 | 75 | 25 | 1 | 5% |
| 12 | Bard | 100 | 50 | 63 | 43 | 60 | 48 | 2 | 12% |

---

## 5. Navigation & Playlists

The main menu presents the following selectable activities ("playlists"):

| Screen | Description |
|---|---|
| Gathering Hub | Party builder — browse units, preview skills, create and save party loadouts |
| PvP Queue | Playtest: join via code. Alpha+: casual queue and ranked ladder with matchmaking |
| Tower Runs | PvE roguelike tower runs (unlocked in Alpha) |
| Profile (Full Release) | Clan banner, badge, match history, stats |
| Settings (cog button) | Audio, visual, and gameplay options |

---

## 6. Gathering Hub

The Gathering Hub is the party management screen — a dedicated space to build, customize, and save unit loadouts before queuing.

### Features

**Unit Browser**

- Browse all 12 units via a scrollable/filterable menu.
- View each unit's stat block, lore blurb, and visual sprite.

**Skill & Passive Preview**

- Click any skill or passive to see its full description.
- Full Release: each move has a .gif animation preview.

**Party Builder (party-level loadouts)**

- Select 6 units to form a party.
- For each unit IN THAT PARTY, configure:
  - 4 skills from their skill pool
  - 1 passive from their passive options (Bard: 1 instrument + 1 standard)
- Name and save the party as a Party loadout.
- Multiple saved parties supported, and the same unit may appear across multiple parties with different skill/passive configurations. Configuration is bound to the party slot, not the unit. (Example: "Team PvP" contains a Knight with one loadout; "Team Tower Run" contains the same Knight with a different loadout. Both are valid simultaneously.)
- One XP/progression pool per unit, shared across all parties they appear in.

**Playtest Rule:** All units, skills, and passives are fully unlocked for all players. All units at tournament standard level 11. No grind required.

---

## 7. Release Roadmap

### Playtest (current target)

- PvP via join code (invite partner or test group directly)
- Gathering Hub with full roster access
- All 12 units, all skills, and all passives fully unlocked
- All units at tournament standard level 11 — no progression grind
- Basic UI and functional battle system

### Alpha

- Ranked PvP ladder with matchmaking
- 3 PvE roguelike towers at varying difficulty levels
- Full art pass: updated sprites, animations, music, sound effects, and UI polish

### Beta

- Hub Town: a persistent town space housing vendors, mentors, and recruiters
- Grind curve introduced: recruit a unit at level 1; level them up through towers and challenges
- Unlockable vendors/mentors require completing specific towers or challenges
- 5 total towers (expanded from Alpha's 3)
- 3 solo class towers: individual roguelike runs with a single unit; class-specific; completing one unlocks a new class
- Aesthetic system: sprite skins, visual shaders, hair/appearance sliders

### Full Release

- Duo co-op towers: two players run a tower together
- Profile system: clan banner, badge, match history
- .gif move previews in the Gathering Hub for all skills
- All Beta content fully refined and expanded

---

## 8. Future PvE — The Tower

The Tower is the PvE roguelike mode. Players select a party and attempt to clear a series of escalating wave fights, making decisions between waves that shape the run.

### Core Structure

- Wave fights: each floor contains one or more enemy waves
- Enemy intent telegraphs: enemies broadcast their intended actions; a scan mechanic can reveal hidden intents that aren't shown by default
- Run decisions: choose routes, rewards, and risk levels between waves

### Progression Systems

- Mastery XP: each unit earns XP tied to their class, unlocking rewards over time
- Augments: units can gain run-specific augments (temporary power-ups) during a Tower run
- Item slots: units can equip items found or purchased during a run

### Difficulty Tiers

- 3 towers at Alpha launch (varying difficulty: Apprentice, Adept, Master or equivalent naming TBD)
- 5 towers at Beta
- Solo towers (single-unit runs, class-specific, unlock new classes on completion)
- Duo co-op towers at Full Release

---

## New Moves — In Design (placeholder)

The following mechanical categories and statuses are part of the v2.0 ruleset but do not yet have a complete set of inflicting/interacting moves wired into the unit pools. Moves will be added here in subsequent edits to this document, then merged into the relevant unit skill pools.

**Do not add stat blocks to this section.** Each category below will receive 1–2 new moves (name, type, power, AP, style, effect) once design is locked with Andy.

### Categories with active design

| Category | Status | Candidates |
|---|---|---|
| Tempo / priority | No current move | Rogue, Wanderer |
| Redirection | Sparse coverage | Paladin |
| Speed manipulation — field-wide flip | No current move | Mage |
| Action denial — skill lock / forced repeat | Sparse coverage | Warlock, Bard |
| Burn application | No current inflicting move | Mage |
| Bleed application | No current inflicting move | Berserker |
| Single-target positioning — push / pull | Sparse coverage | Lancer, Knight |
| Support amplification | One-note coverage | Bard |

---

## Open Discussion Items for Andy

The following questions are unresolved and need Andy's input before v2.0 is considered final. Please answer in order.

1. **New move distribution** — Each new move is owned by 1–2 candidate units (see placeholder section above). Confirm or veto the candidate list. Decide cap: one new move per unit, or some units get two?

2. **Echo vs Encore overlap** — Both proposed moves involve forcing a target to repeat their last action. Differentiate (Echo = lock OUT of other moves, Encore = compel USE of last move) or pick one?

3. **Field-wide speed flip ownership** — Currently proposed for Mage as "Hourglass". Confirm Mage, or move to Warlock or a future Time-themed unit?

4. **Should v2.0 introduce a 13th unit?** Some categories (pure Tank-with-redirection-as-identity, Time Mage, dedicated Burn applier) might justify a new class instead of bolting moves onto existing units. Decide before move design finalizes.

5. **AP cost convention for new moves** — v1.0 has very few 1-AP moves. Should new T0 basics (Snap Strike, Quick Slash, Bleeding Strike, Ember Mark, Vanguard's Call) skew toward 1–2 AP to fix the "nothing to do at low AP" problem, or stay at 2–3 AP to match v1.0 norms?

6. **Status interactions** — When a unit has both a Core Affliction (e.g. Burn) and Tactical Conditions (e.g. Vulnerable), do effects compound multiplicatively or additively? (Affects how Burn's PhysAtk debuff stacks with Wither/Armor Break, etc.)

7. **Doom availability** — v2.0 keeps Warlock's Doom skill. Should any other unit get a Doom-applying move, or is it Warlock-exclusive?

8. **Burn/Poison/Bleed cleansing** — Cleric's Cleanse and Bard's Cleanse currently say "removes all debuffs". Confirm both Tactical Conditions AND the active Core Affliction are removed by these, or do Core Afflictions need a separate cleanse tier?
