import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderStatusEnum, OrderTypeEnum } from '@simple-pos/shared/types';
import { roundCurrency } from '@simple-pos/shared/utils';
import { AuthService } from '../../../application/services/auth.service';
import { CartService } from '../../../application/services/cart.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { OrderService } from '../../../application/services/order.service';
import { PrinterService } from '../../../application/services/printer.service';
import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './payment.component.html',
})
export class PaymentComponent implements OnInit {
  private typeId?: number;
  private tableId?: number;
  private orderId?: number;

  processing = signal(false);
  completed = signal(false);
  printing = signal(false);
  error = signal<string | null>(null);
  orderNumber = signal<string>('');
  createdOrderId = signal<number | null>(null);
  existingOrder = signal<Order | null>(null);
  summary = computed(() => this.cartService.getSummary());

  grandSubtotal = computed(() => (this.existingOrder()?.subtotal || 0) + this.summary().subtotal);
  grandTax = computed(() => (this.existingOrder()?.tax || 0) + this.summary().tax);
  grandTotal = computed(() => (this.existingOrder()?.total || 0) + this.summary().total);

  // Cash payment: amount received and change calculation
  overriddenTotalWithTip = signal<number | null>(null);
  totalWithTip = computed(() => {
    const value = Math.max(this.grandTotal(), this.overriddenTotalWithTip() ?? this.grandTotal());
    return roundCurrency(value);
  });
  isTotalInvalid = computed(() => {
    const overridden = this.overriddenTotalWithTip();
    return overridden !== null && overridden < this.grandTotal();
  });
  tipAmount = computed(() => {
    const tip = Math.max(0, this.totalWithTip() - this.grandTotal());
    return roundCurrency(tip);
  });

  amountReceived = signal<number | null>(null);
  changeAmount = computed(() => {
    const received = this.amountReceived();
    const total = this.totalWithTip();
    if (received === null || received < 0 || received < total) return 0;
    const change = received - total;
    return roundCurrency(change);
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private orderService: OrderService,
    private enumMappingService: EnumMappingService,
    private printerService: PrinterService,
    private authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(async (params) => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
      this.tableId = params['tableId'] ? +params['tableId'] : undefined;
      this.orderId = params['orderId'] ? +params['orderId'] : undefined;

      const type = this.typeId ? await this.enumMappingService.getEnumFromId(this.typeId) : null;

      if (this.orderId) {
        // If orderId is provided, load that specific order
        const order = await this.orderService.getOrderById(this.orderId);
        this.existingOrder.set(order);
      } else if (type?.code === OrderTypeEnum.DINE_IN && this.tableId) {
        // Fallback to table lookup for Dine In
        const order = await this.orderService.getOpenOrderByTable(this.tableId);
        this.existingOrder.set(order);
      }

      // If no items in cart and no existing order (and not currently completed), return to POS
      if (this.cartService.isEmpty() && !this.existingOrder() && !this.completed()) {
        this.router.navigate(['/pos']);
      }

      // Initialize the overridden value once when the component loads or the order is fetched
      if (this.overriddenTotalWithTip() === null) {
        this.overriddenTotalWithTip.set(this.grandTotal());
      }
    });
  }

  async confirmPayment(): Promise<void> {
    if (!this.typeId) {
      this.error.set('Order type not selected');
      return;
    }

    if (this.isTotalInvalid()) {
      this.error.set('Total plus Tip cannot be less than the order total');
      return;
    }

    const received = this.amountReceived();
    const total = this.totalWithTip();

    if (received === null || received < total) {
      this.error.set('Amount received must be at least €' + total.toFixed(2));
      return;
    }

    const session = this.authService.getCurrentSession();
    if (!session) {
      this.error.set('User not authenticated');
      return;
    }

    try {
      this.processing.set(true);
      this.error.set(null);

      const completedStatusId = await this.enumMappingService.getCodeTableId(
        'ORDER_STATUS',
        OrderStatusEnum.COMPLETED,
      );

      let order;
      const cartItems = this.cartService.cart();
      const type = await this.enumMappingService.getEnumFromId(this.typeId);

      if (this.orderId) {
        // If we have an explicit order ID (e.g. Takeaway that was just placed), use it
        const existingOrder = await this.orderService.getOrderById(this.orderId);

        if (existingOrder) {
          if (cartItems.length > 0) {
            await this.orderService.addItemsToOrder(existingOrder.id, cartItems);
          }
          order = await this.orderService.updateOrder(existingOrder.id, {
            statusId: completedStatusId,
            completedAt: new Date().toISOString(),
            tip: (existingOrder.tip || 0) + this.tipAmount(),
            total: this.totalWithTip(),
          });
        }
      } else if (type.code === OrderTypeEnum.DINE_IN && this.tableId) {
        const existingOrder = await this.orderService.getOpenOrderByTable(this.tableId);

        if (existingOrder) {
          // Add remaining items in cart to the order if any
          if (cartItems.length > 0) {
            await this.orderService.addItemsToOrder(existingOrder.id, cartItems);
          }
          // Mark as COMPLETED and update totals
          order = await this.orderService.updateOrder(existingOrder.id, {
            statusId: completedStatusId,
            completedAt: new Date().toISOString(),
            tip: (existingOrder.tip || 0) + this.tipAmount(),
            total: this.totalWithTip(),
          });
        }
      }

      if (!order) {
        // Create new order (current behavior for other types or if no existing DINE_IN order)
        order = await this.orderService.createOrder({
          typeId: this.typeId,
          statusId: completedStatusId,
          tableId: this.tableId || null,
          subtotal: this.grandSubtotal(),
          tax: this.grandTax(),
          tip: this.tipAmount(),
          total: this.totalWithTip(),
          userId: session.user.id,
          items: cartItems,
        });
      }

      this.orderNumber.set(order.orderNumber);
      this.createdOrderId.set(order.id);
      this.cartService.clear();
      this.completed.set(true);
    } catch (err) {
      this.error.set('Failed to process payment: ' + (err as Error).message);
    } finally {
      this.processing.set(false);
    }
  }

  async printReceipt(): Promise<void> {
    const orderId = this.createdOrderId();
    if (!orderId) return;

    try {
      this.printing.set(true);
      await this.printerService.printReceipt(orderId, 'en');
    } catch (err) {
      this.error.set('Failed to print receipt: ' + (err as Error).message);
    } finally {
      this.printing.set(false);
    }
  }

  async printKitchenTicket(): Promise<void> {
    const orderId = this.createdOrderId();
    if (!orderId) return;

    try {
      this.printing.set(true);
      await this.printerService.printKitchenTicket(orderId);
    } catch (err) {
      this.error.set('Failed to print kitchen ticket: ' + (err as Error).message);
    } finally {
      this.printing.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/pos/cart'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
        orderId: this.orderId,
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
