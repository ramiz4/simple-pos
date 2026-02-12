import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BackupMetadata,
  ScheduledBackupService,
} from '../../../../application/services/scheduled-backup.service';
import { AdminSectionComponent } from '../../../components/admin/shared/section/section.component';
import { ButtonComponent } from '../../../components/shared/button/button.component';

@Component({
  selector: 'app-backup-settings',
  standalone: true,
  imports: [FormsModule, AdminSectionComponent, ButtonComponent],
  templateUrl: './backup-settings.component.html',
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
