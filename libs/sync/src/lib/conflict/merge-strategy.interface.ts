import { EntityChange } from '../protocol/sync-protocol.interface';

/**
 * Strategy pattern interface for merge behaviour during conflict resolution.
 */
export interface MergeStrategy {
  resolve(client: EntityChange, server: EntityChange): EntityChange;
}
