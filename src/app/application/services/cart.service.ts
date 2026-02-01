import { Injectable, signal } from '@angular/core';
import { CartItem, CartSummary } from '../../domain/dtos/cart.dto';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Kosovo VAT rate (18%) - prices already include this tax (tax-inclusive pricing)
  // We display the included tax but don't add it on top
  private readonly TAX_RATE = 0.18;
  
  private cartItems = signal<CartItem[]>([]);
  private tipAmount = signal<number>(0);
  
  readonly cart = this.cartItems.asReadonly();
  readonly tip = this.tipAmount.asReadonly();

  addItem(item: CartItem): void {
    const items = this.cartItems();
    const existingIndex = items.findIndex(i => 
      i.productId === item.productId &&
      i.variantId === item.variantId &&
      this.arraysEqual(i.extraIds, item.extraIds) &&
      i.notes === item.notes
    );

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + item.quantity,
        lineTotal: updated[existingIndex].unitPrice * (updated[existingIndex].quantity + item.quantity)
      };
      this.cartItems.set(updated);
    } else {
      this.cartItems.set([...items, item]);
    }
  }

  updateItemQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }

    const items = this.cartItems();
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      quantity,
      lineTotal: updated[index].unitPrice * quantity
    };
    this.cartItems.set(updated);
  }

  removeItem(index: number): void {
    const items = this.cartItems();
    this.cartItems.set(items.filter((_, i) => i !== index));
  }

  setTip(amount: number): void {
    this.tipAmount.set(Math.max(0, amount));
  }

  getSummary(): CartSummary {
    const items = this.cartItems();
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    // Calculate included tax (tax already in price): tax = subtotal * rate / (1 + rate)
    // For 18% VAT: tax = subtotal * 0.18 / 1.18
    const tax = subtotal * this.TAX_RATE / (1 + this.TAX_RATE);
    const tip = this.tipAmount();
    // Total = subtotal + tip (no additional tax, prices are tax-inclusive)
    const total = subtotal + tip;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      taxRate: this.TAX_RATE,
      tax,
      tip,
      total,
      itemCount
    };
  }

  clear(): void {
    this.cartItems.set([]);
    this.tipAmount.set(0);
  }

  isEmpty(): boolean {
    return this.cartItems().length === 0;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }
}
