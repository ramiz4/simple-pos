import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { SQLiteTableRepository } from '../../infrastructure/repositories/sqlite-table.repository';
import { IndexedDBTableRepository } from '../../infrastructure/repositories/indexeddb-table.repository';
import { SQLiteCategoryRepository } from '../../infrastructure/repositories/sqlite-category.repository';
import { IndexedDBCategoryRepository } from '../../infrastructure/repositories/indexeddb-category.repository';
import { SQLiteProductRepository } from '../../infrastructure/repositories/sqlite-product.repository';
import { IndexedDBProductRepository } from '../../infrastructure/repositories/indexeddb-product.repository';
import { SQLiteVariantRepository } from '../../infrastructure/repositories/sqlite-variant.repository';
import { IndexedDBVariantRepository } from '../../infrastructure/repositories/indexeddb-variant.repository';
import { SQLiteExtraRepository } from '../../infrastructure/repositories/sqlite-extra.repository';
import { IndexedDBExtraRepository } from '../../infrastructure/repositories/indexeddb-extra.repository';
import { SQLiteIngredientRepository } from '../../infrastructure/repositories/sqlite-ingredient.repository';
import { IndexedDBIngredientRepository } from '../../infrastructure/repositories/indexeddb-ingredient.repository';
import { SQLiteOrderRepository } from '../../infrastructure/repositories/sqlite-order.repository';
import { IndexedDBOrderRepository } from '../../infrastructure/repositories/indexeddb-order.repository';
import { SQLiteOrderItemRepository } from '../../infrastructure/repositories/sqlite-order-item.repository';
import { IndexedDBOrderItemRepository } from '../../infrastructure/repositories/indexeddb-order-item.repository';
import { SQLiteOrderItemExtraRepository } from '../../infrastructure/repositories/sqlite-order-item-extra.repository';
import { IndexedDBOrderItemExtraRepository } from '../../infrastructure/repositories/indexeddb-order-item-extra.repository';
import { SQLiteProductExtraRepository } from '../../infrastructure/repositories/sqlite-product-extra.repository';
import { IndexedDBProductExtraRepository } from '../../infrastructure/repositories/indexeddb-product-extra.repository';
import { SQLiteProductIngredientRepository } from '../../infrastructure/repositories/sqlite-product-ingredient.repository';
import { IndexedDBProductIngredientRepository } from '../../infrastructure/repositories/indexeddb-product-ingredient.repository';
import { SQLiteCodeTranslationRepository } from '../../infrastructure/repositories/sqlite-code-translation.repository';
import { IndexedDBCodeTranslationRepository } from '../../infrastructure/repositories/indexeddb-code-translation.repository';

export interface BackupData {
  version: string;
  createdAt: string;
  encrypted: boolean;
  data: {
    codeTables: any[];
    codeTranslations: any[];
    users: any[];
    tables: any[];
    categories: any[];
    products: any[];
    variants: any[];
    extras: any[];
    ingredients: any[];
    productExtras: any[];
    productIngredients: any[];
    orders: any[];
    orderItems: any[];
    orderItemExtras: any[];
  };
}

export interface BackupOptions {
  encrypt?: boolean;
  password?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  itemsRestored?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';

  constructor(
    private platformService: PlatformService,
    private sqliteCodeTableRepo: SQLiteCodeTableRepository,
    private indexedDBCodeTableRepo: IndexedDBCodeTableRepository,
    private sqliteCodeTranslationRepo: SQLiteCodeTranslationRepository,
    private indexedDBCodeTranslationRepo: IndexedDBCodeTranslationRepository,
    private sqliteUserRepo: SQLiteUserRepository,
    private indexedDBUserRepo: IndexedDBUserRepository,
    private sqliteTableRepo: SQLiteTableRepository,
    private indexedDBTableRepo: IndexedDBTableRepository,
    private sqliteCategoryRepo: SQLiteCategoryRepository,
    private indexedDBCategoryRepo: IndexedDBCategoryRepository,
    private sqliteProductRepo: SQLiteProductRepository,
    private indexedDBProductRepo: IndexedDBProductRepository,
    private sqliteVariantRepo: SQLiteVariantRepository,
    private indexedDBVariantRepo: IndexedDBVariantRepository,
    private sqliteExtraRepo: SQLiteExtraRepository,
    private indexedDBExtraRepo: IndexedDBExtraRepository,
    private sqliteIngredientRepo: SQLiteIngredientRepository,
    private indexedDBIngredientRepo: IndexedDBIngredientRepository,
    private sqliteProductExtraRepo: SQLiteProductExtraRepository,
    private indexedDBProductExtraRepo: IndexedDBProductExtraRepository,
    private sqliteProductIngredientRepo: SQLiteProductIngredientRepository,
    private indexedDBProductIngredientRepo: IndexedDBProductIngredientRepository,
    private sqliteOrderRepo: SQLiteOrderRepository,
    private indexedDBOrderRepo: IndexedDBOrderRepository,
    private sqliteOrderItemRepo: SQLiteOrderItemRepository,
    private indexedDBOrderItemRepo: IndexedDBOrderItemRepository,
    private sqliteOrderItemExtraRepo: SQLiteOrderItemExtraRepository,
    private indexedDBOrderItemExtraRepo: IndexedDBOrderItemExtraRepository,
  ) {}

