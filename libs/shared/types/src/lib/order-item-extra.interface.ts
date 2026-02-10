import { SyncEntityMetadata } from './sync-metadata.interface';

export interface OrderItemExtra extends SyncEntityMetadata {
  id?: string | number; // Composite key: orderItemId-extraId
  orderId: number; // FK to Order
  orderItemId: number; // FK to OrderItem
  extraId: number; // FK to Extra
}
