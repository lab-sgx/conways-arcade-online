/**
 * Trail of Life - Snake with Game of Life Patterns
 *
 * Each snake segment is an authentic GoL pattern.
 * When the snake eats food, that pattern becomes the new tail segment.
 * Creates a visual "trail of life patterns" as the snake grows.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Patterns } from '/conways-arcade-online/src/utils/Patterns.js'
import { updateParticles, renderParticles } from '/conways-arcade-online/src/utils/ParticleHelpers.js'
import { renderGameOver } from '/conways-arcade-online/src/utils/UIHelpers.js'
import { updateLoopPattern } from '/conways-arcade-online/src/utils/LoopPatternHelpers.js'
import { createPatternRenderer, RenderMode, PatternName } from '/conways-arcade-online/src/utils/PatternRenderer.js'
import { seedRadialDensity } from '/conways-arcade-online/src/utils/GoLHelpers.js'
import {
  GAME_DIMENSIONS,
  GAMEOVER_CONFIG,
  createGameState,
  calculateCanvasDimensions,
  createGameConfig
} from '/conways-arcade-online/src/utils/GameBaseConfig.js'
import { initThemeReceiver, getBackgroundColor, getTextColor } from '/conways-arcade-online/src/utils/ThemeReceiver.js'

// ============================================
// GAME CONFIGURATION - BASE REFERENCE (10:16 ratio)
// All values are proportional to 1200×1920 reference resolution
// ============================================

const CONFIG = createGameConfig({
  grid: {
    cols: 40,           // Logical grid horizontal (1200 / 40 = 30px per cell)
    rows: 64,           // Logical grid vertical (1920 / 64 = 30px per cell)
    cellSize: 30,       // Visual size of each grid cell
    offsetY: 30         // Offset from top for header
  },

  snake: {
    initialLength: 3,         // Initial segments
    baseSpeed: 8,             // Moves per second (level 1)
    maxSpeed: 18,             // Maximum speed
    speedIncrement: 0.5,      // Increment per food eaten
    growthBase: 1,            // Segments added per food (level 1)
    growthIncrement: 1,       // Growth increment every 5 foods
    maxGrowth: 3              // Maximum growth per food
  },

  food: {
    spawnMargin: 2    // Distance from edges in cells
  },

  // Loop pattern update rate (frames between phase changes)
  loopUpdateRate: 10,  // 10 fps

  // GoL cell size for rendering patterns inside grid cells
  golCellSize: 8       // ~4 GoL cells fit in 30px grid cell
})

// Store scale factor for rendering
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// ============================================
// FOOD PATTERNS (Small, recognizable GoL patterns)
// ============================================
const FOOD_PATTERNS = [
  {
    name: PatternName.BLOCK,
    isOscillator: false,
    gradient: GRADIENT_PRESETS.ENEMY_HOT,
    scoreValue: 100
  },
  {
    name: PatternName.BEEHIVE,
    isOscillator: false,
    gradient: GRADIENT_PRESETS.ENEMY_COLD,
    scoreValue: 100
  },
  {
    name: PatternName.BLINKER,
    isOscillator: true,
    gradient: GRADIENT_PRESETS.BULLET,
    scoreValue: 150
  },
  {
    name: PatternName.TUB,
    isOscillator: false,
    gradient: GRADIENT_PRESETS.ENEMY_RAINBOW,
    scoreValue: 100
  },
  {
    name: PatternName.BOAT,
    isOscillator: false,
    gradient: GRADIENT_PRESETS.EXPLOSION,
    scoreValue: 100
  },
  {
    name: PatternName.BEACON,
    isOscillator: true,
    gradient: GRADIENT_PRESETS.PLAYER,
    scoreValue: 150
  }
]

// ============================================
// GAME STATE
// ============================================
const state = createGameState({
  level: 1,
  foodEaten: 0,              // Total food counter
  currentSpeed: 8,           // Current speed (moves/second)
  currentGrowth: 1,          // Segments per food
  moveTimer: 0,              // Movement timer (frames)
  direction: { x: 1, y: 0 }, // Current direction (right initially)
  nextDirection: null,       // Next direction (input buffer)
  pendingGrowth: 0,          // Segments to add (simple counter)
  dyingTimer: 0
})

// ============================================
// ENTITIES
// ============================================
let snake = []
// Each segment: { gridX, gridY, patternName, gol, gradient }

let food = null
// { gridX, gridY, patternName, gol, gradient, isOscillator, scoreValue }

let particles = []

// Theme state
let currentTheme = 'day'

// Setup completion flag (prevents draw() from running before async setup completes)
let setupComplete = false

// Gradient renderer
let maskedRenderer = null

// ============================================
// RESPONSIVE CANVAS HELPERS
// ============================================
function calculateResponsiveSize() {
  const canvasHeight = windowHeight
  const canvasWidth = canvasHeight * GAME_DIMENSIONS.ASPECT_RATIO
  return { width: canvasWidth, height: canvasHeight }
}

function updateConfigScale() {
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT
}

// ============================================
// p5.js SETUP
// ============================================
async function setup() {
  // Calculate responsive canvas size
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height

  // Update scale factor
  updateConfigScale()

  createCanvas(canvasWidth, canvasHeight)
  frameRate(60)

  // CSS fade-in: Start invisible, fade in after warmup
  const canvas = document.querySelector('canvas')
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 300ms ease-in'

  // Create video gradient renderer
  maskedRenderer = new VideoGradientRenderer(this)

  // Initialize theme receiver
  initThemeReceiver((theme) => {
    currentTheme = theme
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
    console.log(`Trail of Life: Theme changed to ${theme}`)
  })

  // Pre-compile GPU shaders (eliminates first-run lag)
  await maskedRenderer.warmupShaders([
    GRADIENT_PRESETS.PLAYER,
    GRADIENT_PRESETS.ENEMY_HOT,
    GRADIENT_PRESETS.ENEMY_COLD,
    GRADIENT_PRESETS.ENEMY_RAINBOW,
    GRADIENT_PRESETS.BULLET,
    GRADIENT_PRESETS.EXPLOSION
  ])

  initGame()

  // Mark setup as complete and trigger fade-in
  setupComplete = true
  document.querySelector('canvas').style.opacity = '1'
}

function initGame() {
  state.score = 0
  state.lives = 1
  state.level = 1
  state.phase = 'PLAYING'
  state.frameCount = 0
  state.foodEaten = 0
  state.currentSpeed = CONFIG.snake.baseSpeed
  state.currentGrowth = CONFIG.snake.growthBase
  state.moveTimer = 0
  state.direction = { x: 1, y: 0 }
  state.nextDirection = null
  state.pendingGrowth = 0
  state.dyingTimer = 0

  snake = []
  particles = []

  setupSnake()
  spawnFood()
}

// ============================================
// SNAKE SETUP
// ============================================
function setupSnake() {
  // Start in center of grid
  const startX = Math.floor(CONFIG.grid.cols / 2)
  const startY = Math.floor(CONFIG.grid.rows / 2)

  // Create initial segments (head + body going left)
  for (let i = 0; i < CONFIG.snake.initialLength; i++) {
    const segment = createSegment(
      startX - i,
      startY,
      PatternName.BLOCK,
      i === 0 ? GRADIENT_PRESETS.PLAYER : GRADIENT_PRESETS.ENEMY_COLD
    )
    snake.push(segment)
  }
}

/**
 * Create a snake segment with GoL pattern
 * @param {number} gridX - Grid X position
 * @param {number} gridY - Grid Y position
 * @param {string} patternName - GoL pattern name
 * @param {Object} gradient - Gradient preset
 * @returns {Object} Segment object
 */
