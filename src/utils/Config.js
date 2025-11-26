/**
 * Configuration constants for Game of Life Arcade.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Visual configuration for rendering.
 *
 * @type {{
 *   CANVAS_WIDTH: number,
 *   CANVAS_HEIGHT: number,
 *   CELL_SIZE: number,
 *   CELL_SPACING: number,
 *   GRID_COLS: number,
 *   GRID_ROWS: number,
 *   BACKGROUND_COLOR: string,
 *   CELL_COLOR: string,
 *   CELL_ALPHA: number,
 *   USE_WEBGL: boolean
 * }}
 *
 * @property {number} CANVAS_WIDTH - Canvas width in pixels (1200px portrait)
 * @property {number} CANVAS_HEIGHT - Canvas height in pixels (1920px portrait)
 * @property {number} CELL_SIZE - Size of each cell in pixels (30px = 1200/40)
 * @property {number} CELL_SPACING - Spacing between cells (0 for solid grid)
 * @property {number} GRID_COLS - Number of grid columns (40 = 1200/30)
 * @property {number} GRID_ROWS - Number of grid rows (64 = 1920/30)
 * @property {string} BACKGROUND_COLOR - Background hex color (#FFFFFF)
 * @property {string} CELL_COLOR - Cell base color (#FFFFFF, gradients override)
 * @property {number} CELL_ALPHA - Cell opacity (0-255, 255 = full opacity)
 * @property {boolean} USE_WEBGL - Use WEBGL renderer (false = 2D canvas mode)
 *
 * @example
 * // Portrait 1200×1920 canvas setup
 * createCanvas(VISUAL_CONFIG.CANVAS_WIDTH, VISUAL_CONFIG.CANVAS_HEIGHT)
 * background(VISUAL_CONFIG.BACKGROUND_COLOR)
 *
 * @example
 * // Grid initialization
 * const cols = VISUAL_CONFIG.GRID_COLS  // 40
 * const rows = VISUAL_CONFIG.GRID_ROWS  // 64
 * const grid = new GoLEngine(cols, rows, VISUAL_CONFIG.CELL_SIZE)
 */
export const VISUAL_CONFIG = {
  // Canvas dimensions (1200×1920 portrait for physical installation)
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 1920,

  // Cell size and spacing
  CELL_SIZE: 30,  // Size of each cell in pixels (1200/40 = 30)
  CELL_SPACING: 0,  // Spacing between cells (0 for solid grid)

  // Grid dimensions (portrait 40×64 grid)
  GRID_COLS: 40,  // 40 columns (1200 / 30 = 40)
  GRID_ROWS: 64,  // 64 rows (1920 / 30 = 64)

  // Colors (monochrome base, gradients applied via renderer)
  BACKGROUND_COLOR: '#FFFFFF',  // White background
  CELL_COLOR: '#FFFFFF',  // White cells (gradients override this)
  CELL_ALPHA: 255,  // Full opacity

  // Rendering mode
  USE_WEBGL: false  // Use WEBGL for hardware acceleration (keep false for now - 2D mode works better)
}

/**
 * Game cell scaling configuration.
 *
 * All games normalized to 10px baseline, then scaled 3x to match IdleScreen's 30px.
 * Strategy: Adjust layout (reduce enemies, modify spacing) to fit scaled elements.
 * Grid sizes (6×6, 8×8, etc.) are maintained - only cellSize changes.
 *
 * @type {{
 *   OLD_CELL_SIZE: number,
 *   NEW_CELL_SIZE: number,
 *   SCALE_FACTOR: number
 * }}
 *
 * @property {number} OLD_CELL_SIZE - Baseline cell size in pixels (10px)
 * @property {number} NEW_CELL_SIZE - Target cell size in pixels (30px)
 * @property {number} SCALE_FACTOR - Scaling multiplier (3.0 = 30/10)
 *
 * @example
 * // Scale entity from old size to new size
 * const entityWidth = 6 * GAME_SCALE.NEW_CELL_SIZE   // 180px (6 cells × 30px)
 * const entityHeight = 6 * GAME_SCALE.NEW_CELL_SIZE  // 180px
 *
 * @example
 * // Create GoL engine with new cell size
 * const player = {
 *   gol: new GoLEngine(6, 6, GAME_SCALE.NEW_CELL_SIZE),  // 6×6 grid, 30px cells
 *   x: 100,
 *   y: 200
 * }
 */
