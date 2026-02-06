import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../application/services/cart.service';
import { ProductService } from '../../../application/services/product.service';
import { VariantService } from '../../../application/services/variant.service';
import { OrderItem } from '../../../domain/entities/order-item.interface';

interface EnrichedOrderItem extends OrderItem {
  productName: string;
  variantName: string | null;
}

import { AuthService } from '../../../application/services/auth.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { OrderService } from '../../../application/services/order.service';
import { PrinterService } from '../../../application/services/printer.service';
import { TableService } from '../../../application/services/table.service';
import { OrderStatusEnum, OrderTypeEnum } from '../../../domain/enums';
import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <main class="p-6 max-w-6xl mx-auto animate-fade-in pb-32">
      <!-- Empty Cart State -->
      @if (isEmpty()) {
        <div class="glass-card p-12 text-center animate-scale-in">
          <div
            class="w-24 h-24 mx-auto bg-surface-100 rounded-3xl flex items-center justify-center text-6xl mb-6"
          >
            🛒
          </div>
          <h2 class="text-3xl font-black text-surface-900 mb-2">Your cart is empty</h2>
          <p class="text-surface-500 font-medium mb-8">Add some delicious items to get started!</p>
          <app-button
            (click)="backToProducts()"
            label="Browse Products"
            class="px-10 h-14"
          ></app-button>
        </div>
      }

      <!-- Cart Items -->
      @if (!isEmpty()) {
        <div class="flex flex-col lg:flex-row gap-8 items-start">
          <!-- Items List -->
          <div class="flex-1 w-full space-y-8">
            @if (existingItems().length > 0) {
              <div class="space-y-4">
                <h2
                  class="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2"
                >
                  <span>Already Placed</span>
                  <span class="h-px grow bg-orange-100"></span>
                </h2>

                @for (item of enrichedExistingItems(); track item.id) {
                  <div class="glass-card p-4 bg-orange-50/20 border-orange-100 opacity-80">
                    <div class="flex justify-between items-start">
                      <div class="flex gap-3">
                        <div
                          class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600"
                        >
                          {{ item.quantity }}
                        </div>
                        <div>
                          <h3 class="font-bold text-surface-900 leading-tight">
                            {{ item.productName }}
                          </h3>
                          @if (item.variantName) {
                            <span
                              class="text-[10px] font-bold text-surface-400 uppercase tracking-wider"
                              >{{ item.variantName }}</span
                            >
                          }
                        </div>
                      </div>
                      <span class="font-bold text-surface-400"
                        >€{{ (item.unitPrice * item.quantity).toFixed(2) }}</span
                      >
                    </div>
                  </div>
                }
              </div>
            }

            @if (cartItems().length > 0) {
              <div class="space-y-4">
                <h2
                  class="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] flex items-center gap-2"
                >
                  <span>New Items (Staging)</span>
                  <span class="h-px grow bg-primary-100"></span>
                </h2>

                @for (item of cartItems(); track $index) {
                  <div
                    class="glass-card p-5 group hover:ring-2 hover:ring-primary-100 transition-all duration-300"
                  >
                    <div class="flex gap-4">
                      <div
                        class="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform"
                      >
                        🍽️
                      </div>

                      <div class="grow min-w-0">
                        <div class="flex justify-between items-start mb-1">
                          <h3 class="font-black text-surface-900 leading-tight">
                            {{ item.productName }}
                          </h3>
                          <span class="font-black text-primary-600 ml-4"
                            >€{{ item.lineTotal.toFixed(2) }}</span
                          >
                        </div>

                        <div class="flex flex-wrap gap-2 mb-3">
                          @if (item.variantName) {
                            <span
                              class="text-[10px] font-black uppercase tracking-wider bg-primary-100 text-primary-700 px-2 py-0.5 rounded-md"
                            >
                              {{ item.variantName }}
                            </span>
                          }
                          @for (extraName of item.extraNames; track $index) {
                            <span
                              class="text-[10px] font-black uppercase tracking-wider bg-surface-100 text-surface-500 px-2 py-0.5 rounded-md"
                            >
                              + {{ extraName }}
                            </span>
                          }
                        </div>

                        @if (item.notes) {
                          <p class="text-xs text-surface-400 italic mb-4 flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                            {{ item.notes }}
                          </p>
                        }

                        @if (success()) {
                          <div
                            class="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 animate-scale-in"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span class="font-bold">{{ success() }}</span>
                          </div>
                        }

                        <div class="flex items-center justify-between mt-auto">
                          <div
                            class="flex items-center gap-4 bg-surface-50 p-1.5 rounded-xl border border-surface-100"
                          >
                            <button
                              (click)="decrementQuantity($index)"
                              class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-primary-600 active:scale-90 transition-transform"
                            >
                              −
                            </button>
                            <span class="font-black text-surface-900 min-w-6 text-center">{{
                              item.quantity
                            }}</span>
                            <button
                              (click)="incrementQuantity($index)"
                              class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-primary-600 active:scale-90 transition-transform"
                            >
                              +
                            </button>
                          </div>

                          <button
                            (click)="removeItem($index)"
                            class="p-2 text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Side Summary -->
          <div class="w-full lg:w-80 shrink-0 sticky top-24 space-y-4">
            <div class="glass-card p-6 bg-surface-900! border-none shadow-primary-200">
              <h2 class="text-xs font-black text-surface-400 uppercase tracking-widest mb-6">
                Order Total
              </h2>

              <div class="space-y-4 mb-8">
                @if (existingOrder()) {
                  <div class="flex justify-between items-center text-xs text-surface-400 mb-2">
                    <span>Existing Items Total</span>
                    <span>€{{ existingOrder()?.subtotal?.toFixed(2) }}</span>
                  </div>
                }
                <div class="flex justify-between items-center">
                  <span class="text-surface-400 text-sm font-medium">New Subtotal</span>
                  <span class="text-white font-bold">€{{ summary().subtotal.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center pb-4 border-b border-white/10">
                  <span class="text-surface-400 text-sm font-medium"
                    >VAT ({{ (summary().taxRate * 100).toFixed(0) }}%)</span
                  >
                  <span class="text-white font-bold">€{{ summary().tax.toFixed(2) }}</span>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-surface-400 text-sm font-medium">Tip (Optional)</span>
                    <span class="text-primary-400 font-bold">€{{ tipAmount().toFixed(2) }}</span>
                  </div>
                  <div class="flex gap-2">
                    @for (preset of tipPresets; track preset) {
                      <button
                        (click)="setTipPreset(preset)"
                        [class]="
                          tipInput === preset
                            ? 'primary-gradient border-none'
                            : 'bg-white/5 border border-white/10 text-white'
                        "
                        class="flex-1 py-2 rounded-xl text-xs font-black transition-all hover:bg-white/10"
                      >
                        €{{ preset }}
                      </button>
                    }
                    <button
                      (click)="tipInput = 0; onTipChange()"
                      class="px-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center mb-8">
                <span class="text-white font-black text-xl">Grand Total</span>
                <div class="text-right">
                  <span class="text-primary-400 font-black text-3xl"
                    >€{{ ((existingOrder()?.total || 0) + summary().total).toFixed(2) }}</span
                  >
                </div>
              </div>

              <div class="space-y-3">
                <!-- Customer Name Input for Non-Dine-In -->
                @if (isNameRequired() && cartItems().length > 0 && !existingOrder()) {
                  <div class="mb-4 animate-fade-in">
                    <label
                      class="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2"
                    >
                      Customer Name / Address / Reference
                    </label>
                    <input
                      type="text"
                      [ngModel]="customerName()"
                      (ngModelChange)="customerName.set($event)"
                      placeholder="E.g. John Doe / 123 Main St / Order #123"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary-400 transition-colors"
                    />
                    @if (!customerName() && error() === 'Customer Name is required') {
                      <p class="text-xs text-red-400 mt-1 font-bold">Required field</p>
                    }
                  </div>
                }

                @if (cartItems().length > 0) {
                  @if (error()) {
                    <div
                      class="p-4 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs font-bold animate-fade-in text-center mb-2"
                    >
                      {{ error() }}
                    </div>
                  }
                  <app-button
                    (click)="placeOrder()"
                    [isLoading]="isSending()"
                    label="Place Order"
                    [hasRightIcon]="!isSending()"
                    class="w-full h-16"
                  >
                    <svg
                      rightIcon
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </app-button>
                }

                <div class="space-y-2">
                  <app-button
                    (click)="proceedToPayment()"
                    [isDisabled]="isDineIn() && cartItems().length > 0"
                    label="Pay Now"
                    class="w-full h-16 text-lg"
                  ></app-button>
                  @if (isDineIn() && cartItems().length > 0) {
                    <p class="text-[10px] text-primary-400 font-bold text-center animate-pulse">
                      ⚠️ Place order first to enable payment
                    </p>
                  }
                </div>
                <button
                  (click)="backToProducts()"
                  class="w-full h-14 rounded-2xl bg-white/5 text-white font-black hover:bg-white/10 transition-all border border-white/10"
                >
                  Add More
                </button>
                <button
                  (click)="confirmClearCart()"
                  class="w-full py-4 text-red-400 text-sm font-black hover:text-red-300 transition-colors"
                >
                  Clear All Items
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </main>

    <!-- Clear Cart Confirmation Modal -->
    @if (showClearConfirmation()) {
      <div
        class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        (click)="cancelClearCart()"
      >
        <div
          class="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-8 animate-scale-in"
          (click)="$event.stopPropagation()"
        >
          <div class="text-center">
            <div
              class="w-20 h-20 mx-auto bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-4xl mb-6"
            >
              ⚠️
            </div>
            <h2 class="text-2xl font-black text-surface-900 mb-2">Clear Cart?</h2>
            <p class="text-surface-500 font-medium mb-8">
              Are you sure you want to remove all items? This cannot be undone.
            </p>

            <div class="grid grid-cols-2 gap-3">
              <button
                (click)="cancelClearCart()"
                class="h-14 rounded-2xl font-black bg-surface-50 text-surface-500 hover:bg-surface-100 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="clearCart()"
                class="h-14 rounded-2xl font-black bg-red-500 text-white hover:bg-red-600 transition-all shadow-md"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class CartViewComponent implements OnInit {
  // Query params
  private typeId?: number;
  private tableId?: number;
  private orderId?: number;

  // Tip state
  tipInput = 0;
  tipPresets = [1, 2, 5];

  // State
  isSending = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showClearConfirmation = signal<boolean>(false);
  existingOrder = signal<any | null>(null);
  existingItems = signal<EnrichedOrderItem[]>([]);
  enrichedExistingItems = computed(() => this.existingItems());

  // Computed signals
  cartItems = computed(() => this.cartService.cart());
  summary = computed(() => this.cartService.getSummary());
  tipAmount = computed(() => this.cartService.tip());
  isDineIn = signal<boolean>(false);

  // Takeaway/Delivery customer name
  customerName = signal<string>('');
  isNameRequired = computed(() => !this.isDineIn());

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
    private orderService: OrderService,
    private productService: ProductService,
    private variantService: VariantService,
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

      if (this.tableId || this.orderId) {
        await this.loadOrderData();
      }
    });

    // Initialize tip input from service
    this.tipInput = this.tipAmount();
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

  onTipChange(): void {
    const tip = Math.max(0, this.tipInput || 0);
    this.cartService.setTip(tip);
  }

  setTipPreset(amount: number): void {
    this.tipInput = amount;
    this.cartService.setTip(amount);
  }

  confirmClearCart(): void {
    this.showClearConfirmation.set(true);
  }

  cancelClearCart(): void {
    this.showClearConfirmation.set(false);
  }

  async clearCart(): Promise<void> {
    this.cartService.clear();
    this.tipInput = 0;
    this.showClearConfirmation.set(false);
  }

  async placeOrder(): Promise<void> {
    if (!this.typeId) {
      this.error.set('Order information missing');
      return;
    }

    // Validate this is a DINE_IN order
    // const orderType = await this.enumMappingService.getEnumFromId(this.typeId);
    // if (orderType.code !== OrderTypeEnum.DINE_IN) {
    //   this.error.set('Place Order is only available for dine-in orders');
    //   return;
    // }

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
      let openOrder: any = null;
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
          tip: summary.tip,
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

    let order;
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
          return {
            ...item,
            productName: product?.name || 'Unknown Product',
            variantName: variant?.name || null,
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
