import { TitleCasePipe } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Extra,
  Order,
  OrderItem,
  OrderStatusEnum,
  Product,
  Table,
  Variant,
} from '@simple-pos/shared/types';
import { AuthService, UserSession } from '../../../application/services/auth.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { ExtraService } from '../../../application/services/extra.service';
import { OrderService } from '../../../application/services/order.service';
import { PrinterService } from '../../../application/services/printer.service';
import { ProductService } from '../../../application/services/product.service';
import { TableService } from '../../../application/services/table.service';
import { VariantService } from '../../../application/services/variant.service';
import { ButtonComponent } from '../../components/shared/button/button.component';

interface KitchenOrderItem {
  item: OrderItem;
  product: Product;
  variant: Variant | null;
  extras: Extra[];
  itemStatus: string;
  itemStatusCode: string;
}

interface KitchenOrder {
  order: Order;
  orderType: string;
  orderTypeCode: string;
  orderStatus: string;
  orderStatusCode: string;
  items: KitchenOrderItem[];
  table: Table | null;
}

@Component({
  selector: 'app-kitchen-view',
  standalone: true,
  imports: [TitleCasePipe, ButtonComponent],
  templateUrl: './kitchen-view.component.html',
  styles: [],
})
export class KitchenViewComponent implements OnInit, OnDestroy {
  readonly OrderStatus = OrderStatusEnum;

  currentFilter = signal<OrderStatusEnum.COMPLETED | OrderStatusEnum.SERVED | 'ACTIVE' | 'ALL'>(
    'ACTIVE',
  );
  filterTitle = computed(() => {
    switch (this.currentFilter()) {
      case 'ACTIVE':
        return 'Active';
      case this.OrderStatus.COMPLETED:
        return 'Completed';
      case this.OrderStatus.SERVED:
        return 'Served';
      case 'ALL':
        return 'All';
      default:
        return 'Orders';
    }
  });

  orders = signal<KitchenOrder[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  processingOrderId = signal<number | null>(null);
  session: UserSession | null = null;

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private orderService: OrderService,
    private enumMappingService: EnumMappingService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private tableService: TableService,
    private authService: AuthService,
    private printerService: PrinterService,
    private router: Router,
  ) {
    this.session = this.authService.getCurrentSession();
  }

  async ngOnInit() {
    await this.loadOrders();

    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.loadOrders();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadOrders() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      let fetchedOrders: Order[] = [];

      if (this.currentFilter() === 'ACTIVE') {
        fetchedOrders = await this.orderService.getActiveOrders();
      } else if (this.currentFilter() === OrderStatusEnum.COMPLETED) {
        fetchedOrders = await this.orderService.getOrdersByStatus(OrderStatusEnum.COMPLETED);
      } else if (this.currentFilter() === OrderStatusEnum.SERVED) {
        fetchedOrders = await this.orderService.getOrdersByStatus(OrderStatusEnum.SERVED);
      } else {
        fetchedOrders = await this.orderService.getAllOrders();
      }

      // Transform orders to kitchen order format
      const kitchenOrders = await Promise.all(
        fetchedOrders.map((order) => this.transformToKitchenOrder(order)),
      );

      this.orders.set(kitchenOrders);
    } catch (err) {
      this.error.set('Failed to load orders: ' + (err as Error).message);
      console.error('Error loading orders:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async transformToKitchenOrder(order: Order): Promise<KitchenOrder> {
    const orderItems = await this.orderService.getOrderItems(order.id);

    const items = await Promise.all(
      orderItems.map(async (item): Promise<KitchenOrderItem> => {
        const product = await this.productService.getById(item.productId);
        if (!product) {
          throw new Error(`Product with id ${item.productId} not found`);
        }
        const variant = item.variantId ? await this.variantService.getById(item.variantId) : null;
        const extraIds = await this.orderService.getOrderItemExtras(item.id);
        const extras = await Promise.all(extraIds.map((id) => this.extraService.getById(id)));

        const effectiveStatusId = item.statusId || order.statusId;
        const itemStatus = await this.enumMappingService.getTranslation(effectiveStatusId, 'en');
        const itemStatusEnum = await this.enumMappingService.getEnumFromId(effectiveStatusId);

        return {
          item,
          product,
          variant,
          extras: extras.filter((e): e is Extra => e !== null),
          itemStatus,
          itemStatusCode: itemStatusEnum.code,
        };
      }),
    );

    const table = order.tableId ? await this.tableService.getById(order.tableId) : null;
    const orderType = await this.enumMappingService.getTranslation(order.typeId, 'en');
    const orderStatus = await this.enumMappingService.getTranslation(order.statusId, 'en');
    const orderStatusEnum = await this.enumMappingService.getEnumFromId(order.statusId);

    const orderTypeEnum = await this.enumMappingService.getEnumFromId(order.typeId);

    return {
      order,
      orderType,
      orderTypeCode: orderTypeEnum.code,
      orderStatus,
      orderStatusCode: orderStatusEnum.code,
      items,
      table,
    };
  }

  async setFilter(filter: OrderStatusEnum.COMPLETED | OrderStatusEnum.SERVED | 'ACTIVE' | 'ALL') {
    this.currentFilter.set(filter);
    await this.loadOrders();
  }

  private updateItemStatusCodeLocally(itemId: number, newStatusCode: string) {
    this.orders.update((orders) =>
      orders.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.item.id === itemId ? { ...item, itemStatusCode: newStatusCode } : item,
        ),
      })),
    );
  }

  async markItemAsPreparing(itemId: number) {
    const previousOrders = this.orders();
    this.updateItemStatusCodeLocally(itemId, OrderStatusEnum.PREPARING);

    try {
      const statusId = await this.enumMappingService.getCodeTableId(
        'ORDER_STATUS',
        OrderStatusEnum.PREPARING,
      );
      await this.orderService.updateOrderItemStatus(itemId, statusId);
    } catch (err) {
      // Revert optimistic update on error
      this.orders.set(previousOrders);
      this.error.set('Failed to update item to preparing: ' + (err as Error).message);
    } finally {
      await this.loadOrders();
    }
  }

  async markItemAsReady(itemId: number) {
    const previousOrders = this.orders();
    this.updateItemStatusCodeLocally(itemId, OrderStatusEnum.READY);

    try {
      const statusId = await this.enumMappingService.getCodeTableId(
        'ORDER_STATUS',
        OrderStatusEnum.READY,
      );
      await this.orderService.updateOrderItemStatus(itemId, statusId);
    } catch (err) {
      // Revert optimistic update on error
      this.orders.set(previousOrders);
      this.error.set('Failed to update item to ready: ' + (err as Error).message);
    } finally {
      await this.loadOrders();
    }
  }

  async printTicket(orderId: number) {
    try {
      await this.printerService.printKitchenTicket(orderId);
    } catch (err) {
      this.error.set('Failed to print ticket: ' + (err as Error).message);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    // Format as "dd.MM.YYYY mm:hh"
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatItemTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'NEW';
    return `${diffMins}m ago`;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
