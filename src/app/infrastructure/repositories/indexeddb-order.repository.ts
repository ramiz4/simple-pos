import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Order } from '../../domain/entities/order.interface';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBOrderRepository implements BaseRepository<Order> {
  private readonly DB_NAME = 'SimpleDatabase';
  private readonly STORE_NAME = 'order';
  private readonly DB_VERSION = 3;
  private db: IDBDatabase | null = null;

  async findById(id: number): Promise<Order | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<Order[]> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const id = Date.now();
      const newEntity = { ...entity, id };
      const request = store.add(newEntity);

      request.onsuccess = () => resolve(newEntity);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: number, entity: Partial<Order>): Promise<Order> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    const db = await this.getDb();
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

  async getNextOrderNumber(): Promise<string> {
    const allOrders = await this.findAll();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todayOrders = allOrders.filter((o) => o.orderNumber.startsWith(today));
    const sequence = (todayOrders.length + 1).toString().padStart(4, '0');
    return `${today}${sequence}`;
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
          store.createIndex('orderNumber', 'orderNumber', { unique: true });
          store.createIndex('statusId', 'statusId', { unique: false });
          store.createIndex('tableId', 'tableId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }
}
