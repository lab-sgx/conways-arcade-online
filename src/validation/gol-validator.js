/**
 * GoL Validator - checks if games follow Conway's B3/S23 rules.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '../core/GoLEngine.js'

/**
 * GoL Validator - ensures games use Conway's Game of Life correctly.
 */
export class GoLValidator {
  /**
   * Validate game code (static analysis).
   *
   * @param {string} gameCode - Game source code as string
   * @returns {{valid: boolean, errors: string[]}} Validation result
   *
   * @example
   * const code = fs.readFileSync('game.js', 'utf8')
   * const result = GoLValidator.validate(code)
   * if (!result.valid) {
   *   console.error('Validation errors:', result.errors)
   * }
   */
  static validate(gameCode) {
    const errors = []

    // Check 1: Uses GoLEngine
    if (!gameCode.includes('GoLEngine')) {
      errors.push('❌ Game must import and use GoLEngine for visuals')
    }

    // Check 2: No hardcoded sprites (must be procedural)
    const imagePatterns = ['loadImage', '.png', '.jpg', '.jpeg', '.gif', '.svg']
    const hasImages = imagePatterns.some(pattern => gameCode.includes(pattern))
    if (hasImages) {
      errors.push('❌ Visuals must be procedural GoL cells, not static images')
    }

    // Check 3: B3/S23 rules not modified (check for suspicious patterns)
    if (gameCode.includes('neighbors') && gameCode.includes('!==') && !gameCode.includes('B3/S23')) {
      // This is a heuristic - may have false positives
      errors.push('⚠️  GoL neighbor rules may be modified. Ensure B3/S23 is followed.')
    }

    // Check 4: Has proper GoL background OR clean background
    const hasGoLBackground = gameCode.includes('GoLBackground')
    const hasCleanBackground = gameCode.includes('background(') && gameCode.includes('#FFFFFF')
    if (!hasGoLBackground && !hasCleanBackground) {
      errors.push('⚠️  Game should have either GoLBackground or clean solid background')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Runtime validation - check GoL engine follows B3/S23 rules.
   *
   * @param {GoLEngine} golEngine - GoLEngine instance to test
   * @returns {{valid: boolean, error: string|null}} Validation result
   *
   * @example
   * const engine = new GoLEngine(10, 10, 12)
   * const result = GoLValidator.validateRuntime(engine)
   * if (!result.valid) {
   *   console.error('Runtime validation failed:', result.error)
   * }
   */
  static validateRuntime(golEngine) {
    // Test 1: BLINKER pattern (most reliable test)
    // Vertical blinker should become horizontal after 1 generation

    // Clear grid
    golEngine.clearGrid()

    // Set vertical blinker
    golEngine.setCell(5, 4, 1)
    golEngine.setCell(5, 5, 1)
    golEngine.setCell(5, 6, 1)

    // Evolve 1 generation
    golEngine.update()

    // Check horizontal blinker
    const isHorizontal = (
      golEngine.getCell(4, 5) === 1 &&
      golEngine.getCell(5, 5) === 1 &&
      golEngine.getCell(6, 5) === 1 &&
      golEngine.getCell(5, 4) === 0 &&
      golEngine.getCell(5, 6) === 0
    )

    if (!isHorizontal) {
      return {
        valid: false,
        error: '❌ GoL engine does not follow B3/S23 rules (BLINKER test failed)'
      }
    }

    // Test 2: BLOCK pattern (still life - should never change)
    golEngine.clearGrid()

    golEngine.setCell(5, 5, 1)
    golEngine.setCell(5, 6, 1)
    golEngine.setCell(6, 5, 1)
    golEngine.setCell(6, 6, 1)

    // Evolve 1 generation
    golEngine.update()

    // Check block is still stable
    const isStable = (
      golEngine.getCell(5, 5) === 1 &&
      golEngine.getCell(5, 6) === 1 &&
      golEngine.getCell(6, 5) === 1 &&
      golEngine.getCell(6, 6) === 1
    )

    if (!isStable) {
      return {
        valid: false,
        error: '❌ GoL engine does not follow B3/S23 rules (BLOCK stability test failed)'
      }
    }

    return {
      valid: true,
      error: null
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
