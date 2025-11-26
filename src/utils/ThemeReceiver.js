/**
 * ThemeReceiver - Listen for theme changes via postMessage
 *
 * Games use this to receive theme updates from the installation
 * and update their backgrounds accordingly
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getBackgroundColor as getBgColor, getTextColorRgb } from './ThemeConstants.js'
import { debugLog } from './Logger.js'

/**
 * Initialize theme receiver for a game
 * @param {function} onThemeChange - Callback when theme changes: (theme) => void
 * @returns {function} cleanup function
 */
export function initThemeReceiver(onThemeChange) {
  // Read initial theme from URL (passed by GameScreen)
  const urlParams = new URLSearchParams(window.location.search)
  const initialTheme = urlParams.get('theme') || 'day'

  // Apply initial theme immediately (before first draw)
  if (initialTheme === 'day' || initialTheme === 'night') {
    debugLog(`ThemeReceiver: Applying initial theme from URL: "${initialTheme}"`)
    onThemeChange(initialTheme)
  }

  // Listen for theme changes via postMessage
  const handler = (event) => {
    // Only accept messages with themeChange type
    if (event.data && event.data.type === 'themeChange') {
      const theme = event.data.payload?.theme
      if (theme === 'day' || theme === 'night') {
        debugLog(`ThemeReceiver: Received theme "${theme}"`)
        onThemeChange(theme)
      }
    }
  }

  window.addEventListener('message', handler)
  debugLog('ThemeReceiver: Listening for theme changes')

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handler)
    debugLog('ThemeReceiver: Stopped listening')
  }
}

/**
 * Get background color for theme
 * @param {string} theme - 'day' or 'night'
 * @returns {string} Hex color
 */
export function getBackgroundColor(theme) {
  return getBgColor(theme)
}

/**
 * Get text color for theme (RGB array for p5.js)
 * @param {string} theme - 'day' or 'night'
 * @returns {number[]} RGB array [r, g, b]
 */
export function getTextColor(theme) {
  return getTextColorRgb(theme)
}
