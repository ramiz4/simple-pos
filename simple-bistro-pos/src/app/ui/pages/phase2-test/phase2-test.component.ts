import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableService } from '../../../application/services/table.service';
import { CategoryService } from '../../../application/services/category.service';
import { ProductService } from '../../../application/services/product.service';
import { VariantService } from '../../../application/services/variant.service';
import { ExtraService } from '../../../application/services/extra.service';
import { IngredientService } from '../../../application/services/ingredient.service';
import { ProductExtraService } from '../../../application/services/product-extra.service';
import { ProductIngredientService } from '../../../application/services/product-ingredient.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { InventoryService } from '../../../application/services/inventory.service';
import { TableStatusEnum } from '../../../domain/enums';

@Component({
  selector: 'app-phase2-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './phase2-test.component.html',
  styleUrls: ['./phase2-test.component.css']
})
export class Phase2TestComponent implements OnInit {
  testResults: { name: string; status: 'pending' | 'success' | 'error'; message: string }[] = [];
  loading = false;

  constructor(
    private router: Router,
    private tableService: TableService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private ingredientService: IngredientService,
    private productExtraService: ProductExtraService,
    private productIngredientService: ProductIngredientService,
    private enumMappingService: EnumMappingService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.initTests();
  }

  private initTests(): void {
    this.testResults = [
      { name: '1. Category CRUD', status: 'pending', message: 'Not started' },
      { name: '2. Product CRUD', status: 'pending', message: 'Not started' },
      { name: '3. Table CRUD with CodeTable', status: 'pending', message: 'Not started' },
      { name: '4. Variant Management', status: 'pending', message: 'Not started' },
      { name: '5. Extra Management', status: 'pending', message: 'Not started' },
      { name: '6. Ingredient Management', status: 'pending', message: 'Not started' },
      { name: '7. Product-Extra Relationship', status: 'pending', message: 'Not started' },
      { name: '8. Product-Ingredient Relationship', status: 'pending', message: 'Not started' },
      { name: '9. Inventory Tracking', status: 'pending', message: 'Not started' },
      { name: '10. Product Availability Toggle', status: 'pending', message: 'Not started' },
    ];
  }

  async runAllTests(): Promise<void> {
    this.loading = true;
    this.initTests();

    try {
      await this.testCategoryCRUD();
      await this.testProductCRUD();
      await this.testTableCRUD();
      await this.testVariantManagement();
      await this.testExtraManagement();
      await this.testIngredientManagement();
      await this.testProductExtraRelationship();
      await this.testProductIngredientRelationship();
      await this.testInventoryTracking();
      await this.testProductAvailability();

      alert('All Phase 2 tests completed! Check the results below.');
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      this.loading = false;
    }
  }

  private updateTestStatus(index: number, status: 'success' | 'error', message: string): void {
    this.testResults[index].status = status;
    this.testResults[index].message = message;
  }

