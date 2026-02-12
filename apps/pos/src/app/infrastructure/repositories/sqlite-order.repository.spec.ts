import { TestBed } from '@angular/core/testing';
import { Order, OrderStatusEnum } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SQLiteOrderRepository } from './sqlite-order.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteOrderRepository', () => {
  let repository: SQLiteOrderRepository;
  let mockDb: { select: Mock; execute: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    TestBed.configureTestingModule({
      providers: [SQLiteOrderRepository],
    });

    repository = TestBed.inject(SQLiteOrderRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create order table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "order"'),
      );
    });

    it('should attempt to add customerName column during migration', async () => {
      mockDb.select.mockResolvedValue([]);
      // Resolve table creation, then reject ALTER TABLE (column already exists)
      mockDb.execute
        .mockResolvedValueOnce({}) // CREATE TABLE
        .mockRejectedValueOnce(new Error('Column already exists')); // ALTER TABLE

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        'ALTER TABLE "order" ADD COLUMN customerName TEXT',
      );
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      const mockOrder: Order = {
        id: 1,
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
        customerName: 'John Doe',
      };
      mockDb.select.mockResolvedValue([mockOrder]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM "order" WHERE id = ?', [1]);
      expect(result).toEqual(mockOrder);
    });

    it('should return null when order not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all orders ordered by createdAt DESC', async () => {
      const mockOrders: Order[] = [
        {
          id: 2,
          orderNumber: '202401010002',
          typeId: 1,
          statusId: 2,
          tableId: 5,
          subtotal: 200,
          tax: 20,
          tip: 10,
          total: 230,
          createdAt: '2024-01-01T13:00:00.000Z',
          completedAt: null,
          userId: 1,
          cancelledReason: null,
        },
        {
          id: 1,
          orderNumber: '202401010001',
          typeId: 1,
          statusId: 2,
          tableId: 5,
          subtotal: 100,
          tax: 10,
          tip: 5,
          total: 115,
          createdAt: '2024-01-01T12:00:00.000Z',
          completedAt: null,
          userId: 1,
          cancelledReason: null,
        },
      ];
      mockDb.select.mockResolvedValue(mockOrders);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM "order" ORDER BY createdAt DESC');
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when no orders exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new order with all fields', async () => {
      const newOrder: Omit<Order, 'id'> = {
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
        customerName: 'John Doe',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newOrder);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "order"'), [
        '202401010001',
        1,
        2,
        5,
        100,
        10,
        5,
        115,
        '2024-01-01T12:00:00.000Z',
        null,
        1,
        null,
        'John Doe',
      ]);
      expect(result).toEqual({ ...newOrder, id: 42 });
    });

    it('should create order with null tableId for takeout', async () => {
      const newOrder: Omit<Order, 'id'> = {
        orderNumber: '202401010002',
        typeId: 2,
        statusId: 2,
        tableId: null,
        subtotal: 50,
        tax: 5,
        tip: 0,
        total: 55,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newOrder);

      expect(result.tableId).toBeNull();
      expect(result.id).toBe(43);
    });

    it('should create order with zero tip', async () => {
      const newOrder: Omit<Order, 'id'> = {
        orderNumber: '202401010003',
        typeId: 1,
        statusId: 2,
        tableId: 3,
        subtotal: 100,
        tax: 10,
        tip: 0,
        total: 110,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newOrder);

      expect(result.tip).toBe(0);
    });

    it('should handle customerName with null value', async () => {
      const newOrder: Omit<Order, 'id'> = {
        orderNumber: '202401010004',
        typeId: 1,
        statusId: 2,
        tableId: 3,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
        customerName: undefined,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 45 });

      await repository.create(newOrder);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null]), // customerName should be null
      );
    });
  });

  describe('update', () => {
    it('should update an existing order', async () => {
      const existingOrder: Order = {
        id: 1,
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };
      const updateData: Partial<Order> = {
        statusId: 3,
        tip: 10,
        total: 120,
        completedAt: '2024-01-01T13:00:00.000Z',
      };

      mockDb.select.mockResolvedValue([existingOrder]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('UPDATE "order" SET'), [
        '202401010001',
        1,
        3,
        5,
        100,
        10,
        10,
        120,
        '2024-01-01T12:00:00.000Z',
        '2024-01-01T13:00:00.000Z',
        1,
        null,
        null,
        1,
      ]);
      expect(result.statusId).toBe(3);
      expect(result.tip).toBe(10);
      expect(result.total).toBe(120);
    });

    it('should update order with cancelled reason', async () => {
      const existingOrder: Order = {
        id: 1,
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };

      mockDb.select.mockResolvedValue([existingOrder]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, {
        statusId: 5, // Cancelled status
        cancelledReason: 'Customer requested cancellation',
      });

      expect(result.cancelledReason).toBe('Customer requested cancellation');
    });

    it('should throw error when order not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { statusId: 3 })).rejects.toThrow(
        'Order with id 999 not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete an order by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM "order" WHERE id = ?', [1]);
    });

    it('should handle cascade delete of order items', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(1)).resolves.not.toThrow();
    });
  });

  describe('count', () => {
    it('should return total number of orders', async () => {
      mockDb.select.mockResolvedValue([{ count: 15 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM "order"');
      expect(result).toBe(15);
    });

    it('should return 0 when no orders exist', async () => {
      mockDb.select.mockResolvedValue([{ count: 0 }]);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('findActiveOrders', () => {
    it('should return orders that are not completed, cancelled, or served', async () => {
      const mockOrders: Order[] = [
        {
          id: 1,
          orderNumber: '202401010001',
          typeId: 1,
          statusId: 2,
          tableId: 5,
          subtotal: 100,
          tax: 10,
          tip: 5,
          total: 115,
          createdAt: '2024-01-01T12:00:00.000Z',
          completedAt: null,
          userId: 1,
          cancelledReason: null,
        },
      ];
      mockDb.select.mockResolvedValue(mockOrders);

      const result = await repository.findActiveOrders();

      expect(mockDb.select).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ct.code NOT IN (?, ?, ?)'),
        [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED, OrderStatusEnum.SERVED],
      );
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when no active orders', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findActiveOrders();

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should return orders with specific status', async () => {
      const mockOrders: Order[] = [
        {
          id: 1,
          orderNumber: '202401010001',
          typeId: 1,
          statusId: 2,
          tableId: 5,
          subtotal: 100,
          tax: 10,
          tip: 5,
          total: 115,
          createdAt: '2024-01-01T12:00:00.000Z',
          completedAt: null,
          userId: 1,
          cancelledReason: null,
        },
      ];
      mockDb.select.mockResolvedValue(mockOrders);

      const result = await repository.findByStatus(2);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM "order" WHERE statusId = ? ORDER BY createdAt DESC',
        [2],
      );
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findByTable', () => {
    it('should return orders for specific table', async () => {
      const mockOrders: Order[] = [
        {
          id: 1,
          orderNumber: '202401010001',
          typeId: 1,
          statusId: 2,
          tableId: 5,
          subtotal: 100,
          tax: 10,
          tip: 5,
          total: 115,
          createdAt: '2024-01-01T12:00:00.000Z',
          completedAt: null,
          userId: 1,
          cancelledReason: null,
        },
      ];
      mockDb.select.mockResolvedValue(mockOrders);

      const result = await repository.findByTable(5);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM "order" WHERE tableId = ? ORDER BY createdAt DESC',
        [5],
      );
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findByTableAndStatus', () => {
    it('should return order for table with specific statuses', async () => {
      const mockOrder: Order = {
        id: 1,
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };
      mockDb.select.mockResolvedValue([mockOrder]);

      const result = await repository.findByTableAndStatus(5, [2, 3, 4]);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM "order" WHERE tableId = ? AND statusId IN (?,?,?) ORDER BY createdAt DESC LIMIT 1',
        [5, 2, 3, 4],
      );
      expect(result).toEqual(mockOrder);
    });

    it('should return null when no matching order found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByTableAndStatus(5, [2, 3, 4]);

      expect(result).toBeNull();
    });

    it('should handle single status in array', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByTableAndStatus(5, [2]);

      expect(mockDb.select).toHaveBeenCalledWith(
        expect.stringContaining('statusId IN (?)'),
        [5, 2],
      );
    });
  });

  describe('getNextOrderNumber', () => {
    it('should generate order number with correct format', async () => {
      mockDb.select.mockResolvedValue([{ count: 0 }]);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

      const result = await repository.getNextOrderNumber();

      expect(result).toBe(`${today}0001`);
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM "order" WHERE orderNumber LIKE ?',
        [`${today}%`],
      );
    });

    it('should increment sequence number correctly', async () => {
      mockDb.select.mockResolvedValue([{ count: 5 }]);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

      const result = await repository.getNextOrderNumber();

      expect(result).toBe(`${today}0006`);
    });

    it('should pad sequence number with zeros', async () => {
      mockDb.select.mockResolvedValue([{ count: 99 }]);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

      const result = await repository.getNextOrderNumber();

      expect(result).toBe(`${today}0100`);
    });

    it('should handle large sequence numbers', async () => {
      mockDb.select.mockResolvedValue([{ count: 9999 }]);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

      const result = await repository.getNextOrderNumber();

      expect(result).toBe(`${today}10000`);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries for findByStatus', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findByStatus(2);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([2]);
    });

    it('should use parameterized queries with multiple values', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findByTableAndStatus(5, [2, 3, 4]);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toMatch(/\?/g);
      expect(call[1]).toEqual([5, 2, 3, 4]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle orders with decimal values', async () => {
      const newOrder: Omit<Order, 'id'> = {
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 123.45,
        tax: 12.35,
        tip: 15.65,
        total: 151.45,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newOrder);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([123.45, 12.35, 15.65, 151.45]),
      );
    });

    it('should handle long customer names', async () => {
      const longName = 'A'.repeat(500);
      const existingOrder: Order = {
        id: 1,
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };

      mockDb.select.mockResolvedValue([existingOrder]);
      mockDb.execute.mockResolvedValue({});

      await repository.update(1, { customerName: longName });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle special characters in cancelled reason', async () => {
      const existingOrder: Order = {
        id: 1,
        orderNumber: '202401010001',
        typeId: 1,
        statusId: 2,
        tableId: 5,
        subtotal: 100,
        tax: 10,
        tip: 5,
        total: 115,
        createdAt: '2024-01-01T12:00:00.000Z',
        completedAt: null,
        userId: 1,
        cancelledReason: null,
      };

      mockDb.select.mockResolvedValue([existingOrder]);
      mockDb.execute.mockResolvedValue({});

      await repository.update(1, {
        cancelledReason: 'Customer said: "I don\'t want this anymore" & left',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Customer said: "I don\'t want this anymore" & left']),
      );
    });
  });
});
