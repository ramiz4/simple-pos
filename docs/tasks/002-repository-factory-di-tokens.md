# Task: Fix RepositoryFactory — Scale to All Entities via DI Tokens

## Description

The `RepositoryFactory` in `apps/pos/src/app/infrastructure/adapters/repository.factory.ts` currently only exposes a single method: `getTestRepository()`. The codebase has **16 entity pairs** (IndexedDB + SQLite) in the repositories directory, but none are wired through the factory. This means services are either directly instantiating repositories or manually checking the platform, violating the adapter pattern documented in the architecture.

## Status

- **Identified**: February 13, 2026
- **Status**: Open
- **Priority**: High
- **Effort**: Medium

## Recommended Agent

- **Agent**: `angular-engineer`

## Current State

### Repository Factory (incomplete)

```typescript
// apps/pos/src/app/infrastructure/adapters/repository.factory.ts
@Injectable({ providedIn: 'root' })
export class RepositoryFactory {
  constructor(
    private platformService: PlatformService,
    private sqliteRepository: SQLiteTestRepository,
    private indexedDBRepository: IndexedDBTestRepository,
  ) {}

  getTestRepository(): BaseRepository<TestEntity> {
    return this.platformService.isTauri() ? this.sqliteRepository : this.indexedDBRepository;
  }
}
```

### Entities Without Factory Methods

All of these entity pairs exist in `apps/pos/src/app/infrastructure/repositories/` but are not accessible through the factory:

| Entity             | SQLite                                    | IndexedDB                                    |
| ------------------ | ----------------------------------------- | -------------------------------------------- |
| Account            | `sqlite-account.repository.ts`            | `indexeddb-account.repository.ts`            |
| Category           | `sqlite-category.repository.ts`           | `indexeddb-category.repository.ts`           |
| Code Table         | `sqlite-code-table.repository.ts`         | `indexeddb-code-table.repository.ts`         |
| Code Translation   | `sqlite-code-translation.repository.ts`   | `indexeddb-code-translation.repository.ts`   |
| Extra              | `sqlite-extra.repository.ts`              | `indexeddb-extra.repository.ts`              |
| Ingredient         | `sqlite-ingredient.repository.ts`         | `indexeddb-ingredient.repository.ts`         |
| Order              | `sqlite-order.repository.ts`              | `indexeddb-order.repository.ts`              |
| Order Item         | `sqlite-order-item.repository.ts`         | `indexeddb-order-item.repository.ts`         |
| Order Item Extra   | `sqlite-order-item-extra.repository.ts`   | `indexeddb-order-item-extra.repository.ts`   |
| Product            | `sqlite-product.repository.ts`            | `indexeddb-product.repository.ts`            |
| Product Extra      | `sqlite-product-extra.repository.ts`      | `indexeddb-product-extra.repository.ts`      |
| Product Ingredient | `sqlite-product-ingredient.repository.ts` | `indexeddb-product-ingredient.repository.ts` |
| Table              | `sqlite-table.repository.ts`              | `indexeddb-table.repository.ts`              |
| User               | `sqlite-user.repository.ts`               | `indexeddb-user.repository.ts`               |
| Variant            | `sqlite-variant.repository.ts`            | `indexeddb-variant.repository.ts`            |

## Impact

- Clean Architecture is undermined — services likely know about both implementations
- Platform switching logic is duplicated across services
- Adding a new platform (e.g., PostgreSQL for SaaS web) requires touching every service
- Testing is harder since the repository selection isn't centralized

## Proposed Solution: Angular InjectionToken Pattern

Replace the manual factory with Angular's native DI system using `InjectionToken` per entity. This is the idiomatic Angular approach.

### Step 1: Create Injection Tokens

