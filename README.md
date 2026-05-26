# pieq-svelte-app-template

Production-ready SvelteKit boilerplate with layered architecture, PostgreSQL/Prisma, and Keycloak authentication via Auth.js.

## Architecture

```
View (+page.svelte)
  ↑ data from load/actions
Controller (+page.server.ts)
  ↑ calls services only
Service ($lib/server/services)
  ↑ business logic, validation
DAO ($lib/server/dao)
  ↑ Prisma queries only
Database (PostgreSQL via Prisma)
```

Keycloak handles identity (OIDC). On each authenticated request, `hooks.server.js` syncs the Keycloak profile into the local `User` table through `user.service`.

| Layer | Location | Responsibility |
| --- | --- | --- |
| DAO | `$lib/server/dao/*.dao.ts` | Prisma queries only |
| Service | `$lib/server/services/*.service.ts` | Business logic and orchestration |
| Controller | `+page.server.ts` | HTTP, forms, cookies; calls services |
| View | `+page.svelte`, `$lib/components` | UI rendering only |

**Server/client boundary:** Code under `$lib/server/` must never be imported from client-side Svelte components. SvelteKit enforces this at build time.

## Prerequisites

- Node.js 20+
- PostgreSQL
- Keycloak realm (`pieq-sso`) with confidential client (`pieq-app`)

## Environment configuration

Copy [`.env.example`](.env.example) and set values for your environment. Preprod defaults are included:

| Variable | Purpose | Preprod default |
| --- | --- | --- |
| `API_BASE_URL` | Pieq API base URL | `https://preprod.api.pieq.ai/` |
| `APP_URL` | Public app origin (Auth.js redirects, Vite dev port, runtime config) | `http://localhost:5173` (dev) |
| `OIDC_URL` | Keycloak base URL | `https://preprod.auth.pieq.ai/` |
| `OIDC_REALM` | Keycloak realm | `pieq-sso` |
| `OIDC_CLIENT_ID` | OIDC client ID | `pieq-app` |
| `OIDC_CLIENT_SECRET` | Keycloak client secret (server only) | from Keycloak admin |
| `AUTH_SECRET` | Auth.js session encryption | generate with openssl |
| `DATABASE_URL` | PostgreSQL connection | local/dev value |

Set `APP_URL` to your deployment origin per environment. The Vite dev server port is derived from `APP_URL`; Auth.js receives it via an internal `AUTH_URL` sync in [`src/lib/server/config.js`](src/lib/server/config.js). Keycloak callback URI: `{APP_URL}/auth/callback/keycloak`.

Examples:

| Environment | `APP_URL` |
| --- | --- |
| Local dev | `http://localhost:5173` |
| Preprod | `https://preprod.app.pieq.ai` |
| Prod | `https://app.pieq.ai` |

The server derives the Keycloak issuer automatically:

```
${OIDC_URL}realms/${OIDC_REALM}
→ https://preprod.auth.pieq.ai/realms/pieq-sso
```

### Runtime config (`window.__PIEQ_CONFIG__`)

Public config (no secrets) is exposed to the client via layout load and mirrored to `window.__PIEQ_CONFIG__`:

- Server source of truth: `.env` via [`src/lib/server/config.js`](src/lib/server/config.js)
- Client reader: [`src/lib/config/index.ts`](src/lib/config/index.ts)
- API client: [`src/lib/api/client.ts`](src/lib/api/client.ts)

The sign-in page requires OIDC config to be present before rendering the Keycloak login button. Client-side sign-in uses [`src/lib/auth/index.ts`](src/lib/auth/index.ts) (`signInWithKeycloak`); session data is loaded server-side via the root layout.

## Keycloak client setup

Configure the `pieq-app` client in the `pieq-sso` realm:

1. Enable **Client authentication** (confidential client).
2. Set valid redirect URIs to `{APP_URL}/auth/callback/keycloak` for each environment (e.g. `http://localhost:5173/auth/callback/keycloak` for local dev).
3. Set valid post-logout redirect URIs as needed.
4. Copy the client secret into `OIDC_CLIENT_SECRET` in `.env` (never commit secrets).

## Quick start

```bash
cp .env.example .env
# Edit OIDC_CLIENT_SECRET and DATABASE_URL

npm install
npm run db:generate
npm run db:migrate     # requires PostgreSQL running
npm run dev
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Prisma 7 notes

- Database URL is configured in [`prisma.config.ts`](prisma.config.ts) (not in `schema.prisma`).
- The Prisma client is generated to `src/generated/prisma` — run `npm run db:generate` after cloning or schema changes.
- [`src/lib/server/db.js`](src/lib/server/db.js) uses `@prisma/adapter-pg` with the `pg` driver.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check with svelte-check |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema without migration |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.js              # Keycloak OIDC (Auth.js)
│   │   ├── config.js            # Env → AppConfig / AuthConfig
│   │   ├── db.js                # Prisma client singleton
│   │   ├── dao/user.dao.ts      # Data access
│   │   └── services/user.service.ts
│   ├── config/                  # Client runtime config reader
│   ├── auth/                    # Client OIDC helpers (Auth.js)
│   ├── api/client.ts            # Pieq API client stub
│   ├── components/              # Shared UI
│   └── types/                   # Shared TypeScript types
├── params/uuid.ts               # Route param matcher
├── routes/
│   ├── dashboard/               # Protected example route
│   └── auth/signin/             # Custom sign-in page
├── hooks.server.js              # Auth + locals + route guard
├── hooks.client.js              # Client error logging
├── instrumentation.server.js    # DB startup check
└── service-worker.js            # PWA caching (opt-in)
```

## Adding a feature

1. **DAO** — Add Prisma queries in `$lib/server/dao/<entity>.dao.ts`.
2. **Service** — Add business logic in `$lib/server/services/<entity>.service.ts`.
3. **Controller** — Call the service from `+page.server.ts` load/actions.
4. **View** — Render data in `+page.svelte` using `$lib/components`.

For Pieq API calls from the client, use `$lib/api/client` after layout has set `window.__PIEQ_CONFIG__`.

## Service worker

The service worker is included at `src/service-worker.js`. Registration is disabled by default in `svelte.config.js`. Set `kit.serviceWorker.register` to `true` to enable PWA caching.

## Deployment

This template uses `@sveltejs/adapter-node` for Node.js deployments with PostgreSQL. For Vercel, Netlify, or Cloudflare, swap the adapter in `svelte.config.js` and review database connectivity for your platform.

Ensure production `.env` sets `APP_URL`, `API_BASE_URL`, `OIDC_*`, and `OIDC_CLIENT_SECRET` for the target environment.

## Testing

- **Unit:** `tests/unit/` — config, service layer with mocked DAOs
- **E2E:** `tests/e2e/` — unauthenticated dashboard redirect (authenticated flows require Keycloak in CI)

Authenticated e2e tests against Keycloak can be added in CI by provisioning a test realm and storing credentials as secrets.
