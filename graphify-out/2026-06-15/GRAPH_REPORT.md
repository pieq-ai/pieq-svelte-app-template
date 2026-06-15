# Graph Report - pieq-svelte-app-template  (2026-06-15)

## Corpus Check
- 262 files · ~66,772 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1033 nodes · 1814 edges · 79 communities (54 shown, 25 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ebc9709b`
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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 60 edges
2. `ValidationError` - 29 edges
3. `mapToDb()` - 29 edges
4. `db` - 25 edges
5. `sendUpdated()` - 19 edges
6. `$lib/components/common/DepartmentDropdown.svelte` - 18 edges
7. `$lib/components/common/DesignationDropdown.svelte` - 18 edges
8. `pieq-svelte-app-template` - 18 edges
9. `$lib/components/employee/EmployeeWizard.svelte` - 17 edges
10. `sendList()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/departments/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/designations/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/employees/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/permissions/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/system-roles/[cuid]/+server.ts → src/lib/server/utils/mapping.ts

## Import Cycles
- 3-file cycle: `src/lib/components/ui/calendar/calendar-caption.svelte -> src/lib/components/ui/calendar/calendar.svelte -> src/lib/components/ui/calendar/index.ts -> src/lib/components/ui/calendar/calendar-caption.svelte`

## Communities (79 total, 25 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.14
Nodes (16): getMaster(), POST(), POST(), GET(), PUT(), GET(), PUT(), getStatus() (+8 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.17
Nodes (3): CreateEmployeeData, CreateEmployeeInput, UpdateEmployeeInput

### Community 2 - "UI Components Index"
Cohesion: 0.14
Nodes (12): ./$types, averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge (+4 more)

### Community 4 - "Dependencies & Icons"
Cohesion: 0.05
Nodes (37): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui, clsx, dotenv-cli (+29 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.08
Nodes (34): ./$types, load(), MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs (+26 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, name (+18 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.09
Nodes (18): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/key-round, @lucide/svelte/icons/layout-dashboard, @lucide/svelte/icons/link, @lucide/svelte/icons/log-in (+10 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.36
Nodes (11): createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid(), getDesignationByCuid2(), getDesignationById(), toPublicDesignation() (+3 more)

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
Cohesion: 0.13
Nodes (24): GET(), PUT(), GET(), PUT(), GET(), PUT(), GET(), PUT() (+16 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (3): CreateDepartmentInput, UpdateDepartmentInput, db

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (6): DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 45 - "Community 45"
Cohesion: 0.12
Nodes (13): $lib/components/index.js, $lib/components/ui/checkbox/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/permissions/mock-permissions, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/chevron-up, @lucide/svelte/icons/eye (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.38
Nodes (9): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (4): ../button/button.svelte, $lib/components/ui/popover/index.js, $lib/components/ui/scroll-area/index.js, @internationalized/date

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (12): $lib/components/common/DepartmentDropdown.svelte, backendError, errorMessage, getValidationError(), inputValue, isLoading, isModalOpen, isSubmitting (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.18
Nodes (12): $lib/components/common/DesignationDropdown.svelte, backendError, errorMessage, getValidationError(), inputValue, isLoading, isModalOpen, isSubmitting (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (5): UpsertLanguageInput, UpsertSkillInput, createClient(), getDb(), isValidClient()

### Community 56 - "Community 56"
Cohesion: 0.12
Nodes (8): getEmploymentByEmployeeCuid(), toPublicEmployment(), upsertEmployment(), UpsertEmploymentDto, normalizeSpaces(), validateEmail(), validateName(), validateRemarks()

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (13): @lucide/svelte/icons/arrow-left, $lib/components, $lib/utils/employeeValidationHelper, @lucide/svelte/icons/edit, $lib/components/employee/EmployeeWizard.svelte, $app/navigation, @lucide/svelte/icons/plus, svelte/reactivity (+5 more)

### Community 64 - "Community 64"
Cohesion: 0.40
Nodes (3): $lib/components/ui/button/index.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (11): createEmployee(), CreateEmployeeDto, CreateEmployeeInput, deleteEmployee(), generateNextEmployeeCode(), getEmployeeByCuid2(), toPublicEmployee(), updateEmployee() (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (6): dateErrors, employment, errors, hasErrors, isSubmitting, isTouched

### Community 68 - "Community 68"
Cohesion: 0.60
Nodes (5): GET(), getErrorStatus(), POST(), listEmployees(), sendCreated()

### Community 69 - "Community 69"
Cohesion: 0.27
Nodes (9): $lib/components/ui/calendar/index.js, $lib/components/ui/input/index.js, @lucide/svelte/icons/calendar, autoFormatDate(), currentYear, handleBlur(), handleInput(), parseInputDate() (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.67
Nodes (3): findByEmployeeCuid(), upsert(), UpsertEmploymentInput

### Community 71 - "Community 71"
Cohesion: 0.11
Nodes (13): SectionErrors, validateAadharRule(), validateConfirmation(), validateDob(), validateDoj(), validateDropdown(), validateEmail(), validateEmployment() (+5 more)

### Community 73 - "Community 73"
Cohesion: 0.19
Nodes (14): ./$types, load(), GET(), getStatus(), POST(), DELETE(), GET(), getStatus() (+6 more)

### Community 74 - "Community 74"
Cohesion: 0.15
Nodes (12): $lib/master-data/master-config, backendError, errorMessage, getValidationError(), isLoading, isModalOpen, isSubmitting, isValueTouched (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (8): GET(), getStatus(), POST(), DELETE(), GET(), getStatus(), PUT(), toPermissionDTO()

### Community 76 - "Community 76"
Cohesion: 0.60
Nodes (3): requireAdmin(), requireAuth(), requirePermission()

### Community 77 - "Community 77"
Cohesion: 0.80
Nodes (4): GET(), getMaster(), getStatus(), POST()

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (3): EmployeeValidationError, mockedDao, sampleEmployee

## Knowledge Gaps
- **282 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+277 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 57`, `Package Dependencies`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `db` connect `Community 39` to `Data Access Tests`, `Community 67`, `Community 36`, `Master Data DAO`, `Community 70`, `Community 37`, `Community 38`, `Community 73`, `Department Service DAO`, `Community 44`, `Community 47`, `Community 52`, `Community 53`, `Community 55`, `Community 59`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `User` connect `API Client Configuration` to `Community 76`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _282 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._
- **Should `UI Components Index` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._