export const GAME_SCALE = {
  OLD_CELL_SIZE: 10,   // Baseline cell size (normalized across all games)
  NEW_CELL_SIZE: 30,   // Target cell size (matches IdleScreen for visual consistency)
  SCALE_FACTOR: 3.0    // Multiplier: 30 / 10 = 3.0
}

/**
 * Performance configuration for update rates and frame budgets.
 *
 * @type {{
 *   TARGET_FPS: number,
 *   BACKGROUND_UPDATE_RATE: number,
 *   SPRITE_UPDATE_RATE: number,
 *   EXPLOSION_UPDATE_RATE: number,
 *   GOL_SIMULATION_BUDGET: number,
 *   GAME_LOGIC_BUDGET: number,
 *   RENDERING_BUDGET: number,
 *   FRAME_BUDGET: number,
 *   ENABLE_PERFORMANCE_LOGGING: boolean,
 *   PERFORMANCE_LOG_INTERVAL: number
 * }}
 *
 * @property {number} TARGET_FPS - Main loop target framerate (60fps)
 * @property {number} BACKGROUND_UPDATE_RATE - Background GoL updates per second (10fps)
 * @property {number} SPRITE_UPDATE_RATE - Sprite GoL updates per second (12fps)
 * @property {number} EXPLOSION_UPDATE_RATE - Explosion effects update rate (30fps)
 * @property {number} GOL_SIMULATION_BUDGET - GoL simulation time budget in ms (1.0ms)
 * @property {number} GAME_LOGIC_BUDGET - Game logic time budget in ms (5.0ms)
 * @property {number} RENDERING_BUDGET - Rendering time budget in ms (10.0ms)
 * @property {number} FRAME_BUDGET - Total frame time budget in ms (16.67ms = 60fps)
 * @property {boolean} ENABLE_PERFORMANCE_LOGGING - Enable frame time logging (false)
 * @property {number} PERFORMANCE_LOG_INTERVAL - Log interval in frames (60)
 *
 * @example
 * // Setup game with target framerate
 * function setup() {
 *   createCanvas(1200, 1920)
 *   frameRate(PERFORMANCE_CONFIG.TARGET_FPS)  // 60fps
 * }
 *
 * @example
 * // Throttled GoL update
 * const updateInterval = floor(PERFORMANCE_CONFIG.TARGET_FPS / PERFORMANCE_CONFIG.BACKGROUND_UPDATE_RATE)  // 6 frames
 * if (frameCount % updateInterval === 0) {
 *   background.update()
 * }
 */
export const PERFORMANCE_CONFIG = {
  // Target frame rates
  TARGET_FPS: 60,  // Main loop target

  // GoL update rates (in fps)
  BACKGROUND_UPDATE_RATE: 10,  // Background updates per second
  SPRITE_UPDATE_RATE: 12,  // Sprite GoL updates per second
  EXPLOSION_UPDATE_RATE: 30,  // Explosion effects update rate

  // Performance budgets (in milliseconds per frame)
  GOL_SIMULATION_BUDGET: 1.0,  // Total GoL simulation time per frame
  GAME_LOGIC_BUDGET: 5.0,  // Game logic (physics, collision, AI)
  RENDERING_BUDGET: 10.0,  // Rendering budget
  FRAME_BUDGET: 16.67,  // Total frame time (1000ms / 60fps)

  // Enable performance monitoring
  ENABLE_PERFORMANCE_LOGGING: false,  // Set to true to log frame times
  PERFORMANCE_LOG_INTERVAL: 60  // Log every N frames
}

