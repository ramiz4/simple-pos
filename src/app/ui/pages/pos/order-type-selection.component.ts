import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { OrderTypeEnum } from '../../../domain/enums';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-order-type-selection',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <app-header title="New Order" [showBackButton]="true"></app-header>
      
      <div class="p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Order Type Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Dine In -->
          <button
            (click)="selectOrderType('DINE_IN')"
            class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-purple-200 hover:border-purple-400"
          >
            <div class="text-center">
              <div class="text-6xl mb-4">🍽️</div>
              <h3 class="text-2xl font-bold text-gray-800 mb-2">Dine In</h3>
              <p class="text-gray-600 text-sm">In-house service</p>
            </div>
            <div class="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <!-- Takeaway -->
          <button
            (click)="selectOrderType('TAKEAWAY')"
            class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-blue-200 hover:border-blue-400"
          >
            <div class="text-center">
              <div class="text-6xl mb-4">🥡</div>
              <h3 class="text-2xl font-bold text-gray-800 mb-2">Takeaway</h3>
              <p class="text-gray-600 text-sm">Pickup orders</p>
            </div>
            <div class="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <!-- Delivery -->
          <button
            (click)="selectOrderType('DELIVERY')"
            class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-indigo-200 hover:border-indigo-400"
          >
            <div class="text-center">
              <div class="text-6xl mb-4">🚗</div>
              <h3 class="text-2xl font-bold text-gray-800 mb-2">Delivery</h3>
              <p class="text-gray-600 text-sm">Home delivery</p>
            </div>
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
      </div>
    </div>
  `
})
export class OrderTypeSelectionComponent {
  constructor(
    private router: Router,
    private enumMappingService: EnumMappingService
  ) {}

  async selectOrderType(type: string): Promise<void> {
    const typeId = await this.enumMappingService.getCodeTableId('ORDER_TYPE', type);
    
    if (type === OrderTypeEnum.DINE_IN) {
      this.router.navigate(['/pos/table-selection'], { 
        queryParams: { typeId } 
      });
    } else {
      this.router.navigate(['/pos/product-selection'], { 
        queryParams: { typeId, tableId: null } 
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
