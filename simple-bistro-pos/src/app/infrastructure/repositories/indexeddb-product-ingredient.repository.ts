import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { ProductIngredient } from '../../domain/entities/product-ingredient.interface';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBProductIngredientRepository implements BaseRepository<ProductIngredient> {
  private readonly DB_NAME = 'BistroDatabase';
  private readonly STORE_NAME = 'product_ingredient';
  private readonly DB_VERSION = 2;
  private db: IDBDatabase | null = null;

  async findById(id: number): Promise<ProductIngredient | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<ProductIngredient[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: Omit<ProductIngredient, 'id'>): Promise<ProductIngredient> {
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

  async update(id: number, entity: Partial<ProductIngredient>): Promise<ProductIngredient> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`ProductIngredient with id ${id} not found`);

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

  async findByProduct(productId: number): Promise<ProductIngredient[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('productId_ingredientId');
      const range = IDBKeyRange.bound([productId], [productId, []]);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteByProductAndIngredient(productId: number, ingredientId: number): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('productId_ingredientId');
      const range = IDBKeyRange.only([productId, ingredientId]);
      const request = index.openCursor(range);

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
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
          store.createIndex('productId_ingredientId', ['productId', 'ingredientId'], { unique: true });
        }
      };
    });
  }
}
