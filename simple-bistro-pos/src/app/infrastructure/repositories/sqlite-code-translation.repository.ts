import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { CodeTranslation } from '../../domain/entities/code-translation.interface';

@Injectable({
  providedIn: 'root'
})
export class SQLiteCodeTranslationRepository implements BaseRepository<CodeTranslation> {
  private db: Database | null = null;

  async findById(id: number): Promise<CodeTranslation | null> {
    const db = await this.getDb();
    const results = await db.select<CodeTranslation[]>('SELECT * FROM code_translation WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<CodeTranslation[]> {
    const db = await this.getDb();
    return await db.select<CodeTranslation[]>('SELECT * FROM code_translation');
  }

  async findByCodeTableId(codeTableId: number): Promise<CodeTranslation[]> {
    const db = await this.getDb();
    return await db.select<CodeTranslation[]>(
      'SELECT * FROM code_translation WHERE codeTableId = ?',
      [codeTableId]
    );
  }

  async findByCodeTableIdAndLanguage(codeTableId: number, language: string): Promise<CodeTranslation | null> {
    const db = await this.getDb();
    const results = await db.select<CodeTranslation[]>(
      'SELECT * FROM code_translation WHERE codeTableId = ? AND language = ?',
      [codeTableId, language]
    );
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: Omit<CodeTranslation, 'id'>): Promise<CodeTranslation> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO code_translation (codeTableId, language, label) VALUES (?, ?, ?)',
      [entity.codeTableId, entity.language, entity.label]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<CodeTranslation>): Promise<CodeTranslation> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`CodeTranslation with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE code_translation SET codeTableId = ?, language = ?, label = ? WHERE id = ?',
      [updated.codeTableId, updated.language, updated.label, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM code_translation WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM code_translation');
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
      CREATE TABLE IF NOT EXISTS code_translation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codeTableId INTEGER NOT NULL,
        language TEXT NOT NULL,
        label TEXT NOT NULL,
        FOREIGN KEY (codeTableId) REFERENCES code_table (id) ON DELETE CASCADE,
        UNIQUE(codeTableId, language)
      )
    `);
  }
}
