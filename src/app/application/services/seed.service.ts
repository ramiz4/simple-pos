import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../../infrastructure/repositories/sqlite-code-translation.repository';
import { IndexedDBCodeTranslationRepository } from '../../infrastructure/repositories/indexeddb-code-translation.repository';
import { TableStatusEnum, OrderTypeEnum, OrderStatusEnum, UserRoleEnum } from '../../domain/enums';
import { TableService } from './table.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { VariantService } from './variant.service';
import { ExtraService } from './extra.service';
import { IngredientService } from './ingredient.service';
import { ProductExtraService } from './product-extra.service';
import { ProductIngredientService } from './product-ingredient.service';

interface SeedData {
  codeType: string;
  code: string;
  sortOrder: number;
  translations: {
    en: string;
    sq: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SeedService {
  private seedData: SeedData[] = [
    {
      codeType: 'TABLE_STATUS',
      code: TableStatusEnum.FREE,
      sortOrder: 1,
      translations: { en: 'Free', sq: 'I Lirë' },
    },
    {
      codeType: 'TABLE_STATUS',
      code: TableStatusEnum.OCCUPIED,
      sortOrder: 2,
      translations: { en: 'Occupied', sq: 'I Zënë' },
    },
    {
      codeType: 'TABLE_STATUS',
      code: TableStatusEnum.RESERVED,
      sortOrder: 3,
      translations: { en: 'Reserved', sq: 'I Rezervuar' },
    },

    {
      codeType: 'ORDER_TYPE',
      code: OrderTypeEnum.DINE_IN,
      sortOrder: 1,
      translations: { en: 'Dine In', sq: 'Në Lokal' },
    },
    {
      codeType: 'ORDER_TYPE',
      code: OrderTypeEnum.TAKEAWAY,
      sortOrder: 2,
      translations: { en: 'Takeaway', sq: 'Me Marrë' },
    },
    {
      codeType: 'ORDER_TYPE',
      code: OrderTypeEnum.DELIVERY,
      sortOrder: 3,
      translations: { en: 'Delivery', sq: 'Dërgim' },
    },

    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.OPEN,
      sortOrder: 1,
      translations: { en: 'Open', sq: 'I Hapur' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.PAID,
      sortOrder: 2,
      translations: { en: 'Paid', sq: 'I Paguar' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.PREPARING,
      sortOrder: 3,
      translations: { en: 'Preparing', sq: 'Në Përgatitje' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.READY,
      sortOrder: 4,
      translations: { en: 'Ready', sq: 'Gati' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.OUT_FOR_DELIVERY,
      sortOrder: 5,
      translations: { en: 'Out for Delivery', sq: 'Në Dërgim' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.COMPLETED,
      sortOrder: 6,
      translations: { en: 'Completed', sq: 'I Përfunduar' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.CANCELLED,
      sortOrder: 7,
      translations: { en: 'Cancelled', sq: 'I Anuluar' },
    },

    {
      codeType: 'USER_ROLE',
      code: UserRoleEnum.ADMIN,
      sortOrder: 1,
      translations: { en: 'Admin', sq: 'Administrator' },
    },
    {
      codeType: 'USER_ROLE',
      code: UserRoleEnum.CASHIER,
      sortOrder: 2,
      translations: { en: 'Cashier', sq: 'Arkëtar' },
    },
    {
      codeType: 'USER_ROLE',
      code: UserRoleEnum.KITCHEN,
      sortOrder: 3,
      translations: { en: 'Kitchen', sq: 'Kuzhinë' },
    },
    {
      codeType: 'USER_ROLE',
      code: UserRoleEnum.DRIVER,
      sortOrder: 4,
      translations: { en: 'Driver', sq: 'Shofër' },
    },
  ];

  constructor(
    private platformService: PlatformService,
    private sqliteCodeTableRepo: SQLiteCodeTableRepository,
    private indexedDBCodeTableRepo: IndexedDBCodeTableRepository,
    private sqliteCodeTranslationRepo: SQLiteCodeTranslationRepository,
    private indexedDBCodeTranslationRepo: IndexedDBCodeTranslationRepository,
    private tableService: TableService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private ingredientService: IngredientService,
    private productExtraService: ProductExtraService,
    private productIngredientService: ProductIngredientService,
  ) {}

  async seedDatabase(): Promise<void> {
    const codeTableRepo = this.getCodeTableRepo();
    const codeTranslationRepo = this.getCodeTranslationRepo();

    console.log('Checking database seeding...');

    // Seed code tables
    for (const data of this.seedData) {
      const existing = await codeTableRepo.findByCodeTypeAndCode(data.codeType, data.code);
      if (existing) continue;

      console.log(`Seeding: ${data.codeType}.${data.code}`);
      const codeTable = await codeTableRepo.create({
        codeType: data.codeType,
        code: data.code,
        sortOrder: data.sortOrder,
        isActive: true,
      });

      await codeTranslationRepo.create({
        codeTableId: codeTable.id,
        language: 'en',
        label: data.translations.en,
      });

      await codeTranslationRepo.create({
        codeTableId: codeTable.id,
        language: 'sq',
        label: data.translations.sq,
      });
    }

    console.log('Database seeding completed!');

    // Seed test data for tables, categories, products, etc.
    await this.seedTestData();
  }

  private async seedTestData(): Promise<void> {
    console.log('Checking test data seeding...');
    
    // Check if we already have test data by checking multiple entities
    const [existingTables, existingCategories, existingProducts] = await Promise.all([
      this.tableService.getAll(),
      this.categoryService.getAll(),
      this.productService.getAll(),
    ]);

    // If all test data exists, skip seeding to avoid duplicates
    if (existingTables.length > 0 && existingCategories.length > 0 && existingProducts.length > 0) {
      console.log('Test data already exists, skipping seeding');
      return;
    }

    console.log('Seeding test data...');

    // Get the status IDs we'll need for tables
    const codeTableRepo = this.getCodeTableRepo();
    const tableStatuses = await codeTableRepo.findByCodeType('TABLE_STATUS');
    const freeStatus = tableStatuses.find(s => s.code === TableStatusEnum.FREE);
    if (!freeStatus || freeStatus.id == null) {
      throw new Error('FREE table status not found. Ensure code tables are seeded before test data.');
    }
    const freeStatusId = freeStatus.id;

    // 1. Seed Tables
    await this.seedTables(freeStatusId);

    // 2. Seed Categories
    const categories = await this.seedCategories();

    // 3. Seed Extras
    const extras = await this.seedExtras();

    // 4. Seed Ingredients
    const ingredients = await this.seedIngredients();

    // 5. Seed Products
    const products = await this.seedProducts(categories);

    // 6. Seed Variants
    await this.seedVariants(products);

    // 7. Link Products to Extras
    await this.seedProductExtras(products, extras);

    // 8. Link Products to Ingredients
    await this.seedProductIngredients(products, ingredients);

    console.log('Test data seeding completed!');
  }

  private async seedTables(freeStatusId: number): Promise<void> {
    console.log('Seeding tables...');
    const tables = [
      { name: 'Table 1', number: 1, seats: 2, statusId: freeStatusId },
      { name: 'Table 2', number: 2, seats: 4, statusId: freeStatusId },
      { name: 'Table 3', number: 3, seats: 4, statusId: freeStatusId },
      { name: 'Table 4', number: 4, seats: 6, statusId: freeStatusId },
      { name: 'Table 5', number: 5, seats: 2, statusId: freeStatusId },
      { name: 'Table 6', number: 6, seats: 8, statusId: freeStatusId },
      { name: 'Bar 1', number: 7, seats: 1, statusId: freeStatusId },
      { name: 'Bar 2', number: 8, seats: 1, statusId: freeStatusId },
    ];

    for (const table of tables) {
      await this.tableService.create(table);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${tables.length} tables`);
  }

  private async seedCategories(): Promise<Map<string, number>> {
    console.log('Seeding categories...');
    const categories = [
      { name: 'Pizzas', sortOrder: 1, isActive: true },
      { name: 'Burgers', sortOrder: 2, isActive: true },
      { name: 'Pasta', sortOrder: 3, isActive: true },
      { name: 'Salads', sortOrder: 4, isActive: true },
      { name: 'Beverages', sortOrder: 5, isActive: true },
      { name: 'Desserts', sortOrder: 6, isActive: true },
    ];

    const categoryMap = new Map<string, number>();
    for (const category of categories) {
      const created = await this.categoryService.create(category);
      categoryMap.set(category.name, created.id);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${categories.length} categories`);
    return categoryMap;
  }

  private async seedExtras(): Promise<Map<string, number>> {
    console.log('Seeding extras...');
    const extras = [
      { name: 'Extra Cheese', price: 1.50 },
      { name: 'Bacon', price: 2.00 },
      { name: 'Mushrooms', price: 1.00 },
      { name: 'Olives', price: 0.75 },
      { name: 'Pepperoni', price: 2.00 },
      { name: 'Onions', price: 0.50 },
      { name: 'Jalapeños', price: 1.00 },
      { name: 'Extra Sauce', price: 0.50 },
    ];

    const extraMap = new Map<string, number>();
    for (const extra of extras) {
      const created = await this.extraService.create(extra);
      extraMap.set(extra.name, created.id);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${extras.length} extras`);
    return extraMap;
  }

  private async seedIngredients(): Promise<Map<string, number>> {
    console.log('Seeding ingredients...');
    const ingredients = [
      { name: 'Tomato Sauce', stockQuantity: 500, unit: 'ml' },
      { name: 'Mozzarella', stockQuantity: 1000, unit: 'g' },
      { name: 'Flour', stockQuantity: 5000, unit: 'g' },
      { name: 'Ground Beef', stockQuantity: 2000, unit: 'g' },
      { name: 'Lettuce', stockQuantity: 500, unit: 'g' },
      { name: 'Tomato', stockQuantity: 1000, unit: 'g' },
      { name: 'Onion', stockQuantity: 800, unit: 'g' },
      { name: 'Pasta', stockQuantity: 3000, unit: 'g' },
      { name: 'Olive Oil', stockQuantity: 1000, unit: 'ml' },
      { name: 'Basil', stockQuantity: 100, unit: 'g' },
    ];

    const ingredientMap = new Map<string, number>();
    for (const ingredient of ingredients) {
      const created = await this.ingredientService.create(ingredient);
      ingredientMap.set(ingredient.name, created.id);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${ingredients.length} ingredients`);
    return ingredientMap;
  }

  private async seedProducts(categories: Map<string, number>): Promise<Map<string, number>> {
    console.log('Seeding products...');
    const products = [
      // Pizzas
      { name: 'Margherita Pizza', categoryId: categories.get('Pizzas')!, price: 9.99, stock: 50, isAvailable: true },
      { name: 'Pepperoni Pizza', categoryId: categories.get('Pizzas')!, price: 12.99, stock: 50, isAvailable: true },
      { name: 'Vegetarian Pizza', categoryId: categories.get('Pizzas')!, price: 11.99, stock: 50, isAvailable: true },
      // Burgers
      { name: 'Classic Burger', categoryId: categories.get('Burgers')!, price: 8.99, stock: 40, isAvailable: true },
      { name: 'Cheese Burger', categoryId: categories.get('Burgers')!, price: 9.99, stock: 40, isAvailable: true },
      { name: 'Bacon Burger', categoryId: categories.get('Burgers')!, price: 11.99, stock: 30, isAvailable: true },
      // Pasta
      { name: 'Spaghetti Bolognese', categoryId: categories.get('Pasta')!, price: 10.99, stock: 35, isAvailable: true },
      { name: 'Carbonara', categoryId: categories.get('Pasta')!, price: 11.99, stock: 35, isAvailable: true },
      { name: 'Penne Arrabbiata', categoryId: categories.get('Pasta')!, price: 9.99, stock: 35, isAvailable: true },
      // Salads
      { name: 'Caesar Salad', categoryId: categories.get('Salads')!, price: 7.99, stock: 25, isAvailable: true },
      { name: 'Greek Salad', categoryId: categories.get('Salads')!, price: 8.99, stock: 25, isAvailable: true },
      // Beverages
      { name: 'Coca Cola', categoryId: categories.get('Beverages')!, price: 2.50, stock: 100, isAvailable: true },
      { name: 'Orange Juice', categoryId: categories.get('Beverages')!, price: 3.50, stock: 80, isAvailable: true },
      { name: 'Water', categoryId: categories.get('Beverages')!, price: 1.50, stock: 150, isAvailable: true },
      // Desserts
      { name: 'Tiramisu', categoryId: categories.get('Desserts')!, price: 6.99, stock: 20, isAvailable: true },
      { name: 'Cheesecake', categoryId: categories.get('Desserts')!, price: 5.99, stock: 20, isAvailable: true },
    ];

    const productMap = new Map<string, number>();
    for (const product of products) {
      const created = await this.productService.create(product);
      productMap.set(product.name, created.id);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${products.length} products`);
    return productMap;
  }

  private async seedVariants(products: Map<string, number>): Promise<void> {
    console.log('Seeding variants...');
    const variants = [
      // Pizza sizes
      { productId: products.get('Margherita Pizza')!, name: 'Small (10")', priceModifier: -2.00 },
      { productId: products.get('Margherita Pizza')!, name: 'Medium (12")', priceModifier: 0 },
      { productId: products.get('Margherita Pizza')!, name: 'Large (14")', priceModifier: 3.00 },
      { productId: products.get('Pepperoni Pizza')!, name: 'Small (10")', priceModifier: -2.00 },
      { productId: products.get('Pepperoni Pizza')!, name: 'Medium (12")', priceModifier: 0 },
      { productId: products.get('Pepperoni Pizza')!, name: 'Large (14")', priceModifier: 3.00 },
      { productId: products.get('Vegetarian Pizza')!, name: 'Small (10")', priceModifier: -2.00 },
      { productId: products.get('Vegetarian Pizza')!, name: 'Medium (12")', priceModifier: 0 },
      { productId: products.get('Vegetarian Pizza')!, name: 'Large (14")', priceModifier: 3.00 },
      // Burger options
      { productId: products.get('Classic Burger')!, name: 'Single', priceModifier: 0 },
      { productId: products.get('Classic Burger')!, name: 'Double', priceModifier: 3.00 },
      { productId: products.get('Cheese Burger')!, name: 'Single', priceModifier: 0 },
      { productId: products.get('Cheese Burger')!, name: 'Double', priceModifier: 3.00 },
      { productId: products.get('Bacon Burger')!, name: 'Single', priceModifier: 0 },
      { productId: products.get('Bacon Burger')!, name: 'Double', priceModifier: 3.00 },
      // Beverage sizes
      { productId: products.get('Coca Cola')!, name: 'Small (250ml)', priceModifier: -0.50 },
      { productId: products.get('Coca Cola')!, name: 'Medium (500ml)', priceModifier: 0 },
      { productId: products.get('Coca Cola')!, name: 'Large (750ml)', priceModifier: 1.00 },
      { productId: products.get('Orange Juice')!, name: 'Small (250ml)', priceModifier: -0.50 },
      { productId: products.get('Orange Juice')!, name: 'Medium (500ml)', priceModifier: 0 },
    ];

    for (const variant of variants) {
      await this.variantService.create(variant);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${variants.length} variants`);
  }

  private async seedProductExtras(products: Map<string, number>, extras: Map<string, number>): Promise<void> {
    console.log('Seeding product-extra relationships...');
    const productExtras = [
      // Pizzas can have various extras
      { productId: products.get('Margherita Pizza')!, extraId: extras.get('Extra Cheese')! },
      { productId: products.get('Margherita Pizza')!, extraId: extras.get('Mushrooms')! },
      { productId: products.get('Margherita Pizza')!, extraId: extras.get('Olives')! },
      { productId: products.get('Pepperoni Pizza')!, extraId: extras.get('Extra Cheese')! },
      { productId: products.get('Pepperoni Pizza')!, extraId: extras.get('Jalapeños')! },
      { productId: products.get('Pepperoni Pizza')!, extraId: extras.get('Extra Sauce')! },
      { productId: products.get('Vegetarian Pizza')!, extraId: extras.get('Extra Cheese')! },
      { productId: products.get('Vegetarian Pizza')!, extraId: extras.get('Mushrooms')! },
      { productId: products.get('Vegetarian Pizza')!, extraId: extras.get('Olives')! },
      { productId: products.get('Vegetarian Pizza')!, extraId: extras.get('Onions')! },
      // Burgers can have extras
      { productId: products.get('Classic Burger')!, extraId: extras.get('Extra Cheese')! },
      { productId: products.get('Classic Burger')!, extraId: extras.get('Bacon')! },
      { productId: products.get('Classic Burger')!, extraId: extras.get('Onions')! },
      { productId: products.get('Cheese Burger')!, extraId: extras.get('Extra Cheese')! },
      { productId: products.get('Cheese Burger')!, extraId: extras.get('Bacon')! },
      { productId: products.get('Bacon Burger')!, extraId: extras.get('Extra Cheese')! },
    ];

    for (const productExtra of productExtras) {
      await this.productExtraService.addExtraToProduct(productExtra.productId, productExtra.extraId);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${productExtras.length} product-extra relationships`);
  }

  private async seedProductIngredients(products: Map<string, number>, ingredients: Map<string, number>): Promise<void> {
    console.log('Seeding product-ingredient relationships...');
    const productIngredients = [
      // Margherita Pizza ingredients
      { productId: products.get('Margherita Pizza')!, ingredientId: ingredients.get('Flour')!, quantity: 200 },
      { productId: products.get('Margherita Pizza')!, ingredientId: ingredients.get('Tomato Sauce')!, quantity: 100 },
      { productId: products.get('Margherita Pizza')!, ingredientId: ingredients.get('Mozzarella')!, quantity: 150 },
      { productId: products.get('Margherita Pizza')!, ingredientId: ingredients.get('Basil')!, quantity: 5 },
      // Pepperoni Pizza ingredients
      { productId: products.get('Pepperoni Pizza')!, ingredientId: ingredients.get('Flour')!, quantity: 200 },
      { productId: products.get('Pepperoni Pizza')!, ingredientId: ingredients.get('Tomato Sauce')!, quantity: 100 },
      { productId: products.get('Pepperoni Pizza')!, ingredientId: ingredients.get('Mozzarella')!, quantity: 150 },
      // Burgers ingredients
      { productId: products.get('Classic Burger')!, ingredientId: ingredients.get('Ground Beef')!, quantity: 150 },
      { productId: products.get('Classic Burger')!, ingredientId: ingredients.get('Lettuce')!, quantity: 30 },
      { productId: products.get('Classic Burger')!, ingredientId: ingredients.get('Tomato')!, quantity: 40 },
      { productId: products.get('Classic Burger')!, ingredientId: ingredients.get('Onion')!, quantity: 20 },
      { productId: products.get('Cheese Burger')!, ingredientId: ingredients.get('Ground Beef')!, quantity: 150 },
      { productId: products.get('Cheese Burger')!, ingredientId: ingredients.get('Mozzarella')!, quantity: 50 },
      { productId: products.get('Cheese Burger')!, ingredientId: ingredients.get('Lettuce')!, quantity: 30 },
      { productId: products.get('Cheese Burger')!, ingredientId: ingredients.get('Tomato')!, quantity: 40 },
      // Pasta ingredients
      { productId: products.get('Spaghetti Bolognese')!, ingredientId: ingredients.get('Pasta')!, quantity: 200 },
      { productId: products.get('Spaghetti Bolognese')!, ingredientId: ingredients.get('Ground Beef')!, quantity: 100 },
      { productId: products.get('Spaghetti Bolognese')!, ingredientId: ingredients.get('Tomato Sauce')!, quantity: 150 },
      { productId: products.get('Spaghetti Bolognese')!, ingredientId: ingredients.get('Onion')!, quantity: 30 },
      { productId: products.get('Carbonara')!, ingredientId: ingredients.get('Pasta')!, quantity: 200 },
      { productId: products.get('Carbonara')!, ingredientId: ingredients.get('Mozzarella')!, quantity: 80 },
      // Salads ingredients
      { productId: products.get('Caesar Salad')!, ingredientId: ingredients.get('Lettuce')!, quantity: 150 },
      { productId: products.get('Caesar Salad')!, ingredientId: ingredients.get('Mozzarella')!, quantity: 40 },
      { productId: products.get('Greek Salad')!, ingredientId: ingredients.get('Lettuce')!, quantity: 100 },
      { productId: products.get('Greek Salad')!, ingredientId: ingredients.get('Tomato')!, quantity: 80 },
      { productId: products.get('Greek Salad')!, ingredientId: ingredients.get('Onion')!, quantity: 30 },
      { productId: products.get('Greek Salad')!, ingredientId: ingredients.get('Olive Oil')!, quantity: 20 },
    ];

    for (const productIngredient of productIngredients) {
      await this.productIngredientService.addIngredientToProduct(
        productIngredient.productId, 
        productIngredient.ingredientId, 
        productIngredient.quantity
      );
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    console.log(`Seeded ${productIngredients.length} product-ingredient relationships`);
  }

  private getCodeTableRepo() {
    return this.platformService.isTauri() ? this.sqliteCodeTableRepo : this.indexedDBCodeTableRepo;
  }

  private getCodeTranslationRepo() {
    return this.platformService.isTauri()
      ? this.sqliteCodeTranslationRepo
      : this.indexedDBCodeTranslationRepo;
  }
}
