# Graph Report - pieq-svelte-app-template  (2026-06-19)

## Corpus Check
- 235 files · ~97,435 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1154 nodes · 1913 edges · 56 communities (48 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f8fb7fbb`
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
- [[_COMMUNITY_Community 58|Community 58]]

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
  src/routes/api/employees/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [EXTRACTED]
  src/routes/api/employees/[cuid]/employment/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/departments/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/designations/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/master-data/[master]/[cuid]/+server.ts → src/lib/server/utils/mapping.ts

## Import Cycles
- 1-file cycle: `src/routes/leave-policies/+page.svelte -> src/routes/leave-policies/+page.svelte`
- 3-file cycle: `src/lib/components/ui/calendar/calendar-caption.svelte -> src/lib/components/ui/calendar/calendar.svelte -> src/lib/components/ui/calendar/index.ts -> src/lib/components/ui/calendar/calendar-caption.svelte`

## Communities (56 total, 8 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.06
Nodes (44): ./$types, getMaster(), POST(), POST(), POST(), requireAdmin(), requireAuth(), requirePermission() (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (12): @lucide/svelte/icons/alert-circle, $lib/api/leaves, @lucide/svelte/icons/calendar, @lucide/svelte/icons/check-circle, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, @lucide/svelte/icons/clock, @lucide/svelte/icons/file-text (+4 more)

### Community 2 - "UI Components Index"
Cohesion: 0.24
Nodes (19): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/constants, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+11 more)

### Community 3 - "UI Components Core"
Cohesion: 0.09
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

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (20): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/api/local, $lib/api/locations, $lib/api/roles, $lib/api/shifts, $lib/confirmation.svelte.js (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (24): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./$types, ./layout.css, @lucide/svelte/icons/calendar-cog, @lucide/svelte/icons/clock, @lucide/svelte/icons/key-round (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (7): @lucide/svelte/icons/arrow-left, $lib/stores/navigationGuard, $lib/utils/employeeValidationHelper, $lib/components/employee/EmployeeWizard.svelte, $app/navigation, svelte/reactivity, $lib/components/ui/toaster.svelte

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): POST(), POST(), POST(), GET(), getStatus(), POST(), GET(), PUT() (+6 more)

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

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (16): $lib/master-data/master-config, backendError, displayOptions, errorMessage, getValidationError(), isDirty, isLoading, isModalOpen (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (8): employmentSchema, toPublicEmployment(), upsertEmployment(), UpsertEmploymentDto, normalizeSpaces(), validateEmail(), validateName(), validateRemarks()

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (4): $lib/components/ui/button/index.js, $lib/utils.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right

### Community 24 - "Community 24"
Cohesion: 0.20
Nodes (3): UpsertSkillInput, skillSchema, UpsertSkillDto

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
Cohesion: 0.07
Nodes (20): CreatePermissionInput, UpdatePermissionInput, CreateRolePermissionInput, DELETE(), getStatus(), createPermission(), CreatePermissionDto, deletePermission() (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (15): @lucide/svelte/icons/alert-triangle, $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/components, $lib/confirmation.svelte.js, $lib/master-data/master-config, $lib/permissions/mock-permissions (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (33): ./$types, load(), load(), load(), load(), Toast, ToastStore, createDepartment() (+25 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): Code quality, Common workflows, Other, Quick reference, Scripts, Testing, `yarn check`, `yarn check:watch` (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (3): UpsertDocumentInput, documentSchema, UpsertDocumentDto

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (3): UpsertAddressInput, addressSchema, UpsertAddressDto

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (12): $lib/components/ui/calendar/index.js, $lib/components/ui/input/index.js, $lib/components/ui/popover/index.js, $lib/components/ui/scroll-area/index.js, @lucide/svelte/icons/calendar, autoFormatDate(), currentYear, handleBlur() (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (5): educationSchema, experienceSchema, personalSchema, UpsertEducationDto, UpsertExperienceDto

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (13): CreateSystemRoleInput, UpdateSystemRoleInput, createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (7): $app/forms, devEmail, devError, devMode, devPassword, redirectTo, $app/state

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (9): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (8): $lib/api/local, $lib/api/locations, $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/types/organization_location, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/filter

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (11): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): findByEmployeeCuid(), upsert(), UpsertEmploymentInput

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (31): ./$types, ./$types, ./$types, GET(), GET(), POST(), GET(), POST() (+23 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (3): UpsertLanguageInput, languageSchema, UpsertLanguageDto

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (16): ApplyLeavePayload, leavesApi, ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, Role (+8 more)

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (5): requireAdmin(), requireAuth(), requirePermission(), DELETE(), getStatus()

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 54 - "Community 54"
Cohesion: 0.06
Nodes (29): calculateLeaveDays(), isHoliday(), isWeekend(), PUBLIC_HOLIDAYS_2026, toLocalDateString(), calculateAge(), create(), CreateEmployeeData (+21 more)

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (3): adapter, pool, prisma

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (12): CreateDesignationInput, UpdateDesignationInput, createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById() (+4 more)

## Knowledge Gaps
- **330 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Community 54` to `Community 35`, `Community 36`, `Master Data DAO`, `Department Service DAO`, `Designation Service DAO`, `Community 44`, `Permission Service`, `Community 46`, `Community 47`, `Community 48`, `Community 58`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Package Dependencies`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dependencies & Icons` to `UI Components Index`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.06293706293706294 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.08563134978229318 - nodes in this community are weakly interconnected._