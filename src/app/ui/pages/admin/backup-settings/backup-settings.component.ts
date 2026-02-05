import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BackupMetadata,
  ScheduledBackupService,
} from '../../../../application/services/scheduled-backup.service';

@Component({
  selector: 'app-backup-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in pb-20">
      <main class="p-6 max-w-4xl mx-auto animate-fade-in pb-20">
        <!-- Health Status -->
        <div class="health-status" [class]="'status-' + health().status">
          <div class="status-icon">
            @if (health().status === 'healthy') {
              <span>✅</span>
            } @else if (health().status === 'warning') {
              <span>⚠️</span>
            } @else {
              <span>❌</span>
            }
          </div>
          <div class="status-info">
            <div class="status-message">{{ health().message }}</div>
            @if (health().lastBackupAge !== undefined) {
              <div class="status-detail">
                Last backup: {{ formatAge(health().lastBackupAge!) }} ago
              </div>
            }
          </div>
        </div>

        <!-- Configuration -->
        <div class="config-section">
          <h2>Configuration</h2>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="config().enabled" (change)="onConfigChange()" />
              <span>Enable Automated Backups</span>
            </label>
          </div>

          <div class="form-group">
            <label>Backup Frequency</label>
            <select [(ngModel)]="config().frequency" (change)="onConfigChange()">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          @if (config().frequency === 'custom') {
            <div class="form-group">
              <label>Custom Interval (hours)</label>
              <input
                type="number"
                [(ngModel)]="config().customIntervalHours"
                (change)="onConfigChange()"
                min="1"
                max="168"
              />
            </div>
          }

          <div class="form-group">
            <label>Number of Backups to Retain</label>
            <input
              type="number"
              [(ngModel)]="config().retentionCount"
              (change)="onConfigChange()"
              min="1"
              max="30"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="config().encryptBackups"
                (change)="onConfigChange()"
              />
              <span>Encrypt Backups</span>
            </label>
          </div>

          @if (config().encryptBackups) {
            <div class="form-group">
              <label>Encryption Password</label>
              <input
                type="password"
                [(ngModel)]="config().password"
                (change)="onConfigChange()"
                placeholder="Enter encryption password"
              />
            </div>
          }

          <div class="form-actions">
            <button (click)="triggerManualBackup()" class="btn-primary" [disabled]="isBackingUp()">
              @if (isBackingUp()) {
                <span>⏳ Backing up...</span>
              } @else {
                <span>🔄 Trigger Backup Now</span>
              }
            </button>
          </div>

          @if (scheduledBackupService.nextBackupTime()) {
            <div class="next-backup-info">
              Next scheduled backup: {{ formatTimestamp(scheduledBackupService.nextBackupTime()!) }}
            </div>
          }
        </div>

        <!-- Storage Info -->
        <div class="storage-section">
          <h2>Storage</h2>
          <div class="storage-info">
            <div class="storage-stat">
              <span class="stat-label">Total Backups:</span>
              <span class="stat-value">{{ backupHistory().length }}</span>
            </div>
            <div class="storage-stat">
              <span class="stat-label">Storage Used:</span>
              <span class="stat-value">{{ formatBytes(totalStorage()) }}</span>
            </div>
          </div>
          <button (click)="clearAllBackups()" class="btn-danger">🗑️ Clear All Backups</button>
        </div>

        <!-- Backup History -->
        <div class="history-section">
          <h2>Backup History</h2>

          @if (backupHistory().length === 0) {
            <div class="empty-state">
              <p>No backups found</p>
            </div>
          } @else {
            <div class="backup-list">
              @for (backup of backupHistory(); track backup.id) {
                <div class="backup-item" [class]="'status-' + backup.status">
                  <div class="backup-header">
                    <div class="backup-info">
                      <div class="backup-filename">{{ backup.filename }}</div>
                      <div class="backup-meta">
                        {{ formatTimestamp(backup.createdAt) }} • {{ formatBytes(backup.size) }} •
                        {{ backup.itemCount }} items
                        @if (backup.encrypted) {
                          • 🔒 Encrypted
                        }
                      </div>
                    </div>
                    <div class="backup-status">
                      @if (backup.status === 'success') {
                        <span class="status-badge success">✓ Success</span>
                      } @else if (backup.status === 'failed') {
                        <span class="status-badge failed">✗ Failed</span>
                      } @else {
                        <span class="status-badge in-progress">⏳ In Progress</span>
                      }
                    </div>
                  </div>

                  @if (backup.error) {
                    <div class="backup-error">Error: {{ backup.error }}</div>
                  }

                  <div class="backup-actions">
                    <button (click)="restoreBackup(backup)" class="btn-secondary">
                      ↩️ Restore
                    </button>
                    <button (click)="deleteBackup(backup.id)" class="btn-danger-small">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .backup-settings-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 2rem;
      }

      .health-status {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: 0.75rem;
        margin-bottom: 2rem;
      }

      .status-healthy {
        background: #d1fae5;
        border: 2px solid #10b981;
      }

      .status-warning {
        background: #fef3c7;
        border: 2px solid #f59e0b;
      }

      .status-critical {
        background: #fee2e2;
        border: 2px solid #ef4444;
      }

      .status-icon {
        font-size: 2rem;
      }

      .status-message {
        font-weight: 600;
        font-size: 1.125rem;
      }

      .status-detail {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin-top: 0.25rem;
      }

      .config-section,
      .storage-section,
      .history-section {
        background: var(--color-bg-secondary);
        padding: 1.5rem;
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: var(--color-text-primary);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--color-text-primary);
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .checkbox-label input[type='checkbox'] {
        width: 1.25rem;
        height: 1.25rem;
        cursor: pointer;
      }

      input[type='number'],
      input[type='password'],
      select {
        width: 100%;
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid var(--color-border);
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        font-size: 1rem;
      }

      .form-actions {
        margin-top: 1.5rem;
      }

      .btn-primary,
      .btn-secondary,
      .btn-danger,
      .btn-danger-small {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--color-primary);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        opacity: 0.9;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }

      .btn-secondary:hover {
        background: var(--color-bg-primary);
      }

      .btn-danger {
        background: #ef4444;
        color: white;
        margin-top: 1rem;
      }

      .btn-danger:hover {
        background: #dc2626;
      }

      .btn-danger-small {
        background: #ef4444;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }

      .btn-danger-small:hover {
        background: #dc2626;
      }

      .next-backup-info {
        margin-top: 1rem;
        padding: 0.75rem;
        background: var(--color-bg-tertiary);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .storage-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .storage-stat {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
        background: var(--color-bg-tertiary);
        border-radius: 0.5rem;
      }

      .stat-label {
        font-weight: 500;
        color: var(--color-text-secondary);
      }

      .stat-value {
        font-weight: 700;
        color: var(--color-primary);
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--color-text-secondary);
      }

      .backup-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .backup-item {
        padding: 1.25rem;
        background: var(--color-bg-tertiary);
        border-radius: 0.5rem;
        border-left: 4px solid;
      }

      .backup-item.status-success {
        border-left-color: #10b981;
      }

      .backup-item.status-failed {
        border-left-color: #ef4444;
      }

      .backup-item.status-in_progress {
        border-left-color: #f59e0b;
      }

      .backup-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
      }

      .backup-filename {
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }

      .backup-meta {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-badge.success {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge.failed {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-badge.in-progress {
        background: #fef3c7;
        color: #92400e;
      }

      .backup-error {
        padding: 0.75rem;
        background: #fee2e2;
        border-radius: 0.5rem;
        color: #991b1b;
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }

      .backup-actions {
        display: flex;
        gap: 0.75rem;
      }
    `,
  ],
})
export class BackupSettingsComponent {
  config;
  backupHistory;
  isBackingUp = signal(false);

  constructor(public scheduledBackupService: ScheduledBackupService) {
    this.config = this.scheduledBackupService.config;
    this.backupHistory = this.scheduledBackupService.backupHistory;
  }

  health() {
    return this.scheduledBackupService.getBackupHealth();
  }

  totalStorage() {
    return this.scheduledBackupService.getTotalStorageUsed();
  }

  onConfigChange(): void {
    this.scheduledBackupService.updateConfig(this.config());
  }

  async triggerManualBackup(): Promise<void> {
    this.isBackingUp.set(true);
    try {
      await this.scheduledBackupService.triggerBackup();
    } finally {
      this.isBackingUp.set(false);
    }
  }

  async restoreBackup(metadata: BackupMetadata): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to restore this backup from ${this.formatTimestamp(metadata.createdAt)}? This will replace all current data.`,
    );

    if (!confirmed) return;

    try {
      const backup = this.scheduledBackupService.getBackup(metadata.id);
      if (!backup) {
        alert('Backup not found');
        return;
      }

      // TODO: Implement restore logic using BackupService
      alert('Restore functionality will be implemented');
    } catch (error) {
      alert('Failed to restore backup: ' + (error as Error).message);
    }
  }

  deleteBackup(id: string): void {
    const confirmed = confirm('Are you sure you want to delete this backup?');
    if (confirmed) {
      this.scheduledBackupService.deleteBackup(id);
    }
  }

  clearAllBackups(): void {
    const confirmed = confirm(
      'Are you sure you want to delete ALL backups? This cannot be undone.',
    );
    if (confirmed) {
      this.scheduledBackupService.clearAllBackups();
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatAge(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
