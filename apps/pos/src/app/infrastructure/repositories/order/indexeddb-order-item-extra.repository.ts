import { Injectable } from '@angular/core';
import { OrderItemExtra } from '@simple-pos/shared/types';
import { OrderItemExtraRepository } from '../../../core/interfaces/order-item-extra-repository.interface';
import { IndexedDBService } from '../../services/indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBOrderItemExtraRepository implements OrderItemExtraRepository {
  private readonly STORE_NAME = 'order_item_extra';

  constructor(private indexedDBService: IndexedDBService) {}

  async findById(id: number): Promise<OrderItemExtra | null> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: OrderItemExtra): Promise<OrderItemExtra> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const id = Date.now() + Math.random();
      const newEntity = { ...entity, id };
      const request = store.add(newEntity);

      request.onsuccess = () => resolve(newEntity as OrderItemExtra);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: number, entity: Partial<OrderItemExtra>): Promise<OrderItemExtra> {
    const db = await this.indexedDBService.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`OrderItemExtra with id ${id} not found`);

    const updated = { ...existing, ...entity };
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: number): Promise<void> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<OrderItemExtra[]> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async findByOrderItemId(orderItemId: number): Promise<OrderItemExtra[]> {
    const db = await this.indexedDBService.getDb();
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
    const db = await this.indexedDBService.getDb();
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
    const db = await this.indexedDBService.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      items.forEach((item) => {
        if (item.id !== undefined && item.id !== null) {
          store.delete(item.id as IDBValidKey);
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteByOrderId(orderId: number): Promise<void> {
    const items = await this.findByOrderId(orderId);
    const db = await this.indexedDBService.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      items.forEach((item: OrderItemExtra) => {
        if (item.id !== undefined && item.id !== null) {
          store.delete(item.id as IDBValidKey);
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
