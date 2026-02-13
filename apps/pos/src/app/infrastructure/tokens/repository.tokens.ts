import { InjectionToken } from '@angular/core';
import {
  Account,
  Category,
  CodeTable,
  CodeTranslation,
  Extra,
  Ingredient,
  Order,
  OrderItem,
  OrderItemExtra,
  Product,
  ProductExtra,
  ProductIngredient,
  Table,
  TestEntity,
  User,
  Variant,
} from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';

export const ACCOUNT_REPOSITORY = new InjectionToken<BaseRepository<Account>>('AccountRepository');
export const CATEGORY_REPOSITORY = new InjectionToken<BaseRepository<Category>>(
  'CategoryRepository',
);
export const CODE_TABLE_REPOSITORY = new InjectionToken<BaseRepository<CodeTable>>(
  'CodeTableRepository',
);
export const CODE_TRANSLATION_REPOSITORY = new InjectionToken<BaseRepository<CodeTranslation>>(
  'CodeTranslationRepository',
);
export const EXTRA_REPOSITORY = new InjectionToken<BaseRepository<Extra>>('ExtraRepository');
export const INGREDIENT_REPOSITORY = new InjectionToken<BaseRepository<Ingredient>>(
  'IngredientRepository',
);
export const ORDER_REPOSITORY = new InjectionToken<BaseRepository<Order>>('OrderRepository');
export const ORDER_ITEM_REPOSITORY = new InjectionToken<BaseRepository<OrderItem>>(
  'OrderItemRepository',
);
export const ORDER_ITEM_EXTRA_REPOSITORY = new InjectionToken<BaseRepository<OrderItemExtra>>(
  'OrderItemExtraRepository',
);
export const PRODUCT_REPOSITORY = new InjectionToken<BaseRepository<Product>>('ProductRepository');
export const PRODUCT_EXTRA_REPOSITORY = new InjectionToken<BaseRepository<ProductExtra>>(
  'ProductExtraRepository',
);
export const PRODUCT_INGREDIENT_REPOSITORY = new InjectionToken<BaseRepository<ProductIngredient>>(
  'ProductIngredientRepository',
);
export const TABLE_REPOSITORY = new InjectionToken<BaseRepository<Table>>('TableRepository');
export const TEST_REPOSITORY = new InjectionToken<BaseRepository<TestEntity>>('TestRepository');
export const USER_REPOSITORY = new InjectionToken<BaseRepository<User>>('UserRepository');
export const VARIANT_REPOSITORY = new InjectionToken<BaseRepository<Variant>>('VariantRepository');
