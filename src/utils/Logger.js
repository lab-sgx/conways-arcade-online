/**
 * Logger - Conditional debug logging utility
 *
 * Provides debug logging that can be enabled/disabled globally.
 * In production, logs are suppressed to reduce console noise.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

// Enable debug logging in development mode
// Can be overridden by setting window.DEBUG = true/false
const isDevelopment = import.meta.env?.DEV ?? true
const DEBUG = typeof window !== 'undefined' && typeof window.DEBUG !== 'undefined'
  ? window.DEBUG
  : isDevelopment

/**
 * Debug log - only outputs in development mode
 * @param {...any} args - Arguments to log
 */
export function debugLog(...args) {
  if (DEBUG) {
    console.log(...args)
  }
}

/**
 * Debug warn - only outputs in development mode
 * @param {...any} args - Arguments to warn
 */
export function debugWarn(...args) {
  if (DEBUG) {
    console.warn(...args)
  }
}

/**
 * Debug error - always outputs (errors should always be visible)
 * @param {...any} args - Arguments to error
 */
export function debugError(...args) {
  console.error(...args)
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
export function isDebugEnabled() {
  return DEBUG
}
