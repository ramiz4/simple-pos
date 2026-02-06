import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ErrorLogEntry, LoggerService } from '../../../../core/services/logger.service';
import { AdminPageLayoutComponent } from '../../../components/admin/shared/page-layout/page-layout.component';
import { AdminSearchInputComponent } from '../../../components/admin/shared/search-input/search-input.component';
import { ButtonComponent } from '../../../components/shared/button/button.component';

@Component({
  selector: 'app-error-log',
  standalone: true,
  imports: [CommonModule, AdminPageLayoutComponent, AdminSearchInputComponent, ButtonComponent],
  templateUrl: './error-log.component.html',
})
export class ErrorLogComponent {
  logs = signal<ErrorLogEntry[]>([]);
  filteredLogs = signal<ErrorLogEntry[]>([]);
  stats = signal<{ total: number; byLevel: Record<string, number>; last24Hours: number }>({
    total: 0,
    byLevel: { info: 0, warn: 0, error: 0 },
    last24Hours: 0,
  });

  private currentFilter = '';
  private currentSearch = '';

  constructor(private loggerService: LoggerService) {
    this.refreshLogs();
  }

  refreshLogs(): void {
    const logs = this.loggerService.getErrorLogs();
    this.logs.set(logs);
    this.stats.set(this.loggerService.getErrorStats());
    this.applyFilters();
  }

  filterByLevel(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentFilter = select.value;
    this.applyFilters();
  }

  searchLogs(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onSearch(input.value);
  }

  onSearch(value: string): void {
    this.currentSearch = value.toLowerCase();
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.logs();

    if (this.currentFilter) {
      filtered = filtered.filter((log) => log.level === this.currentFilter);
    }

    if (this.currentSearch) {
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(this.currentSearch) ||
          JSON.stringify(log.context).toLowerCase().includes(this.currentSearch),
      );
    }

    this.filteredLogs.set(filtered);
  }

  exportLogs(): void {
    const json = this.loggerService.exportErrorLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  clearLogs(): void {
    if (confirm('Are you sure you want to clear all error logs? This cannot be undone.')) {
      this.loggerService.clearErrorLogs();
      this.refreshLogs();
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  formatContext(context: Record<string, any>): string {
    return JSON.stringify(context, null, 2);
  }
}
