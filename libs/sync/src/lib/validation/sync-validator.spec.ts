import { EntityChange, SyncPushRequest } from '../protocol/sync-protocol.interface';
import { validateEntityChange, validateSyncPushRequest } from './sync-validator';

function validChange(overrides: Partial<EntityChange> = {}): EntityChange {
  return {
    entityType: 'product',
    entityId: 1,
    operation: 'UPDATE',
    data: { name: 'test' },
    timestamp: '2026-01-01T00:00:00.000Z',
    version: 1,
    metadata: {},
    ...overrides,
  };
}

describe('validateEntityChange', () => {
  it('should pass for a valid change', () => {
    const result = validateEntityChange(validChange());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing entityType', () => {
    const result = validateEntityChange(validChange({ entityType: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('entityType is required and must be a string');
  });

  it('should reject invalid operation', () => {
    const result = validateEntityChange(
      validChange({ operation: 'INVALID' as EntityChange['operation'] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid operation');
  });

  it('should reject negative version', () => {
    const result = validateEntityChange(validChange({ version: -1 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('version must be a non-negative number');
  });

  it('should reject invalid timestamp', () => {
    const result = validateEntityChange(validChange({ timestamp: 'not-a-date' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('timestamp must be a valid ISO-8601 string');
  });
});

describe('validateSyncPushRequest', () => {
  it('should pass for a valid request', () => {
    const request: SyncPushRequest = {
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      lastSyncTimestamp: '2026-01-01T00:00:00.000Z',
      changes: [validChange()],
    };

    const result = validateSyncPushRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should reject missing tenantId', () => {
    const request: SyncPushRequest = {
      tenantId: '',
      deviceId: 'device-1',
      lastSyncTimestamp: '2026-01-01T00:00:00.000Z',
      changes: [],
    };

    const result = validateSyncPushRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tenantId is required');
  });

  it('should reject missing deviceId', () => {
    const request: SyncPushRequest = {
      tenantId: 'tenant-1',
      deviceId: '',
      lastSyncTimestamp: '2026-01-01T00:00:00.000Z',
      changes: [],
    };

    const result = validateSyncPushRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('deviceId is required');
  });

  it('should reject batch exceeding max size', () => {
    const changes = Array.from({ length: 1001 }, (_, i) => validChange({ entityId: i }));
    const request: SyncPushRequest = {
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      lastSyncTimestamp: '2026-01-01T00:00:00.000Z',
      changes,
    };

    const result = validateSyncPushRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('maximum batch size');
  });

  it('should report per-change validation errors', () => {
    const request: SyncPushRequest = {
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      lastSyncTimestamp: '2026-01-01T00:00:00.000Z',
      changes: [validChange({ version: -1 })],
    };

    const result = validateSyncPushRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/changes\[0\]/);
  });
});
