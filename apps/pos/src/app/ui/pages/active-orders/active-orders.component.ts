import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Order, OrderStatusEnum } from '@simple-pos/shared/types';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { OrderService } from '../../../application/services/order.service';
import { TableService } from '../../../application/services/table.service';

interface EnrichedOrder extends Order {
  tableName?: string;
}

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [DatePipe, NgClass],
  templateUrl: './active-orders.component.html',
})
export class ActiveOrdersComponent implements OnInit {
  readonly OrderStatus = OrderStatusEnum;

  orders = signal<EnrichedOrder[]>([]);
  orderStatuses = signal<Record<number, string>>({});
  orderTypes = signal<Record<number, string>>({});
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    private orderService: OrderService,
    private enumMappingService: EnumMappingService,
    private tableService: TableService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const orders = await this.orderService.getActiveAndServedOrders();

      // Load status and type names
      const statusMap: Record<number, string> = {};
      const typeMap: Record<number, string> = {};

      for (const order of orders) {
        if (!statusMap[order.statusId]) {
          const statusFn = await this.enumMappingService.getEnumFromId(order.statusId);
          statusMap[order.statusId] = statusFn.code;
        }
        if (!typeMap[order.typeId]) {
          const typeFn = await this.enumMappingService.getEnumFromId(order.typeId);
          typeMap[order.typeId] = typeFn.code;
        }
      }

      this.orderStatuses.set(statusMap);
      this.orderTypes.set(typeMap);

      // Enrich with table names
      const enrichedOrders: EnrichedOrder[] = await Promise.all(
        orders.map(async (order) => {
          let tableName = undefined;
          if (order.tableId) {
            const table = await this.tableService.getById(order.tableId);
            const rawName = table?.number || table?.name || order.tableId;
            tableName = rawName.toString();
          }
          return { ...order, tableName };
        }),
      );

      this.orders.set(enrichedOrders);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async markAsServed(event: Event, order: Order) {
    event.stopPropagation();
    try {
      await this.orderService.markOrderAsServed(order.id);
      await this.loadOrders();
    } catch (err) {
      this.error.set('Failed to mark order as served: ' + (err as Error).message);
    }
  }

  openOrder(order: Order) {
    this.router.navigate(['/pos/cart'], {
      queryParams: {
        orderId: order.id,
        typeId: order.typeId,
        tableId: order.tableId,
      },
    });
  }
}
