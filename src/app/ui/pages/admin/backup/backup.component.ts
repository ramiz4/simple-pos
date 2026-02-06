import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../../../application/services/backup.service';
import { AdminSectionComponent } from '../../../components/admin/shared/section/section.component';
import { ButtonComponent } from '../../../components/shared/button/button.component';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSectionComponent, ButtonComponent],
  templateUrl: './backup.component.html',
})
export class BackupComponent {
  backupPassword = '';
  restorePassword = '';
  selectedFile = signal<File | null>(null);

  processing = signal(false);
  action = signal<'backup' | 'restore' | null>(null);

  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  constructor(private backupService: BackupService) {}

  async createBackup() {
    try {
      this.processing.set(true);
      this.action.set('backup');
      this.statusMessage.set(null);

      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      const backup = await this.backupService.createBackup({
        encrypt: !!this.backupPassword,
        password: this.backupPassword,
      });

      await this.backupService.exportBackupToFile(backup);

      this.showStatus('Backup created successfully! Check your downloads.', 'success');
      this.backupPassword = ''; // Clear password
    } catch (error) {
      this.showStatus('Failed to create backup: ' + (error as Error).message, 'error');
    } finally {
      this.processing.set(false);
      this.action.set(null);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.statusMessage.set(null);
    }
  }

  async restoreBackup() {
    const file = this.selectedFile();
    if (!file) return;

    if (!confirm('WARNING: restoring a backup will overwrite your current data. Are you sure?')) {
      return;
    }

    try {
      this.processing.set(true);
      this.action.set('restore');
      this.statusMessage.set(null);

      const backupData = await this.backupService.importBackupFromFile(file);

      const result = await this.backupService.restoreBackup(backupData, this.restorePassword);

      if (result.success) {
        this.showStatus(
          `Data restored successfully! ${result.itemsRestored} items imported.`,
          'success',
        );
        this.selectedFile.set(null);
        this.restorePassword = '';
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        this.showStatus(result.message, 'error');
      }
    } catch (error) {
      this.showStatus('Restore failed: ' + (error as Error).message, 'error');
    } finally {
      this.processing.set(false);
      this.action.set(null);
    }
  }

  private showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage.set(msg);
    this.statusType.set(type);

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => this.statusMessage.set(null), 5000);
    }
  }
}
