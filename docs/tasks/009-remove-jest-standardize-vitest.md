# Task: Remove Jest, Standardize on Vitest

## Description

The workspace has a dual test-runner setup: **Vitest** is used for all main projects (`pos`, `api`, `domain`, `shared-types`, `shared-utils`), but **Jest** is still present for the API E2E tests (`api-e2e`) and has leftover root-level configuration. This adds unnecessary dependency weight, creates tooling confusion, and requires maintaining two sets of test infrastructure.

## Status

- **Identified**: February 13, 2026
- **Status**: Completed
- **Priority**: Low-Medium
- **Effort**: Low
- **Completed**: February 18, 2026

## Recommended Agent

- **Agent**: `test-specialist`

## Current State

### Jest Artifacts

| File/Package                      | Usage                                              |
| --------------------------------- | -------------------------------------------------- |
| `jest.preset.js`                  | Root-level Jest preset (not used by main projects) |
| `apps/api-e2e/jest.config.cts`    | E2E test config for API                            |
| `apps/api-e2e/tsconfig.spec.json` | TypeScript config for Jest                         |
| `@nx/jest` (devDep)               | Nx Jest plugin                                     |
| `jest` (devDep)                   | Jest test runner                                   |
| `ts-jest` (devDep)                | TypeScript Jest transformer                        |
| `jest-environment-node` (devDep)  | Node.js test environment for Jest                  |
| `@types/jest` (devDep)            | Jest type definitions                              |

### Vitest Configuration (already in place)

| Project        | Config File                           |
| -------------- | ------------------------------------- |
| `pos`          | `apps/pos/vitest.config.ts`           |
| `api`          | `apps/api/vitest.config.mts`          |
| `domain`       | `libs/domain/vitest.config.mts`       |
| `shared-types` | `libs/shared/types/vitest.config.mts` |
| `shared-utils` | `libs/shared/utils/vitest.config.mts` |
| Root workspace | `vitest.workspace.ts`                 |

### Nx Plugin Configuration

```json
// nx.json
{
  "plugins": [
    { "plugin": "@nx/vitest", ... }
  ]
}
```

Jest is not configured as an Nx plugin — it's only used directly by `api-e2e`.

## Impact

- **~5 extra devDependencies** to maintain and audit
- **Two test APIs** to understand (`describe/it/expect` are similar but config differs)
- **Lock file bloat**: Jest + babel dependencies add ~20MB to `node_modules`
- **Cognitive overhead**: Contributors must know when to use Jest vs Vitest

## Proposed Solution

### Step 1: Migrate `api-e2e` from Jest to Vitest

**Create** `apps/api-e2e/vitest.config.mts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    setupFiles: ['src/support/global-setup.ts'], // if needed
    testTimeout: 30000, // E2E tests need longer timeouts
  },
});
```

**Update** `apps/api-e2e/project.json` to use Vitest:

```json
{
  "targets": {
    "e2e": {
      "executor": "@nx/vitest:test",
      "options": {
        "config": "apps/api-e2e/vitest.config.mts"
      }
    }
  }
}
```

### Step 2: Update E2E Test Files

Vitest is mostly compatible with Jest syntax. Check for these differences:

```typescript
// Jest-specific (update if found):
jest.fn()           →  vi.fn()
jest.mock()         →  vi.mock()
jest.spyOn()        →  vi.spyOn()
jest.setTimeout()   →  // use testTimeout in config
jest.useFakeTimers()  →  vi.useFakeTimers()

// These remain the same:
describe(), it(), expect(), beforeAll(), afterAll(), beforeEach(), afterEach()
```

### Step 3: Update `apps/api-e2e/tsconfig.spec.json`

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node"], // was: ["jest", "node"]
  },
  "include": ["src/**/*.ts"],
}
```

### Step 4: Remove Jest Dependencies

```bash
pnpm remove jest ts-jest jest-environment-node @types/jest @nx/jest
```

### Step 5: Delete Jest Configuration Files

```bash
rm jest.preset.js
rm apps/api-e2e/jest.config.cts
```

### Step 6: Update `vitest.workspace.ts`

Ensure the workspace file picks up the new E2E config:

```typescript
export default ['**/vite.config.{mjs,js,ts,mts}', '**/vitest.config.{mjs,js,ts,mts}'];
```

This glob should already match `apps/api-e2e/vitest.config.mts`.

### Step 7: Validate

```bash
# Run the migrated E2E tests
pnpm nx e2e api-e2e

# Run all tests to ensure nothing broke
pnpm test:all

# Verify Jest is fully removed
grep -r "jest" package.json  # should only show lint-staged prettier, not test deps
ls jest.preset.js 2>/dev/null && echo "STILL EXISTS" || echo "REMOVED"
```

## E2E Test Considerations

E2E tests may need:

- **Global setup/teardown**: Starting the API server before tests, stopping after
- **Longer timeouts**: Network calls, database seeding
- **Sequential execution**: If tests share state, use `--pool=forks --poolOptions.forks.singleFork`

```typescript
// vitest.config.mts for E2E
export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    globalSetup: 'src/support/global-setup.ts',
  },
});
```

## Acceptance Criteria

- [ ] `api-e2e` project uses `vitest.config.mts` instead of `jest.config.cts`
- [ ] All E2E tests pass under Vitest
- [ ] `jest.preset.js` is deleted
- [ ] `jest`, `ts-jest`, `jest-environment-node`, `@types/jest`, `@nx/jest` removed from `package.json`
- [ ] No references to Jest remain in configuration files
- [ ] `pnpm test:all` passes
- [ ] Lock file size reduced

## References

- [Vitest Migration from Jest](https://vitest.dev/guide/migration.html)
- [Nx Vitest Plugin](https://nx.dev/nx-api/vitest)
