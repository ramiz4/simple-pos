import { Injectable } from '@angular/core';
import { OrderItemExtra } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { OrderItemExtraRepository } from '../../../core/interfaces/order-item-extra-repository.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteOrderItemExtraRepository implements OrderItemExtraRepository {
  private db: Database | null = null;

  async findById(id: number): Promise<OrderItemExtra | null> {
    // Current schema doesn't have a single numeric ID.
    // SyncEngineService uses findAll, so this might not be reached for now.
    const db = await this.getDb();
    const results = await db.select<OrderItemExtra[]>(
      'SELECT * FROM order_item_extra WHERE rowid = ?',
      [id],
    );
    return results.length > 0 ? results[0] : null;
  }

  async create(entity: OrderItemExtra): Promise<OrderItemExtra> {
    const db = await this.getDb();
    await db.execute(
      'INSERT INTO order_item_extra (orderId, orderItemId, extraId) VALUES (?, ?, ?)',
      [entity.orderId, entity.orderItemId, entity.extraId],
    );
    return entity;
  }

  async update(id: number, entity: Partial<OrderItemExtra>): Promise<OrderItemExtra> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`OrderItemExtra with rowid ${id} not found`);
    }

    const updated = { ...existing, ...entity };
    await db.execute(
      'UPDATE order_item_extra SET orderId = ?, orderItemId = ?, extraId = ? WHERE rowid = ?',
      [updated.orderId, updated.orderItemId, updated.extraId, id],
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM order_item_extra WHERE rowid = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM order_item_extra',
    );
    return results[0].count;
  }

  async findAll(): Promise<OrderItemExtra[]> {
    const db = await this.getDb();
    return await db.select<OrderItemExtra[]>('SELECT * FROM order_item_extra');
  }

  async findByOrderItemId(orderItemId: number): Promise<OrderItemExtra[]> {
    const db = await this.getDb();
    return await db.select<OrderItemExtra[]>(
      'SELECT * FROM order_item_extra WHERE orderItemId = ?',
      [orderItemId],
    );
  }

  async findByOrderId(orderId: number): Promise<OrderItemExtra[]> {
    const db = await this.getDb();
    return await db.select<OrderItemExtra[]>('SELECT * FROM order_item_extra WHERE orderId = ?', [
      orderId,
    ]);
  }

  async deleteByOrderItemId(orderItemId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM order_item_extra WHERE orderItemId = ?', [orderItemId]);
  }

  async deleteByOrderId(orderId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM order_item_extra WHERE orderId = ?', [orderId]);
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
      CREATE TABLE IF NOT EXISTS order_item_extra (
        orderId INTEGER NOT NULL,
        orderItemId INTEGER NOT NULL,
        extraId INTEGER NOT NULL,
        PRIMARY KEY (orderItemId, extraId),
        FOREIGN KEY (orderId) REFERENCES "order" (id) ON DELETE CASCADE,
        FOREIGN KEY (orderItemId) REFERENCES order_item (id) ON DELETE CASCADE,
        FOREIGN KEY (extraId) REFERENCES extra (id)
      )
    `);
  }
}
