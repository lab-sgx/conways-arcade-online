/**
 * GoL Helper Functions - Shared utilities for Game of Life games
 *
 * Import these functions in your game file:
 * import { seedRadialDensity, applyLifeForce, maintainDensity } from '../src/utils/GoLHelpers.js'
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Seed GoL grid with radial density gradient.
 * Creates organic, irregular edges by placing more cells in center, fewer at edges.
 *
 * USAGE:
 *   seedRadialDensity(player.gol, 0.85, 0.0)  // Dense center, empty edges
 *   seedRadialDensity(enemy.gol, 0.75, 0.0)   // Slightly less dense
 *
 * @param {GoLEngine} engine - GoL engine to seed
 * @param {number} centerDensity - Probability at center (0.0-1.0, e.g., 0.8 = 80% alive)
 * @param {number} edgeDensity - Probability at edges (0.0-1.0, e.g., 0.1 = 10% alive)
 *
 * @example
 * // Create player with dense organic shape
 * const player = { gol: new GoLEngine(6, 6, 12) }
 * seedRadialDensity(player.gol, 0.85, 0.0)
 */
export function seedRadialDensity(engine, centerDensity = 0.7, edgeDensity = 0.1) {
  const centerX = engine.cols / 2
  const centerY = engine.rows / 2
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

  for (let x = 0; x < engine.cols; x++) {
    for (let y = 0; y < engine.rows; y++) {
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const normalizedDistance = distance / maxDistance
      const density = centerDensity + (edgeDensity - centerDensity) * normalizedDistance

      if (Math.random() < density) {
        engine.setCell(x, y, 1)
      }
    }
  }
}

/**
 * Apply "life force" to prevent entity from dying completely.
 * Maintains minimum cell density by injecting new cells when density drops too low.
 *
 * WHEN TO USE:
 *   - Player entities (must never disappear)
 *   - Critical enemies (should stay visible)
 *   - Bricks/obstacles (maintain visual consistency)
 *
 * WHEN NOT TO USE:
 *   - Bullets (use maintainDensity instead)
 *   - Explosions (should evolve freely)
 *
 * @param {Object} entity - Entity with .gol property
 *
 * @example
 * // In your update loop:
 * player.gol.updateThrottled(state.frameCount)
 * applyLifeForce(player)  // Keep player alive
 */
export function applyLifeForce(entity) {
  if (!entity.gol) return

  const engine = entity.gol
  const totalCells = engine.cols * engine.rows
  const aliveCount = engine.countAliveCells()
  const density = aliveCount / totalCells

  // PHASE 3: Very aggressive lifeForce for high-speed GoL (25-40 fps)
  // Maintain at least 45% density (increased from 35%)
  if (density < 0.45) {
    // Inject 25-35% based on how low the density is (very aggressive)
    const deficitRatio = Math.max(0, 0.45 - density) / 0.45
    const injectionRate = 0.25 + (deficitRatio * 0.10)  // 25-35%
    const cellsToInject = Math.floor(totalCells * injectionRate)

    // Focus injections in center for more organic recovery
    const centerX = engine.cols / 2
    const centerY = engine.rows / 2
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)

    for (let i = 0; i < cellsToInject; i++) {
      // Weighted random towards center
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * maxRadius * 0.7  // 70% of max radius
      const x = Math.floor(centerX + Math.cos(angle) * radius)
      const y = Math.floor(centerY + Math.sin(angle) * radius)

      if (x >= 0 && x < engine.cols && y >= 0 && y < engine.rows) {
        engine.setCell(x, y, 1)
      }
    }
  }
}

/**
 * Maintain exact density without evolution (Visual Only GoL).
 * Use for entities that should NOT evolve with B3/S23 rules.
 *
 * WHEN TO USE:
 *   - Bullets/projectiles (must be predictable)
 *   - Decorative elements (should stay consistent)
 *   - Small entities (too small for meaningful GoL evolution)
 *
 * @param {Object} entity - Entity with .gol property
 * @param {number} targetDensity - Target density (0.0-1.0, default 0.6)
 *
 * @example
 * // For bullets (Visual Only - no evolution):
 * if (state.frameCount % 5 === 0) {
 *   maintainDensity(bullet, 0.75)
 * }
 */
export function maintainDensity(entity, targetDensity = 0.6) {
  if (!entity.gol) return

  const engine = entity.gol
  const totalCells = engine.cols * engine.rows
  const aliveCount = engine.countAliveCells()
  const currentDensity = aliveCount / totalCells

  if (currentDensity < targetDensity) {
    const cellsToRevive = Math.floor(totalCells * (targetDensity - currentDensity))
    for (let i = 0; i < cellsToRevive; i++) {
      const x = Math.floor(Math.random() * engine.cols)
      const y = Math.floor(Math.random() * engine.rows)
      engine.setCell(x, y, 1)
    }
  }
}
