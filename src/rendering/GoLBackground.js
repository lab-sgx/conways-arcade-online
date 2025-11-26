/**
 * GoLBackground - Reusable Game of Life background with animated gradients
 *
 * Features:
 * - SimpleGradientRenderer integration for beautiful animated gradients
 * - Performance tracking (update and render times)
 * - Debug overlay with stats (generation, density, FPS)
 * - Configuration via Config.js with override support
 * - Portrait 1200×1920 optimized
 * - Reusable across multiple screens
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '../core/GoLEngine.js'
import { SimpleGradientRenderer } from './SimpleGradientRenderer.js'
import { VISUAL_CONFIG, PERFORMANCE_CONFIG, DENSITY_CONFIG } from '../utils/Config.js'
import { debugLog } from '../utils/Logger.js'

/**
 * Pure GoL background with animated gradient rendering
 */
export class GoLBackground {
  /**
   * Create a GoL background instance
   *
   * @param {object} p5Instance - p5.js instance
   * @param {object} options - Configuration options
   * @param {number} options.cols - Grid columns (default: VISUAL_CONFIG.GRID_COLS)
   * @param {number} options.rows - Grid rows (default: VISUAL_CONFIG.GRID_ROWS)
   * @param {number} options.updateRate - GoL update rate in fps (default: PERFORMANCE_CONFIG.BACKGROUND_UPDATE_RATE)
   * @param {object} options.renderer - Custom renderer (default: new SimpleGradientRenderer)
   * @param {boolean} options.debug - Enable debug overlay (default: false)
   */
  constructor(p5Instance, options = {}) {
    this.p5 = p5Instance

    // Configuration
    this.cols = options.cols || VISUAL_CONFIG.GRID_COLS
    this.rows = options.rows || VISUAL_CONFIG.GRID_ROWS
    this.updateRate = options.updateRate || PERFORMANCE_CONFIG.BACKGROUND_UPDATE_RATE

    // Initialize GoL engine
    this.engine = new GoLEngine(this.cols, this.rows, this.updateRate)

    // Initialize renderer (SimpleGradientRenderer by default)
    this.renderer = options.renderer || new SimpleGradientRenderer(p5Instance)

    // Debug mode
    this.debugMode = options.debug || false

    // Performance tracking
    this.stats = {
      lastUpdateTime: 0,
      lastRenderTime: 0,
      generation: 0,
      aliveCount: 0,
      density: 0,
      updateCount: 0
    }

    // Position settings (for future offset support)
    this.offsetX = 0
    this.offsetY = 0
  }

