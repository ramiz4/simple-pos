import { TestBed } from '@angular/core/testing';
import { SeedService } from '../application/services/seed.service';
import { TableService } from '../application/services/table.service';
import { CategoryService } from '../application/services/category.service';
import { ProductService } from '../application/services/product.service';
import { VariantService } from '../application/services/variant.service';
import { ExtraService } from '../application/services/extra.service';
import { IngredientService } from '../application/services/ingredient.service';
import { ProductExtraService } from '../application/services/product-extra.service';
import { ProductIngredientService } from '../application/services/product-ingredient.service';
import { EnumMappingService } from '../application/services/enum-mapping.service';
import { IndexedDBService } from '../infrastructure/services/indexeddb.service';
import { PlatformService } from '../shared/utilities/platform.service';
import { SQLiteCodeTableRepository } from '../infrastructure/repositories/sqlite-code-table.repository';
import { IndexedDBCodeTableRepository } from '../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../infrastructure/repositories/sqlite-code-translation.repository';
import { IndexedDBCodeTranslationRepository } from '../infrastructure/repositories/indexeddb-code-translation.repository';
import { SQLiteTableRepository } from '../infrastructure/repositories/sqlite-table.repository';
import { IndexedDBTableRepository } from '../infrastructure/repositories/indexeddb-table.repository';
import { SQLiteCategoryRepository } from '../infrastructure/repositories/sqlite-category.repository';
import { IndexedDBCategoryRepository } from '../infrastructure/repositories/indexeddb-category.repository';
import { SQLiteProductRepository } from '../infrastructure/repositories/sqlite-product.repository';
import { IndexedDBProductRepository } from '../infrastructure/repositories/indexeddb-product.repository';
import { SQLiteVariantRepository } from '../infrastructure/repositories/sqlite-variant.repository';
import { IndexedDBVariantRepository } from '../infrastructure/repositories/indexeddb-variant.repository';
import { SQLiteExtraRepository } from '../infrastructure/repositories/sqlite-extra.repository';
import { IndexedDBExtraRepository } from '../infrastructure/repositories/indexeddb-extra.repository';
import { SQLiteIngredientRepository } from '../infrastructure/repositories/sqlite-ingredient.repository';
import { IndexedDBIngredientRepository } from '../infrastructure/repositories/indexeddb-ingredient.repository';
import { SQLiteProductExtraRepository } from '../infrastructure/repositories/sqlite-product-extra.repository';
import { IndexedDBProductExtraRepository } from '../infrastructure/repositories/indexeddb-product-extra.repository';
import { SQLiteProductIngredientRepository } from '../infrastructure/repositories/sqlite-product-ingredient.repository';
import { IndexedDBProductIngredientRepository } from '../infrastructure/repositories/indexeddb-product-ingredient.repository';

