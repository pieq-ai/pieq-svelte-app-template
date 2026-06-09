# Graph Report - pieq-svelte-app-template  (2026-06-09)

## Corpus Check
- 219 files · ~71,857 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1063 nodes · 1774 edges · 77 communities (56 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6fc40a43`
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
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 36 edges
2. `db` - 23 edges
3. `mapToDb()` - 23 edges
4. `errorResponse()` - 22 edges
5. `pieq-svelte-app-template` - 18 edges
6. `ValidationError` - 17 edges
7. `pieq-svelte-app-template` - 17 edges
8. `successResponse()` - 16 edges
9. `scripts` - 15 edges
10. `scripts` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Locals` --references--> `User`  [EXTRACTED]
  src/app.d.ts → src/lib/types/user.ts
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `MasterDataOption` --references--> `MasterKey`  [EXTRACTED]
  src/lib/server/services/master-data.service.ts → src/lib/master-data/master-config.ts
- `createAuth()` --calls--> `getAuthConfig()`  [EXTRACTED]
  src/lib/server/auth.js → src/lib/server/config.js
- `load()` --calls--> `getAppConfig()`  [EXTRACTED]
  src/routes/+layout.server.ts → src/lib/server/config.js

## Import Cycles
- None detected.

## Communities (77 total, 21 thin omitted)

### Community 0 - "API Routes and Server Handlers"
Cohesion: 0.07
Nodes (66): DELETE(), GET(), PUT(), GET(), POST(), DELETE(), GET(), PUT() (+58 more)

### Community 2 - "Core UI Components"
Cohesion: 0.08
Nodes (5): $lib/utils.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, svelte/elements, @lucide/svelte/icons/minus

### Community 3 - "Core Dependency Layer"
Cohesion: 0.07
Nodes (27): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, svelte-sonner (+19 more)

### Community 4 - "App Configuration & API Client"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 5 - "Development & Build Tools"
Cohesion: 0.05
Nodes (38): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui, clsx, dotenv-cli (+30 more)

### Community 7 - "Authentication & Session Loader"
Cohesion: 0.16
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 8 - "Directory Aliases & Layout Paths"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 10 - "TypeScript Compiler Configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+4 more)

### Community 11 - "Static Assets and Library Routes"
Cohesion: 0.07
Nodes (44): GET(), PUT(), POST(), GET(), PUT(), POST(), requireAdmin(), requireAuth() (+36 more)

### Community 12 - "Leave Policy Management UI & Navigation"
Cohesion: 0.18
Nodes (7): $lib/auth, $lib/components, $lib/components/ui, $app/paths, @lucide/svelte/icons/settings, redirectTo, $app/state

### Community 13 - "Leave Type Management UI & Navigation"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 14 - "Sidebar Navigation & Icons"
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+14 more)

### Community 15 - "Holiday Calendar UI & Navigation"
Cohesion: 0.06
Nodes (32): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+24 more)

### Community 16 - "Tailwind UI Helper Utilities"
Cohesion: 0.29
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 17 - "Dashboard Loader and Server Actions"
Cohesion: 0.32
Nodes (11): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/toast, $lib/utils (+3 more)

### Community 18 - "Leave Policy Table Rendering"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (9): Common workflows, Development, Other, Quick reference, Scripts, `yarn build`, `yarn dev`, `yarn prepare` (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (26): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, name (+18 more)

### Community 44 - "Community 44"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (10): CreateDepartmentInput, UpdateDepartmentInput, createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment() (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (27): $lib/types/salary-component, $lib/validators/salary-component, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil, deductionsCount, earningsCount, formInitialIsActive, formInitialIsTaxable (+19 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (12): CreateDesignationInput, UpdateDesignationInput, createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (24): POST(), PUT(), GET(), PUT(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError (+16 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (10): averageAge, filteredEmployees, formError, isSubmitting, maxAge, successMessage, totalEmployees, $app/forms (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (5): CreateEmployeeData, createClient(), db, getDb(), isValidClient()

### Community 51 - "Community 51"
Cohesion: 0.11
Nodes (12): $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/validators/employment-type.js, ./$types.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/ellipsis-vertical, @lucide/svelte/icons/filter (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.19
Nodes (8): ./$types.js, getCodeClientError(), getNameClientError(), handleRowClick(), handleSubmit(), isInteractive(), toggleMenu(), updateMenuPosition()

### Community 54 - "Community 54"
Cohesion: 0.09
Nodes (20): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/components/layout, ./layout.css, @lucide/svelte/icons/calendar, @lucide/svelte/icons/calendar-cog, $app/environment, @lucide/svelte/icons/key-round (+12 more)

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (13): ./$types, actions, load(), GET(), POST(), createEmployee(), CreateEmployeeInput, EmployeeValidationError (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 58 - "Community 58"
Cohesion: 0.26
Nodes (11): createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById(), toPublicPermission(), updatePermission() (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 64 - "Community 64"
Cohesion: 0.28
Nodes (4): assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (4): Testing, `yarn test`, `yarn test:e2e`, `yarn test:unit`

### Community 73 - "Community 73"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

## Knowledge Gaps
- **375 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+370 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Holiday Calendar UI & Navigation` to `Community 43`, `Development & Build Tools`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `svelte-sonner` connect `Holiday Calendar UI & Navigation` to `Community 54`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `db` connect `Community 50` to `API Routes and Server Handlers`, `Leave Policy Data Access (DAO)`, `Holiday Data Access (DAO)`, `Community 45`, `Sidebar Navigation & Icons`, `Community 47`, `Community 48`, `Community 60`, `Community 61`, `Community 62`, `Community 63`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _375 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes and Server Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.0699942627653471 - nodes in this community are weakly interconnected._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07562136435748282 - nodes in this community are weakly interconnected._
- **Should `Core Dependency Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._