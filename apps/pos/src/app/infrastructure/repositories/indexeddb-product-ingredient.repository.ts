import { Injectable } from '@angular/core';
import { ProductIngredient } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { IndexedDBService } from '../services/indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBProductIngredientRepository implements BaseRepository<ProductIngredient> {
  private readonly STORE_NAME = 'product_ingredient';

  constructor(private indexedDBService: IndexedDBService) {}

  async findById(id: number): Promise<ProductIngredient | null> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(): Promise<ProductIngredient[]> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: Omit<ProductIngredient, 'id'>): Promise<ProductIngredient> {
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

  async update(id: number, entity: Partial<ProductIngredient>): Promise<ProductIngredient> {
    const db = await this.indexedDBService.getDb();
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

  async findByProduct(productId: number): Promise<ProductIngredient[]> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      // product_ingredient has index: productId_ingredientId
      // But we just want by productId.
      // IndexedDBService created index: 'productId_ingredientId' on ['productId', 'ingredientId']
      // We cannot easily use that index for just productId query without valid bounds.

      // But wait! IndexedDBService ALSO should create standard single-column indices if needed.
      // Let's check IndexedDBService (Step 22).
      // store.createIndex('productId_ingredientId', ['productId', 'ingredientId'], { unique: true });
      // It does NOT have a standalone 'productId' index on 'product_ingredient' table.

      // So we have to scan all or use a cursor. But IDB compound index can be used for prefix!
      // 'productId' is the first part of ['productId', 'ingredientId'].
      // So getAll(IDBKeyRange.bound([productId], [productId, []])) works?
      // Or just getAll(productId]? No.

      // Actually, getAll() on a compound index usually requires the full key.
      // But we can use IDBKeyRange.only(productId) ? No.
      // We can use IDBKeyRange.bound([productId, -Infinity], [productId, Infinity])

      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('productId_ingredientId');

      // Using bound to match all with productId prefix
      const range = IDBKeyRange.bound([productId], [productId, []]);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteByProductAndIngredient(productId: number, ingredientId: number): Promise<void> {
    const db = await this.indexedDBService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('productId_ingredientId');

      // Find the record using the compound index
      const range = IDBKeyRange.only([productId, ingredientId]);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          resolve();
        } else {
          resolve(); // No matching record found, but that's okay
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}