  /**
   * Create a full backup of all database tables
   */
  async createBackup(options?: BackupOptions): Promise<BackupData> {
    try {
      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        encrypted: options?.encrypt || false,
        data: {
          codeTables: await this.getCodeTableRepo().findAll(),
          codeTranslations: await this.getCodeTranslationRepo().findAll(),
          users: await this.sanitizeUsers(await this.getUserRepo().findAll()),
          tables: await this.getTableRepo().findAll(),
          categories: await this.getCategoryRepo().findAll(),
          products: await this.getProductRepo().findAll(),
          variants: await this.getVariantRepo().findAll(),
          extras: await this.getExtraRepo().findAll(),
          ingredients: await this.getIngredientRepo().findAll(),
          productExtras: await this.getProductExtraRepo().findAll(),
          productIngredients: await this.getProductIngredientRepo().findAll(),
          orders: await this.getOrderRepo().findAll(),
          orderItems: await this.getOrderItemRepo().findAll(),
          orderItemExtras: await this.getOrderItemExtraRepo().findAll(),
        },
      };

      if (options?.encrypt && options?.password) {
        backup.data = (await this.encryptData(backup.data, options.password)) as any;
      }

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup: ' + (error as Error).message);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backup: BackupData, password?: string): Promise<RestoreResult> {
    try {
      // Validate backup
      const validation = this.validateBackup(backup);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message || 'Invalid backup file',
        };
      }

      let data = backup.data;

      // Decrypt if needed
      if (backup.encrypted) {
        if (!password) {
          return {
            success: false,
            message: 'Password required for encrypted backup',
          };
        }
        data = (await this.decryptData(data as any, password)) as any;
      }

      // Clear existing data (optional - could be a parameter)
      // await this.clearAllData();

      // Restore data in correct order (respecting foreign key dependencies)
      let itemsRestored = 0;

      // 1. Code tables and translations (foundation)
      for (const item of data.codeTables) {
        const { id, ...rest } = item;
        await this.getCodeTableRepo().create(rest);
        itemsRestored++;
      }

      for (const item of data.codeTranslations) {
        const { id, ...rest } = item;
        await this.getCodeTranslationRepo().create(rest);
        itemsRestored++;
      }

      // 2. Users
      for (const item of data.users) {
        const { id, ...rest } = item;
        await this.getUserRepo().create(rest);
        itemsRestored++;
      }

      // 3. Tables
      for (const item of data.tables) {
        const { id, ...rest } = item;
        await this.getTableRepo().create(rest);
        itemsRestored++;
      }

      // 4. Categories
      for (const item of data.categories) {
        const { id, ...rest } = item;
        await this.getCategoryRepo().create(rest);
        itemsRestored++;
      }

      // 5. Products
      for (const item of data.products) {
        const { id, ...rest } = item;
        await this.getProductRepo().create(rest);
        itemsRestored++;
      }

      // 6. Variants
      for (const item of data.variants) {
        const { id, ...rest } = item;
        await this.getVariantRepo().create(rest);
        itemsRestored++;
      }

      // 7. Extras
      for (const item of data.extras) {
        const { id, ...rest } = item;
        await this.getExtraRepo().create(rest);
        itemsRestored++;
      }

      // 8. Ingredients
      for (const item of data.ingredients) {
        const { id, ...rest } = item;
        await this.getIngredientRepo().create(rest);
        itemsRestored++;
      }

      // 9. Product relationships
      for (const item of data.productExtras) {
        const { id, ...rest } = item;
        await this.getProductExtraRepo().create(rest);
        itemsRestored++;
      }

      for (const item of data.productIngredients) {
        const { id, ...rest } = item;
        await this.getProductIngredientRepo().create(rest);
        itemsRestored++;
      }

      // 10. Orders
      for (const item of data.orders) {
        const { id, ...rest } = item;
        await this.getOrderRepo().create(rest);
        itemsRestored++;
      }

