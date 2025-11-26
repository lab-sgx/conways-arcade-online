/**
 * ThemeConstants - Shared theme color definitions
 *
 * Single source of truth for all theme colors across the application.
 * Used by ThemeReceiver, game-wrapper, and all theme-aware components.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

export const THEME_COLORS = {
  DAY: {
    bg: '#FFFFFF',
    text: '#202124',
    textRgb: [95, 99, 104]  // For p5.js fill() calls
  },
  NIGHT: {
    bg: '#1A1A1A',
    text: '#E8EAED',
    textRgb: [232, 234, 237]  // For p5.js fill() calls
  }
}

/**
 * Get background color for theme
 * @param {string} theme - 'day' or 'night'
 * @returns {string} Hex color
 */
export function getBackgroundColor(theme) {
  return theme === 'night' ? THEME_COLORS.NIGHT.bg : THEME_COLORS.DAY.bg
}

/**
 * Get text color for theme (hex string)
 * @param {string} theme - 'day' or 'night'
 * @returns {string} Hex color
 */
export function getTextColor(theme) {
  return theme === 'night' ? THEME_COLORS.NIGHT.text : THEME_COLORS.DAY.text
}

/**
 * Get text color for theme (RGB array for p5.js)
 * @param {string} theme - 'day' or 'night'
 * @returns {number[]} RGB array [r, g, b]
 */
export function getTextColorRgb(theme) {
  return theme === 'night' ? THEME_COLORS.NIGHT.textRgb : THEME_COLORS.DAY.textRgb
}
