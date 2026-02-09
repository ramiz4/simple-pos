# Nx Monorepo Migration Implementation Plan

> **Status:** ✅ Completed (2026-02-09) <br>
> **Duration:** 1 day <br>
> **Completed By:** Development Team <br>
> **Created:** 2026-02-09 <br>
> **Related Document:** [SaaS/On-Prem Transformation Guide](./saas-onprem-transformation.md#11-migration-strategy)

---

## Migration Summary

**Phase 0.5** has been successfully completed. The Simple POS repository has been restructured from a monolithic application into an **Nx-powered monorepo** with clear separation between applications and shared libraries.

### Key Achievements

✅ **Nx Workspace Initialized** - Version 22.4.5 with Angular and JS plugins <br>
✅ **Applications Restructured** - `apps/pos` (Angular) and `apps/native` (Tauri) <br>
✅ **Libraries Extracted** - `@simple-pos/shared/types`, `@simple-pos/domain`, `@simple-pos/shared/utils` <br>
✅ **Path Aliases Configured** - Cross-library imports use `@simple-pos/*` workspace-scoped paths; legacy `src/app/domain/...` imports removed <br>
✅ **Build Verified** - All 5 projects build successfully <br>
✅ **Tests Passing** - 1000 tests across all projects <br>
✅ **Linting Clean** - No ESLint or TypeScript errors <br>
✅ **Documentation Updated** - Architecture and README reflect new structure

---

## Table of Contents

1. [Executive Summary & Readiness](#1-executive-summary--readiness)
2. [Workspace Initialization](#2-workspace-initialization)
3. [Library Componentization](#3-library-componentization)
4. [Verification & Finalization](#4-verification--finalization)
5. [Risk Mitigation](#5-risk-mitigation)

---

## 1. Executive Summary & Readiness

This blueprint details the execution of **Phase 0.5** of the [SaaS/On-Prem Transformation roadmap](./saas-onprem-transformation.md). The migration transitions the current monolithic repository to an **Nx-powered workspaces** architecture.

### 1.1 Pre-Migration Requirements

- [x] **State Lockdown**: Ensure a clean Git working directory on a new branch `feat/nx-monorepo-migration`.
- [x] **Baseline Verification**: All tests must pass (`pnpm test`) and builds remain stable (`pnpm build`).
- [x] **Tooling Check**: Verify Node.js 20+, pnpm 10.2+, and Rust/Tauri environments are active.
- [x] **Safety Net**: Tag the current state: `git tag pre-nx-migration`.

---

## 2. Workspace Initialization

### Step 1: Initialize Nx

Convert the flat repo into an Nx-enabled workspace.

```bash
pnpm add -D nx@latest @nx/angular@latest @nx/js@latest
npx nx init
```

### Step 2: Application Restructuring

Migrate core applications to the `apps/` directory and update platform configuration.

**Angular PoS (`apps/pos`)**:

1. Move `src/` to `apps/pos/src`.
2. Generate `apps/pos/project.json` (see [Architectural Map](./saas-onprem-transformation.md#10-nx-monorepo-architecture)).

**Native Host (`apps/native`)**:

1. Move `src-tauri/` to `apps/native/src-tauri`.
2. Update `tauri.conf.json` to reflect new relative paths to PoS build artifacts.

---

## 3. Library Componentization

### Step 3: Library Extraction (Types, Domain, Utils)

Extract shared logic from the Angular monolith into specialized libraries.

| Library          | Command                  | Source Content            | Target Path                |
| :--------------- | :----------------------- | :------------------------ | :------------------------- |
| **Shared Types** | `nx g @nx/js:lib types`  | `entities/*.interface.ts` | `@simple-pos/shared/types` |
| **Domain Logic** | `nx g @nx/js:lib domain` | Price/Tax calculations    | `@simple-pos/domain`       |
| **Shared Utils** | `nx g @nx/js:lib utils`  | Generic helpers           | `@simple-pos/shared/utils` |

### Step 4: Import Refactoring

Replace all relative imports with workspace-scoped path aliases.

- **Objective**: Eliminate `../../domain/entities/...` imports.
- **Solution**: Global regex find-and-replace to `@simple-pos/shared/types`.

**Manual Edits:**

Use VS Code Find & Replace (Regex mode):

**Find:**

```regex
import \{ ([^}]+) \} from ['"].*domain/entities/([^'"]+)['"];
```

**Replace:**

```
import { $1 } from '@simple-pos/shared/types';
```

**Verification:**

```bash
# Ensure no compilation errors
pnpm nx build pos

# Run tests
pnpm nx test pos
```

**✅ Success Criteria:** All imports use path aliases, no compilation errors

---

## 4. Verification & Finalization

### Step 5: Validation Baseline

- **Build Core**: `nx build pos`.
- **Test Integrity**: `nx run-many -t test`.
- **E2E Integration**: Execute `tauri dev` to verify the local distribution shell.
- **Structural Integrity**: Run `nx graph` to ensure libraries are correctly isolated and consumed.

### 4.1 Post-Migration Tasks

1. **Script Synchronization**: Sync `package.json` with Nx targets (`serve`, `build`, `test`, `tauri`).
2. **Environment Scrub**: Update `.gitignore` for `.nx/cache` and `.nx/workspace-data`.
3. **Commit & Deploy**: Rebase and push to `main` following successful peer review.

---

## 5. Risk Mitigation

### 5.1 Rollback Protocol

If migration stability fails, execute a full reset to the pre-nx-migration tag:

```bash
git reset --hard pre-nx-migration
pnpm install
```

### 5.2 Common Failure Modes

| Scenario             | Resolution                                                                            |
| :------------------- | :------------------------------------------------------------------------------------ |
| **Path Drift**       | Verify `tsconfig.base.json` path mapping.                                             |
| **Tauri Dist Error** | Validate `tauri.conf.json > distDir` correctly targets `../../dist/apps/pos/browser`. |
| **Import Cycles**    | Use `nx graph` to identify and decouple circular dependencies.                        |
| **Cache Drift**      | Run `nx reset` to invalidate local computation cache.                                 |

---

**Success Definition**: Correct migration is achieved when all distributed targets (Web/Desktop) build from common library sources with zero relative imports and passing CI suites.

_Last Updated: 2026-02-09_