      // 11. Order items
      for (const item of data.orderItems) {
        const { id, ...rest } = item;
        await this.getOrderItemRepo().create(rest);
        itemsRestored++;
      }

      // 12. Order item extras
      for (const item of data.orderItemExtras) {
        const { id, ...rest } = item;
        await this.getOrderItemExtraRepo().create(rest);
        itemsRestored++;
      }

      return {
        success: true,
        message: 'Backup restored successfully',
        itemsRestored,
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        message: 'Failed to restore backup: ' + (error as Error).message,
      };
    }
  }

  /**
   * Export backup to JSON file
   */
  async exportBackupToFile(backup: BackupData, filename?: string): Promise<void> {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `simple-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Import backup from JSON file
   */
  async importBackupFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content) as BackupData;
          resolve(backup);
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate backup integrity
   */
  validateBackup(backup: BackupData): { valid: boolean; message?: string } {
    if (!backup.version) {
      return { valid: false, message: 'Missing backup version' };
    }

    if (!backup.createdAt) {
      return { valid: false, message: 'Missing backup creation date' };
    }

    if (!backup.data) {
      return { valid: false, message: 'Missing backup data' };
    }

    // Check for required tables (only if not encrypted)
    if (!backup.encrypted) {
      const requiredTables = ['codeTables', 'users', 'categories', 'products'];
      for (const table of requiredTables) {
        if (!backup.data[table as keyof typeof backup.data]) {
          return { valid: false, message: `Missing required table: ${table}` };
        }
      }
    }

    return { valid: true };
  }

  // Private helper methods

  private async sanitizeUsers(users: any[]): Promise<any[]> {
    // Don't include sensitive data in backup (like password hashes)
    // Users will need to reset passwords after restore
    return users.map((user) => ({
      ...user,
      passwordHash: '', // Clear password hash for security
    }));
  }

  private async encryptData(data: any, password: string): Promise<string> {
    // Simple encryption using Web Crypto API
    try {
      const encoder = new TextEncoder();
      const dataString = JSON.stringify(data);
      const dataBuffer = encoder.encode(dataString);

      // Generate key from password
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey'],
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('simple-pos-salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, dataBuffer);

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  private async decryptData(encryptedString: string, password: string): Promise<any> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedString), (c) => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Generate key from password
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey'],
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('simple-pos-salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData,
      );

      const decryptedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - invalid password or corrupted backup');
    }
  }

  // Repository getters based on platform

  private getCodeTableRepo() {
    return this.platformService.isTauri() ? this.sqliteCodeTableRepo : this.indexedDBCodeTableRepo;
  }

  private getCodeTranslationRepo() {
    return this.platformService.isTauri()
      ? this.sqliteCodeTranslationRepo
      : this.indexedDBCodeTranslationRepo;
  }

  private getUserRepo() {
    return this.platformService.isTauri() ? this.sqliteUserRepo : this.indexedDBUserRepo;
  }

  private getTableRepo() {
    return this.platformService.isTauri() ? this.sqliteTableRepo : this.indexedDBTableRepo;
  }

  private getCategoryRepo() {
    return this.platformService.isTauri() ? this.sqliteCategoryRepo : this.indexedDBCategoryRepo;
  }

  private getProductRepo() {
    return this.platformService.isTauri() ? this.sqliteProductRepo : this.indexedDBProductRepo;
  }

  private getVariantRepo() {
    return this.platformService.isTauri() ? this.sqliteVariantRepo : this.indexedDBVariantRepo;
  }

  private getExtraRepo() {
    return this.platformService.isTauri() ? this.sqliteExtraRepo : this.indexedDBExtraRepo;
  }

  private getIngredientRepo() {
    return this.platformService.isTauri()
      ? this.sqliteIngredientRepo
      : this.indexedDBIngredientRepo;
  }

  private getProductExtraRepo() {
    return this.platformService.isTauri()
      ? this.sqliteProductExtraRepo
      : this.indexedDBProductExtraRepo;
  }

  private getProductIngredientRepo() {
    return this.platformService.isTauri()
      ? this.sqliteProductIngredientRepo
      : this.indexedDBProductIngredientRepo;
  }

  private getOrderRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderRepo : this.indexedDBOrderRepo;
  }

  private getOrderItemRepo() {
    return this.platformService.isTauri() ? this.sqliteOrderItemRepo : this.indexedDBOrderItemRepo;
  }

  private getOrderItemExtraRepo() {
    return this.platformService.isTauri()
      ? this.sqliteOrderItemExtraRepo
      : this.indexedDBOrderItemExtraRepo;
  }
}
