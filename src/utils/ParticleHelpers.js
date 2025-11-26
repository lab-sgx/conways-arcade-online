/**
 * Particle System Helpers
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { updateLoopPattern } from './LoopPatternHelpers.js'

/**
 * Update all particles in array (movement + fade + cleanup).
 *
 * USAGE: Call this every frame for explosion particles
 *
 * @param {Array} particles - Array of particle objects
 * @param {number} frameCount - Current frame count from state
 * @param {number} loopUpdateRate - Frames between loop phase changes (from CONFIG.loopUpdateRate)
 * @returns {Array} Filtered array (dead particles removed)
 *
 * @example
 * // In your updateGame() function:
 * particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)
 */
export function updateParticles(particles, frameCount, loopUpdateRate = 30) {
  particles.forEach(p => {
    p.gol.updateThrottled(frameCount)

    // Handle loop pattern resets for Pure GoL patterns
    // Explosions are Tier 1 (Pure GoL) and may use loop patterns
    // Use updateLoopPattern with logChanges=false to avoid console spam
    if (p.gol.isLoopPattern) {
      updateLoopPattern(p.gol, loopUpdateRate, false)
    }

    p.x += p.vx
    p.y += p.vy

    // Handle lifetime-based particles (mini-explosions)
    if (p.lifetime !== undefined) {
      p.lifetime--
      if (p.lifetime <= 0) {
        p.dead = true
      }
    } else {
      // Default alpha-based fade for regular particles
      p.alpha -= 4
      if (p.alpha <= 0) p.dead = true
    }
  })

  return particles.filter(p => !p.dead)
}

/**
 * Render particles with alpha transparency.
 *
 * Uses each particle's own cellSize, or optional globalCellSize parameter.
 *
 * @param {Array} particles - Array of particle objects
 * @param {SimpleGradientRenderer} renderer - Gradient renderer instance
 * @param {number} [globalCellSize] - Optional global cell size (uses particle.cellSize if not provided)
 *
 * @example
 * // With individual particle cellSize:
 * renderParticles(particles, maskedRenderer)
 *
 * // With global cellSize:
 * renderParticles(particles, maskedRenderer, CONFIG.globalCellSize)
 */
export function renderParticles(particles, renderer, globalCellSize) {
  particles.forEach(p => {
    if (p.alpha > 0) {
      push()
      drawingContext.globalAlpha = p.alpha / 255
      // Use globalCellSize if provided, otherwise use particle's own cellSize
      const cellSize = globalCellSize !== undefined ? globalCellSize : p.cellSize
      renderer.renderMaskedGrid(p.gol, p.x, p.y, cellSize, p.gradient)
      pop()
    }
  })
}
