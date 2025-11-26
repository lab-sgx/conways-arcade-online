/**
 * PatternRenderer.js
 *
 * Pure GoL pattern rendering system.
 * Supports static patterns (frozen phases) and loop patterns (animated oscillators).
 *
 * PHILOSOPHY (CLAUDE.md):
 * - Pure GoL only (B3/S23 authentic)
 * - No Modified GoL (use GoLHelpers for that)
 * - Simple, declarative API
 * - 100% backward compatible with debug interface
 *
 * FEATURES:
 * - Single pattern: Deterministic rendering
 * - Array of patterns: Random selection from set
 * - Static mode: Frozen at specific phase
 * - Loop mode: Animated with periodic reset
 *
 * @module PatternRenderer
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '../core/GoLEngine.js'
import { Patterns } from './Patterns.js'
import { debugLog, debugWarn } from './Logger.js'

// ============================================
// ENUMS AND CONSTANTS
// ============================================

/**
 * Render modes for Pure GoL patterns.
 */
export const RenderMode = {
  STATIC: 'static',      // Frozen at specific phase
  LOOP: 'loop'           // Animated with periodic reset
}

/**
 * Canonical GoL pattern names (from LifeWiki).
 * All patterns authenticated from https://conwaylife.com/wiki/
 */
export const PatternName = {
  // Still Lifes (stable, period 1)
  BLOCK: 'BLOCK',
  BEEHIVE: 'BEEHIVE',
  LOAF: 'LOAF',
  BOAT: 'BOAT',
  TUB: 'TUB',
  POND: 'POND',
  SHIP: 'SHIP',

  // Oscillators (period 2)
  BLINKER: 'BLINKER',
  TOAD: 'TOAD',
  BEACON: 'BEACON',

  // Oscillators (period 3)
  PULSAR: 'PULSAR',

  // Spaceships
  GLIDER: 'GLIDER',
  LIGHTWEIGHT_SPACESHIP: 'LIGHTWEIGHT_SPACESHIP',
  COPPERHEAD: 'COPPERHEAD',
  DRAGON: 'DRAGON',
  DRAGON_VERTICAL: 'DRAGON_VERTICAL'
}

/**
 * Pattern periods (generations per cycle).
 * Still lifes have period 1 (stable, never change).
 * Oscillators/spaceships have period > 1.
 */
export const PatternPeriod = {
  // Still Lifes
  BLOCK: 1,
  BEEHIVE: 1,
  LOAF: 1,
  BOAT: 1,
  TUB: 1,
  POND: 1,
  SHIP: 1,

  // Oscillators
  BLINKER: 2,
  TOAD: 2,
  BEACON: 2,
  PULSAR: 3,

  // Spaceships
  GLIDER: 4,
  LIGHTWEIGHT_SPACESHIP: 4,
  COPPERHEAD: 10,
  DRAGON: 6,
  DRAGON_VERTICAL: 6
}

/**
 * Pattern categories for filtering and organization.
 */
export const PatternCategory = {
  STILL_LIFE: 'still-life',
  OSCILLATOR: 'oscillator',
  SPACESHIP: 'spaceship'
}

/**
 * Pattern metadata (category, size classification).
 * Used for smart filtering and display.
 */
export const PatternMetadata = {
  BLOCK: { category: PatternCategory.STILL_LIFE, size: 'tiny' },
  BEEHIVE: { category: PatternCategory.STILL_LIFE, size: 'small' },
  LOAF: { category: PatternCategory.STILL_LIFE, size: 'small' },
  BOAT: { category: PatternCategory.STILL_LIFE, size: 'small' },
  TUB: { category: PatternCategory.STILL_LIFE, size: 'small' },
  POND: { category: PatternCategory.STILL_LIFE, size: 'small' },
  SHIP: { category: PatternCategory.STILL_LIFE, size: 'small' },

  BLINKER: { category: PatternCategory.OSCILLATOR, size: 'small' },
  TOAD: { category: PatternCategory.OSCILLATOR, size: 'small' },
  BEACON: { category: PatternCategory.OSCILLATOR, size: 'small' },
  PULSAR: { category: PatternCategory.OSCILLATOR, size: 'large' },

  GLIDER: { category: PatternCategory.SPACESHIP, size: 'small' },
  LIGHTWEIGHT_SPACESHIP: { category: PatternCategory.SPACESHIP, size: 'medium' },
  COPPERHEAD: { category: PatternCategory.SPACESHIP, size: 'medium' },
  DRAGON: { category: PatternCategory.SPACESHIP, size: 'large' },
  DRAGON_VERTICAL: { category: PatternCategory.SPACESHIP, size: 'large' }
}

