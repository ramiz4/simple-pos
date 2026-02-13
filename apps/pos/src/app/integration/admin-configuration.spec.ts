import { TestBed } from '@angular/core/testing';
import { TableStatusEnum } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { CategoryService } from '../application/services/category.service';
import { EnumMappingService } from '../application/services/enum-mapping.service';
import { ExtraService } from '../application/services/extra.service';
import { IngredientService } from '../application/services/ingredient.service';
import { ProductService } from '../application/services/product.service';
import { SeedService } from '../application/services/seed.service';
import { TableService } from '../application/services/table.service';
import { VariantService } from '../application/services/variant.service';
import { REPOSITORY_PROVIDERS } from '../infrastructure/providers/repository.providers';
import { PlatformService } from '../infrastructure/services/platform.service';

// Test constants
const TABLE_NUMBER_BASE = 100000;
const TABLE_NUMBER_OFFSET_1 = 20000;
const TABLE_NUMBER_OFFSET_2 = 20100;
const TABLE_NUMBER_OFFSET_3 = 20200;
const _TABLE_NUMBER_OFFSET_LIST = 10000;
const LOW_STOCK_THRESHOLD = 5;

/**
 * Integration Tests - Admin Configuration Layer
 *
 * These tests verify that all admin CRUD operations work correctly:
 * - Tables, Categories, Products, Variants, Extras, Ingredients
 * - Data persistence
 * - Entity relationships
 * - Service layer functionality
 */
