import { Injectable } from '@angular/core';
import { OrderItemExtra } from '../../domain/entities/order-item-extra.interface';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBOrderItemExtraRepository {
  private readonly DB_NAME = 'SimpleDatabase';
  private readonly STORE_NAME = 'order_item_extra';
  private readonly DB_VERSION = 4;
  private db: IDBDatabase | null = null;

  async create(entity: OrderItemExtra): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const compositeKey = {
        ...entity,
        id: `${entity.orderItemId}-${entity.extraId}`,
      };
      const request = store.add(compositeKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async findByOrderItemId(orderItemId: number): Promise<OrderItemExtra[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('orderItemId');
      const request = index.getAll(orderItemId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async findByOrderId(orderId: number): Promise<OrderItemExtra[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('orderId');
      const request = index.getAll(orderId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteByOrderItemId(orderItemId: number): Promise<void> {
    const items = await this.findByOrderItemId(orderItemId);
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      items.forEach((item: any) => {
        store.delete(item.id);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteByOrderId(orderId: number): Promise<void> {
    const items = await this.findByOrderId(orderId);
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      items.forEach((item: any) => {
        store.delete(item.id);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('orderId', 'orderId', { unique: false });
          store.createIndex('orderItemId', 'orderItemId', { unique: false });
          store.createIndex('extraId', 'extraId', { unique: false });
        }
      };
    });
  }
}
