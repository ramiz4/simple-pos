import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../../application/services/cart.service';
import { OrderService } from '../../../application/services/order.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { PrinterService } from '../../../application/services/printer.service';
import { AuthService } from '../../../application/services/auth.service';
import { OrderStatusEnum } from '../../../domain/enums';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      @if (!processing() && !completed()) {
        <app-header title="Confirm Payment" [showBackButton]="true" backRoute="/pos/cart"></app-header>
      }
      
      <div class="p-4 flex items-center justify-center">
      <div class="max-w-2xl w-full">
        @if (!processing() && !completed()) {
          <!-- Payment Confirmation -->
          <div class="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">

            <!-- Order Summary -->
            <div class="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
              <div class="space-y-3 text-white">
                <div class="flex justify-between items-center text-lg">
                  <span>Subtotal</span>
                  <span class="font-semibold">€{{ summary().subtotal.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-lg">
                  <span>Incl. VAT (18%)</span>
                  <span class="font-semibold">€{{ summary().tax.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-lg">
                  <span>Tip</span>
                  <span class="font-semibold">€{{ summary().tip.toFixed(2) }}</span>
                </div>
                <div class="border-t border-white/20 my-3"></div>
                <div class="flex justify-between items-center text-2xl">
                  <span class="font-bold">Total</span>
                  <span class="font-bold">€{{ summary().total.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            @if (error()) {
              <div class="backdrop-blur-md bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                <p class="text-white font-semibold">{{ error() }}</p>
              </div>
            }

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                (click)="confirmPayment()"
                class="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                ✓ Confirm Cash Payment
              </button>
              <button
                (click)="goBack()"
                class="w-full py-3 rounded-xl font-semibold backdrop-blur-md bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all"
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        }

        @if (processing()) {
          <!-- Processing State -->
          <div class="backdrop-blur-md bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
            <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-6"></div>
            <h2 class="text-2xl font-bold text-white mb-2">Processing Payment...</h2>
            <p class="text-white/80">Please wait</p>
          </div>
        }

        @if (completed()) {
          <!-- Success State -->
          <div class="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
            <div class="text-6xl mb-4">✅</div>
            <h2 class="text-3xl font-bold text-white mb-4">Order Completed!</h2>
            <div class="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
              <p class="text-white/80 mb-2">Order Number</p>
              <p class="text-4xl font-bold text-white">{{ orderNumber() }}</p>
            </div>
            
            <div class="space-y-3 mb-6">
              <button
                (click)="printReceipt()"
                [disabled]="printing()"
                class="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {{ printing() ? '🖨️ Printing...' : '🖨️ Print Receipt' }}
              </button>
              <button
                (click)="printKitchenTicket()"
                [disabled]="printing()"
                class="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {{ printing() ? '🖨️ Printing...' : '🍽️ Print Kitchen Ticket' }}
              </button>
            </div>

            <button
              (click)="startNewOrder()"
              class="w-full py-3 rounded-xl font-semibold backdrop-blur-md bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all"
            >
              Start New Order
            </button>
          </div>
        }
      </div>
      </div>
    </div>
  `
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
  summary: () => { subtotal: number; tax: number; tip: number; total: number };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private orderService: OrderService,
    private enumMappingService: EnumMappingService,
    private printerService: PrinterService,
    private authService: AuthService
  ) {
    this.summary = this.cartService.getSummary;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
      this.tableId = params['tableId'] ? +params['tableId'] : undefined;
    });

    if (this.cartService.isEmpty()) {
      this.router.navigate(['/pos/order-type']);
    }
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

      const statusId = await this.enumMappingService.getCodeTableId('ORDER_STATUS', OrderStatusEnum.PAID);
      const summary = this.cartService.getSummary();

      const order = await this.orderService.createOrder({
        typeId: this.typeId,
        statusId,
        tableId: this.tableId || null,
        subtotal: summary.subtotal,
        tax: summary.tax,
        tip: summary.tip,
        total: summary.total,
        userId: session.user.id,
        items: this.cartService.cart()
      });

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
        tableId: this.tableId
      }
    });
  }

  startNewOrder(): void {
    this.router.navigate(['/pos/order-type']);
  }
}
