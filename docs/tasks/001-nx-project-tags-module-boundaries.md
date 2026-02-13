# Task: Add Nx Project Tags & Enforce Module Boundaries

## Description

All `project.json` files currently have `"tags": []` and the ESLint `@nx/enforce-module-boundaries` rule uses a wildcard (`sourceTag: '*'` with `onlyDependOnLibsWithTags: ['*']`), which effectively disables boundary enforcement. This means any project can import from any other project, silently violating the Clean Architecture dependency flow (`UI → Application → Domain ← Infrastructure`).

## Status

- **Identified**: February 13, 2026
- **Status**: Completed
- **Priority**: High
- **Effort**: Low
- **Completed**: February 13, 2026
- **Verification**: `pnpm lint`, `pnpm nx affected:test`, `pnpm nx test pos`, `pnpm nx test api`, `pnpm nx test domain`

## Recommended Agent

- **Agent**: `nx-engineer`

## Current State

### Project Tags (all empty)

| Project        | File                             | Tags |
| -------------- | -------------------------------- | ---- |
| `pos`          | `apps/pos/project.json`          | `[]` |
| `api`          | `apps/api/project.json`          | `[]` |
| `native`       | `apps/native/project.json`       | `[]` |
| `domain`       | `libs/domain/project.json`       | `[]` |
| `shared-types` | `libs/shared/types/project.json` | `[]` |
| `shared-utils` | `libs/shared/utils/project.json` | `[]` |

### Current ESLint Rule (no-op)

```js
// eslint.config.mjs
depConstraints: [
  {
    sourceTag: '*',
    onlyDependOnLibsWithTags: ['*'],
  },
],
```

## Impact

- No compile-time or lint-time protection against wrong-direction imports
- A UI component could directly import Prisma types, or the API could import Angular code — the linter would not flag it
- Architecture erosion happens silently over time, especially with multiple contributors

## Proposed Solution

### Step 1: Define Tag Taxonomy

Use a two-dimensional tagging scheme: `scope` (which app/domain) and `type` (architectural layer).

```
pos         → tags: ["scope:pos", "type:app"]
api         → tags: ["scope:api", "type:app"]
native      → tags: ["scope:native", "type:app"]
domain      → tags: ["scope:shared", "type:domain"]
shared-types → tags: ["scope:shared", "type:types"]
shared-utils → tags: ["scope:shared", "type:utils"]
```

### Step 2: Update Each `project.json`

**`apps/pos/project.json`:**

```json
"tags": ["scope:pos", "type:app"]
```

**`apps/api/project.json`:**

```json
"tags": ["scope:api", "type:app"]
```

**`apps/native/project.json`:**

```json
"tags": ["scope:native", "type:app"]
```

**`libs/domain/project.json`:**

```json
"tags": ["scope:shared", "type:domain"]
```

**`libs/shared/types/project.json`:**

```json
"tags": ["scope:shared", "type:types"]
```

**`libs/shared/utils/project.json`:**

```json
"tags": ["scope:shared", "type:utils"]
```

### Step 3: Update ESLint Boundary Rules

```js
// eslint.config.mjs
depConstraints: [
  // Apps can depend on domain, types, and utils
  { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:domain', 'type:types', 'type:utils'] },
  // Domain can only depend on types (pure interfaces)
  { sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:types'] },
  // Utils can depend on types
  { sourceTag: 'type:utils', onlyDependOnLibsWithTags: ['type:types'] },
  // Types depend on nothing
  { sourceTag: 'type:types', onlyDependOnLibsWithTags: [] },
],
```

### Step 4: Validate

```bash
pnpm nx lint pos
pnpm nx lint api
pnpm nx lint domain
pnpm nx lint shared-types
pnpm nx lint shared-utils
# Or run all at once:
pnpm lint
```

Fix any violations that surface — these are existing architecture violations that were previously invisible.

## Acceptance Criteria

- [x] All `project.json` files have meaningful tags
- [x] ESLint `depConstraints` enforce the Clean Architecture dependency flow
- [x] `pnpm lint` passes with no boundary violations
- [x] CI pipeline (`pr-check.yml`) continues to pass

## References

- [Nx Module Boundary Rules](https://nx.dev/features/enforce-module-boundaries)
- [Nx Project Tags](https://nx.dev/concepts/decisions/project-dependency-rules)
