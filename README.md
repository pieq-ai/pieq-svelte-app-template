# pieq-svelte-app-template

Production-ready SvelteKit boilerplate for Pieq apps: layered server architecture, PostgreSQL with Prisma 7, REST API routes, and Keycloak authentication via Auth.js.

Use this template to build full-stack features quickly while keeping a clear separation between UI, HTTP handlers, business logic, and database access.

---

## What you get

| Area | Technology |
| --- | --- |
| Framework | [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn-svelte](https://www.shadcn-svelte.com/) |
| Database | PostgreSQL + [Prisma 7](https://www.prisma.io/) |
| Auth | [Auth.js](https://authjs.dev/) + Keycloak OIDC |
| Deployment | `@sveltejs/adapter-node` (Node.js) |

**Working example included:** the `/employees` page (SSR load + form action) and `/api/employees` endpoint demonstrate the full stack — UI → Controller → Service → DAO → PostgreSQL — without requiring sign-in. The page works with JavaScript disabled.

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

The template demonstrates two complementary patterns. **Prefer pattern A** for in-app pages; reserve pattern B for external/REST clients.

**A. Server-rendered page with form actions (`/employees`):**

```
Browser (+page.svelte)
    │  receives SSR'd data on first paint; form posts to ?/create
    ▼
+page.server.ts                 ← Controller: load() + actions
    │  employeeService.listEmployees() / createEmployee(input)
    ▼
Service ($lib/server/services)  ← Validation, orchestration, typed errors
    │  employeeDao.list() / create(data)
    ▼
DAO ($lib/server/dao)           ← Prisma queries only
    │  db.employee.findMany() / create()
    ▼
Prisma client (src/lib/server/db.ts)
    │  @prisma/adapter-pg + pg driver
    ▼
PostgreSQL
```

**B. REST endpoint for external clients (`/api/employees`):**

```
External client (curl, browser fetch)
    │  GET/POST /api/employees (JSON)
    ▼
+server.ts                      ← HTTP layer: JSON parse, status codes
    │  employeeService.list() / create()
    ▼
Service → DAO → Prisma → PostgreSQL  (same path as above)
```

For authenticated pages (e.g. `/dashboard`), `hooks.server.js` attaches the Auth.js session to `event.locals` before the route handler runs, and `+page.server.ts` `load` enforces access.

### Layered architecture

```
View          +page.svelte, $lib/components
              Renders UI; receives data from load functions; submits via form actions

Controller    +page.server.ts (load + actions), +server.ts (REST)
              HTTP / form-data concerns: parse, status codes, redirects, fail()

Service       $lib/server/services/*.service.ts
              Input validation, business rules, orchestration.
              Throws typed errors (e.g. EmployeeValidationError) that controllers
              translate to 400 / fail(400).

DAO           $lib/server/dao/*.dao.ts
              Prisma queries only — no HTTP, no validation, no UI logic.
              Errors propagate to the service layer.

Database      PostgreSQL via Prisma
```

**Server/client boundary:** never import `$lib/server/*` from client components. SvelteKit blocks this at build time. Client code talks to the server via `fetch`, form actions, or load data — not direct DB imports.

### Employees example (end to end)

This is the simplest path to understand the template:

| File | Role |
| --- | --- |
| [`src/routes/employees/+page.svelte`](src/routes/employees/+page.svelte) | UI: reads SSR'd `data.employees`, submits create via `<form action="?/create" use:enhance>` |
| [`src/routes/employees/+page.server.ts`](src/routes/employees/+page.server.ts) | Controller (page): `load()` + `actions.create` |
| [`src/routes/api/employees/+server.ts`](src/routes/api/employees/+server.ts) | Controller (REST): `GET` list, `POST` create |
| [`src/lib/server/services/employee.service.ts`](src/lib/server/services/employee.service.ts) | Service: validation + `listEmployees()` / `createEmployee()` |
| [`src/lib/server/dao/employee.dao.ts`](src/lib/server/dao/employee.dao.ts) | DAO: thin Prisma wrapper |
| [`src/lib/server/db.ts`](src/lib/server/db.ts) | Singleton Prisma client |
| [`prisma/schema.prisma`](prisma/schema.prisma) | `Employee` model → `employees` table |

**Data flow on page load (SSR):**

1. SvelteKit calls `load()` in `+page.server.ts`
2. `load()` calls `employeeService.listEmployees()` → `employeeDao.list()` → Prisma
3. HTML is rendered server-side with the table populated; first paint shows the data
4. `+page.svelte` consumes `data.employees`

**Data flow on form submit (works without JS):**

1. Form posts `multipart/form-data` to `?/create`
2. `actions.create` reads `FormData`, calls `employeeService.createEmployee({ name, age })`
3. Service validates input. On failure → `fail(400, { error, field, name, age })`
4. On success → returns `{ created: {...} }`; `use:enhance` optimistically prepends the row and calls `update({ reset: true })`
5. Without JS: SvelteKit re-runs `load()` and re-renders the page server-side — the new row appears after a normal navigation

**External REST clients** (curl, third-party apps) still use `/api/employees` for `GET` / `POST`. Both controllers delegate to the same service, so validation and shape are identical.

### Database and Prisma

**Schema** lives in [`prisma/schema.prisma`](prisma/schema.prisma):

- `Employee` — demo HRMS entity (`employees` table)

Auth user profile comes from the Keycloak session (see `$lib/types/user.ts`), not a local database table.

**Connection URL** is read from `DATABASE_URL` in [`.env`](.env), wired through [`prisma.config.ts`](prisma.config.ts) (Prisma 7 style — not in `schema.prisma`).

**Generated client** output: `src/lib/generated/prisma/` (so `$lib/generated/...` resolves). Regenerate after every schema change:

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
      "cuid": "ckv8l4m6p0000qzrmn831i7rn",
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
    "cuid": "ckv8l4m6p0001qzrmxggqsx7k",
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

### Required (read by `getAppConfig()` on every server load)

| Variable | Purpose | Example |
| --- | --- | --- |
| `APP_URL` | Public app origin (redirects, dev port) | `http://localhost:5173` |
| `API_BASE_URL` | External Pieq API base URL | `https://preprod.api.pieq.ai/` |
| `OIDC_URL` | Keycloak base URL | `https://preprod.auth.pieq.ai/` |
| `OIDC_REALM` | Keycloak realm | `pieq-sso` |
| `OIDC_CLIENT_ID` | OIDC client ID | `pieq-app` |

### Required for database features

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/postgres` |

### Required for authentication (Keycloak sign-in)

| Variable | Purpose | Example |
| --- | --- | --- |
| `APP_URL` | Public app origin (redirects, dev port) | `http://localhost:5173` |
| `AUTH_SECRET` | Auth.js session encryption | `openssl rand -base64 32` |
| `OIDC_URL` | Keycloak base URL | `https://preprod.auth.pieq.ai/` |
| `OIDC_REALM` | Keycloak realm | `pieq-sso` |
| `OIDC_CLIENT_ID` | OIDC client ID | `pieq-app` |
| `OIDC_CLIENT_SECRET` | Keycloak client secret (server only) | from Keycloak admin |
| `AUTH_TRUST_HOST` | Trust proxy host in dev/deploy | `true` |

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
│   │   │   └── employee.dao.ts     # Thin Prisma wrapper
│   │   └── services/
│   │       └── employee.service.ts # Validation + orchestration
│   ├── generated/prisma/           # Generated Prisma client (do not edit)
│   ├── config/                     # Client runtime config reader
│   ├── auth/                       # Client OIDC helpers
│   ├── api/client.ts               # External Pieq API client
│   ├── utils.ts                    # cn() helper for shadcn components
│   ├── components/
│   │   ├── index.ts                # Re-exports shadcn UI components
│   │   └── ui/                     # shadcn-svelte components (button, input, card, …)
│   └── types/
├── routes/
│   ├── employees/
│   │   ├── +page.svelte            # SSR table + use:enhance create form
│   │   └── +page.server.ts         # load() + actions.create
│   ├── api/employees/+server.ts    # Employees REST API (delegates to service)
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

Use the employees module as a template — follow every step:

1. **Schema** — add a model in `prisma/schema.prisma`, then `yarn db:migrate` and `yarn db:generate`
2. **DAO** — add queries in `$lib/server/dao/<entity>.dao.ts`. Keep it thin: Prisma calls only, errors propagate.
3. **Service** — add validation + orchestration in `$lib/server/services/<entity>.service.ts`. Throw typed errors (e.g. `XxxValidationError`) for client-fixable problems.
4. **Page Controller** (preferred for in-app UI) — add `+page.server.ts` with `load()` (calls the service) and `actions` (form-action create/update/delete). Pages built this way work without JS.
5. **REST Controller** (only when you need external HTTP access) — add `src/routes/api/<entity>/+server.ts`. Translate `XxxValidationError` to HTTP 400.
6. **View** — add `+page.svelte`. Consume `data` from `load`; submit via `<form action="?/...">` + `use:enhance`. Avoid `onMount` + client `fetch` for in-app pages.
7. **Test** — add `tests/unit/<entity>.service.test.ts` with the DAO mocked via `vi.mock`.
8. **Restart dev server** after Prisma schema changes so the cached client picks up the new model.

For external Pieq API calls from the browser, use `$lib/api/client` after the layout has set `window.__PIEQ_CONFIG__`.

---

## UI components (shadcn-svelte)

This template uses [shadcn-svelte](https://www.shadcn-svelte.com/) for accessible, theme-aware UI. Components live in `src/lib/components/ui/` and are re-exported from `$lib/components` for convenience.

**Import examples:**

```svelte
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '$lib/components';
```

**Add a new component:**

```bash
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add dropdown-menu
```

Configuration is in [`components.json`](components.json). Global theme variables are in [`src/routes/layout.css`](src/routes/layout.css).

**Installed components:** `button`, `input`, `label`, `card`, `table`, `badge`, `alert`

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

- **Unit:** `tests/unit/`
  - [`config.test.ts`](tests/unit/config.test.ts) — env loading + Keycloak issuer derivation
  - [`constants.test.ts`](tests/unit/constants.test.ts) — auth callback URL builder
  - [`employee.service.test.ts`](tests/unit/employee.service.test.ts) — service-layer validation with `vi.mock`ed DAO
- **E2E:** `tests/e2e/` — unauthenticated dashboard redirect

Authenticated e2e flows require Keycloak in CI (test realm + secrets).

---

## Roadmap

Known gaps tracked for follow-up PRs. Contributions welcome.

| Tag | Item |
| --- | --- |
| **H5** | Inject `window.__PIEQ_CONFIG__` synchronously via `app.html` instead of a client `$effect` (eliminates first-paint race) |
| **H7** | Replace `localStorage` OIDC token mirror with a server-side proxy route (`/api/proxy/[...path]`); tokens never reach the browser |
| **M2** | Migrate remaining `*.js` files (`auth`, `config`, hooks) to TypeScript |
| **M3** | Add `+error.svelte` for themed error pages |
| **M6** | Re-theme shadcn palette to Pieq orange |
| **M7** | Add a Prisma seed script for first-run demo data |
| **L6** | `docker-compose.yml` with Postgres for local dev |
| **L7** | GitHub Actions CI (`check` + `lint` + `test:unit` on PRs) |

---

## Service worker

A service worker lives at `src/service-worker.js`. Registration is disabled by default in `svelte.config.js`. Set `kit.serviceWorker.register` to `true` to enable PWA caching.

---

## Current Project State (Codebase Reality)

### 1. Project Overview
This project is an enterprise HRMS (Human Resource Management System) built on top of the SvelteKit boilerplate. It implements a layered server architecture with strict separation between UI, HTTP controllers, Service logic, and DAO (Data Access Object) database interactions. 

### 2. Implemented Modules
The following modules are actively implemented and present in the codebase:
- **Auth**: Keycloak OIDC integration via Auth.js (`/auth/signin`)
- **Dashboard**: Protected landing page (`/dashboard`)
- **Departments**: Master data management (`/departments`)
- **Designations**: Master data management (`/designations`)
- **System Roles**: Role management (`/system-roles`)
- **Permissions**: Permission key definitions (`/permissions`)
- **Role Permissions**: Matrix mapping between roles and permissions (`/role-permissions`)
- **Settings**: Application settings (`/settings`)
- **API**: Full REST API endpoints mapping to all the above modules (`/api/*`)

### 3. UI & Design System
The application utilizes a consistent design system with the following characteristics:
- **Styling System**: Tailwind CSS v4 using utility classes and CSS variables.
- **Component Library**: `shadcn-svelte` (accessible, theme-aware components).
- **Core UI Components**: `Alert`, `Badge`, `Button`, `Card`, `DropdownMenu`, `Input`, `Label`, `Select`, `Separator`, `Sonner` (Toast notifications), and `Table`.
- **Custom UI Patterns** (located in `src/lib/components/common`):
  - `CrudModal.svelte` & `ConfirmModal.svelte`: Reusable dialogs for creating/editing/deleting records.
  - `MasterDataDropdown.svelte` & `SearchableDropdown.svelte`: Dynamic dropdowns that load master data (e.g., departments, designations) via API.
  - `FilterDropdown.svelte`: Table filtering component.
  - `TableActions.svelte`: Standardized row-level action buttons (Edit/Delete).
  - `PermissionMatrixCell.svelte`: Interactive cell for role-permission assignments.
- **Icon System**: Lucide Icons via `@lucide/svelte`.

### 4. Tech Stack
- **Core**: Svelte 5, SvelteKit 2 (Node.js adapter)
- **Styling**: Tailwind CSS 4, `shadcn-svelte`, `tailwind-merge`, `tailwind-variants`, `clsx`
- **Database**: PostgreSQL
- **ORM**: Prisma 7 (using `@prisma/adapter-pg` + `pg` driver for ESM support)
- **Auth**: Auth.js (`@auth/sveltekit`)
- **Testing**: Playwright (`@playwright/test`), Vitest (`vitest`)
- **Tooling**: TypeScript, ESLint, `svelte-check`

### 5. Testing Status
The project has a comprehensive testing infrastructure:
- **Unit Tests (`npm run test:unit`)**: Configured with Vitest for server configs and utilities (`tests/unit/`).
- **E2E Tests (`npx playwright test`)**: Full Playwright test suite mapped out in `tests/`. It includes:
  - Global Setup/Teardown (`tests/setup/global.setup.ts`) with DB truncation and seeding.
  - API Integration Tests (`tests/api/*.spec.ts`)
  - Authentication Flows (`tests/auth/*.spec.ts`)
  - Feature UI Tests (`tests/employees/`, `tests/masters/`, `tests/role-permissions/`, `tests/e2e/`)
*(Note: Protected API/E2E test flows currently skip or require valid Keycloak session cookies for full pass in CI).*

### 6. Architecture Notes
- **CUID2 standard**: The database schema uses numeric `id` for internal primary keys, but strictly exposes `cuid2` for all external API operations and relational bindings (e.g., `department_cuid2`).
- **ESM DB Adapter**: The Prisma client connects via the `PrismaPg` adapter, correctly initialized in `src/lib/server/db.ts` to support SvelteKit's ESM requirements.
- **Separation of Concerns**: Client components strictly communicate through REST API routes (`src/routes/api/*`), which in turn call the isolated DAO layer (`$lib/server/dao`), ensuring no direct database imports occur on the client side.
