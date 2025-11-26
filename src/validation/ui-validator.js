/**
 * UI Validator - checks if games follow Google brand guidelines.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GOOGLE_COLORS } from '../utils/GradientPresets.js'

/**
 * Convert RGB array to hex color string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color (e.g., '#4285F4')
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

/**
 * UI Validator - ensures games follow brand guidelines.
 */
export class UIValidator {
  /**
   * Validate game UI (static analysis).
   *
   * @param {string} gameCode - Game source code as string
   * @returns {{valid: boolean, errors: string[]}} Validation result
   *
   * @example
   * const code = fs.readFileSync('game.js', 'utf8')
   * const result = UIValidator.validate(code)
   * if (!result.valid) {
   *   console.error('UI validation errors:', result.errors)
   * }
   */
  static validate(gameCode) {
    const errors = []

    // Check 1: Score display
    const hasScore = gameCode.includes('score') || gameCode.includes('Score') || gameCode.includes('SCORE')
    if (!hasScore) {
      errors.push('❌ Game must display score')
    }

    // Check 2: Google brand colors (official Google palette)
    const GOOGLE_BRAND_COLORS = [
      rgbToHex(...GOOGLE_COLORS.BLUE),    // #428ef4
      rgbToHex(...GOOGLE_COLORS.RED),     // #ff5145
      rgbToHex(...GOOGLE_COLORS.GREEN),   // #38a852
      rgbToHex(...GOOGLE_COLORS.YELLOW),  // #ffbb00
      rgbToHex(...GOOGLE_COLORS.WHITE),   // #ffffff
      '#5f6368',  // Google Gray 700 (text color)
      '#000000'   // Black
    ]
    const hasGoogleColors = GOOGLE_BRAND_COLORS.some(color =>
      gameCode.toLowerCase().includes(color.toLowerCase())
    )
    if (!hasGoogleColors) {
      errors.push('⚠️  UI should use Google brand colors (#428EF4, #FF5145, #38A852, #FFBB00, #FFFFFF)')
    }

    // Check 3: Minimal UI (not too many gradients)
    const gradientCount = (gameCode.match(/gradient/gi) || []).length
    if (gradientCount > 40) {
      errors.push('⚠️  UI should be minimal - too many gradients detected')
    }

    // Check 4: Clean background
    const hasBackground = gameCode.includes('background(')
    if (!hasBackground) {
      errors.push('⚠️  Game should call background() to clear screen')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate game file (convenience method).
   *
   * @param {string} filePath - Path to game file
   * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
   */
  static async validateFile(filePath) {
    try {
      const fs = await import('fs')
      const gameCode = fs.readFileSync(filePath, 'utf8')
      return this.validate(gameCode)
    } catch (error) {
      return {
        valid: false,
        errors: [`❌ Failed to read file: ${error.message}`]
      }
    }
  }
}
