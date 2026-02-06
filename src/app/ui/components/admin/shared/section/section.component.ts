import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-section',
  standalone: true,
  imports: [],
  template: `
    <div class="glass-card shadow-lg shadow-purple-500/5 p-6 border-white/40">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-black text-surface-900 tracking-tight">{{ sectionTitle }}</h3>
          @if (sectionSubtitle) {
            <p class="text-xs font-bold text-surface-400 uppercase tracking-widest mt-1">
              {{ sectionSubtitle }}
            </p>
          }
        </div>
        <div class="flex items-center gap-2">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>

      <div class="space-y-4">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AdminSectionComponent {
  @Input({ required: true }) sectionTitle: string = '';
  @Input() sectionSubtitle?: string;
}
