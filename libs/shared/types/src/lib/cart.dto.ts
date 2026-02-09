export interface CartItem {
  productId: number;
  productName: string;
  productPrice: number;
  variantId: number | null;
  variantName: string | null;
  variantPriceModifier: number;
  quantity: number;
  extraIds: number[];
  extraNames: string[];
  extraPrices: number[];
  unitPrice: number; // product price + variant modifier + sum of extras
  lineTotal: number; // unitPrice * quantity
  notes: string | null;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  itemCount: number;
}
