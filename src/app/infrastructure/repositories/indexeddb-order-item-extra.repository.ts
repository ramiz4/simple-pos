import { Injectable } from '@angular/core';
import { OrderItemExtra } from '../../domain/entities/order-item-extra.interface';
import { IndexedDBService } from '../services/indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBOrderItemExtraRepository {
  private readonly STORE_NAME = 'order_item_extra';

  constructor(private indexedDBService: IndexedDBService) {}

  async create(entity: OrderItemExtra): Promise<void> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const compositeKey = {
        ...entity,
        id: `${entity.orderItemId}-${entity.extraId}-${Math.random()}`,
      };
      const request = store.add(compositeKey);

      request.onsuccess = () => resolve();
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

      items.forEach((item: any) => {
        store.delete(item.id);
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

      items.forEach((item: any) => {
        store.delete(item.id);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
