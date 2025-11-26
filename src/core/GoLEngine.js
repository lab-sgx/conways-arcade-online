/**
 * Conway's Game of Life Engine with double buffer pattern.
 * Implements B3/S23 rules (Birth: 3 neighbors, Survival: 2 or 3 neighbors).
 *
 * @author Game of Life Arcade
 * @license ISC
 */

const ALIVE = 1
const DEAD = 0

/**
 * Game of Life Engine implementing Conway's B3/S23 rules with double buffer.
 */
class GoLEngine {
  /**
   * Create a new GoL engine.
   *
   * @param {number} cols - Number of columns in the grid
   * @param {number} rows - Number of rows in the grid
   * @param {number} updateRateFPS - Target update rate in frames per second (default: 10)
   */
  constructor(cols, rows, updateRateFPS = 10) {
    this.cols = cols
    this.rows = rows
    this._updateRateFPS = updateRateFPS  // Private storage
    this.framesBetweenUpdates = 60 / updateRateFPS  // Assuming 60fps main loop
    this.frameCounter = 0
    this._throttleAccumulator = 0  // Accumulator for fractional frames

    // Double buffer - CRITICAL for correct GoL implementation
    this.current = this.create2DArray(cols, rows)
    this.next = this.create2DArray(cols, rows)

    this.generation = 0
    this._frozen = false  // Freeze state for static patterns
  }

  /**
   * Get the current update rate in FPS.
   * @returns {number} Update rate in frames per second
   */
  get updateRateFPS() {
    return this._updateRateFPS
  }

  /**
   * Set the update rate in FPS. Automatically recalculates framesBetweenUpdates.
   * @param {number} fps - New update rate in frames per second
   */
  set updateRateFPS(fps) {
    this._updateRateFPS = fps
    this.framesBetweenUpdates = 60 / fps  // Recalculate throttle interval
    this._throttleAccumulator = 0  // Reset accumulator when rate changes
  }

  /**
   * Create a 2D array initialized with zeros (dead cells).
   *
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {number[][]} 2D array of dead cells
   */
  create2DArray(cols, rows) {
    const arr = new Array(cols)
    for (let i = 0; i < cols; i++) {
      arr[i] = new Array(rows).fill(DEAD)
    }
    return arr
  }

