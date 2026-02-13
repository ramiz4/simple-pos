import { OrderItem } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface OrderItemRepository extends BaseRepository<OrderItem> {
  findByOrderId(orderId: number): Promise<OrderItem[]>;
}
