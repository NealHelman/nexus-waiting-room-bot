import { RATE_LIMIT_WINDOW_SECONDS } from '../config/config.mjs';
import { logSecurity } from '../logger/logger.mjs';

// In-memory store: { key: [timestamps(ms), ...] }
const store = new Map();

/**
 * Check and add event timestamp for a key.
 * @param {string} key - e.g. 'request:123456'
 * @param {number} limit - max allowed within window
 * @returns {boolean} true if allowed, false if limited
 */
export function rateLimit(key, limit) {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  const arr = store.get(key) || [];
  // Purge old
  const fresh = arr.filter(ts => now - ts <= windowMs);
  if (fresh.length >= limit) {
    logSecurity('rate_limit_trigger', { key, limit, current: fresh.length });
    store.set(key, fresh); // keep purged list
    return false;
  }
  fresh.push(now);
  store.set(key, fresh);
  return true;
}

/**
 * For debugging / metrics
 */
export function getRateData(key) {
  return store.get(key) || [];
}
