import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderItem } from '@simple-pos/shared/types';
import { CartService } from '../../../application/services/cart.service';
import { ProductService } from '../../../application/services/product.service';
import { VariantService } from '../../../application/services/variant.service';

interface EnrichedOrderItem extends OrderItem {
  productName: string;
  variantName: string | null;
  extraNames: string[];
}

import { OrderStatusEnum, OrderTypeEnum } from '@simple-pos/shared/types';
import { AuthService } from '../../../application/services/auth.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { ExtraService } from '../../../application/services/extra.service';
import { OrderService } from '../../../application/services/order.service';
import { PrinterService } from '../../../application/services/printer.service';
import { TableService } from '../../../application/services/table.service';
import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './cart-view.component.html',
})
export class CartViewComponent implements OnInit {
  // Query params
  private typeId?: number;
  private tableId?: number;
  private orderId?: number;

  // State
  isSending = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showClearConfirmation = signal<boolean>(false);
  existingOrder = signal<Order | null>(null);
  existingItems = signal<EnrichedOrderItem[]>([]);
  isExistingItemsCollapsed = signal<boolean>(true);
  enrichedExistingItems = computed(() => this.existingItems());

  // Computed signals
  cartItems = computed(() => this.cartService.cart());
  summary = computed(() => this.cartService.getSummary());
  isDineIn = signal<boolean>(false);

  // Takeaway/Delivery customer name
  customerName = signal<string>('');
  isNameRequired = computed(() => !this.isDineIn());

  totalTax = computed(() => {
    const existingTax = this.existingOrder()?.tax || 0;
    const newTax = this.summary().tax;
    return existingTax + newTax;
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
    private orderService: OrderService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private authService: AuthService,
    private printerService: PrinterService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Get query params
    this.route.queryParams.subscribe(async (params) => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
      this.tableId = params['tableId'] ? +params['tableId'] : undefined;
      this.orderId = params['orderId'] ? +params['orderId'] : undefined;

      if (this.typeId) {
        const type = await this.enumMappingService.getEnumFromId(this.typeId);
        this.isDineIn.set(type.code === OrderTypeEnum.DINE_IN);
      }

      // Ensure context is set so we see the correct cart items
      if (this.tableId) {
        this.cartService.setContext(this.tableId);
      }

      if (this.tableId || this.orderId) {
        await this.loadOrderData();
      }
    });
  }

  isEmpty(): boolean {
    return this.cartService.isEmpty() && this.existingItems().length === 0;
  }

  incrementQuantity(index: number): void {
    const item = this.cartItems()[index];
    this.cartService.updateItemQuantity(index, item.quantity + 1);
  }

  decrementQuantity(index: number): void {
    const item = this.cartItems()[index];
    this.cartService.updateItemQuantity(index, item.quantity - 1);
  }

  removeItem(index: number): void {
    this.cartService.removeItem(index);
  }

  toggleExistingItems(): void {
    this.isExistingItemsCollapsed.update((collapsed) => !collapsed);
  }

  confirmClearCart(): void {
    this.showClearConfirmation.set(true);
  }

  cancelClearCart(): void {
    this.showClearConfirmation.set(false);
  }

  async clearCart(): Promise<void> {
    this.cartService.clear();
    this.showClearConfirmation.set(false);
  }

  async placeOrder(): Promise<void> {
    if (!this.typeId) {
      this.error.set('Order information missing');
      return;
    }

    const session = this.authService.getCurrentSession();
    if (!session) {
      this.error.set('User not authenticated');
      return;
    }

    if (this.isNameRequired() && !this.customerName() && !this.orderId && !this.tableId) {
      this.error.set('Customer Name is required');
      return;
    }

    try {
      this.isSending.set(true);
      this.error.set(null);

      const items = this.cartItems();

      // Determine if there is an existing order to update
      let openOrder: Order | null = null;
      if (this.orderId) {
        openOrder = await this.orderService.getOrderById(this.orderId);
      } else if (this.tableId) {
        openOrder = await this.orderService.getOpenOrderByTable(this.tableId);
      }

      if (openOrder) {
        // Add items to existing order
        await this.orderService.addItemsToOrder(openOrder.id, items);
        this.orderId = openOrder.id; // Ensure we have the ID
      } else {
        // Create new OPEN order
        const statusId = await this.enumMappingService.getCodeTableId(
          'ORDER_STATUS',
          OrderStatusEnum.OPEN,
        );
        const summary = this.cartService.getSummary();

        const newOrder = await this.orderService.createOrder({
          typeId: this.typeId,
          statusId,
          tableId: this.tableId || null,
          subtotal: summary.subtotal,
          tax: summary.tax,
          tip: 0,
          total: summary.total,
          userId: session.user.id,
          items: items,
          customerName: this.customerName(),
        });

        this.orderId = newOrder.id;
      }

      // Clear cart and stay on page
      this.cartService.clear();

      // Reload data to show updated order state
      await this.loadOrderData();

      // Update URL with orderId
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { orderId: this.orderId },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });

      this.success.set('Order placed successfully!');
      setTimeout(() => this.success.set(null), 3000);
    } catch (err) {
      this.error.set('Failed to place order: ' + (err as Error).message);
    } finally {
      this.isSending.set(false);
    }
  }

  private async loadOrderData(): Promise<void> {
    if (!this.tableId && !this.orderId) return;

    let order: Order | null = null;
    if (this.orderId) {
      order = await this.orderService.getOrderById(this.orderId);
    } else if (this.tableId) {
      order = await this.orderService.getOpenOrderByTable(this.tableId);
    }

    this.existingOrder.set(order);

    if (order) {
      this.orderId = order.id; // Ensure we track it
      const items = await this.orderService.getOrderItems(order.id);

      // Enrich items with product details
      const enriched = await Promise.all(
        items.map(async (item) => {
          const product = await this.productService.getById(item.productId);
          const variant = item.variantId ? await this.variantService.getById(item.variantId) : null;

          // Fetch extras
          const extraIds = await this.orderService.getOrderItemExtras(item.id);
          const extraNames: string[] = [];
          for (const extraId of extraIds) {
            const extra = await this.extraService.getById(extraId);
            if (extra) {
              extraNames.push(extra.name);
            }
          }

          return {
            ...item,
            productName: product?.name || 'Unknown Product',
            variantName: variant?.name || null,
            extraNames,
          };
        }),
      );

      this.existingItems.set(enriched);
    } else {
      this.existingItems.set([]);
    }
  }

  backToProducts(): void {
    this.router.navigate(['/pos/product-selection'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
        orderId: this.orderId,
      },
    });
  }

  proceedToPayment(): void {
    this.router.navigate(['/pos/payment'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
        orderId: this.orderId,
      },
    });
  }
}
