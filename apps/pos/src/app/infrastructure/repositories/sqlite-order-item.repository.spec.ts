import { TestBed } from '@angular/core/testing';
import { OrderItem } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SQLiteOrderItemRepository } from './sqlite-order-item.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteOrderItemRepository', () => {
  let repository: SQLiteOrderItemRepository;
  let mockDb: Record<string, vi.Mock>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    TestBed.configureTestingModule({
      providers: [SQLiteOrderItemRepository],
    });

    repository = TestBed.inject(SQLiteOrderItemRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create order_item table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS order_item'),
      );
    });

    it('should attempt migration to add statusId column', async () => {
      mockDb.select.mockResolvedValue([]);
      // Resolve table creation, then reject first ALTER TABLE (column already exists)
      mockDb.execute
        .mockResolvedValueOnce({}) // CREATE TABLE
        .mockRejectedValueOnce(new Error('Column already exists')); // ALTER TABLE for statusId

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        'ALTER TABLE order_item ADD COLUMN statusId INTEGER',
      );
    });

    it('should attempt migration to add createdAt column', async () => {
      mockDb.select.mockResolvedValue([]);
      // Resolve table creation and first ALTER, then reject second ALTER TABLE (column already exists)
      mockDb.execute
        .mockResolvedValueOnce({}) // CREATE TABLE
        .mockResolvedValueOnce({}) // ALTER TABLE for statusId
        .mockRejectedValueOnce(new Error('Column already exists')); // ALTER TABLE for createdAt

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        'ALTER TABLE order_item ADD COLUMN createdAt TEXT',
      );
    });
  });

  describe('findById', () => {
    it('should return order item when found', async () => {
      const mockOrderItem: OrderItem = {
        id: 1,
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 2,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.select.mockResolvedValue([mockOrderItem]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM order_item WHERE id = ?', [1]);
      expect(result).toEqual(mockOrderItem);
    });

    it('should return null when order item not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all order items', async () => {
      const mockOrderItems: OrderItem[] = [
        {
          id: 1,
          orderId: 100,
          productId: 5,
          variantId: null,
          quantity: 2,
          unitPrice: 12.99,
          notes: null,
          statusId: 1,
          createdAt: '2024-01-01T12:00:00.000Z',
        },
        {
          id: 2,
          orderId: 100,
          productId: 6,
          variantId: 2,
          quantity: 1,
          unitPrice: 15.99,
          notes: 'Extra spicy',
          statusId: 1,
          createdAt: '2024-01-01T12:01:00.000Z',
        },
      ];
      mockDb.select.mockResolvedValue(mockOrderItems);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM order_item');
      expect(result).toEqual(mockOrderItems);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no order items exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new order item', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 2,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newOrderItem);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO order_item (orderId, productId, variantId, quantity, unitPrice, notes, statusId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [100, 5, null, 2, 12.99, null, 1, '2024-01-01T12:00:00.000Z'],
      );
      expect(result).toEqual({ ...newOrderItem, id: 42 });
    });

    it('should create order item with variant', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: 3,
        quantity: 1,
        unitPrice: 15.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newOrderItem);

      expect(result.variantId).toBe(3);
    });

    it('should create order item with notes', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 1,
        unitPrice: 12.99,
        notes: 'No onions, extra cheese',
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newOrderItem);

      expect(result.notes).toBe('No onions, extra cheese');
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 1,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newOrderItem);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });
  });

  describe('update', () => {
    it('should update an existing order item', async () => {
      const existingOrderItem: OrderItem = {
        id: 1,
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 2,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      const updateData: Partial<OrderItem> = {
        quantity: 3,
        notes: 'Updated notes',
      };

      mockDb.select.mockResolvedValue([existingOrderItem]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE order_item SET orderId = ?, productId = ?, variantId = ?, quantity = ?, unitPrice = ?, notes = ?, statusId = ?, createdAt = ? WHERE id = ?',
        [100, 5, null, 3, 12.99, 'Updated notes', 1, '2024-01-01T12:00:00.000Z', 1],
      );
      expect(result.quantity).toBe(3);
      expect(result.notes).toBe('Updated notes');
    });

    it('should update status', async () => {
      const existingOrderItem: OrderItem = {
        id: 1,
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 2,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };

      mockDb.select.mockResolvedValue([existingOrderItem]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { statusId: 2 });

      expect(result.statusId).toBe(2);
    });

    it('should throw error when order item not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { quantity: 5 })).rejects.toThrow(
        'OrderItem with id 999 not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete an order item by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM order_item WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent order item', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });
  });

  describe('count', () => {
    it('should return total number of order items', async () => {
      mockDb.select.mockResolvedValue([{ count: 50 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM order_item');
      expect(result).toBe(50);
    });

    it('should return 0 when no order items exist', async () => {
      mockDb.select.mockResolvedValue([{ count: 0 }]);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('findByOrderId', () => {
    it('should return all items for specific order', async () => {
      const mockOrderItems: OrderItem[] = [
        {
          id: 1,
          orderId: 100,
          productId: 5,
          variantId: null,
          quantity: 2,
          unitPrice: 12.99,
          notes: null,
          statusId: 1,
          createdAt: '2024-01-01T12:00:00.000Z',
        },
        {
          id: 2,
          orderId: 100,
          productId: 6,
          variantId: null,
          quantity: 1,
          unitPrice: 8.99,
          notes: null,
          statusId: 1,
          createdAt: '2024-01-01T12:01:00.000Z',
        },
      ];
      mockDb.select.mockResolvedValue(mockOrderItems);

      const result = await repository.findByOrderId(100);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM order_item WHERE orderId = ?',
        [100],
      );
      expect(result).toEqual(mockOrderItems);
    });

    it('should return empty array when order has no items', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByOrderId(999);

      expect(result).toEqual([]);
    });
  });

  describe('deleteByOrderId', () => {
    it('should delete all items for specific order', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.deleteByOrderId(100);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM order_item WHERE orderId = ?',
        [100],
      );
    });

    it('should not throw error when order has no items', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.deleteByOrderId(999)).resolves.not.toThrow();
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries for findById', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findById(1);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([1]);
    });

    it('should use parameterized queries for findByOrderId', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findByOrderId(100);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([100]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle order items with zero quantity', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 0,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newOrderItem);

      expect(result.quantity).toBe(0);
    });

    it('should handle order items with negative quantity', async () => {
      const existingOrderItem: OrderItem = {
        id: 1,
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 2,
        unitPrice: 12.99,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };

      mockDb.select.mockResolvedValue([existingOrderItem]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { quantity: -1 });

      expect(result.quantity).toBe(-1);
    });

    it('should handle very long notes', async () => {
      const longNotes = 'A'.repeat(5000);
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 1,
        unitPrice: 12.99,
        notes: longNotes,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newOrderItem);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longNotes]),
      );
    });

    it('should handle special characters in notes', async () => {
      const specialNotes = "No onions, extra cheese & 'special' sauce <hot>";
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 1,
        unitPrice: 12.99,
        notes: specialNotes,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newOrderItem);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([specialNotes]),
      );
    });

    it('should handle decimal prices', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 1,
        unitPrice: 12.456789,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newOrderItem);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([12.456789]),
      );
    });

    it('should handle very large quantities', async () => {
      const newOrderItem: Omit<OrderItem, 'id'> = {
        orderId: 100,
        productId: 5,
        variantId: null,
        quantity: 999999,
        unitPrice: 0.01,
        notes: null,
        statusId: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newOrderItem);

      expect(result.quantity).toBe(999999);
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should handle cascade delete from order', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.deleteByOrderId(100)).resolves.not.toThrow();
    });

    it('should reference order, product, and variant tables', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      const createTableCall = mockDb.execute.mock.calls[0][0];
      expect(createTableCall).toContain('FOREIGN KEY (orderId) REFERENCES "order" (id)');
      expect(createTableCall).toContain('FOREIGN KEY (productId) REFERENCES product (id)');
      expect(createTableCall).toContain('FOREIGN KEY (variantId) REFERENCES variant (id)');
    });
  });
});
