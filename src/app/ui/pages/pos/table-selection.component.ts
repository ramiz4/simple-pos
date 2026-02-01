import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TableService } from '../../../application/services/table.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { Table } from '../../../domain/entities';
import { TableStatusEnum } from '../../../domain/enums';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-table-selection',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <app-header title="Select Table" [showBackButton]="true" backRoute="/pos/order-type"></app-header>
      
      <div class="p-4">
      <div class="max-w-6xl mx-auto">
        <!-- Tables Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          @for (table of tables(); track table.id) {
            <button
              (click)="selectTable(table)"
              [disabled]="!isTableFree(table)"
              [class]="getTableButtonClass(table)"
            >
              <div class="text-center">
                <div class="text-4xl mb-2">{{ getTableIcon(table) }}</div>
                <h3 class="text-xl font-bold text-gray-800 mb-1">{{ table.name }}</h3>
                <p class="text-sm text-gray-600 mb-1">Table #{{ table.number }}</p>
                <p class="text-xs font-medium" [class]="getStatusClass(table)">
                  {{ getTableStatus(table) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">{{ table.seats }} seats</p>
              </div>
            </button>
          }
        </div>

        @if (tables().length === 0) {
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">No tables available</p>
          </div>
        }
      </div>
      </div>
    </div>
  `
})
export class TableSelectionComponent implements OnInit {
  tables = signal<Table[]>([]);
  private typeId?: number;
  private freeStatusId?: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tableService: TableService,
    private enumMappingService: EnumMappingService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
    });

    await this.loadTables();
    this.freeStatusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
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
    return table.statusId === this.freeStatusId;
  }

  getTableStatus(table: Table): string {
    if (table.statusId === this.freeStatusId) {
      return 'Available';
    }
    return 'Occupied';
  }

  getTableIcon(table: Table): string {
    return this.isTableFree(table) ? '✓' : '⊗';
  }

  getTableButtonClass(table: Table): string {
    const baseClass = 'relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all duration-300 border-2 min-h-[180px]';
    
    if (this.isTableFree(table)) {
      return `${baseClass} bg-white/80 backdrop-blur-md hover:shadow-2xl transform hover:scale-105 active:scale-95 border-green-200 hover:border-green-400 cursor-pointer`;
    } else {
      return `${baseClass} bg-gray-300/50 backdrop-blur-md border-gray-300 cursor-not-allowed opacity-60`;
    }
  }

  getStatusClass(table: Table): string {
    if (this.isTableFree(table)) {
      return 'text-green-600 bg-green-100 px-2 py-1 rounded-full';
    }
    return 'text-red-600 bg-red-100 px-2 py-1 rounded-full';
  }

  selectTable(table: Table): void {
    if (!this.isTableFree(table)) return;
    
    this.router.navigate(['/pos/product-selection'], {
      queryParams: {
        typeId: this.typeId,
        tableId: table.id
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pos/order-type']);
  }
}
