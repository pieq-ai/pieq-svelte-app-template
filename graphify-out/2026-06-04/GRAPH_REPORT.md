# Graph Report - .  (2026-06-03)

## Corpus Check
- Corpus is ~37,762 words - fits in a single context window. You may not need a graph.

## Summary
- 536 nodes · 883 edges · 31 communities (26 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 33 edges
2. `mapToDb()` - 23 edges
3. `scripts` - 15 edges
4. `db` - 15 edges
5. `compilerOptions` - 11 edges
6. `getAppConfig()` - 8 edges
7. `getMasterConfig()` - 7 edges
8. `updateMasterData()` - 7 edges
9. `aliases` - 6 edges
10. `getAuthConfig()` - 6 edges

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

## Communities (31 total, 5 thin omitted)

### Community 0 - "API Endpoints"
Cohesion: 0.07
Nodes (44): GET(), PUT(), POST(), GET(), PUT(), POST(), GET(), getErrorStatus() (+36 more)

### Community 1 - "Data Access Tests"
Cohesion: 0.05
Nodes (16): CreateEmployeeData, CreatePermissionInput, UpdatePermissionInput, CreateRolePermissionInput, CreateSystemRoleInput, UpdateSystemRoleInput, DELETE(), getStatus() (+8 more)

### Community 2 - "UI Components Index"
Cohesion: 0.08
Nodes (24): @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, @lucide/svelte/icons/arrow-up-down, $lib/components, $lib/components/index.js, $lib/components/ui/dropdown-menu/index.js, $lib/master-data/master-config, $lib/permissions/mock-permissions (+16 more)

### Community 3 - "UI Components Core"
Cohesion: 0.09
Nodes (4): $lib/utils.js, @lucide/svelte/icons/check, svelte/elements, @lucide/svelte/icons/minus

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
Cohesion: 0.14
Nodes (10): CreateDepartmentInput, UpdateDepartmentInput, createDepartment(), CreateDepartmentDto, deleteDepartment(), getDepartmentByCuid2(), toPublicDepartment(), updateDepartment() (+2 more)

### Community 10 - "Designation Service DAO"
Cohesion: 0.15
Nodes (12): CreateDesignationInput, UpdateDesignationInput, createDesignation(), CreateDesignationDto, deleteDesignation(), ensureDesignationNameIsUnique(), getDesignationByCuid2(), getDesignationById() (+4 more)

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

## Knowledge Gaps
- **128 isolated node(s):** `css.lint.unknownAtRules`, `$schema`, `css`, `baseColor`, `components` (+123 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `API Client Configuration` to `API Endpoints`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencies & Icons` to `Package Dependencies`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `svelte` connect `Dependencies & Icons` to `UI Components Index`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `css.lint.unknownAtRules`, `$schema`, `css` to the rest of the system?**
  _128 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.06696428571428571 - nodes in this community are weakly interconnected._
- **Should `Data Access Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.0531986531986532 - nodes in this community are weakly interconnected._
- **Should `UI Components Index` be split into smaller, more focused modules?**
  _Cohesion score 0.07993966817496229 - nodes in this community are weakly interconnected._