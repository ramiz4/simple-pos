import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { ProductIngredient } from '../../domain/entities/product-ingredient.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteProductIngredientRepository implements BaseRepository<ProductIngredient> {
  private db: Database | null = null;

  async findById(id: number): Promise<ProductIngredient | null> {
    const db = await this.getDb();
    const results = await db.select<ProductIngredient[]>(
      'SELECT * FROM product_ingredient WHERE id = ?',
      [id],
    );
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<ProductIngredient[]> {
    const db = await this.getDb();
    return await db.select<ProductIngredient[]>('SELECT * FROM product_ingredient');
  }

  async findByProduct(productId: number): Promise<ProductIngredient[]> {
    const db = await this.getDb();
    return await db.select<ProductIngredient[]>(
      'SELECT * FROM product_ingredient WHERE productId = ?',
      [productId],
    );
  }

  async create(entity: Omit<ProductIngredient, 'id'>): Promise<ProductIngredient> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO product_ingredient (productId, ingredientId, quantity) VALUES (?, ?, ?)',
      [entity.productId, entity.ingredientId, entity.quantity],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<ProductIngredient>): Promise<ProductIngredient> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`ProductIngredient with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE product_ingredient SET productId = ?, ingredientId = ?, quantity = ? WHERE id = ?',
      [updated.productId, updated.ingredientId, updated.quantity, id],
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM product_ingredient WHERE id = ?', [id]);
  }

  async deleteByProductAndIngredient(productId: number, ingredientId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM product_ingredient WHERE productId = ? AND ingredientId = ?', [
      productId,
      ingredientId,
    ]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM product_ingredient',
    );
    return results[0].count;
  }

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await Database.load('sqlite:simple-pos.db');
      await this.initTable();
    }
    return this.db;
  }

  private async initTable(): Promise<void> {
    const db = await this.getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_ingredient (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        ingredientId INTEGER NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY (productId) REFERENCES product (id) ON DELETE CASCADE,
        FOREIGN KEY (ingredientId) REFERENCES ingredient (id) ON DELETE CASCADE,
        UNIQUE (productId, ingredientId)
      )
    `);
  }
}
