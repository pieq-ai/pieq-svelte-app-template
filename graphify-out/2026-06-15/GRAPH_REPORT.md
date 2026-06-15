# Graph Report - pieq-svelte-app-template  (2026-06-11)

## Corpus Check
- 247 files · ~59,642 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 944 nodes · 1545 edges · 68 communities (43 shown, 25 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f39ed2d1`
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
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 60 edges
2. `mapToDb()` - 29 edges
3. `db` - 26 edges
4. `ValidationError` - 20 edges
5. `pieq-svelte-app-template` - 18 edges
6. `$lib/components/common/DepartmentDropdown.svelte` - 16 edges
7. `$lib/components/common/DesignationDropdown.svelte` - 16 edges
8. `scripts` - 15 edges
9. `compilerOptions` - 11 edges
10. `Changes` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/departments/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/designations/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/employees/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `validateUpdateSalaryComponent()`  [INFERRED]
  src/routes/api/salary-components/[cuid]/+server.ts → src/lib/server/validators/salary-component.validator.ts
- `Locals` --references--> `User`  [EXTRACTED]
  src/app.d.ts → src/lib/types/user.ts

## Import Cycles
- 3-file cycle: `src/lib/components/ui/calendar/calendar-caption.svelte -> src/lib/components/ui/calendar/calendar.svelte -> src/lib/components/ui/calendar/index.ts -> src/lib/components/ui/calendar/calendar-caption.svelte`

## Communities (68 total, 25 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.05
Nodes (64): getMaster(), POST(), POST(), actions, load(), GET(), getErrorStatus(), POST() (+56 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.17
Nodes (3): CreateEmployeeData, CreateEmployeeInput, UpdateEmployeeInput

### Community 2 - "UI Components Index"
Cohesion: 0.12
Nodes (14): ./$types, averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge (+6 more)

### Community 4 - "Dependencies & Icons"
Cohesion: 0.05
Nodes (37): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui, clsx, dotenv-cli (+29 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.10
Nodes (25): load(), MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey (+17 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, name (+18 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.07
Nodes (22): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $app/environment, @lucide/svelte/icons/key-round, @lucide/svelte/icons/layout-dashboard, toast (+14 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.38
Nodes (10): createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById(), toPublicDesignation(), updateDesignation() (+2 more)

### Community 11 - "Server Authentication"
Cohesion: 0.16
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.29
Nodes (11): createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById(), toPublicPermission(), updatePermission() (+3 more)

### Community 14 - "System Role Service"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+4 more)

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

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (6): DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (5): ./$types, load(), CreateDepartmentInput, UpdateDepartmentInput, db

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.30
Nodes (8): createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment(), UpdateDepartmentDto, validateDepartmentName()

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (10): $lib/components/index.js, $lib/components/ui/checkbox/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/permissions/mock-permissions, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/chevron-up, @lucide/svelte/icons/filter (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.38
Nodes (10): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (12): $lib/master-data/master-config, backendError, errorMessage, getValidationError(), isLoading, isModalOpen, isSubmitting, isValueTouched (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.19
Nodes (6): $lib/components/ui/calendar/index.js, $lib/components/ui/input/index.js, $lib/components/ui/popover/index.js, $lib/components/ui/scroll-area/index.js, @lucide/svelte/icons/calendar, @internationalized/date

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (12): $lib/components/common/DepartmentDropdown.svelte, backendError, errorMessage, getValidationError(), inputValue, isLoading, isModalOpen, isSubmitting (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.18
Nodes (12): $lib/components/common/DesignationDropdown.svelte, backendError, errorMessage, getValidationError(), inputValue, isLoading, isModalOpen, isSubmitting (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (7): findByEmployeeCuid(), upsert(), UpsertEmploymentInput, UpsertLanguageInput, createClient(), getDb(), isValidClient()

### Community 56 - "Community 56"
Cohesion: 0.23
Nodes (5): getEmploymentByEmployeeCuid(), toPublicEmployment(), upsertEmployment(), UpsertEmploymentDto, validateEmail()

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (6): @lucide/svelte/icons/arrow-left, $lib/components, ./$types, @lucide/svelte/icons/edit, $app/navigation, @lucide/svelte/icons/trash

### Community 64 - "Community 64"
Cohesion: 0.40
Nodes (3): $lib/components/ui/button/index.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right

## Knowledge Gaps
- **272 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Community 39` to `Community 65`, `Data Access Tests`, `Community 66`, `Community 36`, `Master Data DAO`, `Community 37`, `Community 67`, `Community 40`, `Department Service DAO`, `Community 38`, `Community 52`, `Community 53`, `Community 54`, `Community 55`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 57`, `Package Dependencies`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `User` connect `API Client Configuration` to `API Endpoints`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `mapToDb()` (e.g. with `PUT()` and `PUT()`) actually correct?**
  _`mapToDb()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _272 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.05119214586255259 - nodes in this community are weakly interconnected._
- **Should `UI Components Index` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._