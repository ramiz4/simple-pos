import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../application/services/cart.service';
import { HeaderComponent } from '../../components/header/header.component';

import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { TableService } from '../../../application/services/table.service';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-[#F8FAFC]">
      <app-header title="Your Order" [showBackButton]="true" (back)="backToProducts()"></app-header>

      <main class="p-6 max-w-4xl mx-auto animate-fade-in pb-32">
        <!-- Empty Cart State -->
        @if (isEmpty()) {
          <div class="glass-card p-12 text-center animate-scale-in">
            <div
              class="w-24 h-24 mx-auto bg-surface-100 rounded-3xl flex items-center justify-center text-6xl mb-6"
            >
              🛒
            </div>
            <h2 class="text-3xl font-black text-surface-900 mb-2">Your cart is empty</h2>
            <p class="text-surface-500 font-medium mb-8">
              Add some delicious items to get started!
            </p>
            <button (click)="backToProducts()" class="neo-button px-10 h-14">
              Browse Products
            </button>
          </div>
        }

        <!-- Cart Items -->
        @if (!isEmpty()) {
          <div class="flex flex-col lg:flex-row gap-8 items-start">
            <!-- Items List -->
            <div class="flex-1 w-full space-y-4">
              <h2
                class="text-xs font-black text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2"
              >
                <span>Items</span>
                <span class="h-px grow bg-surface-100"></span>
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

            <!-- Side Summary -->
            <div class="w-full lg:w-80 shrink-0 sticky top-24 space-y-4">
              <div class="glass-card p-6 bg-surface-900! border-none shadow-primary-200">
                <h2 class="text-xs font-black text-surface-400 uppercase tracking-widest mb-6">
                  Order Total
                </h2>

                <div class="space-y-4 mb-8">
                  <div class="flex justify-between items-center">
                    <span class="text-surface-400 text-sm font-medium">Subtotal</span>
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
                  <span class="text-white font-black text-xl">Total</span>
                  <div class="text-right">
                    <span class="text-primary-400 font-black text-3xl"
                      >€{{ summary().total.toFixed(2) }}</span
                    >
                  </div>
                </div>

                <div class="space-y-3">
                  <button (click)="proceedToPayment()" class="neo-button w-full h-16 text-lg">
                    Pay Now
                  </button>
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
                  class="h-14 rounded-2xl font-black bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  Yes, Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartViewComponent implements OnInit {
  // Query params
  private typeId?: number;
  private tableId?: number;

  // Tip state
  tipInput = 0;
  tipPresets = [1, 2, 5];

  // UI state
  showClearConfirmation = signal<boolean>(false);

  // Computed signals
  cartItems = computed(() => this.cartService.cart());
  summary = computed(() => this.cartService.getSummary());
  tipAmount = computed(() => this.cartService.tip());

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
  ) {}

  ngOnInit(): void {
    // Get query params
    this.route.queryParams.subscribe((params) => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
      this.tableId = params['tableId'] ? +params['tableId'] : undefined;
    });

    // Initialize tip input from service
    this.tipInput = this.tipAmount();
  }

  isEmpty(): boolean {
    return this.cartService.isEmpty();
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

    if (this.tableId) {
      try {
        const freeStatusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', 'FREE');
        await this.tableService.updateTableStatus(this.tableId, freeStatusId);
      } catch (error) {
        console.error('Error freeing table after clearing cart:', error);
      }
    }
  }

  backToProducts(): void {
    this.router.navigate(['/pos/product-selection'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
      },
    });
  }

  proceedToPayment(): void {
    this.router.navigate(['/pos/payment'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
      },
    });
  }
}
