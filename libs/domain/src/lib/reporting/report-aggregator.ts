import { Order } from '@simple-pos/shared/types';

export class ReportAggregator {
  /**
   * Sum up total revenue from a list of orders
   */
  static calculateTotalRevenue(orders: Order[]): number {
    return orders.reduce((sum, order) => sum + order.total, 0);
  }

  /**
   * Calculate average order value
   */
  static calculateAverageOrderValue(totalRevenue: number, totalOrders: number): number {
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  }

  /**
   * Group orders by a specific numeric property (like typeId or statusId)
   */
  static groupOrdersBy(orders: Order[], property: keyof Order): Record<number, Order[]> {
    return orders.reduce(
      (groups, order) => {
        const value = order[property] as unknown as number;
        if (!groups[value]) {
          groups[value] = [];
        }
        groups[value].push(order);
        return groups;
      },
      {} as Record<number, Order[]>,
    );
  }
}
