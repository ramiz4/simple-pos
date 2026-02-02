import { Injectable } from '@angular/core';
import { Order } from '../../domain/entities';
import { OrderStatusEnum } from '../../domain/enums';
import { EnumMappingService } from './enum-mapping.service';
import { OrderService } from './order.service';

export interface DailyRevenueReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface RevenueByTypeReport {
  orderType: string;
  revenue: number;
  orderCount: number;
}

export interface OrderCountReport {
  orderType: string;
  status: string;
  count: number;
}

export interface ZReport {
  reportDate: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  revenueByType: RevenueByTypeReport[];
  revenueByPaymentMethod: Array<{ method: string; amount: number }>;
  itemsSold: number;
  averageOrderValue: number;
  totalVAT: number;
  totalTips: number;
  ordersByStatus: Array<{ status: string; count: number }>;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportingService {
  constructor(
    private orderService: OrderService,
    private enumMappingService: EnumMappingService,
  ) {}

  /**
   * Get daily revenue for today
   */
  async getDailyRevenue(): Promise<DailyRevenueReport> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getRevenueForDateRange({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });
  }

  /**
   * Get revenue for a specific date range
   */
  async getRevenueForDateRange(filter: DateRangeFilter): Promise<DailyRevenueReport> {
    const orders = await this.getOrdersInDateRange(filter);
    const completedOrders = await this.filterOrdersByStatus(orders, OrderStatusEnum.COMPLETED);

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      date: filter.startDate,
      totalRevenue,
      totalOrders,
      averageOrderValue,
    };
  }

  /**
   * Get revenue breakdown by order type
   */
  async getRevenueByOrderType(filter?: DateRangeFilter): Promise<RevenueByTypeReport[]> {
    const orders = filter
      ? await this.getOrdersInDateRange(filter)
      : await this.orderService.getAllOrders();

    const paidOrCompleted = await this.filterOrdersByStatusPaidOrCompleted(orders);

    const revenueMap = new Map<string, { revenue: number; count: number }>();

    for (const order of paidOrCompleted) {
      const orderTypeLabel = await this.enumMappingService.getTranslation(order.typeId, 'en');

      if (!revenueMap.has(orderTypeLabel)) {
        revenueMap.set(orderTypeLabel, { revenue: 0, count: 0 });
      }

      const data = revenueMap.get(orderTypeLabel)!;
      data.revenue += order.total;
      data.count += 1;
    }

    const results: RevenueByTypeReport[] = [];
    revenueMap.forEach((data, typeName) => {
      results.push({
        orderType: typeName,
        revenue: data.revenue,
        orderCount: data.count,
      });
    });

    return results;
  }

  /**
   * Get order count by type and status
   */
  async getOrderCountReport(filter?: DateRangeFilter): Promise<OrderCountReport[]> {
    const orders = filter
      ? await this.getOrdersInDateRange(filter)
      : await this.orderService.getAllOrders();

    const countMap = new Map<string, number>();

    for (const order of orders) {
      const orderTypeLabel = await this.enumMappingService.getTranslation(order.typeId, 'en');
      const orderStatusLabel = await this.enumMappingService.getTranslation(order.statusId, 'en');
      const key = `${orderTypeLabel}|${orderStatusLabel}`;

      countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    const results: OrderCountReport[] = [];
    countMap.forEach((count, key) => {
      const [orderType, status] = key.split('|');
      results.push({ orderType, status, count });
    });

    return results;
  }

  /**
   * Generate Z-Report (End of Day Report)
   */
  async generateZReport(filter?: DateRangeFilter): Promise<ZReport> {
    const orders = filter ? await this.getOrdersInDateRange(filter) : await this.getTodaysOrders();

    const completedOrders = await this.filterOrdersByStatus(orders, OrderStatusEnum.COMPLETED);

    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalVAT = completedOrders.reduce((sum, order) => sum + order.tax, 0);
    const totalTips = completedOrders.reduce((sum, order) => sum + order.tip, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by type
    const revenueByType = await this.getRevenueByOrderType(filter);

    // Payment method breakdown (currently only cash)
    const revenueByPaymentMethod = [{ method: 'Cash', amount: totalRevenue }];

    // Items sold count
    const itemsSold = await this.getTotalItemsSold(completedOrders);

    // Orders by status
    const ordersByStatus = await this.getOrdersByStatus(orders);

    const now = new Date();
    const startDate = filter?.startDate || this.getStartOfDay(now).toISOString();
    const endDate = filter?.endDate || now.toISOString();

    return {
      reportDate: now.toISOString(),
      startDate,
      endDate,
      totalOrders,
      totalRevenue,
      revenueByType,
      revenueByPaymentMethod,
      itemsSold,
      averageOrderValue,
      totalVAT,
      totalTips,
      ordersByStatus,
    };
  }

  /**
   * Export orders to CSV
   */
  async exportOrdersToCSV(filter?: DateRangeFilter): Promise<string> {
    const orders = filter
      ? await this.getOrdersInDateRange(filter)
      : await this.orderService.getAllOrders();

    const rows: string[] = [];
    rows.push('Order Number,Type,Status,Table,Subtotal,Tax,Tip,Total,Created At,Completed At');

    for (const order of orders) {
      const orderTypeLabel = await this.enumMappingService.getTranslation(order.typeId, 'en');
      const orderStatusLabel = await this.enumMappingService.getTranslation(order.statusId, 'en');

      rows.push(
        [
          order.orderNumber,
          orderTypeLabel,
          orderStatusLabel,
          order.tableId || '',
          order.subtotal.toFixed(2),
          order.tax.toFixed(2),
          order.tip.toFixed(2),
          order.total.toFixed(2),
          order.createdAt,
          order.completedAt || '',
        ].join(','),
      );
    }

    return rows.join('\n');
  }

  /**
   * Export revenue report to CSV
   */
  async exportRevenueReportToCSV(filter?: DateRangeFilter): Promise<string> {
    const revenueByType = await this.getRevenueByOrderType(filter);

    const rows: string[] = [];
    rows.push('Order Type,Revenue,Order Count');

    for (const item of revenueByType) {
      rows.push([item.orderType, item.revenue.toFixed(2), item.orderCount.toString()].join(','));
    }

    return rows.join('\n');
  }

  /**
   * Export Z-Report to CSV
   */
  async exportZReportToCSV(filter?: DateRangeFilter): Promise<string> {
    const zReport = await this.generateZReport(filter);

    const rows: string[] = [];
    rows.push('Z-REPORT');
    rows.push(`Report Date,${zReport.reportDate}`);
    rows.push(`Period,${zReport.startDate} to ${zReport.endDate}`);
    rows.push('');
    rows.push('SUMMARY');
    rows.push(`Total Orders,${zReport.totalOrders}`);
    rows.push(`Total Revenue,€${zReport.totalRevenue.toFixed(2)}`);
    rows.push(`Average Order Value,€${zReport.averageOrderValue.toFixed(2)}`);
    rows.push(`Items Sold,${zReport.itemsSold}`);
    rows.push(`VAT Collected,€${zReport.totalVAT.toFixed(2)}`);
    rows.push(`Tips Collected,€${zReport.totalTips.toFixed(2)}`);
    rows.push('');
    rows.push('REVENUE BY ORDER TYPE');
    rows.push('Type,Revenue,Orders');

    for (const item of zReport.revenueByType) {
      rows.push(`${item.orderType},€${item.revenue.toFixed(2)},${item.orderCount}`);
    }

    rows.push('');
    rows.push('PAYMENT METHODS');
    rows.push('Method,Amount');

    for (const item of zReport.revenueByPaymentMethod) {
      rows.push(`${item.method},€${item.amount.toFixed(2)}`);
    }

    rows.push('');
    rows.push('ORDERS BY STATUS');
    rows.push('Status,Count');

    for (const item of zReport.ordersByStatus) {
      rows.push(`${item.status},${item.count}`);
    }

    return rows.join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Helper methods

  private async getTodaysOrders(): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getOrdersInDateRange({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });
  }

  private async getOrdersInDateRange(filter: DateRangeFilter): Promise<Order[]> {
    const allOrders = await this.orderService.getAllOrders();
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);

    return allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate < endDate;
    });
  }

  private async filterOrdersByStatus(orders: Order[], status: OrderStatusEnum): Promise<Order[]> {
    const statusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', status);
    return orders.filter((order) => order.statusId === statusId);
  }

  private async filterOrdersByStatusPaidOrCompleted(orders: Order[]): Promise<Order[]> {
    const paidId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.PAID,
    );
    const completedId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.COMPLETED,
    );
    return orders.filter((order) => order.statusId === paidId || order.statusId === completedId);
  }

  private async getTotalItemsSold(orders: Order[]): Promise<number> {
    let total = 0;

    for (const order of orders) {
      const items = await this.orderService.getOrderItems(order.id);
      total += items.reduce((sum, item) => sum + item.quantity, 0);
    }

    return total;
  }

  private async getOrdersByStatus(
    orders: Order[],
  ): Promise<Array<{ status: string; count: number }>> {
    const statusMap = new Map<string, number>();

    for (const order of orders) {
      const statusLabel = await this.enumMappingService.getTranslation(order.statusId, 'en');
      statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);
    }

    const results: Array<{ status: string; count: number }> = [];
    statusMap.forEach((count, status) => {
      results.push({ status, count });
    });

    return results;
  }

  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
