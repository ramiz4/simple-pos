import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TestEntity } from '@simple-pos/shared/types';
import { TestService } from '../../../application/services/test.service';
import { PlatformService } from '../../../infrastructure/services/platform.service';

@Component({
  selector: 'app-test-persistence',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-linear-to-br from-blue-400 via-purple-500 to-pink-500 p-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="glass-card p-6 mb-6">
          <h1 class="text-3xl font-bold text-white mb-2">Simple POS - Persistence Test</h1>
          <p class="text-white/80">
            Platform:
            <span class="font-semibold">{{
              platformService.isTauri() ? 'Tauri Desktop (SQLite)' : 'Web Browser (IndexedDB)'
            }}</span>
          </p>
        </div>

        <!-- Create Form -->
        <div class="glass-card p-6 mb-6">
          <h2 class="text-xl font-semibold text-white mb-4">Create Test Entity</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-white mb-2">Name</label>
              <input
                type="text"
                [(ngModel)]="newName"
                class="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label class="block text-white mb-2">Value (optional)</label>
              <input
                type="text"
                [(ngModel)]="newValue"
                class="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Enter value"
              />
            </div>
            <button
              (click)="createEntity()"
              [disabled]="testService.isLoading() || !newName.trim()"
              class="glass-button px-6 py-3 text-white font-semibold disabled:opacity-50"
            >
              {{ testService.isLoading() ? 'Creating...' : 'Create Entity' }}
            </button>
          </div>
        </div>

        <!-- Error Display -->
        @if (testService.error()) {
          <div class="glass-card p-4 mb-6 bg-red-500/30 border-red-500/50">
            <p class="text-white font-semibold">Error: {{ testService.error() }}</p>
          </div>
        }

        <!-- Entities List -->
        <div class="glass-card p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-white">
              Stored Entities ({{ testService.entities().length }})
            </h2>
            <button
              (click)="refresh()"
              [disabled]="testService.isLoading()"
              class="glass-button px-4 py-2 text-white text-sm font-semibold disabled:opacity-50"
            >
              {{ testService.isLoading() ? 'Loading...' : 'Refresh' }}
            </button>
          </div>

          @if (testService.isLoading()) {
            <p class="text-white/70">Loading...</p>
          } @else if (testService.entities().length === 0) {
            <p class="text-white/70">No entities yet. Create one above!</p>
          } @else {
            <div class="space-y-3">
              @for (entity of testService.entities(); track entity.id) {
                <div class="bg-white/10 rounded-2xl p-4 border border-white/20">
                  @if (editingId() === entity.id) {
                    <!-- Edit Mode -->
                    <div class="space-y-3">
                      <input
                        type="text"
                        [(ngModel)]="editName"
                        class="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                      />
                      <input
                        type="text"
                        [(ngModel)]="editValue"
                        class="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                      />
                      <div class="flex gap-2">
                        <button
                          (click)="saveEdit(entity.id)"
                          class="glass-button px-4 py-2 text-white text-sm font-semibold"
                        >
                          Save
                        </button>
                        <button
                          (click)="cancelEdit()"
                          class="glass-button px-4 py-2 text-white text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  } @else {
                    <!-- View Mode -->
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <p class="text-white font-semibold text-lg">{{ entity.name }}</p>
                        <p class="text-white/70">Value: {{ entity.value || '(none)' }}</p>
                        <p class="text-white/50 text-sm">
                          ID: {{ entity.id }} | Created: {{ formatDate(entity.createdAt) }}
                        </p>
                      </div>
                      <div class="flex gap-2">
                        <button
                          (click)="startEdit(entity)"
                          class="glass-button px-3 py-2 text-white text-sm"
                        >
                          Edit
                        </button>
                        <button
                          (click)="deleteEntity(entity.id)"
                          class="glass-button px-3 py-2 text-white text-sm bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class TestPersistenceComponent {
  newName = '';
  newValue = '';

  editingId = signal<number | null>(null);
  editName = '';
  editValue = '';

  constructor(
    public testService: TestService,
    public platformService: PlatformService,
  ) {}

  async createEntity(): Promise<void> {
    if (!this.newName.trim()) return;

    await this.testService.createTestEntity(this.newName.trim(), this.newValue.trim() || null);

    this.newName = '';
    this.newValue = '';
  }

  startEdit(entity: TestEntity): void {
    this.editingId.set(entity.id);
    this.editName = entity.name;
    this.editValue = entity.value || '';
  }

  async saveEdit(id: number): Promise<void> {
    await this.testService.updateTestEntity(
      id,
      this.editName.trim(),
      this.editValue.trim() || null,
    );
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editName = '';
    this.editValue = '';
  }

  async deleteEntity(id: number): Promise<void> {
    if (confirm('Are you sure you want to delete this entity?')) {
      await this.testService.deleteTestEntity(id);
    }
  }

  async refresh(): Promise<void> {
    await this.testService.loadAll();
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }
}
