import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../application/services/cart.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <app-header title="Your Cart" [showBackButton]="true"></app-header>
      
      <div class="p-4 pb-32">
      <div class="max-w-4xl mx-auto">
        <!-- Empty Cart State -->
        @if (isEmpty()) {
          <div class="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-12 text-center border-2 border-purple-200">
            <div class="text-6xl mb-4">🛒</div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p class="text-gray-600 mb-6">Add some delicious items to get started!</p>
            <button
              (click)="backToProducts()"
              class="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Browse Products
            </button>
          </div>
        }

        <!-- Cart Items -->
        @if (!isEmpty()) {
          <div class="space-y-4 mb-6">
            @for (item of cartItems(); track $index) {
              <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-4 border-2 border-purple-200 hover:border-purple-300 transition-all duration-200">
                <div class="flex gap-4">
                  <!-- Product Image Placeholder -->
                  <div class="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <span class="text-3xl">🍽️</span>
                  </div>

                  <!-- Product Info -->
                  <div class="flex-1 min-w-0">
                    <!-- Product Name -->
                    <h3 class="text-lg font-bold text-gray-800 mb-1">{{ item.productName }}</h3>
                    
                    <!-- Variant -->
                    @if (item.variantName) {
                      <p class="text-sm text-purple-600 font-medium mb-1">
                        📦 {{ item.variantName }}
                      </p>
                    }

                    <!-- Extras -->
                    @if (item.extraNames.length > 0) {
                      <div class="flex flex-wrap gap-1 mb-2">
                        @for (extraName of item.extraNames; track $index) {
                          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            + {{ extraName }}
                          </span>
                        }
                      </div>
                    }

                    <!-- Notes -->
                    @if (item.notes) {
                      <p class="text-xs text-gray-600 italic mb-2">
                        💬 {{ item.notes }}
                      </p>
                    }

                    <!-- Price Info -->
                    <div class="flex items-center gap-4 mb-2">
                      <span class="text-sm text-gray-600">
                        €{{ item.unitPrice.toFixed(2) }} each
                      </span>
                      <span class="text-lg font-bold text-purple-600">
                        €{{ item.lineTotal.toFixed(2) }}
                      </span>
                    </div>

                    <!-- Quantity Controls -->
                    <div class="flex items-center gap-2">
                      <button
                        (click)="decrementQuantity($index)"
                        class="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600 font-bold text-lg transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span class="text-lg font-semibold text-gray-800 min-w-[2rem] text-center">
                        {{ item.quantity }}
                      </span>
                      <button
                        (click)="incrementQuantity($index)"
                        class="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600 font-bold text-lg transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        (click)="removeItem($index)"
                        class="ml-auto px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-semibold text-sm transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Cart Summary -->
          <div class="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border-2 border-purple-300 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Order Summary</h2>
            
            <!-- Subtotal -->
            <div class="flex justify-between items-center py-2 border-b border-gray-200">
              <span class="text-gray-700">Subtotal</span>
              <span class="text-lg font-semibold text-gray-800">€{{ summary().subtotal.toFixed(2) }}</span>
            </div>

            <!-- Tax -->
            <div class="flex justify-between items-center py-2 border-b border-gray-200">
              <span class="text-gray-700">Tax ({{ (summary().taxRate * 100).toFixed(0) }}%)</span>
              <span class="text-lg font-semibold text-gray-800">€{{ summary().tax.toFixed(2) }}</span>
            </div>

            <!-- Tip Input -->
            <div class="py-2 border-b border-gray-200">
              <div class="flex justify-between items-center mb-2">
                <label for="tip" class="text-gray-700">Tip (Optional)</label>
                <span class="text-lg font-semibold text-gray-800">€{{ tipAmount().toFixed(2) }}</span>
              </div>
              <input
                id="tip"
                type="number"
                [(ngModel)]="tipInput"
                (ngModelChange)="onTipChange()"
                min="0"
                step="0.50"
                placeholder="0.00"
                class="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-center text-lg font-semibold"
              />
              <div class="flex gap-2 mt-2">
                @for (preset of tipPresets; track preset) {
                  <button
                    (click)="setTipPreset(preset)"
                    class="flex-1 px-3 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium text-sm transition-colors"
                  >
                    €{{ preset.toFixed(2) }}
                  </button>
                }
              </div>
            </div>

            <!-- Total -->
            <div class="flex justify-between items-center py-4 mt-2">
              <span class="text-xl font-bold text-gray-800">Total</span>
              <span class="text-3xl font-bold text-purple-600">€{{ summary().total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <!-- Proceed to Payment -->
            <button
              (click)="proceedToPayment()"
              class="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Proceed to Payment →
            </button>

            <!-- Back to Products -->
            <button
              (click)="backToProducts()"
              class="w-full py-4 rounded-xl font-semibold bg-white/80 backdrop-blur-md text-gray-700 hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg border-2 border-purple-200 hover:border-purple-300"
            >
              ← Back to Products
            </button>

            <!-- Clear Cart -->
            <button
              (click)="confirmClearCart()"
              class="w-full py-3 rounded-xl font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-300"
            >
              🗑️ Clear Cart
            </button>
          </div>
        }
      </div>

      <!-- Clear Cart Confirmation Modal -->
      @if (showClearConfirmation()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" (click)="cancelClearCart()">
          <div class="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
            <div class="text-center">
              <div class="text-6xl mb-4">⚠️</div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">Clear Cart?</h2>
              <p class="text-gray-600 mb-6">Are you sure you want to remove all items from your cart? This action cannot be undone.</p>
              
              <div class="flex gap-3">
                <button
                  (click)="cancelClearCart()"
                  class="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  (click)="clearCart()"
                  class="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      </div>
      </div>
    </div>
  `
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
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Get query params
    this.route.queryParams.subscribe(params => {
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

  clearCart(): void {
    this.cartService.clear();
    this.tipInput = 0;
    this.showClearConfirmation.set(false);
  }

  backToProducts(): void {
    this.router.navigate(['/pos/product-selection'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId
      }
    });
  }

  proceedToPayment(): void {
    this.router.navigate(['/pos/payment'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId
      }
    });
  }
}
