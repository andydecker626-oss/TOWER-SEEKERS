# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Tower Seekers — Online PvP Turn-Based Grid Battler

The main game is **Tower Seekers**, a 2-player online PvP turn-based grid unit battler with an HD-2D (Octopath-style) aesthetic.

### Game Architecture

**Server** (`artifacts/api-server`):
- Socket.io server at path `/api/socket.io`
- Game files: `src/game/types.ts`, `src/game/units.ts`, `src/game/engine.ts`, `src/game/rooms.ts`
- 12 unique units with stats and 4 skills each
- Full game state machine: waiting → preselection → placement → battle → gameover
- Damage formula: Pokémon-style at Level 11 (`floor(6.4 * Power * Atk / Def / 50 + 2)`)
- Turn resolution: simultaneous action submission, speed-order execution

**Client** (`artifacts/game-client`):
- React + Vite, served at `/` (port 18508)
- State management: `src/context/SocketContext.tsx` (useReducer + Socket.io)
- Unit data mirrored from server: `src/lib/units.ts`, `src/lib/types.ts`
- 5 screens: Lobby, PreSelection, Placement, Battle, GameOver

### Game Flow

1. **Lobby** — Create room (generates 6-char code) or join with code
2. **PreSelection** — Each player picks 4 of their 6 unit roster
3. **Placement** — Each player positions 4 units on their 4×4 grid
4. **Battle** — Simultaneous turn-based combat; queue actions per unit (Move/Attack/Skill/Wait/Defend), then submit. Server resolves in speed order.
5. **GameOver** — Shows winner, stats, survivors; rematch button

### Grid System

- Each side has a 4×4 grid (x=0 back row, x=3 front row)
- Cross-grid Manhattan distance: `(4 + enemy_x - ally_x) + |ally_y - enemy_y|`
- Melee range = 4, Ranged-Direct = 8, Ranged-Volley = 6
- AP economy: base attacks give +2 AP, skills cost 1–7 AP, moves cost 1 AP

### 12 Units (with roles)

Warlock, Paladin, Knight, Cleric, Mage, Rogue, Archer, Berserker, Lancer, Wanderer, Shaman, Bard

### CSS Sprite Classes

`blade-knight`, `rune-archer`, `cleric`, `guardian`, `lancer`, `hex-mage`, `invoker`, `fell-duelist`
Enemy units use `filter: hue-rotate(180deg) saturate(1.3)` for visual differentiation.

## Mockup Prototypes

- `artifacts/mockup-sandbox/src/components/mockups/pvp-battler/SwordAttackDemo.tsx` — HD-2D battle prototype (1231 lines) — source of CSS/animation inspiration for the battle screen

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
