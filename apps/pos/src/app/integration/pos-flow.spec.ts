import { TestBed } from '@angular/core/testing';
import { CategoryService } from '../application/services/category.service';
import { InventoryService } from '../application/services/inventory.service';
import { ProductService } from '../application/services/product.service';
import { SQLiteCategoryRepository } from '../infrastructure/repositories/sqlite-category.repository';
import { IndexedDBService } from '../infrastructure/services/indexeddb.service';
import { PlatformService } from '../shared/utilities/platform.service';

import { IngredientService } from '../application/services/ingredient.service';
import { ProductIngredientService } from '../application/services/product-ingredient.service';
import { IndexedDBCategoryRepository } from '../infrastructure/repositories/indexeddb-category.repository';
import { IndexedDBIngredientRepository } from '../infrastructure/repositories/indexeddb-ingredient.repository';
import { IndexedDBProductIngredientRepository } from '../infrastructure/repositories/indexeddb-product-ingredient.repository';
import { IndexedDBProductRepository } from '../infrastructure/repositories/indexeddb-product.repository';
import { SQLiteIngredientRepository } from '../infrastructure/repositories/sqlite-ingredient.repository';
import { SQLiteProductIngredientRepository } from '../infrastructure/repositories/sqlite-product-ingredient.repository';
import { SQLiteProductRepository } from '../infrastructure/repositories/sqlite-product.repository';

describe('POS Integration Flow', () => {
  let categoryService: CategoryService;
  let productService: ProductService;
  let inventoryService: InventoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        ProductService,
        InventoryService,
        IndexedDBService,
        PlatformService,

        // Repositories
        IndexedDBCategoryRepository,
        IndexedDBProductRepository,
        IndexedDBIngredientRepository,
        IndexedDBProductIngredientRepository,

        // Mock SQLite Repos
        { provide: SQLiteCategoryRepository, useValue: {} },
        { provide: SQLiteProductRepository, useValue: {} },
        { provide: SQLiteIngredientRepository, useValue: {} },
        { provide: SQLiteProductIngredientRepository, useValue: {} },

        // Other Services
        IngredientService,
        ProductIngredientService,
      ],
    });

    categoryService = TestBed.inject(CategoryService);
    productService = TestBed.inject(ProductService);
    inventoryService = TestBed.inject(InventoryService);

    // Ensure we are in "web" mode for these tests (using IndexedDB)
    const platformService = TestBed.inject(PlatformService);
    vi.spyOn(platformService, 'isTauri').mockReturnValue(false);
    vi.spyOn(platformService, 'isWeb').mockReturnValue(true);
  });

  it('should manage inventory tracking correctly', async () => {
    // 1. Setup Data
    inventoryService.setInventoryTracking(true);

    const category = await categoryService.create({
      name: 'Integration Test Cat ' + Date.now(),
      sortOrder: 1,
      isActive: true,
    });

    const product = await productService.create({
      name: 'Integration Test Product',
      categoryId: category.id,
      price: 10.0,
      stock: 10,
      isAvailable: true,
    });

    // 2. Check Availability
    const check1 = await inventoryService.checkStockAvailability(product.id, 5);
    expect(check1.available).toBe(true);

    // 3. Deduct Stock
    await inventoryService.deductProductStock(product.id, 5);
    const updatedProduct = await productService.getById(product.id);
    expect(updatedProduct?.stock).toBe(5);

    // 4. Check Insufficient Stock
    const check2 = await inventoryService.checkStockAvailability(product.id, 10);
    expect(check2.available).toBe(false);
    expect(check2.message).toContain('Only 5 units available');

    // Cleanup
    await productService.delete(product.id);
    await categoryService.delete(category.id);
  });
});
