# Graph Report - pieq-svelte-app-template  (2026-06-16)

## Corpus Check
- 236 files · ~75,193 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1143 nodes · 1883 edges · 72 communities (58 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f8d830e8`
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
- [[_COMMUNITY_Community 10|Community 10]]
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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 36 edges
2. `mapToDb()` - 23 edges
3. `db` - 22 edges
4. `pieq-svelte-app-template` - 18 edges
5. `pieq-svelte-app-template` - 18 edges
6. `ValidationError` - 17 edges
7. `scripts` - 15 edges
8. `compilerOptions` - 11 edges
9. `Changes` - 11 edges
10. `compilerOptions` - 11 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `serializeSalaryComponent()`  [INFERRED]
  src/routes/api/salary-components/[cuid]/+server.ts → src/lib/server/serializers/salary-component.serializer.ts
- `GET()` --calls--> `listEmployees()`  [INFERRED]
  src/routes/api/employees/+server.ts → src/lib/server/services/employee.service.ts
- `PUT()` --calls--> `validateUpdateSalaryComponent()`  [INFERRED]
  src/routes/api/salary-components/[cuid]/+server.ts → src/lib/server/validators/salary-component.validator.ts
- `PUT()` --calls--> `validateUpdateSalaryStructure()`  [INFERRED]
  src/routes/api/salary-structures/[cuid]/+server.ts → src/lib/server/validators/salary-structure.validator.ts
- `POST()` --calls--> `validateCreateRevision()`  [INFERRED]
  src/routes/api/salary-structures/[cuid]/+server.ts → src/lib/server/validators/salary-structure.validator.ts

## Import Cycles
- None detected.

## Communities (72 total, 14 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.08
Nodes (41): GET(), PUT(), POST(), GET(), PUT(), POST(), requireAdmin(), requireAuth() (+33 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.22
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.14
Nodes (10): $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil (+2 more)

### Community 3 - "UI Components Core"
Cohesion: 0.09
Nodes (4): $lib/utils.js, @lucide/svelte/icons/check, svelte/elements, @lucide/svelte/icons/minus

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
Cohesion: 0.13
Nodes (15): scripts, build, check, check:watch, db:generate, db:migrate, db:push, db:studio (+7 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.10
Nodes (18): @lucide/svelte/icons/banknote, @lucide/svelte/icons/building-2, ./layout.css, $lib/assets/favicon.svg, ./layout.css, @lucide/svelte/icons/key-round, @lucide/svelte/icons/layout-dashboard, @lucide/svelte/icons/link (+10 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (10): CreateRevisionDto, CreateSalaryStructureDto, CreateSalaryStructureItemDto, DeleteSalaryStructureResponse, ListSalaryStructureResponse, MutationSalaryStructureResponse, SalaryStructure, SalaryStructureItem (+2 more)

### Community 11 - "Server Authentication"
Cohesion: 0.16
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.26
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
Cohesion: 0.16
Nodes (16): CreateEmployeeData, actions, load(), GET(), getErrorStatus(), POST(), createEmployee(), CreateEmployeeInput (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (6): DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 45 - "Community 45"
Cohesion: 0.07
Nodes (23): @lucide/svelte/icons/alert-triangle, @lucide/svelte/icons/check-circle, @lucide/svelte/icons/file-spreadsheet, availableMonths, currentYear, dragOver, employeesProcessed, filteredPayrolls (+15 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (8): $lib/server/serializers/salary-component.serializer, $lib/types/salary-structure, $lib/validators/salary-structure, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/external-link, @lucide/svelte/icons/git-branch, svelte/reactivity, @lucide/svelte/icons/trash-2

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 49 - "Community 49"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.30
Nodes (15): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.13
Nodes (19): findEmployeeByCuid(), serializeSalaryStructure(), ActiveStructureExistsError, assertComponentsValid(), assertEmployeeExists(), BusinessValidationError, createRevision(), createStructure() (+11 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (16): POST(), POST(), PUT(), validateAmount(), validateEffectiveDateRange(), validateEffectiveFrom(), COMPONENT_ALLOWED_KEYS, CREATE_ALLOWED_KEYS (+8 more)

### Community 54 - "Community 54"
Cohesion: 0.14
Nodes (12): ./$types, ./$types, averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees() (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (4): findByEmployeeCuid(), findItemsByStructureCuid(), findItemsByStructureCuids(), findMany()

### Community 56 - "Community 56"
Cohesion: 0.16
Nodes (9): @lucide/svelte/icons/arrow-left, $lib/assets/favicon.svg, $lib/toast.svelte, deductions, earnings, @lucide/svelte/icons/download, @lucide/svelte/icons/file-text, $app/navigation (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.06
Nodes (36): CreatePayrollUploadFailureDto, findEmployeeByCode(), MOCK_EMPLOYEES, MockEmployee, serializePayroll(), serializePayrollList(), computeSummary(), DuplicatePayrollError (+28 more)

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (3): findMany(), findManyByUploadCuid(), CreatePayrollDto

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (14): load(), load(), load(), ListPayrollResponse, ListPayrollUploadResponse, Payroll, PayrollDetailResponse, PayrollOrFailure (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.17
Nodes (10): dependencies, @auth/core, @auth/sveltekit, dotenv, html2canvas, jspdf, pg, @prisma/adapter-pg (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (7): serializePayrollUploadFailureList(), serializePayrollUpload(), serializePayrollUploadList(), getPayrollUploadByCuid(), getPayrollUploadFailures(), getPayrollUploads(), PayrollUploadNotFoundError

### Community 62 - "Community 62"
Cohesion: 0.27
Nodes (8): createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment(), UpdateDepartmentDto, validateDepartmentName()

### Community 63 - "Community 63"
Cohesion: 0.15
Nodes (10): $lib/components/ui/button/index.js, $lib/components/ui/calendar/index.js, $lib/components/ui/popover/index.js, @lucide/svelte/icons/calendar, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, @lucide/svelte/icons/chevrons-left, @lucide/svelte/icons/chevrons-right (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (10): createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById(), toPublicDesignation(), updateDesignation() (+2 more)

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (7): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, svelte-sonner, @lucide/svelte/icons/triangle-alert

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (3): load(), load(), load()

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (5): $lib/auth, $lib/auth, $app/paths, redirectTo, $app/state

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (3): $app/environment, toast, $lib/components/ui/toaster.svelte

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (5): $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/types/payroll, @lucide/svelte/icons/eye, @lucide/svelte/icons/filter

## Knowledge Gaps
- **371 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Data Access Tests` to `Community 64`, `Community 34`, `Community 36`, `Master Data DAO`, `Community 37`, `Community 39`, `Community 40`, `Department Service DAO`, `Community 38`, `Community 55`, `Community 57`, `Community 58`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `User` connect `API Client Configuration` to `API Endpoints`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 66`, `Community 69`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.07826546800634585 - nodes in this community are weakly interconnected._
- **Should `UI Components Index` be split into smaller, more focused modules?**
  _Cohesion score 0.13675213675213677 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.08525506638714186 - nodes in this community are weakly interconnected._