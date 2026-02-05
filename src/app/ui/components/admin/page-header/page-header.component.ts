import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="backdrop-blur-md bg-white/80 shadow-lg border-b border-white/20 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center space-x-4">
              <h1
                class="text-xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[200px] sm:max-w-none"
              >
                {{ title }}
              </h1>
            </div>
            <div class="flex items-center space-x-2">
              <ng-content select="[actions]"></ng-content>
              <button
                *ngIf="showBackButton"
                (click)="back.emit()"
                class="px-4 py-2 min-h-[44px] backdrop-blur-md bg-white/80 hover:bg-white text-gray-700 rounded-lg transition shadow-sm border border-gray-200 text-sm font-bold"
              >
                ← Back
              </button>
            </div>
          </div>

          <!-- Quick Navigation Menu -->
          <div class="flex overflow-x-auto no-scrollbar py-2 gap-2 border-t border-gray-100/50">
            @for (item of menuItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-md scale-105"
                [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
                class="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap border border-gray-100 bg-gray-50/50 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                {{ item.label }}
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class AdminPageHeaderComponent {
  @Input() title: string = '';
  @Input() showBackButton: boolean = true;
  @Output() back = new EventEmitter<void>();

  menuItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Products', path: '/admin/products' },
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Tables', path: '/admin/tables' },
    { label: 'Variants', path: '/admin/variants' },
    { label: 'Extras', path: '/admin/extras' },
    { label: 'Ingredients', path: '/admin/ingredients' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Printer', path: '/admin/printer' },
    { label: 'Backup', path: '/admin/backup' },
  ];
}
