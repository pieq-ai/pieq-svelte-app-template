# Graph Report - pieq-svelte-app-template  (2026-06-08)

## Corpus Check
- 150 files · ~46,718 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 687 nodes · 1067 edges · 59 communities (39 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba837b76`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes and Server Handlers|API Routes and Server Handlers]]
- [[_COMMUNITY_Leave Policy Data Access (DAO)|Leave Policy Data Access (DAO)]]
- [[_COMMUNITY_Core UI Components|Core UI Components]]
- [[_COMMUNITY_Core Dependency Layer|Core Dependency Layer]]
- [[_COMMUNITY_App Configuration & API Client|App Configuration & API Client]]
- [[_COMMUNITY_Development & Build Tools|Development & Build Tools]]
- [[_COMMUNITY_Holiday Data Access (DAO)|Holiday Data Access (DAO)]]
- [[_COMMUNITY_Authentication & Session Loader|Authentication & Session Loader]]
- [[_COMMUNITY_Directory Aliases & Layout Paths|Directory Aliases & Layout Paths]]
- [[_COMMUNITY_Modal Dialogs & Confirmation Prompts|Modal Dialogs & Confirmation Prompts]]
- [[_COMMUNITY_TypeScript Compiler Configuration|TypeScript Compiler Configuration]]
- [[_COMMUNITY_Static Assets and Library Routes|Static Assets and Library Routes]]
- [[_COMMUNITY_Leave Policy Management UI & Navigation|Leave Policy Management UI & Navigation]]
- [[_COMMUNITY_Leave Type Management UI & Navigation|Leave Type Management UI & Navigation]]
- [[_COMMUNITY_Sidebar Navigation & Icons|Sidebar Navigation & Icons]]
- [[_COMMUNITY_Holiday Calendar UI & Navigation|Holiday Calendar UI & Navigation]]
- [[_COMMUNITY_Tailwind UI Helper Utilities|Tailwind UI Helper Utilities]]
- [[_COMMUNITY_Dashboard Loader and Server Actions|Dashboard Loader and Server Actions]]
- [[_COMMUNITY_Leave Policy Table Rendering|Leave Policy Table Rendering]]
- [[_COMMUNITY_ESLint and Svelte Config Settings|ESLint and Svelte Config Settings]]
- [[_COMMUNITY_OIDC Auth Utility Constants|OIDC Auth Utility Constants]]
- [[_COMMUNITY_Signin Page Views & Logic|Signin Page Views & Logic]]
- [[_COMMUNITY_Leave Type Table Rendering|Leave Type Table Rendering]]
- [[_COMMUNITY_Service Worker Asset Caching|Service Worker Asset Caching]]
- [[_COMMUNITY_VS Code Unknown At-Rules Linting|VS Code Unknown At-Rules Linting]]
- [[_COMMUNITY_GitHub Actions PR Review Workflow|GitHub Actions PR Review Workflow]]
- [[_COMMUNITY_PR Documentation|PR Documentation]]
- [[_COMMUNITY_README Project Guide|README Project Guide]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 26 edges
2. `errorResponse()` - 24 edges
3. `successResponse()` - 18 edges
4. `pieq-svelte-app-template` - 17 edges
5. `scripts` - 15 edges
6. `trimStringFields()` - 14 edges
7. `validatePayloadKeys()` - 14 edges
8. `db` - 12 edges
9. `compilerOptions` - 11 edges
10. `Changes` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `createAuth()` --calls--> `getAuthConfig()`  [EXTRACTED]
  src/lib/server/auth.js → src/lib/server/config.js
- `load()` --calls--> `getAppConfig()`  [EXTRACTED]
  src/routes/+layout.server.ts → src/lib/server/config.js
- `load()` --calls--> `listEmployees()`  [EXTRACTED]
  src/routes/employees/+page.server.ts → src/lib/server/services/employee.service.ts
- `GET()` --calls--> `listEmployees()`  [EXTRACTED]
  src/routes/api/employees/+server.ts → src/lib/server/services/employee.service.ts

## Import Cycles
- None detected.

## Communities (59 total, 20 thin omitted)

### Community 0 - "API Routes and Server Handlers"
Cohesion: 0.10
Nodes (50): GET(), DELETE(), GET(), PUT(), GET(), POST(), DELETE(), GET() (+42 more)

### Community 1 - "Leave Policy Data Access (DAO)"
Cohesion: 0.09
Nodes (15): CreateLeavePolicyData, update(), CreateLeaveTypeData, update(), createClient(), db, getDb(), isValidClient() (+7 more)

### Community 2 - "Core UI Components"
Cohesion: 0.09
Nodes (8): ../button/button.svelte, $lib/utils.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, svelte/elements, @lucide/svelte/icons/filter

### Community 3 - "Core Dependency Layer"
Cohesion: 0.07
Nodes (26): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, name (+18 more)

### Community 4 - "App Configuration & API Client"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 5 - "Development & Build Tools"
Cohesion: 0.06
Nodes (31): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+23 more)

### Community 6 - "Holiday Data Access (DAO)"
Cohesion: 0.11
Nodes (12): CreateHolidayData, createHoliday(), CreateHolidayInput, deleteHoliday(), HolidayValidationError, updateHoliday(), UpdateHolidayInput, VALID_HOLIDAY_TYPES (+4 more)

### Community 7 - "Authentication & Session Loader"
Cohesion: 0.16
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 8 - "Directory Aliases & Layout Paths"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 10 - "TypeScript Compiler Configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+4 more)

### Community 12 - "Leave Policy Management UI & Navigation"
Cohesion: 0.24
Nodes (5): $lib/auth, $lib/components, $lib/components/ui, redirectTo, $app/state

### Community 16 - "Tailwind UI Helper Utilities"
Cohesion: 0.33
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 17 - "Dashboard Loader and Server Actions"
Cohesion: 0.13
Nodes (9): svelte/animate, @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/toast.svelte, $app/forms, @lucide/svelte/icons/loader-circle, svelte (+1 more)

### Community 18 - "Leave Policy Table Rendering"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 39 - "Community 39"
Cohesion: 0.05
Nodes (37): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Adding a new feature, API reference — Employees, `APP_URL` per environment (+29 more)

### Community 40 - "Community 40"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 41 - "Community 41"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (27): $lib/types/salary-component, $lib/validators/salary-component, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil, @lucide/svelte/icons/plus, deductionsCount, earningsCount, formInitialIsActive (+19 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (24): POST(), PUT(), GET(), PUT(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError (+16 more)

### Community 49 - "Community 49"
Cohesion: 0.17
Nodes (9): averageAge, filteredEmployees, formError, isSubmitting, maxAge, successMessage, totalEmployees, @lucide/svelte/icons/search (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (3): ./$types.js, toggleMenu(), updateMenuPosition()

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (3): ./$types.js, toggleMenu(), updateMenuPosition()

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (10): $lib/assets/favicon.svg, $lib/components/layout, ./$types, ./layout.css, @lucide/svelte/icons/ellipsis-vertical, Holiday, $app/navigation, svelte-sonner (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.17
Nodes (8): @lucide/svelte/icons/calendar, @lucide/svelte/icons/calendar-cog, @lucide/svelte/icons/layout-dashboard, @lucide/svelte/icons/log-out, @lucide/svelte/icons/settings, @lucide/svelte/icons/shield-check, @lucide/svelte/icons/users, @lucide/svelte/icons/wallet

### Community 55 - "Community 55"
Cohesion: 0.13
Nodes (15): ./$types, CreateEmployeeData, actions, load(), GET(), POST(), @sveltejs/kit, createEmployee() (+7 more)

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

## Knowledge Gaps
- **239 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development & Build Tools` to `Dashboard Loader and Server Actions`, `Core Dependency Layer`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dashboard Loader and Server Actions` to `Development & Build Tools`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Dependency Layer` to `Community 53`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes and Server Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.09779825908858167 - nodes in this community are weakly interconnected._
- **Should `Leave Policy Data Access (DAO)` be split into smaller, more focused modules?**
  _Cohesion score 0.08558558558558559 - nodes in this community are weakly interconnected._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09098639455782313 - nodes in this community are weakly interconnected._