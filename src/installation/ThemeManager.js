/**
 * ThemeManager - Centralized theme state management
 *
 * Manages day/night theme switching using CSS variables
 * Broadcasts theme changes to iframe games via postMessage
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog, debugError } from '../utils/Logger.js'

export class ThemeManager {
  /**
   * Valid theme names
   */
  static THEMES = {
    DAY: 'day',
    NIGHT: 'night'
  }

  constructor() {
    // Current theme state
    this.currentTheme = ThemeManager.THEMES.DAY

    // Observer callbacks
    this.observers = []

    // Apply initial theme
    this.applyTheme(this.currentTheme)

    debugLog('ThemeManager: Initialized with day theme')
  }

  /**
   * Set theme (day or night)
   * @param {string} theme - Theme name ('day' or 'night')
   * @throws {Error} If theme is invalid
   */
  setTheme(theme) {
    // Validate theme
    if (!Object.values(ThemeManager.THEMES).includes(theme)) {
      throw new Error(`Invalid theme: ${theme}. Must be 'day' or 'night'`)
    }

    // No change needed
    if (this.currentTheme === theme) {
      return
    }

    // Update state
    this.currentTheme = theme

    // Apply to DOM
    this.applyTheme(theme)

    // Notify observers
    this.notifyObservers(theme)

    // Broadcast to iframes
    this.broadcastToIframes(theme)

    debugLog(`ThemeManager: Theme changed to ${theme}`)
  }

  /**
   * Get current theme
   * @returns {string} - Current theme name
   */
  getTheme() {
    return this.currentTheme
  }

  /**
   * Apply theme to DOM
   * @param {string} theme - Theme name
   */
  applyTheme(theme) {
    if (typeof document === 'undefined') {
      return // Skip in test environment
    }

    document.documentElement.setAttribute('data-theme', theme)
  }

  /**
   * Add observer callback
   * @param {function} callback - Callback(newTheme)
   */
  addObserver(callback) {
    if (typeof callback !== 'function') {
      debugError('ThemeManager: Observer must be a function')
      return
    }

    this.observers.push(callback)
    debugLog(`ThemeManager: Observer added (total: ${this.observers.length})`)
  }

  /**
   * Remove observer callback
   * @param {function} callback - Callback to remove
   */
  removeObserver(callback) {
    const index = this.observers.indexOf(callback)
    if (index > -1) {
      this.observers.splice(index, 1)
      debugLog(`ThemeManager: Observer removed (total: ${this.observers.length})`)
    }
  }

  /**
   * Notify all observers of theme change
   * @param {string} theme - New theme
   */
  notifyObservers(theme) {
    this.observers.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        debugError('ThemeManager: Observer callback error:', error)
      }
    })
  }

  /**
   * Broadcast theme change to all iframes (games)
   * @param {string} theme - New theme
   */
  broadcastToIframes(theme) {
    if (typeof document === 'undefined') {
      return // Skip in test environment
    }

    const iframes = document.querySelectorAll('iframe')

    iframes.forEach(iframe => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: 'themeChange', payload: { theme } },
            '*'
          )
        }
      } catch (error) {
        debugError('ThemeManager: Failed to broadcast to iframe:', error)
      }
    })

    debugLog(`ThemeManager: Broadcasted theme '${theme}' to ${iframes.length} iframe(s)`)
  }
}
