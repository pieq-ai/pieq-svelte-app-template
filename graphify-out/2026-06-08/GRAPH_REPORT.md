# Graph Report - pieq-svelte-app-template  (2026-06-08)

## Corpus Check
- 163 files · ~40,388 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 655 nodes · 1051 edges · 44 communities (31 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `529942b5`
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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 33 edges
2. `mapToDb()` - 23 edges
3. `pieq-svelte-app-template` - 18 edges
4. `ValidationError` - 17 edges
5. `scripts` - 15 edges
6. `db` - 15 edges
7. `compilerOptions` - 11 edges
8. `Changes` - 11 edges
9. `getAppConfig()` - 8 edges
10. `Harden `pieq-svelte-app-template` based on initial review` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Locals` --references--> `User`  [EXTRACTED]
  src/app.d.ts → src/lib/types/user.ts
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `MasterDataOption` --references--> `MasterKey`  [EXTRACTED]
  src/lib/server/services/master-data.service.ts → src/lib/master-data/master-config.ts
- `createAuth()` --calls--> `getAuthConfig()`  [EXTRACTED]
  src/lib/server/auth.js → src/lib/server/config.js
- `load()` --calls--> `getAppConfig()`  [EXTRACTED]
  src/routes/+layout.server.ts → src/lib/server/config.js

## Import Cycles
- None detected.

## Communities (44 total, 13 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.08
Nodes (41): GET(), PUT(), POST(), GET(), PUT(), POST(), requireAdmin(), requireAuth() (+33 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.33
Nodes (4): createClient(), db, getDb(), isValidClient()

### Community 2 - "UI Components Index"
Cohesion: 0.10
Nodes (26): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/components, $lib/constants, $lib/master-data/master-config, $lib/permissions/mock-permissions, $lib/toast (+18 more)

### Community 3 - "UI Components Core"
Cohesion: 0.07
Nodes (10): $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/utils.js, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right, svelte/elements (+2 more)

### Community 4 - "Dependencies & Icons"
Cohesion: 0.05
Nodes (38): @lucide/svelte/icons/circle-check, @lucide/svelte/icons/info, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/octagon-x, devDependencies, bits-ui, clsx, dotenv-cli (+30 more)

### Community 5 - "Master Data DAO"
Cohesion: 0.12
Nodes (22): MasterCreateInput, MasterUpdateInput, masterKeys, { mockDbMethods }, getMasterConfig(), isMasterKey(), MasterConfig, masterConfigs (+14 more)

### Community 6 - "API Client Configuration"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, name (+18 more)

### Community 8 - "Layout & Toast"
Cohesion: 0.08
Nodes (20): @lucide/svelte/icons/building-2, $lib/auth, ./layout.css, $app/environment, @lucide/svelte/icons/key-round, @lucide/svelte/icons/layout-dashboard, toast, @lucide/svelte/icons/link (+12 more)

### Community 9 - "Department Service DAO"
Cohesion: 0.27
Nodes (8): createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment(), UpdateDepartmentDto, validateDepartmentName()

### Community 10 - "Designation Service DAO"
Cohesion: 0.33
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
Cohesion: 0.15
Nodes (16): ./$types, CreateEmployeeData, actions, load(), GET(), getErrorStatus(), POST(), createEmployee() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.28
Nodes (4): assignPermissionsToRole(), AssignRolePermissionsDto, removePermissionFromRoleByCuid2(), validateCuid2()

## Knowledge Gaps
- **211 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dependencies & Icons` to `Package Dependencies`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `User` connect `API Client Configuration` to `API Endpoints`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dependencies & Icons` to `UI Components Index`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.07826546800634585 - nodes in this community are weakly interconnected._
- **Should `UI Components Index` be split into smaller, more focused modules?**
  _Cohesion score 0.10042283298097252 - nodes in this community are weakly interconnected._
- **Should `UI Components Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
