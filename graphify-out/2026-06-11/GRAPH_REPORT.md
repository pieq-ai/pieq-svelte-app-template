# Graph Report - pieq-svelte-app-template  (2026-06-11)

## Corpus Check
- 259 files · ~95,102 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1208 nodes · 2157 edges · 83 communities (64 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56ced58e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Endpoints|API Endpoints]]
- [[_COMMUNITY_Data Access Tests|Data Access Tests]]
- [[_COMMUNITY_UI Components Index|UI Components Index]]
- [[_COMMUNITY_UI Components Core|UI Components Core]]
- [[_COMMUNITY_Dependencies & Icons|Dependencies & Icons]]
- [[_COMMUNITY_Master Data DAO|Master Data DAO]]
- [[_COMMUNITY_API Client Configuration|API Client Configuration]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Layout & Toast|Layout & Toast]]
- [[_COMMUNITY_Department Service DAO|Department Service DAO]]
- [[_COMMUNITY_Designation Service DAO|Designation Service DAO]]
- [[_COMMUNITY_Server Authentication|Server Authentication]]
- [[_COMMUNITY_Component Configuration|Component Configuration]]
- [[_COMMUNITY_Permission Service|Permission Service]]
- [[_COMMUNITY_System Role Service|System Role Service]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Linter & Svelte Config|Linter & Svelte Config]]
- [[_COMMUNITY_Constants|Constants]]
- [[_COMMUNITY_Mock Permissions|Mock Permissions]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_Server Routing|Server Routing]]
- [[_COMMUNITY_Dashboard Routes|Dashboard Routes]]
- [[_COMMUNITY_VSCode Settings|VSCode Settings]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
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
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 36 edges
2. `db` - 33 edges
3. `mapToDb()` - 23 edges
4. `errorResponse()` - 22 edges
5. `pieq-svelte-app-template` - 18 edges
6. `pieq-svelte-app-template` - 18 edges
7. `ValidationError` - 17 edges
8. `successResponse()` - 16 edges
9. `scripts` - 15 edges
10. `trimStringFields()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/departments/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/designations/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `validateUpdateSalaryComponent()`  [INFERRED]
  src/routes/api/salary-components/[cuid]/+server.ts → src/lib/server/validators/salary-component.validator.ts
- `Locals` --references--> `User`  [EXTRACTED]
  src/app.d.ts → src/lib/types/user.ts
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts

## Import Cycles
- 1-file cycle: `src/routes/leave-policies/+page.svelte -> src/routes/leave-policies/+page.svelte`

## Communities (83 total, 19 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.06
Nodes (51): getMaster(), POST(), POST(), requireAdmin(), requireAuth(), requirePermission(), GET(), getMaster() (+43 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.23
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.20
Nodes (22): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+14 more)

### Community 3 - "UI Components Core"
Cohesion: 0.08
Nodes (4): $lib/utils.js, @lucide/svelte/icons/chevron-right, svelte/elements, bits-ui

### Community 4 - "Dependencies & Icons"
Cohesion: 0.07
Nodes (30): devDependencies, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte, @fontsource-variable/inter (+22 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+14 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+19 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.08
Nodes (25): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/calendar (+17 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.13
Nodes (12): $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, @lucide/svelte/icons/chevron-left, modalStack (+4 more)

### Community 11 - "Server Authentication"
Cohesion: 0.15
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.14
Nodes (13): CreatePermissionInput, UpdatePermissionInput, createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById() (+5 more)

### Community 14 - "System Role Service"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 16 - "Utility Functions"
Cohesion: 0.29
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 22 - "Server Routing"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 23 - "Dashboard Routes"
Cohesion: 0.14
Nodes (18): $lib/components/ui, $lib/components/ui/dropdown-menu/index.js, $lib/validators/employment-type.js, ./$types.js, ./$types.js, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/filter, getCodeClientError() (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (13): Code quality, Common workflows, Other, Quick reference, Scripts, Testing, `yarn check`, `yarn check:watch` (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (17): ./$types, ./$types, CreateEmployeeData, actions, load(), GET(), getErrorStatus(), POST() (+9 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (6): DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.05
Nodes (15): ApiError, extractErrorMessage(), localApi, localRequest(), Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.05
Nodes (84): GET(), GET(), POST(), @sveltejs/kit, GET(), POST(), GET(), POST() (+76 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.11
Nodes (9): RoleListResponse, Role, RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams() (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (13): Code quality, Common workflows, Other, Quick reference, Scripts, Testing, `yarn check`, `yarn check:watch` (+5 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 52 - "Community 52"
Cohesion: 0.28
Nodes (13): sendDeleted(), sendUpdated(), DELETE(), parseCuid(), PATCH(), PUT(), DELETE(), parseCuid() (+5 more)

### Community 55 - "Community 55"
Cohesion: 0.17
Nodes (10): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.27
Nodes (8): createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment(), UpdateDepartmentDto, validateDepartmentName()

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (6): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, @lucide/svelte/icons/triangle-alert

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (3): $lib/components/index.js, @lucide/svelte/icons/check, @lucide/svelte/icons/minus

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (7): 1. Project Overview, 2. Implemented Modules, 3. UI & Design System, 4. Tech Stack, 5. Testing Status, 6. Architecture Notes, Current Project State (Codebase Reality)

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (7): 1. Project Overview, 2. Implemented Modules, 3. UI & Design System, 4. Tech Stack, 5. Testing Status, 6. Architecture Notes, Current Project State (Codebase Reality)

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 71 - "Community 71"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 72 - "Community 72"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 73 - "Community 73"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (4): Development, `yarn build`, `yarn dev`, `yarn preview`

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 79 - "Community 79"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 81 - "Community 81"
Cohesion: 0.33
Nodes (4): $app/environment, toast, svelte-sonner, $lib/components/ui/toaster.svelte

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): Development, `yarn build`, `yarn dev`, `yarn preview`

## Knowledge Gaps
- **348 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+343 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Data Access Tests` to `Community 34`, `Community 35`, `Community 36`, `Master Data DAO`, `Community 38`, `Community 39`, `Department Service DAO`, `Community 44`, `Permission Service`, `Community 46`, `Community 47`, `Community 48`, `Community 54`, `Community 57`, `Community 60`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 81`, `Community 58`, `UI Components Core`, `Package Dependencies`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dependencies & Icons` to `UI Components Index`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _348 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.06306306306306306 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.08116883116883117 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._