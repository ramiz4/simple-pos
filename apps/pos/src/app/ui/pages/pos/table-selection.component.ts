import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Table, TableStatusEnum } from '@simple-pos/shared/types';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { TableService } from '../../../application/services/table.service';

import { CartService } from '../../../application/services/cart.service';

@Component({
  selector: 'app-table-selection',
  standalone: true,
  imports: [],
  template: `
    <main class="p-6 max-w-7xl mx-auto animate-fade-in">
      <div class="mb-12 text-center">
        <h2 class="text-3xl font-black text-surface-900 mb-2">Where are they sitting?</h2>
        <p class="text-surface-500 font-medium">
          Select an available or occupied table to manage its order.
        </p>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 animate-pulse">
          <div
            class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"
          ></div>
          <p class="text-surface-500 font-bold uppercase tracking-widest text-xs">
            Checking tables...
          </p>
        </div>
      } @else {
        <!-- Tables Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          @for (table of tables(); track table.id) {
            <button
              (click)="selectTable(table)"
              [class]="getTableButtonClass(table)"
              class="relative overflow-hidden group transition-all duration-300"
            >
              <div class="p-6 relative z-10">
                <div class="flex justify-between items-start mb-4">
                  <div
                    class="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center font-black text-surface-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors"
                  >
                    #{{ table.number }}
                  </div>
                  <div
                    [class]="getStatusClass(table)"
                    class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                  >
                    {{ getTableStatus(table) }}
                  </div>
                </div>

                <h3 class="text-lg font-black text-surface-900 mb-1">{{ table.name }}</h3>
                <div class="flex items-center gap-1 text-surface-400 font-medium text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  {{ table.seats }} seats
                </div>
              </div>

              <!-- Decorative element -->
              @if (isTableFree(table)) {
                <div
                  class="absolute -right-4 -bottom-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"
                ></div>
              } @else {
                <div
                  class="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"
                ></div>
              }
            </button>
          }
        </div>

        @if (tables().length === 0) {
          <div class="text-center py-20 glass-card">
            <div class="text-6xl mb-4">🏜️</div>
            <p class="text-surface-500 text-lg font-bold">No tables found</p>
            <p class="text-surface-400">Please add tables in the admin panel.</p>
          </div>
        }
      }
    </main>
  `,
})
export class TableSelectionComponent implements OnInit {
  tables = signal<Table[]>([]);
  isLoading = signal<boolean>(true);
  freeStatusId = signal<number | null>(null);
  private typeId?: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
    private cartService: CartService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe((params) => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
    });

    try {
      this.isLoading.set(true);
      const statusId = await this.enumMappingService.getCodeTableId(
        'TABLE_STATUS',
        TableStatusEnum.FREE,
      );
      this.freeStatusId.set(statusId);
      await this.loadTables();
    } catch (err) {
      console.error('Error initializing TableSelectionComponent:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadTables(): Promise<void> {
    try {
      const allTables = await this.tableService.getAll();
      this.tables.set(allTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  }

  isTableFree(table: Table): boolean {
    const freeId = this.freeStatusId();
    if (freeId === null) return false;
    return table.statusId === freeId;
  }

  getTableStatus(table: Table): string {
    const freeId = this.freeStatusId();
    if (freeId !== null && table.statusId === freeId) {
      return 'Available';
    }
    return 'Occupied';
  }

  getTableIcon(table: Table): string {
    return this.isTableFree(table) ? '✓' : '⊗';
  }

  getTableButtonClass(table: Table): string {
    const baseClass = 'glass-card border-none ring-1 active:scale-95 cursor-pointer';

    if (this.isTableFree(table)) {
      return `${baseClass} ring-green-100 hover:ring-green-400`;
    } else {
      return `${baseClass} ring-orange-100 hover:ring-orange-400 bg-orange-50/30`;
    }
  }

  getStatusClass(table: Table): string {
    if (this.isTableFree(table)) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-orange-600 bg-orange-100';
  }

  selectTable(table: Table): void {
    // Set table context for the cart
    this.cartService.setContext(table.id);

    this.router.navigate(['/pos/product-selection'], {
      queryParams: {
        typeId: this.typeId,
        tableId: table.id,
      },
    });
  }
}
