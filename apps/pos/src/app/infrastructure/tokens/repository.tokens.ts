import { InjectionToken } from '@angular/core';
import { Category, Extra, Ingredient, Table, TestEntity } from '@simple-pos/shared/types';
import { AccountRepository } from '../../core/interfaces/account-repository.interface';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
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

export const ACCOUNT_REPOSITORY = new InjectionToken<AccountRepository>('AccountRepository');
export const CATEGORY_REPOSITORY = new InjectionToken<BaseRepository<Category>>(
  'CategoryRepository',
);
export const CODE_TABLE_REPOSITORY = new InjectionToken<CodeTableRepository>('CodeTableRepository');
export const CODE_TRANSLATION_REPOSITORY = new InjectionToken<CodeTranslationRepository>(
  'CodeTranslationRepository',
);
export const EXTRA_REPOSITORY = new InjectionToken<BaseRepository<Extra>>('ExtraRepository');
export const INGREDIENT_REPOSITORY = new InjectionToken<BaseRepository<Ingredient>>(
  'IngredientRepository',
);
export const ORDER_REPOSITORY = new InjectionToken<OrderRepository>('OrderRepository');
export const ORDER_ITEM_REPOSITORY = new InjectionToken<OrderItemRepository>('OrderItemRepository');
export const ORDER_ITEM_EXTRA_REPOSITORY = new InjectionToken<OrderItemExtraRepository>(
  'OrderItemExtraRepository',
);
export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>('ProductRepository');
export const PRODUCT_EXTRA_REPOSITORY = new InjectionToken<ProductExtraRepository>(
  'ProductExtraRepository',
);
export const PRODUCT_INGREDIENT_REPOSITORY = new InjectionToken<ProductIngredientRepository>(
  'ProductIngredientRepository',
);
export const TABLE_REPOSITORY = new InjectionToken<BaseRepository<Table>>('TableRepository');
export const TEST_REPOSITORY = new InjectionToken<BaseRepository<TestEntity>>('TestRepository');
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
export const VARIANT_REPOSITORY = new InjectionToken<VariantRepository>('VariantRepository');
