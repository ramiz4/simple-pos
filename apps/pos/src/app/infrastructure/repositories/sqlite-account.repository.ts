import { Injectable } from '@angular/core';
import { Account } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteAccountRepository implements BaseRepository<Account> {
  private db: Database | null = null;

  async findById(id: number): Promise<Account | null> {
    const db = await this.getDb();
    const results = await db.select<Account[]>('SELECT * FROM account WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Account[]> {
    const db = await this.getDb();
    return await db.select<Account[]>('SELECT * FROM account');
  }

  async findByEmail(email: string): Promise<Account | null> {
    const db = await this.getDb();
    const results = await db.select<Account[]>('SELECT * FROM account WHERE email = ?', [email]);
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: Omit<Account, 'id'>): Promise<Account> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO account (name, email, active, createdAt) VALUES (?, ?, ?, ?)',
      [entity.name, entity.email, entity.active ? 1 : 0, entity.createdAt],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Account>): Promise<Account> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Account with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute('UPDATE account SET name = ?, email = ?, active = ? WHERE id = ?', [
      updated.name,
      updated.email,
      updated.active ? 1 : 0,
      id,
    ]);
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM account WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM account');
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
      CREATE TABLE IF NOT EXISTS account (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        active INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL
      )
    `);
  }
}
