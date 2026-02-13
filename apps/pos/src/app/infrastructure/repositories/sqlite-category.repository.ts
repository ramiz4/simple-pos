import { Injectable } from '@angular/core';
import { BaseRepository, Category } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';

@Injectable({
  providedIn: 'root',
})
export class SQLiteCategoryRepository implements BaseRepository<Category> {
  private db: Database | null = null;

  async findById(id: number): Promise<Category | null> {
    const db = await this.getDb();
    const results = await db.select<Category[]>('SELECT * FROM category WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Category[]> {
    const db = await this.getDb();
    return await db.select<Category[]>('SELECT * FROM category ORDER BY sortOrder');
  }

  async create(entity: Omit<Category, 'id'>): Promise<Category> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO category (name, sortOrder, isActive) VALUES (?, ?, ?)',
      [entity.name, entity.sortOrder, entity.isActive ? 1 : 0],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Category>): Promise<Category> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Category with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute('UPDATE category SET name = ?, sortOrder = ?, isActive = ? WHERE id = ?', [
      updated.name,
      updated.sortOrder,
      updated.isActive ? 1 : 0,
      id,
    ]);
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM category WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM category');
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
      CREATE TABLE IF NOT EXISTS category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1
      )
    `);
  }
}
