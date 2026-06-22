# Graph Report - pieq-svelte-app-template  (2026-06-22)

## Corpus Check
- 374 files · ~150,297 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1830 nodes · 3413 edges · 117 communities (97 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5d5f3d2`
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
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 63 edges
2. `db` - 46 edges
3. `ValidationError` - 31 edges
4. `mapToDb()` - 29 edges
5. `errorResponse()` - 22 edges
6. `$lib/components/employee/EmployeeWizard.svelte` - 20 edges
7. `successResponse()` - 20 edges
8. `pieq-svelte-app-template` - 18 edges
9. `pieq-svelte-app-template` - 18 edges
10. `$lib/components/organization_locations/LocationModal.svelte` - 17 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/designations/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/employees/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `POST()` --calls--> `mapToDb()`  [EXTRACTED]
  src/routes/api/designations/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [EXTRACTED]
  src/routes/api/employees/[cuid]/employment/+server.ts → src/lib/server/utils/mapping.ts
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/departments/[cuid]/+server.ts → src/lib/server/utils/mapping.ts

## Import Cycles
- 1-file cycle: `src/routes/leave-policies/+page.svelte -> src/routes/leave-policies/+page.svelte`
- 3-file cycle: `src/lib/components/ui/calendar/calendar-caption.svelte -> src/lib/components/ui/calendar/calendar.svelte -> src/lib/components/ui/calendar/index.ts -> src/lib/components/ui/calendar/calendar-caption.svelte`

## Communities (117 total, 20 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.24
Nodes (8): POST(), GET(), getStatus(), POST(), GET(), PUT(), mapToDb(), toDepartmentDTO()

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (32): @lucide/svelte/icons/alert-triangle, @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/api/local, $lib/api/locations, $lib/api/shifts, $lib/components/index.js (+24 more)

### Community 2 - "UI Components Index"
Cohesion: 0.10
Nodes (30): $lib/components, $lib/constants, $lib/permissions/mock-permissions, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component, $lib/components/ui/checkbox/index.js (+22 more)

### Community 4 - "Dependencies & Icons"
Cohesion: 0.06
Nodes (31): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+23 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.11
Nodes (23): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+15 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.11
Nodes (23): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+15 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.13
Nodes (15): scripts, build, check, check:watch, db:generate, db:migrate, db:push, db:studio (+7 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.07
Nodes (27): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $app/forms (+19 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.06
Nodes (37): ApplyLeavePayload, leavesApi, ApiError, extractErrorMessage(), localApi, localRequest(), ShiftAssignmentCreatePayload, ShiftAssignmentUpdatePayload (+29 more)

### Community 11 - "Server Authentication"
Cohesion: 0.20
Nodes (20): calculateLeaveDays(), isHoliday(), isWeekend(), PUBLIC_HOLIDAYS_2026, toLocalDateString(), accrueLeaves(), applyLeave(), ApplyLeaveInput (+12 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (17): $lib/master-data/master-config, $lib/master-data/master-config, backendError, displayOptions, errorMessage, getValidationError(), isDirty, isLoading (+9 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 16 - "Utility Functions"
Cohesion: 0.18
Nodes (3): UpsertBankDetailInput, bankDetailSchema, UpsertBankDetailDto

### Community 19 - "Mock Permissions"
Cohesion: 0.15
Nodes (14): ./$types, GET(), GET(), POST(), GET(), POST(), mapCountry(), mapLocation() (+6 more)

### Community 22 - "Server Routing"
Cohesion: 0.20
Nodes (3): UpsertAddressInput, addressSchema, UpsertAddressDto

### Community 23 - "Dashboard Routes"
Cohesion: 0.13
Nodes (4): @sveltejs/kit, handleError(), sendList(), sendUpdated()

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (13): Common workflows, Development, Other, Quick reference, Scripts, Testing, `yarn build`, `yarn dev` (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (13): createEmployee(), CreateEmployeeDto, CreateEmployeeInput, deleteEmployee(), EmployeeValidationError, generateNextEmployeeCode(), toPublicEmployee(), updateEmployee() (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (30): CreatePermissionInput, UpdatePermissionInput, CreateSystemRoleInput, UpdateSystemRoleInput, createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique() (+22 more)

### Community 36 - "Community 36"
Cohesion: 0.05
Nodes (13): getSubordinates(), load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (23): AddressData, BankData, DocumentData, EducationData, EmploymentDetailsData, ExperienceData, LanguageData, PersonalDetailsData (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (11): averageAge, filteredEmployees, formError, handleAddEmployee(), handleRowClick(), isInteractive(), isSubmitting, loadEmployees() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.05
Nodes (80): ./$types, ./$types, ./$types, GET(), POST(), GET(), POST(), createSuccessResponse() (+72 more)

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (13): @lucide/svelte/icons/arrow-left, $lib/components, $lib/stores/navigationGuard, $lib/utils/employeeValidationHelper, $lib/utils/errors.js, $lib/components/common/AsyncDropdown.svelte, $lib/components/employee/EmployeeWizard.svelte, $app/navigation (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (11): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (3): UpsertLanguageInput, languageSchema, UpsertLanguageDto

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
Cohesion: 0.06
Nodes (31): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+23 more)

### Community 54 - "Community 54"
Cohesion: 0.09
Nodes (8): calculateAge(), create(), CreateEmployeeData, CreateEmployeeInput, EmployeeCompatibility, remove(), update(), UpdateEmployeeInput

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (3): adapter, pool, prisma

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (11): GET(), getStatus(), POST(), DELETE(), GET(), getStatus(), PUT(), serialize() (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.11
Nodes (14): $lib/api/shift-assignments, $lib/types/shift-assignment, @lucide/svelte/icons/calendar-cog, activeCount, effectiveFromError, effectiveToError, filteredAssignments, handleSaveAssignment() (+6 more)

### Community 59 - "Community 59"
Cohesion: 0.16
Nodes (3): $lib/components/ui/button/index.js, $lib/utils.js, @lucide/svelte/icons/chevron-right

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (8): POST(), requireAdmin(), requireAuth(), requirePermission(), DELETE(), getStatus(), DELETE(), POST()

### Community 61 - "Community 61"
Cohesion: 0.13
Nodes (3): ../button/button.svelte, tailwind-variants, tailwind-variants

### Community 62 - "Community 62"
Cohesion: 0.05
Nodes (42): ./$types, ./$types, ./$types, ./$types, load(), load(), load(), CreateDepartmentInput (+34 more)

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (3): educationSchema, personalSchema, UpsertEducationDto

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (3): normalizeSpaces(), validateName(), validateRemarks()

### Community 65 - "Community 65"
Cohesion: 0.50
Nodes (4): Development, `yarn build`, `yarn dev`, `yarn preview`

### Community 66 - "Community 66"
Cohesion: 0.13
Nodes (15): scripts, build, check, check:watch, db:generate, db:migrate, db:push, db:studio (+7 more)

### Community 67 - "Community 67"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 68 - "Community 68"
Cohesion: 0.17
Nodes (3): UpsertDocumentInput, documentSchema, UpsertDocumentDto

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (4): POST(), GET(), PUT(), toDesignationDTO()

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (8): $lib/api/roles, $lib/types/role, activeCount, confirmDelete(), inactiveCount, loadRoles(), paginatedRoles, totalCount

### Community 73 - "Community 73"
Cohesion: 0.83
Nodes (3): getMaster(), getStatus(), PUT()

### Community 74 - "Community 74"
Cohesion: 0.24
Nodes (3): $lib/components/ui/popover/index.js, $lib/components/ui/scroll-area/index.js, @internationalized/date

### Community 76 - "Community 76"
Cohesion: 0.08
Nodes (23): RoleListResponse, sendDeleted(), sendUpdated(), DELETE(), parseCuid(), PATCH(), PUT(), DELETE() (+15 more)

### Community 77 - "Community 77"
Cohesion: 0.07
Nodes (13): @lucide/svelte/icons/alert-circle, $lib/api/leaves, @lucide/svelte/icons/check-circle, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/clock, modalStack, stack, @lucide/svelte/icons/file-text (+5 more)

### Community 78 - "Community 78"
Cohesion: 0.27
Nodes (9): $lib/components/ui/calendar/index.js, $lib/components/ui/input/index.js, @lucide/svelte/icons/calendar, autoFormatDate(), currentYear, handleBlur(), handleInput(), parseInputDate() (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.20
Nodes (7): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, mode-watcher, @lucide/svelte/icons/triangle-alert

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

### Community 84 - "Community 84"
Cohesion: 0.80
Nodes (4): GET(), getMaster(), getStatus(), POST()

### Community 88 - "Community 88"
Cohesion: 0.22
Nodes (9): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+1 more)

### Community 91 - "Community 91"
Cohesion: 0.25
Nodes (8): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (7): 1. Project Overview, 2. Implemented Modules, 3. UI & Design System, 4. Tech Stack, 5. Testing Status, 6. Architecture Notes, Current Project State (Codebase Reality)

### Community 94 - "Community 94"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 95 - "Community 95"
Cohesion: 0.29
Nodes (7): 1. Project Overview, 2. Implemented Modules, 3. UI & Design System, 4. Tech Stack, 5. Testing Status, 6. Architecture Notes, Current Project State (Codebase Reality)

### Community 96 - "Community 96"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 97 - "Community 97"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 101 - "Community 101"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 103 - "Community 103"
Cohesion: 0.27
Nodes (8): findByEmployeeCuid(), upsert(), UpsertEmploymentInput, employmentSchema, getEmploymentByEmployeeCuid(), toPublicEmployment(), upsertEmployment(), UpsertEmploymentDto

### Community 104 - "Community 104"
Cohesion: 0.20
Nodes (3): UpsertExperienceInput, experienceSchema, UpsertExperienceDto

### Community 105 - "Community 105"
Cohesion: 0.33
Nodes (5): compilerOptions, types, exclude, extends, include

### Community 106 - "Community 106"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 108 - "Community 108"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 109 - "Community 109"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 110 - "Community 110"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 111 - "Community 111"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 112 - "Community 112"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 113 - "Community 113"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 114 - "Community 114"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 115 - "Community 115"
Cohesion: 0.20
Nodes (3): UpsertSkillInput, skillSchema, UpsertSkillDto

### Community 118 - "Community 118"
Cohesion: 0.18
Nodes (11): GET(), getErrorStatus(), POST(), GET(), PUT(), GET(), PUT(), toEmployeeDTO() (+3 more)

### Community 122 - "Community 122"
Cohesion: 0.14
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 124 - "Community 124"
Cohesion: 0.19
Nodes (9): DELETE(), GET(), getStatus(), PUT(), GET(), getStatus(), POST(), ValidationError (+1 more)

### Community 128 - "Community 128"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 129 - "Community 129"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

## Knowledge Gaps
- **503 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+498 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Community 122` to `Master Data DAO`, `Department Service DAO`, `Designation Service DAO`, `Server Authentication`, `Permission Service`, `Utility Functions`, `Mock Permissions`, `Server Routing`, `Community 35`, `Community 36`, `Community 39`, `Community 44`, `Community 47`, `Community 48`, `Community 54`, `Community 62`, `Community 68`, `Community 69`, `Community 72`, `Community 75`, `Community 76`, `Community 85`, `Community 103`, `Community 104`, `Community 115`, `Community 123`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 52` to `Community 106`, `Community 61`, `Community 79`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 61`, `Community 109`, `Community 79`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _503 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08673469387755102 - nodes in this community are weakly interconnected._
- **Should `UI Components Index` be split into smaller, more focused modules?**
  _Cohesion score 0.09513742071881606 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._