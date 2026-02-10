import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class SyncMetadataMigrationService {
  constructor(private readonly platformService: PlatformService) {}

  async ensure(): Promise<void> {
    if (!this.platformService.isTauri()) {
      return;
    }

    const db = await Database.load('sqlite:simple-pos.db');

    const tables = [
      'account',
      'user',
      'code_table',
      'code_translation',
      'category',
      'extra',
      'ingredient',
      '"table"',
      'product',
      'variant',
      'product_extra',
      'product_ingredient',
      '"order"',
      'order_item',
      'order_item_extra',
    ];

    const alterations = [
      'ADD COLUMN cloudId TEXT',
      'ADD COLUMN version INTEGER DEFAULT 1',
      'ADD COLUMN isDirty INTEGER DEFAULT 0',
      'ADD COLUMN isDeleted INTEGER DEFAULT 0',
      'ADD COLUMN syncedAt TEXT',
      'ADD COLUMN lastModifiedAt TEXT',
      'ADD COLUMN deletedAt TEXT',
      'ADD COLUMN tenantId TEXT',
    ];

    for (const table of tables) {
      for (const alteration of alterations) {
        try {
          await db.execute(`ALTER TABLE ${table} ${alteration}`);
        } catch (error) {
          // Only ignore duplicate column errors; log and re-throw other failures
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            !errorMessage.includes('duplicate column') &&
            !errorMessage.includes('already exists')
          ) {
            console.error(`Failed to alter table ${table} with ${alteration}:`, error);
            throw error;
          }
        }
      }
    }
  }
}
