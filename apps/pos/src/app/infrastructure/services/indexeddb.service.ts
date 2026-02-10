import { Injectable } from '@angular/core';

// Export DB name constant for use in tests
export const INDEXEDDB_NAME = 'SimpleDatabase';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  private readonly DB_NAME = INDEXEDDB_NAME;
  /**
   * BREAKING CHANGE: Database version reset from 5 to 1
   *
   * This is a breaking change for existing users with data at version 5.
   * The database schema has been completely refactored from 'organization' to 'account',
   * requiring a fresh start. Error handling automatically deletes and reloads the database
   * on version conflicts (lines 23-26), resulting in complete data loss for existing users.
   *
   * Migration strategy: This change requires existing users to clear their local data
   * or accept automatic database reset on first load.
   */
  private readonly DB_VERSION = 3;
  private db: IDBDatabase | null = null;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB connection error:', error);

        if (error?.name === 'VersionError') {
          console.warn(
            'VersionError detected. The local database version is higher than ' + this.DB_VERSION,
          );
          console.warn('Automatically resetting database to match the codebase version...');

          request.transaction?.abort();
          this.db = null;
          this.connectionPromise = null;

          const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);

          deleteRequest.onsuccess = () => {
            console.log('Database deleted successfully. Reloading page...');
            window.location.reload();
          };

          deleteRequest.onerror = (e) => {
            console.error('Failed to delete database:', (e.target as IDBOpenDBRequest).error);
            reject(error);
          };

          return;
        }

        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${event.newVersion}`);

        // Initial setup for new database
        if (oldVersion < 1) {
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

          // 12. table
          if (!db.objectStoreNames.contains('table')) {
            const store = db.createObjectStore('table', { keyPath: 'id' });
            store.createIndex('number', 'number', { unique: true });
          }

          // 13. user
          if (!db.objectStoreNames.contains('user')) {
            const store = db.createObjectStore('user', { keyPath: 'id' });
            store.createIndex('name', 'name', { unique: false });
            store.createIndex('email', 'email', { unique: true });
            store.createIndex('accountId', 'accountId', { unique: false });
            store.createIndex('accountName', ['accountId', 'name'], { unique: true });
          }

          // 14. account
          if (!db.objectStoreNames.contains('account')) {
            const store = db.createObjectStore('account', { keyPath: 'id' });
            store.createIndex('email', 'email', { unique: true });
          }

          // 15. variant
          if (!db.objectStoreNames.contains('variant')) {
            const store = db.createObjectStore('variant', { keyPath: 'id' });
            store.createIndex('productId', 'productId', { unique: false });
          }
        }

        if (oldVersion < 2) {
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const orderItemStore = transaction.objectStore('order_item');
            if (!orderItemStore.indexNames.contains('statusId')) {
              orderItemStore.createIndex('statusId', 'statusId', { unique: false });
            }
            if (!orderItemStore.indexNames.contains('createdAt')) {
              orderItemStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
          }
        }

        if (oldVersion < 3) {
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const syncStores = [
              'account',
              'user',
              'code_table',
              'code_translation',
              'category',
              'extra',
              'ingredient',
              'table',
              'product',
              'variant',
              'product_extra',
              'product_ingredient',
              'order',
              'order_item',
              'order_item_extra',
            ];

            for (const storeName of syncStores) {
              if (!db.objectStoreNames.contains(storeName)) {
                continue;
              }
              const store = transaction.objectStore(storeName);

              if (!store.indexNames.contains('cloudId')) {
                store.createIndex('cloudId', 'cloudId', { unique: false });
              }
              if (!store.indexNames.contains('lastModifiedAt')) {
                store.createIndex('lastModifiedAt', 'lastModifiedAt', { unique: false });
              }
              if (!store.indexNames.contains('isDeleted')) {
                store.createIndex('isDeleted', 'isDeleted', { unique: false });
              }
            }
          }
        }
      };
    });

    return this.connectionPromise;
  }
}
