import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { ExtraService } from '../../../application/services/extra.service';
import { OrderService } from '../../../application/services/order.service';
import { PrinterService } from '../../../application/services/printer.service';
import { ProductService } from '../../../application/services/product.service';
import { TableService } from '../../../application/services/table.service';
import { VariantService } from '../../../application/services/variant.service';
import { Extra, Order, OrderItem, Product, Table, Variant } from '../../../domain/entities';
import { OrderStatusEnum } from '../../../domain/enums';

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
  imports: [CommonModule],
  template: `
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Filter & Refresh -->
        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">
              {{ filterTitle() }} Orders
            </h2>
            <div class="flex bg-gray-100 p-1 rounded-xl shadow-inner">
              <button
                (click)="setFilter('ACTIVE')"
                [class.bg-white]="currentFilter() === 'ACTIVE'"
                [class.text-blue-600]="currentFilter() === 'ACTIVE'"
                [class.shadow-sm]="currentFilter() === 'ACTIVE'"
                [class.text-gray-500]="currentFilter() !== 'ACTIVE'"
                class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:text-blue-500"
              >
                Active
              </button>
              <button
                (click)="setFilter(OrderStatus.SERVED)"
                [class.bg-white]="currentFilter() === OrderStatus.SERVED"
                [class.text-blue-600]="currentFilter() === OrderStatus.SERVED"
                [class.shadow-sm]="currentFilter() === OrderStatus.SERVED"
                [class.text-gray-500]="currentFilter() !== OrderStatus.SERVED"
                class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:text-blue-500"
              >
                Served
              </button>
              <button
                (click)="setFilter(OrderStatus.COMPLETED)"
                [class.bg-white]="currentFilter() === OrderStatus.COMPLETED"
                [class.text-blue-600]="currentFilter() === OrderStatus.COMPLETED"
                [class.shadow-sm]="currentFilter() === OrderStatus.COMPLETED"
                [class.text-gray-500]="currentFilter() !== OrderStatus.COMPLETED"
                class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:text-blue-500"
              >
                Completed
              </button>
              <button
                (click)="setFilter('ALL')"
                [class.bg-white]="currentFilter() === 'ALL'"
                [class.text-blue-600]="currentFilter() === 'ALL'"
                [class.shadow-sm]="currentFilter() === 'ALL'"
                [class.text-gray-500]="currentFilter() !== 'ALL'"
                class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:text-blue-500"
              >
                All
              </button>
            </div>
          </div>

          <button
            (click)="loadOrders()"
            [disabled]="isLoading()"
            class="neo-button h-12 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            @if (isLoading()) {
              <div
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              <span>Loading...</span>
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            }
          </button>
        </div>

        @if (error()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p class="text-red-800 font-semibold">{{ error() }}</p>
          </div>
        }

        @if (orders().length === 0 && !isLoading()) {
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div class="text-7xl mb-6 grayscale opacity-20">📋</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p class="text-gray-500 max-w-xs mx-auto">
              There are no orders matching the current filter:
              <span class="font-semibold">{{ currentFilter() | titlecase }}</span>
            </p>
          </div>
        }

        <!-- Orders Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (order of orders(); track order.order.id) {
            <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
              <!-- Order Header -->
              <div class="bg-linear-to-r from-orange-500 to-red-500 text-white p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <div class="text-3xl font-bold">{{ order.order.orderNumber }}</div>
                    <div class="text-sm opacity-90">{{ order.orderType }}</div>
                  </div>
                  @if (order.table) {
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                      <div class="text-xs opacity-90">Table</div>
                      <div class="text-2xl font-bold">{{ order.table.number }}</div>
                    </div>
                  }
                </div>
                <div class="text-xs opacity-80">
                  {{ formatTime(order.order.createdAt) }}
                </div>
              </div>

              <div class="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                @for (orderItem of order.items; track orderItem.item.id) {
                  <div
                    class="relative bg-white border border-gray-100 rounded-xl p-3 shadow-sm transition-all"
                    [class.opacity-60]="orderItem.itemStatusCode === OrderStatus.READY"
                  >
                    <div class="flex items-start">
                      <div
                        class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                        [class.bg-orange-500]="orderItem.itemStatusCode !== OrderStatus.READY"
                        [class.text-white]="orderItem.itemStatusCode !== OrderStatus.READY"
                        [class.bg-gray-200]="orderItem.itemStatusCode === OrderStatus.READY"
                        [class.text-gray-500]="orderItem.itemStatusCode === OrderStatus.READY"
                      >
                        {{ orderItem.item.quantity }}
                      </div>
                      <div class="ml-3 flex-1">
                        <div class="flex justify-between items-start">
                          <div
                            class="font-bold text-gray-800"
                            [class.line-through]="orderItem.itemStatusCode === OrderStatus.READY"
                          >
                            {{ orderItem.product.name }}
                          </div>
                          @if (orderItem.itemStatusCode === OrderStatus.READY) {
                            <span
                              class="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
                              >Done</span
                            >
                          } @else if (orderItem.itemStatusCode === OrderStatus.PREPARING) {
                            <span
                              class="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse"
                              >Preparing</span
                            >
                          }
                        </div>

                        @if (orderItem.variant) {
                          <div class="text-xs text-gray-500 mt-0.5">
                            Size: {{ orderItem.variant.name }}
                          </div>
                        }
                        @for (extra of orderItem.extras; track extra.id) {
                          <div class="text-xs text-gray-500">+ {{ extra.name }}</div>
                        }
                        @if (orderItem.item.notes) {
                          <div class="text-xs text-orange-600 font-bold mt-1 italic">
                            "{{ orderItem.item.notes }}"
                          </div>
                        }

                        <div class="mt-3 flex gap-2">
                          @if (orderItem.itemStatusCode !== OrderStatus.READY) {
                            <button
                              (click)="markItemAsReady(orderItem.item.id)"
                              class="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                            >
                              DONE
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                    <div class="absolute top-2 right-2 text-[8px] text-gray-300 font-medium">
                      {{ formatItemTime(orderItem.item.createdAt) }}
                    </div>
                  </div>
                }
              </div>

              <!-- Order Actions -->
              <div class="p-4 bg-gray-50 border-t border-gray-200">
                <div class="flex items-center justify-between px-1">
                  <span class="text-xs text-gray-400"
                    >Status:
                    <span class="font-bold text-gray-700 uppercase tracking-wider">{{
                      order.orderStatus
                    }}</span></span
                  >
                  <span class="text-xs text-gray-400 font-bold"
                    >{{ order.items.length }} Items</span
                  >
                </div>
                <div class="mt-4 flex gap-2">
                  <button
                    (click)="printTicket(order.order.id)"
                    class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🖨️</span>
                    Print Ticket
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </main>
  `,
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

    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadOrders();
    }, 30000);
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

  async markItemAsPreparing(itemId: number) {
    const statusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.PREPARING,
    );
    await this.orderService.updateOrderItemStatus(itemId, statusId);
    await this.loadOrders();
  }

  async markItemAsReady(itemId: number) {
    const statusId = await this.enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.READY,
    );
    await this.orderService.updateOrderItemStatus(itemId, statusId);
    await this.loadOrders();
  }

  async printTicket(orderId: number) {
    try {
      await this.printerService.printKitchenTicket(orderId);
    } catch (err) {
      this.error.set('Failed to print ticket: ' + (err as Error).message);
    }
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
