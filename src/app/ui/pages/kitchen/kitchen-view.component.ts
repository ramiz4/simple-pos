import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService } from '../../../application/services/order.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { ProductService } from '../../../application/services/product.service';
import { VariantService } from '../../../application/services/variant.service';
import { ExtraService } from '../../../application/services/extra.service';
import { TableService } from '../../../application/services/table.service';
import { AuthService, UserSession } from '../../../application/services/auth.service';
import { Order, OrderItem, Product, Variant, Extra, Table } from '../../../domain/entities';
import { OrderStatusEnum } from '../../../domain/enums';

interface KitchenOrderItem {
  item: OrderItem;
  product: Product;
  variant: Variant | null;
  extras: Extra[];
}

interface KitchenOrder {
  order: Order;
  orderType: string;
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
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-800">🍽️ Kitchen View</h1>
            </div>
            <div class="flex items-center space-x-4">
              @if (session) {
                <div class="text-sm">
                  <span class="text-gray-600">Welcome,</span>
                  <span class="font-semibold text-gray-800 ml-1">{{ session.user.name }}</span>
                </div>
              }
              <button
                (click)="goToDashboard()"
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Dashboard
              </button>
              <button
                (click)="onLogout()"
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Refresh Button -->
          <div class="mb-4 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Active Orders</h2>
            <button
              (click)="loadOrders()"
              [disabled]="isLoading()"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
            >
              {{ isLoading() ? '⏳ Loading...' : '🔄 Refresh' }}
            </button>
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p class="text-red-800 font-semibold">{{ error() }}</p>
            </div>
          }

          @if (orders().length === 0 && !isLoading()) {
            <div class="bg-white rounded-lg shadow p-12 text-center">
              <div class="text-6xl mb-4">✅</div>
              <h3 class="text-2xl font-bold text-gray-800 mb-2">All Clear!</h3>
              <p class="text-gray-600">No active orders in the kitchen</p>
            </div>
          }

          <!-- Orders Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (order of orders(); track order.order.id) {
              <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
                <!-- Order Header -->
                <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
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

                <!-- Order Items -->
                <div class="p-4 space-y-3 max-h-64 overflow-y-auto">
                  @for (orderItem of order.items; track orderItem.item.id) {
                    <div class="border-b border-gray-200 pb-3 last:border-b-0">
                      <div class="flex items-start">
                        <div class="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {{ orderItem.item.quantity }}
                        </div>
                        <div class="ml-3 flex-1">
                          <div class="font-semibold text-gray-800">{{ orderItem.product.name }}</div>
                          @if (orderItem.variant) {
                            <div class="text-sm text-gray-600">Size: {{ orderItem.variant.name }}</div>
                          }
                          @for (extra of orderItem.extras; track extra.id) {
                            <div class="text-sm text-gray-600">+ {{ extra.name }}</div>
                          }
                          @if (orderItem.item.notes) {
                            <div class="text-sm text-orange-600 font-semibold mt-1">
                              📝 {{ orderItem.item.notes }}
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Order Actions -->
                <div class="p-4 bg-gray-50 border-t border-gray-200">
                  <div class="text-sm text-gray-600 mb-3 text-center">
                    Status: <span class="font-semibold">{{ order.orderStatus }}</span>
                  </div>
                  <div class="space-y-2">
                    @if (canMarkAsPreparing(order.order)) {
                      <button
                        (click)="markAsPreparing(order.order.id)"
                        [disabled]="processingOrderId() === order.order.id"
                        class="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {{ processingOrderId() === order.order.id ? '⏳ Processing...' : '👨‍🍳 Start Preparing' }}
                      </button>
                    }
                    @if (canMarkAsReady(order.order)) {
                      <button
                        (click)="markAsReady(order.order.id)"
                        [disabled]="processingOrderId() === order.order.id"
                        class="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {{ processingOrderId() === order.order.id ? '⏳ Processing...' : '✅ Mark as Ready' }}
                      </button>
                    }
                    @if (canMarkAsCompleted(order.order)) {
                      <button
                        (click)="markAsCompleted(order.order.id)"
                        [disabled]="processingOrderId() === order.order.id"
                        class="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {{ processingOrderId() === order.order.id ? '⏳ Processing...' : '🎉 Mark as Completed' }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class KitchenViewComponent implements OnInit, OnDestroy {
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
    private router: Router
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
      // Get all active orders (not completed or cancelled)
      const activeOrders = await this.orderService.getActiveOrders();
      
      // Transform orders to kitchen order format
      const kitchenOrders = await Promise.all(
        activeOrders.map(order => this.transformToKitchenOrder(order))
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
        const extras = await Promise.all(
          extraIds.map(id => this.extraService.getById(id))
        );

        return {
          item,
          product,
          variant,
          extras: extras.filter((e): e is Extra => e !== null)
        };
      })
    );

    const table = order.tableId ? await this.tableService.getById(order.tableId) : null;
    const orderType = await this.enumMappingService.getTranslation(order.typeId, 'en');
    const orderStatus = await this.enumMappingService.getTranslation(order.statusId, 'en');
    const orderStatusEnum = await this.enumMappingService.getEnumFromId(order.statusId);

    return {
      order,
      orderType,
      orderStatus,
      orderStatusCode: orderStatusEnum.code,
      items,
      table
    };
  }

  async markAsPreparing(orderId: number) {
    await this.updateOrderStatus(orderId, OrderStatusEnum.PREPARING);
  }

  async markAsReady(orderId: number) {
    await this.updateOrderStatus(orderId, OrderStatusEnum.READY);
  }

  async markAsCompleted(orderId: number) {
    await this.updateOrderStatus(orderId, OrderStatusEnum.COMPLETED);
  }

  private async updateOrderStatus(orderId: number, status: OrderStatusEnum) {
    this.processingOrderId.set(orderId);
    this.error.set(null);

    try {
      const statusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', status);
      await this.orderService.updateOrderStatus(orderId, statusId);
      await this.loadOrders(); // Reload orders
    } catch (err) {
      this.error.set('Failed to update order status: ' + (err as Error).message);
      console.error('Error updating order status:', err);
    } finally {
      this.processingOrderId.set(null);
    }
  }

  canMarkAsPreparing(order: Order): boolean {
    // Can mark as preparing if order is PAID
    const kitchenOrder = this.orders().find(ko => ko.order.id === order.id);
    if (!kitchenOrder) return false;
    return kitchenOrder.orderStatusCode === OrderStatusEnum.PAID;
  }

  canMarkAsReady(order: Order): boolean {
    // Can mark as ready if order is PREPARING
    const kitchenOrder = this.orders().find(ko => ko.order.id === order.id);
    if (!kitchenOrder) return false;
    return kitchenOrder.orderStatusCode === OrderStatusEnum.PREPARING;
  }

  canMarkAsCompleted(order: Order): boolean {
    // Can mark as completed if order is READY
    const kitchenOrder = this.orders().find(ko => ko.order.id === order.id);
    if (!kitchenOrder) return false;
    return kitchenOrder.orderStatusCode === OrderStatusEnum.READY;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
