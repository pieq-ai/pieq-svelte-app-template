# Graph Report - pieq-svelte-app-template  (2026-06-08)

## Corpus Check
- 122 files · ~39,025 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 586 nodes · 843 edges · 39 communities (26 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef49efae`
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
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 23 edges
2. `pieq-svelte-app-template` - 18 edges
3. `scripts` - 15 edges
4. `db` - 13 edges
5. `sendList()` - 11 edges
6. `compilerOptions` - 11 edges
7. `Changes` - 11 edges
8. `sendUpdated()` - 9 edges
9. `getAppConfig()` - 8 edges
10. `Harden `pieq-svelte-app-template` based on initial review` - 8 edges

## Surprising Connections (you probably didn't know these)
- `SvelteKit HTML Entrypoint` --references--> `App Favicon Image`  [INFERRED]
  src/app.html → src/lib/assets/favicon.svg
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `LocationListResponse` --references--> `CompanyLocation`  [EXTRACTED]
  src/lib/api/locations.ts → src/lib/types/organization_location.ts
- `RoleListResponse` --references--> `Role`  [EXTRACTED]
  src/lib/api/roles.ts → src/lib/types/role.ts
- `ShiftListResponse` --references--> `Shift`  [EXTRACTED]
  src/lib/api/shifts.ts → src/lib/types/shift.ts

## Import Cycles
- None detected.

## Communities (39 total, 13 thin omitted)

### Community 0 - "UI Views & Modals"
Cohesion: 0.06
Nodes (34): @lucide/svelte/icons/alert-circle, @lucide/svelte/icons/alert-triangle, svelte/animate, $lib/api/local, $lib/api/locations, $lib/api/roles, $lib/api/shifts, $lib/components (+26 more)

### Community 1 - "REST API Endpoint Handlers"
Cohesion: 0.09
Nodes (32): GET(), DELETE(), parseCuid(), PATCH(), PUT(), GET(), POST(), DELETE() (+24 more)

### Community 3 - "App Client Configuration & Types"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 4 - "Organization Location Management"
Cohesion: 0.06
Nodes (15): ApiError, extractErrorMessage(), localApi, localRequest(), Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload (+7 more)

### Community 5 - "Development Dependencies"
Cohesion: 0.07
Nodes (29): devDependencies, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte, @fontsource-variable/inter (+21 more)

### Community 6 - "Shift Management"
Cohesion: 0.09
Nodes (16): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, getShiftByCuid(), updateShift(), activateShift(), createShift(), formatTimeToHHMMSS() (+8 more)

### Community 7 - "Project Dependencies & Scripts"
Cohesion: 0.07
Nodes (27): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+19 more)

### Community 8 - "Lucide Icons & Layouts"
Cohesion: 0.08
Nodes (22): @lucide/svelte/icons/bell, @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/calendar, @lucide/svelte/icons/clock, @lucide/svelte/icons/home (+14 more)

### Community 9 - "Role Management"
Cohesion: 0.11
Nodes (9): RoleListResponse, Role, RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams() (+1 more)

### Community 10 - "Auth Server Hook & Configuration"
Cohesion: 0.16
Nodes (13): Keycloak Authentication via Auth.js, load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig() (+5 more)

### Community 11 - "Employee DB Services & Tests"
Cohesion: 0.05
Nodes (40): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Adding a new feature, API reference — Employees, `APP_URL` per environment (+32 more)

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

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (14): ./$types, CreateEmployeeData, actions, load(), GET(), POST(), createEmployee(), CreateEmployeeInput (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

## Knowledge Gaps
- **197 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+192 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development Dependencies` to `UI Views & Modals`, `Project Dependencies & Scripts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `db` connect `REST API Endpoint Handlers` to `Role Management`, `Community 43`, `Organization Location Management`, `Shift Management`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `svelte` connect `UI Views & Modals` to `Development Dependencies`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _197 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Views & Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.06184012066365008 - nodes in this community are weakly interconnected._
- **Should `REST API Endpoint Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.08627450980392157 - nodes in this community are weakly interconnected._
- **Should `shadcn UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._