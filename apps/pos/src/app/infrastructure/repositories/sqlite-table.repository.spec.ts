import { TestBed } from '@angular/core/testing';
import { Table } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SQLiteTableRepository } from './sqlite-table.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteTableRepository', () => {
  let repository: SQLiteTableRepository;
  let mockDb: { select: Mock; execute: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    TestBed.configureTestingModule({
      providers: [SQLiteTableRepository],
    });

    repository = TestBed.inject(SQLiteTableRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create table table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "table"'),
      );
    });

    it('should create table with unique number constraint', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('number INTEGER NOT NULL UNIQUE'),
      );
    });

    it('should create table with foreign key to code_table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('FOREIGN KEY (statusId) REFERENCES code_table (id)'),
      );
    });
  });

  describe('findById', () => {
    it('should return table when found', async () => {
      const mockTable: Table = {
        id: 1,
        name: 'Table 1',
        number: 1,
        seats: 4,
        statusId: 1,
      };
      mockDb.select.mockResolvedValue([mockTable]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM "table" WHERE id = ?', [1]);
      expect(result).toEqual(mockTable);
    });

    it('should return null when table not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all tables', async () => {
      const mockTables: Table[] = [
        { id: 1, name: 'Table 1', number: 1, seats: 4, statusId: 1 },
        { id: 2, name: 'Table 2', number: 2, seats: 2, statusId: 1 },
        { id: 3, name: 'Table 3', number: 3, seats: 6, statusId: 2 },
      ];
      mockDb.select.mockResolvedValue(mockTables);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM "table"');
      expect(result).toEqual(mockTables);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no tables exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new table', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Table 5',
        number: 5,
        seats: 4,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newTable);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO "table" (name, number, seats, statusId) VALUES (?, ?, ?, ?)',
        ['Table 5', 5, 4, 1],
      );
      expect(result).toEqual({ ...newTable, id: 42 });
    });

    it('should create table with 2 seats', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Small Table',
        number: 10,
        seats: 2,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newTable);

      expect(result.seats).toBe(2);
    });

    it('should create table with 8 seats', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Large Table',
        number: 11,
        seats: 8,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newTable);

      expect(result.seats).toBe(8);
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Test Table',
        number: 1,
        seats: 4,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newTable);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle unique constraint violations', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Duplicate Number',
        number: 1,
        seats: 4,
        statusId: 1,
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed: table.number'));

      await expect(repository.create(newTable)).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing table', async () => {
      const existingTable: Table = {
        id: 1,
        name: 'Original Name',
        number: 5,
        seats: 4,
        statusId: 1,
      };
      const updateData: Partial<Table> = {
        name: 'Updated Name',
        seats: 6,
        statusId: 2,
      };

      mockDb.select.mockResolvedValue([existingTable]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE "table" SET name = ?, number = ?, seats = ?, statusId = ? WHERE id = ?',
        ['Updated Name', 5, 6, 2, 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.seats).toBe(6);
      expect(result.statusId).toBe(2);
    });

    it('should update table status only', async () => {
      const existingTable: Table = {
        id: 1,
        name: 'Table 1',
        number: 1,
        seats: 4,
        statusId: 1,
      };

      mockDb.select.mockResolvedValue([existingTable]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { statusId: 2 });

      expect(result.statusId).toBe(2);
      expect(result.name).toBe('Table 1'); // Unchanged
      expect(result.seats).toBe(4); // Unchanged
    });

    it('should update table seats', async () => {
      const existingTable: Table = {
        id: 1,
        name: 'Table 1',
        number: 1,
        seats: 4,
        statusId: 1,
      };

      mockDb.select.mockResolvedValue([existingTable]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { seats: 6 });

      expect(result.seats).toBe(6);
    });

    it('should throw error when table not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Table with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingTable: Table = {
        id: 1,
        name: 'Original Name',
        number: 5,
        seats: 4,
        statusId: 1,
      };

      mockDb.select.mockResolvedValue([existingTable]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.number).toBe(5); // Unchanged
      expect(result.seats).toBe(4); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete a table by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM "table" WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent table', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of tables', async () => {
      mockDb.select.mockResolvedValue([{ count: 20 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM "table"');
      expect(result).toBe(20);
    });

    it('should return 0 when no tables exist', async () => {
      mockDb.select.mockResolvedValue([{ count: 0 }]);

      const result = await repository.count();

      expect(result).toBe(0);
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

    it('should use parameterized queries for create', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });
      await repository.create({
        name: '\'; DROP TABLE "table"; --',
        number: 1,
        seats: 4,
        statusId: 1,
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toContain('\'; DROP TABLE "table"; --');
    });
  });

  describe('Edge Cases', () => {
    it('should handle tables with empty names', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: '',
        number: 1,
        seats: 4,
        statusId: 1,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 1, 4, 1]),
      );
    });

    it('should handle tables with very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: longName,
        number: 1,
        seats: 4,
        statusId: 1,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle special characters in table name', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Table & <VIP> "Section"',
        number: 1,
        seats: 4,
        statusId: 1,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Table & <VIP> "Section"']),
      );
    });

    it('should handle tables with zero seats', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Reserved',
        number: 99,
        seats: 0,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newTable);

      expect(result.seats).toBe(0);
    });

    it('should handle tables with very large seat numbers', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Banquet Hall',
        number: 100,
        seats: 100,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newTable);

      expect(result.seats).toBe(100);
    });

    it('should handle negative table numbers', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Private Room',
        number: -1,
        seats: 4,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newTable);

      expect(result.number).toBe(-1);
    });

    it('should handle very large table numbers', async () => {
      const newTable: Omit<Table, 'id'> = {
        name: 'Table 999',
        number: 999,
        seats: 4,
        statusId: 1,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newTable);

      expect(result.number).toBe(999);
    });
  });

  describe('Table Status Management', () => {
    it('should allow changing table status', async () => {
      const existingTable: Table = {
        id: 1,
        name: 'Table 1',
        number: 1,
        seats: 4,
        statusId: 1, // FREE
      };

      mockDb.select.mockResolvedValue([existingTable]);
      mockDb.execute.mockResolvedValue({});

      // Change to OCCUPIED
      const result = await repository.update(1, { statusId: 2 });

      expect(result.statusId).toBe(2);
    });

    it('should handle different status values', async () => {
      const statuses = [1, 2, 3, 4, 5]; // Different status IDs

      for (const statusId of statuses) {
        const existingTable: Table = {
          id: 1,
          name: 'Table 1',
          number: 1,
          seats: 4,
          statusId: 1,
        };

        mockDb.select.mockResolvedValue([existingTable]);
        mockDb.execute.mockResolvedValue({});

        const result = await repository.update(1, { statusId });

        expect(result.statusId).toBe(statusId);
      }
    });
  });
});
