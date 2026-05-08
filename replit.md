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
- **Auth**: Clerk (Replit-managed, `@clerk/react` + `@clerk/express`)

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
- Clerk auth middleware via `@clerk/express` — `src/middlewares/clerkProxyMiddleware.ts`
- Player profile endpoint: `GET /api/player/me` (requires Clerk auth)

**Client** (`artifacts/game-client`):
- React + Vite, served at `/` (port 18508)
- State management: `src/context/SocketContext.tsx` (useReducer + Socket.io)
- Unit data mirrored from server: `src/lib/units.ts`, `src/lib/types.ts`
- Auth: Clerk (`@clerk/react`), `<ClerkProvider>` in `App.tsx`
- Tailwind v4 (`@tailwindcss/vite` with `optimize: false` for Clerk themes compat)

### App Launch Flow

1. **Intro Sequence** (`src/components/IntroSequence.tsx`) — plays once per tab session:
   - Altamentum logo splash (fade in 1s → hold 2.5s → fade out 1s) — logo at `public/assets/altamentum-logo.png`
   - Copyright screen ("© 2026 Seekers Franchise", 2.5s hold)
   - Session flag in `sessionStorage` prevents replaying on hot reloads
2. **Title Screen** (`src/pages/TitleScreen.tsx`) — simplified cinematic: castle panorama bg, Tower Seekers logo, two buttons: "Login to Tower Seekers" (opens Clerk SignIn modal) and "Settings". If already signed in → auto-redirect to `/warroom`.
3. **War Room** (`src/pages/WarRoom.tsx`) — main hub placeholder at `/warroom`. Shows player avatar/username from Clerk, and 4 nav buttons: Quick PvP, Practice vs AI, Gathering Hub, Settings. Protected route (requires auth).

### Route Guard

Any route beyond `/` requires Clerk authentication. Unauthenticated users hitting protected routes are redirected to `/`.

### Database Schema

- `players` table (`lib/db/src/schema/players.ts`): `id`, `clerkUserId`, `username`, `avatarUrl`, `createdAt`, `updatedAt`, `wins`, `losses`

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

### Myrmidon FE Sprite (Wanderer unit)

The Wanderer unit in battle uses real Fire Emblem frames from FE-Repo (Leo_Link's Alt Myrmidon-Reskin, Sword set) instead of a sprite sheet.

- **Frames**: `artifacts/game-client/public/assets/units/myrmidon/Sword_000.png` – `Sword_038.png` (39 PNGs, committed)
- **Download script**: `pnpm --filter @workspace/scripts run download-myrmidon`
- **Animation data**: `artifacts/game-client/src/lib/myrmidonAnim.ts` — idle (Sword_000 looping) and attack (Mode 1, 39 frames with tick-based timing from Sword.txt, ~15fps)
- **Animator class**: `artifacts/game-client/src/lib/FESpriteAnimator.ts` — unit-agnostic, pre-loads textures by file name, supports horizontal flip for enemy units
- **Test page**: `/sprite-test` — 3D scene with idle/attack/flip controls for visual validation
- **Live battle**: `BattleRenderer.tsx` uses `FESpriteAnimator` for any unit with `defId === "wanderer"`

### CSS Sprite Classes

`blade-knight`, `rune-archer`, `cleric`, `guardian`, `lancer`, `hex-mage`, `invoker`, `fell-duelist`
Enemy units use `filter: hue-rotate(180deg) saturate(1.3)` for visual differentiation.

## Mockup Prototypes

- `artifacts/mockup-sandbox/src/components/mockups/pvp-battler/SwordAttackDemo.tsx` — HD-2D battle prototype (1231 lines) — source of CSS/animation inspiration for the battle screen

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
