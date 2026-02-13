import { Injectable } from '@angular/core';
import { BaseRepository, TestEntity } from '@simple-pos/shared/types';

/**
 * IndexedDB repository implementation for web/PWA mode
 */
@Injectable({
  providedIn: 'root',
})
export class IndexedDBTestRepository implements BaseRepository<TestEntity> {
  private readonly DB_NAME = 'SimpleDatabase_Test';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'test_entity';
  private db: IDBDatabase | null = null;

  private async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private getObjectStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([this.STORE_NAME], mode);
    return transaction.objectStore(this.STORE_NAME);
  }

  async findById(id: number): Promise<TestEntity | null> {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('readonly');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<TestEntity[]> {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('readonly');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as TestEntity[];
        resolve(results.sort((a, b) => b.id - a.id));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: Omit<TestEntity, 'id'>): Promise<TestEntity> {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('readwrite');
      const entityWithTimestamp = {
        ...entity,
        createdAt: new Date().toISOString(),
      };
      const request = store.add(entityWithTimestamp);

      request.onsuccess = async () => {
        const id = request.result as number;
        const newEntity = await this.findById(id);
        if (!newEntity) {
          reject(new Error('Failed to create entity'));
          return;
        }
        resolve(newEntity);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: number, entity: Partial<TestEntity>): Promise<TestEntity> {
    await this.initialize();
    const existing = await this.findById(id);
    if (!existing) throw new Error('Entity not found');

    const updated = { ...existing, ...entity, id };

    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('readwrite');
      const request = store.put(updated);

      request.onsuccess = async () => {
        const result = await this.findById(id);
        if (!result) {
          reject(new Error('Entity not found after update'));
          return;
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: number): Promise<void> {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('readwrite');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('readonly');
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