describe('Admin Configuration Layer', () => {
  let tableService: TableService;
  let categoryService: CategoryService;
  let productService: ProductService;
  let variantService: VariantService;
  let extraService: ExtraService;
  let ingredientService: IngredientService;
  let seedService: SeedService;
  let enumMappingService: EnumMappingService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        TableService,
        CategoryService,
        ProductService,
        VariantService,
        ExtraService,
        IngredientService,
        SeedService,
        EnumMappingService,
        ...REPOSITORY_PROVIDERS,
        {
          provide: PlatformService,
          useValue: {
            isTauri: () => false,
            isWeb: () => true,
          },
        },
      ],
    });

    tableService = TestBed.inject(TableService);
    categoryService = TestBed.inject(CategoryService);
    productService = TestBed.inject(ProductService);
    variantService = TestBed.inject(VariantService);
    extraService = TestBed.inject(ExtraService);
    ingredientService = TestBed.inject(IngredientService);
    seedService = TestBed.inject(SeedService);
    enumMappingService = TestBed.inject(EnumMappingService);

    // Seed database with CodeTable data
    await seedService.seedDatabase();
    await enumMappingService.init();
  });

  describe('Table Management CRUD', () => {
    it('should create and retrieve a table', async () => {
      const freeStatusId = await enumMappingService.getCodeTableId(
        'TABLE_STATUS',
        TableStatusEnum.FREE,
      );
      const timestamp = Date.now();

      const table = await tableService.create({
        name: `Table ${timestamp}`,
        number: (timestamp % TABLE_NUMBER_BASE) + TABLE_NUMBER_OFFSET_1,
        seats: 4,
        statusId: freeStatusId,
      });

      expect(table.id).toBeDefined();
      expect(table.number).toBe((timestamp % TABLE_NUMBER_BASE) + TABLE_NUMBER_OFFSET_1);
      expect(table.seats).toBe(4);

      const retrieved = await tableService.getById(table.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.number).toBe((timestamp % TABLE_NUMBER_BASE) + TABLE_NUMBER_OFFSET_1);
    });

    it('should update table details', async () => {
      const freeStatusId = await enumMappingService.getCodeTableId(
        'TABLE_STATUS',
        TableStatusEnum.FREE,
      );
      const timestamp = Date.now();

      const table = await tableService.create({
        name: `Table ${timestamp}`,
        number: (timestamp % TABLE_NUMBER_BASE) + TABLE_NUMBER_OFFSET_2,
        seats: 2,
        statusId: freeStatusId,
      });

      const updated = await tableService.update(table.id ?? 0, { seats: 6 });
      expect(updated.seats).toBe(6);
    });

    it('should delete a table', async () => {
      const freeStatusId = await enumMappingService.getCodeTableId(
        'TABLE_STATUS',
        TableStatusEnum.FREE,
      );
      const timestamp = Date.now();

      const table = await tableService.create({
        name: `Table ${timestamp}`,
        number: (timestamp % TABLE_NUMBER_BASE) + TABLE_NUMBER_OFFSET_3,
        seats: 4,
        statusId: freeStatusId,
      });

      await tableService.delete(table.id ?? 0);
      const retrieved = await tableService.getById(table.id ?? 0);
      expect(retrieved).toBeNull();
    });

    it('should list all tables', async () => {
      // Simply verify that getAll() works and returns data
      // This test runs after other tests that created tables
      const tables = await tableService.getAll();
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('Category Management CRUD', () => {
    it('should create and retrieve a category', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Beverages-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      expect(category.id).toBeDefined();
      expect(category.name).toBe(`Beverages-${timestamp}`);

      const retrieved = await categoryService.getById(category.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(`Beverages-${timestamp}`);
    });

    it('should update category details', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Original-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const updated = await categoryService.update(category.id ?? 0, {
        sortOrder: 5,
      });

      expect(updated.sortOrder).toBe(5);
    });

    it('should delete a category', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `ToDelete-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      await categoryService.delete(category.id ?? 0);
      const retrieved = await categoryService.getById(category.id ?? 0);
      expect(retrieved).toBeNull();
    });

    it('should list categories including seeded data', async () => {
      // Just verify that we can list all categories
      // Don't try to create more since they may conflict with seed data
      const categories = await categoryService.getAll();
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('Product Management CRUD', () => {
    it('should create and retrieve a product with category', async () => {
      const timestamp = Date.now();
      // First create a category
      const category = await categoryService.create({
        name: `Food-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      // Then create a product
      const product = await productService.create({
        name: `Pizza Margherita-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 8.99,
        stock: 100,
        isAvailable: true,
      });

      expect(product.id).toBeDefined();
      expect(product.name).toBe(`Pizza Margherita-${timestamp}`);
      expect(product.categoryId).toBe(category.id);
      expect(product.price).toBe(8.99);

      const retrieved = await productService.getById(product.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(`Pizza Margherita-${timestamp}`);
    });

    it('should update product details', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Food2-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Test Product-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 5.0,
        stock: 50,
        isAvailable: true,
      });

      const updated = await productService.update(product.id ?? 0, {
        price: 6.5,
        stock: 75,
      });

      expect(updated.price).toBe(6.5);
      expect(updated.stock).toBe(75);
    });

    it('should toggle product availability', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Food3-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Test-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 5.0,
        stock: 50,
        isAvailable: true,
      });

      const toggled = await productService.toggleAvailability(product.id ?? 0);
      expect(toggled.isAvailable).toBe(false);
    });

    it('should delete a product', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Food4-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `ToDelete-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 5.0,
        stock: 50,
        isAvailable: true,
      });

      await productService.delete(product.id ?? 0);
      const retrieved = await productService.getById(product.id ?? 0);
      expect(retrieved).toBeNull();
    });

    it('should list all products', async () => {
      // Simply verify that getAll() works and returns data
      // This test runs after other tests that created products
      const products = await productService.getAll();
      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('Variant Management CRUD', () => {
    it('should create and retrieve a variant', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Beverages2-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Coffee-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 2.5,
        stock: 100,
        isAvailable: true,
      });

      const variant = await variantService.create({
        name: `Large-${timestamp}`,
        productId: product.id ?? 0,
        priceModifier: 1.0,
      });

      expect(variant.id).toBeDefined();
      expect(variant.name).toBe(`Large-${timestamp}`);
      expect(variant.priceModifier).toBe(1.0);

      const retrieved = await variantService.getById(variant.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(`Large-${timestamp}`);
    });

    it('should update variant details', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Beverages3-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Coffee2-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 2.5,
        stock: 100,
        isAvailable: true,
      });

      const variant = await variantService.create({
        name: `Small-${timestamp}`,
        productId: product.id ?? 0,
        priceModifier: 0.0,
      });

      const updated = await variantService.update(variant.id ?? 0, {
        priceModifier: -0.5,
      });

      expect(updated.priceModifier).toBe(-0.5);
    });

    it('should delete a variant', async () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const category = await categoryService.create({
        name: `Beverages4-${timestamp}-${random}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Coffee3-${timestamp}-${random}`,
        categoryId: category.id ?? 0,
        price: 2.5,
        stock: 100,
        isAvailable: true,
      });

      const variant = await variantService.create({
        name: `ToDelete-${timestamp}-${random}`,
        productId: product.id ?? 0,
        priceModifier: 0.0,
      });

      await variantService.delete(variant.id ?? 0);
      const retrieved = await variantService.getById(variant.id ?? 0);
      expect(retrieved).toBeNull();
    });

    it('should list all variants', async () => {
      // Simply verify that getAll() works and returns data
      // This test runs after other tests that created variants
      const variants = await variantService.getAll();
      expect(variants.length).toBeGreaterThan(0);
    });
  });

  describe('Extra Management CRUD', () => {
    it('should create and retrieve an extra', async () => {
      const timestamp = Date.now();
      const extra = await extraService.create({
        name: `Extra Cheese-${timestamp}`,
        price: 1.5,
      });

      expect(extra.id).toBeDefined();
      expect(extra.name).toBe(`Extra Cheese-${timestamp}`);
      expect(extra.price).toBe(1.5);

      const retrieved = await extraService.getById(extra.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(`Extra Cheese-${timestamp}`);
    });

    it('should update extra details', async () => {
      const timestamp = Date.now();
      const extra = await extraService.create({
        name: `Extra Bacon-${timestamp}`,
        price: 2.0,
      });

      const updated = await extraService.update(extra.id ?? 0, {
        price: 2.5,
      });

      expect(updated.price).toBe(2.5);
    });

    it('should delete an extra', async () => {
      const timestamp = Date.now();
      const extra = await extraService.create({
        name: `ToDelete-Extra-${timestamp}`,
        price: 1.0,
      });

      await extraService.delete(extra.id ?? 0);
      const retrieved = await extraService.getById(extra.id ?? 0);
      expect(retrieved).toBeNull();
    });
  });

  describe('Ingredient Management CRUD', () => {
    it('should create and retrieve an ingredient', async () => {
      const timestamp = Date.now();
      const ingredient = await ingredientService.create({
        name: `Tomato-${timestamp}`,
        stockQuantity: 100,
        unit: 'kg',
      });

      expect(ingredient.id).toBeDefined();
      expect(ingredient.name).toBe(`Tomato-${timestamp}`);
      expect(ingredient.stockQuantity).toBe(100);

      const retrieved = await ingredientService.getById(ingredient.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(`Tomato-${timestamp}`);
    });

    it('should update ingredient stock', async () => {
      const timestamp = Date.now();
      const ingredient = await ingredientService.create({
        name: `Flour-${timestamp}`,
        stockQuantity: 50,
        unit: 'kg',
      });

      const updated = await ingredientService.update(ingredient.id ?? 0, {
        stockQuantity: 75,
      });

      expect(updated.stockQuantity).toBe(75);
    });

    it('should delete an ingredient', async () => {
      const timestamp = Date.now();
      const ingredient = await ingredientService.create({
        name: `ToDelete-Ing-${timestamp}`,
        stockQuantity: 10,
        unit: 'kg',
      });

      await ingredientService.delete(ingredient.id ?? 0);
      const retrieved = await ingredientService.getById(ingredient.id ?? 0);
      expect(retrieved).toBeNull();
    });

    it('should track low stock items (< 5 units)', async () => {
      const timestamp = Date.now();
      await ingredientService.create({
        name: `Low Stock Item-${timestamp}`,
        stockQuantity: 3,
        unit: 'kg',
      });

      const allIngredients = await ingredientService.getAll();
      const lowStockItems = allIngredients.filter((i) => i.stockQuantity < LOW_STOCK_THRESHOLD);

      expect(lowStockItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across service calls', async () => {
      const timestamp = Date.now();
      // Create a category
      const category = await categoryService.create({
        name: `Persistent-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      // Retrieve it again (simulating page refresh)
      const retrieved = await categoryService.getById(category.id ?? 0);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(`Persistent-${timestamp}`);
    });

    it('should maintain relationships between entities', async () => {
      const timestamp = Date.now();
      // Create category and product
      const category = await categoryService.create({
        name: `Test Category-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Test Product-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 10.0,
        stock: 50,
        isAvailable: true,
      });

      // Verify relationship is maintained
      const retrievedProduct = await productService.getById(product.id ?? 0);
      expect(retrievedProduct?.categoryId).toBe(category.id);
    });
  });

  describe('Entity Relationships', () => {
    it('should link products to categories', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Drinks-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Cola-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 2.0,
        stock: 100,
        isAvailable: true,
      });

      expect(product.categoryId).toBe(category.id);
    });

    it('should link variants to products', async () => {
      const timestamp = Date.now();
      const category = await categoryService.create({
        name: `Beverages4-${timestamp}`,
        sortOrder: 1,
        isActive: true,
      });

      const product = await productService.create({
        name: `Tea-${timestamp}`,
        categoryId: category.id ?? 0,
        price: 1.5,
        stock: 100,
        isAvailable: true,
      });

      const variant = await variantService.create({
        name: `Medium-${timestamp}`,
        productId: product.id ?? 0,
        priceModifier: 0.5,
      });

      expect(variant.productId).toBe(product.id);
    });
  });
});
