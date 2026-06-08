# Graph Report - pieq-svelte-app-template  (2026-06-04)

## Corpus Check
- 99 files · ~20,707 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 479 nodes · 614 edges · 32 communities (26 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06bad3fd`
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 23 edges
2. `pieq-svelte-app-template` - 18 edges
3. `scripts` - 15 edges
4. `compilerOptions` - 11 edges
5. `Changes` - 11 edges
6. `getAppConfig()` - 8 edges
7. `validateUpdateSalaryComponent()` - 8 edges
8. `Harden `pieq-svelte-app-template` based on initial review` - 8 edges
9. `Scripts` - 8 edges
10. `createEmployee()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Window` --references--> `AppConfig`  [EXTRACTED]
  src/app.d.ts → src/lib/types/config.ts
- `createAuth()` --calls--> `getAuthConfig()`  [EXTRACTED]
  src/lib/server/auth.js → src/lib/server/config.js
- `load()` --calls--> `getAppConfig()`  [EXTRACTED]
  src/routes/+layout.server.ts → src/lib/server/config.js
- `load()` --calls--> `listEmployees()`  [EXTRACTED]
  src/routes/employees/+page.server.ts → src/lib/server/services/employee.service.ts
- `GET()` --calls--> `listEmployees()`  [EXTRACTED]
  src/routes/api/employees/+server.ts → src/lib/server/services/employee.service.ts

## Import Cycles
- None detected.

## Communities (32 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (24): GET(), PUT(), POST(), PUT(), SalaryComponentDto, serializeSalaryComponent(), BusinessValidationError, ComponentNotFoundError (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (30): $lib/types/salary-component, $lib/validators/salary-component, @lucide/svelte/icons/check, @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/more-vertical, @lucide/svelte/icons/pencil, @lucide/svelte/icons/plus, svelte/reactivity (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (40): 1. Clone and install dependencies, 2. Configure environment, 3. Set up the database, 4. Start the dev server, 5. Verify everything works, Adding a new feature, API reference — Employees, `APP_URL` per environment (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (22): svelte/animate, @lucide/svelte/icons/arrow-down, @lucide/svelte/icons/arrow-up, $lib/components, $lib/toast.svelte, ./$types, @lucide/svelte/icons/chevron-left, @lucide/svelte/icons/chevron-right (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (22): api, ensureApiInitialized(), request(), ApiConfig, getApiConfig(), getAppUrl(), getOidcConfig(), loadConfig() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (29): devDependencies, clsx, dotenv-cli, eslint, @eslint/compat, @eslint/js, eslint-plugin-svelte, @fontsource-variable/inter (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (26): dependencies, @auth/core, @auth/sveltekit, dotenv, pg, @prisma/adapter-pg, @prisma/client, name (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): Code quality, Common workflows, Database (Prisma), Development, Other, Quick reference, Scripts, Testing (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (12): load(), auth, createAuth(), appUrlFromEnv, buildIssuer(), clearConfigCache(), getAppConfig(), getAuthConfig() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (15): @lucide/svelte/icons/building-2, $lib/assets/favicon.svg, $lib/auth, ./layout.css, @lucide/svelte/icons/layout-dashboard, @lucide/svelte/icons/log-in, @lucide/svelte/icons/log-out, @lucide/svelte/icons/menu (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (3): load(), Toast, ToastStore

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (17): CreateEmployeeData, actions, load(), GET(), POST(), createClient(), db, getDb() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (4): WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (4): SALARY_COMPONENT_TYPE_LABELS, SALARY_COMPONENT_TYPE_OPTIONS, SALARY_COMPONENT_TYPES, SalaryComponentType

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (20): Changes, Harden `pieq-svelte-app-template` based on initial review, High-priority fixes (in this PR), Motivation, Out of scope (tracked as follow-ups), `README.md`, Reviewer notes, Risk & rollback (+12 more)

## Knowledge Gaps
- **209 isolated node(s):** `$schema`, `css`, `baseColor`, `components`, `utils` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 6` to `Community 4`, `Community 7`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `svelte` connect `Community 4` to `Community 6`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `db` connect `Community 14` to `Community 0`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `$schema`, `css`, `baseColor` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06431372549019608 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._