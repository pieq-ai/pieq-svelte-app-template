# Harden `pieq-svelte-app-template` based on initial review

## Summary

Fixes correctness, security, and best-practice issues uncovered during a full review of the template. Focus is the demo path (`/employees`) and the foundations (Prisma typing, runtime config injection, auth token handling) that every downstream Pieq app will copy from this template.

No new features. No public API surface changes beyond removing client-side token persistence.

---

## Motivation

This repo is meant to be the "golden" starter for Pieq Svelte apps. A clean clone currently fails `yarn check` (Prisma typing), the headline demo (`/employees`) teaches a SvelteKit anti-pattern, and OIDC tokens are mirrored from the encrypted session cookie into `localStorage` — making XSS materially more dangerous than it needs to be. We want the template to be copy-pasteable as-is.

---

## Scope

### High-priority fixes (in this PR)

| # | Area | Change |
|---|---|---|
| **H1** | Prisma typing | Align Prisma client output path with `$lib/generated/prisma/...` and update `src/app.d.ts` so `globalThis.__db` types resolve. `yarn check` passes on a fresh clone after `yarn db:generate`. |
| **H2** | Service layer | Decision: **keep the layer, add a real example.** Add `$lib/server/services/employee.service.ts` with input validation + orchestration; route handlers and form actions call the service, not the DAO directly. |
| **H3** | Tests | Add `tests/unit/employee.service.test.ts` with a mocked DAO so the README's "service layer with mocked DAOs" claim is true. |
| **H4** | `/employees` demo | Replace `onMount + fetch` with `+page.server.ts` `load` (calls service directly) + form actions for create. Keep `/api/employees` as the external REST surface, refactored to also delegate to the service. |
| **H5** | Runtime config | Stop writing `window.__PIEQ_CONFIG__` from a client `$effect`. Inject it inline via a `<script>` tag rendered server-side in `app.html`, so synchronous reads on first render are safe. Removes the hydration race condition. |
| **H6** | DAO error handling | Stop swallowing errors in `employee.dao.list()`. Errors propagate to the service / route layer like `create()` already does. |
| **H7** | Token storage | Remove `localStorage` persistence of OIDC tokens. Add a BFF route (`/api/proxy/[...path]`) that forwards calls to `API_BASE_URL` using the access token from the server-side Auth.js session. Access tokens never reach the browser. |
| **H8** | Env docs | Move `API_BASE_URL` from "Optional / integration" to "Required" in the README env table (it is `requireEnv`'d in `config.js`). |

### Out of scope (tracked as follow-ups)

- M2 — Migrate `*.js` (auth, config, hooks) to TypeScript
- M3 — Add `+error.svelte`
- M6 — Re-theme shadcn palette to Pieq orange
- M7 — Prisma seed script
- L6 — `docker-compose.yml` for local Postgres
- L7 — GitHub Actions CI workflow

These are listed in the README under a new **Roadmap** section so contributors can pick them up.

---

## Changes

### `src/lib/server/db.ts` + `prisma/schema.prisma` + `src/app.d.ts`
- Prisma `output` moved to `src/lib/generated/prisma` so `$lib/generated/...` is a real path.
- `app.d.ts` declares `globalThis.__db` against the correct import.

### `src/lib/server/services/employee.service.ts` *(new)*
- `listEmployees()` — returns DAO result, lets errors bubble.
- `createEmployee(input)` — validates `name` (non-empty string, trimmed, ≤ 100 chars) and `age` (integer 1–120), then calls `employeeDao.create`. Throws typed errors that the controller translates to `400`.

### `src/lib/server/dao/employee.dao.ts`
- Remove `try/catch` in `list()`. DAO is now a thin Prisma wrapper.

### `src/routes/employees/+page.server.ts` *(new)* + `+page.svelte`
- `load` calls `employeeService.listEmployees()`.
- `actions.create` consumes a form submission, calls `employeeService.createEmployee`, returns `fail(400, …)` on validation errors.
- Component uses `data.employees` and `enhance`-progressive form submission. Works without JS.
- Removed `onMount + fetch`.

### `src/routes/api/employees/+server.ts`
- Refactored to call `employeeService.*`. Same JSON shape, same status codes.

### `src/routes/api/proxy/[...path]/+server.ts` *(new)*
- Server-side proxy to the external Pieq API. Reads `access_token` from `event.locals.auth()`, attaches `Authorization: Bearer …`, forwards `GET/POST/PUT/DELETE`.

### `src/lib/auth/token-storage.ts` + `src/lib/auth/index.ts`
- File deleted; all imports replaced with the proxy client (`$lib/api/client` now hits `/api/proxy/...` and no longer needs a bearer token).

### `src/app.html` + `src/routes/+layout.server.ts` + `+layout.svelte`
- `+layout.server.ts` exposes a serialized `__PIEQ_CONFIG__` snippet.
- `app.html` renders it inline before SvelteKit body, so `window.__PIEQ_CONFIG__` is populated before any client script runs.
- `+layout.svelte` loses both `$effect` blocks.

### `README.md`
- `API_BASE_URL` moved to Required.
- Architecture diagram updated to show the service layer in action.
- New "Roadmap" section listing M/L follow-ups.

### `tests/unit/employee.service.test.ts` *(new)*
- Covers happy path, name validation, age validation, DAO-error propagation. Uses `vi.mock` against the DAO.

---

## Test plan

- [ ] `rm -rf node_modules .svelte-kit src/lib/generated && yarn install && yarn db:generate && yarn check` passes (proves H1).
- [ ] `yarn lint` clean.
- [ ] `yarn test:unit -- --run` — new service tests pass; existing `config` + `constants` tests still pass.
- [ ] `yarn dev` → `/employees` loads SSR'd table (view-source shows rows); add employee via form **with JS disabled** → row appears after redirect (proves form actions).
- [ ] `/employees` with JS enabled → `use:enhance` adds row without full reload.
- [ ] `curl -X POST http://localhost:5173/api/employees -H 'Content-Type: application/json' -d '{"name":"","age":30}'` returns `400` with the new validation message.
- [ ] After signing in via Keycloak, inspect `localStorage` — **no** `oidc.user:*` entry exists.
- [ ] `curl http://localhost:5173/api/proxy/healthz` (signed-in cookie attached) returns the external API response; signed-out returns `401`.
- [ ] `yarn build && yarn preview` → `yarn test:e2e` green (dashboard redirect test still passes).
- [ ] Hard reload `/` with throttled CPU → no flash of "Authentication configuration is missing" on `/auth/signin` (proves H5 — config available synchronously).

---

## Risk & rollback

- **Risk:** Anything that imported from `$lib/auth/token-storage` directly (outside this repo) will break. Within the template only `$lib/auth/index.ts` re-exported it; safe.
- **Risk:** Existing Pieq apps cloned from this template still ship the `localStorage` token mirror. They should adopt the proxy pattern in a follow-up — call it out in the team channel.
- **Rollback:** Single revert. The Prisma output path move is the only step that requires re-running `yarn db:generate` after revert.

---

## Reviewer notes

- Pay extra attention to **H5** (config injection) — the `app.html` template change is small but easy to break by inserting before `%sveltekit.head%`.
- The proxy route in **H7** intentionally rejects (401) when there is no session. If we later need anonymous external API calls, we'll add an allowlist.
- The service layer is JS-free / TS-only by design (kicks off the M2 migration informally).
