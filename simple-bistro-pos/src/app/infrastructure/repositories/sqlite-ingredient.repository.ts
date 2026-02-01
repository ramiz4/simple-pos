import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Ingredient } from '../../domain/entities/ingredient.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteIngredientRepository implements BaseRepository<Ingredient> {
  private db: Database | null = null;

  async findById(id: number): Promise<Ingredient | null> {
    const db = await this.getDb();
    const results = await db.select<Ingredient[]>('SELECT * FROM ingredient WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Ingredient[]> {
    const db = await this.getDb();
    return await db.select<Ingredient[]>('SELECT * FROM ingredient');
  }

  async create(entity: Omit<Ingredient, 'id'>): Promise<Ingredient> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO ingredient (name, stockQuantity, unit) VALUES (?, ?, ?)',
      [entity.name, entity.stockQuantity, entity.unit]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Ingredient>): Promise<Ingredient> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Ingredient with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE ingredient SET name = ?, stockQuantity = ?, unit = ? WHERE id = ?',
      [updated.name, updated.stockQuantity, updated.unit, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM ingredient WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM ingredient');
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
      CREATE TABLE IF NOT EXISTS ingredient (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        stockQuantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL
      )
    `);
  }
}
