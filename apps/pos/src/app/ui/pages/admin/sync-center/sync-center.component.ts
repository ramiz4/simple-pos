import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConflictResolutionStrategy, SyncConflict } from '@simple-pos/shared/types';
import { SyncEngineService } from '../../../../application/services/sync-engine.service';
import { SyncModeService } from '../../../../application/services/sync-mode.service';

@Component({
  selector: 'app-sync-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sync-center.component.html',
})
export class SyncCenterComponent {
  resolving = signal<string | null>(null);
  mergePayload = signal<Record<string, string>>({});
  error = signal<string>('');

  constructor(
    public readonly syncMode: SyncModeService,
    public readonly syncEngine: SyncEngineService,
  ) {}

  async syncNow(): Promise<void> {
    this.error.set('');
    await this.syncEngine.syncNow();
  }

  async resolve(conflict: SyncConflict, strategy: ConflictResolutionStrategy): Promise<void> {
    this.resolving.set(conflict.id);
    this.error.set('');

    try {
      let merged: Record<string, unknown> | undefined;
      if (strategy === 'MERGE' || strategy === 'MANUAL') {
        const payload = this.mergePayload()[conflict.id] ?? '';
        if (payload.trim()) {
          merged = JSON.parse(payload) as Record<string, unknown>;
        }
      }

      await this.syncEngine.resolveConflict(conflict.id, strategy, merged);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to resolve conflict');
    } finally {
      this.resolving.set(null);
    }
  }

  setMergePayload(conflictId: string, value: string): void {
    this.mergePayload.set({
      ...this.mergePayload(),
      [conflictId]: value,
    });
  }

  pretty(value: Record<string, unknown>): string {
    return JSON.stringify(value, null, 2);
  }
}