  /**
   * Set a specific cell to alive or dead.
   *
   * @param {number} x - Column index
   * @param {number} y - Row index
   * @param {number} state - ALIVE or DEAD
   */
  setCell(x, y, state) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.current[x][y] = state
    }
  }

  /**
   * Get the state of a specific cell.
   *
   * @param {number} x - Column index
   * @param {number} y - Row index
   * @returns {number} ALIVE or DEAD
   */
  getCell(x, y) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      return this.current[x][y]
    }
    return DEAD  // Out of bounds = dead
  }

  /**
   * Clear the grid (set all cells to dead).
   */
  clearGrid() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.current[x][y] = DEAD
        this.next[x][y] = DEAD
      }
    }
    this.generation = 0
  }

  /**
   * Seed the grid with random cells (~30% density).
   *
   * @param {number} density - Probability of a cell being alive (default: 0.3)
   */
  randomSeed(density = 0.3) {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.current[x][y] = Math.random() < density ? ALIVE : DEAD
      }
    }
    this.generation = 0
  }

  /**
   * Count live neighbors for a cell using Moore neighborhood (8 neighbors).
   *
   * @param {number[][]} grid - The grid to read from
   * @param {number} x - Column index
   * @param {number} y - Row index
   * @returns {number} Number of live neighbors (0-8)
   */
  countLiveNeighbors(grid, x, y) {
    let count = 0

    // Check all 8 neighbors (Moore neighborhood)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        // Skip the center cell
        if (dx === 0 && dy === 0) continue

        const nx = x + dx
        const ny = y + dy

        // Check bounds and count if alive
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
          count += grid[nx][ny]
        }
        // Out of bounds cells are treated as dead (fixed boundary)
      }
    }

    return count
  }

  /**
   * Apply Conway's B3/S23 rules.
   * Birth: exactly 3 neighbors → becomes alive
   * Survival: 2 or 3 neighbors → stays alive
   * Death: < 2 (underpopulation) or > 3 (overpopulation) → dies
   *
   * @param {number} currentState - Current cell state (ALIVE or DEAD)
   * @param {number} neighbors - Number of live neighbors
   * @returns {number} Next state (ALIVE or DEAD)
   */
  applyB3S23Rules(currentState, neighbors) {
    if (currentState === ALIVE) {
      // Survival: 2 or 3 neighbors
      return (neighbors === 2 || neighbors === 3) ? ALIVE : DEAD
    } else {
      // Birth: exactly 3 neighbors
      return (neighbors === 3) ? ALIVE : DEAD
    }
  }

  /**
   * Update the grid to the next generation using double buffer pattern.
   * CRITICAL: Never modifies current grid while reading it.
   */
  update() {
    // Read from current, write to next
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const neighbors = this.countLiveNeighbors(this.current, x, y)
        const currentState = this.current[x][y]
        this.next[x][y] = this.applyB3S23Rules(currentState, neighbors)
      }
    }

    // Swap buffers (pointer swap, not data copy)
    const temp = this.current
    this.current = this.next
    this.next = temp

    this.generation++
  }

  /**
   * Update with frame rate throttling.
   * Call this from your main draw() loop.
   *
   * Uses accumulator pattern to handle fractional framesBetweenUpdates.
   * Example: 25 fps = 2.4 frames between updates (not 2 or 3, but exactly 2.4 average)
   *
   * @param {number} frameCount - Current frame count from p5.js (unused, kept for API compatibility)
   * @returns {boolean} True if an update occurred
   */
  updateThrottled(frameCount) {
    // Skip update if frozen (for static patterns)
    if (this._frozen) {
      return false
    }

    // Accumulator pattern for fractional frame intervals
    this._throttleAccumulator += 1
    if (this._throttleAccumulator >= this.framesBetweenUpdates) {
      this._throttleAccumulator -= this.framesBetweenUpdates
      this.update()
      return true
    }
    return false
  }

  /**
   * Freeze GoL evolution (for static pattern display).
   * When frozen, updateThrottled() will skip all updates.
   *
   * @example
   * gol.freeze()
   * gol.setPattern(Patterns.GLIDER, 0, 0)
   * // Pattern will remain static, no evolution
   */
  freeze() {
    this._frozen = true
  }

  /**
   * Unfreeze GoL evolution (resume normal B3/S23 updates).
   *
   * @example
   * gol.unfreeze()
   * // Pattern will resume evolving according to B3/S23 rules
   */
  unfreeze() {
    this._frozen = false
  }

  /**
   * Check if GoL is currently frozen.
   *
   * @returns {boolean} True if frozen, false otherwise
   */
  isFrozen() {
    return this._frozen
  }

  /**
   * Set a pattern at a specific location.
   * Pattern format: pattern[row][col] where row=y, col=x
   *
   * @param {number[][]} pattern - 2D array where 1=alive, 0=dead (row-major format)
   * @param {number} startX - Starting column index
   * @param {number} startY - Starting row index
   */
  setPattern(pattern, startX = 0, startY = 0) {
    // Pattern is in row-major format: pattern[row][col]
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const gridX = startX + col
        const gridY = startY + row
        if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
          this.current[gridX][gridY] = pattern[row][col]
        }
      }
    }
  }

  /**
   * Get the current grid as a pattern (2D array).
   *
   * @returns {number[][]} Copy of the current grid
   */
  getPattern() {
    const pattern = []
    for (let x = 0; x < this.cols; x++) {
      pattern[x] = [...this.current[x]]
    }
    return pattern
  }

  /**
   * Get a region of the grid.
   *
   * @param {number} startX - Starting column
   * @param {number} startY - Starting row
   * @param {number} width - Width of region
   * @param {number} height - Height of region
   * @returns {number[][]} 2D array of the region
   */
  getRegion(startX, startY, width, height) {
    const region = []
    for (let x = 0; x < width; x++) {
      region[x] = []
      for (let y = 0; y < height; y++) {
        const gridX = startX + x
        const gridY = startY + y
        if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
          region[x][y] = this.current[gridX][gridY]
        } else {
          region[x][y] = DEAD
        }
      }
    }
    return region
  }

  /**
   * Count total alive cells in the grid.
   *
   * @returns {number} Number of alive cells
   */
  countAliveCells() {
    let count = 0
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        count += this.current[x][y]
      }
    }
    return count
  }

  /**
   * Get cell density (percentage of alive cells).
   *
   * @returns {number} Density as a value between 0 and 1
   */
  getDensity() {
    return this.countAliveCells() / (this.cols * this.rows)
  }
}

