/** Maximum number of changes allowed in a single sync push request. */
export const MAX_BATCH_SIZE = 1000;

/** Default number of records returned in a pull response. */
export const DEFAULT_PULL_LIMIT = 500;

/** Maximum pull limit the server will accept. */
export const MAX_PULL_LIMIT = 1000;

/** Number of milliseconds between automatic sync cycles (5 minutes). */
export const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Number of retry attempts before giving up on a failed sync. */
export const MAX_RETRY_ATTEMPTS = 3;

/** Base delay in milliseconds for exponential back-off between retries. */
export const RETRY_BASE_DELAY_MS = 1000;
