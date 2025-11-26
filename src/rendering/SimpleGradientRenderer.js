/**
 * Simple Gradient Renderer - KISS principle
 *
 * No fancy optimizations. Just works.
 * Pre-renders gradients once, reuses them.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { CELL_STATES } from '../utils/Config.js'
import { GOOGLE_COLORS } from '../utils/GradientPresets.js'
import { debugWarn, debugError } from '../utils/Logger.js'

const { ALIVE } = CELL_STATES

/**
 * Ultra-simple gradient renderer with global background gradient.
 *
 * Philosophy:
 * - Single animated gradient covers entire screen
 * - GoL cells act as mask revealing the gradient
 * - Keep it stupid simple (KISS)
 */
class SimpleGradientRenderer {
  /**
   * Create gradient renderer
   *
   * @param {p5} p5Instance - p5.js instance (EXCEPTION: needs 'this' in p5.js GLOBAL mode)
   *
   * @example
   * // In p5.js sketch
   * function setup() {
   *   createCanvas(1200, 1920)
   *   maskedRenderer = new SimpleGradientRenderer(this)
   * }
   */
  constructor(p5Instance) {
    // In p5.js GLOBAL mode, all p5 functions are in window scope
    // Accept p5Instance for compatibility, but use window in global mode
    this.p5 = p5Instance || window

    // Animation offset for gradient scrolling
    this.animationOffset = 0

    // Global gradient palette (official Google brand colors)
    this.palette = [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ]

    // Control points for smooth gradient
    this.controlPoints = 20
  }

  /**
   * Get color from 2D animated noise field (like flowing clouds).
   *
   * Uses Perlin noise to create smooth, organic color transitions.
   * The noise field animates over time via animationOffset.
   *
   * @param {number} screenX - X position in screen coordinates
   * @param {number} screenY - Y position in screen coordinates
   * @returns {number[]} RGB color array [r, g, b]
   *
   * @example
   * const [r, g, b] = renderer.getGradientColor(100, 200)
   * fill(r, g, b)
   * rect(100, 200, 30, 30)
   */
  getGradientColor(screenX, screenY) {
    // Noise scale - controls the "zoom" of the noise pattern
    // Smaller = larger, smoother blobs
    // Larger = smaller, more detailed variation
    const noiseScale = 0.002

    // Sample 2D Perlin noise with time dimension for animation
    const noiseValue = this.p5.noise(
      screenX * noiseScale,
      screenY * noiseScale,
      this.animationOffset * 0.5  // Time dimension for smooth animation
    )

    // Defensive check: if noise returns NaN, use simple fallback
    if (isNaN(noiseValue)) {
      debugWarn('[SimpleGradientRenderer] noise() returned NaN at', screenX, screenY, '- using first palette color')
      // Return first palette color as safe fallback
      if (this.palette && this.palette.length > 0 && this.palette[0]) {
        return this.palette[0]
      }
      // Ultimate fallback: white
      return [255, 255, 255]
    }

    // Map noise (0.0 to 1.0) to color palette with smooth interpolation
    const t = noiseValue  // Direct use of noise value

    // Map to control points for smooth color transitions
    const colorIndex = t * (this.controlPoints - 1)
    const i1 = Math.floor(colorIndex) % this.palette.length
    const i2 = (i1 + 1) % this.palette.length
    const localT = colorIndex - Math.floor(colorIndex)

    // Interpolate between colors
    const c1 = this.palette[i1]
    const c2 = this.palette[i2]

    // Defensive check for undefined palette colors or invalid array access
    if (!c1 || !c2 || !Array.isArray(c1) || !Array.isArray(c2) ||
        c1.length < 3 || c2.length < 3 ||
        typeof c1[0] !== 'number' || typeof c2[0] !== 'number') {
      debugError('[SimpleGradientRenderer] Invalid palette data:', {
        i1, i2,
        paletteLength: this.palette.length,
        c1, c2,
        screenX, screenY,
        noiseValue: t
      })
      // Return first valid color or white
      if (this.palette && this.palette.length > 0 && this.palette[0] && Array.isArray(this.palette[0])) {
        return this.palette[0].slice()  // Clone to avoid mutations
      }
      return [255, 255, 255]  // Ultimate fallback: white
    }

    const r = this.p5.lerp(c1[0], c2[0], localT)
    const g = this.p5.lerp(c1[1], c2[1], localT)
    const b = this.p5.lerp(c1[2], c2[2], localT)

    return [r, g, b]
  }

  /**
   * Render GoL grid as mask revealing background gradient with noise.
   *
   * Only alive cells are rendered, each sampling the gradient at its center position.
   * This creates an organic, flowing appearance as the GoL evolves.
   *
   * @param {GoLEngine} engine - GoL engine instance
   * @param {number} x - Top-left X position of grid
   * @param {number} y - Top-left Y position of grid
   * @param {number} cellSize - Size of each cell in pixels
   * @param {object} gradientConfig - Not used (kept for API compatibility)
   *
   * @example
   * const player = {
   *   gol: new GoLEngine(6, 6, 12),
   *   x: 100, y: 200,
   *   cellSize: 30,
   *   gradient: GRADIENT_PRESETS.PLAYER
   * }
   * renderer.renderMaskedGrid(player.gol, player.x, player.y, player.cellSize, player.gradient)
   */
  renderMaskedGrid(engine, x, y, cellSize, gradientConfig) {
    const cols = engine.cols
    const rows = engine.rows

    this.p5.push()
    this.p5.noStroke()

    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        if (engine.current[gx][gy] === ALIVE) {
          const px = x + gx * cellSize
          const py = y + gy * cellSize

          // Get color from global gradient with noise at screen position
          const [r, g, b] = this.getGradientColor(
            px + cellSize / 2,
            py + cellSize / 2
          )

          this.p5.fill(r, g, b)
          this.p5.rect(px, py, cellSize, cellSize)
        }
      }
    }

    this.p5.pop()
  }

  /**
   * Create gradient image.
   * Simple vertical gradient using p5.js.
   *
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {object} config - Gradient config
   * @returns {p5.Graphics} Gradient image
   */
  createGradient(width, height, config) {
    const { palette } = config
    const buffer = this.p5.createGraphics(width, height)

    buffer.noStroke()

    // Draw vertical gradient using simple color interpolation
    for (let y = 0; y < height; y++) {
      const t = y / height

      // Find which two colors to interpolate between
      const colorCount = palette.length
      const index = t * (colorCount - 1)
      const i1 = Math.floor(index)
      const i2 = Math.min(i1 + 1, colorCount - 1)
      const localT = index - i1

      // Interpolate
      const c1 = palette[i1]
      const c2 = palette[i2]
      const r = this.p5.lerp(c1[0], c2[0], localT)
      const g = this.p5.lerp(c1[1], c2[1], localT)
      const b = this.p5.lerp(c1[2], c2[2], localT)

      buffer.fill(r, g, b)
      buffer.rect(0, y, width, 1)
    }

    return buffer
  }

  /**
   * Update gradient animation offset
   *
   * Call this every frame to animate the gradient smoothly.
   * Increments the time dimension of the Perlin noise field.
   *
   * @example
   * function draw() {
   *   // ... render game
   *   maskedRenderer.updateAnimation()
   * }
   */
  updateAnimation() {
    this.animationOffset += 0.005 // Slow, smooth animation
  }
}

export { SimpleGradientRenderer }
