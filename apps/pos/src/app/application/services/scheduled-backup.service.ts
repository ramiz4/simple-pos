import { Injectable, signal } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { BackupData, BackupService } from './backup.service';

export interface BackupMetadata {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  itemCount: number;
  encrypted: boolean;
  status: 'success' | 'failed' | 'in_progress';
  error?: string;
}

export interface ScheduledBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  customIntervalHours?: number;
  retentionCount: number; // Number of backups to keep
  encryptBackups: boolean;
  password?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScheduledBackupService {
  private readonly CONFIG_KEY = 'simple-pos-backup-config';
  private readonly BACKUPS_KEY = 'simple-pos-backups-metadata';
  private intervalId?: number;

  config = signal<ScheduledBackupConfig>({
    enabled: false,
    frequency: 'daily',
    retentionCount: 7,
    encryptBackups: false,
  });

  lastBackupTime = signal<string | null>(null);
  nextBackupTime = signal<string | null>(null);
  backupHistory = signal<BackupMetadata[]>([]);

  constructor(
    private backupService: BackupService,
    private platformService: PlatformService,
    private logger: LoggerService,
  ) {
    this.loadConfig();
    this.loadBackupHistory();
    this.initializeScheduler();
  }

  /**
   * Update backup configuration
   */
  updateConfig(config: ScheduledBackupConfig): void {
    this.config.set(config);
    this.saveConfig();
    this.restartScheduler();
  }

  /**
   * Manually trigger a backup
   */
  async triggerBackup(): Promise<void> {
    await this.performBackup();
  }

  /**
   * Get backup by ID
   */
  getBackup(id: string): BackupData | null {
    try {
      const stored = localStorage.getItem(`backup-${id}`);
      if (!stored) return null;
      return JSON.parse(stored) as BackupData;
    } catch (error) {
      this.logger.error('Failed to retrieve backup', { id, error });
      return null;
    }
  }

  /**
   * Delete a backup
   */
  deleteBackup(id: string): void {
    try {
      localStorage.removeItem(`backup-${id}`);
      const history = this.backupHistory();
      this.backupHistory.set(history.filter((b) => b.id !== id));
      this.saveBackupHistory();
      this.logger.info('Backup deleted', { id });
    } catch (error) {
      this.logger.error('Failed to delete backup', { id, error });
    }
  }

  /**
   * Clear all backups
   */
  clearAllBackups(): void {
    try {
      const history = this.backupHistory();
      history.forEach((backup) => {
        localStorage.removeItem(`backup-${backup.id}`);
      });
      this.backupHistory.set([]);
      this.saveBackupHistory();
      this.logger.info('All backups cleared');
    } catch (error) {
      this.logger.error('Failed to clear backups', { error });
    }
  }

  /**
   * Get total storage used by backups
   */
  getTotalStorageUsed(): number {
    return this.backupHistory().reduce((total, backup) => total + backup.size, 0);
  }

  /**
   * Get backup health status
   */
  getBackupHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    lastBackupAge?: number;
  } {
    const history = this.backupHistory();

    if (history.length === 0) {
      return {
        status: 'critical',
        message: 'No backups found',
      };
    }

    const lastBackup = history[0];
    const lastBackupDate = new Date(lastBackup.createdAt);
    const now = new Date();
    const ageInHours = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

    if (lastBackup.status === 'failed') {
      return {
        status: 'critical',
        message: 'Last backup failed',
        lastBackupAge: ageInHours,
      };
    }

    if (ageInHours > 48) {
      return {
        status: 'warning',
        message: 'Last backup is more than 48 hours old',
        lastBackupAge: ageInHours,
      };
    }

    return {
      status: 'healthy',
      message: 'Backups are up to date',
      lastBackupAge: ageInHours,
    };
  }

  private async performBackup(): Promise<void> {
    const config = this.config();
    const backupId = `backup-${Date.now()}`;

    // Update status
    const metadata: BackupMetadata = {
      id: backupId,
      filename: `simple-pos-backup-${new Date().toISOString().split('T')[0]}.json`,
      createdAt: new Date().toISOString(),
      size: 0,
      itemCount: 0,
      encrypted: config.encryptBackups,
      status: 'in_progress',
    };

    try {
      this.logger.info('Starting scheduled backup');

      // Create backup
      const backup = await this.backupService.createBackup({
        encrypt: config.encryptBackups,
        password: config.password,
      });

      // Calculate size and item count
      const backupJson = JSON.stringify(backup);
      metadata.size = new Blob([backupJson]).size;
      metadata.itemCount = this.countBackupItems(backup);
      metadata.status = 'success';

      // Store backup
      localStorage.setItem(`backup-${backupId}`, backupJson);

      // Update history
      const history = this.backupHistory();
      history.unshift(metadata);
      this.backupHistory.set(history);

      // Apply retention policy
      this.applyRetentionPolicy();

      // Update timestamps
      this.lastBackupTime.set(new Date().toISOString());
      this.calculateNextBackupTime();

      this.saveBackupHistory();
      this.logger.info('Scheduled backup completed successfully', { backupId });
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = (error as Error).message;

      const history = this.backupHistory();
      history.unshift(metadata);
      this.backupHistory.set(history);
      this.saveBackupHistory();

      this.logger.error('Scheduled backup failed', { backupId, error });
    }
  }

  private countBackupItems(backup: BackupData): number {
    let count = 0;
    if (typeof backup.data === 'object' && !backup.encrypted) {
      for (const key in backup.data) {
        const items = backup.data[key as keyof typeof backup.data];
        if (Array.isArray(items)) {
          count += items.length;
        }
      }
    }
    return count;
  }

  private applyRetentionPolicy(): void {
    const config = this.config();
    const history = this.backupHistory();

    if (history.length > config.retentionCount) {
      const toDelete = history.slice(config.retentionCount);
      toDelete.forEach((backup) => {
        localStorage.removeItem(`backup-${backup.id}`);
      });

      this.backupHistory.set(history.slice(0, config.retentionCount));
      this.logger.info('Applied backup retention policy', {
        deleted: toDelete.length,
        retained: config.retentionCount,
      });
    }
  }

  private initializeScheduler(): void {
    const config = this.config();
    if (config.enabled) {
      this.startScheduler();
    }
  }

  private startScheduler(): void {
    const config = this.config();
    if (!config.enabled) return;

    const intervalMs = this.getIntervalMs();
    this.intervalId = window.setInterval(() => {
      this.performBackup();
    }, intervalMs);

    this.calculateNextBackupTime();
    this.logger.info('Backup scheduler started', { intervalMs });
  }

  private stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.nextBackupTime.set(null);
      this.logger.info('Backup scheduler stopped');
    }
  }

  private restartScheduler(): void {
    this.stopScheduler();
    this.startScheduler();
  }

  private getIntervalMs(): number {
    const config = this.config();

    switch (config.frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'custom':
        return (config.customIntervalHours || 24) * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private calculateNextBackupTime(): void {
    const intervalMs = this.getIntervalMs();
    const nextTime = new Date(Date.now() + intervalMs);
    this.nextBackupTime.set(nextTime.toISOString());
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        this.config.set(JSON.parse(stored));
      }
    } catch (error) {
      this.logger.error('Failed to load backup config', { error });
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config()));
    } catch (error) {
      this.logger.error('Failed to save backup config', { error });
    }
  }

  private loadBackupHistory(): void {
    try {
      const stored = localStorage.getItem(this.BACKUPS_KEY);
      if (stored) {
        this.backupHistory.set(JSON.parse(stored));
      }
    } catch (error) {
      this.logger.error('Failed to load backup history', { error });
    }
  }

  private saveBackupHistory(): void {
    try {
      localStorage.setItem(this.BACKUPS_KEY, JSON.stringify(this.backupHistory()));
    } catch (error) {
      this.logger.error('Failed to save backup history', { error });
    }
  }
}
