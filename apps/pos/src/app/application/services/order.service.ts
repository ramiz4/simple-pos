import { Injectable } from '@angular/core';
import { OrderStateMachine, PricingCalculator } from '@simple-pos/domain';
import {
  CartItem,
  Order,
  OrderItem,
  OrderStatusEnum,
  OrderTypeEnum,
  TableStatusEnum,
} from '@simple-pos/shared/types';
import { IndexedDBOrderItemExtraRepository } from '../../infrastructure/repositories/indexeddb-order-item-extra.repository';
import { IndexedDBOrderItemRepository } from '../../infrastructure/repositories/indexeddb-order-item.repository';
import { IndexedDBOrderRepository } from '../../infrastructure/repositories/indexeddb-order.repository';
import { SQLiteOrderItemExtraRepository } from '../../infrastructure/repositories/sqlite-order-item-extra.repository';
import { SQLiteOrderItemRepository } from '../../infrastructure/repositories/sqlite-order-item.repository';
import { SQLiteOrderRepository } from '../../infrastructure/repositories/sqlite-order.repository';
import { PlatformService } from '../../shared/utilities/platform.service';
import { EnumMappingService } from './enum-mapping.service';
import { TableService } from './table.service';

export interface CreateOrderData {
  typeId: number;
  statusId: number;
  tableId: number | null;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  userId: number;
  items: CartItem[];
  customerName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor(
    private platformService: PlatformService,
    private sqliteOrderRepo: SQLiteOrderRepository,
    private indexedDBOrderRepo: IndexedDBOrderRepository,
    private sqliteOrderItemRepo: SQLiteOrderItemRepository,
    private indexedDBOrderItemRepo: IndexedDBOrderItemRepository,
    private sqliteOrderItemExtraRepo: SQLiteOrderItemExtraRepository,
    private indexedDBOrderItemExtraRepo: IndexedDBOrderItemExtraRepository,
    private enumMappingService: EnumMappingService,
    private tableService: TableService,
  ) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    const orderRepo = this.getOrderRepo();
    const orderItemRepo = this.getOrderItemRepo();
    const orderItemExtraRepo = this.getOrderItemExtraRepo();