// ============================================
// MAIN API
// ============================================

/**
 * Create GoL engine configured with Pure GoL pattern(s).
 *
 * FEATURES:
 * - Single pattern: Deterministic rendering
 * - Array of patterns: Random selection from set
 * - Static mode: Frozen at specific phase
 * - Loop mode: Animated with periodic reset
 *
 * @param {Object} config - Configuration object
 * @param {string} config.mode - Render mode (RenderMode.STATIC | RenderMode.LOOP)
 * @param {string|string[]} config.pattern - Pattern name(s) (PatternName enum)
 *   - Single: 'BLINKER' → always BLINKER
 *   - Array: ['BLINKER', 'TOAD'] → random choice
 * @param {number} [config.phase] - Phase index for STATIC mode (0 to period-1)
 *   - If omitted: random phase
 *   - If array patterns: each pick gets random phase
 * @param {number} [config.globalCellSize=30] - Cell size in pixels
 * @param {number} [config.loopUpdateRate=10] - Update rate for LOOP mode (fps)
 *
 * @returns {Object} Renderer object
 *   {
 *     gol: GoLEngine,           // Configured engine
 *     dimensions: {             // Visual dimensions
 *       gridSize: number,       // Grid columns/rows
 *       cellSize: number,       // Cell size (px)
 *       width: number,          // Total width (px)
 *       height: number,         // Total height (px)
 *       hitboxRadius: number    // Suggested hitbox
 *     },
 *     metadata: {               // Pattern info
 *       pattern: string,        // Pattern name used
 *       phase: number,          // Phase applied (static mode)
 *       period: number,         // Pattern period
 *       category: string,       // Pattern category
 *       mode: string            // Render mode
 *     }
 *   }
 *
 * @example
 * // Static BLINKER (phase 0 - vertical)
 * const player = createPatternRenderer({
 *   mode: RenderMode.STATIC,
 *   pattern: PatternName.BLINKER,
 *   phase: 0,
 *   globalCellSize: 30
 * })
 *
 * @example
 * // Random BLINKER phase (0 or 1)
 * const invader = createPatternRenderer({
 *   mode: RenderMode.STATIC,
 *   pattern: PatternName.BLINKER,
 *   // phase omitted = random
 *   globalCellSize: 30
 * })
 *
 * @example
 * // Random pattern from array (random phase each)
 * const enemy = createPatternRenderer({
 *   mode: RenderMode.STATIC,
 *   pattern: [PatternName.BLINKER, PatternName.TOAD, PatternName.BEACON],
 *   globalCellSize: 30
 * })
 *
 * @example
 * // Loop PULSAR (animated)
 * const powerup = createPatternRenderer({
 *   mode: RenderMode.LOOP,
 *   pattern: PatternName.PULSAR,
 *   globalCellSize: 30,
 *   loopUpdateRate: 10
 * })
 */
export function createPatternRenderer(config) {
  // 1. Validate config
  validateConfig(config)

  // 2. Select pattern (if array, pick random)
  const patternName = Array.isArray(config.pattern)
    ? config.pattern[Math.floor(Math.random() * config.pattern.length)]
    : config.pattern

  // 3. Get pattern period
  const period = PatternPeriod[patternName] || 1

  // 4. Determine phase
  let phase = 0
  if (config.mode === RenderMode.STATIC) {
    if (config.phase !== undefined) {
      phase = Math.max(0, Math.min(period - 1, config.phase))
    } else {
      // Random phase if not specified
      phase = Math.floor(Math.random() * period)
    }
  }

  // 5. Create renderer based on mode
  if (config.mode === RenderMode.STATIC) {
    return createStaticRenderer(patternName, phase, config.globalCellSize || 30)
  } else if (config.mode === RenderMode.LOOP) {
    return createLoopRenderer(patternName, config.globalCellSize || 30, config.loopUpdateRate || 10)
  }

  throw new Error(`[PatternRenderer] Invalid render mode: ${config.mode}`)
}

