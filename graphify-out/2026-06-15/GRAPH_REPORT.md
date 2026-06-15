# Graph Report - pieq-svelte-app-template  (2026-06-15)

## Corpus Check
- 229 files · ~85,334 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1101 nodes · 1816 edges · 58 communities (49 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c218d80d`
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
- [[_COMMUNITY_VSCode Settings|VSCode Settings]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
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
- [[_COMMUNITY_Community 58|Community 58]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 33 edges
2. `db` - 30 edges
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
- `PUT()` --calls--> `validateUpdateSalaryComponent()`  [INFERRED]
  src/routes/api/salary-components/[cuid]/+server.ts → src/lib/server/validators/salary-component.validator.ts
- `Locals` --references--> `User`  [EXTRACTED]
  src/app.d.ts → src/lib/types/user.ts
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts

## Import Cycles
- None detected.

## Communities (58 total, 9 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.07
Nodes (43): getMaster(), POST(), POST(), POST(), requireAdmin(), requireAuth(), requirePermission(), GET() (+35 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.19
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.25
Nodes (17): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/toast, $lib/utils, $lib/api/local, $lib/api/locations, $lib/api/roles (+9 more)

### Community 3 - "UI Components Core"
Cohesion: 0.09
Nodes (5): $lib/utils.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-right, svelte/elements, @lucide/svelte/icons/minus

### Community 4 - "Dependencies & Icons"
Cohesion: 0.04
Nodes (41): @lucide/svelte/icons/circle-check, $app/environment, @lucide/svelte/icons/info, toast, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui (+33 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+14 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.11
Nodes (23): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+15 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+19 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.09
Nodes (22): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/key-round (+14 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.14
Nodes (10): CreateDepartmentInput, UpdateDepartmentInput, createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment() (+2 more)

### Community 11 - "Server Authentication"
Cohesion: 0.15
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.07
Nodes (20): CreatePermissionInput, UpdatePermissionInput, CreateRolePermissionInput, DELETE(), getStatus(), createPermission(), CreatePermissionDto, deletePermission() (+12 more)

### Community 14 - "System Role Service"
Cohesion: 0.14
Nodes (13): CreateSystemRoleInput, UpdateSystemRoleInput, createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById() (+5 more)

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
Cohesion: 0.17
Nodes (16): ./$types, ./$types, actions, load(), GET(), getErrorStatus(), POST(), createEmployee() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.20
Nodes (9): @lucide/svelte/icons/alert-circle, $lib/api/leaves, @lucide/svelte/icons/calendar, @lucide/svelte/icons/check-circle, @lucide/svelte/icons/clock, @lucide/svelte/icons/file-text, @lucide/svelte/icons/trash-2, @lucide/svelte/icons/upload (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (13): $lib/components, $lib/constants, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, @lucide/svelte/icons/chevron-left (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (4): @lucide/svelte/icons/alert-triangle, $lib/confirmation.svelte.js, svelte/transition, @lucide/svelte/icons/x

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (4): calculateAge(), create(), CreateEmployeeData, EmployeeCompatibility

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (11): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 46 - "Community 46"
Cohesion: 0.11
Nodes (28): GET(), GET(), POST(), GET(), POST(), mapCountry(), mapLocation(), mapRole() (+20 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (16): ApplyLeavePayload, leavesApi, ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, Role (+8 more)

### Community 49 - "Community 49"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (12): CreateDesignationInput, UpdateDesignationInput, createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById() (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (16): calculateLeaveDays(), isHoliday(), isWeekend(), PUBLIC_HOLIDAYS_2026, toLocalDateString(), accrueLeaves(), applyLeave(), ApplyLeaveInput (+8 more)

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (3): adapter, pool, prisma

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (10): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (8): $lib/types/salary-component, $lib/validators/salary-component, $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/types/salary-component, $lib/validators/salary-component, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/filter

## Knowledge Gaps
- **326 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Data Access Tests` to `Community 37`, `Master Data DAO`, `Community 39`, `Community 40`, `Department Service DAO`, `Designation Service DAO`, `Community 44`, `Permission Service`, `Community 46`, `Community 47`, `Community 48`, `System Role Service`, `Community 52`, `Community 54`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `User` connect `API Client Configuration` to `API Endpoints`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Package Dependencies`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.06758832565284179 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.08635703918722787 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._