# Graph Report - pieq-svelte-app-template  (2026-06-18)

## Corpus Check
- 339 files · ~115,651 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1394 nodes · 2658 edges · 97 communities (74 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aaea7d41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
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
- [[_COMMUNITY_Community 62|Community 62]]
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
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 63 edges
2. `db` - 43 edges
3. `mapToDb()` - 29 edges
4. `ValidationError` - 27 edges
5. `errorResponse()` - 22 edges
6. `$lib/components/employee/EmployeeWizard.svelte` - 20 edges
7. `pieq-svelte-app-template` - 18 edges
8. `successResponse()` - 16 edges
9. `scripts` - 15 edges
10. `trimStringFields()` - 13 edges

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

## Communities (97 total, 23 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (72): GET(), POST(), GET(), POST(), createSuccessResponse(), deleteSuccessResponse(), EmploymentTypeDTO, EmploymentTypeInput (+64 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (23): POST(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET(), PUT() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (11): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (23): ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, $app/environment, toast, createDirtyChecker() (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (19): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (17): $lib/components/index.js, $lib/components/ui, $lib/components/ui/checkbox/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/validators/employment-type.js, ./$types.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (23): AddressData, BankData, DocumentData, EducationData, EmploymentDetailsData, ExperienceData, LanguageData, PersonalDetailsData (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (5): @sveltejs/kit, handleError(), sendCreated(), sendList(), sendUpdated()

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (27): GET(), MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (31): devDependencies, bits-ui, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (20): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/api/local, $lib/api/locations, $lib/api/roles, $lib/api/shifts, $lib/confirmation.svelte.js (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (24): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./$types, ./layout.css, @lucide/svelte/icons/calendar-cog, @lucide/svelte/icons/clock, @lucide/svelte/icons/key-round (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.30
Nodes (8): @lucide/svelte/icons/arrow-left, $lib/master-data/master-config, $lib/stores/navigationGuard, $lib/utils/employeeValidationHelper, $lib/components/employee/EmployeeWizard.svelte, $app/navigation, svelte/reactivity, $lib/components/ui/toaster.svelte

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): POST(), POST(), POST(), GET(), getStatus(), POST(), GET(), PUT() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (9): dateErrors, defaultEmp, emp, errors, hasErrors, isDirty, isSubmitting, isTouched (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (3): normalizeSpaces(), validateName(), validateRemarks()

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (4): $lib/components/ui/button/index.js, $lib/utils.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (4): $lib/permissions/mock-permissions, $lib/components/common/AsyncDropdown.svelte, errorMessage, isLoading

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (13): sendDeleted(), sendUpdated(), DELETE(), parseCuid(), PATCH(), PUT(), DELETE(), parseCuid() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (4): CreateEmployeeInput, remove(), update(), UpdateEmployeeInput

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (15): scripts, build, check, check:watch, db:generate, db:migrate, db:push, db:studio (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (11): GET(), getStatus(), POST(), DELETE(), GET(), getStatus(), PUT(), serialize() (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.06
Nodes (35): ./$types, load(), load(), load(), CreateDepartmentInput, UpdateDepartmentInput, load(), Toast (+27 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): Code quality, Common workflows, Other, Quick reference, Scripts, Testing, `yarn check`, `yarn check:watch` (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.26
Nodes (11): createPermission(), CreatePermissionDto, deletePermission(), ensurePermissionKeyIsUnique(), getPermissionByCuid2(), getPermissionById(), toPublicPermission(), updatePermission() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.21
Nodes (4): ../button/button.svelte, $lib/components/ui/popover/index.js, $lib/components/ui/scroll-area/index.js, @internationalized/date

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (3): UpsertDocumentInput, documentSchema, UpsertDocumentDto

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.24
Nodes (6): ./$types.js, getCodeClientError(), getNameClientError(), handleRowClick(), handleSubmit(), isInteractive()

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (8): personalSchema, createEmployee(), CreateEmployeeDto, deleteEmployee(), generateNextEmployeeCode(), toPublicEmployee(), updateEmployee(), UpdateEmployeeDto

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (9): $lib/components/ui/calendar/index.js, $lib/components/ui/input/index.js, @lucide/svelte/icons/calendar, autoFormatDate(), currentYear, handleBlur(), handleInput(), parseInputDate() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (3): UpsertBankDetailInput, bankDetailSchema, UpsertBankDetailDto

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (3): UpsertLanguageInput, languageSchema, UpsertLanguageDto

### Community 48 - "Community 48"
Cohesion: 0.27
Nodes (7): GET(), PUT(), GET(), PUT(), toEmployeeDTO(), sendDeleted(), sendItem()

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (5): requireAdmin(), requireAuth(), requirePermission(), DELETE(), getStatus()

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (8): DELETE(), GET(), getStatus(), PUT(), GET(), getStatus(), POST(), toSystemRoleDTO()

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (6): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, mode-watcher, @lucide/svelte/icons/triangle-alert

### Community 52 - "Community 52"
Cohesion: 0.20
Nodes (3): UpsertAddressInput, addressSchema, UpsertAddressDto

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (4): educationSchema, skillSchema, UpsertEducationDto, UpsertSkillDto

### Community 54 - "Community 54"
Cohesion: 0.20
Nodes (3): UpsertExperienceInput, experienceSchema, UpsertExperienceDto

### Community 59 - "Community 59"
Cohesion: 0.13
Nodes (6): CreateSystemRoleInput, UpdateSystemRoleInput, assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (9): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+1 more)

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (7): 1. Project Overview, 2. Implemented Modules, 3. UI & Design System, 4. Tech Stack, 5. Testing Status, 6. Architecture Notes, Current Project State (Codebase Reality)

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (5): compilerOptions, types, exclude, extends, include

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 71 - "Community 71"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 73 - "Community 73"
Cohesion: 0.80
Nodes (4): GET(), getMaster(), getStatus(), POST()

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 75 - "Community 75"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 78 - "Community 78"
Cohesion: 0.83
Nodes (3): getMaster(), getStatus(), PUT()

### Community 79 - "Community 79"
Cohesion: 0.24
Nodes (8): findByEmployeeCuid(), upsert(), UpsertEmploymentInput, employmentSchema, toPublicEmployment(), upsertEmployment(), UpsertEmploymentDto, validateEmail()

### Community 83 - "Community 83"
Cohesion: 0.50
Nodes (4): Development, `yarn build`, `yarn dev`, `yarn preview`

### Community 85 - "Community 85"
Cohesion: 0.17
Nodes (6): @lucide/svelte/icons/alert-triangle, $lib/components, $lib/components/common/ConfirmModal.svelte, modalStack, stack, @lucide/svelte/icons/x

### Community 89 - "Community 89"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

## Knowledge Gaps
- **308 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+303 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Community 20` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 8`, `Community 23`, `Community 28`, `Community 32`, `Community 33`, `Community 38`, `Community 39`, `Community 43`, `Community 46`, `Community 47`, `Community 52`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 79`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 9` to `Community 27`, `Community 74`, `Community 51`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `$lib/utils.js` connect `Community 22` to `Community 37`, `Community 5`, `Community 45`, `Community 14`, `Community 17`, `Community 27`, `Community 60`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _308 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.054455445544554455 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06285714285714286 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._