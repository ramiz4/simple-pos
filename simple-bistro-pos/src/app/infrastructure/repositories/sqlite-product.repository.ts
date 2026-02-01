import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Product } from '../../domain/entities/product.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteProductRepository implements BaseRepository<Product> {
  private db: Database | null = null;

  async findById(id: number): Promise<Product | null> {
    const db = await this.getDb();
    const results = await db.select<Product[]>('SELECT * FROM product WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Product[]> {
    const db = await this.getDb();
    return await db.select<Product[]>('SELECT * FROM product');
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    const db = await this.getDb();
    return await db.select<Product[]>('SELECT * FROM product WHERE categoryId = ?', [categoryId]);
  }

  async create(entity: Omit<Product, 'id'>): Promise<Product> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO product (name, categoryId, price, stock, isAvailable) VALUES (?, ?, ?, ?, ?)',
      [entity.name, entity.categoryId, entity.price, entity.stock, entity.isAvailable ? 1 : 0]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Product>): Promise<Product> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Product with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE product SET name = ?, categoryId = ?, price = ?, stock = ?, isAvailable = ? WHERE id = ?',
      [updated.name, updated.categoryId, updated.price, updated.stock, updated.isAvailable ? 1 : 0, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM product WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM product');
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
      CREATE TABLE IF NOT EXISTS product (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        categoryId INTEGER NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        isAvailable INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (categoryId) REFERENCES category (id)
      )
    `);
  }
}
