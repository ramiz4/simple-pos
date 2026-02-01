import { Injectable } from '@angular/core';
import { ProductService } from './product.service';
import { IngredientService } from './ingredient.service';
import { ProductIngredientService } from './product-ingredient.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private inventoryTrackingEnabled = false;

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private productIngredientService: ProductIngredientService
  ) {}

  setInventoryTracking(enabled: boolean): void {
    this.inventoryTrackingEnabled = enabled;
  }

  isInventoryTrackingEnabled(): boolean {
    return this.inventoryTrackingEnabled;
  }

  async deductProductStock(productId: number, quantity: number = 1): Promise<void> {
    if (!this.inventoryTrackingEnabled) return;

    const product = await this.productService.getById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const newStock = product.stock - quantity;
    if (newStock < 0) {
      throw new Error(`Insufficient stock for product ${product.name}`);
    }

    await this.productService.update(productId, { stock: newStock });
  }

  async deductIngredientStock(productId: number, quantity: number = 1): Promise<void> {
    if (!this.inventoryTrackingEnabled) return;

    const productIngredients = await this.productIngredientService.getByProduct(productId);
    
    for (const pi of productIngredients) {
      const ingredient = await this.ingredientService.getById(pi.ingredientId);
      if (!ingredient) continue;

      const requiredQuantity = pi.quantity * quantity;
      const newStock = ingredient.stockQuantity - requiredQuantity;
      
      if (newStock < 0) {
        throw new Error(`Insufficient stock for ingredient ${ingredient.name}`);
      }

      await this.ingredientService.update(pi.ingredientId, { stockQuantity: newStock });
    }
  }

  async checkStockAvailability(productId: number, quantity: number = 1): Promise<{ available: boolean; message?: string }> {
    if (!this.inventoryTrackingEnabled) {
      return { available: true };
    }

    const product = await this.productService.getById(productId);
    if (!product) {
      return { available: false, message: 'Product not found' };
    }

    if (product.stock < quantity) {
      return { available: false, message: `Only ${product.stock} units available` };
    }

    const productIngredients = await this.productIngredientService.getByProduct(productId);
    for (const pi of productIngredients) {
      const ingredient = await this.ingredientService.getById(pi.ingredientId);
      if (!ingredient) continue;

      const requiredQuantity = pi.quantity * quantity;
      if (ingredient.stockQuantity < requiredQuantity) {
        return { 
          available: false, 
          message: `Insufficient ${ingredient.name} (need ${requiredQuantity} ${ingredient.unit})` 
        };
      }
    }

    return { available: true };
  }
}
