import { EntityChange } from '../protocol/sync-protocol.interface';
import { MergeStrategy } from './merge-strategy.interface';

/**
 * The client change with the later timestamp wins.
 * Falls back to server when timestamps are equal.
 */
export class LastWriteWinsStrategy implements MergeStrategy {
  resolve(client: EntityChange, server: EntityChange): EntityChange {
    return new Date(client.timestamp).getTime() > new Date(server.timestamp).getTime()
      ? client
      : server;
  }
}

/**
 * The server version always wins — simplest conflict-free strategy.
 */
export class ServerWinsStrategy implements MergeStrategy {
  resolve(_client: EntityChange, server: EntityChange): EntityChange {
    return server;
  }
}

/**
 * The client version always wins.
 */
export class ClientWinsStrategy implements MergeStrategy {
  resolve(client: EntityChange, _server: EntityChange): EntityChange {
    return client;
  }
}

/**
 * Merge non-conflicting fields.  For fields present in both versions
 * the **client** value takes precedence (optimistic merge).
 */
export class FieldMergeStrategy implements MergeStrategy {
  resolve(client: EntityChange, server: EntityChange): EntityChange {
    const merged = { ...server.data, ...client.data };
    return { ...server, data: merged };
  }
}

/**
 * Convenience function that resolves a conflict using the provided strategy.
 * Defaults to {@link LastWriteWinsStrategy} when no strategy is given.
 */
export function resolveConflict(
  client: EntityChange,
  server: EntityChange,
  strategy: MergeStrategy = new LastWriteWinsStrategy(),
): EntityChange {
  return strategy.resolve(client, server);
}
