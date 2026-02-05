import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { OrderItem } from '../../domain/entities/order-item.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteOrderItemRepository implements BaseRepository<OrderItem> {
  private db: Database | null = null;

  async findById(id: number): Promise<OrderItem | null> {
    const db = await this.getDb();
    const results = await db.select<OrderItem[]>('SELECT * FROM order_item WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<OrderItem[]> {
    const db = await this.getDb();
    return await db.select<OrderItem[]>('SELECT * FROM order_item');
  }

  async create(entity: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    const db = await this.getDb();
    const result = await db.execute(
      'INSERT INTO order_item (orderId, productId, variantId, quantity, unitPrice, notes, statusId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        entity.orderId,
        entity.productId,
        entity.variantId,
        entity.quantity,
        entity.unitPrice,
        entity.notes,
        entity.statusId,
        entity.createdAt,
      ],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<OrderItem>): Promise<OrderItem> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`OrderItem with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE order_item SET orderId = ?, productId = ?, variantId = ?, quantity = ?, unitPrice = ?, notes = ?, statusId = ?, createdAt = ? WHERE id = ?',
      [
        updated.orderId,
        updated.productId,
        updated.variantId,
        updated.quantity,
        updated.unitPrice,
        updated.notes,
        updated.statusId,
        updated.createdAt,
        id,
      ],
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM order_item WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM order_item',
    );
    return results[0].count;
  }

  async findByOrderId(orderId: number): Promise<OrderItem[]> {
    const db = await this.getDb();
    return await db.select<OrderItem[]>('SELECT * FROM order_item WHERE orderId = ?', [orderId]);
  }

  async deleteByOrderId(orderId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM order_item WHERE orderId = ?', [orderId]);
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
      CREATE TABLE IF NOT EXISTS order_item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        variantId INTEGER,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        notes TEXT,
        statusId INTEGER,
        createdAt TEXT,
        FOREIGN KEY (orderId) REFERENCES "order" (id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES product (id),
        FOREIGN KEY (variantId) REFERENCES variant (id)
      )
    `);

    // Migration for existing tables
    try {
      await db.execute('ALTER TABLE order_item ADD COLUMN statusId INTEGER');
    } catch {}
    try {
      await db.execute('ALTER TABLE order_item ADD COLUMN createdAt TEXT');
    } catch {}
  }
}
