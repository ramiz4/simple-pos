import { SyncEntityMetadata } from './sync-metadata.interface';

export interface OrderItem extends SyncEntityMetadata {
  id: number;
  orderId: number; // FK to Order
  productId: number; // FK to Product
  variantId: number | null; // FK to Variant (optional)
  quantity: number;
  unitPrice: number;
  notes: string | null;
  statusId: number;
  createdAt: string;
}
