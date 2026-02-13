import { Inject, Injectable } from '@angular/core';
import {
  Category,
  CodeTable,
  CodeTranslation,
  Extra,
  Ingredient,
  Order,
  OrderItem,
  OrderItemExtra,
  Product,
  ProductExtra,
  ProductIngredient,
  Table,
  User,
  Variant,
} from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import {
  CATEGORY_REPOSITORY,
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
  EXTRA_REPOSITORY,
  INGREDIENT_REPOSITORY,
  ORDER_ITEM_EXTRA_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_EXTRA_REPOSITORY,
  PRODUCT_INGREDIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
  TABLE_REPOSITORY,
  USER_REPOSITORY,
  VARIANT_REPOSITORY,
} from '../../infrastructure/tokens/repository.tokens';

export interface BackupData {
  version: string;
  createdAt: string;
  encrypted: boolean;
  data:
    | {
        codeTables: CodeTable[];
        codeTranslations: CodeTranslation[];
        users: User[];
        tables: Table[];
        categories: Category[];
        products: Product[];
        variants: Variant[];
        extras: Extra[];
        ingredients: Ingredient[];
        productExtras: ProductExtra[];
        productIngredients: ProductIngredient[];
        orders: Order[];
        orderItems: OrderItem[];
        orderItemExtras: OrderItemExtra[];
      }
    | string;
}

export type BackupDataInner = Exclude<BackupData['data'], string>;

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
    @Inject(CODE_TABLE_REPOSITORY) private codeTableRepo: BaseRepository<CodeTable>,
    @Inject(CODE_TRANSLATION_REPOSITORY)
    private codeTranslationRepo: BaseRepository<CodeTranslation>,
    @Inject(USER_REPOSITORY) private userRepo: BaseRepository<User>,
    @Inject(TABLE_REPOSITORY) private tableRepo: BaseRepository<Table>,
    @Inject(CATEGORY_REPOSITORY) private categoryRepo: BaseRepository<Category>,
    @Inject(PRODUCT_REPOSITORY) private productRepo: BaseRepository<Product>,
    @Inject(VARIANT_REPOSITORY) private variantRepo: BaseRepository<Variant>,
    @Inject(EXTRA_REPOSITORY) private extraRepo: BaseRepository<Extra>,
    @Inject(INGREDIENT_REPOSITORY) private ingredientRepo: BaseRepository<Ingredient>,
    @Inject(PRODUCT_EXTRA_REPOSITORY) private productExtraRepo: BaseRepository<ProductExtra>,
    @Inject(PRODUCT_INGREDIENT_REPOSITORY)
    private productIngredientRepo: BaseRepository<ProductIngredient>,
    @Inject(ORDER_REPOSITORY) private orderRepo: BaseRepository<Order>,
    @Inject(ORDER_ITEM_REPOSITORY) private orderItemRepo: BaseRepository<OrderItem>,
    @Inject(ORDER_ITEM_EXTRA_REPOSITORY) private orderItemExtraRepo: BaseRepository<OrderItemExtra>,
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
          codeTables: await this.codeTableRepo.findAll(),
          codeTranslations: await this.codeTranslationRepo.findAll(),
          users: await this.sanitizeUsers(await this.userRepo.findAll()),
          tables: await this.tableRepo.findAll(),
          categories: await this.categoryRepo.findAll(),
          products: await this.productRepo.findAll(),
          variants: await this.variantRepo.findAll(),
          extras: await this.extraRepo.findAll(),
          ingredients: await this.ingredientRepo.findAll(),
          productExtras: await this.productExtraRepo.findAll(),
          productIngredients: await this.productIngredientRepo.findAll(),
          orders: await this.orderRepo.findAll(),
          orderItems: await this.orderItemRepo.findAll(),
          orderItemExtras: await this.orderItemExtraRepo.findAll(),
        },
      };

      if (options?.encrypt && options?.password) {
        backup.data = await this.encryptData(backup.data as BackupDataInner, options.password);
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

      let data: BackupDataInner;

      // Decrypt if needed
      if (backup.encrypted) {
        if (!password) {
          return {
            success: false,
            message: 'Password required for encrypted backup',
          };
        }
        data = await this.decryptData(backup.data as string, password);
      } else {
        data = backup.data as BackupDataInner;
      }

      // Clear existing data (optional - could be a parameter)
      // await this.clearAllData();

      // Restore data in correct order (respecting foreign key dependencies)
      let itemsRestored = 0;

      // 1. Code tables and translations (foundation)
      for (const item of data.codeTables) {
        const { id: _id, ...rest } = item;
        await this.codeTableRepo.create(rest);
        itemsRestored++;
      }

      for (const item of data.codeTranslations) {
        const { id: _id, ...rest } = item;
        await this.codeTranslationRepo.create(rest);
        itemsRestored++;
      }

      // 2. Users
      for (const item of data.users) {
        const { id: _id, ...rest } = item;
        await this.userRepo.create(rest);
        itemsRestored++;
      }

      // 3. Tables
      for (const item of data.tables) {
        const { id: _id, ...rest } = item;
        await this.tableRepo.create(rest);
        itemsRestored++;
      }

      // 4. Categories
      for (const item of data.categories) {
        const { id: _id, ...rest } = item;
        await this.categoryRepo.create(rest);
        itemsRestored++;
      }

      // 5. Products
      for (const item of data.products) {
        const { id: _id, ...rest } = item;
        await this.productRepo.create(rest);
        itemsRestored++;
      }

      // 6. Variants
      for (const item of data.variants) {
        const { id: _id, ...rest } = item;
        await this.variantRepo.create(rest);
        itemsRestored++;
      }

      // 7. Extras
      for (const item of data.extras) {
        const { id: _id, ...rest } = item;
        await this.extraRepo.create(rest);
        itemsRestored++;
      }

      // 8. Ingredients
      for (const item of data.ingredients) {
        const { id: _id, ...rest } = item;
        await this.ingredientRepo.create(rest);
        itemsRestored++;
      }

      // 9. Product relationships
      for (const item of data.productExtras) {
        const { id: _id, ...rest } = item;
        await this.productExtraRepo.create(rest);
        itemsRestored++;
      }

      for (const item of data.productIngredients) {
        const { id: _id, ...rest } = item;
        await this.productIngredientRepo.create(rest);
        itemsRestored++;
      }

      // 10. Orders
      for (const item of data.orders) {
        const { id: _id, ...rest } = item;
        await this.orderRepo.create(rest);
        itemsRestored++;
      }

      // 11. Order items
      for (const item of data.orderItems) {
        const { id: _id, ...rest } = item;
        await this.orderItemRepo.create(rest);
        itemsRestored++;
      }

      // 12. Order item extras
      for (const item of data.orderItemExtras) {
        const { id: _id, ...rest } = item;
        await this.orderItemExtraRepo.create(rest);
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
        } catch (_error) {
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

  private async sanitizeUsers(users: User[]): Promise<User[]> {
    // Don't include sensitive data in backup (like password hashes)
    // Users will need to reset passwords after restore
    return users.map((user) => ({
      ...user,
      passwordHash: '', // Clear password hash for security
    }));
  }

  private async encryptData(data: BackupDataInner, password: string): Promise<string> {
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

  private async decryptData(encryptedString: string, password: string): Promise<BackupDataInner> {
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
      return JSON.parse(decryptedString) as BackupDataInner;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - invalid password or corrupted backup');
    }
  }
}
