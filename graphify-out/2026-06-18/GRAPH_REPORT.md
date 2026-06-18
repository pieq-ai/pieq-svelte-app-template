# Graph Report - pieq-svelte-app-template  (2026-06-18)

## Corpus Check
- 235 files · ~95,190 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1152 nodes · 1909 edges · 65 communities (57 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c08b604`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Endpoints|API Endpoints]]
- [[_COMMUNITY_Community 1|Community 1]]
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
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Linter & Svelte Config|Linter & Svelte Config]]
- [[_COMMUNITY_Constants|Constants]]
- [[_COMMUNITY_Mock Permissions|Mock Permissions]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_Server Routing|Server Routing]]
- [[_COMMUNITY_VSCode Settings|VSCode Settings]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 33 edges
2. `db` - 32 edges
3. `mapToDb()` - 23 edges
4. `ValidationError` - 21 edges
5. `pieq-svelte-app-template` - 18 edges
6. `pieq-svelte-app-template` - 18 edges
7. `scripts` - 15 edges
8. `sendList()` - 11 edges
9. `compilerOptions` - 11 edges
10. `Changes` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/departments/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/designations/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/master-data/[master]/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/permissions/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/system-roles/[cuid]/+server.ts → src/lib/server/utils/mapping.ts

## Import Cycles
- None detected.

## Communities (65 total, 8 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.15
Nodes (13): POST(), POST(), GET(), getStatus(), POST(), GET(), PUT(), GET() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (10): @lucide/svelte/icons/alert-circle, $lib/api/leaves, @lucide/svelte/icons/calendar, @lucide/svelte/icons/check-circle, @lucide/svelte/icons/clock, @lucide/svelte/icons/file-text, svelte/reactivity, @lucide/svelte/icons/trash-2 (+2 more)

### Community 2 - "UI Components Index"
Cohesion: 0.20
Nodes (22): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+14 more)

### Community 3 - "UI Components Core"
Cohesion: 0.10
Nodes (3): $lib/utils.js, svelte/elements, @lucide/svelte/icons/minus

### Community 4 - "Dependencies & Icons"
Cohesion: 0.04
Nodes (41): @lucide/svelte/icons/circle-check, $app/environment, @lucide/svelte/icons/info, toast, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui (+33 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.11
Nodes (24): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+16 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.11
Nodes (23): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+15 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+19 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.10
Nodes (20): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/key-round (+12 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.14
Nodes (10): CreateDepartmentInput, UpdateDepartmentInput, createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment() (+2 more)

### Community 11 - "Server Authentication"
Cohesion: 0.14
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.14
Nodes (13): CreatePermissionInput, UpdatePermissionInput, createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById() (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (8): @lucide/svelte/icons/alert-triangle, $lib/components/index.js, $lib/confirmation.svelte.js, @lucide/svelte/icons/check, @lucide/svelte/icons/filter, @lucide/svelte/icons/search, svelte/transition, @lucide/svelte/icons/x

### Community 15 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 16 - "Utility Functions"
Cohesion: 0.29
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 22 - "Server Routing"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 31 - "Community 31"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (20): ./$types, ./$types, calculateAge(), create(), CreateEmployeeData, EmployeeCompatibility, actions, load() (+12 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (20): CreateRolePermissionInput, CreateSystemRoleInput, UpdateSystemRoleInput, DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2() (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (7): $app/forms, devEmail, devError, devMode, devPassword, redirectTo, $app/state

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (9): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (14): $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/components, $lib/components/ui/dropdown-menu/index.js, $lib/master-data/master-config, $lib/permissions/mock-permissions, @lucide/svelte/icons/chevron-down (+6 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (4): getMaster(), getStatus(), PUT(), ValidationError

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (17): ApplyLeavePayload, leavesApi, ApiError, extractErrorMessage(), localApi, localRequest(), Country, LocationCreatePayload (+9 more)

### Community 45 - "Community 45"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (31): ./$types, ./$types, ./$types, GET(), GET(), POST(), GET(), POST() (+23 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (10): RoleListResponse, Role, RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams() (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 54 - "Community 54"
Cohesion: 0.14
Nodes (24): ./$types, calculateLeaveDays(), isHoliday(), isWeekend(), PUBLIC_HOLIDAYS_2026, toLocalDateString(), POST(), accrueLeaves() (+16 more)

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (3): adapter, pool, prisma

### Community 57 - "Community 57"
Cohesion: 0.60
Nodes (5): GET(), getMaster(), getStatus(), POST(), toMasterDataDTO()

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (12): CreateDesignationInput, UpdateDesignationInput, createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById() (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.15
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 60 - "Community 60"
Cohesion: 0.60
Nodes (5): DELETE(), GET(), getStatus(), PUT(), toPermissionDTO()

### Community 61 - "Community 61"
Cohesion: 0.60
Nodes (5): DELETE(), GET(), getStatus(), PUT(), toSystemRoleDTO()

### Community 62 - "Community 62"
Cohesion: 0.60
Nodes (3): requireAdmin(), requireAuth(), requirePermission()

### Community 63 - "Community 63"
Cohesion: 0.83
Nodes (3): GET(), getStatus(), POST()

### Community 64 - "Community 64"
Cohesion: 0.83
Nodes (3): GET(), getStatus(), POST()

## Knowledge Gaps
- **330 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Community 59` to `Community 34`, `Community 35`, `Community 36`, `Master Data DAO`, `Community 40`, `Department Service DAO`, `Designation Service DAO`, `Permission Service`, `Community 46`, `Community 47`, `Community 48`, `Community 52`, `Community 54`, `Community 58`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Package Dependencies`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dependencies & Icons` to `UI Components Index`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.09693877551020408 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `Master Data DAO` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._