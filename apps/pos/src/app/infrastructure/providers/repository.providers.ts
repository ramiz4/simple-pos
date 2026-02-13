import { Provider } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { IndexedDBAccountRepository } from '../repositories/indexeddb-account.repository';
import { IndexedDBCategoryRepository } from '../repositories/indexeddb-category.repository';
import { IndexedDBCodeTableRepository } from '../repositories/indexeddb-code-table.repository';
import { IndexedDBCodeTranslationRepository } from '../repositories/indexeddb-code-translation.repository';
import { IndexedDBExtraRepository } from '../repositories/indexeddb-extra.repository';
import { IndexedDBIngredientRepository } from '../repositories/indexeddb-ingredient.repository';
import { IndexedDBOrderItemExtraRepository } from '../repositories/indexeddb-order-item-extra.repository';
import { IndexedDBOrderItemRepository } from '../repositories/indexeddb-order-item.repository';
import { IndexedDBOrderRepository } from '../repositories/indexeddb-order.repository';
import { IndexedDBProductExtraRepository } from '../repositories/indexeddb-product-extra.repository';
import { IndexedDBProductIngredientRepository } from '../repositories/indexeddb-product-ingredient.repository';
import { IndexedDBProductRepository } from '../repositories/indexeddb-product.repository';
import { IndexedDBTableRepository } from '../repositories/indexeddb-table.repository';
import { IndexedDBTestRepository } from '../repositories/indexeddb-test.repository';
import { IndexedDBUserRepository } from '../repositories/indexeddb-user.repository';
import { IndexedDBVariantRepository } from '../repositories/indexeddb-variant.repository';
import { SQLiteAccountRepository } from '../repositories/sqlite-account.repository';
import { SQLiteCategoryRepository } from '../repositories/sqlite-category.repository';
import { SQLiteCodeTableRepository } from '../repositories/sqlite-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../repositories/sqlite-code-translation.repository';
import { SQLiteExtraRepository } from '../repositories/sqlite-extra.repository';
import { SQLiteIngredientRepository } from '../repositories/sqlite-ingredient.repository';
import { SQLiteOrderItemExtraRepository } from '../repositories/sqlite-order-item-extra.repository';
import { SQLiteOrderItemRepository } from '../repositories/sqlite-order-item.repository';
import { SQLiteOrderRepository } from '../repositories/sqlite-order.repository';
import { SQLiteProductExtraRepository } from '../repositories/sqlite-product-extra.repository';
import { SQLiteProductIngredientRepository } from '../repositories/sqlite-product-ingredient.repository';
import { SQLiteProductRepository } from '../repositories/sqlite-product.repository';
import { SQLiteTableRepository } from '../repositories/sqlite-table.repository';
import { SQLiteTestRepository } from '../repositories/sqlite-test.repository';
import { SQLiteUserRepository } from '../repositories/sqlite-user.repository';
import { SQLiteVariantRepository } from '../repositories/sqlite-variant.repository';
import {
  ACCOUNT_REPOSITORY,
  CATEGORY_REPOSITORY,
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
  EXTRA_REPOSITORY,
  INGREDIENT_REPOSITORY,
  ORDER_ITEM_EXTRA_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_EXTRA_REPOSITORY,
  PRODUCT_INGREDIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
  TABLE_REPOSITORY,
  TEST_REPOSITORY,
  USER_REPOSITORY,
  VARIANT_REPOSITORY,
} from '../tokens/repository.tokens';

function platformRepositoryFactory<T>(platform: PlatformService, sqlite: T, idb: T): T {
  return platform.isTauri() ? sqlite : idb;
}

export const REPOSITORY_PROVIDERS: Provider[] = [
  {
    provide: ACCOUNT_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteAccountRepository, i: IndexedDBAccountRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteAccountRepository, IndexedDBAccountRepository],
  },
  {
    provide: CATEGORY_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteCategoryRepository, i: IndexedDBCategoryRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCategoryRepository, IndexedDBCategoryRepository],
  },
  {
    provide: CODE_TABLE_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteCodeTableRepository,
      i: IndexedDBCodeTableRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCodeTableRepository, IndexedDBCodeTableRepository],
  },
  {
    provide: CODE_TRANSLATION_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteCodeTranslationRepository,
      i: IndexedDBCodeTranslationRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCodeTranslationRepository, IndexedDBCodeTranslationRepository],
  },
  {
    provide: EXTRA_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteExtraRepository, i: IndexedDBExtraRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteExtraRepository, IndexedDBExtraRepository],
  },
  {
    provide: INGREDIENT_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteIngredientRepository,
      i: IndexedDBIngredientRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteIngredientRepository, IndexedDBIngredientRepository],
  },
  {
    provide: ORDER_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteOrderRepository, i: IndexedDBOrderRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteOrderRepository, IndexedDBOrderRepository],
  },
  {
    provide: ORDER_ITEM_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteOrderItemRepository,
      i: IndexedDBOrderItemRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteOrderItemRepository, IndexedDBOrderItemRepository],
  },
  {
    provide: ORDER_ITEM_EXTRA_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteOrderItemExtraRepository,
      i: IndexedDBOrderItemExtraRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteOrderItemExtraRepository, IndexedDBOrderItemExtraRepository],
  },
  {
    provide: PRODUCT_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteProductRepository, i: IndexedDBProductRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteProductRepository, IndexedDBProductRepository],
  },
  {
    provide: PRODUCT_EXTRA_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteProductExtraRepository,
      i: IndexedDBProductExtraRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteProductExtraRepository, IndexedDBProductExtraRepository],
  },
  {
    provide: PRODUCT_INGREDIENT_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: SQLiteProductIngredientRepository,
      i: IndexedDBProductIngredientRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [
      PlatformService,
      SQLiteProductIngredientRepository,
      IndexedDBProductIngredientRepository,
    ],
  },
  {
    provide: TABLE_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteTableRepository, i: IndexedDBTableRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteTableRepository, IndexedDBTableRepository],
  },
  {
    provide: TEST_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteTestRepository, i: IndexedDBTestRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteTestRepository, IndexedDBTestRepository],
  },
  {
    provide: USER_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteUserRepository, i: IndexedDBUserRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteUserRepository, IndexedDBUserRepository],
  },
  {
    provide: VARIANT_REPOSITORY,
    useFactory: (p: PlatformService, s: SQLiteVariantRepository, i: IndexedDBVariantRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteVariantRepository, IndexedDBVariantRepository],
  },
];
