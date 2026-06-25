<<<<<<< HEAD
# Graph Report - pieq-svelte-app-template  (2026-06-19)

## Corpus Check
- 227 files · ~74,889 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1148 nodes · 1895 edges · 66 communities (52 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19f90835`
=======
# Graph Report - pieq-svelte-app-template  (2026-06-20)

## Corpus Check
- 366 files · ~137,957 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1703 nodes · 3443 edges · 119 communities (95 shown, 24 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9d555d17`
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
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
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

## Communities (66 total, 14 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.06
Nodes (52): GET(), PUT(), POST(), GET(), PUT(), POST(), requireAdmin(), requireAuth() (+44 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.20
Nodes (5): CreateEmployeeData, createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.17
Nodes (9): $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/components, $lib/master-data/master-config, $lib/permissions/mock-permissions, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil (+1 more)

### Community 3 - "UI Components Core"
Cohesion: 0.08
Nodes (3): $lib/utils.js, svelte/elements, @lucide/svelte/icons/minus

### Community 4 - "Dependencies & Icons"
Cohesion: 0.05
Nodes (38): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui, clsx, dotenv-cli (+30 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+14 more)
=======
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
- [[_COMMUNITY_Community 84|Community 84]]
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
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 67 edges
2. `db` - 49 edges
3. `errorResponse()` - 36 edges
4. `mapToDb()` - 29 edges
5. `successResponse()` - 27 edges
6. `ValidationError` - 27 edges
7. `trimStringFields()` - 22 edges
8. `validatePayloadKeys()` - 22 edges
9. `$lib/components/employee/EmployeeWizard.svelte` - 20 edges
10. `pieq-svelte-app-template` - 18 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `mapToDb()`  [INFERRED]
  src/routes/api/employees/[cuid]/+server.ts → src/lib/server/utils/mapping.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/attendance-records/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/holidays/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/leave/policies/[cuid]/+server.ts → src/lib/server/response.ts
- `GET()` --calls--> `successResponse()`  [INFERRED]
  src/routes/api/leave/types/[cuid]/+server.ts → src/lib/server/response.ts

## Import Cycles
- 1-file cycle: `src/routes/leave-policies/+page.svelte -> src/routes/leave-policies/+page.svelte`
- 3-file cycle: `src/lib/components/ui/calendar/calendar-caption.svelte -> src/lib/components/ui/calendar/calendar.svelte -> src/lib/components/ui/calendar/index.ts -> src/lib/components/ui/calendar/calendar-caption.svelte`

## Communities (119 total, 24 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.15
Nodes (13): getMaster(), POST(), POST(), GET(), PUT(), GET(), PUT(), getStatus() (+5 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.11
Nodes (7): UpsertBankDetailInput, UpsertLanguageInput, UpsertSkillInput, createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.10
Nodes (29): $lib/constants, $lib/permissions/mock-permissions, $lib/toast, $lib/utils, $lib/api/local, $lib/api/locations, $lib/api/shifts, $lib/confirmation.svelte.js (+21 more)

### Community 4 - "Dependencies & Icons"
Cohesion: 0.06
Nodes (32): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+24 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.07
Nodes (39): GET(), create(), createAttendanceSource(), MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig (+31 more)
>>>>>>> main

### Community 6 - "API Client Configuration"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 7 - "Package Dependencies"
<<<<<<< HEAD
Cohesion: 0.05
Nodes (33): $lib/assets/favicon.svg, $lib/toast.svelte, @lucide/svelte/icons/download, dependencies, @auth/core, @auth/sveltekit, dotenv, html2canvas (+25 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.07
Nodes (25): @lucide/svelte/icons/banknote, @lucide/svelte/icons/building-2, $lib/auth, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css, $app/environment (+17 more)
=======
Cohesion: 0.13
Nodes (15): scripts, build, check, check:watch, db:generate, db:migrate, db:push, db:studio (+7 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.08
Nodes (24): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, $lib/components, ./layout.css, $lib/assets/favicon.svg, $lib/auth, ./layout.css (+16 more)
>>>>>>> main

### Community 9 - "Department Service DAO"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

<<<<<<< HEAD
### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (9): CreateRevisionDto, CreateSalaryStructureDto, CreateSalaryStructureItemDto, DeleteSalaryStructureResponse, ListSalaryStructureResponse, MutationSalaryStructureResponse, SalaryStructure, SalaryStructureItem (+1 more)

### Community 11 - "Server Authentication"
Cohesion: 0.16
=======
### Community 10 - "Designation Service DAO"
Cohesion: 0.12
Nodes (32): @lucide/svelte/icons/alert-circle, @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, if(), if(), $lib/types/salary-component, $lib/validators/salary-component (+24 more)

### Community 11 - "Server Authentication"
Cohesion: 0.15
>>>>>>> main
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 12 - "Component Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "Permission Service"
<<<<<<< HEAD
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
Cohesion: 0.20
Nodes (5): load(), load(), Toast, ToastStore, load()

### Community 31 - "Community 31"
Cohesion: 0.04
Nodes (44): 1. Clone and install dependencies, 1. Project Overview, 2. Configure environment, 2. Implemented Modules, 3. Set up the database, 3. UI & Design System, 4. Start the dev server, 4. Tech Stack (+36 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)
=======
Cohesion: 0.17
Nodes (17): GET(), deleteSuccessResponse(), AttendanceMultiValidationError, AttendanceValidationError, capitalize(), createAttendanceRecord(), CreateAttendanceRecordDto, deleteAttendanceRecord() (+9 more)

### Community 14 - "System Role Service"
Cohesion: 0.06
Nodes (11): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO (+3 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 16 - "Utility Functions"
Cohesion: 0.07
Nodes (23): AddressData, BankData, DocumentData, EducationData, EmploymentDetailsData, ExperienceData, LanguageData, PersonalDetailsData (+15 more)

### Community 22 - "Server Routing"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 23 - "Dashboard Routes"
Cohesion: 0.15
Nodes (19): GET(), formatHoliday(), createHoliday(), CreateHolidayInput, deleteHoliday(), getHolidayByCuid(), HolidayMultiValidationError, HolidayValidationError (+11 more)

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
Cohesion: 0.18
Nodes (16): ./$types, ./$types, actions, load(), GET(), getErrorStatus(), POST(), createEmployee() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (6): DELETE(), getStatus(), assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 39 - "Community 39"
Cohesion: 0.28
Nodes (3): CreatePayrollUploadFailureDto, serializePayrollUploadFailure(), getFailureByCuid()
=======
Cohesion: 0.14
Nodes (19): ./$types, ./$types, actions, load(), createEmployee(), CreateEmployeeDto, CreateEmployeeInput, deleteEmployee() (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (12): findByEmployeeCuid(), upsert(), UpsertEmploymentInput, calculateDistance(), GEOFENCE_CONFIG, AttendanceMultiValidationError, AttendanceValidationError, checkIn() (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.26
Nodes (12): create(), CreateHolidayData, deleteHoliday(), findByCuid(), findByDate(), findByDateExcludingCuid(), findByNameAndDate(), findByNameAndYear() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (17): formatLeaveType(), createLeaveType(), CreateLeaveTypeInput, deleteLeaveType(), getLeaveTypeByCuid(), LeaveMultiValidationError, LeaveValidationError, listLeaveTypes() (+9 more)

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (22): POST(), POST(), POST(), PUT(), POST(), GET(), POST(), createSuccessResponse() (+14 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (16): ./$types, ./$types, load(), load(), employmentSchema, getDepartments(), getDesignations(), getEmployeeByCuid2() (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (8): EmploymentTypeDTO, EmploymentTypeInput, HolidayDTO, HolidayInput, LeavePolicyDTO, LeavePolicyInput, LeaveTypeDTO, LeaveTypeInput
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
Cohesion: 0.13
Nodes (12): $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/server/serializers/salary-component.serializer, $lib/types/salary-structure, $lib/validators/salary-structure, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/external-link (+4 more)

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
Cohesion: 0.15
Nodes (11): averageAge, filteredEmployees, formError, handleAddEmployee(), isSubmitting, loadEmployees(), maxAge, successMessage (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (5): findByEmployeeCuid(), findItemsByStructureCuid(), findItemsByStructureCuids(), findMany(), UpdateSalaryStructureDto

### Community 56 - "Community 56"
Cohesion: 0.16
Nodes (8): @lucide/svelte/icons/arrow-left, $lib/types/payroll, deductions, earnings, @lucide/svelte/icons/eye, @lucide/svelte/icons/file-text, $app/navigation, $app/paths

### Community 57 - "Community 57"
Cohesion: 0.08
Nodes (33): findEmployeeByCode(), serializePayroll(), serializePayrollList(), computeSummary(), DuplicatePayrollError, getPayrollByCuid(), getPayrolls(), getPayrollsByUploadCuid() (+25 more)

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (3): findMany(), findManyByUploadCuid(), CreatePayrollDto

### Community 59 - "Community 59"
Cohesion: 0.16
Nodes (14): load(), load(), load(), ListPayrollResponse, ListPayrollUploadResponse, Payroll, PayrollDetailResponse, PayrollOrFailure (+6 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (7): serializePayrollUploadFailureList(), serializePayrollUpload(), serializePayrollUploadList(), getPayrollUploadByCuid(), getPayrollUploadFailures(), getPayrollUploads(), PayrollUploadNotFoundError

### Community 62 - "Community 62"
Cohesion: 0.27
Nodes (8): createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment(), UpdateDepartmentDto, validateDepartmentName()

### Community 63 - "Community 63"
Cohesion: 0.15
Nodes (10): $lib/components/ui/button/index.js, $lib/components/ui/calendar/index.js, $lib/components/ui/popover/index.js, @lucide/svelte/icons/calendar, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, @lucide/svelte/icons/chevrons-left, @lucide/svelte/icons/chevrons-right (+2 more)

## Knowledge Gaps
- **371 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
=======
Cohesion: 0.18
Nodes (12): @lucide/svelte/icons/arrow-left, $lib/components, $lib/stores/navigationGuard, $lib/utils/employeeValidationHelper, $lib/utils/errors.js, $lib/components/common/AsyncDropdown.svelte, $lib/components/employee/EmployeeWizard.svelte, $app/navigation (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.26
Nodes (11): formatLeavePolicy(), createLeavePolicy(), CreateLeavePolicyInput, deleteLeavePolicy(), getLeavePolicyByCuid(), updateLeavePolicy(), UpdateLeavePolicyInput, validateAndMapPolicyInput() (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (23): ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, $app/environment, toast, createDirtyChecker() (+15 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (13): Code quality, Common workflows, Development, Other, Quick reference, Scripts, `yarn build`, `yarn check` (+5 more)

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
Cohesion: 0.13
Nodes (4): @sveltejs/kit, handleError(), sendList(), sendUpdated()

### Community 55 - "Community 55"
Cohesion: 0.09
Nodes (7): bankDetailSchema, educationSchema, personalSchema, skillSchema, UpsertBankDetailDto, UpsertEducationDto, UpsertSkillDto

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (12): averageAge, filteredEmployees, formError, handleAddEmployee(), handleRowClick(), isInteractive(), isSubmitting, loadEmployees() (+4 more)

### Community 57 - "Community 57"
Cohesion: 0.30
Nodes (10): create(), CreateLeaveTypeData, deleteLeaveType(), findByCode(), findByCuid(), findByName(), findDuplicateCode(), findDuplicateName() (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.10
Nodes (17): $lib/master-data/master-config, $lib/master-data/master-config, backendError, displayOptions, errorMessage, getValidationError(), isDirty, isLoading (+9 more)

### Community 59 - "Community 59"
Cohesion: 0.15
Nodes (10): CreateDepartmentInput, UpdateDepartmentInput, createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment() (+2 more)

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
Cohesion: 0.07
Nodes (35): ./$types.js, activeTypesCount, confirmDiscard(), currentPage, description, editingType, filteredTypes, formError (+27 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (30): CreatePermissionInput, UpdatePermissionInput, CreateSystemRoleInput, UpdateSystemRoleInput, createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique() (+22 more)

### Community 76 - "Community 76"
Cohesion: 0.16
Nodes (13): CreateDesignationInput, UpdateDesignationInput, createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid(), getDesignationByCuid2() (+5 more)

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
Nodes (4): Testing, `yarn test`, `yarn test:e2e`, `yarn test:unit`

### Community 83 - "Community 83"
Cohesion: 0.29
Nodes (9): AttendanceRecordFilters, create(), CreateAttendanceRecordInput, deleteRecord(), findByCuid(), findByEmployeeAndDate(), list(), update() (+1 more)

### Community 84 - "Community 84"
Cohesion: 0.13
Nodes (6): CreateEmployeeData, CreateEmployeeInput, findUniqueByUuid, remove(), update(), UpdateEmployeeInput

### Community 86 - "Community 86"
Cohesion: 0.14
Nodes (3): normalizeSpaces(), validateName(), validateRemarks()

### Community 87 - "Community 87"
Cohesion: 0.09
Nodes (8): @lucide/svelte/icons/alert-triangle, $lib/components/ui/checkbox/index.js, @lucide/svelte/icons/chevron-up, $lib/components/common/ConfirmModal.svelte, modalStack, stack, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil

### Community 89 - "Community 89"
Cohesion: 0.17
Nodes (6): $lib/components/ui/calendar/index.js, $lib/components/ui/input/index.js, $lib/components/ui/popover/index.js, $lib/components/ui/scroll-area/index.js, @lucide/svelte/icons/calendar, @internationalized/date

### Community 92 - "Community 92"
Cohesion: 0.39
Nodes (6): create(), CreateAttendanceInput, findByEmployeeAndDate(), listByEmployee(), update(), UpdateAttendanceInput

### Community 93 - "Community 93"
Cohesion: 0.25
Nodes (11): GET(), getStatus(), POST(), DELETE(), GET(), getStatus(), PUT(), serialize() (+3 more)

### Community 94 - "Community 94"
Cohesion: 0.17
Nodes (3): UpsertDocumentInput, documentSchema, UpsertDocumentDto

### Community 95 - "Community 95"
Cohesion: 0.18
Nodes (8): $lib/api/roles, $lib/types/role, activeCount, confirmDelete(), inactiveCount, loadRoles(), paginatedRoles, totalCount

### Community 97 - "Community 97"
Cohesion: 0.27
Nodes (7): GET(), PUT(), GET(), PUT(), toEmployeeDTO(), sendDeleted(), sendItem()

### Community 98 - "Community 98"
Cohesion: 0.27
Nodes (5): requireAdmin(), requireAuth(), requirePermission(), DELETE(), getStatus()

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (8): DELETE(), GET(), getStatus(), PUT(), GET(), getStatus(), POST(), toSystemRoleDTO()

### Community 100 - "Community 100"
Cohesion: 0.22
Nodes (6): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, @lucide/svelte/icons/triangle-alert

### Community 101 - "Community 101"
Cohesion: 0.22
Nodes (9): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+1 more)

### Community 103 - "Community 103"
Cohesion: 0.29
Nodes (3): $lib/components/ui/button/index.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right

### Community 108 - "Community 108"
Cohesion: 0.33
Nodes (5): compilerOptions, types, exclude, extends, include

### Community 109 - "Community 109"
Cohesion: 0.60
Nodes (4): GET(), getErrorStatus(), POST(), sendCreated()

### Community 110 - "Community 110"
Cohesion: 0.80
Nodes (4): GET(), getMaster(), getStatus(), POST()

### Community 111 - "Community 111"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 115 - "Community 115"
Cohesion: 0.83
Nodes (3): GET(), getStatus(), POST()

### Community 116 - "Community 116"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

## Knowledge Gaps
- **444 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+439 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
>>>>>>> main

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

<<<<<<< HEAD
- **Why does `db` connect `Data Access Tests` to `Community 64`, `Community 65`, `Community 36`, `Master Data DAO`, `Community 37`, `Community 39`, `Community 40`, `Department Service DAO`, `Community 38`, `Community 55`, `Community 58`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `User` connect `API Client Configuration` to `API Endpoints`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Package Dependencies`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.06306306306306306 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.07987012987012987 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
=======
- **Why does `$lib/utils.js` connect `Community 91` to `UI Components Core`, `Community 67`, `Community 102`, `Community 103`, `Designation Service DAO`, `Community 87`, `Community 88`, `Community 89`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `db` connect `Data Access Tests` to `Master Data DAO`, `Department Service DAO`, `Permission Service`, `System Role Service`, `Community 35`, `Community 36`, `Community 46`, `Community 47`, `Community 48`, `Community 57`, `Community 59`, `Community 60`, `Community 75`, `Community 76`, `Community 83`, `Community 84`, `Community 90`, `Community 92`, `Community 94`, `Community 112`, `Community 113`, `Community 114`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Community 100`, `Community 111`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `errorResponse()` (e.g. with `GET()` and `DELETE()`) actually correct?**
  _`errorResponse()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _444 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `Data Access Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.10591133004926108 - nodes in this community are weakly interconnected._
>>>>>>> main
