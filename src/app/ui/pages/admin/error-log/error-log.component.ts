import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ErrorLogEntry, LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-error-log',
  imports: [CommonModule],
  template: `
    <div class="error-log-container">
      <div class="header">
        <h1>Error Logs</h1>
        <div class="actions">
          <button (click)="refreshLogs()" class="btn-secondary"><span>🔄</span> Refresh</button>
          <button (click)="exportLogs()" class="btn-secondary"><span>📥</span> Export</button>
          <button (click)="clearLogs()" class="btn-danger"><span>🗑️</span> Clear All</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total Logs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().byLevel['error'] }}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().byLevel['warn'] }}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().last24Hours }}</div>
          <div class="stat-label">Last 24 Hours</div>
        </div>
      </div>

      <div class="filters">
        <select (change)="filterByLevel($event)" class="filter-select">
          <option value="">All Levels</option>
          <option value="error">Errors Only</option>
          <option value="warn">Warnings Only</option>
          <option value="info">Info Only</option>
        </select>
        <input
          type="text"
          placeholder="Search logs..."
          (input)="searchLogs($event)"
          class="search-input"
        />
      </div>

      <div class="logs-list">
        @if (filteredLogs().length === 0) {
          <div class="empty-state">
            <p>No error logs found</p>
          </div>
        } @else {
          @for (log of filteredLogs(); track log.id) {
            <div class="log-entry" [class]="'log-' + log.level">
              <div class="log-header">
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
                <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
                @if (log.count && log.count > 1) {
                  <span class="log-count">×{{ log.count }}</span>
                }
              </div>
              <div class="log-message">{{ log.message }}</div>
              @if (log.context) {
                <details class="log-details">
                  <summary>Context</summary>
                  <pre>{{ formatContext(log.context) }}</pre>
                </details>
              }
              @if (log.stack) {
                <details class="log-details">
                  <summary>Stack Trace</summary>
                  <pre>{{ log.stack }}</pre>
                </details>
              }
              <div class="log-meta">
                <span>{{ log.url }}</span>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .error-log-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .actions {
        display: flex;
        gap: 0.75rem;
      }

      .btn-secondary,
      .btn-danger {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn-secondary {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
      }

      .btn-secondary:hover {
        background: var(--color-bg-tertiary);
      }

      .btn-danger {
        background: #ef4444;
        color: white;
      }

      .btn-danger:hover {
        background: #dc2626;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: var(--color-bg-secondary);
        padding: 1.5rem;
        border-radius: 0.75rem;
        text-align: center;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-primary);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin-top: 0.5rem;
      }

      .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .filter-select,
      .search-input {
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid var(--color-border);
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        font-size: 0.875rem;
      }

      .filter-select {
        min-width: 150px;
      }

      .search-input {
        flex: 1;
      }

      .logs-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--color-text-secondary);
      }

      .log-entry {
        background: var(--color-bg-secondary);
        border-radius: 0.75rem;
        padding: 1.25rem;
        border-left: 4px solid;
      }

      .log-error {
        border-left-color: #ef4444;
      }

      .log-warn {
        border-left-color: #f59e0b;
      }

      .log-info {
        border-left-color: #3b82f6;
      }

      .log-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .log-level {
        font-weight: 700;
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        background: var(--color-bg-tertiary);
      }

      .log-timestamp {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .log-count {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        background: var(--color-primary);
        color: white;
        font-weight: 600;
      }

      .log-message {
        font-size: 1rem;
        color: var(--color-text-primary);
        margin-bottom: 0.75rem;
        font-family: 'Courier New', monospace;
      }

      .log-details {
        margin-top: 0.75rem;
      }

      .log-details summary {
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--color-primary);
        font-weight: 500;
        user-select: none;
      }

      .log-details pre {
        margin-top: 0.5rem;
        padding: 1rem;
        background: var(--color-bg-tertiary);
        border-radius: 0.5rem;
        overflow-x: auto;
        font-size: 0.75rem;
        line-height: 1.5;
      }

      .log-meta {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--color-border);
      }
    `,
  ],
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
    this.currentSearch = input.value.toLowerCase();
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
