/**
 * Loop Pattern Helpers
 *
 * Utilities for managing Pure GoL loop patterns (oscillators and spaceships).
 * Handles dynamic speed control and periodic resets.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog } from './Logger.js'

/**
 * Update loop pattern speed and handle periodic resets.
 *
 * PHASE 3: Unified GoL Update Rate
 * - loopUpdateRate is now fps (not frames) - matches Modified GoL entities
 * - Example: loopUpdateRate=30 fps → 30fps (same as Modified GoL)
 * - Directly controls GoL evolution speed via updateThrottled
 * - Tracks GoL generations (not frames) for period-based resets
 *
 * @param {GoLEngine} gol - GoL instance with loop metadata (must have isLoopPattern=true)
 * @param {number} loopUpdateRate - Update rate in fps (from CONFIG.loopUpdateRate)
 * @param {boolean} logChanges - Whether to log speed changes and resets (default: true)
 * @returns {void}
 *
 * @example
 * // In game update loop
 * if (entity.gol.isLoopPattern) {
 *   updateLoopPattern(entity.gol, CONFIG.loopUpdateRate, true)
 * }
 *
 * @example
 * // In particle system (suppress logs to avoid spam)
 * if (particle.gol.isLoopPattern) {
 *   updateLoopPattern(particle.gol, loopUpdateRate, false)
 * }
 */
export function updateLoopPattern(gol, loopUpdateRate, logChanges = true) {
  if (!gol.isLoopPattern) return

  // PHASE 3: Use loopUpdateRate directly as fps (unified with Modified GoL)
  // Example: 30 fps → 30fps, 15 fps → 15fps
  const targetFPS = Math.max(0.5, Math.min(60, loopUpdateRate))

  // Initialize tracking (use hasOwnProperty to distinguish 0 from undefined)
  if (!gol.hasOwnProperty('loopLastGeneration')) {
    gol.loopLastGeneration = gol.generation || 0
    gol.loopResetCounter = 0
  }

  // Update updateRateFPS if slider changed (applies immediately)
  if (gol.updateRateFPS !== targetFPS) {
    gol.updateRateFPS = targetFPS
    if (logChanges) {
      debugLog(`[Loop] Speed updated: ${targetFPS.toFixed(1)}fps (loopUpdateRate=${loopUpdateRate} fps)`)
    }
  }

  // Track actual GoL updates (not frames)
  const currentGeneration = gol.generation || 0
  const generationsSinceLastCheck = currentGeneration - gol.loopLastGeneration

  if (generationsSinceLastCheck >= 1) {
    gol.loopLastGeneration = currentGeneration
    gol.loopResetCounter++

    // Reset after ONE complete period (BLINKER=2, PULSAR=3, GLIDER=4, etc.)
    if (gol.loopResetCounter >= gol.loopPeriod) {
      gol.clearGrid()
      const centerX = Math.floor((gol.cols - gol.loopPatternWidth) / 2)
      const centerY = Math.floor((gol.rows - gol.loopPatternHeight) / 2)
      gol.setPattern(gol.loopPattern, centerX, centerY)
      gol.loopResetCounter = 0
      if (logChanges) {
        debugLog(`[Loop] Pattern reset after ${gol.loopPeriod} generations`)
      }
    }
  }
}
