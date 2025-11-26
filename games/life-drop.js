/**
 * Life Drop - Pure Game of Life Experience
 *
 * Place R-pentomino patterns on the grid and watch them evolve.
 * Your score is the peak population reached during the simulation.
 *
 * Controls:
 * - Joystick (Arrow keys / WASD): Move pattern cursor
 * - Button (Space / N): Drop pattern at cursor position
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Patterns, stampPattern } from '/conways-arcade-online/src/utils/Patterns.js'
import {
  GAME_DIMENSIONS,
  GAMEOVER_CONFIG,
  createGameState,
  calculateCanvasDimensions,
  createGameConfig
} from '/conways-arcade-online/src/utils/GameBaseConfig.js'
import { initThemeReceiver, getBackgroundColor, getTextColor } from '/conways-arcade-online/src/utils/ThemeReceiver.js'

// ============================================
// GAME CONFIGURATION
// ============================================

const CONFIG = createGameConfig({
  grid: {
    cols: 60,              // GoL grid columns
    rows: 80,              // GoL grid rows
    cellSize: 20,          // Pixels per cell (1200/60 = 20)
    offsetY: 120           // Top offset for header
  },

  game: {
    maxDrops: 5,                    // Number of patterns to place
    pattern: 'R_PENTOMINO',         // Pattern to drop
    simulationFps: 12,              // GoL updates per second
    maxGenerations: 600,            // Max generations before auto-end
    stabilityThreshold: 30          // Generations without change = stable
  },

  cursor: {
    speed: 1,              // Cells per input
    previewAlpha: 150      // Transparency of cursor preview (0-255)
  }
})

// ============================================
// GAME STATE
// ============================================

const state = createGameState({
  phase: 'PLACEMENT',           // PLACEMENT | SIMULATION | GAMEOVER
  dropsRemaining: CONFIG.game.maxDrops,
  cursor: {
    x: Math.floor(CONFIG.grid.cols / 2),
    y: Math.floor(CONFIG.grid.rows / 2)
  },
  generation: 0,
  population: 0,
  peakPopulation: 0,
  stabilityCounter: 0,
  lastPopulation: 0,
  simulationTimer: 0,
  gameOverTimer: 0,
  placementTimer: 0              // Timer for placement phase (resets on each drop)
})

// Placement timeout in frames (30 seconds at 60fps)
const PLACEMENT_TIMEOUT = 30 * 60

// ============================================
// GLOBALS
// ============================================

let golEngine = null
let maskedRenderer = null
let currentTheme = 'day'
let setupComplete = false

// Canvas dimensions
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// R-pentomino variants (8 orientations: 4 rotations × 2 reflections)
// All 3×3, all authentic, all ~1103 generations to stabilize
// Original R-pentomino:
//   .##
//   ##.
//   .#.
const R_PENTOMINO_VARIANTS = [
  // Original
  [[0,1,1], [1,1,0], [0,1,0]],
  // 90° CW
  [[1,0,0], [1,1,0], [0,1,1]],
  // 180°
  [[0,1,0], [0,1,1], [1,1,0]],
  // 270° CW
  [[1,1,0], [0,1,1], [0,0,1]],
  // Horizontal flip
  [[1,1,0], [0,1,1], [0,1,0]],
  // Horizontal flip + 90° CW
  [[0,0,1], [0,1,1], [1,1,0]],
  // Horizontal flip + 180°
  [[0,1,0], [1,1,0], [0,1,1]],
  // Horizontal flip + 270° CW
  [[0,1,1], [1,1,0], [1,0,0]]
]

// Current pattern (changes on each drop)
let currentPattern = R_PENTOMINO_VARIANTS[0]
let currentPatternWidth = 3  // All variants are 3×3
let currentPatternHeight = 3

// Input state (to prevent key repeat)
let keysPressed = {}

// ============================================
// p5.js SETUP
// ============================================

async function setup() {
  // Calculate responsive canvas size
  const canvasH = windowHeight
  const canvasW = canvasH * GAME_DIMENSIONS.ASPECT_RATIO
  canvasWidth = canvasW
  canvasHeight = canvasH
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT

  createCanvas(canvasWidth, canvasHeight)
  frameRate(60)

  // CSS fade-in: Start invisible, fade in after warmup
  const canvas = document.querySelector('canvas')
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 300ms ease-in'

  // Create gradient renderer
  maskedRenderer = new VideoGradientRenderer(this)

  // Initialize theme
  initThemeReceiver((theme) => {
    currentTheme = theme
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
  })

  // Pre-compile GPU shaders (eliminates first-run lag)
  await maskedRenderer.warmupShaders([
    GRADIENT_PRESETS.PLAYER,
    GRADIENT_PRESETS.BULLET
  ])

  // Initialize GoL engine
  golEngine = new GoLEngine(CONFIG.grid.cols, CONFIG.grid.rows)

  // Initialize game
  initGame()

  // Mark setup as complete and trigger fade-in
  setupComplete = true
  document.querySelector('canvas').style.opacity = '1'
}

function initGame() {
  state.phase = 'PLACEMENT'
  state.score = 0
  state.dropsRemaining = CONFIG.game.maxDrops
  state.cursor.x = Math.floor(CONFIG.grid.cols / 2)
  state.cursor.y = Math.floor(CONFIG.grid.rows / 2)
  state.generation = 0
  state.population = 0
  state.peakPopulation = 0
  state.stabilityCounter = 0
  state.lastPopulation = 0
  state.simulationTimer = 0
  state.gameOverTimer = 0
  state.placementTimer = 0
  state.frameCount = 0

  // Clear grid
  golEngine = new GoLEngine(CONFIG.grid.cols, CONFIG.grid.rows)

  // Select random initial pattern
  selectRandomPattern()
}

/**
 * Select a random R-pentomino variant from the 8 orientations.
 * All variants are 3×3 so dimensions stay constant.
 */
