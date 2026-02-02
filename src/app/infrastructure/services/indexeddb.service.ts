import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  private readonly DB_NAME = 'SimpleDatabase';
  private readonly DB_VERSION = 5;
  private db: IDBDatabase | null = null;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB connection error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`Upgrading IndexedDB from version ${event.oldVersion} to ${event.newVersion}`);

        // 1. category
        if (!db.objectStoreNames.contains('category')) {
          const store = db.createObjectStore('category', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: true });
        }

        // 2. code_table
        if (!db.objectStoreNames.contains('code_table')) {
          const store = db.createObjectStore('code_table', { keyPath: 'id' });
          store.createIndex('codeType', 'codeType', { unique: false });
          store.createIndex('code', 'code', { unique: false });
        }

        // 3. code_translation
        if (!db.objectStoreNames.contains('code_translation')) {
          const store = db.createObjectStore('code_translation', { keyPath: 'id' });
          store.createIndex('codeTableId', 'codeTableId', { unique: false });
        }

        // 4. extra
        if (!db.objectStoreNames.contains('extra')) {
          const store = db.createObjectStore('extra', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: true });
        }

        // 5. ingredient
        if (!db.objectStoreNames.contains('ingredient')) {
          const store = db.createObjectStore('ingredient', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: true });
        }

        // 6. order
        if (!db.objectStoreNames.contains('order')) {
          const store = db.createObjectStore('order', { keyPath: 'id' });
          store.createIndex('orderNumber', 'orderNumber', { unique: true });
          store.createIndex('statusId', 'statusId', { unique: false });
          store.createIndex('tableId', 'tableId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 7. order_item
        if (!db.objectStoreNames.contains('order_item')) {
          const store = db.createObjectStore('order_item', { keyPath: 'id' });
          store.createIndex('orderId', 'orderId', { unique: false });
          store.createIndex('productId', 'productId', { unique: false });
        }

        // 8. order_item_extra
        if (!db.objectStoreNames.contains('order_item_extra')) {
          const store = db.createObjectStore('order_item_extra', { keyPath: 'id' });
          store.createIndex('orderId', 'orderId', { unique: false });
          store.createIndex('orderItemId', 'orderItemId', { unique: false });
          store.createIndex('extraId', 'extraId', { unique: false });
        }

        // 9. product
        if (!db.objectStoreNames.contains('product')) {
          const store = db.createObjectStore('product', { keyPath: 'id' });
          store.createIndex('categoryId', 'categoryId', { unique: false });
        }

        // 10. product_extra
        if (!db.objectStoreNames.contains('product_extra')) {
          const store = db.createObjectStore('product_extra', { keyPath: 'id' });
          store.createIndex('productId_extraId', ['productId', 'extraId'], { unique: true });
        }

        // 11. product_ingredient
        if (!db.objectStoreNames.contains('product_ingredient')) {
          const store = db.createObjectStore('product_ingredient', { keyPath: 'id' });
          store.createIndex('productId_ingredientId', ['productId', 'ingredientId'], {
            unique: true,
          });
        }

        // 12. table (using store name 'table' based on repository file name, confirm if it matches others?)
        // The file indexeddb-table.repository.ts likely uses 'table' or 'tables'.
        // Based on grep output: src/app/infrastructure/repositories/indexeddb-table.repository.ts:          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        // Assuming STORE_NAME is 'table' (singular) for consistency, but if it is 'tables' (plural)...
        // Most others are singular ('category', 'product'). I will assume 'table'.
        // Wait, 'table' is a reserved word in SQL but fine here.
        if (!db.objectStoreNames.contains('table')) {
          const store = db.createObjectStore('table', { keyPath: 'id' });
          store.createIndex('number', 'number', { unique: true });
        }

        // 13. user
        if (!db.objectStoreNames.contains('user')) {
          const store = db.createObjectStore('user', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('name_organizationId', ['name', 'organizationId'], { unique: true });
          store.createIndex('email', 'email', { unique: false });
          store.createIndex('organizationId', 'organizationId', { unique: false });
        } else {
          // Handle upgrade from v4 to v5 - add new indexes to existing user store
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const store = transaction.objectStore('user');
            // Check if indexes already exist before creating
            if (!store.indexNames.contains('name_organizationId')) {
              store.createIndex('name_organizationId', ['name', 'organizationId'], { unique: true });
            }
            if (!store.indexNames.contains('email')) {
              store.createIndex('email', 'email', { unique: false });
            }
            if (!store.indexNames.contains('organizationId')) {
              store.createIndex('organizationId', 'organizationId', { unique: false });
            }
            // Update name index to be non-unique if it exists as unique
            if (store.indexNames.contains('name')) {
              const nameIndex = store.index('name');
              if (nameIndex.unique) {
                store.deleteIndex('name');
                store.createIndex('name', 'name', { unique: false });
              }
            }
          }
        }

        // 14. organization
        if (!db.objectStoreNames.contains('organization')) {
          const store = db.createObjectStore('organization', { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: true });
        }

        // 15. variant
        if (!db.objectStoreNames.contains('variant')) {
          const store = db.createObjectStore('variant', { keyPath: 'id' });
          store.createIndex('productId', 'productId', { unique: false });
        }
      };
    });

    return this.connectionPromise;
  }
}
