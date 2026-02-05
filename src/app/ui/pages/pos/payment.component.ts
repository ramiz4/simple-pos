import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { CartService } from '../../../application/services/cart.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { OrderService } from '../../../application/services/order.service';
import { PrinterService } from '../../../application/services/printer.service';
import { OrderStatusEnum, OrderTypeEnum } from '../../../domain/enums';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-[#F8FAFC]">
      @if (!processing() && !completed()) {
        <app-header title="Checkout" [showBackButton]="true" (back)="goBack()"></app-header>
      }

      <main class="p-6 max-w-2xl mx-auto animate-fade-in">
        @if (!processing() && !completed()) {
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-black text-surface-900 mb-2">Final Step</h2>
            <p class="text-surface-500 font-medium">Review your order and process payment.</p>
          </div>

          <!-- Payment Card -->
          <div class="glass-card bg-surface-900! overflow-hidden shadow-primary-200">
            <div class="p-8 border-b border-white/10">
              <h3 class="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-8">
                Detailed Summary
              </h3>

              <div class="space-y-4">
                <div class="flex justify-between items-center text-white/60">
                  <span class="font-medium">Subtotal</span>
                  <span class="font-bold">€{{ grandSubtotal().toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-white/60">
                  <span class="font-medium">VAT (18%)</span>
                  <span class="font-bold">€{{ grandTax().toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-primary-400">
                  <span class="font-medium">Tip</span>
                  <span class="font-bold">€{{ grandTip().toFixed(2) }}</span>
                </div>
                <div class="pt-6 mt-6 border-t border-white/10 flex justify-between items-center">
                  <span class="text-xl font-black text-white">Total</span>
                  <span class="text-4xl font-black text-primary-400"
                    >€{{ grandTotal().toFixed(2) }}</span
                  >
                </div>
              </div>
            </div>

            <div class="p-8 bg-white/5 space-y-4">
              @if (error()) {
                <div
                  class="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold mb-4"
                >
                  {{ error() }}
                </div>
              }

              <button
                (click)="confirmPayment()"
                class="neo-button w-full h-20 text-xl flex items-center justify-center gap-4"
              >
                <span>Complete Cash Payment</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </button>

              <button
                (click)="goBack()"
                class="w-full h-14 rounded-2xl bg-white/5 text-white font-black hover:bg-white/10 transition-all border border-white/10"
              >
                Go Back
              </button>
            </div>
          </div>
        }

        @if (processing()) {
          <div
            class="fixed inset-0 bg-surface-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-50"
          >
            <div class="text-center animate-scale-in">
              <div class="w-24 h-24 mx-auto mb-8 relative">
                <div class="absolute inset-0 border-8 border-white/10 rounded-full"></div>
                <div
                  class="absolute inset-0 border-8 border-primary-500 rounded-full border-t-transparent animate-spin"
                ></div>
              </div>
              <h2 class="text-4xl font-black text-white mb-4">Processing...</h2>
              <p class="text-white/60 font-medium">Almost there, finalizing your order.</p>
            </div>
          </div>
        }

        @if (completed()) {
          <div class="text-center py-12 animate-scale-in">
            <div
              class="w-32 h-32 mx-auto bg-green-100 text-green-600 rounded-[40px] flex items-center justify-center text-6xl mb-10 shadow-2xl shadow-green-100"
            >
              ✓
            </div>
            <h2 class="text-5xl font-black text-surface-900 mb-4 tracking-tight">Well Done!</h2>
            <p class="text-surface-500 mb-12 font-medium">
              Your order has been completed successfully.
            </p>

            <div class="glass-card p-10 mb-12 relative overflow-hidden">
              <div
                class="absolute top-0 right-0 w-32 h-32 primary-gradient opacity-10 rounded-bl-full"
              ></div>
              <div class="relative z-10">
                <div class="text-xs font-black text-surface-400 uppercase tracking-[0.3em] mb-4">
                  Order Reference
                </div>
                <div class="text-6xl font-black text-primary-600 tracking-tight">
                  {{ orderNumber() }}
                </div>
              </div>
            </div>

            <button
              (click)="printReceipt()"
              [disabled]="printing()"
              class="w-full h-16 rounded-2xl bg-white border-2 border-surface-100 font-black text-surface-900 hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Print Receipt</span>
            </button>

            <button (click)="startNewOrder()" class="neo-button w-full h-16 mt-8 text-lg">
              Start Next Order
            </button>
          </div>
        }
      </main>
    </div>
  `,
})
export class PaymentComponent implements OnInit {
  private typeId?: number;
  private tableId?: number;

  processing = signal(false);
  completed = signal(false);
  printing = signal(false);
  error = signal<string | null>(null);
  orderNumber = signal<string>('');
  createdOrderId = signal<number | null>(null);
  existingOrder = signal<any | null>(null);
  summary = computed(() => this.cartService.getSummary());

  grandSubtotal = computed(() => (this.existingOrder()?.subtotal || 0) + this.summary().subtotal);
  grandTax = computed(() => (this.existingOrder()?.tax || 0) + this.summary().tax);
  grandTip = computed(() => (this.existingOrder()?.tip || 0) + this.summary().tip);
  grandTotal = computed(() => (this.existingOrder()?.total || 0) + this.summary().total);

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

      const type = this.typeId ? await this.enumMappingService.getEnumFromId(this.typeId) : null;

      if (type?.code === OrderTypeEnum.DINE_IN && this.tableId) {
        const order = await this.orderService.getOpenOrderByTable(this.tableId);
        this.existingOrder.set(order);
      }

      if (this.cartService.isEmpty() && !this.existingOrder()) {
        this.router.navigate(['/pos']);
      }
    });
  }

  async confirmPayment(): Promise<void> {
    if (!this.typeId) {
      this.error.set('Order type not selected');
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

      if (type.code === OrderTypeEnum.DINE_IN && this.tableId) {
        const existingOrder = await this.orderService.getOpenOrderByTable(this.tableId);

        if (existingOrder) {
          // Add remaining items in cart to the order if any
          if (cartItems.length > 0) {
            await this.orderService.addItemsToOrder(existingOrder.id, cartItems);
          }
          // Mark as COMPLETED
          order = await this.orderService.updateOrderStatus(existingOrder.id, completedStatusId);
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
          tip: this.grandTip(),
          total: this.grandTotal(),
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
      },
    });
  }

  startNewOrder(): void {
    this.router.navigate(['/pos']);
  }
}