    try {
      // Generate order number
      const orderNumber = await orderRepo.getNextOrderNumber();

      // Create the order
      const order = await orderRepo.create({
        orderNumber,
        typeId: data.typeId,
        statusId: data.statusId,
        tableId: data.tableId,
        subtotal: data.subtotal,
        tax: data.tax,
        tip: data.tip,
        total: data.total,
        createdAt: new Date().toISOString(),
        completedAt: null,
        userId: data.userId,
        cancelledReason: null,
        customerName: data.customerName,
      });

      // Create order items
      for (const cartItem of data.items) {
        const orderItem = await orderItemRepo.create({
          orderId: order.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.unitPrice,
          notes: cartItem.notes,
          statusId: data.statusId,
          createdAt: new Date().toISOString(),
        });

        // Create order item extras
        for (const extraId of cartItem.extraIds) {
          await orderItemExtraRepo.create({
            orderId: order.id,
            orderItemId: orderItem.id,
            extraId,
          });
        }
      }

      // Update table status for DINE_IN orders
      const orderType = await this.enumMappingService.getEnumFromId(data.typeId);
      const orderStatus = await this.enumMappingService.getEnumFromId(data.statusId);

      if (orderType.code === OrderTypeEnum.DINE_IN && data.tableId) {
        if (orderStatus.code === OrderStatusEnum.COMPLETED) {
          const freeStatusId = await this.enumMappingService.getCodeTableId(
            'TABLE_STATUS',
            TableStatusEnum.FREE,
          );
          await this.tableService.updateTableStatus(data.tableId, freeStatusId);
        } else {
          const occupiedStatusId = await this.enumMappingService.getCodeTableId(
            'TABLE_STATUS',
            TableStatusEnum.OCCUPIED,
          );
          await this.tableService.updateTableStatus(data.tableId, occupiedStatusId);
        }
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create order: ${errorMessage}`);
    }
  }

  async getOpenOrderByTable(tableId: number): Promise<Order | null> {
    const orderRepo = this.getOrderRepo();
    const allOrders = await orderRepo.findByTable(tableId);

    // Get status IDs to exclude
    const completedStatus = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.COMPLETED,
    );
    const cancelledStatus = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.CANCELLED,
    );

    const activeOrders = allOrders.filter(
      (o) => o.statusId !== completedStatus && o.statusId !== cancelledStatus,
    );

    if (activeOrders.length === 0) {
      return null;
    }

    if (activeOrders.length > 1) {
      // Invariant violation: this service expects at most one active order per table.
      // Surface this as an error so it can be investigated and resolved instead of being silently hidden.
      throw new Error(
        `Multiple active orders (${activeOrders.length}) found for table ${tableId}. Expected at most one.`,
      );
    }

    // Exactly one active order found for this table.
    return activeOrders[0];
  }

  async addItemsToOrder(orderId: number, items: CartItem[]): Promise<Order> {
    const orderRepo = this.getOrderRepo();
    const orderItemRepo = this.getOrderItemRepo();
    const orderItemExtraRepo = this.getOrderItemExtraRepo();

    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    let additionalSubtotal = 0;

    const openStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.OPEN,
    );

    for (const cartItem of items) {
      const orderItem = await orderItemRepo.create({
        orderId: order.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        notes: cartItem.notes,
        statusId: openStatusId,
        createdAt: new Date().toISOString(),
      });

      additionalSubtotal += cartItem.lineTotal;

      for (const extraId of cartItem.extraIds) {
        await orderItemExtraRepo.create({
          orderId: order.id,
          orderItemId: orderItem.id,
          extraId,
        });
      }
    }

    // Update order totals
    const newSubtotal = order.subtotal + additionalSubtotal;
    // Recalculate tax (tax-inclusive pricing: tax = subtotal * rate / (1 + rate))
    const newTax = PricingCalculator.calculateTaxFromInclusiveTotal(newSubtotal);
    const newTotal = PricingCalculator.calculateGrandTotal(newSubtotal, order.tip);

    const updatedOrder = await orderRepo.update(orderId, {
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
    });

    // Update order status based on items (e.g., if it was READY/SERVED, pull it back to PREPARING)
    await this.checkAndUpdateOrderStatusByItems(orderId);

    return (await orderRepo.findById(orderId)) || updatedOrder;
  }

  async getOrderById(id: number): Promise<Order | null> {
    return await this.getOrderRepo().findById(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.getOrderRepo().findAll();
  }

  async getActiveOrders(): Promise<Order[]> {
    const orders = await this.getOrderRepo().findActiveOrders();

    const completedStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.COMPLETED,
    );
    const cancelledStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.CANCELLED,
    );
    const servedStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.SERVED,
    );

    // For the kitchen view, we exclude orders that are already served, completed, or cancelled
    return orders.filter(
      (o) =>
        o.statusId !== completedStatusId &&
        o.statusId !== cancelledStatusId &&
        o.statusId !== servedStatusId,
    );
  }

  async getActiveAndServedOrders(): Promise<Order[]> {
    const orders = await this.getOrderRepo().findActiveOrders();

    const completedStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.COMPLETED,
    );
    const cancelledStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.CANCELLED,
    );

    // Active & Served orders (excludes only COMPLETED and CANCELLED)
    return orders.filter(
      (o) => o.statusId !== completedStatusId && o.statusId !== cancelledStatusId,
    );
  }

  async getOrdersByStatus(statusEnum: OrderStatusEnum): Promise<Order[]> {
    const statusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', statusEnum);
    return await this.getOrderRepo().findByStatus(statusId);
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    return await this.getOrderRepo().update(id, data);
  }

  async updateOrderStatus(id: number, newStatusId: number): Promise<Order> {
    const orderRepo = this.getOrderRepo();
    const order = await orderRepo.findById(id);

    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    const currentStatusEnum = (await this.enumMappingService.getEnumFromId(order.statusId))
      .code as OrderStatusEnum;
    const newStatus = await this.enumMappingService.getEnumFromId(newStatusId);
    const newStatusEnum = newStatus.code as OrderStatusEnum;

    // Validate transition
    if (!OrderStateMachine.canTransition(currentStatusEnum, newStatusEnum)) {
      throw new Error(`Invalid status transition from ${currentStatusEnum} to ${newStatusEnum}`);
    }

    // If status is a final state, set completedAt and free table
    if (OrderStateMachine.isFinalStatus(newStatusEnum)) {
      const updated = await orderRepo.update(id, {
        statusId: newStatusId,
        completedAt: new Date().toISOString(),
      });

      // Free the table if it was a DINE_IN order
      if (order.tableId) {
        const freeStatusId = await this.enumMappingService.getCodeTableId(
          'TABLE_STATUS',
          TableStatusEnum.FREE,
        );
        await this.tableService.updateTableStatus(order.tableId, freeStatusId);
      }

      return updated;
    }

    return await orderRepo.update(id, { statusId: newStatusId });
  }

  async cancelOrder(id: number, reason: string): Promise<Order> {
    const cancelledStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.CANCELLED,
    );
    const orderRepo = this.getOrderRepo();
    const order = await orderRepo.findById(id);

    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    const updated = await orderRepo.update(id, {
      statusId: cancelledStatusId,
      cancelledReason: reason,
      completedAt: new Date().toISOString(),
    });

    // Free the table if it was a DINE_IN order
    if (order.tableId) {
      const freeStatusId = await this.enumMappingService.getCodeTableId(
        'TABLE_STATUS',
        TableStatusEnum.FREE,
      );
      await this.tableService.updateTableStatus(order.tableId, freeStatusId);
    }

    return updated;
  }

  async completeOrder(id: number): Promise<Order> {
    const completedStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.COMPLETED,
    );
    return await this.updateOrderStatus(id, completedStatusId);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await this.getOrderItemRepo().findByOrderId(orderId);
  }

  async getOrderItemExtras(orderItemId: number): Promise<number[]> {
    const extras = await this.getOrderItemExtraRepo().findByOrderItemId(orderItemId);
    return extras.map((e) => e.extraId);
  }

  async updateOrderItemStatus(itemId: number, statusId: number): Promise<OrderItem> {
    const orderItemRepo = this.getOrderItemRepo();
    const updatedItem = await orderItemRepo.update(itemId, { statusId });

    // After updating an item, check if we should update the whole order status
    await this.checkAndUpdateOrderStatusByItems(updatedItem.orderId);

    return updatedItem;
  }

  private async checkAndUpdateOrderStatusByItems(orderId: number): Promise<void> {
    const orderRepo = this.getOrderRepo();
    const orderItemRepo = this.getOrderItemRepo();
    const items = await orderItemRepo.findByOrderId(orderId);

    if (items.length === 0) return;

    const readyStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.READY,
    );
    const preparingStatusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.PREPARING,
    );

    const allReady = items.every((item) => item.statusId === readyStatusId);

    const order = await orderRepo.findById(orderId);
    if (!order) return;

    const currentStatus = await this.enumMappingService.getEnumFromId(order.statusId);

    if (allReady) {
      const orderType = await this.enumMappingService.getEnumFromId(order.typeId);

      if (orderType.code === OrderTypeEnum.DINE_IN) {
        // For Dine-In: If all items are ready, it's considered SERVED (out of kitchen, but table active)
        // Unless it's already paid, then it's COMPLETED
        if (currentStatus.code === OrderStatusEnum.COMPLETED) {
          // Already completed, nothing to do
        } else if (
          currentStatus.code !== OrderStatusEnum.SERVED &&
          currentStatus.code !== OrderStatusEnum.COMPLETED
        ) {
          const servedStatusId = await this.enumMappingService.getCodeTableId(
            'ORDER_STATUS',
            OrderStatusEnum.SERVED,
          );
          await this.updateOrderStatus(orderId, servedStatusId);
        }
      } else {
        // For Takeaway/Delivery: All items ready means the order is SERVED (Ready for Pickup/Delivery)
        // It will be moved to COMPLETED after payment
        if (
          currentStatus.code !== OrderStatusEnum.SERVED &&
          currentStatus.code !== OrderStatusEnum.COMPLETED
        ) {
          const servedStatusId = await this.enumMappingService.getCodeTableId(
            'ORDER_STATUS',
            OrderStatusEnum.SERVED,
          );
          await this.updateOrderStatus(orderId, servedStatusId);
        }
      }
    } else {
      // Not all items are ready. Check if we need to pull back from advanced statuses.
      if (
        currentStatus.code === OrderStatusEnum.READY ||
        currentStatus.code === OrderStatusEnum.SERVED ||
        currentStatus.code === OrderStatusEnum.OUT_FOR_DELIVERY
      ) {
        await this.updateOrderStatus(orderId, preparingStatusId);
      } else if (currentStatus.code === OrderStatusEnum.OPEN) {
        // If it's a new/paid order and items are started, move to preparing
        const anyStarted = items.some(
          (item) => item.statusId === preparingStatusId || item.statusId === readyStatusId,
        );
        if (anyStarted) {
          await this.updateOrderStatus(orderId, preparingStatusId);
        }
      }
    }
  }

  private getOrderRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderRepo : this.indexedDBOrderRepo;
  }

  private getOrderItemRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderItemRepo : this.indexedDBOrderItemRepo;
  }

  private getOrderItemExtraRepo() {
    return this.platformService.isTauri()
      ? this.sqliteOrderItemExtraRepo
      : this.indexedDBOrderItemExtraRepo;
  }
}