function createSegment(gridX, gridY, patternName, gradient) {
  // All snake segments are STATIC (frozen) - they don't evolve
  // This preserves the visual "trail of life" showing eaten patterns
  const renderer = createPatternRenderer({
    mode: RenderMode.STATIC,
    pattern: patternName,
    globalCellSize: CONFIG.golCellSize,
    loopUpdateRate: CONFIG.loopUpdateRate
  })

  return {
    gridX,
    gridY,
    patternName,
    gol: renderer.gol,
    gradient
  }
}

// ============================================
// FOOD SYSTEM
// ============================================
function spawnFood() {
  // Pick random pattern from available options
  const patternInfo = FOOD_PATTERNS[Math.floor(Math.random() * FOOD_PATTERNS.length)]

  // Find valid position (not on snake)
  let gridX, gridY
  let attempts = 0
  const maxAttempts = 100

  do {
    gridX = Math.floor(Math.random() * (CONFIG.grid.cols - 2 * CONFIG.food.spawnMargin)) + CONFIG.food.spawnMargin
    gridY = Math.floor(Math.random() * (CONFIG.grid.rows - 2 * CONFIG.food.spawnMargin)) + CONFIG.food.spawnMargin
    attempts++
  } while (isOnSnake(gridX, gridY) && attempts < maxAttempts)

  // Create food with pattern
  const renderer = createPatternRenderer({
    mode: patternInfo.isOscillator ? RenderMode.LOOP : RenderMode.STATIC,
    pattern: patternInfo.name,
    globalCellSize: CONFIG.golCellSize,
    loopUpdateRate: CONFIG.loopUpdateRate
  })

  food = {
    gridX,
    gridY,
    patternName: patternInfo.name,
    gol: renderer.gol,
    gradient: patternInfo.gradient,
    isOscillator: patternInfo.isOscillator,
    scoreValue: patternInfo.scoreValue
  }
}

