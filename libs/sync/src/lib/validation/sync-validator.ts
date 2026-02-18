import { MAX_BATCH_SIZE } from '../constants/sync-constants';
import { EntityChange, SyncPushRequest } from '../protocol/sync-protocol.interface';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a single {@link EntityChange} payload.
 */
export function validateEntityChange(change: EntityChange): ValidationResult {
  const errors: string[] = [];

  if (!change.entity || typeof change.entity !== 'string') {
    errors.push('entity is required and must be a string');
  }

  if (!['CREATE', 'UPDATE', 'DELETE'].includes(change.operation)) {
    errors.push(`Invalid operation: ${change.operation}`);
  }

  if (typeof change.version !== 'number' || change.version < 0) {
    errors.push('version must be a non-negative number');
  }

  if (!change.timestamp || Number.isNaN(Date.parse(change.timestamp))) {
    errors.push('timestamp must be a valid ISO-8601 string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a {@link SyncPushRequest} payload.
 */
export function validateSyncPushRequest(request: SyncPushRequest): ValidationResult {
  const errors: string[] = [];

  if (!request.tenantId) {
    errors.push('tenantId is required');
  }

  if (!request.deviceId) {
    errors.push('deviceId is required');
  }

  if (!Array.isArray(request.changes)) {
    errors.push('changes must be an array');
    return { valid: false, errors };
  }

  if (request.changes.length > MAX_BATCH_SIZE) {
    errors.push(`changes exceeds maximum batch size of ${MAX_BATCH_SIZE}`);
  }

  for (const [index, change] of request.changes.entries()) {
    const result = validateEntityChange(change);
    for (const error of result.errors) {
      errors.push(`changes[${index}]: ${error}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
