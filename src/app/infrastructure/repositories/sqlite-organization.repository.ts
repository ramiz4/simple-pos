import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Organization } from '../../domain/entities/organization.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteOrganizationRepository implements BaseRepository<Organization> {
  private db: Database | null = null;

  async findById(id: number): Promise<Organization | null> {
    const db = await this.getDb();
    const results = await db.select<Organization[]>(
      'SELECT * FROM organization WHERE id = ?',
      [id]
    );
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Organization[]> {
    const db = await this.getDb();
    return await db.select<Organization[]>('SELECT * FROM organization');
  }

  async findByEmail(email: string): Promise<Organization | null> {
    const db = await this.getDb();
    const results = await db.select<Organization[]>(
      'SELECT * FROM organization WHERE email = ?',
      [email]
    );
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: Omit<Organization, 'id'>): Promise<Organization> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO organization (name, email, active, createdAt) VALUES (?, ?, ?, ?)',
      [entity.name, entity.email, entity.active ? 1 : 0, entity.createdAt]
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Organization>): Promise<Organization> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Organization with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE organization SET name = ?, email = ?, active = ? WHERE id = ?',
      [updated.name, updated.email, updated.active ? 1 : 0, id]
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM organization WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM organization'
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
      CREATE TABLE IF NOT EXISTS organization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        active INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL
      )
    `);
  }
}