/**
 * Check if position is occupied by snake
 */
function isOnSnake(gridX, gridY) {
  return snake.some(segment => segment.gridX === gridX && segment.gridY === gridY)
}

// ============================================
// UPDATE LOOP
// ============================================
function draw() {
  if (!setupComplete) return

  state.frameCount++

  background(CONFIG.ui.backgroundColor)

  if (state.phase === 'PLAYING') {
    updateGame()
  } else if (state.phase === 'DYING') {
    state.dyingTimer++
    particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)

    // Transition to GAMEOVER
    const minDelayPassed = state.dyingTimer >= GAMEOVER_CONFIG.MIN_DELAY
    const particlesDone = particles.length === 0
    const maxWaitReached = state.dyingTimer >= GAMEOVER_CONFIG.MAX_WAIT

    if ((particlesDone && minDelayPassed) || maxWaitReached) {
      state.phase = 'GAMEOVER'

      // Send postMessage to parent
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'gameOver',
          payload: { score: state.score }
        }, '*')
      }
    }
  }

  renderGame()

  // Update score in header
  const scoreElement = document.getElementById('score-value')
  if (scoreElement) {
    scoreElement.textContent = state.score
  }

  // Update gradient animations
  maskedRenderer.updateAnimation()

  if (state.phase === 'GAMEOVER') {
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

function updateGame() {
  // Process input (buffer next direction)
  processInput()

  // Movement timer
  const framesPerMove = Math.floor(60 / state.currentSpeed)
  state.moveTimer++

  if (state.moveTimer >= framesPerMove) {
    state.moveTimer = 0
    moveSnake()
  }

  // Update oscillating patterns
  updatePatterns()

  // Update particles
  particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)
}

function processInput() {
  // Only allow perpendicular direction changes
  const dir = state.direction

  if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && dir.y === 0) { // W
    state.nextDirection = { x: 0, y: -1 }
  } else if ((keyIsDown(DOWN_ARROW) || keyIsDown(83)) && dir.y === 0) { // S
    state.nextDirection = { x: 0, y: 1 }
  } else if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && dir.x === 0) { // A
    state.nextDirection = { x: -1, y: 0 }
  } else if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && dir.x === 0) { // D
    state.nextDirection = { x: 1, y: 0 }
  }
}