function selectRandomPattern() {
  const randomIndex = Math.floor(Math.random() * R_PENTOMINO_VARIANTS.length)
  currentPattern = R_PENTOMINO_VARIANTS[randomIndex]
  // Dimensions are always 3×3, no need to update
}

// ============================================
// MAIN LOOP
// ============================================

function draw() {
  if (!setupComplete) return

  state.frameCount++
  background(CONFIG.ui.backgroundColor)

  // Update based on phase
  if (state.phase === 'PLACEMENT') {
    updatePlacement()
  } else if (state.phase === 'SIMULATION') {
    updateSimulation()
  } else if (state.phase === 'GAMEOVER') {
    updateGameOver()
  }

  // Render
  renderGame()

  // Update score display in HTML
  const scoreElement = document.getElementById('score-value')
  if (scoreElement) {
    scoreElement.textContent = state.peakPopulation
  }
}

// ============================================
// PLACEMENT PHASE
// ============================================

function updatePlacement() {
  // Increment placement timer
  state.placementTimer++

  // Check for timeout (30s without dropping a pattern)
  if (state.placementTimer >= PLACEMENT_TIMEOUT) {
    // Timeout: go to simulation with whatever patterns were placed
    if (state.population > 0) {
      // At least one pattern was placed, run simulation
      state.phase = 'SIMULATION'
      state.lastPopulation = state.population
    } else {
      // No patterns placed, go directly to game over with score 0
      state.phase = 'GAMEOVER'
      state.score = 0
      state.gameOverTimer = 0
    }
    return
  }

  // Handle cursor movement (continuous while held)
  handleCursorMovement()
}

function handleCursorMovement() {
  const speed = CONFIG.cursor.speed

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A
    state.cursor.x = Math.max(0, state.cursor.x - speed)
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D
    state.cursor.x = Math.min(CONFIG.grid.cols - currentPatternWidth, state.cursor.x + speed)
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // W
    state.cursor.y = Math.max(0, state.cursor.y - speed)
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // S
    state.cursor.y = Math.min(CONFIG.grid.rows - currentPatternHeight, state.cursor.y + speed)
  }
}

function dropPattern() {
  if (state.phase !== 'PLACEMENT' || state.dropsRemaining <= 0) return

  // Stamp current pattern onto grid
  stampPattern(
    golEngine.current,
    currentPattern,
    state.cursor.x,
    state.cursor.y,
    CONFIG.grid.cols,
    CONFIG.grid.rows
  )

  state.dropsRemaining--

  // Count initial population
  state.population = countPopulation()
  state.peakPopulation = Math.max(state.peakPopulation, state.population)

  // Transition to simulation if no drops left
  if (state.dropsRemaining <= 0) {
    state.phase = 'SIMULATION'
    state.lastPopulation = state.population
  } else {
    // Reset placement timer (30s for next drop)
    state.placementTimer = 0
    // Select next random pattern for the next drop
    selectRandomPattern()
  }
}

// ============================================
// SIMULATION PHASE
// ============================================

function updateSimulation() {
  state.simulationTimer++

  // Update GoL at configured FPS
  const framesPerUpdate = Math.floor(60 / CONFIG.game.simulationFps)
  if (state.simulationTimer % framesPerUpdate === 0) {
    // Run one generation
    golEngine.update()
    state.generation++

    // Count population
    state.population = countPopulation()

    // Update peak
    if (state.population > state.peakPopulation) {
      state.peakPopulation = state.population
    }

    // Check stability
    if (state.population === state.lastPopulation) {
      state.stabilityCounter++
    } else {
      state.stabilityCounter = 0
    }
    state.lastPopulation = state.population

    // Check game over conditions
    if (checkGameOver()) {
      state.phase = 'GAMEOVER'
      state.score = state.peakPopulation
      state.gameOverTimer = 0
    }
  }
}