```typescript
// apps/pos/src/app/infrastructure/tokens/repository.tokens.ts
import { InjectionToken } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import {
  Account,
  Category,
  Product,
  Order,
  OrderItem,
  OrderItemExtra,
  Extra,
  Ingredient,
  ProductExtra,
  ProductIngredient,
  User,
  Variant,
  Table,
  CodeTable,
  CodeTranslation,
} from '@simple-pos/shared/types';

export const ACCOUNT_REPOSITORY = new InjectionToken<BaseRepository<Account>>('AccountRepository');
export const CATEGORY_REPOSITORY = new InjectionToken<BaseRepository<Category>>(
  'CategoryRepository',
);
export const PRODUCT_REPOSITORY = new InjectionToken<BaseRepository<Product>>('ProductRepository');
export const ORDER_REPOSITORY = new InjectionToken<BaseRepository<Order>>('OrderRepository');
export const ORDER_ITEM_REPOSITORY = new InjectionToken<BaseRepository<OrderItem>>(
  'OrderItemRepository',
);
export const ORDER_ITEM_EXTRA_REPOSITORY = new InjectionToken<BaseRepository<OrderItemExtra>>(
  'OrderItemExtraRepository',
);
export const EXTRA_REPOSITORY = new InjectionToken<BaseRepository<Extra>>('ExtraRepository');
export const INGREDIENT_REPOSITORY = new InjectionToken<BaseRepository<Ingredient>>(
  'IngredientRepository',
);
export const PRODUCT_EXTRA_REPOSITORY = new InjectionToken<BaseRepository<ProductExtra>>(
  'ProductExtraRepository',
);
export const PRODUCT_INGREDIENT_REPOSITORY = new InjectionToken<BaseRepository<ProductIngredient>>(
  'ProductIngredientRepository',
);
export const USER_REPOSITORY = new InjectionToken<BaseRepository<User>>('UserRepository');
export const VARIANT_REPOSITORY = new InjectionToken<BaseRepository<Variant>>('VariantRepository');
export const TABLE_REPOSITORY = new InjectionToken<BaseRepository<Table>>('TableRepository');
export const CODE_TABLE_REPOSITORY = new InjectionToken<BaseRepository<CodeTable>>(
  'CodeTableRepository',
);
export const CODE_TRANSLATION_REPOSITORY = new InjectionToken<BaseRepository<CodeTranslation>>(
  'CodeTranslationRepository',
);
```

### Step 2: Create Provider Factory Functions

```typescript
// apps/pos/src/app/infrastructure/providers/repository.providers.ts
import { Provider } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { PRODUCT_REPOSITORY, CATEGORY_REPOSITORY /* ... etc */ } from '../tokens/repository.tokens';
import { SQLiteProductRepository } from '../repositories/sqlite-product.repository';
import { IndexedDBProductRepository } from '../repositories/indexeddb-product.repository';
// ... other imports

function platformRepositoryFactory<T>(platform: PlatformService, sqlite: T, idb: T): T {
  return platform.isTauri() ? sqlite : idb;
}

export const REPOSITORY_PROVIDERS: Provider[] = [
  {
    provide: PRODUCT_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteProductRepository, i: IndexedDBProductRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteProductRepository, IndexedDBProductRepository],
  },
  {
    provide: CATEGORY_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteCategoryRepository, i: IndexedDBCategoryRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCategoryRepository, IndexedDBCategoryRepository],
  },
  // ... repeat for each entity
];
```

### Step 3: Register in `app.config.ts`

```typescript
// apps/pos/src/app/app.config.ts
import { REPOSITORY_PROVIDERS } from './infrastructure/providers/repository.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    ...REPOSITORY_PROVIDERS,
  ],
};
```

### Step 4: Update Services to Use Injection

```typescript
// Before (anti-pattern):
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private repositoryFactory: RepositoryFactory) {}

  async getAll() {
    // Manual factory call every time
    return this.repositoryFactory.getProductRepository().findAll();
  }
}

// After (clean DI):
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(@Inject(PRODUCT_REPOSITORY) private repo: BaseRepository<Product>) {}

  async getAll() {
    return this.repo.findAll();
  }
}
```

### Step 5: Remove the Old RepositoryFactory

Once all services are migrated, delete `apps/pos/src/app/infrastructure/adapters/repository.factory.ts`.


## Acceptance Criteria

- [ ] Every entity pair has a corresponding DI token or factory method
- [ ] No service directly imports both SQLite and IndexedDB repository classes
- [ ] Services inject only `BaseRepository<T>` (via token or factory)
- [ ] All existing tests pass
- [ ] Platform switching works correctly for both Tauri and Web environments
- [ ] Old `RepositoryFactory` is removed (if using DI tokens approach)

## References

- [Angular InjectionToken](https://angular.dev/api/core/InjectionToken)
- [Angular Dependency Injection Guide](https://angular.dev/guide/di)