function moveSnake() {
  // Apply buffered direction
  if (state.nextDirection) {
    state.direction = state.nextDirection
    state.nextDirection = null
  }

  // Calculate new head position
  const head = snake[0]
  let newX = head.gridX + state.direction.x
  let newY = head.gridY + state.direction.y

  // WRAP AROUND: If hit wall, appear on opposite side
  if (newX < 0) newX = CONFIG.grid.cols - 1
  if (newX >= CONFIG.grid.cols) newX = 0
  if (newY < 1) newY = CONFIG.grid.rows - 1  // Row 0 is header
  if (newY >= CONFIG.grid.rows) newY = 1

  // Check ONLY self collision (walls wrap around)
  const selfHit = checkSelfCollision(newX, newY)

  if (selfHit) {
    console.log(`DEATH: self collision at (${newX},${newY})`)
    onDeath()
    return
  }

  // Check food collision
  const ateFood = (newX === food.gridX && newY === food.gridY)

  if (ateFood) {
    onFoodEaten()
  }

  // Create new head segment (always BLOCK with PLAYER gradient)
  const newHead = createSegment(
    newX,
    newY,
    PatternName.BLOCK,
    GRADIENT_PRESETS.PLAYER
  )

  // Add new head at front
  snake.unshift(newHead)

  // Update old head to body gradient
  if (snake.length > 1) {
    snake[1].gradient = GRADIENT_PRESETS.ENEMY_COLD
  }

  // Growth logic: if pending growth, don't remove tail
  if (state.pendingGrowth > 0) {
    state.pendingGrowth--
  } else {
    snake.pop()
  }
}

function checkWallCollision(x, y) {
  return x < 0 || x >= CONFIG.grid.cols || y < 1 || y >= CONFIG.grid.rows
}

function checkSelfCollision(x, y) {
  // Check against all body segments (skip head since we're checking new position)
  return snake.some((segment, index) => {
    if (index === 0) return false // Skip current head
    return segment.gridX === x && segment.gridY === y
  })
}

function onFoodEaten() {
  // Score
  state.score += food.scoreValue * state.level
  state.foodEaten++

  // Queue growth (simple counter)
  state.pendingGrowth += state.currentGrowth

  // Update difficulty
  updateDifficulty()

  // Spawn new food
  spawnFood()
}

function updateDifficulty() {
  // Increase speed
  state.currentSpeed = Math.min(
    CONFIG.snake.maxSpeed,
    CONFIG.snake.baseSpeed + (state.foodEaten * CONFIG.snake.speedIncrement)
  )

  // Increase growth rate every 5 foods
  state.currentGrowth = Math.min(
    CONFIG.snake.maxGrowth,
    CONFIG.snake.growthBase + Math.floor(state.foodEaten / 5) * CONFIG.snake.growthIncrement
  )

  // Level up every 10 foods
  state.level = Math.floor(state.foodEaten / 10) + 1
}

function onDeath() {
  state.phase = 'DYING'
  state.dyingTimer = 0

  // Spawn explosions for each segment (staggered)
  snake.forEach((segment, index) => {
    // Create explosion immediately but with staggered visual
    spawnExplosion(segment.gridX, segment.gridY, segment.gradient, index * 3)
  })
}

function updatePatterns() {
  // Snake segments are STATIC (frozen) - no updates needed
  // This creates a visual "trail" of different patterns

  // Only food oscillates (BLINKER, BEACON animate to attract attention)
  if (food && food.isOscillator && food.gol.isLoopPattern) {
    updateLoopPattern(food.gol, CONFIG.loopUpdateRate, true)
  }
}

