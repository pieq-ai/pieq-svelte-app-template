<<<<<<< HEAD
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
=======
# Graph Report - pieq-svelte-app-template  (2026-06-18)

## Corpus Check
- 274 files · ~109,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1316 nodes · 2600 edges · 95 communities (81 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4380485b`
>>>>>>> main
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
<<<<<<< HEAD
- [[_COMMUNITY_Community 10|Community 10]]
=======
- [[_COMMUNITY_Designation Service DAO|Designation Service DAO]]
>>>>>>> main
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
<<<<<<< HEAD
=======
- [[_COMMUNITY_Dashboard Routes|Dashboard Routes]]
>>>>>>> main
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
<<<<<<< HEAD
- [[_COMMUNITY_Community 59|Community 59]]
=======
>>>>>>> main
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
<<<<<<< HEAD
- [[_COMMUNITY_Community 67|Community 67]]
=======
>>>>>>> main
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
<<<<<<< HEAD

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
=======
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
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 98|Community 98]]

## God Nodes (most connected - your core abstractions)
1. `db` - 42 edges
2. `$lib/utils.js` - 40 edges
3. `errorResponse()` - 36 edges
4. `successResponse()` - 27 edges
5. `mapToDb()` - 23 edges
6. `trimStringFields()` - 22 edges
7. `validatePayloadKeys()` - 22 edges
8. `pieq-svelte-app-template` - 18 edges
9. `pieq-svelte-app-template` - 18 edges
10. `ValidationError` - 17 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/attendance-records/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/leave/policies/[cuid]/+server.ts → src/lib/server/response.ts
- `DELETE()` --calls--> `errorResponse()`  [INFERRED]
  src/routes/api/attendance-records/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `errorResponse()`  [INFERRED]
  src/routes/api/attendance-records/[cuid]/+server.ts → src/lib/server/response.ts
- `DELETE()` --calls--> `errorResponse()`  [INFERRED]
  src/routes/api/leave/policies/[cuid]/+server.ts → src/lib/server/response.ts

## Import Cycles
- 1-file cycle: `src/routes/leave-policies/+page.svelte -> src/routes/leave-policies/+page.svelte`

## Communities (95 total, 14 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.05
Nodes (61): getMaster(), POST(), POST(), requireAdmin(), requireAuth(), requirePermission(), GET(), getMaster() (+53 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.08
Nodes (9): CreateDepartmentInput, UpdateDepartmentInput, CreateDesignationInput, UpdateDesignationInput, CreateEmployeeData, createClient(), db, getDb() (+1 more)

### Community 2 - "UI Components Index"
Cohesion: 0.16
Nodes (24): @lucide/svelte/icons/arrow-up, $lib/constants, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/toast, $lib/types/salary-component, $lib/utils, $lib/validators/salary-component (+16 more)

### Community 3 - "UI Components Core"
Cohesion: 0.08
Nodes (4): $lib/utils.js, @lucide/svelte/icons/chevron-right, svelte/elements, @lucide/svelte/icons/minus
>>>>>>> main

### Community 4 - "Dependencies & Icons"
Cohesion: 0.06
Nodes (31): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+23 more)

### Community 5 - "Master Data DAO"
<<<<<<< HEAD
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+14 more)
=======
Cohesion: 0.11
Nodes (24): create(), createAttendanceSource(), MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs (+16 more)
>>>>>>> main

### Community 6 - "API Client Configuration"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 7 - "Package Dependencies"
<<<<<<< HEAD
Cohesion: 0.13
Nodes (15): scripts, build, check, check:watch, db:generate, db:migrate, db:push, db:studio (+7 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.10
Nodes (18): @lucide/svelte/icons/banknote, @lucide/svelte/icons/building-2, ./layout.css, $lib/assets/favicon.svg, ./layout.css, @lucide/svelte/icons/key-round, @lucide/svelte/icons/layout-dashboard, @lucide/svelte/icons/link (+10 more)
=======
Cohesion: 0.07
Nodes (28): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+20 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.08
Nodes (24): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/calendar (+16 more)
>>>>>>> main

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

<<<<<<< HEAD
### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (10): CreateRevisionDto, CreateSalaryStructureDto, CreateSalaryStructureItemDto, DeleteSalaryStructureResponse, ListSalaryStructureResponse, MutationSalaryStructureResponse, SalaryStructure, SalaryStructureItem (+2 more)

### Community 11 - "Server Authentication"
Cohesion: 0.16
=======
### Community 10 - "Designation Service DAO"
Cohesion: 0.21
Nodes (20): @lucide/svelte/icons/arrow-down, if(), $lib/components/index.js, $lib/components/ui, $lib/components/ui/dropdown-menu/index.js, $lib/validators/employment-type.js, ./$types, ./$types (+12 more)

### Community 11 - "Server Authentication"
Cohesion: 0.15
>>>>>>> main
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
<<<<<<< HEAD
Cohesion: 0.26
Nodes (11): createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById(), toPublicPermission(), updatePermission() (+3 more)

### Community 14 - "System Role Service"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+4 more)
=======
Cohesion: 0.18
Nodes (16): GET(), POST(), AttendanceMultiValidationError, AttendanceValidationError, createAttendanceRecord(), CreateAttendanceRecordDto, deleteAttendanceRecord(), getAttendanceRecordByCuid() (+8 more)

### Community 14 - "System Role Service"
Cohesion: 0.20
Nodes (6): createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), ShiftCreateDTO, ShiftUpdateDTO

### Community 15 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)
>>>>>>> main

### Community 16 - "Utility Functions"
Cohesion: 0.29
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

<<<<<<< HEAD
### Community 31 - "Community 31"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)
=======
### Community 22 - "Server Routing"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 23 - "Dashboard Routes"
Cohesion: 0.17
Nodes (16): GET(), POST(), createHoliday(), CreateHolidayInput, deleteHoliday(), HolidayMultiValidationError, HolidayValidationError, listHolidays() (+8 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (13): Common workflows, Development, Other, Quick reference, Scripts, Testing, `yarn build`, `yarn dev` (+5 more)
>>>>>>> main

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 34 - "Community 34"
<<<<<<< HEAD
Cohesion: 0.16
Nodes (16): CreateEmployeeData, actions, load(), GET(), getErrorStatus(), POST(), createEmployee(), CreateEmployeeInput (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (6): DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()
=======
Cohesion: 0.17
Nodes (16): ./$types, ./$types, actions, load(), GET(), getErrorStatus(), POST(), createEmployee() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (9): @lucide/svelte/icons/alert-triangle, $lib/components, $lib/components, $lib/confirmation.svelte.js, @lucide/svelte/icons/chevron-left, modalStack, stack, @lucide/svelte/icons/more-vertical (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.26
Nodes (12): create(), CreateHolidayData, deleteHoliday(), findByCuid(), findByDate(), findByDateExcludingCuid(), findByNameAndDate(), findByNameAndYear() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (14): createLeaveType(), CreateLeaveTypeInput, deleteLeaveType(), LeaveMultiValidationError, LeaveValidationError, listLeaveTypes(), updateLeaveType(), UpdateLeaveTypeInput (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.30
Nodes (8): calculateDistance(), GEOFENCE_CONFIG, AttendanceMultiValidationError, checkIn(), checkOut(), getEmployeeHistory(), getOrCreateWebSource(), getTodayStatus()

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (4): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, Shift

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (24): GET(), @sveltejs/kit, GET(), POST(), GET(), POST(), EmploymentTypeDTO, EmploymentTypeInput (+16 more)
>>>>>>> main

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 44 - "Community 44"
<<<<<<< HEAD
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
=======
Cohesion: 0.06
Nodes (11): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.19
Nodes (16): GET(), POST(), createSuccessResponse(), formatLeavePolicy(), createLeavePolicy(), CreateLeavePolicyInput, deleteLeavePolicy(), getLeavePolicyByCuid() (+8 more)

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (9): activateShift(), createShift(), formatTimeToHHMMSS(), parseTimeToDate(), updateShift(), rejectUnknownKeys(), validateCreatePayload(), validatePaginationParams() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (7): RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams(), validateUpdatePayload()

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (13): Common workflows, Development, Other, Quick reference, Scripts, Testing, `yarn build`, `yarn dev` (+5 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 52 - "Community 52"
Cohesion: 0.28
Nodes (13): sendDeleted(), sendUpdated(), DELETE(), parseCuid(), PATCH(), PUT(), DELETE(), parseCuid() (+5 more)

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.19
Nodes (7): @lucide/svelte/icons/alert-circle, @lucide/svelte/icons/arrow-up-down, if(), $lib/geofence.js, ./$types, @lucide/svelte/icons/check-circle-2, @lucide/svelte/icons/clock

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (10): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.30
Nodes (10): create(), CreateLeaveTypeData, deleteLeaveType(), findByCode(), findByCuid(), findByName(), findDuplicateCode(), findDuplicateName() (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.19
Nodes (6): ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, Role

### Community 60 - "Community 60"
Cohesion: 0.39
Nodes (7): create(), CreateLeavePolicyData, deletePolicy(), findActivePolicyForEmploymentType(), findByCuid(), list(), update()

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
Cohesion: 0.32
Nodes (11): ./$types.js, confirmDiscard(), getCodeClientError(), getNameClientError(), handleCloseRequest(), handleRowClick(), handleSort(), handleSubmit() (+3 more)

### Community 75 - "Community 75"
Cohesion: 0.30
Nodes (8): POST(), POST(), PUT(), trimStringFields(), validatePayloadKeys(), checkIn(), checkOut(), AttendanceValidationError

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 79 - "Community 79"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

### Community 83 - "Community 83"
Cohesion: 0.29
Nodes (9): AttendanceRecordFilters, create(), CreateAttendanceRecordInput, deleteRecord(), findByCuid(), findByEmployeeAndDate(), list(), update() (+1 more)

### Community 84 - "Community 84"
Cohesion: 0.29
Nodes (11): createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById(), toPublicPermission(), updatePermission() (+3 more)

### Community 86 - "Community 86"
Cohesion: 0.12
Nodes (6): CreatePermissionInput, UpdatePermissionInput, assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 89 - "Community 89"
Cohesion: 0.22
Nodes (6): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, @lucide/svelte/icons/triangle-alert

### Community 92 - "Community 92"
Cohesion: 0.39
Nodes (6): create(), CreateAttendanceInput, findByEmployeeAndDate(), listByEmployee(), update(), UpdateAttendanceInput

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (4): $app/environment, toast, svelte-sonner, $lib/components/ui/toaster.svelte

### Community 98 - "Community 98"
Cohesion: 0.26
Nodes (16): deleteSuccessResponse(), errorResponse(), formatHoliday(), formatLeaveType(), successResponse(), updateSuccessResponse(), getHolidayByCuid(), getLeaveTypeByCuid() (+8 more)

## Knowledge Gaps
- **353 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+348 more)
>>>>>>> main
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

<<<<<<< HEAD
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
=======
- **Why does `db` connect `Data Access Tests` to `Master Data DAO`, `Department Service DAO`, `Permission Service`, `System Role Service`, `Community 36`, `Community 38`, `Community 40`, `Community 44`, `Community 46`, `Community 47`, `Community 48`, `Community 57`, `Community 59`, `Community 60`, `Community 83`, `Community 86`, `Community 87`, `Community 90`, `Community 92`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `$lib/utils.js` connect `UI Components Core` to `Community 67`, `Designation Service DAO`, `Community 35`, `Community 55`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 89`, `Community 95`, `Package Dependencies`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `errorResponse()` (e.g. with `GET()` and `DELETE()`) actually correct?**
  _`errorResponse()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.050686641697877656 - nodes in this community are weakly interconnected._
- **Should `Data Access Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._
>>>>>>> main
