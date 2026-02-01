export interface OrderItem {
  id: number;
  orderId: number; // FK to Order
  productId: number; // FK to Product
  variantId: number | null; // FK to Variant (optional)
  quantity: number;
  unitPrice: number;
  notes: string | null;
}
