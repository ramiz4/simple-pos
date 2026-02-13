import { BaseRepository, OrderItem } from '@simple-pos/shared/types';

export interface OrderItemRepository extends BaseRepository<OrderItem> {
  findByOrderId(orderId: number): Promise<OrderItem[]>;
}
