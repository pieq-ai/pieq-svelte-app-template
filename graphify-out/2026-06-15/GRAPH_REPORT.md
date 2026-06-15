# Graph Report - pieq-svelte-app-template  (2026-06-16)

## Corpus Check
- 273 files · ~103,625 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1283 nodes · 2360 edges · 97 communities (76 shown, 21 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8eb0abc`
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
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 37 edges
2. `db` - 37 edges
3. `errorResponse()` - 35 edges
4. `successResponse()` - 26 edges
5. `mapToDb()` - 23 edges
6. `trimStringFields()` - 21 edges
7. `validatePayloadKeys()` - 21 edges
8. `pieq-svelte-app-template` - 18 edges
9. `pieq-svelte-app-template` - 18 edges
10. `ValidationError` - 17 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/attendance-records/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/holidays/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/leave/policies/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/leave/types/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `errorResponse()`  [INFERRED]
  src/routes/api/attendance-records/[cuid]/+server.ts → src/lib/server/response.ts

## Import Cycles
- 1-file cycle: `src/routes/leave-policies/+page.svelte -> src/routes/leave-policies/+page.svelte`

## Communities (97 total, 21 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.05
Nodes (59): getMaster(), POST(), POST(), requireAdmin(), requireAuth(), requirePermission(), GET(), getMaster() (+51 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.22
Nodes (5): CreateEmployeeData, createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.17
Nodes (26): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/toast, $lib/types/salary-component (+18 more)

### Community 3 - "UI Components Core"
Cohesion: 0.08
Nodes (4): $lib/utils.js, @lucide/svelte/icons/chevron-right, svelte/elements, @lucide/svelte/icons/minus

### Community 4 - "Dependencies & Icons"
Cohesion: 0.06
Nodes (31): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+23 more)

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
Nodes (24): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/calendar (+16 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.13
Nodes (14): $lib/components/index.js, $lib/components/ui, $lib/components/ui/dropdown-menu/index.js, $lib/validators/employment-type.js, ./$types, ./$types.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down (+6 more)

### Community 11 - "Server Authentication"
Cohesion: 0.15
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.29
Nodes (11): createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById(), toPublicPermission(), updatePermission() (+3 more)

### Community 14 - "System Role Service"
Cohesion: 0.17
Nodes (4): @lucide/svelte/icons/alert-circle, ./$types, @lucide/svelte/icons/check-circle-2, @lucide/svelte/icons/clock

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
Cohesion: 0.18
Nodes (17): GET(), formatHoliday(), createHoliday(), CreateHolidayInput, deleteHoliday(), getHolidayByCuid(), HolidayMultiValidationError, HolidayValidationError (+9 more)

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
Cohesion: 0.17
Nodes (16): ./$types, ./$types, actions, load(), GET(), getErrorStatus(), POST(), createEmployee() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (6): $lib/components, $lib/components, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/search, @lucide/svelte/icons/settings, $app/stores

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (6): CreateSystemRoleInput, UpdateSystemRoleInput, assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (24): GET(), @sveltejs/kit, GET(), POST(), GET(), POST(), EmploymentTypeDTO, EmploymentTypeInput (+16 more)

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (6): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (22): formatLeavePolicy(), createLeavePolicy(), CreateLeavePolicyInput, deleteLeavePolicy(), getLeavePolicyByCuid(), updateLeavePolicy(), UpdateLeavePolicyInput, validateAndMapPolicyInput() (+14 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (7): RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams(), validateUpdatePayload()

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
Cohesion: 0.33
Nodes (11): deleteSuccessResponse(), errorResponse(), formatLeaveType(), updateSuccessResponse(), getLeaveTypeByCuid(), DELETE(), DELETE(), PUT() (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (10): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+2 more)

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (11): POST(), POST(), GET(), POST(), createSuccessResponse(), trimStringFields(), validatePayloadKeys(), listLeavePolicies() (+3 more)

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

### Community 74 - "Community 74"
Cohesion: 0.19
Nodes (15): GET(), AttendanceMultiValidationError, AttendanceValidationError, createAttendanceRecord(), CreateAttendanceRecordDto, deleteAttendanceRecord(), getAttendanceRecordByCuid(), listAttendanceRecords() (+7 more)

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (12): GET(), POST(), POST(), successResponse(), checkIn(), checkOut(), AttendanceMultiValidationError, AttendanceValidationError (+4 more)

### Community 76 - "Community 76"
Cohesion: 0.24
Nodes (6): ./$types.js, getCodeClientError(), getNameClientError(), handleRowClick(), handleSubmit(), isInteractive()

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 79 - "Community 79"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 81 - "Community 81"
Cohesion: 0.14
Nodes (6): @lucide/svelte/icons/alert-triangle, $lib/confirmation.svelte.js, modalStack, stack, svelte/transition, @lucide/svelte/icons/x

### Community 82 - "Community 82"
Cohesion: 0.19
Nodes (6): ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, Role

### Community 83 - "Community 83"
Cohesion: 0.20
Nodes (3): AttendanceRecordFilters, CreateAttendanceRecordInput, UpdateAttendanceRecordInput

### Community 87 - "Community 87"
Cohesion: 0.50
Nodes (4): Development, `yarn build`, `yarn dev`, `yarn preview`

### Community 88 - "Community 88"
Cohesion: 0.17
Nodes (5): CompanyLocationCreateDTO, CompanyLocationUpdateDTO, rejectUnknownKeys(), validateCreatePayload(), validateUpdatePayload()

### Community 89 - "Community 89"
Cohesion: 0.22
Nodes (6): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, @lucide/svelte/icons/triangle-alert

### Community 93 - "Community 93"
Cohesion: 0.33
Nodes (4): $app/environment, toast, svelte-sonner, $lib/components/ui/toaster.svelte

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (4): Development, `yarn build`, `yarn dev`, `yarn preview`

## Knowledge Gaps
- **355 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+350 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Data Access Tests` to `Master Data DAO`, `Department Service DAO`, `Community 36`, `Community 38`, `Community 39`, `Community 40`, `Community 46`, `Community 47`, `Community 54`, `Community 56`, `Community 57`, `Community 60`, `Community 74`, `Community 75`, `Community 83`, `Community 84`, `Community 86`, `Community 88`, `Community 90`, `Community 92`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 89`, `Community 93`, `Package Dependencies`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dependencies & Icons` to `UI Components Index`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `errorResponse()` (e.g. with `DELETE()` and `GET()`) actually correct?**
  _`errorResponse()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _355 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.053194333066025126 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.08020050125313283 - nodes in this community are weakly interconnected._