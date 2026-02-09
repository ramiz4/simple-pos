import { Injectable } from '@angular/core';
import { CodeTable } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteCodeTableRepository implements BaseRepository<CodeTable> {
  private db: Database | null = null;

  async findById(id: number): Promise<CodeTable | null> {
    const db = await this.getDb();
    const results = await db.select<CodeTable[]>('SELECT * FROM code_table WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<CodeTable[]> {
    const db = await this.getDb();
    return await db.select<CodeTable[]>('SELECT * FROM code_table ORDER BY sortOrder');
  }

  async findByCodeType(codeType: string): Promise<CodeTable[]> {
    const db = await this.getDb();
    return await db.select<CodeTable[]>(
      'SELECT * FROM code_table WHERE codeType = ? AND isActive = 1 ORDER BY sortOrder',
      [codeType],
    );
  }

  async findByCodeTypeAndCode(codeType: string, code: string): Promise<CodeTable | null> {
    const db = await this.getDb();
    const results = await db.select<CodeTable[]>(
      'SELECT * FROM code_table WHERE codeType = ? AND code = ? AND isActive = 1',
      [codeType, code],
    );
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: Omit<CodeTable, 'id'>): Promise<CodeTable> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO code_table (codeType, code, sortOrder, isActive) VALUES (?, ?, ?, ?)',
      [entity.codeType, entity.code, entity.sortOrder, entity.isActive ? 1 : 0],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<CodeTable>): Promise<CodeTable> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CodeTable with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE code_table SET codeType = ?, code = ?, sortOrder = ?, isActive = ? WHERE id = ?',
      [updated.codeType, updated.code, updated.sortOrder, updated.isActive ? 1 : 0, id],
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM code_table WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM code_table',
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
      CREATE TABLE IF NOT EXISTS code_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codeType TEXT NOT NULL,
        code TEXT NOT NULL,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1,
        UNIQUE(codeType, code)
      )
    `);
  }
}
