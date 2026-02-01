import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { CodeTable } from '../../domain/entities/code-table.interface';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBCodeTableRepository implements BaseRepository<CodeTable> {
  private readonly DB_NAME = 'BistroDatabase';
  private readonly STORE_NAME = 'code_table';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;

  async findById(id: number): Promise<CodeTable | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<CodeTable[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async findByCodeType(codeType: string): Promise<CodeTable[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('codeType');
      const request = index.getAll(codeType);

      request.onsuccess = () => {
        const results = (request.result || [])
          .filter(item => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async findByCodeTypeAndCode(codeType: string, code: string): Promise<CodeTable | null> {
    const items = await this.findByCodeType(codeType);
    return items.find(item => item.code === code) || null;
  }

  async create(entity: Omit<CodeTable, 'id'>): Promise<CodeTable> {
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

  async update(id: number, entity: Partial<CodeTable>): Promise<CodeTable> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CodeTable with id ${id} not found`);

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
          store.createIndex('codeType', 'codeType', { unique: false });
          store.createIndex('code', 'code', { unique: false });
        }
      };
    });
  }
}