function checkGameOver() {
  // Extinction
  if (state.population === 0) return true

  // Stability (pattern stabilized or oscillating)
  if (state.stabilityCounter >= CONFIG.game.stabilityThreshold) return true

  // Max generations reached
  if (state.generation >= CONFIG.game.maxGenerations) return true

  return false
}

function countPopulation() {
  let count = 0
  for (let x = 0; x < CONFIG.grid.cols; x++) {
    for (let y = 0; y < CONFIG.grid.rows; y++) {
      if (golEngine.current[x][y] === 1) {
        count++
      }
    }
  }
  return count
}

// ============================================
// GAME OVER PHASE
// ============================================

function updateGameOver() {
  state.gameOverTimer++

  // Send score to parent after short delay
  if (state.gameOverTimer === GAMEOVER_CONFIG.MIN_DELAY) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'gameOver',
        payload: { score: state.score }
      }, '*')
    }
  }
}

// ============================================
// RENDERING
// ============================================

function renderGame() {
  push()
  scale(scaleFactor)

  // Render grid cells
  renderGrid()

  // Render cursor preview (only in placement phase)
  if (state.phase === 'PLACEMENT') {
    renderCursor()
  }

  // Render drops indicator (only in placement phase)
  if (state.phase === 'PLACEMENT') {
    renderDropsIndicator()
  }

  // Render generation counter (only in simulation)
  if (state.phase === 'SIMULATION') {
    renderSimulationInfo()
  }

  pop()
}

function renderGrid() {
  // Use gradient renderer for alive cells
  const cellSize = CONFIG.grid.cellSize
  const offsetY = CONFIG.grid.offsetY

  noStroke()

  // Create a temporary GoL-like object for the renderer
  const gridForRenderer = {
    cols: CONFIG.grid.cols,
    rows: CONFIG.grid.rows,
    current: golEngine.current
  }

  maskedRenderer.renderMaskedGrid(
    gridForRenderer,
    0,
    offsetY,
    cellSize,
    GRADIENT_PRESETS.PLAYER
  )
}

function renderCursor() {
  const cellSize = CONFIG.grid.cellSize
  const offsetY = CONFIG.grid.offsetY
  const cursorX = state.cursor.x * cellSize
  const cursorY = state.cursor.y * cellSize + offsetY

  // Draw pattern preview with transparency
  push()
  noStroke()

  // Semi-transparent preview (black)
  fill(0, 0, 0, CONFIG.cursor.previewAlpha)

  for (let py = 0; py < currentPatternHeight; py++) {
    for (let px = 0; px < currentPatternWidth; px++) {
      if (currentPattern[py][px] === 1) {
        rect(
          cursorX + px * cellSize,
          cursorY + py * cellSize,
          cellSize - 1,
          cellSize - 1
        )
      }
    }
  }

  // Draw cursor border (black, dashed)
  noFill()
  stroke(0, 0, 0)
  strokeWeight(2)
  drawingContext.setLineDash([8, 4])  // 8px dash, 4px gap
  rect(
    cursorX - 2,
    cursorY - 2,
    currentPatternWidth * cellSize + 4,
    currentPatternHeight * cellSize + 4
  )
  drawingContext.setLineDash([])  // Reset to solid for other drawing

  pop()
}

function renderDropsIndicator() {
  const total = CONFIG.game.maxDrops
  const remaining = state.dropsRemaining
  const squareSize = 16
  const spacing = 24
  const startX = (GAME_DIMENSIONS.BASE_WIDTH - (total * spacing)) / 2
  const y = GAME_DIMENSIONS.BASE_HEIGHT - 60

  push()
  noStroke()

  for (let i = 0; i < total; i++) {
    if (i < remaining) {
      // Filled square (remaining) - black
      fill(0, 0, 0)
    } else {
      // Empty square (used) - gray
      fill(200)
    }
    rect(startX + i * spacing, y - squareSize / 2, squareSize, squareSize)
  }

  pop()
}

function renderSimulationInfo() {
  // Removed Gen/Pop text display per client request
}

// ============================================
// INPUT HANDLING
// ============================================

function keyPressed() {
  // Prevent default browser behavior
  if ([32, 37, 38, 39, 40].includes(keyCode)) {
    // Don't call preventDefault in p5.js - just return false
  }

  // Drop pattern (Space or N)
  if (keyCode === 32 || keyCode === 78) { // Space or N
    if (state.phase === 'PLACEMENT') {
      dropPattern()
    }
    return false
  }

  return false
}

// ============================================
// WINDOW RESIZE
// ============================================

function windowResized() {
  const canvasH = windowHeight
  const canvasW = canvasH * GAME_DIMENSIONS.ASPECT_RATIO
  canvasWidth = canvasW
  canvasHeight = canvasH
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT

  resizeCanvas(canvasWidth, canvasHeight)
}

// ============================================
// EXPORT FOR TESTING
// ============================================

export {
  CONFIG,
  state,
  initGame,
  dropPattern,
  countPopulation,
  checkGameOver,
  updatePlacement,
  updateSimulation
}

// Make p5.js functions global
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
