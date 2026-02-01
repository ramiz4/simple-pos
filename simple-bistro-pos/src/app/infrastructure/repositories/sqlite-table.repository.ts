import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Table } from '../../domain/entities/table.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteTableRepository implements BaseRepository<Table> {
  private db: Database | null = null;

  async findById(id: number): Promise<Table | null> {
    const db = await this.getDb();
    const results = await db.select<Table[]>('SELECT * FROM "table" WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Table[]> {
    const db = await this.getDb();
    return await db.select<Table[]>('SELECT * FROM "table"');
  }

  async create(entity: Omit<Table, 'id'>): Promise<Table> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO "table" (name, number, seats, statusId) VALUES (?, ?, ?, ?)',
      [entity.name, entity.number, entity.seats, entity.statusId]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Table>): Promise<Table> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Table with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE "table" SET name = ?, number = ?, seats = ?, statusId = ? WHERE id = ?',
      [updated.name, updated.number, updated.seats, updated.statusId, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM "table" WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM "table"');
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
      CREATE TABLE IF NOT EXISTS "table" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        number INTEGER NOT NULL UNIQUE,
        seats INTEGER NOT NULL,
        statusId INTEGER NOT NULL,
        FOREIGN KEY (statusId) REFERENCES code_table (id)
      )
    `);
  }
}
