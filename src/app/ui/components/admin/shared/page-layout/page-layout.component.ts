import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-page-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6 animate-fade-in">
      <!-- Header Actions & Filters Bar -->
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-5 glass-card rounded-3xl! border-white/60 shadow-xl shadow-purple-500/5"
      >
        <div class="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          <ng-content select="[filters]"></ng-content>
        </div>
        <div class="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>

      <!-- Content Area -->
      <div class="min-h-0">
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
export class AdminPageLayoutComponent {}
