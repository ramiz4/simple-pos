import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { User } from '../../domain/entities/user.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteUserRepository implements BaseRepository<User> {
  private db: Database | null = null;

  async findById(id: number): Promise<User | null> {
    const db = await this.getDb();
    const results = await db.select<User[]>('SELECT * FROM user WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<User[]> {
    const db = await this.getDb();
    return await db.select<User[]>('SELECT * FROM user');
  }

  async findByName(name: string): Promise<User | null> {
    const db = await this.getDb();
    const results = await db.select<User[]>('SELECT * FROM user WHERE name = ? AND active = 1', [
      name,
    ]);
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: Omit<User, 'id'>): Promise<User> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO user (name, roleId, pinHash, active) VALUES (?, ?, ?, ?)',
      [entity.name, entity.roleId, entity.pinHash, entity.active ? 1 : 0],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<User>): Promise<User> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`User with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute('UPDATE user SET name = ?, roleId = ?, pinHash = ?, active = ? WHERE id = ?', [
      updated.name,
      updated.roleId,
      updated.pinHash,
      updated.active ? 1 : 0,
      id,
    ]);
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM user WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM user');
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
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        roleId INTEGER NOT NULL,
        pinHash TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (roleId) REFERENCES code_table (id)
      )
    `);
  }
}