/**
 * Game configuration (placeholder for future use).
 *
 * @type {{
 *   GRAVITY: number,
 *   JUMP_FORCE: number,
 *   COLLISION_METHOD: string,
 *   PLAYER_SPEED: number,
 *   PLAYER_SIZE: number,
 *   ENEMY_SPEED: number,
 *   ENEMY_SPAWN_INTERVAL: number
 * }}
 *
 * @property {number} GRAVITY - Gravity acceleration in pixels/frame² (0.6)
 * @property {number} JUMP_FORCE - Initial jump velocity in pixels/frame (-12)
 * @property {string} COLLISION_METHOD - Collision detection method ('circle' | 'rectangle')
 * @property {number} PLAYER_SPEED - Player movement speed in pixels/frame (5)
 * @property {number} PLAYER_SIZE - Player hitbox size in pixels (20)
 * @property {number} ENEMY_SPEED - Enemy movement speed in pixels/frame (3)
 * @property {number} ENEMY_SPAWN_INTERVAL - Enemy spawn interval in frames (120 = 2s at 60fps)
 *
 * @example
 * // Apply gravity to player
 * player.vy += GAME_CONFIG.GRAVITY
 * player.y += player.vy
 *
 * @example
 * // Jump physics
 * if (keyIsPressed && key === ' ') {
 *   player.vy = GAME_CONFIG.JUMP_FORCE
 * }
 */
export const GAME_CONFIG = {
  // Physics constants (to be defined in Phase 2)
  GRAVITY: 0.6,
  JUMP_FORCE: -12,

  // Collision detection
  COLLISION_METHOD: 'circle',  // 'circle' or 'rectangle'

  // Player settings (to be defined in Phase 2)
  PLAYER_SPEED: 5,
  PLAYER_SIZE: 20,

  // Enemy settings (to be defined in Phase 2)
  ENEMY_SPEED: 3,
  ENEMY_SPAWN_INTERVAL: 120  // frames
}

/**
 * GoL cell states (Conway's Game of Life B3/S23 rules).
 *
 * @type {{
 *   ALIVE: number,
 *   DEAD: number
 * }}
 *
 * @property {number} ALIVE - Living cell state (1)
 * @property {number} DEAD - Dead cell state (0)
 *
 * @example
 * // Check if cell is alive
 * if (grid[x][y] === CELL_STATES.ALIVE) {
 *   fill(255, 0, 0)
 *   rect(x * cellSize, y * cellSize, cellSize, cellSize)
 * }
 *
 * @example
 * // Apply B3/S23 rules
 * if (currentState === CELL_STATES.ALIVE) {
 *   nextState = (neighbors === 2 || neighbors === 3) ? CELL_STATES.ALIVE : CELL_STATES.DEAD
 * } else {
 *   nextState = (neighbors === 3) ? CELL_STATES.ALIVE : CELL_STATES.DEAD
 * }
 */
export const CELL_STATES = {
  ALIVE: 1,
  DEAD: 0
}

/**
 * Pattern density ranges for different contexts.
 *
 * Controls GoL pattern seeding and stability. Density = alive cells / total cells.
 *
 * @type {{
 *   RANDOM_SEED: number,
 *   MIN_DENSITY: number,
 *   MAX_DENSITY: number,
 *   TARGET_DENSITY: number
 * }}
 *
 * @property {number} RANDOM_SEED - Random seeding density (0.3 = 30% alive cells)
 * @property {number} MIN_DENSITY - Minimum density to avoid extinction (0.1 = 10%)
 * @property {number} MAX_DENSITY - Maximum density to avoid overcrowding (0.7 = 70%)
 * @property {number} TARGET_DENSITY - Target density for stable patterns (0.4 = 40%)
 *
 * @example
 * // Random seeding with 30% density
 * for (let x = 0; x < cols; x++) {
 *   for (let y = 0; y < rows; y++) {
 *     grid[x][y] = (random() < DENSITY_CONFIG.RANDOM_SEED) ? CELL_STATES.ALIVE : CELL_STATES.DEAD
 *   }
 * }
 *
 * @example
 * // Check if pattern needs stability adjustment
 * const density = countAliveCells(grid) / (cols * rows)
 * if (density < DENSITY_CONFIG.MIN_DENSITY) {
 *   seedRandomCells(grid, DENSITY_CONFIG.TARGET_DENSITY)  // Prevent extinction
 * } else if (density > DENSITY_CONFIG.MAX_DENSITY) {
 *   clearRandomCells(grid, DENSITY_CONFIG.TARGET_DENSITY)  // Prevent overcrowding
 * }
 */
export const DENSITY_CONFIG = {
  RANDOM_SEED: 0.3,  // 30% density for random seeding
  MIN_DENSITY: 0.1,  // 10% minimum to avoid extinction
  MAX_DENSITY: 0.7,  // 70% maximum to avoid overcrowding
  TARGET_DENSITY: 0.4  // 40% target for stable patterns
}