// ============================================
// INTERNAL RENDERERS
// ============================================

/**
 * Create static pattern renderer (frozen at specific phase).
 *
 * ALGORITHM (OPTION A IMPROVED - from DebugAppearance.js):
 * 1. Create temporal grid with 20% padding (CRITICAL for border patterns like PULSAR)
 * 2. Apply pattern at center of temporal grid
 * 3. Evolve N generations (authentic B3/S23)
 * 4. Capture snapshot of evolved pattern
 * 5. Create entity grid with evolved pattern centered
 * 6. Freeze grid (no further evolution)
 *
 * @private
 * @param {string} patternName - Pattern name
 * @param {number} phase - Phase index (0 to period-1)
 * @param {number} globalCellSize - Cell size in pixels
 * @returns {Object} Renderer object
 */
function createStaticRenderer(patternName, phase, globalCellSize) {
  const pattern = Patterns[patternName]
  if (!pattern) {
    throw new Error(`[PatternRenderer] Unknown pattern: ${patternName}`)
  }

  // 1. Get pattern dimensions
  const patternHeight = pattern.length
  const patternWidth = pattern[0] ? pattern[0].length : 0

  // 2. Create temporal grid with 20% padding (authentic B3/S23 evolution)
  const paddedWidth = Math.ceil(patternWidth * 1.2)
  const paddedHeight = Math.ceil(patternHeight * 1.2)
  const tempGol = new GoLEngine(paddedWidth, paddedHeight, 0)

  // 3. Center pattern in temporal grid (gives border cells full 8-neighbor context)
  const tempCenterX = Math.floor((paddedWidth - patternWidth) / 2)
  const tempCenterY = Math.floor((paddedHeight - patternHeight) / 2)
  tempGol.setPattern(pattern, tempCenterX, tempCenterY)

  // 4. Evolve N generations in temporal grid (pure B3/S23 at original size)
  for (let i = 0; i < phase; i++) {
    tempGol.update()
  }

  // 5. Capture evolved pattern snapshot
  const evolvedPattern = tempGol.getPattern()

  // 6. Calculate entity grid size (use padded dimensions)
  const gridSize = Math.max(paddedWidth, paddedHeight)

  // 7. Create entity GoL engine
  const gol = new GoLEngine(gridSize, gridSize, 0)

  // 8. Center evolved pattern in entity grid
  const entityCenterX = Math.floor((gridSize - paddedWidth) / 2)
  const entityCenterY = Math.floor((gridSize - paddedHeight) / 2)

  for (let x = 0; x < paddedWidth; x++) {
    for (let y = 0; y < paddedHeight; y++) {
      const targetX = entityCenterX + x
      const targetY = entityCenterY + y
      if (targetX >= 0 && targetX < gol.cols && targetY >= 0 && targetY < gol.rows) {
        gol.current[targetX][targetY] = evolvedPattern[x][y]
      }
    }
  }

  // 9. Freeze (no further evolution)
  gol.freeze()

  // 10. Calculate dimensions
  const dimensions = {
    gridSize: gridSize,
    cellSize: globalCellSize,
    width: gridSize * globalCellSize,
    height: gridSize * globalCellSize,
    hitboxRadius: (gridSize * globalCellSize) * 0.6
  }

  // 11. Metadata
  const period = PatternPeriod[patternName] || 1
  const metadata = {
    pattern: patternName,
    phase: phase,
    period: period,
    category: PatternMetadata[patternName]?.category || 'unknown',
    mode: RenderMode.STATIC
  }

  debugLog(`[PatternRenderer] Static: ${patternName} phase ${phase}/${period - 1}, ${dimensions.width}×${dimensions.height}px`)

  return { gol, dimensions, metadata }
}

/**
 * Create loop pattern renderer (animated oscillator with periodic reset).
 *
 * ALGORITHM:
 * 1. Create entity grid with 20% padding
 * 2. Apply pattern at center
 * 3. Mark as loop pattern (isLoopPattern flag for LoopPatternHelpers)
 * 4. Configure periodic reset metadata
 * 5. Unfreeze (allow continuous B3/S23 evolution)
 *
 * @private
 * @param {string} patternName - Pattern name
 * @param {number} globalCellSize - Cell size in pixels
 * @param {number} loopUpdateRate - Update rate (fps)
 * @returns {Object} Renderer object
 */