  private async testCategoryCRUD(): Promise<void> {
    try {
      const category = await this.categoryService.create({
        name: 'Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });
      
      const retrieved = await this.categoryService.getById(category.id);
      if (!retrieved || retrieved.name !== category.name) {
        throw new Error('Category retrieval failed');
      }

      await this.categoryService.update(category.id, { sortOrder: 2 });
      const updated = await this.categoryService.getById(category.id);
      if (updated?.sortOrder !== 2) {
        throw new Error('Category update failed');
      }

      await this.categoryService.delete(category.id);
      const deleted = await this.categoryService.getById(category.id);
      if (deleted !== null) {
        throw new Error('Category delete failed');
      }

      this.updateTestStatus(0, 'success', 'Create, Read, Update, Delete all working');
    } catch (error: any) {
      this.updateTestStatus(0, 'error', error.message);
    }
  }

  private async testProductCRUD(): Promise<void> {
    try {
      const category = await this.categoryService.create({
        name: 'Product Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });

      const product = await this.productService.create({
        name: 'Test Product ' + Date.now(),
        categoryId: category.id,
        price: 9.99,
        stock: 100,
        isAvailable: true
      });

      const retrieved = await this.productService.getById(product.id);
      if (!retrieved || retrieved.categoryId !== category.id) {
        throw new Error('Product retrieval failed');
      }

      const byCategory = await this.productService.getByCategory(category.id);
      if (byCategory.length === 0 || !byCategory.find(p => p.id === product.id)) {
        throw new Error('Product getByCategory failed');
      }

      await this.productService.delete(product.id);
      await this.categoryService.delete(category.id);

      this.updateTestStatus(1, 'success', 'Product CRUD and category relationship working');
    } catch (error: any) {
      this.updateTestStatus(1, 'error', error.message);
    }
  }

  private async testTableCRUD(): Promise<void> {
    try {
      const statusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);

      const table = await this.tableService.create({
        name: 'Test Table',
        number: Date.now() % 1000,
        seats: 4,
        statusId: statusId
      });

      const retrieved = await this.tableService.getById(table.id);
      if (!retrieved || retrieved.statusId !== statusId) {
        throw new Error('Table retrieval with CodeTable FK failed');
      }

      const occupiedId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.OCCUPIED);
      await this.tableService.update(table.id, { statusId: occupiedId });
      
      const updated = await this.tableService.getById(table.id);
      if (updated?.statusId !== occupiedId) {
        throw new Error('Table status update failed');
      }

      await this.tableService.delete(table.id);

      this.updateTestStatus(2, 'success', 'Table CRUD with CodeTable FK working correctly');
    } catch (error: any) {
      this.updateTestStatus(2, 'error', error.message);
    }
  }

  private async testVariantManagement(): Promise<void> {
    try {
      const category = await this.categoryService.create({
        name: 'Variant Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });

      const product = await this.productService.create({
        name: 'Test Pizza',
        categoryId: category.id,
        price: 10.00,
        stock: 50,
        isAvailable: true
      });

      const small = await this.variantService.create({
        productId: product.id,
        name: 'Small',
        priceModifier: -2.00
      });

      const large = await this.variantService.create({
        productId: product.id,
        name: 'Large',
        priceModifier: 3.00
      });

      const variants = await this.variantService.getByProduct(product.id);
      if (variants.length !== 2) {
        throw new Error('Variant retrieval by product failed');
      }

      if (variants.some(v => v.priceModifier === -2.00) && variants.some(v => v.priceModifier === 3.00)) {
        this.updateTestStatus(3, 'success', 'Variants with positive/negative modifiers working');
      } else {
        throw new Error('Price modifiers not correct');
      }

      await this.variantService.delete(small.id);
      await this.variantService.delete(large.id);
      await this.productService.delete(product.id);
      await this.categoryService.delete(category.id);
    } catch (error: any) {
      this.updateTestStatus(3, 'error', error.message);
    }
  }

  private async testExtraManagement(): Promise<void> {
    try {
      const extra = await this.extraService.create({
        name: 'Extra Cheese ' + Date.now(),
        price: 1.50
      });

      const retrieved = await this.extraService.getById(extra.id);
      if (!retrieved || retrieved.price !== 1.50) {
        throw new Error('Extra retrieval failed');
      }

      await this.extraService.delete(extra.id);
      this.updateTestStatus(4, 'success', 'Extra management working');
    } catch (error: any) {
      this.updateTestStatus(4, 'error', error.message);
    }
  }

  private async testIngredientManagement(): Promise<void> {
    try {
      const ingredient = await this.ingredientService.create({
        name: 'Tomato ' + Date.now(),
        stockQuantity: 100,
        unit: 'kg'
      });

      const retrieved = await this.ingredientService.getById(ingredient.id);
      if (!retrieved || retrieved.stockQuantity !== 100) {
        throw new Error('Ingredient retrieval failed');
      }

      await this.ingredientService.update(ingredient.id, { stockQuantity: 80 });
      const updated = await this.ingredientService.getById(ingredient.id);
      if (updated?.stockQuantity !== 80) {
        throw new Error('Ingredient stock update failed');
      }

      await this.ingredientService.delete(ingredient.id);
      this.updateTestStatus(5, 'success', 'Ingredient management and stock tracking working');
    } catch (error: any) {
      this.updateTestStatus(5, 'error', error.message);
    }
  }

  private async testProductExtraRelationship(): Promise<void> {
    try {
      const category = await this.categoryService.create({
        name: 'Extra Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });

      const product = await this.productService.create({
        name: 'Test Burger',
        categoryId: category.id,
        price: 8.00,
        stock: 50,
        isAvailable: true
      });

      const extra1 = await this.extraService.create({
        name: 'Extra Bacon ' + Date.now(),
        price: 2.00
      });

      const extra2 = await this.extraService.create({
        name: 'Extra Sauce ' + Date.now(),
        price: 0.50
      });

      await this.productExtraService.addExtraToProduct(product.id, extra1.id);
      await this.productExtraService.addExtraToProduct(product.id, extra2.id);

      const productExtras = await this.productExtraService.getByProduct(product.id);
      if (productExtras.length !== 2) {
        throw new Error('Product-Extra relationship failed');
      }

      await this.productExtraService.removeExtraFromProduct(product.id, extra1.id);
      const afterRemove = await this.productExtraService.getByProduct(product.id);
      if (afterRemove.length !== 1) {
        throw new Error('Product-Extra removal failed');
      }

      await this.productExtraService.removeExtraFromProduct(product.id, extra2.id);
      await this.productService.delete(product.id);
      await this.extraService.delete(extra1.id);
      await this.extraService.delete(extra2.id);
      await this.categoryService.delete(category.id);

      this.updateTestStatus(6, 'success', 'Many-to-many Product-Extra relationship working');
    } catch (error: any) {
      this.updateTestStatus(6, 'error', error.message);
    }
  }

  private async testProductIngredientRelationship(): Promise<void> {
    try {
      const category = await this.categoryService.create({
        name: 'Ingredient Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });

      const product = await this.productService.create({
        name: 'Test Pasta',
        categoryId: category.id,
        price: 12.00,
        stock: 30,
        isAvailable: true
      });

      const ingredient1 = await this.ingredientService.create({
        name: 'Pasta ' + Date.now(),
        stockQuantity: 50,
        unit: 'kg'
      });

      const ingredient2 = await this.ingredientService.create({
        name: 'Cheese ' + Date.now(),
        stockQuantity: 20,
        unit: 'kg'
      });

      await this.productIngredientService.addIngredientToProduct(product.id, ingredient1.id, 0.2);
      await this.productIngredientService.addIngredientToProduct(product.id, ingredient2.id, 0.1);

      const productIngredients = await this.productIngredientService.getByProduct(product.id);
      if (productIngredients.length !== 2) {
        throw new Error('Product-Ingredient relationship failed');
      }

      const pastaIngredient = productIngredients.find(pi => pi.ingredientId === ingredient1.id);
      if (!pastaIngredient || pastaIngredient.quantity !== 0.2) {
        throw new Error('Ingredient quantity not correct');
      }

      await this.productIngredientService.removeIngredientFromProduct(product.id, ingredient1.id);
      await this.productIngredientService.removeIngredientFromProduct(product.id, ingredient2.id);
      await this.productService.delete(product.id);
      await this.ingredientService.delete(ingredient1.id);
      await this.ingredientService.delete(ingredient2.id);
      await this.categoryService.delete(category.id);

      this.updateTestStatus(7, 'success', 'Many-to-many Product-Ingredient with quantity working');
    } catch (error: any) {
      this.updateTestStatus(7, 'error', error.message);
    }
  }

  private async testInventoryTracking(): Promise<void> {
    try {
      this.inventoryService.setInventoryTracking(true);

      const category = await this.categoryService.create({
        name: 'Inventory Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });

      const product = await this.productService.create({
        name: 'Test Item',
        categoryId: category.id,
        price: 5.00,
        stock: 10,
        isAvailable: true
      });

      const availabilityCheck = await this.inventoryService.checkStockAvailability(product.id, 5);
      if (!availabilityCheck.available) {
        throw new Error('Stock availability check failed');
      }

      await this.inventoryService.deductProductStock(product.id, 5);
      const updatedProduct = await this.productService.getById(product.id);
      if (updatedProduct?.stock !== 5) {
        throw new Error('Stock deduction failed');
      }

      const insufficientCheck = await this.inventoryService.checkStockAvailability(product.id, 10);
      if (insufficientCheck.available) {
        throw new Error('Insufficient stock check failed');
      }

      await this.productService.delete(product.id);
      await this.categoryService.delete(category.id);

      this.updateTestStatus(8, 'success', 'Inventory tracking and stock deduction working');
    } catch (error: any) {
      this.updateTestStatus(8, 'error', error.message);
    }
  }

  private async testProductAvailability(): Promise<void> {
    try {
      const category = await this.categoryService.create({
        name: 'Availability Test Category ' + Date.now(),
        sortOrder: 1,
        isActive: true
      });

      const product = await this.productService.create({
        name: 'Test Dish',
        categoryId: category.id,
        price: 15.00,
        stock: 20,
        isAvailable: true
      });

      const toggled = await this.productService.toggleAvailability(product.id);
      if (toggled.isAvailable !== false) {
        throw new Error('Availability toggle failed');
      }

      const toggledBack = await this.productService.toggleAvailability(product.id);
      if (toggledBack.isAvailable !== true) {
        throw new Error('Availability toggle back failed');
      }

      await this.productService.delete(product.id);
      await this.categoryService.delete(category.id);

      this.updateTestStatus(9, 'success', 'Product availability toggle (Sold Out) working');
    } catch (error: any) {
      this.updateTestStatus(9, 'error', error.message);
    }
  }

  onBackToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
