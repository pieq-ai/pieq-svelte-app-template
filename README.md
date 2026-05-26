# pieq-svelte-app-template

Production-ready SvelteKit boilerplate for Pieq apps: layered server architecture, PostgreSQL with Prisma 7, REST API routes, and Keycloak authentication via Auth.js.

Use this template to build full-stack features quickly while keeping a clear separation between UI, HTTP handlers, business logic, and database access.

---

## What you get

| Area | Technology |
| --- | --- |
| Framework | [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | PostgreSQL + [Prisma 7](https://www.prisma.io/) |
| Auth | [Auth.js](https://authjs.dev/) + Keycloak OIDC |
| Deployment | `@sveltejs/adapter-node` (Node.js) |

**Working example included:** the `/employees` page and `/api/employees` endpoint demonstrate the full stack — UI → API route → DAO → PostgreSQL — without requiring sign-in.

---

## Prerequisites

Install these before you start:

1. **Node.js 20+**
2. **PostgreSQL** running locally (or a remote instance you can connect to)
3. **Keycloak** (only required for sign-in / dashboard — optional for the employees demo)

---

## Quick start

Follow these steps in order.

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd pieq-svelte-app-template
yarn install
# or: npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`. At minimum, set **`DATABASE_URL`** to your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
```

For auth features (dashboard, sign-in), also set:

```env
AUTH_SECRET="<run: openssl rand -base64 32>"
OIDC_CLIENT_SECRET="<from Keycloak admin>"
```

All variables are explained in [Environment variables](#environment-variables).

### 3. Set up the database

Make sure PostgreSQL is running, then:

```bash
yarn db:generate   # generate Prisma client → src/generated/prisma
yarn db:migrate    # apply migrations (creates employees table)
```

Expected output: `Database schema is up to date!`

**Optional:** open a visual DB browser:

```bash
yarn db:studio
```

### 4. Start the dev server

```bash
yarn dev
```

Open the URL shown in the terminal (default: **http://localhost:5173**).

The dev port is derived from `APP_URL` in `.env`. If port 5173 is busy, Vite picks the next free port — use the URL printed in the terminal.

### 5. Verify everything works

| Check | How |
| --- | --- |
| Employees UI | Visit **http://localhost:5173/employees** — list loads, you can add records |
| Employees API | `curl http://localhost:5173/api/employees` |
| Create via API | `curl -X POST http://localhost:5173/api/employees -H "Content-Type: application/json" -d '{"name":"Jane Doe","age":32}'` |
| Auth (optional) | Visit `/auth/signin` after Keycloak is configured |

---

## How the setup works

### High-level request flow

```
Browser (+page.svelte)
    │  fetch('/api/employees')
    ▼
API route (+server.ts)          ← HTTP layer: parse body, status codes, JSON shape
    │  employeeDao.list()
    ▼
DAO ($lib/server/dao)           ← database queries only
    │  db.employee.findMany()
    ▼
Prisma client (src/lib/server/db.ts)
    │  @prisma/adapter-pg + pg driver
    ▼
PostgreSQL
```

For authenticated pages (e.g. `/dashboard`), SvelteKit **load functions** in `+page.server.ts` run on the server instead of client `fetch`, and `hooks.server.js` attaches the session before the route handler runs.

### Layered architecture

```
View          +page.svelte, $lib/components
              Renders UI; calls API routes or receives data from load functions

Controller    +page.server.ts, +server.ts
              HTTP concerns: request/response, validation, status codes

Service       $lib/server/services/*.service.ts
              Business rules, orchestration (used by auth/user flows)

DAO           $lib/server/dao/*.dao.ts
              Prisma queries only — no HTTP, no UI logic

Database      PostgreSQL via Prisma
```

**Server/client boundary:** never import `$lib/server/*` from client components. SvelteKit blocks this at build time. Client code talks to the server via `fetch`, form actions, or load data — not direct DB imports.

### Employees example (end to end)

This is the simplest path to understand the template:

| File | Role |
| --- | --- |
| [`src/routes/employees/+page.svelte`](src/routes/employees/+page.svelte) | UI: loads list on mount, POSTs new employees |
| [`src/routes/api/employees/+server.ts`](src/routes/api/employees/+server.ts) | REST handler: `GET` list, `POST` create |
| [`src/lib/server/dao/employee.dao.ts`](src/lib/server/dao/employee.dao.ts) | `list()` and `create()` Prisma calls |
| [`src/lib/server/db.ts`](src/lib/server/db.ts) | Singleton Prisma client |
| [`prisma/schema.prisma`](prisma/schema.prisma) | `Employee` model → `employees` table |

**Data flow on page load:**

1. `onMount` in `+page.svelte` calls `GET /api/employees`
2. `+server.ts` calls `employeeDao.list()`
3. DAO runs `db.employee.findMany()`
4. Response: `{ "data": [ { "id", "uuid", "name", "age" }, ... ] }`
5. UI binds the array to the table

**Data flow on form submit:**

1. Form POSTs JSON `{ "name", "age" }` to `/api/employees`
2. API validates input, calls `employeeDao.create()`
3. Response: `{ "data": { "id", "uuid", "name", "age" } }` with status `201`
4. UI prepends the new row without a full page reload

### Database and Prisma

**Schema** lives in [`prisma/schema.prisma`](prisma/schema.prisma):

- `Employee` — demo HRMS entity (`employees` table)

Auth user profile comes from the Keycloak session (see `$lib/types/user.ts`), not a local database table.

**Connection URL** is read from `DATABASE_URL` in [`.env`](.env), wired through [`prisma.config.ts`](prisma.config.ts) (Prisma 7 style — not in `schema.prisma`).

**Generated client** output: `src/generated/prisma/`. Regenerate after every schema change:

```bash
yarn db:generate
```

**Migrations** live in `prisma/migrations/`. Create new ones with:

```bash
yarn db:migrate
```

**Dev server note:** [`src/lib/server/db.ts`](src/lib/server/db.ts) caches the Prisma client in memory during development. After changing the schema and running `db:generate`, **restart `yarn dev`** so the client picks up new models (e.g. adding a new table).

### Authentication (Keycloak + Auth.js)

Auth is optional for local development of `/employees`, but required for `/dashboard`.

```
User → /auth/signin → Keycloak login
     → callback /auth/callback/keycloak
     → Auth.js session cookie
     → hooks.server.js sets event.locals.user from the Auth.js session
     → event.locals.user available in server load/actions
```

[`hooks.server.js`](src/hooks.server.js) also guards `/dashboard/*` — unauthenticated users are redirected to `/`.

Keycloak redirect URI for each environment:

```
{APP_URL}/auth/callback/keycloak
```

Example for local dev: `http://localhost:5173/auth/callback/keycloak`

### Runtime config (`window.__PIEQ_CONFIG__`)

Public config (no secrets) is loaded server-side in the root layout and exposed to the browser:

- **Server:** [`src/lib/server/config.js`](src/lib/server/config.js) reads `.env`
- **Client:** [`src/lib/config/index.ts`](src/lib/config/index.ts) reads `window.__PIEQ_CONFIG__`
- **External API calls:** [`src/lib/api/client.ts`](src/lib/api/client.ts) uses `API_BASE_URL` from that config

---

## API reference — Employees

Base path: `/api/employees`

### GET — list employees

**Response `200`:**

```json
{
  "data": [
    {
      "id": 1,
      "uuid": "4f2ef1d9-dae1-44e8-a80c-d84235c61a19",
      "name": "Jane Doe",
      "age": 32
    }
  ]
}
```

### POST — create employee

**Request body:**

```json
{
  "name": "Jane Doe",
  "age": 32
}
```

**Response `201`:**

```json
{
  "data": {
    "id": 2,
    "uuid": "af1dbc38-820b-4c1d-be94-06bc7944abcc",
    "name": "Jane Doe",
    "age": 32
  }
}
```

**Error responses** (`400` / `500`):

```json
{
  "error": "Name is required and must be a string"
}
```

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env`.

### Required for database features

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/postgres` |

### Required for authentication

| Variable | Purpose | Example |
| --- | --- | --- |
| `APP_URL` | Public app origin (redirects, dev port) | `http://localhost:5173` |
| `AUTH_SECRET` | Auth.js session encryption | `openssl rand -base64 32` |
| `OIDC_URL` | Keycloak base URL | `https://preprod.auth.pieq.ai/` |
| `OIDC_REALM` | Keycloak realm | `pieq-sso` |
| `OIDC_CLIENT_ID` | OIDC client ID | `pieq-app` |
| `OIDC_CLIENT_SECRET` | Keycloak client secret (server only) | from Keycloak admin |
| `AUTH_TRUST_HOST` | Trust proxy host in dev/deploy | `true` |

### Optional / integration

| Variable | Purpose | Default |
| --- | --- | --- |
| `API_BASE_URL` | External Pieq API base URL | `https://preprod.api.pieq.ai/` |

### `APP_URL` per environment

| Environment | `APP_URL` |
| --- | --- |
| Local dev | `http://localhost:5173` |

Keycloak issuer is derived automatically:

```
${OIDC_URL}realms/${OIDC_REALM}
→ https://preprod.auth.pieq.ai/realms/pieq-sso
```

---

## Keycloak client setup

Configure the `pieq-app` client in the `pieq-sso` realm:

1. Enable **Client authentication** (confidential client).
2. Add valid redirect URI: `{APP_URL}/auth/callback/keycloak`
3. Set post-logout redirect URIs as needed.
4. Copy the client secret into `OIDC_CLIENT_SECRET` in `.env` — never commit secrets.

---

## Project structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.js                 # Keycloak OIDC (Auth.js)
│   │   ├── config.js               # Env → server config
│   │   ├── db.ts                   # Prisma singleton
│   │   ├── dao/
│   │   │   └── employee.dao.ts
│   ├── config/                     # Client runtime config reader
│   ├── auth/                       # Client OIDC helpers
│   ├── api/client.ts               # External Pieq API client
│   ├── components/                 # Shared UI (Button, Card, Input)
│   └── types/
├── generated/prisma/               # Generated Prisma client (do not edit)
├── routes/
│   ├── employees/+page.svelte      # Employees UI (client fetch → API)
│   ├── api/employees/+server.ts    # Employees REST API
│   ├── dashboard/                  # Protected example route
│   └── auth/signin/                # Custom sign-in page
├── hooks.server.js                 # Auth, locals, route guard
├── hooks.client.js                 # Client error logging
└── instrumentation.server.js       # DB startup check

prisma/
├── schema.prisma                   # Data models
├── migrations/                     # Versioned SQL migrations
└── (config in prisma.config.ts)    # DATABASE_URL wiring
```

---

## Adding a new feature

Use the employees module as a template:

1. **Schema** — add a model in `prisma/schema.prisma`, then `yarn db:migrate` and `yarn db:generate`
2. **DAO** — add queries in `$lib/server/dao/<entity>.dao.ts`
3. **Service** (optional) — add business logic in `$lib/server/services/<entity>.service.ts`
4. **API** — add `$lib/server`-backed route in `src/routes/api/<entity>/+server.ts`
5. **UI** — add `+page.svelte` (and optionally `+page.server.ts` for SSR load)
6. **Restart dev server** after Prisma schema changes

For external Pieq API calls from the browser, use `$lib/api/client` after the layout has set `window.__PIEQ_CONFIG__`.

---

## Scripts

All commands can be run with `yarn <script>` or `npm run <script>`.

### Development

#### `yarn dev`

Starts the Vite development server with hot module replacement (HMR).

- Reads `APP_URL` from `.env` to set the dev port (default: **5173**)
- Serves the app at `http://localhost:5173` (or the next free port if busy)
- Watches files and reloads the browser on changes
- **When to use:** daily local development

#### `yarn build`

Creates an optimized production build of the app.

- Runs SvelteKit's build pipeline via Vite
- Outputs a Node.js server bundle (via `@sveltejs/adapter-node`) to `build/`
- Type-checks and bundles client + server code
- **When to use:** before deploying or running `yarn preview`

#### `yarn preview`

Serves the production build locally to test it before deployment.

- Must run `yarn build` first
- Starts the built app (not the dev server) so you can verify production behavior
- **When to use:** smoke-test the build output on your machine

---

### Code quality

#### `yarn check`

Runs TypeScript and Svelte type checking without emitting files.

- Executes `svelte-kit sync` (generates SvelteKit types) then `svelte-check`
- Catches type errors in `.svelte`, `.ts`, and server load files
- **When to use:** before committing or opening a PR

#### `yarn check:watch`

Same as `yarn check`, but re-runs automatically when files change.

- **When to use:** while developing to catch type errors in the background

#### `yarn lint`

Runs ESLint across the project.

- Checks JavaScript, TypeScript, and Svelte files for style and common issues
- **When to use:** before committing; fix reported issues with your editor or manually

---

### Testing

#### `yarn test:unit`

Runs unit tests with Vitest.

- Includes tests in `src/**/*.{test,spec}.{js,ts}` and `tests/unit/`
- Runs in watch mode by default (re-runs on file changes)
- Add `-- --run` to execute once and exit: `yarn test:unit -- --run`

#### `yarn test:e2e`

Runs end-to-end tests with Playwright.

- Installs Playwright browsers if missing, then runs tests in `tests/e2e/`
- Opens a real browser (headless by default) against the app
- **When to use:** verify full user flows (e.g. dashboard redirect)

#### `yarn test`

Runs the full test suite once: unit tests then e2e tests.

- Equivalent to `yarn test:unit -- --run` followed by `yarn test:e2e`
- **When to use:** CI or a full local test pass before release

---

### Database (Prisma)

These commands read `DATABASE_URL` from `.env` via [`prisma.config.ts`](prisma.config.ts).

#### `yarn db:generate`

Generates the Prisma Client from `prisma/schema.prisma`.

- Runs `prisma generate`
- Writes TypeScript client code to `src/generated/prisma/`
- Updates types and query methods for your models (e.g. `db.employee`)
- **Does not** change the database — only regenerates code
- **When to use:**
  - After cloning the repo (first setup)
  - After editing `prisma/schema.prisma`
  - After pulling migration changes from git
- **After running:** restart `yarn dev` so the server loads the new client

#### `yarn db:migrate`

Applies database migrations in development and creates new migration files when the schema changed.

- Runs `prisma migrate dev`
- Compares `prisma/schema.prisma` to the database
- If the schema changed: prompts for a migration name, creates SQL in `prisma/migrations/`, applies it
- If already in sync: prints `Database schema is up to date!`
- **When to use:**
  - First setup (creates `employees` table)
  - After adding or changing models in the schema
- **Requires:** PostgreSQL running and a valid `DATABASE_URL`

#### `yarn db:push`

Pushes the schema directly to the database without creating a migration file.

- Runs `prisma db push`
- Updates tables to match `schema.prisma` immediately
- **When to use:** quick local prototyping when you don't need versioned migrations
- **Prefer `db:migrate`** for team projects and production so schema changes are tracked in git

#### `yarn db:studio`

Opens **Prisma Studio** — a visual database browser in your browser.

- Runs `prisma studio`
- View, edit, add, and delete rows in `employees`, etc.
- **When to use:** inspect data, debug API issues, manually seed records
- **Requires:** PostgreSQL running and a valid `DATABASE_URL`

---

### Other

#### `yarn prepare`

Runs automatically after `yarn install` (npm lifecycle hook).

- Executes `svelte-kit sync` to generate SvelteKit framework types (`.svelte-kit/`)
- **When to use:** you usually don't run this manually — it runs on install

---

### Quick reference

| Script | What it does | Typical use |
| --- | --- | --- |
| `yarn dev` | Start dev server with HMR | Local development |
| `yarn build` | Production build → `build/` | Deploy prep |
| `yarn preview` | Serve production build locally | Pre-deploy check |
| `yarn check` | Type-check Svelte + TS | Before commit |
| `yarn check:watch` | Type-check in watch mode | While coding |
| `yarn lint` | ESLint | Before commit |
| `yarn test:unit` | Vitest unit tests | Test logic |
| `yarn test:e2e` | Playwright browser tests | Test flows |
| `yarn test` | Unit + e2e (once) | Full test run |
| `yarn db:generate` | Regenerate Prisma client code | After schema change |
| `yarn db:migrate` | Apply/create SQL migrations | Setup & schema changes |
| `yarn db:push` | Sync schema to DB (no migration file) | Quick local experiments |
| `yarn db:studio` | Visual DB editor | Inspect/edit data |

### Common workflows

**First-time setup:**

```bash
yarn install
cp .env.example .env   # set DATABASE_URL
yarn db:generate
yarn db:migrate
yarn dev
```

**After changing `prisma/schema.prisma`:**

```bash
yarn db:migrate        # create + apply migration
yarn db:generate       # migrate dev usually runs generate; safe to run again
yarn dev               # restart dev server
```

**Before opening a PR:**

```bash
yarn check
yarn lint
yarn test:unit -- --run
```

---

## Troubleshooting

### `Cannot read properties of undefined (reading 'create')` or `'findMany'`

The dev server is using a **stale Prisma client** from before a schema change.

**Fix:**

```bash
yarn db:generate
# stop and restart yarn dev
```

### Empty employee list / database errors

1. Confirm PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Run `yarn db:migrate` and confirm `Database schema is up to date!`
4. Inspect data with `yarn db:studio`

### Port mismatch / auth redirect fails

`APP_URL` must match the URL you open in the browser (including port). If Vite uses a different port because 5173 is busy, either free that port or update `APP_URL` to match.

### Keycloak redirect error

Ensure Keycloak **Valid redirect URIs** includes exactly:

```
http://localhost:5173/auth/callback/keycloak
```

(use your actual `APP_URL` + `/auth/callback/keycloak`)

---

## Deployment

This template uses `@sveltejs/adapter-node` for Node.js deployments with PostgreSQL.

Before deploying:

1. Set production `.env` (`APP_URL`, `DATABASE_URL`, `OIDC_*`, `AUTH_SECRET`)
2. Run `yarn build`
3. Run migrations against the production database
4. Start with the Node adapter output

For Vercel, Netlify, or Cloudflare, swap the adapter in `svelte.config.js` and verify database connectivity for that platform.

---

## Testing

- **Unit:** `tests/unit/` — config, service layer with mocked DAOs
- **E2E:** `tests/e2e/` — unauthenticated dashboard redirect

Authenticated e2e flows require Keycloak in CI (test realm + secrets).

---

## Service worker

A service worker lives at `src/service-worker.js`. Registration is disabled by default in `svelte.config.js`. Set `kit.serviceWorker.register` to `true` to enable PWA caching.
