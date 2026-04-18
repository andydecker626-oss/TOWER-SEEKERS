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

## Mockup Prototypes

- `artifacts/mockup-sandbox/src/components/mockups/pvp-battler/SwordAttackDemo.tsx` — live canvas prototype for a 4v4 turn-based tactical battler showing two separate 4x4 grids, one per team, and one melee sword attack animation crossing between them. Uses the user-provided FE-Repo Awakening-Style Myrmidon Alt [M] sword sprite assets with credits displayed in the preview, plus a larger foreground battle-animation cut-in for clearer sword action.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
