import { TestBed } from '@angular/core/testing';
import { CategoryService } from '../application/services/category.service';
import { IngredientService } from '../application/services/ingredient.service';
import { InventoryService } from '../application/services/inventory.service';
import { ProductIngredientService } from '../application/services/product-ingredient.service';
import { ProductService } from '../application/services/product.service';
import { REPOSITORY_PROVIDERS } from '../infrastructure/providers/repository.providers';
import { IndexedDBService } from '../infrastructure/services/indexeddb.service';
import { PlatformService } from '../infrastructure/services/platform.service';

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
        IngredientService,
        ProductIngredientService,
        IndexedDBService,
        PlatformService,
        ...REPOSITORY_PROVIDERS,
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
