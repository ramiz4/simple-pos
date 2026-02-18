import { TestBed } from '@angular/core/testing';
import { CategoryService } from '../application/services/category.service';
import { EnumMappingService } from '../application/services/enum-mapping.service';
import { ExtraService } from '../application/services/extra.service';
import { IngredientService } from '../application/services/ingredient.service';
import { ProductExtraService } from '../application/services/product-extra.service';
import { ProductIngredientService } from '../application/services/product-ingredient.service';
import { ProductService } from '../application/services/product.service';
import { SeedService } from '../application/services/seed.service';
import { TableService } from '../application/services/table.service';
import { VariantService } from '../application/services/variant.service';
import { REPOSITORY_PROVIDERS } from '../infrastructure/providers/repository.providers';
import { INDEXEDDB_NAME, IndexedDBService } from '../infrastructure/services/indexeddb.service';
import { PlatformService } from '../infrastructure/services/platform.service';

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

  beforeEach(async () => {
    // Delete IndexedDB before each test to avoid ConstraintError
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(INDEXEDDB_NAME);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => {
        // Database deletion is blocked - wait briefly and retry
        console.warn('Database deletion blocked - waiting for connections to close');
        setTimeout(() => {
          // Force retry by rejecting with a specific error
          reject(new Error('Database deletion blocked'));
        }, 100);
      };
    }).catch(async (error) => {
      // If blocked, wait and try once more
      if (error.message === 'Database deletion blocked') {
        console.warn('Retrying database deletion...');
        await new Promise((resolve) => setTimeout(resolve, 200));
        await new Promise<void>((resolve, reject) => {
          const retryRequest = indexedDB.deleteDatabase(INDEXEDDB_NAME);

          const timeoutId = setTimeout(() => {
            console.warn('Retrying database deletion timed out');
            reject(new Error('Retry database deletion timeout'));
          }, 1000);

          retryRequest.onsuccess = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          retryRequest.onerror = () => {
            clearTimeout(timeoutId);
            reject(retryRequest.error);
          };
          retryRequest.onblocked = () => {
            clearTimeout(timeoutId);
            console.warn('Database deletion blocked again on retry');
            reject(new Error('Database deletion blocked on retry'));
          };
        });
      } else {
        throw error;
      }
    });

    TestBed.configureTestingModule({
      providers: [
        SeedService,
        EnumMappingService,
        TableService,
        CategoryService,
        ProductService,
        VariantService,
        ExtraService,
        IngredientService,
        ProductExtraService,
        ProductIngredientService,
        IndexedDBService,
        PlatformService,
        ...REPOSITORY_PROVIDERS,
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

  afterEach(async () => {
    // Close any open IndexedDB connections
    const indexedDBService = TestBed.inject(IndexedDBService);
    await indexedDBService.close();
  });

  it('should seed all test data successfully', async () => {
    // Seed the database
    await seedService.seedDatabase();

    // Verify tables
    const tables = await tableService.getAll();
    expect(tables.length).toBe(8);
    expect(tables.some((t) => t.name === 'Table 1')).toBe(true);
    expect(tables.some((t) => t.name === 'Bar 2')).toBe(true);

    // Verify categories
    const categories = await categoryService.getAll();
    expect(categories.length).toBe(6);
    expect(categories.some((c) => c.name === 'Pizzas')).toBe(true);
    expect(categories.some((c) => c.name === 'Desserts')).toBe(true);

    // Verify products
    const products = await productService.getAll();
    expect(products.length).toBe(16);
    expect(products.some((p) => p.name === 'Margherita Pizza')).toBe(true);
    expect(products.some((p) => p.name === 'Cheesecake')).toBe(true);

    // Verify variants
    const variants = await variantService.getAll();
    expect(variants.length).toBe(20);
    expect(variants.some((v) => v.name === 'Small (10")')).toBe(true);
    expect(variants.some((v) => v.name === 'Double')).toBe(true);

    // Verify extras
    const extras = await extraService.getAll();
    expect(extras.length).toBe(8);
    expect(extras.some((e) => e.name === 'Extra Cheese')).toBe(true);
    expect(extras.some((e) => e.name === 'Jalapeños')).toBe(true);

    // Verify ingredients
    const ingredients = await ingredientService.getAll();
    expect(ingredients.length).toBe(10);
    expect(ingredients.some((i) => i.name === 'Mozzarella')).toBe(true);
    expect(ingredients.some((i) => i.name === 'Basil')).toBe(true);

    // Check that relationships exist
    const margheritaPizza = products.find((p) => p.name === 'Margherita Pizza');
    expect(margheritaPizza).toBeDefined();

    if (!margheritaPizza) {
      throw new Error('Margherita Pizza not found');
    }

    const pizzaExtras = await productExtraService.getByProduct(margheritaPizza.id);
    expect(pizzaExtras.length).toBeGreaterThan(0);

    const pizzaIngredients = await productIngredientService.getByProduct(margheritaPizza.id);
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
