import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Order } from '../../domain/entities/order.interface';
import { OrderStatusEnum } from '../../domain/enums';

@Injectable({
  providedIn: 'root',
})
export class SQLiteOrderRepository implements BaseRepository<Order> {
  private db: Database | null = null;

  async findById(id: number): Promise<Order | null> {
    const db = await this.getDb();
    const results = await db.select<Order[]>('SELECT * FROM "order" WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Order[]> {
    const db = await this.getDb();
    return await db.select<Order[]>('SELECT * FROM "order" ORDER BY createdAt DESC');
  }

  async create(entity: Omit<Order, 'id'>): Promise<Order> {
    const db = await this.getDb();
    const result = await db.execute(
      `INSERT INTO "order" (orderNumber, typeId, statusId, tableId, subtotal, tax, tip, total, createdAt, completedAt, userId, cancelledReason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entity.orderNumber,
        entity.typeId,
        entity.statusId,
        entity.tableId,
        entity.subtotal,
        entity.tax,
        entity.tip,
        entity.total,
        entity.createdAt,
        entity.completedAt,
        entity.userId,
        entity.cancelledReason,
      ],
    );
    const id = result.lastInsertId ?? Date.now();
    return { ...entity, id };
  }

  async update(id: number, entity: Partial<Order>): Promise<Order> {
    const db = await this.getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Order with id ${id} not found`);

    const updated = { ...existing, ...entity };
    await db.execute(
      `UPDATE "order" SET orderNumber = ?, typeId = ?, statusId = ?, tableId = ?, subtotal = ?, tax = ?, tip = ?, total = ?,
       createdAt = ?, completedAt = ?, userId = ?, cancelledReason = ? WHERE id = ?`,
      [
        updated.orderNumber,
        updated.typeId,
        updated.statusId,
        updated.tableId,
        updated.subtotal,
        updated.tax,
        updated.tip,
        updated.total,
        updated.createdAt,
        updated.completedAt,
        updated.userId,
        updated.cancelledReason,
        id,
      ],
    );
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM "order" WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const db = await this.getDb();
    const results = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM "order"');
    return results[0].count;
  }

  async findActiveOrders(): Promise<Order[]> {
    const db = await this.getDb();
    return await db.select<Order[]>(
      `SELECT o.* FROM "order" o
       INNER JOIN code_table ct ON o.statusId = ct.id
       WHERE ct.code NOT IN (?, ?, ?)
       ORDER BY o.createdAt DESC`,
      [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED, OrderStatusEnum.SERVED],
    );
  }

  async findByStatus(statusId: number): Promise<Order[]> {
    const db = await this.getDb();
    return await db.select<Order[]>(
      'SELECT * FROM "order" WHERE statusId = ? ORDER BY createdAt DESC',
      [statusId],
    );
  }

  async findByTable(tableId: number): Promise<Order[]> {
    const db = await this.getDb();
    return await db.select<Order[]>(
      'SELECT * FROM "order" WHERE tableId = ? ORDER BY createdAt DESC',
      [tableId],
    );
  }

  async findByTableAndStatus(tableId: number, statusIds: number[]): Promise<Order | null> {
    const db = await this.getDb();
    const placeholders = statusIds.map(() => '?').join(',');
    const results = await db.select<Order[]>(
      `SELECT * FROM "order" WHERE tableId = ? AND statusId IN (${placeholders}) ORDER BY createdAt DESC LIMIT 1`,
      [tableId, ...statusIds],
    );
    return results.length > 0 ? results[0] : null;
  }

  async getNextOrderNumber(): Promise<string> {
    const db = await this.getDb();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const results = await db.select<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM "order" WHERE orderNumber LIKE ?',
      [`${today}%`],
    );
    const sequence = (results[0].count + 1).toString().padStart(4, '0');
    return `${today}${sequence}`;
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
      CREATE TABLE IF NOT EXISTS "order" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT NOT NULL UNIQUE,
        typeId INTEGER NOT NULL,
        statusId INTEGER NOT NULL,
        tableId INTEGER,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        tip REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        userId INTEGER NOT NULL,
        cancelledReason TEXT,
        FOREIGN KEY (typeId) REFERENCES code_table (id),
        FOREIGN KEY (statusId) REFERENCES code_table (id),
        FOREIGN KEY (tableId) REFERENCES "table" (id),
        FOREIGN KEY (userId) REFERENCES user (id)
      )
    `);
  }
}
