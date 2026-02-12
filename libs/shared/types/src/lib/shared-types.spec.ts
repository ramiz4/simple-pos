import { describe, expect, it } from 'vitest';
import { OrderStatusEnum } from './order-status.enum';
import { OrderTypeEnum } from './order-type.enum';
import { TableStatusEnum } from './table-status.enum';
import { UserRoleEnum } from './user-role.enum';

describe('Shared Types Definitions', () => {
  describe('OrderStatusEnum', () => {
    it('should have expected values', () => {
      expect(OrderStatusEnum.OPEN).toBe('OPEN');
      expect(OrderStatusEnum.PREPARING).toBe('PREPARING');
      expect(OrderStatusEnum.READY).toBe('READY');
      expect(OrderStatusEnum.OUT_FOR_DELIVERY).toBe('OUT_FOR_DELIVERY');
      expect(OrderStatusEnum.SERVED).toBe('SERVED');
      expect(OrderStatusEnum.COMPLETED).toBe('COMPLETED');
      expect(OrderStatusEnum.CANCELLED).toBe('CANCELLED');
    });

    it('should include all statuses', () => {
      const statuses = Object.values(OrderStatusEnum);
      expect(statuses).toHaveLength(7);
      expect(statuses).toContain('OPEN');
      expect(statuses).toContain('PREPARING');
      expect(statuses).toContain('READY');
      expect(statuses).toContain('OUT_FOR_DELIVERY');
      expect(statuses).toContain('SERVED');
      expect(statuses).toContain('COMPLETED');
      expect(statuses).toContain('CANCELLED');
    });
  });

  describe('OrderTypeEnum', () => {
    it('should have expected values', () => {
      expect(OrderTypeEnum.DINE_IN).toBe('DINE_IN');
      expect(OrderTypeEnum.TAKEAWAY).toBe('TAKEAWAY');
      expect(OrderTypeEnum.DELIVERY).toBe('DELIVERY');
    });

    it('should include all types', () => {
      const types = Object.values(OrderTypeEnum);
      expect(types).toHaveLength(3);
    });
  });

  describe('TableStatusEnum', () => {
    it('should have expected values', () => {
      expect(TableStatusEnum.FREE).toBe('FREE');
      expect(TableStatusEnum.OCCUPIED).toBe('OCCUPIED');
      expect(TableStatusEnum.RESERVED).toBe('RESERVED');
    });
  });

  describe('UserRoleEnum', () => {
    it('should have expected values', () => {
      expect(UserRoleEnum.ADMIN).toBe('ADMIN');
      expect(UserRoleEnum.CASHIER).toBe('CASHIER');
      expect(UserRoleEnum.KITCHEN).toBe('KITCHEN');
      expect(UserRoleEnum.DRIVER).toBe('DRIVER');
    });
  });
});
