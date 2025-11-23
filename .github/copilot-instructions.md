This repository uses Next.js + Payload CMS with TRPC, Stripe and multi-tenant support.

Keep guidance short and actionable — the goal is to help an AI coding agent get productive quickly.

**Quick Architecture**
- **Frontend:** Next.js app under `src/app` (Next 15 `app/` router). Server components are used; `server-only` imports indicate server-only modules (e.g. `src/trpc/server.ts`).
- **Backend / CMS:** Payload CMS config in `src/payload.config.ts` — DB adapter is Mongo (`@payloadcms/db-mongodb`), plugins include `payload-cloud` and `plugin-multi-tenant`.
- **API:** tRPC lives in `src/trpc/*`. The TRPC context is created in `src/trpc/init.ts` and exposes `baseProcedure` / `protectedProcedure` patterns used by modules (see `src/modules/auth/server/procedure.ts`).
- **Payments:** Stripe is used (`src/lib/stripe.ts`) and tenant Stripe accounts are created on registration.

**Important Workflows / Commands**
- Dev server: `npm run dev` (README also notes `bun dev` — the project sometimes uses `bun` for scripts; `package.json` uses `bun run src/seed.ts` for seeding).
- Build: `npm run build`.
- Payload helpers: `npm run generate:types`, `npm run generate:importmap`, `npm run db:fresh`.
- Seed DB: `npm run db:seed` (runs `bun run src/seed.ts`). If you don't have `bun`, run `node --loader ts-node/esm src/seed.ts` or use your environment's preferred runner.

**Project Conventions / Patterns**
- Path aliases: `@/*` → `src/*`, and `@payload-config` → `src/payload.config.ts` (see `tsconfig.json`). Use these for module resolution.
- Payload usage: server modules call `getPayload({config})` or use `ctx.db` injected by TRPC `baseProcedure`. Authentication is performed via `ctx.db.auth({ headers })` and login via `ctx.db.login` — preserve header forwarding using `next/headers` where the code expects it.
- TRPC: prefer `baseProcedure` to attach `payload` to context and `protectedProcedure` for session checks (see `src/trpc/init.ts`). Use `server-only` in files that must not be shipped to the client.
- Cookie handling: auth tokens are set via a helper (example: `generateAuthCookie` in `src/modules/auth/utils.ts`) — prefer to reuse existing helpers for consistency.
- Multi-tenant: tenant-aware collections are configured in `payload.config.ts` and `@payloadcms/plugin-multi-tenant` is used. When editing data models, keep tenant scoping in mind (e.g., `tenants` field on `users`).

**Integration Points to Watch**
- `src/payload.config.ts` — adding collections, plugins, or changing DB adapter affects the whole app and generated types (`payload-types.ts`).
- `src/trpc/*` — changes to context/transformer affect all TRPC routers. Keep transformers (superjson) and `cache` wrappers intact.
- `src/modules/*/server/*` — module server logic (procedures and routers) rely on `ctx.db` methods. Follow the established CRUD patterns (e.g., `ctx.db.create`, `ctx.db.find`, `ctx.db.login`).
- `src/lib/stripe.ts` — external network calls; mock or stub in tests.

**Examples (where to look)**
- Auth flows: `src/modules/auth/server/procedure.ts` — register/login/logout use `ctx.db` and Stripe.
- TRPC setup: `src/trpc/init.ts` and `src/trpc/server.ts` — shows `baseProcedure`, `protectedProcedure` and `getQueryClient` usage.
- Payload configuration & types: `src/payload.config.ts`, `src/payload-types.ts` (generated).
- DB seeding: `src/seed.ts` — how sample categories and super-admin user are created.

**Safe-edit rules for AI agents**
- Do not change `payload.config.ts` or `tsconfig.json` without explicit intent — they affect generated types and module resolution.
- When modifying server-side code, ensure `server-only` and `next/headers` usage remains correct to avoid leaking server-only imports to the client.
- Prefer small, reversible changes with tests or local dev verification (`npm run dev`).

If anything here is unclear or you'd like the instructions expanded (examples for common edits, testing guidance, or commit message templates), tell me which area and I'll iterate.
