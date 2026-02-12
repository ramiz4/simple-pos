import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderTypeEnum } from '@simple-pos/shared/types';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';

import { CartService } from '../../../application/services/cart.service';

@Component({
  selector: 'app-order-type-selection',
  standalone: true,
  imports: [],
  template: `
    <main class="p-6 max-w-4xl mx-auto animate-fade-in">
      <div class="mb-12 text-center">
        <h2 class="text-3xl font-black text-surface-900 mb-2">How can we help?</h2>
        <p class="text-surface-500 font-medium">Select your preferred service type below.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Dine In -->
        <button
          (click)="selectOrderType(OrderType.DINE_IN)"
          class="glass-card group p-8 hover:ring-4 hover:ring-primary-100 transition-all duration-300 relative overflow-hidden"
        >
          <div class="relative z-10">
            <div
              class="w-20 h-20 mx-auto bg-primary-100 rounded-2xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform duration-500"
            >
              🍽️
            </div>
            <h3 class="text-2xl font-black text-surface-900 mb-2">Dine In</h3>
            <p class="text-surface-500 font-medium leading-relaxed">
              Relax and enjoy our in-house service.
            </p>
          </div>
          <div
            class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"
          >
            <div class="text-9xl">🍽️</div>
          </div>
        </button>

        <!-- Takeaway -->
        <button
          (click)="selectOrderType(OrderType.TAKEAWAY)"
          class="glass-card group p-8 hover:ring-4 hover:ring-primary-100 transition-all duration-300 relative overflow-hidden"
        >
          <div class="relative z-10">
            <div
              class="w-20 h-20 mx-auto bg-orange-100 rounded-2xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform duration-500"
            >
              🥡
            </div>
            <h3 class="text-2xl font-black text-surface-900 mb-2">Takeaway</h3>
            <p class="text-surface-500 font-medium leading-relaxed">
              Quick pickup for your convenience.
            </p>
          </div>
          <div
            class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"
          >
            <div class="text-9xl">🥡</div>
          </div>
        </button>

        <!-- Delivery -->
        <button
          (click)="selectOrderType(OrderType.DELIVERY)"
          class="glass-card group p-8 hover:ring-4 hover:ring-primary-100 transition-all duration-300 relative overflow-hidden"
        >
          <div class="relative z-10">
            <div
              class="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform duration-500"
            >
              🚗
            </div>
            <h3 class="text-2xl font-black text-surface-900 mb-2">Delivery</h3>
            <p class="text-surface-500 font-medium leading-relaxed">
              We'll bring the food to your door.
            </p>
          </div>
          <div
            class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"
          >
            <div class="text-9xl">🚗</div>
          </div>
        </button>
      </div>
    </main>
  `,
})
export class OrderTypeSelectionComponent {
  readonly OrderType = OrderTypeEnum;

  constructor(
    private router: Router,
    private enumMappingService: EnumMappingService,
    private cartService: CartService,
  ) {}

  async selectOrderType(type: OrderTypeEnum): Promise<void> {
    const typeId = await this.enumMappingService.getCodeTableId('ORDER_TYPE', type);

    if (type === OrderTypeEnum.DINE_IN) {
      this.router.navigate(['/pos/table-selection'], {
        queryParams: { typeId },
      });
    } else {
      this.cartService.setContext(type);
      this.router.navigate(['/pos/product-selection'], {
        queryParams: { typeId, tableId: null },
      });
    }
  }
}
