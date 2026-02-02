import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { OrderItemExtra } from '../../domain/entities/order-item-extra.interface';

@Injectable({
  providedIn: 'root',
})
export class SQLiteOrderItemExtraRepository {
  private db: Database | null = null;

  async create(entity: OrderItemExtra): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      'INSERT INTO order_item_extra (orderId, orderItemId, extraId) VALUES (?, ?, ?)',
      [entity.orderId, entity.orderItemId, entity.extraId],
    );
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
