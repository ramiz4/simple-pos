import { Inject, Injectable } from '@angular/core';
import {
  OrderStatusEnum,
  OrderTypeEnum,
  TableStatusEnum,
  UserRoleEnum,
} from '@simple-pos/shared/types';
import { CodeTableRepository } from '../../core/interfaces/code-table-repository.interface';
import { CodeTranslationRepository } from '../../core/interfaces/code-translation-repository.interface';
import {
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
} from '../../infrastructure/tokens/repository.tokens';
import { CategoryService } from './category.service';
import { ExtraService } from './extra.service';
import { IngredientService } from './ingredient.service';
import { ProductExtraService } from './product-extra.service';
import { ProductIngredientService } from './product-ingredient.service';
import { ProductService } from './product.service';
import { TableService } from './table.service';
import { VariantService } from './variant.service';

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
      code: OrderStatusEnum.SERVED,
      sortOrder: 6,
      translations: { en: 'Served', sq: 'I Shërbyer' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.COMPLETED,
      sortOrder: 7,
      translations: { en: 'Completed', sq: 'I Përfunduar' },
    },
    {
      codeType: 'ORDER_STATUS',
      code: OrderStatusEnum.CANCELLED,
      sortOrder: 8,
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

  private codeTableRepo: CodeTableRepository;
  private codeTranslationRepo: CodeTranslationRepository;

  constructor(
    @Inject(CODE_TABLE_REPOSITORY) codeTableRepo: CodeTableRepository,
    @Inject(CODE_TRANSLATION_REPOSITORY) codeTranslationRepo: CodeTranslationRepository,
    private tableService: TableService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private ingredientService: IngredientService,
    private productExtraService: ProductExtraService,
    private productIngredientService: ProductIngredientService,
  ) {
    this.codeTableRepo = codeTableRepo;
    this.codeTranslationRepo = codeTranslationRepo;
  }

  async seedDatabase(): Promise<void> {
    console.log('Checking database seeding...');

    // Seed code tables
    for (const data of this.seedData) {
      const existing = await this.codeTableRepo.findByCodeTypeAndCode(data.codeType, data.code);
      if (existing) continue;

      console.log(`Seeding: ${data.codeType}.${data.code}`);
      const codeTable = await this.codeTableRepo.create({
        codeType: data.codeType,
        code: data.code,
        sortOrder: data.sortOrder,
        isActive: true,
      });

      await this.codeTranslationRepo.create({
        codeTableId: codeTable.id,
        language: 'en',
        label: data.translations.en,
      });

      await this.codeTranslationRepo.create({
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

    // We no longer need the global guard because each sub-method is now idempotent.
    // This allows for partial seeding recovery.
    console.log('Seeding test data...');

    // Get the status IDs we'll need for tables
    const tableStatuses = await this.codeTableRepo.findByCodeType('TABLE_STATUS');
    const freeStatus = tableStatuses.find((s) => s.code === TableStatusEnum.FREE);
    if (!freeStatus || freeStatus.id == null) {
      throw new Error(
        'FREE table status not found. Ensure code tables are seeded before test data.',
      );
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

    const currentTables = await this.tableService.getAll();
    for (const table of tables) {
      if (currentTables.some((t) => t.number === table.number)) continue;
      await this.tableService.create(table);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    console.log('Tables seeding completed');
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

    const currentCategories = await this.categoryService.getAll();
    const categoryMap = new Map<string, number>();

    for (const cat of categories) {
      const existing = currentCategories.find((c) => c.name === cat.name);
      if (existing) {
        categoryMap.set(existing.name, existing.id);
      } else {
        const created = await this.categoryService.create(cat);
        categoryMap.set(cat.name, created.id);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    }
    console.log('Categories seeding completed');
    return categoryMap;
  }

  private async seedExtras(): Promise<Map<string, number>> {
    console.log('Seeding extras...');
    const extras = [
      { name: 'Extra Cheese', price: 1.5 },
      { name: 'Bacon', price: 2.0 },
      { name: 'Mushrooms', price: 1.0 },
      { name: 'Olives', price: 0.75 },
      { name: 'Pepperoni', price: 2.0 },
      { name: 'Onions', price: 0.5 },
      { name: 'Jalapeños', price: 1.0 },
      { name: 'Extra Sauce', price: 0.5 },
    ];

    const currentExtras = await this.extraService.getAll();
    const extraMap = new Map<string, number>();

    for (const extra of extras) {
      const existing = currentExtras.find((e) => e.name === extra.name);
      if (existing) {
        extraMap.set(existing.name, existing.id);
      } else {
        const created = await this.extraService.create(extra);
        extraMap.set(extra.name, created.id);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    }
    console.log('Extras seeding completed');
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

    const currentIngredients = await this.ingredientService.getAll();
    const ingredientMap = new Map<string, number>();

    for (const ingredient of ingredients) {
      const existing = currentIngredients.find((i) => i.name === ingredient.name);
      if (existing) {
        ingredientMap.set(existing.name, existing.id);
      } else {
        const created = await this.ingredientService.create(ingredient);
        ingredientMap.set(ingredient.name, created.id);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    }
    console.log('Ingredients seeding completed');
    return ingredientMap;
  }

  private async seedProducts(categories: Map<string, number>): Promise<Map<string, number>> {
    console.log('Seeding products...');
    const products = [
      // Pizzas
      {
        name: 'Margherita Pizza',
        categoryId: this.getRequiredId(categories, 'Pizzas', 'categories'),
        price: 9.99,
        stock: 50,
        isAvailable: true,
      },
      {
        name: 'Pepperoni Pizza',
        categoryId: this.getRequiredId(categories, 'Pizzas', 'categories'),
        price: 12.99,
        stock: 50,
        isAvailable: true,
      },
      {
        name: 'Vegetarian Pizza',
        categoryId: this.getRequiredId(categories, 'Pizzas', 'categories'),
        price: 11.99,
        stock: 50,
        isAvailable: true,
      },
      // Burgers
      {
        name: 'Classic Burger',
        categoryId: this.getRequiredId(categories, 'Burgers', 'categories'),
        price: 8.99,
        stock: 40,
        isAvailable: true,
      },
      {
        name: 'Cheese Burger',
        categoryId: this.getRequiredId(categories, 'Burgers', 'categories'),
        price: 9.99,
        stock: 40,
        isAvailable: true,
      },
      {
        name: 'Bacon Burger',
        categoryId: this.getRequiredId(categories, 'Burgers', 'categories'),
        price: 11.99,
        stock: 30,
        isAvailable: true,
      },
      // Pasta
      {
        name: 'Spaghetti Bolognese',
        categoryId: this.getRequiredId(categories, 'Pasta', 'categories'),
        price: 10.99,
        stock: 35,
        isAvailable: true,
      },
      {
        name: 'Carbonara',
        categoryId: this.getRequiredId(categories, 'Pasta', 'categories'),
        price: 11.99,
        stock: 35,
        isAvailable: true,
      },
      {
        name: 'Penne Arrabbiata',
        categoryId: this.getRequiredId(categories, 'Pasta', 'categories'),
        price: 9.99,
        stock: 35,
        isAvailable: true,
      },
      // Salads
      {
        name: 'Caesar Salad',
        categoryId: this.getRequiredId(categories, 'Salads', 'categories'),
        price: 7.99,
        stock: 25,
        isAvailable: true,
      },
      {
        name: 'Greek Salad',
        categoryId: this.getRequiredId(categories, 'Salads', 'categories'),
        price: 8.99,
        stock: 25,
        isAvailable: true,
      },
      // Beverages
      {
        name: 'Coca Cola',
        categoryId: this.getRequiredId(categories, 'Beverages', 'categories'),
        price: 2.5,
        stock: 100,
        isAvailable: true,
      },
      {
        name: 'Orange Juice',
        categoryId: this.getRequiredId(categories, 'Beverages', 'categories'),
        price: 3.5,
        stock: 80,
        isAvailable: true,
      },
      {
        name: 'Water',
        categoryId: this.getRequiredId(categories, 'Beverages', 'categories'),
        price: 1.5,
        stock: 150,
        isAvailable: true,
      },
      // Desserts
      {
        name: 'Tiramisu',
        categoryId: this.getRequiredId(categories, 'Desserts', 'categories'),
        price: 6.99,
        stock: 20,
        isAvailable: true,
      },
      {
        name: 'Cheesecake',
        categoryId: this.getRequiredId(categories, 'Desserts', 'categories'),
        price: 5.99,
        stock: 20,
        isAvailable: true,
      },
    ];

    const currentProducts = await this.productService.getAll();
    const productMap = new Map<string, number>();

    for (const product of products) {
      const existing = currentProducts.find((p) => p.name === product.name);
      if (existing) {
        productMap.set(existing.name, existing.id);
      } else {
        const created = await this.productService.create(product);
        productMap.set(product.name, created.id);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    }
    console.log('Products seeding completed');
    return productMap;
  }

  private async seedVariants(products: Map<string, number>): Promise<void> {
    console.log('Seeding variants...');
    const variants = [
      // Pizza sizes
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        name: 'Small (10")',
        priceModifier: -2.0,
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        name: 'Medium (12")',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        name: 'Large (14")',
        priceModifier: 3.0,
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        name: 'Small (10")',
        priceModifier: -2.0,
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        name: 'Medium (12")',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        name: 'Large (14")',
        priceModifier: 3.0,
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        name: 'Small (10")',
        priceModifier: -2.0,
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        name: 'Medium (12")',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        name: 'Large (14")',
        priceModifier: 3.0,
      },
      // Burger options
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        name: 'Single',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        name: 'Double',
        priceModifier: 3.0,
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        name: 'Single',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        name: 'Double',
        priceModifier: 3.0,
      },
      {
        productId: this.getRequiredId(products, 'Bacon Burger', 'products'),
        name: 'Single',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Bacon Burger', 'products'),
        name: 'Double',
        priceModifier: 3.0,
      },
      // Beverage sizes
      {
        productId: this.getRequiredId(products, 'Coca Cola', 'products'),
        name: 'Small (250ml)',
        priceModifier: -0.5,
      },
      {
        productId: this.getRequiredId(products, 'Coca Cola', 'products'),
        name: 'Medium (500ml)',
        priceModifier: 0,
      },
      {
        productId: this.getRequiredId(products, 'Coca Cola', 'products'),
        name: 'Large (750ml)',
        priceModifier: 1.0,
      },
      {
        productId: this.getRequiredId(products, 'Orange Juice', 'products'),
        name: 'Small (250ml)',
        priceModifier: -0.5,
      },
      {
        productId: this.getRequiredId(products, 'Orange Juice', 'products'),
        name: 'Medium (500ml)',
        priceModifier: 0,
      },
    ];

    const currentVariants = await this.variantService.getAll();
    for (const variant of variants) {
      if (currentVariants.some((v) => v.productId === variant.productId && v.name === variant.name))
        continue;
      await this.variantService.create(variant);
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    console.log('Variants seeding completed');
  }

  private async seedProductExtras(
    products: Map<string, number>,
    extras: Map<string, number>,
  ): Promise<void> {
    console.log('Seeding product-extra relationships...');
    const productExtras = [
      // Pizzas can have various extras
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Cheese', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Mushrooms', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Olives', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Cheese', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Jalapeños', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Sauce', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Cheese', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Mushrooms', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Olives', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Vegetarian Pizza', 'products'),
        extraId: this.getRequiredId(extras, 'Onions', 'extras'),
      },
      // Burgers can have extras
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Cheese', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        extraId: this.getRequiredId(extras, 'Bacon', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        extraId: this.getRequiredId(extras, 'Onions', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Cheese', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        extraId: this.getRequiredId(extras, 'Bacon', 'extras'),
      },
      {
        productId: this.getRequiredId(products, 'Bacon Burger', 'products'),
        extraId: this.getRequiredId(extras, 'Extra Cheese', 'extras'),
      },
    ];

    for (const productExtra of productExtras) {
      const existing = await this.productExtraService.getByProduct(productExtra.productId);
      if (existing.some((e) => e.extraId === productExtra.extraId)) continue;

      await this.productExtraService.addExtraToProduct(
        productExtra.productId,
        productExtra.extraId,
      );
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    console.log('Product-extra relationships seeding completed');
  }

  private async seedProductIngredients(
    products: Map<string, number>,
    ingredients: Map<string, number>,
  ): Promise<void> {
    console.log('Seeding product-ingredient relationships...');
    const productIngredients = [
      // Margherita Pizza ingredients
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Flour', 'ingredients'),
        quantity: 200,
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Tomato Sauce', 'ingredients'),
        quantity: 100,
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Mozzarella', 'ingredients'),
        quantity: 150,
      },
      {
        productId: this.getRequiredId(products, 'Margherita Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Basil', 'ingredients'),
        quantity: 5,
      },
      // Pepperoni Pizza ingredients
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Flour', 'ingredients'),
        quantity: 200,
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Tomato Sauce', 'ingredients'),
        quantity: 100,
      },
      {
        productId: this.getRequiredId(products, 'Pepperoni Pizza', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Mozzarella', 'ingredients'),
        quantity: 150,
      },
      // Burgers ingredients
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Ground Beef', 'ingredients'),
        quantity: 150,
      },
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Lettuce', 'ingredients'),
        quantity: 30,
      },
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Tomato', 'ingredients'),
        quantity: 40,
      },
      {
        productId: this.getRequiredId(products, 'Classic Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Onion', 'ingredients'),
        quantity: 20,
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Ground Beef', 'ingredients'),
        quantity: 150,
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Mozzarella', 'ingredients'),
        quantity: 50,
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Lettuce', 'ingredients'),
        quantity: 30,
      },
      {
        productId: this.getRequiredId(products, 'Cheese Burger', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Tomato', 'ingredients'),
        quantity: 40,
      },
      // Pasta ingredients
      {
        productId: this.getRequiredId(products, 'Spaghetti Bolognese', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Pasta', 'ingredients'),
        quantity: 200,
      },
      {
        productId: this.getRequiredId(products, 'Spaghetti Bolognese', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Ground Beef', 'ingredients'),
        quantity: 100,
      },
      {
        productId: this.getRequiredId(products, 'Spaghetti Bolognese', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Tomato Sauce', 'ingredients'),
        quantity: 150,
      },
      {
        productId: this.getRequiredId(products, 'Spaghetti Bolognese', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Onion', 'ingredients'),
        quantity: 30,
      },
      {
        productId: this.getRequiredId(products, 'Carbonara', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Pasta', 'ingredients'),
        quantity: 200,
      },
      {
        productId: this.getRequiredId(products, 'Carbonara', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Mozzarella', 'ingredients'),
        quantity: 80,
      },
      // Salads ingredients
      {
        productId: this.getRequiredId(products, 'Caesar Salad', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Lettuce', 'ingredients'),
        quantity: 150,
      },
      {
        productId: this.getRequiredId(products, 'Caesar Salad', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Mozzarella', 'ingredients'),
        quantity: 40,
      },
      {
        productId: this.getRequiredId(products, 'Greek Salad', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Lettuce', 'ingredients'),
        quantity: 100,
      },
      {
        productId: this.getRequiredId(products, 'Greek Salad', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Tomato', 'ingredients'),
        quantity: 80,
      },
      {
        productId: this.getRequiredId(products, 'Greek Salad', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Onion', 'ingredients'),
        quantity: 30,
      },
      {
        productId: this.getRequiredId(products, 'Greek Salad', 'products'),
        ingredientId: this.getRequiredId(ingredients, 'Olive Oil', 'ingredients'),
        quantity: 20,
      },
    ];

    for (const pi of productIngredients) {
      const existing = await this.productIngredientService.getByProduct(pi.productId);
      if (existing.some((e) => e.ingredientId === pi.ingredientId)) continue;

      await this.productIngredientService.addIngredientToProduct(
        pi.productId,
        pi.ingredientId,
        pi.quantity,
      );
      // Small delay to ensure unique Date.now() IDs in IndexedDB
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    console.log('Product-ingredient relationships seeding completed');
  }

  private getRequiredId<K, V>(map: Map<K, V>, key: K, mapName: string): V {
    const value = map.get(key);
    if (value === undefined || value === null) {
      throw new Error(`${key} not found in ${mapName} map. Ensure dependencies are seeded.`);
    }
    return value;
  }
}