  /**
   * Seed the background with random cells
   *
   * @param {number} density - Cell density (0.0 to 1.0, default: 0.3)
   */
  randomSeed(density = DENSITY_CONFIG.RANDOM_SEED) {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (Math.random() < density) {
          this.engine.setCell(x, y, 1)
        }
      }
    }
  }

  /**
   * Set a specific pattern at a location
   *
   * @param {number[][]} pattern - Pattern to set
   * @param {number} x - Starting column
   * @param {number} y - Starting row
   */
  setPattern(pattern, x, y) {
    this.engine.setPattern(pattern, x, y)
  }

  /**
   * Clear the background (all cells dead)
   */
  clear() {
    this.engine.clearGrid()
  }

  /**
   * Update the GoL simulation with throttling
   * Call this from p5.draw() every frame
   *
   * @param {number} frameCount - Current frame count from p5.frameCount
   */
  update(frameCount) {
    const startTime = performance.now()

    // Update engine with throttling
    this.engine.updateThrottled(frameCount)

    const endTime = performance.now()
    this.stats.lastUpdateTime = endTime - startTime
    this.stats.updateCount++
    this.stats.generation = this.engine.generation
    this.stats.aliveCount = this.engine.countAliveCells()
    this.stats.density = this.stats.aliveCount / (this.cols * this.rows)

    // Optional: Log performance
    if (PERFORMANCE_CONFIG.ENABLE_PERFORMANCE_LOGGING) {
      if (this.stats.updateCount % PERFORMANCE_CONFIG.PERFORMANCE_LOG_INTERVAL === 0) {
        debugLog(`[GoLBackground] Update time: ${this.stats.lastUpdateTime.toFixed(3)}ms`)
      }
    }
  }

  /**
   * Render the background with gradient
   *
   * @param {number} x - X offset for rendering position
   * @param {number} y - Y offset for rendering position
   * @param {number} cellSize - Size of each cell in pixels
   * @param {object} gradientPreset - Gradient preset from GRADIENT_PRESETS
   */
  render(x = 0, y = 0, cellSize = VISUAL_CONFIG.CELL_SIZE, gradientPreset = null) {
    const startTime = performance.now()

    // Render using SimpleGradientRenderer
    if (this.renderer && typeof this.renderer.renderMaskedGrid === 'function') {
      this.renderer.renderMaskedGrid(this.engine, x, y, cellSize, gradientPreset)

      // Update gradient animation
      if (typeof this.renderer.updateAnimation === 'function') {
        this.renderer.updateAnimation()
      }
    } else {
      // Fallback: render as simple white cells
      this.renderSimple(x, y, cellSize)
    }

    const endTime = performance.now()
    this.stats.lastRenderTime = endTime - startTime

    // Optional: Log performance
    if (PERFORMANCE_CONFIG.ENABLE_PERFORMANCE_LOGGING) {
      if (this.p5.frameCount % PERFORMANCE_CONFIG.PERFORMANCE_LOG_INTERVAL === 0) {
        debugLog(`[GoLBackground] Render time: ${this.stats.lastRenderTime.toFixed(3)}ms`)
      }
    }

    // Render debug overlay if enabled
    if (this.debugMode) {
      this.renderDebugInfo()
    }
  }

  /**
   * Fallback simple rendering (white cells)
   * Used when SimpleGradientRenderer is not available
   *
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {number} cellSize - Cell size
   */
  renderSimple(x, y, cellSize) {
    this.p5.fill(255)
    this.p5.noStroke()

    // Use batch rendering for performance
    this.p5.beginShape(this.p5.QUADS)

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.engine.current[col][row] === 1) {
          const px = x + col * cellSize
          const py = y + row * cellSize

          // Add quad vertices
          this.p5.vertex(px, py)
          this.p5.vertex(px + cellSize, py)
          this.p5.vertex(px + cellSize, py + cellSize)
          this.p5.vertex(px, py + cellSize)
        }
      }
    }

    this.p5.endShape()
  }

  /**
   * Center the background on the canvas
   */
  centerOnCanvas() {
    const gridWidth = this.cols * VISUAL_CONFIG.CELL_SIZE
    const gridHeight = this.rows * VISUAL_CONFIG.CELL_SIZE

    this.offsetX = (this.p5.width - gridWidth) / 2
    this.offsetY = (this.p5.height - gridHeight) / 2
  }

  /**
   * Set position offset for rendering
   *
   * @param {number} x - X offset
   * @param {number} y - Y offset
   */
  setOffset(x, y) {
    this.offsetX = x
    this.offsetY = y
  }

  /**
   * Get current cell density
   *
   * @returns {number} Density as a value between 0 and 1
   */
  getDensity() {
    return this.stats.density
  }

  /**
   * Get number of alive cells
   *
   * @returns {number} Count of alive cells
   */
  getAliveCount() {
    return this.stats.aliveCount
  }

  /**
   * Get current generation count
   *
   * @returns {number} Generation number
   */
  getGeneration() {
    return this.stats.generation
  }

  /**
   * Get performance statistics
   *
   * @returns {object} Stats object with all metrics
   */
  getStats() {
    return {
      ...this.stats,
      fps: this.p5.frameRate()
    }
  }

  /**
   * Render debug information overlay
   *
   * @param {number} x - X position (default: 10)
   * @param {number} y - Y position (default: 40)
   */
  renderDebugInfo(x = 10, y = 40) {
    const totalCells = this.cols * this.rows
    const fps = this.p5.frameRate()

    // Draw semi-transparent background for better readability
    this.p5.fill(0, 0, 0, 180)
    this.p5.noStroke()
    this.p5.rect(x - 5, y - 20, 280, 140)

    // Render text with monospace font
    this.p5.fill(255)
    this.p5.textSize(16)
    this.p5.textAlign(this.p5.LEFT, this.p5.TOP)
    this.p5.textFont('monospace')

    // Stats
    this.p5.text(`Gen: ${this.stats.generation}`, x, y)
    this.p5.text(`Alive: ${this.stats.aliveCount}/${totalCells}`, x, y + 22)
    this.p5.text(`Density: ${(this.stats.density * 100).toFixed(1)}%`, x, y + 44)
    this.p5.text(`Update: ${this.stats.lastUpdateTime.toFixed(2)}ms`, x, y + 66)
    this.p5.text(`Render: ${this.stats.lastRenderTime.toFixed(2)}ms`, x, y + 88)

    // FPS with color coding
    const fpsColor = fps > 55 ? '#00FF00' : fps > 30 ? '#FFFF00' : '#FF0000'
    this.p5.fill(fpsColor)
    this.p5.text(`FPS: ${fps.toFixed(1)}`, x, y + 110)
  }

  /**
   * Get a region of the grid (for testing/debugging)
   *
   * @param {number} startX - Starting column
   * @param {number} startY - Starting row
   * @param {number} width - Width of region
   * @param {number} height - Height of region
   * @returns {number[][]} 2D array of the region
   */
  getRegion(startX, startY, width, height) {
    return this.engine.getRegion(startX, startY, width, height)
  }
}
