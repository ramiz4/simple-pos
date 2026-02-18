import { EntityChange } from './sync-protocol.interface';

/**
 * A delta represents a batch of entity changes produced during a
 * single sync cycle. Both push and pull operations exchange deltas.
 */
export interface SyncDelta {
  /** Unique identifier for this delta batch */
  deltaId: string;
  /** ISO-8601 timestamp when the delta was created */
  createdAt: string;
  /** Ordered list of entity-level changes */
  changes: EntityChange[];
}
