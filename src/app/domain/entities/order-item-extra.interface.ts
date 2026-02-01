export interface OrderItemExtra {
  orderId: number; // FK to Order
  orderItemId: number; // FK to OrderItem
  extraId: number; // FK to Extra
}