describe('Test Data Seeding Integration', () => {
  let seedService: SeedService;
  let tableService: TableService;
  let categoryService: CategoryService;
  let productService: ProductService;
  let variantService: VariantService;
  let extraService: ExtraService;
  let ingredientService: IngredientService;
  let productExtraService: ProductExtraService;
  let productIngredientService: ProductIngredientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SeedService,
        EnumMappingService,
        IndexedDBService,
        PlatformService,
        TableService,
        CategoryService,
        ProductService,
        VariantService,
        ExtraService,
        IngredientService,
        ProductExtraService,
        ProductIngredientService,
        IndexedDBCodeTableRepository,
        IndexedDBCodeTranslationRepository,
        IndexedDBTableRepository,
        IndexedDBCategoryRepository,
        IndexedDBProductRepository,
        IndexedDBVariantRepository,
        IndexedDBExtraRepository,
        IndexedDBIngredientRepository,
        IndexedDBProductExtraRepository,
        IndexedDBProductIngredientRepository,
        { provide: SQLiteCodeTableRepository, useValue: {} },
        { provide: SQLiteCodeTranslationRepository, useValue: {} },
        { provide: SQLiteTableRepository, useValue: {} },
        { provide: SQLiteCategoryRepository, useValue: {} },
        { provide: SQLiteProductRepository, useValue: {} },
        { provide: SQLiteVariantRepository, useValue: {} },
        { provide: SQLiteExtraRepository, useValue: {} },
        { provide: SQLiteIngredientRepository, useValue: {} },
        { provide: SQLiteProductExtraRepository, useValue: {} },
        { provide: SQLiteProductIngredientRepository, useValue: {} },
      ],
    });

    seedService = TestBed.inject(SeedService);
    tableService = TestBed.inject(TableService);
    categoryService = TestBed.inject(CategoryService);
    productService = TestBed.inject(ProductService);
    variantService = TestBed.inject(VariantService);
    extraService = TestBed.inject(ExtraService);
    ingredientService = TestBed.inject(IngredientService);
    productExtraService = TestBed.inject(ProductExtraService);
    productIngredientService = TestBed.inject(ProductIngredientService);

    // Ensure we are in "web" mode for these tests (using IndexedDB)
    const platformService = TestBed.inject(PlatformService);
    vi.spyOn(platformService, 'isTauri').mockReturnValue(false);
    vi.spyOn(platformService, 'isWeb').mockReturnValue(true);
  });

  it('should seed all test data successfully', async () => {
    // Seed the database
    await seedService.seedDatabase();

    // Verify tables
    const tables = await tableService.getAll();
    expect(tables.length).toBe(8);
    expect(tables.some(t => t.name === 'Table 1')).toBe(true);
    expect(tables.some(t => t.name === 'Bar 2')).toBe(true);

    // Verify categories
    const categories = await categoryService.getAll();
    expect(categories.length).toBe(6);
    expect(categories.some(c => c.name === 'Pizzas')).toBe(true);
    expect(categories.some(c => c.name === 'Desserts')).toBe(true);

    // Verify products
    const products = await productService.getAll();
    expect(products.length).toBe(16);
    expect(products.some(p => p.name === 'Margherita Pizza')).toBe(true);
    expect(products.some(p => p.name === 'Cheesecake')).toBe(true);

    // Verify variants
    const variants = await variantService.getAll();
    expect(variants.length).toBe(20);
    expect(variants.some(v => v.name === 'Small (10")')).toBe(true);
    expect(variants.some(v => v.name === 'Double')).toBe(true);

    // Verify extras
    const extras = await extraService.getAll();
    expect(extras.length).toBe(8);
    expect(extras.some(e => e.name === 'Extra Cheese')).toBe(true);
    expect(extras.some(e => e.name === 'Jalapeños')).toBe(true);

    // Verify ingredients
    const ingredients = await ingredientService.getAll();
    expect(ingredients.length).toBe(10);
    expect(ingredients.some(i => i.name === 'Mozzarella')).toBe(true);
    expect(ingredients.some(i => i.name === 'Basil')).toBe(true);
    
    // Check that relationships exist
    const margheritaPizza = products.find(p => p.name === 'Margherita Pizza');
    expect(margheritaPizza).toBeDefined();

    const pizzaExtras = await productExtraService.getByProduct(margheritaPizza!.id);
    expect(pizzaExtras.length).toBeGreaterThan(0);

    const pizzaIngredients = await productIngredientService.getByProduct(margheritaPizza!.id);
    expect(pizzaIngredients.length).toBe(4); // Flour, Tomato Sauce, Mozzarella, Basil
  });

  it('should not duplicate data on second seeding', async () => {
    // Seed the database twice
    await seedService.seedDatabase();
    await seedService.seedDatabase();

    // Verify no duplicates
    const tables = await tableService.getAll();
    expect(tables.length).toBe(8);
    
    const categories = await categoryService.getAll();
    expect(categories.length).toBe(6);
    
    const products = await productService.getAll();
    expect(products.length).toBe(16);
  }, 15000); // Increase timeout to 15 seconds for this test
});
