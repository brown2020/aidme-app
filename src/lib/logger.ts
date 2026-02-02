/**
 * Simple logging utility
 *
 * - In development: logs to console
 * - In production: errors still log (visible in browser devtools if needed)
 *
 * For production monitoring, integrate with Sentry or similar service.
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  /** Log errors - always logged (visible in browser devtools) */
  error: (message: string, error?: unknown) => {
    console.error(`[Aid.me] ${message}`, error ?? "");
  },

  /** Log warnings - development only */
  warn: (message: string, data?: unknown) => {
    if (isDev) console.warn(`[Aid.me] ${message}`, data ?? "");
  },

  /** Log info - development only */
  info: (message: string, data?: unknown) => {
    if (isDev) console.info(`[Aid.me] ${message}`, data ?? "");
  },

  /** Log debug - development only */
  debug: (message: string, data?: unknown) => {
    if (isDev) console.debug(`[Aid.me] ${message}`, data ?? "");
  },
};
