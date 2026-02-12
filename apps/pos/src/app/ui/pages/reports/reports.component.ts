import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderTypeEnum } from '@simple-pos/shared/types';
import { BackupService } from '../../../application/services/backup.service';
import {
  DailyRevenueReport,
  ReportingService,
  RevenueByTypeReport,
  ZReport,
} from '../../../application/services/reporting.service';
import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  readonly OrderType = OrderTypeEnum;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  dailyRevenue = signal<DailyRevenueReport | null>(null);
  revenueByType = signal<RevenueByTypeReport[]>([]);
  zReport = signal<ZReport | null>(null);
  lastUpdated = signal<Date | null>(null);

  startDate: string;
  endDate: string;

  activeTab = signal<'daily' | 'breakdown' | 'zreport' | 'backup'>('daily');

  constructor(
    private reportingService: ReportingService,
    private backupService: BackupService,
  ) {
    this.startDate = this.getTodayString();
    this.endDate = this.getTomorrowString();
  }

  async ngOnInit() {
    await this.loadDailyRevenue();
    this.lastUpdated.set(new Date());
  }

  setActiveTab(tab: 'daily' | 'breakdown' | 'zreport' | 'backup') {
    this.activeTab.set(tab);
    this.error.set(null);
    this.success.set(null);
  }

  async loadDailyRevenue() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const report = await this.reportingService.getDailyRevenue();
      this.dailyRevenue.set(report);
      this.lastUpdated.set(new Date());
    } catch (err) {
      this.error.set('Failed to load daily revenue: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async loadRevenueByType() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const report = await this.reportingService.getRevenueByOrderType({
        startDate: this.startDate,
        endDate: this.endDate,
      });
      this.revenueByType.set(report);
      this.lastUpdated.set(new Date());
    } catch (err) {
      this.error.set('Failed to load revenue breakdown: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async loadZReport() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const report = await this.reportingService.generateZReport({
        startDate: this.startDate,
        endDate: this.endDate,
      });
      this.zReport.set(report);
      this.lastUpdated.set(new Date());
    } catch (err) {
      this.error.set('Failed to generate Z-Report: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async exportOrders() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const csv = await this.reportingService.exportOrdersToCSV({
        startDate: this.startDate,
        endDate: this.endDate,
      });
      this.reportingService.downloadCSV(csv, `orders-${this.getTodayString()}.csv`);
      this.success.set('Orders exported successfully');
    } catch (err) {
      this.error.set('Failed to export orders: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async exportRevenueReport() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const csv = await this.reportingService.exportRevenueReportToCSV({
        startDate: this.startDate,
        endDate: this.endDate,
      });
      this.reportingService.downloadCSV(csv, `revenue-report-${this.getTodayString()}.csv`);
      this.success.set('Revenue report exported successfully');
    } catch (err) {
      this.error.set('Failed to export revenue report: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async exportZReport() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const csv = await this.reportingService.exportZReportToCSV({
        startDate: this.startDate,
        endDate: this.endDate,
      });
      this.reportingService.downloadCSV(csv, `z-report-${this.getTodayString()}.csv`);
      this.success.set('Z-Report exported successfully');
    } catch (err) {
      this.error.set('Failed to export Z-Report: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async createBackup() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const backup = await this.backupService.createBackup({ encrypt: false });
      await this.backupService.exportBackupToFile(backup);
      this.success.set('Backup created successfully');
    } catch (err) {
      this.error.set('Failed to create backup: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async restoreBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    try {
      this.loading.set(true);
      this.error.set(null);
      const backup = await this.backupService.importBackupFromFile(file);

      const confirmed = confirm(
        'Are you sure you want to restore this backup? This will add all data from the backup to your current database.',
      );

      if (!confirmed) {
        this.loading.set(false);
        return;
      }

      const result = await this.backupService.restoreBackup(backup);

      if (result.success) {
        this.success.set(`Backup restored successfully. ${result.itemsRestored} items restored.`);
      } else {
        this.error.set(result.message);
      }
    } catch (err) {
      this.error.set('Failed to restore backup: ' + (err as Error).message);
    } finally {
      this.loading.set(false);
      input.value = '';
    }
  }

  private getTodayString(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }

  private getTomorrowString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  formatCurrency(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatDateOnly(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
