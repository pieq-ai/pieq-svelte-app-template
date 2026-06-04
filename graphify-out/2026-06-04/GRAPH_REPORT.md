# Graph Report - pieq-svelte-app-template  (2026-06-03)

## Corpus Check
- 113 files · ~34,517 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 501 nodes · 726 edges · 38 communities (25 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `053d4961`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Views & Modals|UI Views & Modals]]
- [[_COMMUNITY_REST API Endpoint Handlers|REST API Endpoint Handlers]]
- [[_COMMUNITY_shadcn UI Components|shadcn UI Components]]
- [[_COMMUNITY_App Client Configuration & Types|App Client Configuration & Types]]
- [[_COMMUNITY_Organization Location Management|Organization Location Management]]
- [[_COMMUNITY_Development Dependencies|Development Dependencies]]
- [[_COMMUNITY_Shift Management|Shift Management]]
- [[_COMMUNITY_Project Dependencies & Scripts|Project Dependencies & Scripts]]
- [[_COMMUNITY_Lucide Icons & Layouts|Lucide Icons & Layouts]]
- [[_COMMUNITY_Role Management|Role Management]]
- [[_COMMUNITY_Auth Server Hook & Configuration|Auth Server Hook & Configuration]]
- [[_COMMUNITY_Employee DB Services & Tests|Employee DB Services & Tests]]
- [[_COMMUNITY_shadcn Configuration|shadcn Configuration]]
- [[_COMMUNITY_TypeScript Compiler Options|TypeScript Compiler Options]]
- [[_COMMUNITY_Toast Notification Management|Toast Notification Management]]
- [[_COMMUNITY_Utility Helpers|Utility Helpers]]
- [[_COMMUNITY_ESLint & Svelte Configurations|ESLint & Svelte Configurations]]
- [[_COMMUNITY_Confirmation Modals|Confirmation Modals]]
- [[_COMMUNITY_OIDC Constants & Helpers|OIDC Constants & Helpers]]
- [[_COMMUNITY_Service Worker Caching|Service Worker Caching]]
- [[_COMMUNITY_App Entrypoint Template|App Entrypoint Template]]
- [[_COMMUNITY_Architecture Overview|Architecture Overview]]
- [[_COMMUNITY_Agent Config Documents|Agent Config Documents]]
- [[_COMMUNITY_Employees Demo Docs|Employees Demo Docs]]
- [[_COMMUNITY_Error Entrypoint Page|Error Entrypoint Page]]
- [[_COMMUNITY_Robots Configuration|Robots Configuration]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 23 edges
2. `pieq-svelte-app-template` - 16 edges
3. `scripts` - 15 edges
4. `db` - 13 edges
5. `sendList()` - 11 edges
6. `compilerOptions` - 11 edges
7. `sendUpdated()` - 9 edges
8. `getAppConfig()` - 8 edges
9. `Scripts` - 8 edges
10. `sendCreated()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `SvelteKit HTML Entrypoint` --references--> `App Favicon Image`  [INFERRED]
  src/app.html → src/lib/assets/favicon.svg
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `createAuth()` --calls--> `getAuthConfig()`  [EXTRACTED]
  src/lib/server/auth.js → src/lib/server/config.js
- `load()` --calls--> `getAppConfig()`  [EXTRACTED]
  src/routes/+layout.server.ts → src/lib/server/config.js
- `GET()` --calls--> `sendList()`  [EXTRACTED]
  src/routes/api/countries/+server.ts → src/lib/server/response.ts

## Import Cycles
- None detected.

## Communities (38 total, 13 thin omitted)

### Community 0 - "UI Views & Modals"
Cohesion: 0.08
Nodes (25): @lucide/svelte/icons/alert-circle, @lucide/svelte/icons/alert-triangle, svelte/animate, $lib/components, $lib/confirmation.svelte.js, $lib/toast.svelte.js, $lib/types/organization_location, $lib/types/role (+17 more)

### Community 1 - "REST API Endpoint Handlers"
Cohesion: 0.09
Nodes (20): GET(), CreateEmployeeData, GET(), POST(), GET(), POST(), createClient(), db (+12 more)

### Community 3 - "App Client Configuration & Types"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 4 - "Organization Location Management"
Cohesion: 0.10
Nodes (6): CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO, rejectUnknownKeys(), validateCreatePayload(), validateUpdatePayload()

### Community 5 - "Development Dependencies"
Cohesion: 0.07
Nodes (29): devDependencies, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte, @fontsource-variable/inter (+21 more)

### Community 6 - "Shift Management"
Cohesion: 0.12
Nodes (13): getShiftByCuid(), updateShift(), activateShift(), createShift(), formatTimeToHHMMSS(), updateShift(), Shift, ShiftCreateDTO (+5 more)

### Community 7 - "Project Dependencies & Scripts"
Cohesion: 0.07
Nodes (27): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+19 more)

### Community 8 - "Lucide Icons & Layouts"
Cohesion: 0.09
Nodes (20): @lucide/svelte/icons/bell, @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/calendar, @lucide/svelte/icons/home, @lucide/svelte/icons/layout-dashboard (+12 more)

### Community 9 - "Role Management"
Cohesion: 0.14
Nodes (8): Role, RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams(), validateUpdatePayload()

### Community 10 - "Auth Server Hook & Configuration"
Cohesion: 0.16
Nodes (13): Keycloak Authentication via Auth.js, load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig() (+5 more)

### Community 11 - "Employee DB Services & Tests"
Cohesion: 0.05
Nodes (36): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Adding a new feature, API reference — Employees, `APP_URL` per environment (+28 more)

### Community 12 - "shadcn Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "TypeScript Compiler Options"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Toast Notification Management"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastManager

### Community 15 - "Utility Helpers"
Cohesion: 0.33
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 35 - "Community 35"
Cohesion: 0.28
Nodes (13): DELETE(), parseCuid(), PATCH(), PUT(), DELETE(), parseCuid(), PUT(), sendDeleted() (+5 more)

## Knowledge Gaps
- **160 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development Dependencies` to `UI Views & Modals`, `Project Dependencies & Scripts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `svelte` connect `UI Views & Modals` to `Development Dependencies`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Views & Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.07862679955703211 - nodes in this community are weakly interconnected._
- **Should `REST API Endpoint Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.08943089430894309 - nodes in this community are weakly interconnected._
- **Should `shadcn UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Should `App Client Configuration & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._