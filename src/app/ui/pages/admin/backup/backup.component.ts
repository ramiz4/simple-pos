import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../../../application/services/backup.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in pb-20">
      <main class="p-6 max-w-4xl mx-auto animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Create Backup Section -->
          <div class="glass-card p-8 group">
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-inner"
              >
                💾
              </div>
              <div>
                <h2 class="text-xl font-black text-surface-900">Create Backup</h2>
                <p class="text-xs font-bold text-surface-400 uppercase tracking-widest">
                  Export Data
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <p class="text-surface-600 text-sm">
                Download a complete copy of your database. You can optionally encrypt it with a
                password for security.
              </p>

              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1"
                  >Encryption Password (Optional)</label
                >
                <input
                  type="password"
                  [(ngModel)]="backupPassword"
                  placeholder="Leave empty for no encryption"
                  class="w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-surface-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="confirm-backup"
                  class="w-5 h-5 rounded-lg border-2 border-surface-300 text-blue-600 focus:ring-blue-500"
                  [checked]="true"
                  disabled
                />
                <label for="confirm-backup" class="text-sm font-medium text-surface-600">
                  Includes all products, orders, and settings
                </label>
              </div>

              <button
                (click)="createBackup()"
                [disabled]="processing()"
                class="w-full h-16 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md"
              >
                @if (processing() && action() === 'backup') {
                  <div
                    class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"
                  ></div>
                  <span>Generating...</span>
                } @else {
                  <span>Download Backup</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                }
              </button>
            </div>
          </div>

          <!-- Restore Backup Section -->
          <div class="glass-card p-8 group">
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-inner"
              >
                ♻️
              </div>
              <div>
                <h2 class="text-xl font-black text-surface-900">Restore Data</h2>
                <p class="text-xs font-bold text-surface-400 uppercase tracking-widest">
                  Import Backup
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <p class="text-surface-600 text-sm">
                Restore your database from a backup file.
                <strong class="text-red-500">Warning: This will overwrite data.</strong>
              </p>

              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1">Select Backup File</label>
                <div class="relative">
                  <input
                    type="file"
                    (change)="onFileSelected($event)"
                    accept=".json"
                    class="hidden"
                    id="file-upload"
                  />
                  <label
                    for="file-upload"
                    class="flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-dashed border-surface-300 hover:border-orange-500 hover:bg-white cursor-pointer transition-all"
                  >
                    <span class="text-surface-500 font-medium truncate">
                      {{ selectedFile() ? selectedFile()?.name : 'Click to select file...' }}
                    </span>
                    <span
                      class="text-xs font-bold bg-surface-200 text-surface-600 px-2 py-1 rounded-lg"
                      >BROWSE</span
                    >
                  </label>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-black text-surface-700 ml-1"
                  >Decryption Password (If needed)</label
                >
                <input
                  type="password"
                  [(ngModel)]="restorePassword"
                  placeholder="Enter password if backup is encrypted"
                  class="w-full h-14 px-5 rounded-2xl bg-surface-50 border-2 border-surface-100 focus:border-orange-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>

              <button
                (click)="restoreBackup()"
                [disabled]="processing() || !selectedFile()"
                class="w-full h-16 rounded-2xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md"
              >
                @if (processing() && action() === 'restore') {
                  <div
                    class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"
                  ></div>
                  <span>Restoring...</span>
                } @else {
                  <span>Restore Database</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        @if (statusMessage()) {
          <div
            class="mt-8 p-6 rounded-2xl text-center font-black animate-scale-in flex items-center justify-center gap-4"
            [ngClass]="
              statusType() === 'success'
                ? 'bg-green-100 text-green-600 border-2 border-green-200'
                : 'bg-red-100 text-red-600 border-2 border-red-200'
            "
          >
            <div class="text-2xl">{{ statusType() === 'success' ? '🎉' : '⚠️' }}</div>
            <div>{{ statusMessage() }}</div>
          </div>
        }
      </main>
    </div>
  `,
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
