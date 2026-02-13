# Task: Group Repository Files by Entity

## Description

The `apps/pos/src/app/infrastructure/repositories/` directory contains **42 files** in a flat structure — two implementations per entity (SQLite + IndexedDB) plus spec files. Finding related files requires scanning a long alphabetical list. Grouping by entity improves navigation, makes the dual-repository pattern visually obvious, and aligns with the per-module structure used elsewhere in the project.

## Status

- **Identified**: February 13, 2026
- **Status**: Open
- **Priority**: Low
- **Effort**: Low

## Recommended Agent

- **Agent**: `repository-specialist`

## Current State

### Flat Structure (42 files)

```
repositories/
├── indexeddb-account.repository.ts
├── indexeddb-category.repository.ts
├── indexeddb-code-table.repository.ts
├── indexeddb-code-translation.repository.ts
├── indexeddb-extra.repository.ts
├── indexeddb-ingredient.repository.ts
├── indexeddb-order-item-extra.repository.ts
├── indexeddb-order-item.repository.ts
├── indexeddb-order.repository.ts
├── indexeddb-product-extra.repository.ts
├── indexeddb-product-ingredient.repository.ts
├── indexeddb-product.repository.ts
├── indexeddb-table.repository.ts
├── indexeddb-test.repository.ts
├── indexeddb-user.repository.ts
├── indexeddb-variant.repository.ts
├── sqlite-account.repository.spec.ts
├── sqlite-account.repository.ts
├── sqlite-category.repository.spec.ts
├── sqlite-category.repository.ts
├── sqlite-code-table.repository.ts
├── sqlite-code-translation.repository.ts
├── sqlite-extra.repository.spec.ts
├── sqlite-extra.repository.ts
├── sqlite-ingredient.repository.spec.ts
├── sqlite-ingredient.repository.ts
├── sqlite-order-item-extra.repository.spec.ts
├── sqlite-order-item-extra.repository.ts
├── sqlite-order-item.repository.spec.ts
├── sqlite-order-item.repository.ts
├── sqlite-order.repository.spec.ts
├── sqlite-order.repository.ts
├── sqlite-product-extra.repository.ts
├── sqlite-product-ingredient.repository.ts
├── sqlite-product.repository.spec.ts
├── sqlite-product.repository.ts
├── sqlite-table.repository.spec.ts
├── sqlite-table.repository.ts
├── sqlite-test.repository.ts
├── sqlite-user.repository.spec.ts
├── sqlite-user.repository.ts
├── sqlite-variant.repository.ts
```

## Proposed Solution

### Target Structure (grouped by entity)

```
repositories/
├── account/
│   ├── indexeddb-account.repository.ts
│   ├── sqlite-account.repository.ts
│   └── sqlite-account.repository.spec.ts
├── category/
│   ├── indexeddb-category.repository.ts
│   ├── sqlite-category.repository.ts
│   └── sqlite-category.repository.spec.ts
├── code-table/
│   ├── indexeddb-code-table.repository.ts
│   ├── sqlite-code-table.repository.ts
│   └── indexeddb-code-translation.repository.ts
│   └── sqlite-code-translation.repository.ts
├── extra/
│   ├── indexeddb-extra.repository.ts
│   ├── sqlite-extra.repository.ts
│   └── sqlite-extra.repository.spec.ts
├── ingredient/
│   ├── indexeddb-ingredient.repository.ts
│   ├── sqlite-ingredient.repository.ts
│   └── sqlite-ingredient.repository.spec.ts
├── order/
│   ├── indexeddb-order.repository.ts
│   ├── sqlite-order.repository.ts
│   ├── sqlite-order.repository.spec.ts
│   ├── indexeddb-order-item.repository.ts
│   ├── sqlite-order-item.repository.ts
│   ├── sqlite-order-item.repository.spec.ts
│   ├── indexeddb-order-item-extra.repository.ts
│   ├── sqlite-order-item-extra.repository.ts
│   └── sqlite-order-item-extra.repository.spec.ts
├── product/
│   ├── indexeddb-product.repository.ts
│   ├── sqlite-product.repository.ts
│   ├── sqlite-product.repository.spec.ts
│   ├── indexeddb-product-extra.repository.ts
│   ├── sqlite-product-extra.repository.ts
│   ├── indexeddb-product-ingredient.repository.ts
│   └── sqlite-product-ingredient.repository.ts
├── table/
│   ├── indexeddb-table.repository.ts
│   ├── sqlite-table.repository.ts
│   └── sqlite-table.repository.spec.ts
├── test/
│   ├── indexeddb-test.repository.ts
│   └── sqlite-test.repository.ts
├── user/
│   ├── indexeddb-user.repository.ts
│   ├── sqlite-user.repository.ts
│   └── sqlite-user.repository.spec.ts
└── variant/
    ├── indexeddb-variant.repository.ts
    └── sqlite-variant.repository.ts
```

### Step 1: Create Directories and Move Files

```bash
cd apps/pos/src/app/infrastructure/repositories

# Account
mkdir -p account && mv *account*.ts account/

# Category
mkdir -p category && mv *category*.ts category/

# Code Table / Translation
mkdir -p code-table && mv *code-table*.ts *code-translation*.ts code-table/

# Extra
mkdir -p extra && mv indexeddb-extra*.ts sqlite-extra*.ts extra/

# Ingredient
mkdir -p ingredient && mv *ingredient*.ts ingredient/
# (be careful: product-ingredient files should go to product/)

# Order (including order-item and order-item-extra)
mkdir -p order && mv *order*.ts order/

# Product (including product-extra and product-ingredient)
mkdir -p product && mv *product*.ts product/

# Table
mkdir -p table && mv *table*.ts table/

# Test
mkdir -p test && mv *test*.ts test/

# User
mkdir -p user && mv *user*.ts user/

# Variant
mkdir -p variant && mv *variant*.ts variant/
```

> **Important**: Use an IDE refactoring tool (VS Code "Move File") to auto-update imports, or plan to manually fix all import paths after moving.

### Step 2: Update All Import Paths

All services and the repository factory reference these files. Imports change from:

```typescript
// Before:
import { SQLiteProductRepository } from '../repositories/sqlite-product.repository';
import { IndexedDBProductRepository } from '../repositories/indexeddb-product.repository';

// After:
import { SQLiteProductRepository } from '../repositories/product/sqlite-product.repository';
import { IndexedDBProductRepository } from '../repositories/product/indexeddb-product.repository';
```

Use a project-wide find-and-replace for each entity.

### Step 3: Consider Adding Entity Barrel Exports (Optional)

Each entity folder could have an `index.ts` for cleaner imports:

```typescript
// repositories/product/index.ts
export * from './sqlite-product.repository';
export * from './indexeddb-product.repository';
export * from './sqlite-product-extra.repository';
export * from './indexeddb-product-extra.repository';
export * from './sqlite-product-ingredient.repository';
export * from './indexeddb-product-ingredient.repository';
```

Then imports become:

```typescript
import { SQLiteProductRepository, IndexedDBProductRepository } from '../repositories/product';
```

### Step 4: Validate

```bash
pnpm pos:build
pnpm pos:test
pnpm pos:lint
```

## Acceptance Criteria

- [ ] Repositories are organized into entity subfolders
- [ ] All import paths are updated across the POS app
- [ ] Build succeeds with no unresolved imports
- [ ] All tests pass
- [ ] Spec files are co-located with their implementation files

## References

- [Angular Style Guide - Folders-by-Feature](https://angular.dev/style-guide#folders-by-feature-structure)
