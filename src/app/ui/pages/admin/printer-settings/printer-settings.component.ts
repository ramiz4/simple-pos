import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrinterService, PrinterConfig } from '../../../../application/services/printer.service';
import { HeaderComponent } from '../../../components/header/header.component';

@Component({
  selector: 'app-printer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-[#F8FAFC]">
      <app-header title="Printer Settings" [showBackButton]="true"></app-header>

      <main class="p-6 max-w-4xl mx-auto animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Receipt Printer -->
          <div class="glass-card p-8 group">
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-xl shadow-inner"
              >
                🖨️
              </div>
              <div>
                <h2 class="text-xl font-black text-surface-900">Receipt Printer</h2>
                <p class="text-xs font-bold text-surface-400 uppercase tracking-widest">
                  Customer Facing
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1">Connection String</label>
                <input
                  [(ngModel)]="receiptConn"
                  placeholder="tcp:192.168.1.100:9100"
                  class="w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-surface-100 focus:border-primary-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1">Paper Width (Chars)</label>
                <input
                  type="number"
                  [(ngModel)]="receiptWidth"
                  class="w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-surface-100 focus:border-primary-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>

              <button
                (click)="testReceipt()"
                class="w-full h-14 rounded-2xl border-2 border-primary-100 text-primary-600 font-black hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
              >
                <span>Send Test Receipt</span>
                <span class="text-lg">⚡</span>
              </button>
            </div>
          </div>

          <!-- Kitchen Printer -->
          <div class="glass-card p-8 group">
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-inner"
              >
                🍳
              </div>
              <div>
                <h2 class="text-xl font-black text-surface-900">Kitchen Printer</h2>
                <p class="text-xs font-bold text-surface-400 uppercase tracking-widest">
                  Staff Facing
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1">Connection String</label>
                <input
                  [(ngModel)]="kitchenConn"
                  placeholder="tcp:192.168.1.101:9100"
                  class="w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-surface-100 focus:border-orange-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1">Paper Width (Chars)</label>
                <input
                  type="number"
                  [(ngModel)]="kitchenWidth"
                  class="w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-surface-100 focus:border-orange-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>

              <button
                (click)="testKitchen()"
                class="w-full h-14 rounded-2xl border-2 border-orange-100 text-orange-600 font-black hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
              >
                <span>Send Test Ticket</span>
                <span class="text-lg">🔥</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="mt-12 flex justify-center">
          <button (click)="saveSettings()" class="neo-button px-16 h-16 text-lg">
            Save Configuration
          </button>
        </div>

        <!-- Status Message -->
        @if (status()) {
          <div
            class="mt-8 p-4 rounded-2xl text-center font-black animate-scale-in"
            [ngClass]="
              status()?.includes('Success')
                ? 'bg-green-100 text-green-600'
                : 'bg-red-100 text-red-600'
            "
          >
            {{ status() }}
          </div>
        }
      </main>
    </div>
  `,
  styles: [
    `
      .glass-card {
        @apply bg-white border-2 border-surface-50 shadow-xl shadow-surface-200/50 rounded-[2.5rem] transition-all duration-500;
      }
      .glass-card:hover {
        @apply border-primary-200 shadow-2xl shadow-primary-100/20 translate-y-[-4px];
      }
    `,
  ],
})
export class PrinterSettingsComponent implements OnInit {
  receiptConn = 'tcp:127.0.0.1:9100';
  receiptWidth = 32;
  kitchenConn = 'tcp:127.0.0.1:9100';
  kitchenWidth = 32;

  status = signal<string | null>(null);

  constructor(private printerService: PrinterService) {}

  ngOnInit(): void {
    // Load current config from service
    // In a real app, this would come from a database or local storage
    const current = (this.printerService as any).config;
    if (current) {
      this.receiptConn = current.receipt.connection;
      this.receiptWidth = current.receipt.width;
      this.kitchenConn = current.kitchen.connection;
      this.kitchenWidth = current.kitchen.width;
    }
  }

  async saveSettings(): Promise<void> {
    this.printerService.updateConfig({
      receipt: { connection: this.receiptConn, width: this.receiptWidth },
      kitchen: { connection: this.kitchenConn, width: this.kitchenWidth },
    });

    // In a real app, we would persist this to DB
    this.showStatus('Settings Saved Successfully! ✅');
  }

  async testReceipt(): Promise<void> {
    try {
      this.showStatus('Sending test receipt...');
      // We'll use a dummy order ID or just send a manual ESC/POS command
      // For simplicity, let's just use the printerService.printReceipt if we have an order
      // but here we can just test the raw connection.

      // I'll add a test method to PrinterService
      await (this.printerService as any).testPrinter('receipt');
      this.showStatus('Test Receipt Sent! Check printer. ✅');
    } catch (err) {
      this.showStatus('Error: ' + (err as Error).message);
    }
  }

  async testKitchen(): Promise<void> {
    try {
      this.showStatus('Sending test ticket...');
      await (this.printerService as any).testPrinter('kitchen');
      this.showStatus('Test Ticket Sent! Check printer. ✅');
    } catch (err) {
      this.showStatus('Error: ' + (err as Error).message);
    }
  }

  private showStatus(msg: string): void {
    this.status.set(msg);
    setTimeout(() => this.status.set(null), 5000);
  }
}
