import { Injectable } from '@angular/core';
import { CodeTranslation } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { IndexedDBService } from '../services/indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBCodeTranslationRepository implements BaseRepository<CodeTranslation> {
  private readonly STORE_NAME = 'code_translation';

  constructor(private indexedDBService: IndexedDBService) {}

  async findById(id: number): Promise<CodeTranslation | null> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<CodeTranslation[]> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async findByCodeTableId(codeTableId: number): Promise<CodeTranslation[]> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('codeTableId');
      const request = index.getAll(codeTableId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async findByCodeTableIdAndLanguage(
    codeTableId: number,
    language: string,
  ): Promise<CodeTranslation | null> {
    const translations = await this.findByCodeTableId(codeTableId);
    return translations.find((t) => t.language === language) || null;
  }

  async create(entity: Omit<CodeTranslation, 'id'>): Promise<CodeTranslation> {
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

  async update(id: number, entity: Partial<CodeTranslation>): Promise<CodeTranslation> {
    const db = await this.indexedDBService.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CodeTranslation with id ${id} not found`);

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