function createLoopRenderer(patternName, globalCellSize, loopUpdateRate) {
  const pattern = Patterns[patternName]
  if (!pattern) {
    throw new Error(`[PatternRenderer] Unknown pattern: ${patternName}`)
  }

  const period = PatternPeriod[patternName] || 1
  if (period === 1) {
    debugWarn(`[PatternRenderer] Pattern ${patternName} is a still life (period 1), loop mode will show no animation`)
  }

  // 1. Get pattern dimensions
  const patternHeight = pattern.length
  const patternWidth = pattern[0] ? pattern[0].length : 0

  // 2. Calculate grid with 20% padding (same as static patterns)
  const paddedWidth = Math.ceil(patternWidth * 1.2)
  const paddedHeight = Math.ceil(patternHeight * 1.2)
  const gridSize = Math.max(paddedWidth, paddedHeight)

  // 3. Create GoL engine (loopUpdateRate controls evolution speed)
  const gol = new GoLEngine(gridSize, gridSize, loopUpdateRate)

  // 4. Center pattern
  const centerX = Math.floor((gridSize - patternWidth) / 2)
  const centerY = Math.floor((gridSize - patternHeight) / 2)
  gol.setPattern(pattern, centerX, centerY)

  // 5. Mark as loop pattern (CRITICAL for LoopPatternHelpers.js)
  gol.isLoopPattern = true
  gol.loopPeriod = period
  gol.loopPattern = pattern
  gol.loopPatternWidth = patternWidth
  gol.loopPatternHeight = patternHeight
  gol.loopResetCounter = 0
  gol.loopLastGeneration = 0

  // 6. Unfreeze (allow continuous evolution)
  gol.unfreeze()

  // 7. Calculate dimensions
  const dimensions = {
    gridSize: gridSize,
    cellSize: globalCellSize,
    width: gridSize * globalCellSize,
    height: gridSize * globalCellSize,
    hitboxRadius: (gridSize * globalCellSize) * 0.6
  }

  // 8. Metadata
  const metadata = {
    pattern: patternName,
    phase: null,  // N/A for loop mode
    period: period,
    category: PatternMetadata[patternName]?.category || 'unknown',
    mode: RenderMode.LOOP
  }

  debugLog(`[PatternRenderer] Loop: ${patternName} period ${period}, ${dimensions.width}×${dimensions.height}px, ${loopUpdateRate}fps`)

  return { gol, dimensions, metadata }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate createPatternRenderer config.
 *
 * @private
 * @param {Object} config - Config to validate
 * @throws {Error} If config invalid
 */
function validateConfig(config) {
  if (!config.mode) {
    throw new Error('[PatternRenderer] config.mode is required')
  }

  if (config.mode !== RenderMode.STATIC && config.mode !== RenderMode.LOOP) {
    throw new Error(`[PatternRenderer] Invalid mode: ${config.mode}. Must be RenderMode.STATIC or RenderMode.LOOP`)
  }

  if (!config.pattern) {
    throw new Error('[PatternRenderer] config.pattern is required')
  }

  // Validate pattern names (single or array)
  const patterns = Array.isArray(config.pattern) ? config.pattern : [config.pattern]
  for (const p of patterns) {
    if (!Patterns[p]) {
      throw new Error(`[PatternRenderer] Unknown pattern: ${p}. Check PatternName enum for valid names.`)
    }
  }

  if (config.mode === RenderMode.STATIC && config.phase !== undefined) {
    if (typeof config.phase !== 'number' || config.phase < 0) {
      throw new Error('[PatternRenderer] config.phase must be a number >= 0')
    }
  }

  if (config.globalCellSize !== undefined) {
    if (typeof config.globalCellSize !== 'number' || config.globalCellSize < 1) {
      throw new Error('[PatternRenderer] config.globalCellSize must be a number >= 1')
    }
  }

  if (config.loopUpdateRate !== undefined) {
    if (typeof config.loopUpdateRate !== 'number' || config.loopUpdateRate < 0) {
      throw new Error('[PatternRenderer] config.loopUpdateRate must be a number >= 0')
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get pattern dimensions without creating engine.
 * Useful for pre-calculation and layout planning.
 *
 * @param {string} patternName - Pattern name (PatternName enum)
 * @param {number} [globalCellSize=30] - Cell size in pixels
 * @returns {Object} { gridSize, cellSize, width, height, hitboxRadius }
 *
 * @example
 * const dims = getPatternDimensions(PatternName.PULSAR, 30)
 * // { gridSize: 16, cellSize: 30, width: 480, height: 480, hitboxRadius: 288 }
 */
export function getPatternDimensions(patternName, globalCellSize = 30) {
  const pattern = Patterns[patternName]
  if (!pattern) {
    throw new Error(`[PatternRenderer] Unknown pattern: ${patternName}`)
  }

  const patternHeight = pattern.length
  const patternWidth = pattern[0] ? pattern[0].length : 0

  const paddedWidth = Math.ceil(patternWidth * 1.2)
  const paddedHeight = Math.ceil(patternHeight * 1.2)
  const gridSize = Math.max(paddedWidth, paddedHeight)

  return {
    gridSize,
    cellSize: globalCellSize,
    width: gridSize * globalCellSize,
    height: gridSize * globalCellSize,
    hitboxRadius: (gridSize * globalCellSize) * 0.6
  }
}

/**
 * Check if pattern supports loop mode.
 * Still lifes (period 1) do not animate in loop mode.
 *
 * @param {string} patternName - Pattern name
 * @returns {boolean} True if oscillator or spaceship (period > 1)
 *
 * @example
 * supportsLoopMode(PatternName.BLINKER)  // true (period 2)
 * supportsLoopMode(PatternName.BLOCK)    // false (still life)
 */
export function supportsLoopMode(patternName) {
  return (PatternPeriod[patternName] || 1) > 1
}

/**
 * Get pattern period (generations per cycle).
 *
 * @param {string} patternName - Pattern name
 * @returns {number} Period (1 for still lifes)
 *
 * @example
 * getPatternPeriod(PatternName.BLINKER)  // 2
 * getPatternPeriod(PatternName.PULSAR)   // 3
 * getPatternPeriod(PatternName.BLOCK)    // 1
 */
export function getPatternPeriod(patternName) {
  return PatternPeriod[patternName] || 1
}

/**
 * Get all patterns by category.
 *
 * @param {string} category - PatternCategory enum value
 * @returns {string[]} Array of pattern names
 *
 * @example
 * const oscillators = getPatternsByCategory(PatternCategory.OSCILLATOR)
 * // ['BLINKER', 'TOAD', 'BEACON', 'PULSAR']
 */
export function getPatternsByCategory(category) {
  return Object.entries(PatternMetadata)
    .filter(([_, meta]) => meta.category === category)
    .map(([name, _]) => name)
}

/**
 * Get random pattern from category.
 *
 * @param {string} category - PatternCategory enum value
 * @returns {string} Random pattern name
 *
 * @example
 * const randomOscillator = getRandomPattern(PatternCategory.OSCILLATOR)
 * // Returns: 'BLINKER' | 'TOAD' | 'BEACON' | 'PULSAR'
 */
export function getRandomPattern(category) {
  const patterns = getPatternsByCategory(category)
  if (patterns.length === 0) {
    throw new Error(`[PatternRenderer] No patterns found for category: ${category}`)
  }
  return patterns[Math.floor(Math.random() * patterns.length)]
}

/**
 * Get all pattern names.
 *
 * @returns {string[]} Array of all pattern names
 *
 * @example
 * const allPatterns = getAllPatterns()
 * // ['BLOCK', 'BEEHIVE', 'LOAF', ..., 'LIGHTWEIGHT_SPACESHIP']
 */
export function getAllPatterns() {
  return Object.keys(PatternName)
}

/**
 * Get pattern category.
 *
 * @param {string} patternName - Pattern name
 * @returns {string} Category (PatternCategory enum value)
 *
 * @example
 * getPatternCategory(PatternName.BLINKER)  // 'oscillator'
 * getPatternCategory(PatternName.BLOCK)    // 'still-life'
 */
export function getPatternCategory(patternName) {
  return PatternMetadata[patternName]?.category || 'unknown'
}
