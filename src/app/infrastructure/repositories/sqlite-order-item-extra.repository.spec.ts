import { TestBed } from '@angular/core/testing';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderItemExtra } from '../../domain/entities/order-item-extra.interface';
import { SQLiteOrderItemExtraRepository } from './sqlite-order-item-extra.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteOrderItemExtraRepository', () => {
  let repository: SQLiteOrderItemExtraRepository;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as any);

    TestBed.configureTestingModule({
      providers: [SQLiteOrderItemExtraRepository],
    });

    repository = TestBed.inject(SQLiteOrderItemExtraRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create order_item_extra table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS order_item_extra'),
      );
    });

    it('should create table with composite primary key', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('PRIMARY KEY (orderItemId, extraId)'),
      );
    });

    it('should create table with foreign keys', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      const createTableCall = mockDb.execute.mock.calls[0][0];
      expect(createTableCall).toContain('FOREIGN KEY (orderId) REFERENCES "order" (id)');
      expect(createTableCall).toContain('FOREIGN KEY (orderItemId) REFERENCES order_item (id)');
      expect(createTableCall).toContain('FOREIGN KEY (extraId) REFERENCES extra (id)');
    });

    it('should have ON DELETE CASCADE for order and order_item', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      const createTableCall = mockDb.execute.mock.calls[0][0];
      expect(createTableCall).toContain('ON DELETE CASCADE');
    });
  });

  describe('create', () => {
    it('should create a new order item extra', async () => {
      const newOrderItemExtra: OrderItemExtra = {
        orderId: 100,
        orderItemId: 5,
        extraId: 2,
      };
      mockDb.execute.mockResolvedValue({});

      await repository.create(newOrderItemExtra);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO order_item_extra (orderId, orderItemId, extraId) VALUES (?, ?, ?)',
        [100, 5, 2],
      );
    });

    it('should handle multiple extras for same order item', async () => {
      const extras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 5, extraId: 2 },
        { orderId: 100, orderItemId: 5, extraId: 3 },
      ];

      mockDb.execute.mockResolvedValue({});

      for (const extra of extras) {
        await repository.create(extra);
      }

      // First call is table creation, then 3 INSERT calls
      expect(mockDb.execute).toHaveBeenCalledTimes(4);
    });

    it('should handle constraint violations for duplicate entries', async () => {
      const newOrderItemExtra: OrderItemExtra = {
        orderId: 100,
        orderItemId: 5,
        extraId: 2,
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed'));

      await expect(repository.create(newOrderItemExtra)).rejects.toThrow(
        'UNIQUE constraint failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return all order item extras', async () => {
      const mockOrderItemExtras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 5, extraId: 2 },
        { orderId: 100, orderItemId: 6, extraId: 1 },
      ];
      mockDb.select.mockResolvedValue(mockOrderItemExtras);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM order_item_extra');
      expect(result).toEqual(mockOrderItemExtras);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no order item extras exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByOrderItemId', () => {
    it('should return all extras for specific order item', async () => {
      const mockOrderItemExtras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 5, extraId: 2 },
        { orderId: 100, orderItemId: 5, extraId: 3 },
      ];
      mockDb.select.mockResolvedValue(mockOrderItemExtras);

      const result = await repository.findByOrderItemId(5);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM order_item_extra WHERE orderItemId = ?',
        [5],
      );
      expect(result).toEqual(mockOrderItemExtras);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when order item has no extras', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByOrderItemId(999);

      expect(result).toEqual([]);
    });

    it('should use parameterized query', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByOrderItemId(5);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([5]);
    });
  });

  describe('findByOrderId', () => {
    it('should return all order item extras for specific order', async () => {
      const mockOrderItemExtras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 5, extraId: 2 },
        { orderId: 100, orderItemId: 6, extraId: 1 },
        { orderId: 100, orderItemId: 6, extraId: 3 },
      ];
      mockDb.select.mockResolvedValue(mockOrderItemExtras);

      const result = await repository.findByOrderId(100);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM order_item_extra WHERE orderId = ?',
        [100],
      );
      expect(result).toEqual(mockOrderItemExtras);
      expect(result).toHaveLength(4);
    });

    it('should return empty array when order has no item extras', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByOrderId(999);

      expect(result).toEqual([]);
    });

    it('should use parameterized query', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByOrderId(100);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([100]);
    });
  });

  describe('deleteByOrderItemId', () => {
    it('should delete all extras for specific order item', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderItemId(5);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM order_item_extra WHERE orderItemId = ?',
        [5],
      );
    });

    it('should not throw error when order item has no extras', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.deleteByOrderItemId(999)).resolves.not.toThrow();
    });

    it('should use parameterized query', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderItemId(5);

      // First call is table creation, second is DELETE
      const deleteCall = mockDb.execute.mock.calls[1];
      expect(deleteCall[0]).toContain('?');
      expect(deleteCall[1]).toEqual([5]);
    });
  });

  describe('deleteByOrderId', () => {
    it('should delete all order item extras for specific order', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderId(100);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM order_item_extra WHERE orderId = ?',
        [100],
      );
    });

    it('should not throw error when order has no item extras', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.deleteByOrderId(999)).resolves.not.toThrow();
    });

    it('should use parameterized query', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderId(100);

      // First call is table creation, second is DELETE
      const deleteCall = mockDb.execute.mock.calls[1];
      expect(deleteCall[0]).toContain('?');
      expect(deleteCall[1]).toEqual([100]);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries for create', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.create({
        orderId: 100,
        orderItemId: 5,
        extraId: 2,
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toEqual([100, 5, 2]);
    });

    it('should use parameterized queries for findByOrderItemId', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByOrderItemId(5);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([5]);
    });

    it('should use parameterized queries for findByOrderId', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByOrderId(100);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([100]);
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('should automatically delete when order is deleted', async () => {
      // This is handled by database CASCADE constraint
      // Just verify the constraint exists
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      const createTableCall = mockDb.execute.mock.calls[0][0];
      expect(createTableCall).toContain('ON DELETE CASCADE');
    });

    it('should handle deletion of all extras when order item is deleted', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderItemId(5);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM order_item_extra WHERE orderItemId = ?',
        [5],
      );
    });

    it('should handle deletion of all extras when order is deleted', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderId(100);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM order_item_extra WHERE orderId = ?',
        [100],
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large ID values', async () => {
      const largeIds: OrderItemExtra = {
        orderId: 999999,
        orderItemId: 888888,
        extraId: 777777,
      };
      mockDb.execute.mockResolvedValue({});

      await repository.create(largeIds);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), [999999, 888888, 777777]);
    });

    it('should handle zero ID values', async () => {
      const zeroIds: OrderItemExtra = {
        orderId: 0,
        orderItemId: 0,
        extraId: 0,
      };
      mockDb.execute.mockResolvedValue({});

      await repository.create(zeroIds);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), [0, 0, 0]);
    });

    it('should handle negative ID values', async () => {
      const negativeIds: OrderItemExtra = {
        orderId: -1,
        orderItemId: -2,
        extraId: -3,
      };
      mockDb.execute.mockResolvedValue({});

      await repository.create(negativeIds);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), [-1, -2, -3]);
    });
  });

  describe('Many-to-Many Relationship', () => {
    it('should support multiple extras for one order item', async () => {
      const orderItemExtras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 5, extraId: 2 },
        { orderId: 100, orderItemId: 5, extraId: 3 },
      ];

      mockDb.execute.mockResolvedValue({});

      for (const extra of orderItemExtras) {
        await repository.create(extra);
      }

      // First call is table creation, then 3 INSERT calls
      expect(mockDb.execute).toHaveBeenCalledTimes(4);
    });

    it('should support same extra for multiple order items', async () => {
      const orderItemExtras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 6, extraId: 1 },
        { orderId: 100, orderItemId: 7, extraId: 1 },
      ];

      mockDb.execute.mockResolvedValue({});

      for (const extra of orderItemExtras) {
        await repository.create(extra);
      }

      // First call is table creation, then 3 INSERT calls
      expect(mockDb.execute).toHaveBeenCalledTimes(4);
    });

    it('should retrieve all extras for an order with multiple items', async () => {
      const mockOrderItemExtras: OrderItemExtra[] = [
        { orderId: 100, orderItemId: 5, extraId: 1 },
        { orderId: 100, orderItemId: 5, extraId: 2 },
        { orderId: 100, orderItemId: 6, extraId: 1 },
        { orderId: 100, orderItemId: 6, extraId: 3 },
        { orderId: 100, orderItemId: 7, extraId: 2 },
      ];
      mockDb.select.mockResolvedValue(mockOrderItemExtras);

      const result = await repository.findByOrderId(100);

      expect(result).toHaveLength(5);
      expect(result).toEqual(mockOrderItemExtras);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce foreign key constraint for orderId', async () => {
      const invalidOrderItemExtra: OrderItemExtra = {
        orderId: 999999, // Non-existent order
        orderItemId: 5,
        extraId: 2,
      };
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.create(invalidOrderItemExtra)).rejects.toThrow(
        'FOREIGN KEY constraint failed',
      );
    });

    it('should enforce foreign key constraint for orderItemId', async () => {
      const invalidOrderItemExtra: OrderItemExtra = {
        orderId: 100,
        orderItemId: 999999, // Non-existent order item
        extraId: 2,
      };
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.create(invalidOrderItemExtra)).rejects.toThrow(
        'FOREIGN KEY constraint failed',
      );
    });

    it('should enforce foreign key constraint for extraId', async () => {
      const invalidOrderItemExtra: OrderItemExtra = {
        orderId: 100,
        orderItemId: 5,
        extraId: 999999, // Non-existent extra
      };
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.create(invalidOrderItemExtra)).rejects.toThrow(
        'FOREIGN KEY constraint failed',
      );
    });
  });
});
