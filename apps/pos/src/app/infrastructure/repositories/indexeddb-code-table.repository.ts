import { Injectable } from '@angular/core';
import { BaseRepository, CodeTable } from '@simple-pos/shared/types';
import { IndexedDBService } from '../services/indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBCodeTableRepository implements BaseRepository<CodeTable> {
  private readonly STORE_NAME = 'code_table';

  constructor(private indexedDBService: IndexedDBService) {}

  async findById(id: number): Promise<CodeTable | null> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<CodeTable[]> {
    const db = await this.indexedDBService.getDb();
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
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('codeType');
      const request = index.getAll(codeType);

      request.onsuccess = () => {
        const results = (request.result || [])
          .filter((item) => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async findByCodeTypeAndCode(codeType: string, code: string): Promise<CodeTable | null> {
    const items = await this.findByCodeType(codeType);
    return items.find((item) => item.code === code) || null;
  }

  async create(entity: Omit<CodeTable, 'id'>): Promise<CodeTable> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const id = Date.now() + Math.random();
      const newEntity = { ...entity, id };
      const request = store.add(newEntity);

      request.onsuccess = () => resolve(newEntity);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: number, entity: Partial<CodeTable>): Promise<CodeTable> {
    const db = await this.indexedDBService.getDb();
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
}
