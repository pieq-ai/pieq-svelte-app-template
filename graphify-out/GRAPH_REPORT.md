# Graph Report - pieq-svelte-app-template  (2026-06-04)

## Corpus Check
- 131 files · ~66,042 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1030 nodes · 1288 edges · 49 communities (36 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46a61e29`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Views & Modals|UI Views & Modals]]
- [[_COMMUNITY_REST API Endpoint Handlers|REST API Endpoint Handlers]]
- [[_COMMUNITY_shadcn UI Components|shadcn UI Components]]
- [[_COMMUNITY_App Client Configuration & Types|App Client Configuration & Types]]
- [[_COMMUNITY_Organization Location Management|Organization Location Management]]
- [[_COMMUNITY_Development Dependencies|Development Dependencies]]
- [[_COMMUNITY_Shift Management|Shift Management]]
- [[_COMMUNITY_Project Dependencies & Scripts|Project Dependencies & Scripts]]
- [[_COMMUNITY_Lucide Icons & Layouts|Lucide Icons & Layouts]]
- [[_COMMUNITY_Role Management|Role Management]]
- [[_COMMUNITY_Auth Server Hook & Configuration|Auth Server Hook & Configuration]]
- [[_COMMUNITY_Employee DB Services & Tests|Employee DB Services & Tests]]
- [[_COMMUNITY_shadcn Configuration|shadcn Configuration]]
- [[_COMMUNITY_TypeScript Compiler Options|TypeScript Compiler Options]]
- [[_COMMUNITY_Toast Notification Management|Toast Notification Management]]
- [[_COMMUNITY_Utility Helpers|Utility Helpers]]
- [[_COMMUNITY_ESLint & Svelte Configurations|ESLint & Svelte Configurations]]
- [[_COMMUNITY_Confirmation Modals|Confirmation Modals]]
- [[_COMMUNITY_OIDC Constants & Helpers|OIDC Constants & Helpers]]
- [[_COMMUNITY_Service Worker Caching|Service Worker Caching]]
- [[_COMMUNITY_App Entrypoint Template|App Entrypoint Template]]
- [[_COMMUNITY_Architecture Overview|Architecture Overview]]
- [[_COMMUNITY_Agent Config Documents|Agent Config Documents]]
- [[_COMMUNITY_Employees Demo Docs|Employees Demo Docs]]
- [[_COMMUNITY_Error Entrypoint Page|Error Entrypoint Page]]
- [[_COMMUNITY_Robots Configuration|Robots Configuration]]
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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 23 edges
2. `pieq-svelte-app-template` - 18 edges
3. `scripts` - 15 edges
4. `db` - 13 edges
5. `sendList()` - 11 edges
6. `compilerOptions` - 11 edges
7. `Changes` - 11 edges
8. `sendUpdated()` - 9 edges
9. `getAppConfig()` - 8 edges
10. `Harden `pieq-svelte-app-template` based on initial review` - 8 edges

## Surprising Connections (you probably didn't know these)
- `SvelteKit HTML Entrypoint` --references--> `App Favicon Image`  [INFERRED]
  src/app.html → src/lib/assets/favicon.svg
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `createAuth()` --calls--> `getAuthConfig()`  [EXTRACTED]
  src/lib/server/auth.js → src/lib/server/config.js
- `load()` --calls--> `getAppConfig()`  [EXTRACTED]
  src/routes/+layout.server.ts → src/lib/server/config.js
- `GET()` --calls--> `sendList()`  [EXTRACTED]
  src/routes/api/countries/+server.ts → src/lib/server/response.ts

## Import Cycles
- 3-file cycle: `src/generated/prisma/commonInputTypes.ts -> src/generated/prisma/internal/prismaNamespace.ts -> src/generated/prisma/models.ts -> src/generated/prisma/commonInputTypes.ts`
- 3-file cycle: `src/generated/prisma/internal/prismaNamespace.ts -> src/generated/prisma/models.ts -> src/generated/prisma/models/CompanyLocation.ts -> src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `src/generated/prisma/internal/prismaNamespace.ts -> src/generated/prisma/models.ts -> src/generated/prisma/models/Country.ts -> src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `src/generated/prisma/internal/prismaNamespace.ts -> src/generated/prisma/models.ts -> src/generated/prisma/models/Role.ts -> src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `src/generated/prisma/internal/prismaNamespace.ts -> src/generated/prisma/models.ts -> src/generated/prisma/models/Shift.ts -> src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `src/generated/prisma/internal/prismaNamespace.ts -> src/generated/prisma/models.ts -> src/generated/prisma/models/State.ts -> src/generated/prisma/internal/prismaNamespace.ts`

## Communities (49 total, 13 thin omitted)

### Community 0 - "UI Views & Modals"
Cohesion: 0.16
Nodes (12): $lib/confirmation.svelte.js, $lib/types/organization_location, $lib/types/role, $lib/types/shift, @lucide/svelte/icons/check, @lucide/svelte/icons/clock, @lucide/svelte/icons/loader-circle, @lucide/svelte/icons/more-vertical (+4 more)

### Community 1 - "REST API Endpoint Handlers"
Cohesion: 0.05
Nodes (45): GET(), getShiftByCuid(), updateShift(), DELETE(), parseCuid(), PATCH(), PUT(), GET() (+37 more)

### Community 3 - "App Client Configuration & Types"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 4 - "Organization Location Management"
Cohesion: 0.10
Nodes (6): CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO, rejectUnknownKeys(), validateCreatePayload(), validateUpdatePayload()

### Community 5 - "Development Dependencies"
Cohesion: 0.04
Nodes (48): devDependencies, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte, @fontsource-variable/inter (+40 more)

### Community 6 - "Shift Management"
Cohesion: 0.02
Nodes (107): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, Boolean, BooleanFieldRefInput (+99 more)

### Community 7 - "Project Dependencies & Scripts"
Cohesion: 0.09
Nodes (18): config, LogOptions, PrismaClient, PrismaClientConstructor, dependencies, @auth/core, @auth/sveltekit, dotenv (+10 more)

### Community 8 - "Lucide Icons & Layouts"
Cohesion: 0.20
Nodes (9): @lucide/svelte/icons/building-2, @lucide/svelte/icons/home, @lucide/svelte/icons/layout-dashboard, @lucide/svelte/icons/log-in, @lucide/svelte/icons/log-out, @lucide/svelte/icons/map-pin, $app/paths, $app/stores (+1 more)

### Community 9 - "Role Management"
Cohesion: 0.14
Nodes (8): Role, RoleCreateDTO, RoleUpdateDTO, rejectUnknownKeys(), sanitizeString(), validateCreatePayload(), validatePaginationParams(), validateUpdatePayload()

### Community 10 - "Auth Server Hook & Configuration"
Cohesion: 0.16
Nodes (13): Keycloak Authentication via Auth.js, load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig() (+5 more)

### Community 11 - "Employee DB Services & Tests"
Cohesion: 0.05
Nodes (40): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Adding a new feature, API reference — Employees, `APP_URL` per environment (+32 more)

### Community 12 - "shadcn Configuration"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 13 - "TypeScript Compiler Options"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Toast Notification Management"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastManager

### Community 15 - "Utility Helpers"
Cohesion: 0.33
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 35 - "Community 35"
Cohesion: 0.03
Nodes (64): AggregateRole, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, GetRoleAggregateType, GetRoleGroupByPayload, IntFieldUpdateOperationsInput, Prisma__RoleClient, RoleAggregateArgs (+56 more)

### Community 38 - "Community 38"
Cohesion: 0.03
Nodes (61): AggregateCompanyLocation, CompanyLocationAggregateArgs, CompanyLocationAvgAggregateInputType, CompanyLocationAvgAggregateOutputType, CompanyLocationAvgOrderByAggregateInput, CompanyLocationCountAggregateInputType, CompanyLocationCountAggregateOutputType, CompanyLocationCountArgs (+53 more)

### Community 39 - "Community 39"
Cohesion: 0.03
Nodes (61): AggregateShift, DecimalFieldUpdateOperationsInput, GetShiftAggregateType, GetShiftGroupByPayload, Prisma__ShiftClient, ShiftAggregateArgs, ShiftAvgAggregateInputType, ShiftAvgAggregateOutputType (+53 more)

### Community 40 - "Community 40"
Cohesion: 0.03
Nodes (61): AggregateState, GetStateAggregateType, GetStateGroupByPayload, Prisma__StateClient, StateAggregateArgs, StateAvgAggregateInputType, StateAvgAggregateOutputType, StateAvgOrderByAggregateInput (+53 more)

### Community 41 - "Community 41"
Cohesion: 0.03
Nodes (60): AggregateCountry, CountryAggregateArgs, CountryAvgAggregateInputType, CountryAvgAggregateOutputType, CountryAvgOrderByAggregateInput, CountryCountAggregateInputType, CountryCountAggregateOutputType, CountryCountArgs (+52 more)

### Community 42 - "Community 42"
Cohesion: 0.04
Nodes (43): CompanyLocationScalarFieldEnum, CountryScalarFieldEnum, ModelName, NullsOrder, NullTypes, QueryMode, RoleScalarFieldEnum, ShiftScalarFieldEnum (+35 more)

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (14): ./$types, CreateEmployeeData, actions, load(), GET(), POST(), createEmployee(), CreateEmployeeInput (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (11): averageAge, closeAddModal(), filteredEmployees, formError, handleAddEmployee(), isSubmitting, maxAge, successMessage (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (7): $lib/assets/favicon.svg, $lib/auth, $lib/components, ./layout.css, @lucide/svelte/icons/menu, redirectTo, $app/state

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (7): @lucide/svelte/icons/alert-circle, @lucide/svelte/icons/alert-triangle, svelte/animate, $lib/toast.svelte.js, @lucide/svelte/icons/info, svelte/transition, @lucide/svelte/icons/x

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (6): @lucide/svelte/icons/bell, @lucide/svelte/icons/calendar, @lucide/svelte/icons/palette, @lucide/svelte/icons/settings, @lucide/svelte/icons/shield, @lucide/svelte/icons/user-circle

## Knowledge Gaps
- **655 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+650 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Project Dependencies & Scripts` to `Development Dependencies`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `PrismaClient` connect `Project Dependencies & Scripts` to `REST API Endpoint Handlers`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _655 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `REST API Endpoint Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.053946053946053944 - nodes in this community are weakly interconnected._
- **Should `shadcn UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Should `App Client Configuration & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `Organization Location Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._