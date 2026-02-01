import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteOrderRepository } from '../../infrastructure/repositories/sqlite-order.repository';
import { IndexedDBOrderRepository } from '../../infrastructure/repositories/indexeddb-order.repository';
import { SQLiteOrderItemRepository } from '../../infrastructure/repositories/sqlite-order-item.repository';
import { IndexedDBOrderItemRepository } from '../../infrastructure/repositories/indexeddb-order-item.repository';
import { SQLiteOrderItemExtraRepository } from '../../infrastructure/repositories/sqlite-order-item-extra.repository';
import { IndexedDBOrderItemExtraRepository } from '../../infrastructure/repositories/indexeddb-order-item-extra.repository';
import { Order, OrderItem } from '../../domain/entities';
import { EnumMappingService } from './enum-mapping.service';
import { TableService } from './table.service';
import { OrderStatusEnum, OrderTypeEnum, TableStatusEnum } from '../../domain/enums';
import { CartItem } from '../../domain/dtos/cart.dto';

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
}

@Injectable({
  providedIn: 'root'
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
    private tableService: TableService
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
        cancelledReason: null
      });

      // Create order items
      for (const cartItem of data.items) {
        const orderItem = await orderItemRepo.create({
          orderId: order.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.unitPrice,
          notes: cartItem.notes
        });

        // Create order item extras
        for (const extraId of cartItem.extraIds) {
          await orderItemExtraRepo.create({
            orderId: order.id,
            orderItemId: orderItem.id,
            extraId
          });
        }
      }

      // If DINE_IN order with PAID status, set table to OCCUPIED
      const orderType = await this.enumMappingService.getEnumFromId(data.typeId);
      const orderStatus = await this.enumMappingService.getEnumFromId(data.statusId);
      
      if (orderType.code === OrderTypeEnum.DINE_IN && 
          orderStatus.code === OrderStatusEnum.PAID && 
          data.tableId) {
        const occupiedStatusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.OCCUPIED);
        await this.tableService.updateTableStatus(data.tableId, occupiedStatusId);
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order: ' + (error as Error).message);
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    return await this.getOrderRepo().findById(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.getOrderRepo().findAll();
  }

  async getActiveOrders(): Promise<Order[]> {
    return await this.getOrderRepo().findActiveOrders();
  }

  async getOrdersByStatus(statusEnum: OrderStatusEnum): Promise<Order[]> {
    const statusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', statusEnum);
    return await this.getOrderRepo().findByStatus(statusId);
  }

  async updateOrderStatus(id: number, newStatusId: number): Promise<Order> {
    const orderRepo = this.getOrderRepo();
    const order = await orderRepo.findById(id);
    
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    const newStatus = await this.enumMappingService.getEnumFromId(newStatusId);
    
    // If status is COMPLETED or CANCELLED, set completedAt and free table
    if (newStatus.code === OrderStatusEnum.COMPLETED || newStatus.code === OrderStatusEnum.CANCELLED) {
      const updated = await orderRepo.update(id, {
        statusId: newStatusId,
        completedAt: new Date().toISOString()
      });

      // Free the table if it was a DINE_IN order
      if (order.tableId) {
        const freeStatusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
        await this.tableService.updateTableStatus(order.tableId, freeStatusId);
      }

      return updated;
    }

    return await orderRepo.update(id, { statusId: newStatusId });
  }

  async cancelOrder(id: number, reason: string): Promise<Order> {
    const cancelledStatusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', OrderStatusEnum.CANCELLED);
    const orderRepo = this.getOrderRepo();
    const order = await orderRepo.findById(id);
    
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    const updated = await orderRepo.update(id, {
      statusId: cancelledStatusId,
      cancelledReason: reason,
      completedAt: new Date().toISOString()
    });

    // Free the table if it was a DINE_IN order
    if (order.tableId) {
      const freeStatusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
      await this.tableService.updateTableStatus(order.tableId, freeStatusId);
    }

    return updated;
  }

  async completeOrder(id: number): Promise<Order> {
    const completedStatusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', OrderStatusEnum.COMPLETED);
    return await this.updateOrderStatus(id, completedStatusId);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await this.getOrderItemRepo().findByOrderId(orderId);
  }

  async getOrderItemExtras(orderItemId: number): Promise<number[]> {
    const extras = await this.getOrderItemExtraRepo().findByOrderItemId(orderItemId);
    return extras.map(e => e.extraId);
  }

  private getOrderRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderRepo : this.indexedDBOrderRepo;
  }

  private getOrderItemRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderItemRepo : this.indexedDBOrderItemRepo;
  }

  private getOrderItemExtraRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderItemExtraRepo : this.indexedDBOrderItemExtraRepo;
  }
}
