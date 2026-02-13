import { BaseRepository, OrderItemExtra } from '@simple-pos/shared/types';

export interface OrderItemExtraRepository extends BaseRepository<OrderItemExtra> {
  findByOrderItemId(orderItemId: number): Promise<OrderItemExtra[]>;
}
