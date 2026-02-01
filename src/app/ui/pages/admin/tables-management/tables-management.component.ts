import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Table } from '../../../../domain/entities/table.interface';
import { CodeTable } from '../../../../domain/entities/code-table.interface';
import { TableService } from '../../../../application/services/table.service';
import { EnumMappingService } from '../../../../application/services/enum-mapping.service';

@Component({
  selector: 'app-tables-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tables-management.component.html',
  styleUrls: ['./tables-management.component.css']
})
export class TablesManagementComponent implements OnInit, OnDestroy {
  tables: Table[] = [];
  tableStatuses: CodeTable[] = [];
  isLoading = false;
  isFormOpen = false;
  isDeleteConfirmOpen = false;
  successMessage = '';
  errorMessage = '';

  editingId: number | null = null;
  formData = this.initializeFormData();

  deleteConfirmId: number | null = null;
  deleteConfirmName = '';

  private destroyed = false;

  constructor(
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  private initializeFormData() {
    return {
      name: '',
      number: 0,
      seats: 0,
      statusId: 0
    };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const [tables, statuses] = await Promise.all([
        this.tableService.getAll(),
        this.enumMappingService.getCodeTableByType('TABLE_STATUS')
      ]);
      this.tables = tables;
      this.tableStatuses = statuses;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load tables data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }
  }

  openForm(table?: Table) {
    if (table) {
      this.editingId = table.id;
      this.formData = { ...table };
    } else {
      this.editingId = null;
      this.formData = this.initializeFormData();
    }
    this.isFormOpen = true;
    this.errorMessage = '';
  }

  closeForm() {
    this.isFormOpen = false;
    this.editingId = null;
    this.formData = this.initializeFormData();
  }

  openDeleteConfirm(table: Table) {
    this.deleteConfirmId = table.id;
    this.deleteConfirmName = table.name;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
  }

  async saveTable() {
    if (!this.formData.name || !this.formData.number || this.formData.seats <= 0 || !this.formData.statusId) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    try {
      const isUpdate = !!this.editingId;
      if (this.editingId) {
        await this.tableService.update(this.editingId, this.formData);
      } else {
        await this.tableService.create(this.formData);
      }
      await this.loadData();
      this.closeForm();
      
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.successMessage = isUpdate ? 'Table updated successfully' : 'Table created successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      });
    } catch (error) {
      this.errorMessage = 'Failed to save table';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.tableService.delete(this.deleteConfirmId);
      await this.loadData();
      this.closeDeleteConfirm();
      
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.successMessage = 'Table deleted successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      });
    } catch (error) {
      this.errorMessage = 'Failed to delete table';
      console.error('Delete error:', error);
    }
  }

  getStatusLabel(statusId: number): string {
    const status = this.tableStatuses.find(s => s.id === statusId);
    return status ? status.code : 'Unknown';
  }

  onBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
