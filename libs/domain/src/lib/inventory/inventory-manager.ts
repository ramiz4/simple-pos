import { Ingredient, Product, ProductIngredient } from '@simple-pos/shared/types';

export class InventoryManager {
  /**
   * Check if a product has enough direct stock
   */
  static isStockAvailable(product: Product, quantity: number): boolean {
    return product.stock >= quantity;
  }

  /**
   * Check if an ingredient has enough stock for a product order
   */
  static isIngredientAvailable(
    pi: ProductIngredient,
    ingredient: Ingredient,
    orderQuantity: number,
  ): boolean {
    const requiredTotal = pi.quantity * orderQuantity;
    return ingredient.stockQuantity >= requiredTotal;
  }

  /**
   * Calculate new stock level for a product
   */
  static calculateNewProductStock(product: Product, quantity: number): number {
    return product.stock - quantity;
  }

  /**
   * Calculate new stock level for an ingredient
   */
  static calculateNewIngredientStock(
    pi: ProductIngredient,
    ingredient: Ingredient,
    orderQuantity: number,
  ): number {
    const requiredTotal = pi.quantity * orderQuantity;
    return ingredient.stockQuantity - requiredTotal;
  }
}
