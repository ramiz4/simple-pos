import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { ProductExtra } from '../../domain/entities/product-extra.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteProductExtraRepository implements BaseRepository<ProductExtra> {
  private db: Database | null = null;

  async findById(id: number): Promise<ProductExtra | null> {
    const db = await this.getDb();
    const results = await db.select<ProductExtra[]>('SELECT * FROM product_extra WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<ProductExtra[]> {
    const db = await this.getDb();
    return await db.select<ProductExtra[]>('SELECT * FROM product_extra');
  }

  async findByProduct(productId: number): Promise<ProductExtra[]> {
    const db = await this.getDb();
    return await db.select<ProductExtra[]>('SELECT * FROM product_extra WHERE productId = ?', [productId]);
  }

  async create(entity: Omit<ProductExtra, 'id'>): Promise<ProductExtra> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO product_extra (productId, extraId) VALUES (?, ?)',
      [entity.productId, entity.extraId]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<ProductExtra>): Promise<ProductExtra> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`ProductExtra with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE product_extra SET productId = ?, extraId = ? WHERE id = ?',
      [updated.productId, updated.extraId, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM product_extra WHERE id = ?', [id]);
  }

  async deleteByProductAndExtra(productId: number, extraId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM product_extra WHERE productId = ? AND extraId = ?', [productId, extraId]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM product_extra');
    return results[0].count;
  }

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await Database.load('sqlite:bistro.db');
      await this.initTable();
    }
    return this.db;
  }

  private async initTable(): Promise<void> {
    const db = await this.getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_extra (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        extraId INTEGER NOT NULL,
        FOREIGN KEY (productId) REFERENCES product (id) ON DELETE CASCADE,
        FOREIGN KEY (extraId) REFERENCES extra (id) ON DELETE CASCADE,
        UNIQUE (productId, extraId)
      )
    `);
  }
}