// ============================================
// EXPLOSION SYSTEM
// ============================================
function spawnExplosion(gridX, gridY, gradient, delayFrames = 0) {
  const screenX = gridX * CONFIG.grid.cellSize + CONFIG.grid.cellSize / 2
  const screenY = (gridY + 1) * CONFIG.grid.cellSize + CONFIG.grid.cellSize / 2 // +1 for header offset

  const particleCount = 3

  for (let i = 0; i < particleCount; i++) {
    const particle = {
      x: screenX + (Math.random() * 2 - 1) * 20,
      y: screenY + (Math.random() * 2 - 1) * 20,
      vx: (Math.random() * 2 - 1) * 4,
      vy: (Math.random() * 2 - 1) * 4,
      alpha: 255,
      width: 90,
      height: 90,
      gol: new GoLEngine(3, 3, CONFIG.loopUpdateRate),
      gradient: gradient || GRADIENT_PRESETS.EXPLOSION,
      dead: false,
      delayFrames: delayFrames
    }

    seedRadialDensity(particle.gol, 0.7, 0.0)
    particle.gol.setPattern(Patterns.BLINKER, 0, 0)

    particles.push(particle)
  }
}

// ============================================
// RENDERING
// ============================================
function renderGame() {
  push()
  scale(scaleFactor)

  // Render grid lines (subtle, for debugging)
  // renderGridLines()

  // Render food first (behind snake)
  if (food && state.phase === 'PLAYING') {
    renderFood()
  }

  // Render snake
  if (state.phase !== 'GAMEOVER') {
    renderSnake()
  }

  // Render particles
  renderParticles(particles, maskedRenderer, CONFIG.golCellSize)

  pop()
}

function renderSnake() {
  // Render from tail to head so head is on top
  for (let i = snake.length - 1; i >= 0; i--) {
    const segment = snake[i]
    const screenX = segment.gridX * CONFIG.grid.cellSize
    const screenY = (segment.gridY + 1) * CONFIG.grid.cellSize // +1 for header offset

    // Center the GoL pattern within the grid cell
    const patternWidth = segment.gol.cols * CONFIG.golCellSize
    const patternHeight = segment.gol.rows * CONFIG.golCellSize
    const offsetX = (CONFIG.grid.cellSize - patternWidth) / 2
    const offsetY = (CONFIG.grid.cellSize - patternHeight) / 2

    maskedRenderer.renderMaskedGrid(
      segment.gol,
      screenX + offsetX,
      screenY + offsetY,
      CONFIG.golCellSize,
      segment.gradient
    )
  }
}

function renderFood() {
  const screenX = food.gridX * CONFIG.grid.cellSize
  const screenY = (food.gridY + 1) * CONFIG.grid.cellSize // +1 for header offset

  // Center the GoL pattern within the grid cell
  const patternWidth = food.gol.cols * CONFIG.golCellSize
  const patternHeight = food.gol.rows * CONFIG.golCellSize
  const offsetX = (CONFIG.grid.cellSize - patternWidth) / 2
  const offsetY = (CONFIG.grid.cellSize - patternHeight) / 2

  maskedRenderer.renderMaskedGrid(
    food.gol,
    screenX + offsetX,
    screenY + offsetY,
    CONFIG.golCellSize,
    food.gradient
  )
}

function renderGridLines() {
  stroke(200, 200, 200, 50)
  strokeWeight(1)

  // Vertical lines
  for (let x = 0; x <= CONFIG.grid.cols; x++) {
    line(x * CONFIG.grid.cellSize, CONFIG.grid.cellSize, x * CONFIG.grid.cellSize, CONFIG.height)
  }

  // Horizontal lines
  for (let y = 1; y <= CONFIG.grid.rows; y++) {
    line(0, y * CONFIG.grid.cellSize, CONFIG.width, y * CONFIG.grid.cellSize)
  }

  noStroke()
}

// ============================================
// INPUT HANDLING
// ============================================
function keyPressed() {
  if ((key === ' ' || key === 'n' || key === 'N') && state.phase === 'GAMEOVER') {
    if (window.parent === window) {
      initGame()
      state.phase = 'PLAYING'
    }
  }
}

// ============================================
// WINDOW RESIZE HANDLER
// ============================================
function windowResized() {
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height
  updateConfigScale()
  resizeCanvas(canvasWidth, canvasHeight)
}

// Make functions global for p5.js
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
