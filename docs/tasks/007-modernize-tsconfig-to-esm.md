# Task: Modernize `tsconfig.base.json` to ESM

## Description

The root `tsconfig.base.json` uses `"module": "commonjs"` and `"moduleResolution": "node"`, which are legacy settings. The project uses Angular 21 (ESM-native), Vite 7 (ESM-only), and modern Nx — all of which work best with ESM module resolution. The current config forces CommonJS semantics at the base level, which can cause subtle compatibility issues with tree-shaking, dynamic imports, and modern bundlers.

## Status

- **Identified**: February 13, 2026
- **Status**: Open
- **Priority**: Medium
- **Effort**: Low

## Recommended Agent

- **Agent**: `nx-engineer`

## Current State

### `tsconfig.base.json`

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "commonjs", // ❌ Legacy
    "lib": ["ES2022"],
    "moduleResolution": "node", // ❌ Legacy
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "importHelpers": true,
    // ...
  },
}
```

### Per-App Overrides

Each app has its own `tsconfig.app.json` that extends `tsconfig.base.json`:

- `apps/pos/tsconfig.app.json` — Angular uses `@angular/build` (Vite-based, ESM)
- `apps/api/tsconfig.app.json` — NestJS uses webpack (may need CJS for Node.js)
- `libs/domain/tsconfig.lib.json` — Pure TypeScript (should be ESM)

## Impact

- **Tree-shaking degradation**: CommonJS modules are harder for bundlers to tree-shake
- **Dynamic import issues**: `import()` expressions behave differently under CJS resolution
- **Tooling friction**: Vite and Angular's esbuild-based builder expect ESM; the base CJS setting gets overridden but creates confusion
- **`esModuleInterop` requirement**: Needed only because of CJS interop — with pure ESM it's unnecessary
- **Future-proofing**: Node.js and the ecosystem are moving to ESM; CJS is the legacy path

## Proposed Solution

### Step 1: Update `tsconfig.base.json`

```jsonc
{
  "compileOnSave": false,
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022", // ✅ Modern ESM
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler", // ✅ Modern resolution
    "esModuleInterop": true, // Keep for backward compat
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@simple-pos/shared/types": ["libs/shared/types/src/index.ts"],
      "@simple-pos/shared/utils": ["libs/shared/utils/src/index.ts"],
      "@simple-pos/domain": ["libs/domain/src/index.ts"],
    },
  },
  "exclude": ["node_modules", "tmp"],
}
```

### Step 2: API-Specific Override

The NestJS API running on Node.js with webpack may need CommonJS. Override in `apps/api/tsconfig.app.json`:

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    // NestJS-specific settings
  },
}
```

This keeps the API functional while letting everything else use modern ESM.

### Step 3: Library Overrides (if needed)

For `libs/domain/tsconfig.lib.json` and `libs/shared/*/tsconfig.lib.json`, the ESM base should work directly. Verify each still compiles:

```bash
pnpm nx build domain
pnpm nx build shared-types
pnpm nx build shared-utils
```

### Step 4: Add `"DOM"` to `lib` (if not already)

The POS app needs DOM types. Adding `"DOM"` to the base `lib` array prevents each app from needing to re-declare it. The API won't be affected since it doesn't use DOM APIs.

### Step 5: Validate All Projects

```bash
pnpm nx run-many -t build --all
pnpm nx run-many -t test --all --run
pnpm nx run-many -t lint --all
```

## Risk Assessment

| Risk                                | Likelihood | Mitigation                                   |
| ----------------------------------- | ---------- | -------------------------------------------- |
| NestJS webpack build breaks         | Medium     | Override CJS in API tsconfig.app.json        |
| Library imports resolve differently | Low        | `bundler` resolution is a superset of `node` |
| Jest/Vitest config issues           | Low        | Both support ESM natively                    |
| Third-party CJS packages break      | Low        | `esModuleInterop: true` handles this         |

## Acceptance Criteria

- [ ] `tsconfig.base.json` uses `"module": "ES2022"` and `"moduleResolution": "bundler"`
- [ ] `apps/api/tsconfig.app.json` overrides to `"commonjs"` if needed
- [ ] All apps build successfully (`build`)
- [ ] All tests pass (`test`)
- [ ] All lint checks pass (`lint`)
- [ ] No runtime regressions in dev mode for POS, API, and Tauri

## References

- [TypeScript Module Resolution Strategies](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution)
- [TypeScript `"moduleResolution": "bundler"`](https://www.typescriptlang.org/tsconfig/#moduleResolution)
- [Angular ESM Migration](https://angular.dev/tools/cli/build-system-migration)
