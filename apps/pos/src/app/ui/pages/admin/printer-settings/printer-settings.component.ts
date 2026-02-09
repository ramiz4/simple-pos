import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrinterService } from '../../../../application/services/printer.service';
import { AdminSectionComponent } from '../../../components/admin/shared/section/section.component';
import { ButtonComponent } from '../../../components/shared/button/button.component';

@Component({
  selector: 'app-printer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSectionComponent, ButtonComponent],
  templateUrl: './printer-settings.component.html',
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
    const current = this.printerService.getConfig();
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

    this.showStatus('Settings Saved Successfully!');
  }

  async testReceipt(): Promise<void> {
    try {
      this.showStatus('Sending test receipt...');
      await this.printerService.testPrinter('receipt');
      this.showStatus('Test Receipt Sent! Check printer.');
    } catch (err) {
      this.showStatus('Error: ' + (err as Error).message);
    }
  }

  async testKitchen(): Promise<void> {
    try {
      this.showStatus('Sending test ticket...');
      await this.printerService.testPrinter('kitchen');
      this.showStatus('Test Ticket Sent! Check printer.');
    } catch (err) {
      this.showStatus('Error: ' + (err as Error).message);
    }
  }

  private showStatus(msg: string): void {
    this.status.set(msg);
    setTimeout(() => this.status.set(null), 5000);
  }
}
