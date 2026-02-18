import { EntityChange } from '../protocol/sync-protocol.interface';
import {
  ClientWinsStrategy,
  FieldMergeStrategy,
  LastWriteWinsStrategy,
  resolveConflict,
  ServerWinsStrategy,
} from './conflict-resolution';

function makeChange(overrides: Partial<EntityChange> = {}): EntityChange {
  return {
    entity: 'product',
    operation: 'UPDATE',
    data: { name: 'default' },
    timestamp: '2026-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

describe('LastWriteWinsStrategy', () => {
  const strategy = new LastWriteWinsStrategy();

  it('should return client when client timestamp is later', () => {
    const client = makeChange({ timestamp: '2026-01-02T00:00:00.000Z', data: { name: 'client' } });
    const server = makeChange({ timestamp: '2026-01-01T00:00:00.000Z', data: { name: 'server' } });

    expect(strategy.resolve(client, server)).toBe(client);
  });

  it('should return server when server timestamp is later', () => {
    const client = makeChange({ timestamp: '2026-01-01T00:00:00.000Z', data: { name: 'client' } });
    const server = makeChange({ timestamp: '2026-01-02T00:00:00.000Z', data: { name: 'server' } });

    expect(strategy.resolve(client, server)).toBe(server);
  });

  it('should return server when timestamps are equal', () => {
    const ts = '2026-01-01T12:00:00.000Z';
    const client = makeChange({ timestamp: ts, data: { name: 'client' } });
    const server = makeChange({ timestamp: ts, data: { name: 'server' } });

    expect(strategy.resolve(client, server)).toBe(server);
  });
});

describe('ServerWinsStrategy', () => {
  it('should always return server', () => {
    const strategy = new ServerWinsStrategy();
    const client = makeChange({ data: { name: 'client' } });
    const server = makeChange({ data: { name: 'server' } });

    expect(strategy.resolve(client, server)).toBe(server);
  });
});

describe('ClientWinsStrategy', () => {
  it('should always return client', () => {
    const strategy = new ClientWinsStrategy();
    const client = makeChange({ data: { name: 'client' } });
    const server = makeChange({ data: { name: 'server' } });

    expect(strategy.resolve(client, server)).toBe(client);
  });
});

describe('FieldMergeStrategy', () => {
  it('should merge fields with client taking precedence', () => {
    const strategy = new FieldMergeStrategy();
    const client = makeChange({ data: { name: 'client-name', price: 10 } });
    const server = makeChange({ data: { name: 'server-name', stock: 50 } });

    const result = strategy.resolve(client, server);

    expect(result.data).toEqual({ name: 'client-name', price: 10, stock: 50 });
  });

  it('should preserve server structure for non-data fields', () => {
    const strategy = new FieldMergeStrategy();
    const client = makeChange({
      version: 2,
      data: { name: 'client' },
    });
    const server = makeChange({
      version: 3,
      data: { name: 'server' },
    });

    const result = strategy.resolve(client, server);

    expect(result.version).toBe(3);
  });
});

describe('resolveConflict', () => {
  it('should default to LastWriteWinsStrategy', () => {
    const client = makeChange({ timestamp: '2026-01-02T00:00:00.000Z' });
    const server = makeChange({ timestamp: '2026-01-01T00:00:00.000Z' });

    expect(resolveConflict(client, server)).toBe(client);
  });

  it('should use provided strategy', () => {
    const client = makeChange({ timestamp: '2026-01-02T00:00:00.000Z' });
    const server = makeChange({ timestamp: '2026-01-01T00:00:00.000Z' });

    expect(resolveConflict(client, server, new ServerWinsStrategy())).toBe(server);
  });
});
