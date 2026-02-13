import { Provider } from '@angular/core';
import {
  BaseRepository,
  Category,
  Extra,
  Ingredient,
  Table,
  TestEntity,
} from '@simple-pos/shared/types';
import { AccountRepository } from '../../core/interfaces/account-repository.interface';
import { CodeTableRepository } from '../../core/interfaces/code-table-repository.interface';
import { CodeTranslationRepository } from '../../core/interfaces/code-translation-repository.interface';
import { OrderItemExtraRepository } from '../../core/interfaces/order-item-extra-repository.interface';
import { OrderItemRepository } from '../../core/interfaces/order-item-repository.interface';
import { OrderRepository } from '../../core/interfaces/order-repository.interface';
import { ProductExtraRepository } from '../../core/interfaces/product-extra-repository.interface';
import { ProductIngredientRepository } from '../../core/interfaces/product-ingredient-repository.interface';
import { ProductRepository } from '../../core/interfaces/product-repository.interface';
import { UserRepository } from '../../core/interfaces/user-repository.interface';
import { VariantRepository } from '../../core/interfaces/variant-repository.interface';
import { PlatformService } from '../../infrastructure/services/platform.service';
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
    useFactory: (p: PlatformService, s: AccountRepository, i: AccountRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteAccountRepository, IndexedDBAccountRepository],
  },
  {
    provide: CATEGORY_REPOSITORY,
    useFactory: (p: PlatformService, s: BaseRepository<Category>, i: BaseRepository<Category>) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCategoryRepository, IndexedDBCategoryRepository],
  },
  {
    provide: CODE_TABLE_REPOSITORY,
    useFactory: (p: PlatformService, s: CodeTableRepository, i: CodeTableRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCodeTableRepository, IndexedDBCodeTableRepository],
  },
  {
    provide: CODE_TRANSLATION_REPOSITORY,
    useFactory: (p: PlatformService, s: CodeTranslationRepository, i: CodeTranslationRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteCodeTranslationRepository, IndexedDBCodeTranslationRepository],
  },
  {
    provide: EXTRA_REPOSITORY,
    useFactory: (p: PlatformService, s: BaseRepository<Extra>, i: BaseRepository<Extra>) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteExtraRepository, IndexedDBExtraRepository],
  },
  {
    provide: INGREDIENT_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: BaseRepository<Ingredient>,
      i: BaseRepository<Ingredient>,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteIngredientRepository, IndexedDBIngredientRepository],
  },
  {
    provide: ORDER_REPOSITORY,
    useFactory: (p: PlatformService, s: OrderRepository, i: OrderRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteOrderRepository, IndexedDBOrderRepository],
  },
  {
    provide: ORDER_ITEM_REPOSITORY,
    useFactory: (p: PlatformService, s: OrderItemRepository, i: OrderItemRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteOrderItemRepository, IndexedDBOrderItemRepository],
  },
  {
    provide: ORDER_ITEM_EXTRA_REPOSITORY,
    useFactory: (p: PlatformService, s: OrderItemExtraRepository, i: OrderItemExtraRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteOrderItemExtraRepository, IndexedDBOrderItemExtraRepository],
  },
  {
    provide: PRODUCT_REPOSITORY,
    useFactory: (p: PlatformService, s: ProductRepository, i: ProductRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteProductRepository, IndexedDBProductRepository],
  },
  {
    provide: PRODUCT_EXTRA_REPOSITORY,
    useFactory: (p: PlatformService, s: ProductExtraRepository, i: ProductExtraRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteProductExtraRepository, IndexedDBProductExtraRepository],
  },
  {
    provide: PRODUCT_INGREDIENT_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: ProductIngredientRepository,
      i: ProductIngredientRepository,
    ) => platformRepositoryFactory(p, s, i),
    deps: [
      PlatformService,
      SQLiteProductIngredientRepository,
      IndexedDBProductIngredientRepository,
    ],
  },
  {
    provide: TABLE_REPOSITORY,
    useFactory: (p: PlatformService, s: BaseRepository<Table>, i: BaseRepository<Table>) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteTableRepository, IndexedDBTableRepository],
  },
  {
    provide: TEST_REPOSITORY,
    useFactory: (
      p: PlatformService,
      s: BaseRepository<TestEntity>,
      i: BaseRepository<TestEntity>,
    ) => platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteTestRepository, IndexedDBTestRepository],
  },
  {
    provide: USER_REPOSITORY,
    useFactory: (p: PlatformService, s: UserRepository, i: UserRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteUserRepository, IndexedDBUserRepository],
  },
  {
    provide: VARIANT_REPOSITORY,
    useFactory: (p: PlatformService, s: VariantRepository, i: VariantRepository) =>
      platformRepositoryFactory(p, s, i),
    deps: [PlatformService, SQLiteVariantRepository, IndexedDBVariantRepository],
  },
];
