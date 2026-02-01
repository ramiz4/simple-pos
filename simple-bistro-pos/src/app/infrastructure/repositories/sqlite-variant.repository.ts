import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Variant } from '../../domain/entities/variant.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteVariantRepository implements BaseRepository<Variant> {
  private db: Database | null = null;

  async findById(id: number): Promise<Variant | null> {
    const db = await this.getDb();
    const results = await db.select<Variant[]>('SELECT * FROM variant WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Variant[]> {
    const db = await this.getDb();
    return await db.select<Variant[]>('SELECT * FROM variant');
  }

  async findByProduct(productId: number): Promise<Variant[]> {
    const db = await this.getDb();
    return await db.select<Variant[]>('SELECT * FROM variant WHERE productId = ?', [productId]);
  }

  async create(entity: Omit<Variant, 'id'>): Promise<Variant> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO variant (productId, name, priceModifier) VALUES (?, ?, ?)',
      [entity.productId, entity.name, entity.priceModifier]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Variant>): Promise<Variant> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Variant with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE variant SET productId = ?, name = ?, priceModifier = ? WHERE id = ?',
      [updated.productId, updated.name, updated.priceModifier, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM variant WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM variant');
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
      CREATE TABLE IF NOT EXISTS variant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        name TEXT NOT NULL,
        priceModifier REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (productId) REFERENCES product (id) ON DELETE CASCADE
      )
    `);
  }
}
