# Graph Report - pieq-svelte-app-template  (2026-06-11)

## Corpus Check
- 258 files · ~94,458 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1199 nodes · 2093 edges · 94 communities (68 shown, 26 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6b6c53b9`
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
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
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
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 36 edges
2. `db` - 33 edges
3. `mapToDb()` - 23 edges
4. `errorResponse()` - 22 edges
5. `pieq-svelte-app-template` - 18 edges
6. `ValidationError` - 17 edges
7. `pieq-svelte-app-template` - 17 edges
8. `successResponse()` - 16 edges
9. `scripts` - 15 edges
10. `trimStringFields()` - 14 edges

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

## Communities (94 total, 26 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (82): GET(), GET(), POST(), GET(), POST(), GET(), POST(), GET() (+74 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (4): $lib/utils.js, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, svelte/elements

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (28): dependencies, @auth/core, @auth/sveltekit, dotenv, @paralleldrive/cuid2, pg, @prisma/adapter-pg, @prisma/client (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (38): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui, clsx, dotenv-cli (+30 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (55): getMaster(), POST(), POST(), requireAdmin(), requireAuth(), requirePermission(), @sveltejs/kit, GET() (+47 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (6): Country, LocationCreatePayload, LocationListResponse, LocationUpdatePayload, State, CompanyLocation

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs, MasterKey, masterKeys (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (20): ShiftCreatePayload, ShiftListResponse, ShiftUpdatePayload, createShift(), getShiftByCuid(), parseTimeToDate(), updateShift(), activateShift() (+12 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (20): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/api/local, $lib/api/locations, $lib/api/roles, $lib/api/shifts, $lib/components (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (3): EmploymentType, LeavePolicy, LeaveType

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (11): Adding a new feature, Deployment, Keycloak client setup, pieq-svelte-app-template, Prerequisites, Project structure, Roadmap, Service worker (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (9): Common workflows, Development, Other, Quick reference, Scripts, `yarn build`, `yarn dev`, `yarn prepare` (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (7): RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams(), validateUpdatePayload()

### Community 44 - "Community 44"
Cohesion: 0.15
Nodes (13): Common workflows, Development, Other, Quick reference, Scripts, Testing, `yarn build`, `yarn dev` (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (8): createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment(), UpdateDepartmentDto, validateDepartmentName()

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (27): $lib/types/salary-component, $lib/validators/salary-component, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil, deductionsCount, earningsCount, formInitialIsActive, formInitialIsTaxable (+19 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (24): POST(), PUT(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError, DuplicateComponentError, GET() (+16 more)

### Community 49 - "Community 49"
Cohesion: 0.17
Nodes (8): averageAge, filteredEmployees, formError, isSubmitting, maxAge, successMessage, totalEmployees, $app/forms

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (5): CreateEmployeeData, createClient(), db, getDb(), isValidClient()

### Community 51 - "Community 51"
Cohesion: 0.11
Nodes (15): $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/validators/employment-type.js, ./$types.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/ellipsis-vertical, @lucide/svelte/icons/filter (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.19
Nodes (8): ./$types.js, getCodeClientError(), getNameClientError(), handleRowClick(), handleSubmit(), isInteractive(), toggleMenu(), updateMenuPosition()

### Community 53 - "Community 53"
Cohesion: 0.28
Nodes (13): sendDeleted(), sendUpdated(), DELETE(), parseCuid(), PATCH(), PUT(), DELETE(), parseCuid() (+5 more)

### Community 54 - "Community 54"
Cohesion: 0.06
Nodes (29): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, $lib/components/layout, $lib/components/ui, ./layout.css, @lucide/svelte/icons/calendar, @lucide/svelte/icons/calendar-cog (+21 more)

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (13): ./$types, actions, load(), GET(), POST(), createEmployee(), CreateEmployeeInput, EmployeeValidationError (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 58 - "Community 58"
Cohesion: 0.18
Nodes (5): CompanyLocationCreateDTO, CompanyLocationUpdateDTO, rejectUnknownKeys(), validateCreatePayload(), validateUpdatePayload()

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (10): createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById(), toPublicDesignation(), updateDesignation() (+2 more)

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (7): 1. Project Overview, 2. Implemented Modules, 3. UI & Design System, 4. Tech Stack, 5. Testing Status, 6. Architecture Notes, Current Project State (Codebase Reality)

### Community 64 - "Community 64"
Cohesion: 0.28
Nodes (4): assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (4): Testing, `yarn test`, `yarn test:e2e`, `yarn test:unit`

### Community 73 - "Community 73"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 79 - "Community 79"
Cohesion: 0.29
Nodes (7): Authentication (Keycloak + Auth.js), Database and Prisma, Employees example (end to end), High-level request flow, How the setup works, Layered architecture, Runtime config (`window.__PIEQ_CONFIG__`)

### Community 80 - "Community 80"
Cohesion: 0.33
Nodes (6): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Quick start

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (5): `APP_URL` per environment, Environment variables, Required for authentication (Keycloak sign-in), Required for database features, Required (read by `getAppConfig()` on every server load)

### Community 82 - "Community 82"
Cohesion: 0.40
Nodes (5): `Cannot read properties of undefined (reading 'create')` or `'findMany'`, Empty employee list / database errors, Keycloak redirect error, Port mismatch / auth redirect fails, Troubleshooting

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (5): Database (Prisma), `yarn db:generate`, `yarn db:migrate`, `yarn db:push`, `yarn db:studio`

### Community 87 - "Community 87"
Cohesion: 0.67
Nodes (3): API reference — Employees, GET — list employees, POST — create employee

### Community 88 - "Community 88"
Cohesion: 0.19
Nodes (6): ApiError, extractErrorMessage(), localApi, localRequest(), RoleListResponse, Role

### Community 89 - "Community 89"
Cohesion: 0.29
Nodes (11): createSystemRole(), CreateSystemRoleDto, deleteSystemRole(), ensureRoleNameIsUnique(), getSystemRoleByCuid2(), getSystemRoleById(), toPublicSystemRole(), updateSystemRole() (+3 more)

### Community 92 - "Community 92"
Cohesion: 0.50
Nodes (4): Code quality, `yarn check`, `yarn check:watch`, `yarn lint`

## Knowledge Gaps
- **333 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Community 50` to `Community 0`, `Community 1`, `Community 58`, `Community 6`, `Community 77`, `Community 14`, `Community 47`, `Community 48`, `Community 15`, `Community 86`, `Community 90`, `Community 91`, `Community 60`, `Community 61`, `Community 62`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 5` to `Community 3`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `$lib/utils.js` connect `Community 2` to `Community 51`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05088265835929388 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._