/**
 * DESIGN DECISION: Circular Mask with Interval for Organic Shapes
 *
 * PROBLEM: Rectangular grids (10x10) look too square/geometric
 * SOLUTION: Kill cells outside circular boundary, but allow free evolution between applications
 *
 * IMPLEMENTATION:
 * - Mask applied every N generations (default: 6 frames)
 * - Between applications, GoL evolves freely → organic, irregular edges
 * - On mask application, shape "snaps back" to circular boundary
 * - Radius = 80% of grid size (allows edge variation)
 * - Center = (cols/2, rows/2)
 *
 * CRITICAL: Mask is applied every maskInterval generations, NOT every frame
 *
 * WHY INTERVAL? Allows GoL patterns to evolve naturally between mask applications
 * - Frames 1-5: Irregular, organic edges as GoL evolves freely
 * - Frame 6: Mask applied → pruned back to circular boundary
 * - Creates "breathing" effect with organic edges
 *
 * TRADE-OFFS:
 * + Very organic, irregular shapes (less geometric)
 * + Authentic GoL evolution between masks
 * + Patterns can complete partial cycles
 * - More complex conceptually (two interacting systems)
 * - Shape fluctuates between applications
 * - Requires tuning interval for visual stability
 *
 * PARAMETERS:
 * - gridSize: Inherited from GoLEngine (typically 10x10)
 * - maskRadius: Auto-calculated as 80% of grid radius
 * - maskInterval: How often to apply mask (default: 6 generations)
 *
 * TO MODIFY:
 * - Larger sprites: Increase grid size → radius scales automatically
 * - More organic edges:
 *   • Increase maskInterval (e.g., 10) for more wild growth
 *   • Reduce maskRadiusFactor (e.g., 0.75) for tighter pruning
 * - More stable/circular:
 *   • Decrease maskInterval (e.g., 3) for frequent pruning
 *   • Increase maskRadiusFactor (e.g., 0.85) for looser bounds
 *
 * TUNING GUIDE:
 * - Interval 3-5: Subtle organic variation, mostly circular
 * - Interval 6-8: Balanced organic/stable (RECOMMENDED)
 * - Interval 10+: Very organic but can look unstable
 *
 * @extends GoLEngine
 */
class CircularMaskedGoL extends GoLEngine {
  /**
   * Create a new GoL engine with interval-based circular masking.
   *
   * @param {number} cols - Number of columns in the grid
   * @param {number} rows - Number of rows in the grid
   * @param {number} updateRateFPS - Target update rate in frames per second
   * @param {number} maskRadiusFactor - Radius as percentage of grid (default: 0.8)
   * @param {number} maskInterval - Apply mask every N generations (default: 6)
   */
  constructor(cols, rows, updateRateFPS = 10, maskRadiusFactor = 0.8, maskInterval = 6) {
    super(cols, rows, updateRateFPS)

    // Calculate circular mask parameters
    this.centerX = cols / 2
    this.centerY = rows / 2
    this.maskRadius = (Math.min(cols, rows) / 2) * maskRadiusFactor
    this.maskInterval = maskInterval
  }

  /**
   * Apply circular mask: kill all cells outside the circular boundary.
   * Called every maskInterval generations (not every frame).
   */
  applyCircularMask() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        // Calculate distance from center
        const dx = x - this.centerX
        const dy = y - this.centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Kill cells outside radius
        if (distance > this.maskRadius) {
          this.current[x][y] = DEAD
        }
      }
    }
  }

  /**
   * Update GoL and conditionally apply circular mask.
   * Overrides parent update() to add interval-based masking.
   */
  update() {
    super.update()  // Standard GoL update with B3/S23 rules

    // Apply mask every N generations (not every frame)
    if (this.generation % this.maskInterval === 0) {
      this.applyCircularMask()
    }
  }
}

export { GoLEngine, CircularMaskedGoL, ALIVE, DEAD }
