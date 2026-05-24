# CodeBattle Arena

Real-time competitive coding platform where players duel head-to-head on algorithm problems, with ELO ratings, spectator mode, live chat, and a global leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/codebattle-arena run dev` — run the frontend (port 18630)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS, shadcn/ui, Framer Motion, Monaco Editor, wouter, TanStack Query
- API: Express 5 + Socket.io (WebSocket battles + chat)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/codebattle-arena/` — React + Vite frontend (served at `/`)
- `artifacts/api-server/` — Express + Socket.io backend (served at `/api` and `/ws`)
- `lib/db/` — Drizzle schema + migrations (source of truth: `lib/db/src/schema/`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/` — Generated React Query hooks + Zod schemas
- `lib/api-zod/` — Generated Zod request/response validators for server use
- `artifacts/api-server/src/socket/battle-socket.ts` — Socket.io event handlers
- `artifacts/api-server/src/scripts/seed.ts` — Problem seed script

## Architecture decisions

- **VM deployment required**: Socket.io uses persistent WebSocket connections; autoscale would drop in-flight battles. Deploy API server as `vm`.
- **JWT over sessions**: Stateless auth; tokens stored in localStorage and attached as Bearer headers via `setAuthTokenGetter` in the custom fetch layer.
- **Contract-first API**: OpenAPI spec → Orval → typed hooks. Never write raw `fetch` calls in the frontend; use generated hooks from `@workspace/api-client-react`.
- **In-memory socket state**: Battle rooms, spectator lists, and chat history live in `battleRooms` Map on the server. Restarting the server clears active battle state.
- **ELO K=32**: Standard chess-style ELO. Tiers: Beginner (<1200), Pupil (1200–1399), Specialist (1400–1599), Expert (1600+).

## Product

- **Practice**: Browse 12 algorithm problems (Easy → Hard), solve in Monaco editor with JavaScript/Python/C++/Java
- **Battles**: Create a lobby, share invite code, duel in real-time — first to get AC wins, ELO updates immediately
- **Spectate**: Watch any live battle — split-screen read-only editors update as players type, live chat for audience
- **Leaderboard**: Global ELO rankings with win/loss records and tier badges
- **Profile**: Per-user stats, rating history, match results

## User preferences

- Esports / gaming aesthetic: neon cyan + purple theme, Orbitron font for headings, Rajdhani for body text

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before editing frontend
- The WebSocket path is `/ws/socket.io` (not `/api/socket.io`) — the proxy exposes both `/api` and `/ws`
- Socket.io battle room state is ephemeral — server restart loses active battles
- Judge0 is optional: set `JUDGE0_URL` + `JUDGE0_API_KEY` for real code execution; without it, submissions fall back to acceptance-based results

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
