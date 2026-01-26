/**
 * Centralized logging utility for consistent error tracking and debugging
 * 
 * @example
 * logger.error('Failed to start recognition', error);
 * logger.warn('Permission status changed');
 */
export const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Error] ${message}`, error);
    }
    // TODO: Send to monitoring service (e.g., Sentry) in production
  },
  
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Warning] ${message}`, data);
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[Info] ${message}`, data);
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Debug] ${message}`, data);
    }
  },
};
