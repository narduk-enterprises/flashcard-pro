# FlashCardPro — Template Audit Report

**Date:** March 2, 2025  
**Template:** narduk-nuxt-template (monorepo, Nuxt 4, Cloudflare Workers, D1, Nuxt UI 4)  
**Scope:** Setup, Drizzle/nitro-cloudflare-dev, layer inheritance, typecheck, docs, tooling.

---

## 1. Did `pnpm setup` complete smoothly?

**Yes.** The setup script ran non-interactively and completed successfully (exit code 0).

- Boilerplate strings replaced in 17 files and 4 markdown files.
- D1 databases provisioned: `flashcard-pro-db` and `flashcard-pro-examples-db` (for example apps that were later removed).
- `apps/web/wrangler.json` updated with the correct D1 binding and database ID.
- Doppler project `flashcard-pro` created; 9 hub credentials synced; `DOPPLER_TOKEN` set as a GitHub secret.
- Favicons generated for `apps/web`.
- Example apps and related workflows/scripts were cleaned up (Step 9).

**Minor notes:**

- npm warnings during `npx tsx`/ephemeral installs: `Unknown env config "npm-globalconfig"`, etc. Cosmetic only.
- Analytics setup was deferred (missing `GA_ACCOUNT_ID`, `SITE_URL`, `GSC_SERVICE_ACCOUNT_JSON` in Doppler). Documented and expected.

---

## 2. Did Drizzle migration and `nitro-cloudflare-dev` work out of the box?

**Mostly yes.**

- **Drizzle:** The app already had `server/database/schema.ts` re-exporting the layer schema and a single migration `drizzle/0000_initial_schema.sql`. We added app-specific tables (decks, cards, reviews) and a second migration `0001_flashcard_tables.sql`. Running `pnpm run db:migrate` (which we updated to run both SQL files) succeeded against the local D1 database. So Drizzle + local D1 migration **works** once migrations are defined.
- **nitro-cloudflare-dev:** Already present in `apps/web`: dependency in `package.json` and `nuxt.config.ts` with `cloudflareDev.configPath` pointing at `wrangler.json`. No change needed; **works out of the box** for local dev with D1.

**Friction:** The app’s `db:migrate` script originally ran only `0000_initial_schema.sql`. Adding a second migration required manually editing the script. A pattern like “run all `drizzle/*.sql` in order” or a small script could reduce this.

---

## 3. Did Nuxt layer inheritance work seamlessly?

**Mostly.** The app extends `@narduk-enterprises/narduk-nuxt-template-layer` and correctly gets:

- Nuxt UI 4, Nitro cloudflare-module, Drizzle, SEO composables, CSRF, security headers, base CSS, etc.
- No need to duplicate layer components or server utils.

**Friction:**

- **TypeScript / server imports:** The app’s `pnpm run typecheck` (via `nuxt typecheck`) could not resolve server-side imports for `drizzle-orm`, `zod`, or `server/database/schema` until we added **explicit dependencies** in `apps/web/package.json` (`drizzle-orm`, `zod`). The layer provides these at runtime, but the app’s TypeScript context (and/or Nitro’s server tsconfig) does not see the layer’s `node_modules` for those packages. Adding them to the app fixed typecheck. So layer inheritance is fine at runtime; **typecheck requires the app to declare server deps it uses** (or the template could document this).
- **Path aliases:** Using `~/app/types/flashcard` in app code caused “Cannot find module” during typecheck. Switching to relative imports (`../types/flashcard`, `../../types/flashcard`) fixed it. So `~/app/...` (or the way types are generated in `.nuxt`) may not align with the app’s type roots; relative paths were more reliable.

---

## 4. Any pre-existing TypeScript errors from `pnpm typecheck`?

**Yes.** Running `pnpm run typecheck` at the repo root (Turbo across all packages) **fails** due to the **layer**, not the app:

- **Layer build error:**  
  `Error: ENOENT: no such file or directory, open '.../layers/narduk-nuxt-layer/node_modules/.cache/nuxt/.nuxt/dist/client/manifest.json'`  
  So the layer’s `nuxt build` fails after the client build, when something expects that manifest path. This looks like a cache/path assumption issue in the layer build (or in how Turbo runs the layer build in the monorepo).

- **App-only typecheck:** Running `pnpm run typecheck` inside `apps/web` **passes** after:
  - Adding `drizzle-orm` and `zod` to the web app.
  - Fixing server schema import paths (e.g. `../../database/schema` from `server/api/decks/`).
  - Fixing app type imports (relative paths to `app/types/flashcard`).
  - Using Nuxt UI 4 token colors (`error`, `warning`, `success` instead of `red`, `amber`, `green`).

So there are **pre-existing template/tooling issues**: root `pnpm typecheck` fails on the layer build; the app itself is clean once the above adjustments are made.

---

## 5. Did documentation accurately guide you?

**Yes for AGENTS.md.** It correctly describes:

- Monorepo layout, where app code lives (`apps/web/`), and what the layer provides.
- Cloudflare constraints (no Node modules, Web Crypto, Drizzle only).
- Nuxt UI 4 rules (USeparator, `i-` icons, design tokens).
- SEO requirement (useSeo + useSchemaOrg on every page).
- Data fetching (useAsyncData/useFetch, not raw `$fetch` in setup for display data).
- Local D1 requirement (nitro-cloudflare-dev + wrangler.json).

**Gaps:**

- **BUILD_TEST_APP.md:** Referenced in the task but **does not exist** under `tools/`. So that part of the “read if they exist” instruction was a no-op.
- **Server types:** No explicit note that apps that use Drizzle/Zod on the server should add those dependencies to the app’s `package.json` for typecheck. Documenting this would reduce friction.

---

## 6. Any HMR port collisions, Tailwind issues, or Doppler errors?

- **HMR / Tailwind:** Not observed. We did not run a long dev session; no port or Tailwind issues were encountered.
- **Doppler:** No errors. Setup created the project and synced hub credentials. We did not run `doppler run -- pnpm run dev`; analytics-related Doppler secrets were missing and deferred as documented.

---

## Summary

| Area                    | Result | Notes |
|-------------------------|--------|--------|
| `pnpm setup`             | OK     | Completed successfully, non-interactive. |
| Drizzle + migrations     | OK     | Works; second migration required script change. |
| nitro-cloudflare-dev     | OK     | Already configured and working. |
| Layer inheritance        | Partial| Runtime fine; typecheck needs app-level drizzle/zod and relative type paths. |
| Root `pnpm typecheck`    | Fails  | Layer build ENOENT on manifest path. |
| App-only typecheck       | OK     | Passes after dep and path fixes. |
| Documentation            | Good   | AGENTS.md accurate; BUILD_TEST_APP.md missing; server deps for types not documented. |
| HMR / Tailwind / Doppler | OK     | No issues observed. |

**Recommendations for the template:**

1. Fix the layer build so `pnpm run typecheck` (and `pnpm run build`) succeed from the root when the layer is built (manifest path / cache).
2. Document that apps using Drizzle/Zod on the server should add those dependencies to the app’s `package.json` for TypeScript.
3. Either add `tools/BUILD_TEST_APP.md` or remove the reference to it.
4. Consider a migration runner that runs all `drizzle/*.sql` in order so adding migrations doesn’t require editing the npm script.

---

*This report reflects the experience of building FlashCardPro and running setup/typecheck/migrations once. Longer-term issues (e.g. HMR under heavy use) may not be visible.*
