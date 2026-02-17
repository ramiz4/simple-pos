import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderTypeEnum } from '@simple-pos/shared/types';
import { EnumMappingService } from '../../../../application/services/enum-mapping.service';
import { AdminSectionComponent } from '../../../components/admin/shared/section/section.component';

@Component({
  selector: 'app-order-settings',
  standalone: true,
  imports: [FormsModule, AdminSectionComponent],
  template: `
    <app-admin-section
      sectionTitle="Order Settings"
      description="Configure enabled order types and services."
    >
      <div class="space-y-6">
        <div class="flex items-center justify-between p-4 glass-card">
          <div>
            <h4 class="text-lg font-bold text-surface-900">Enable Delivery</h4>
            <p class="text-sm text-surface-500">
              Allow customers to choose delivery as a service type.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="deliveryEnabled"
              class="sr-only peer"
              (change)="toggleDelivery()"
            />
            <div
              class="w-14 h-7 bg-surface-200 peer-focus:outline-none ring-primary-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500"
            ></div>
          </label>
        </div>

        @if (status()) {
          <div
            class="p-4 rounded-xl bg-primary-50 border border-primary-100 text-primary-900 animate-fade-in"
          >
            {{ status() }}
          </div>
        }
      </div>
    </app-admin-section>
  `,
})
export class OrderSettingsComponent implements OnInit {
  deliveryEnabled = false;
  status = signal<string | null>(null);

  constructor(private enumMappingService: EnumMappingService) {}

  async ngOnInit(): Promise<void> {
    this.deliveryEnabled = await this.enumMappingService.isOrderTypeEnabled(OrderTypeEnum.DELIVERY);
  }

  async toggleDelivery(): Promise<void> {
    try {
      await this.enumMappingService.setOrderTypeEnabled(
        OrderTypeEnum.DELIVERY,
        this.deliveryEnabled,
      );
      this.showStatus(
        `Delivery service ${this.deliveryEnabled ? 'enabled' : 'disabled'} successfully.`,
      );
    } catch (error) {
      console.error('Error toggling delivery:', error);
      this.showStatus('Error updating settings. Please try again.');
    }
  }

  private showStatus(msg: string): void {
    this.status.set(msg);
    setTimeout(() => this.status.set(null), 3000);
  }
}
