/**
 * Pure utility helpers for version comparison and timestamp ordering
 * used by both client and server during sync operations.
 */

/**
 * Compare two ISO-8601 timestamps and return the later one.
 * Returns `a` when they are equal.
 */
export function latestTimestamp(a: string, b: string): string {
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

/**
 * Determine which version number is higher.
 */
export function isNewerVersion(incoming: number, existing: number): boolean {
  return incoming > existing;
}

/**
 * Calculate the next version number after a successful merge.
 */
export function nextVersion(clientVersion: number, serverVersion: number): number {
  return Math.max(clientVersion, serverVersion) + 1;
}
