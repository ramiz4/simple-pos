import { Injectable } from '@angular/core';
import { Order } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { IndexedDBService } from '../services/indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBOrderRepository implements BaseRepository<Order> {
  private readonly STORE_NAME = 'order';

  constructor(private indexedDBService: IndexedDBService) {}

  async findById(id: number): Promise<Order | null> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<Order[]> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const orders = request.result || [];
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(orders);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: Omit<Order, 'id'>): Promise<Order> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      // Use high-resolution time if available, or add random to prevent collisions
      const id = Date.now() + Math.random();
      const newEntity = { ...entity, id };
      const request = store.add(newEntity);

      request.onsuccess = () => resolve(newEntity);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: number, entity: Partial<Order>): Promise<Order> {
    const db = await this.indexedDBService.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Order with id ${id} not found`);

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

  async findActiveOrders(): Promise<Order[]> {
    const allOrders = await this.findAll();
    // Filter out COMPLETED and CANCELLED orders (will need to check statusId via EnumMappingService)
    return allOrders;
  }

  async findByStatus(statusId: number): Promise<Order[]> {
    const allOrders = await this.findAll();
    return allOrders.filter((order) => order.statusId === statusId);
  }

  async findByTable(tableId: number): Promise<Order[]> {
    const allOrders = await this.findAll();
    return allOrders.filter((order) => order.tableId === tableId);
  }

  async findByTableAndStatus(tableId: number, statusIds: number[]): Promise<Order | null> {
    const allOrders = await this.findAll();
    const filtered = allOrders
      .filter((order) => order.tableId === tableId && statusIds.includes(order.statusId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered.length > 0 ? filtered[0] : null;
  }

  async getNextOrderNumber(): Promise<string> {
    const allOrders = await this.findAll();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todayOrders = allOrders.filter((o) => o.orderNumber.startsWith(today));
    const baseSequence = todayOrders.length + 1;
    // Add random suffix to ensure uniqueness even for rapid consecutive orders
    const randomSuffix = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    const sequence = baseSequence.toString().padStart(4, '0');
    return `${today}${sequence}${randomSuffix}`;
  }
}
