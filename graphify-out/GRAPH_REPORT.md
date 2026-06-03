# Graph Report - .  (2026-06-03)

## Corpus Check
- Corpus is ~34,609 words - fits in a single context window. You may not need a graph.

## Summary
- 438 nodes · 665 edges · 34 communities (23 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 23 edges
2. `scripts` - 15 edges
3. `db` - 13 edges
4. `sendList()` - 11 edges
5. `compilerOptions` - 11 edges
6. `sendUpdated()` - 9 edges
7. `getAppConfig()` - 8 edges
8. `sendCreated()` - 7 edges
9. `sendDeleted()` - 7 edges
10. `ToastManager` - 7 edges

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

## Communities (34 total, 11 thin omitted)

### Community 0 - "UI Views & Modals"
Cohesion: 0.08
Nodes (25): @lucide/svelte/icons/alert-circle, @lucide/svelte/icons/alert-triangle, svelte/animate, $lib/components, $lib/confirmation.svelte.js, $lib/toast.svelte.js, $lib/types/organization_location, $lib/types/role (+17 more)

### Community 1 - "REST API Endpoint Handlers"
Cohesion: 0.12
Nodes (28): GET(), DELETE(), parseCuid(), PATCH(), PUT(), GET(), POST(), DELETE() (+20 more)

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
Cohesion: 0.08
Nodes (20): @lucide/svelte/icons/bell, @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/calendar, @lucide/svelte/icons/home, @lucide/svelte/icons/layout-dashboard (+12 more)

### Community 9 - "Role Management"
Cohesion: 0.14
Nodes (8): Role, RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams(), validateUpdatePayload()

### Community 10 - "Auth Server Hook & Configuration"
Cohesion: 0.16
Nodes (13): Keycloak Authentication via Auth.js, load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig() (+5 more)

### Community 11 - "Employee DB Services & Tests"
Cohesion: 0.15
Nodes (5): CreateEmployeeData, createClient(), db, getDb(), isValidClient()

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

## Knowledge Gaps
- **112 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development Dependencies` to `UI Views & Modals`, `Project Dependencies & Scripts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `svelte` connect `UI Views & Modals` to `Development Dependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Views & Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.07862679955703211 - nodes in this community are weakly interconnected._
- **Should `REST API Endpoint Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.11605937921727395 - nodes in this community are weakly interconnected._
- **Should `shadcn UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Should `App Client Configuration & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._