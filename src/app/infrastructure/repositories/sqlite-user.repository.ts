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

  async findByNameAndAccount(name: string, accountId: number): Promise<User | null> {
    const db = await this.getDb();
    const results = await db.select<User[]>(
      'SELECT * FROM user WHERE name = ? AND accountId = ? AND active = 1',
      [name, accountId],
    );
    return results.length > 0 ? results[0] : null;
  }

  async findByAccountId(accountId: number): Promise<User[]> {
    const db = await this.getDb();
    return await db.select<User[]>('SELECT * FROM user WHERE accountId = ?', [accountId]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await this.getDb();
    const results = await db.select<User[]>('SELECT * FROM user WHERE email = ?', [email]);
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: Omit<User, 'id'>): Promise<User> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO user (name, email, roleId, pinHash, passwordHash, active, accountId, isOwner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        entity.name,
        entity.email || null,
        entity.roleId,
        entity.pinHash,
        entity.passwordHash || null,
        entity.active ? 1 : 0,
        entity.accountId,
        entity.isOwner ? 1 : 0,
      ],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<User>): Promise<User> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`User with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE user SET name = ?, email = ?, roleId = ?, pinHash = ?, passwordHash = ?, active = ?, accountId = ?, isOwner = ? WHERE id = ?',
      [
        updated.name,
        updated.email || null,
        updated.roleId,
        updated.pinHash,
        updated.passwordHash || null,
        updated.active ? 1 : 0,
        updated.accountId,
        updated.isOwner ? 1 : 0,
        id,
      ],
    );
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

  /**
   * BREAKING CHANGE: SQLite user table schema has been significantly modified
   *
   * Key changes from previous schema:
   * 1. Email constraint: Changed from `email TEXT` (nullable, no uniqueness) to `email TEXT UNIQUE` (line 118)
   *    - If existing databases have users with NULL emails or duplicate emails, migration will fail
   * 2. Username uniqueness: Changed from globally unique `name TEXT NOT NULL UNIQUE` to
   *    per-account unique via composite constraint `UNIQUE(accountId, name)` (line 125)
   *    - The old schema had global unique constraint, now allows same name across accounts
   * 3. Foreign key change: Changed from `FOREIGN KEY (organizationId) REFERENCES organization (id)`
   *    to `FOREIGN KEY (accountId) REFERENCES account (id)` (line 127)
   *    - The 'organization' table was renamed to 'account'
   *    - This breaks existing foreign key relationships unless proper migration is performed
   * 4. New fields added: passwordHash (line 121), isOwner (line 124)
   *
   * Migration considerations:
   * - SQLite doesn't have easy ALTER TABLE for dropping constraints
   * - Existing databases with old schema will have conflicts on upgrade
   * - Tauri app should handle schema migrations or document that users need to reset local database
   * - Consider implementing a migration script or version detection to handle schema evolution
   */
  private async initTable(): Promise<void> {
    const db = await this.getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        roleId INTEGER NOT NULL,
        pinHash TEXT NOT NULL,
        passwordHash TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        accountId INTEGER NOT NULL,
        isOwner INTEGER NOT NULL DEFAULT 0,
        UNIQUE(accountId, name),
        FOREIGN KEY (roleId) REFERENCES code_table (id),
        FOREIGN KEY (accountId) REFERENCES account (id)
      )
    `);
  }
}
