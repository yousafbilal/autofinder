/**
 * Production-safe logger utility
 * Automatically disables console logs in production builds
 */

const IS_DEV = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production (for crash reporting)
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info(...args);
    }
  },
};

// For quick replacement: export individual methods
export const { log, warn, error, debug, info } = logger;
