import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Extra } from '../../domain/entities/extra.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteExtraRepository implements BaseRepository<Extra> {
  private db: Database | null = null;

  async findById(id: number): Promise<Extra | null> {
    const db = await this.getDb();
    const results = await db.select<Extra[]>('SELECT * FROM extra WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Extra[]> {
    const db = await this.getDb();
    return await db.select<Extra[]>('SELECT * FROM extra');
  }

  async create(entity: Omit<Extra, 'id'>): Promise<Extra> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO extra (name, price) VALUES (?, ?)',
      [entity.name, entity.price]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Extra>): Promise<Extra> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Extra with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE extra SET name = ?, price = ? WHERE id = ?',
      [updated.name, updated.price, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM extra WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM extra');
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
      CREATE TABLE IF NOT EXISTS extra (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL
      )
    `);
  }
}
