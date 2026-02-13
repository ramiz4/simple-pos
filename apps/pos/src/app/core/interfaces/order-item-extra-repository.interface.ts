import { OrderItemExtra } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface OrderItemExtraRepository extends BaseRepository<OrderItemExtra> {
  findByOrderItemId(orderItemId: number): Promise<OrderItemExtra[]>;
}
