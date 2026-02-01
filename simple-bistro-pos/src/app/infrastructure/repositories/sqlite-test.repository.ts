import { inject, Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { TestEntity } from '../../domain/entities/test-entity.interface';

/**
 * SQLite repository implementation for Tauri desktop mode
 */
@Injectable({
  providedIn: 'root'
})
export class SQLiteTestRepository implements BaseRepository<TestEntity> {
  private db: Database | null = null;

  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await Database.load('sqlite:bistro.db');
    }
  }

  async findById(id: number): Promise<TestEntity | null> {
    await this.initialize();
    const result = await this.db!.select<TestEntity[]>(
      'SELECT id, name, value, created_at as createdAt FROM test_entity WHERE id = $1',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async findAll(): Promise<TestEntity[]> {
    await this.initialize();
    return await this.db!.select<TestEntity[]>(
      'SELECT id, name, value, created_at as createdAt FROM test_entity ORDER BY id DESC'
    );
  }

  async create(entity: Omit<TestEntity, 'id'>): Promise<TestEntity> {
    await this.initialize();
    const result = await this.db!.execute(
      'INSERT INTO test_entity (name, value) VALUES ($1, $2)',
      [entity.name, entity.value]
    );
    
    if (!result.lastInsertId) {
      throw new Error('Failed to get last insert ID');
    }
    
    const newEntity = await this.findById(result.lastInsertId);
    if (!newEntity) {
      throw new Error('Failed to create entity');
    }
    return newEntity;
  }

  async update(id: number, entity: Partial<TestEntity>): Promise<TestEntity> {
    await this.initialize();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (entity.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(entity.name);
    }
    if (entity.value !== undefined) {
      updates.push(`value = $${paramIndex++}`);
      values.push(entity.value);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Entity not found');
      return existing;
    }

    values.push(id);
    await this.db!.execute(
      `UPDATE test_entity SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error('Entity not found after update');
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.initialize();
    await this.db!.execute('DELETE FROM test_entity WHERE id = $1', [id]);
  }

  async count(): Promise<number> {
    await this.initialize();
    const result = await this.db!.select<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM test_entity'
    );
    return result[0].count;
  }
}
