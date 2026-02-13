import { BaseRepository, Order } from '@simple-pos/shared/types';

export interface OrderRepository extends BaseRepository<Order> {
  getNextOrderNumber(): Promise<string>;
  findByTable(tableId: number): Promise<Order[]>;
  findActiveOrders(): Promise<Order[]>;
  findByStatus(statusId: number): Promise<Order[]>;
}
