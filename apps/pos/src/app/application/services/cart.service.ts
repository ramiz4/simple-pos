import { computed, effect, Injectable, signal } from '@angular/core';
import { CartLogic, PricingCalculator } from '@simple-pos/domain';
import { CartItem, CartSummary } from '@simple-pos/shared/types';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Storage keys
  private readonly STORAGE_KEY_CARTS = 'simple_pos_carts';

  // Storage for all active carts (table-specific or by order type)
  // Key format: 'table_[id]' or 'TAKEAWAY' or 'DELIVERY'
  private allCarts = signal<Record<string, CartItem[]>>({});

  // Current context
  private activeContextKey = signal<string>('default');

  readonly cart = computed(() => this.allCarts()[this.activeContextKey()] || []);

  constructor() {
    this.loadFromStorage();

    // Auto-save changes using effect
    effect(() => {
      const carts = this.allCarts();
      localStorage.setItem(this.STORAGE_KEY_CARTS, JSON.stringify(carts));
    });
  }

  private loadFromStorage(): void {
    try {
      const storedCarts = localStorage.getItem(this.STORAGE_KEY_CARTS);
      if (storedCarts) {
        this.allCarts.set(JSON.parse(storedCarts));
      }

      // Clean up legacy tip storage from previous versions
      localStorage.removeItem('simple_pos_tips');
    } catch (e) {
      console.warn('Failed to load cart from storage', e);
    }
  }

  /**
   * Set the current active cart context (e.g., 'table_1', 'TAKEAWAY')
   */
  setContext(context: number | string): void {
    const key = typeof context === 'number' ? `table_${context}` : context;
    this.activeContextKey.set(key);
  }

  addItem(item: CartItem): void {
    const currentKey = this.activeContextKey();
    const currentCarts = { ...this.allCarts() };
    const items = currentCarts[currentKey] || [];

    const existingIndex = items.findIndex((i) => CartLogic.areCartItemsEqual(i, item));

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + item.quantity,
        lineTotal: PricingCalculator.calculateLineTotal({
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        }),
      };
      currentCarts[currentKey] = updated;
    } else {
      currentCarts[currentKey] = [...items, item];
    }

    this.allCarts.set(currentCarts);
  }

  updateItemQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }

    const currentKey = this.activeContextKey();
    const currentCarts = { ...this.allCarts() };
    const items = currentCarts[currentKey] || [];

    if (items[index]) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        quantity,
        lineTotal: PricingCalculator.calculateLineTotal({
          ...updated[index],
          quantity,
        }),
      };
      currentCarts[currentKey] = updated;
      this.allCarts.set(currentCarts);
    }
  }

  removeItem(index: number): void {
    const currentKey = this.activeContextKey();
    const currentCarts = { ...this.allCarts() };
    const items = currentCarts[currentKey] || [];

    currentCarts[currentKey] = items.filter((_, i) => i !== index);
    this.allCarts.set(currentCarts);
  }

  getSummary(): CartSummary {
    return CartLogic.summarizeCart(this.cart());
  }

  clear(): void {
    const currentKey = this.activeContextKey();

    const currentCarts = { ...this.allCarts() };
    delete currentCarts[currentKey];
    this.allCarts.set(currentCarts);
  }

  isEmpty(): boolean {
    return this.cart().length === 0;
  }
}
