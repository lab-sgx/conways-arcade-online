/**
 * Flappy Bird GOL - Endless flying game with Game of Life aesthetic
 *
 * Based on game-template.js
 * Player uses Modified GoL with life force
 * Pipes use Visual Only GoL
 *
 * @author Game of Life Arcade
 * @license ISC
 */

// ============================================
// IMPORTS - Standard imports for all games
// ============================================
import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Collision } from '/conways-arcade-online/src/utils/Collision.js'
import { Patterns } from '/conways-arcade-online/src/utils/Patterns.js'
import { seedRadialDensity, applyLifeForce } from '/conways-arcade-online/src/utils/GoLHelpers.js'
import { updateParticles, renderParticles } from '/conways-arcade-online/src/utils/ParticleHelpers.js'
import { renderGameOver } from '/conways-arcade-online/src/utils/UIHelpers.js'
import { createPatternRenderer, RenderMode, PatternName } from '/conways-arcade-online/src/utils/PatternRenderer.js'
import { initHitboxDebug, drawHitboxRect } from '/conways-arcade-online/src/debug/HitboxDebug.js'
import {
  GAME_DIMENSIONS,
  GAMEOVER_CONFIG,
  createGameState,
  calculateCanvasDimensions,
  createGameConfig
} from '/conways-arcade-online/src/utils/GameBaseConfig.js'
import { initThemeReceiver, getBackgroundColor, getTextColor } from '/conways-arcade-online/src/utils/ThemeReceiver.js'
import { debugLog } from '/conways-arcade-online/src/utils/Logger.js'

// ============================================
// CONFIGURATION - BASE REFERENCE (10:16 ratio)
// ============================================

const CONFIG = createGameConfig({
  player: {
    width: 210,    // LWSS: 7 cols × 30px = 210px (visual width)
    height: 180,   // LWSS: 6 rows × 30px = 180px (visual height)
    cellSize: 30,  // Scaled to 30px (3x from 10px baseline)
    x: 300,        // Keep same (relative positioning)
    startY: 960    // Keep same (relative to canvas height)
  },

  gravity: 1.0,        // SMOOTH: Very gentle gravity for precise control
  jumpForce: -22,      // SMOOTH: Short, precise jumps for micro-adjustments
  terminalVelocity: 15, // SMOOTH: Slow falling speed for maximum control
  groundY: 1850,       // Keep same (relative to canvas height)
  ceilingY: 200,       // Lowered to avoid UI overlap (was 70)

  pipe: {
    width: 180,            // Reduced 50% for easier gameplay (was 360)
    gapStart: 600,         // Initial gap size (easier)
    gapMin: 400,           // Minimum gap size (harder at high levels)
    gapDecrement: 20,      // Gap reduction per level
    speedStart: -15,       // Initial speed (slower)
    speedMin: -45,         // Maximum speed (faster at high levels)
    speedIncrement: -3,    // Speed increase per level
    spawnInterval: 100,
    cellSize: 30           // Scaled to 30px (3x from 10px baseline)
  },

  parallax: {
    cloudDensity: 8,         // Number of clouds on screen
    cloudOpacity: 0.20,      // 20% opacity for subtle effect
    scrollSpeed: -1.5,       // Horizontal velocity (slower than pipes)
    spawnInterval: 120,      // Every 2 seconds (120 frames)
    cellSize: 30,            // Cell size for cloud patterns
    patterns: [              // Still life patterns for clouds
      PatternName.BLOCK,
      PatternName.BEEHIVE,
      PatternName.LOAF,
      PatternName.BOAT,
      PatternName.TUB
    ]
  }
})

// Store scale factor for rendering (don't modify CONFIG values)
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// ============================================
// GAME STATE
// ============================================
const state = createGameState({
  level: 1,         // Current level (increases every 5 points)
  spawnTimer: 0,
  cloudSpawnTimer: 0,  // Timer for cloud spawning
  dyingTimer: 0
})

// ============================================
// ENTITIES
// ============================================
let player = null
let pipes = []
let particles = []
let clouds = []  // Parallax background clouds

// Gradient renderer (DO NOT MODIFY)
let maskedRenderer = null

// Cloud graphics buffer (reused each frame to avoid memory churn)
let cloudGraphics = null

// Setup completion flag (prevents draw() from running before async setup completes)
let setupComplete = false

// ============================================
// RESPONSIVE CANVAS HELPERS
// ============================================
function calculateResponsiveSize() {
  const canvasHeight = windowHeight
  const canvasWidth = canvasHeight * GAME_DIMENSIONS.ASPECT_RATIO
  return { width: canvasWidth, height: canvasHeight }
}

function updateConfigScale() {
  // Only update scaleFactor based on canvas size
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT
}

// ============================================
// PARALLAX BACKGROUND SYSTEM
// ============================================

/**
 * Initialize parallax cloud system.
 * Pre-populates the screen with clouds for seamless effect.
 */
function initParallax() {
  clouds = []

  // Pre-populate screen with clouds
  const spacing = GAME_DIMENSIONS.BASE_WIDTH / CONFIG.parallax.cloudDensity

  for (let i = 0; i < CONFIG.parallax.cloudDensity; i++) {
    const cloud = spawnCloud()
    // Distribute clouds across screen width
    cloud.x = i * spacing + random(-spacing * 0.3, spacing * 0.3)
    clouds.push(cloud)
  }
}

/**
 * Create a new cloud with random still life pattern.
 * @returns {Object} Cloud entity
 */
function spawnCloud() {
  // Select random pattern from still lifes
  const patternName = random(CONFIG.parallax.patterns)

  // Select random multicolor gradient for variety
  const gradients = [
    GRADIENT_PRESETS.ENEMY_HOT,
    GRADIENT_PRESETS.ENEMY_COLD,
    GRADIENT_PRESETS.ENEMY_RAINBOW
  ]
  const randomGradient = random(gradients)

  // Create renderer with static mode (still lifes don't evolve)
  const renderer = createPatternRenderer({
    mode: RenderMode.STATIC,
    pattern: patternName,
    phase: 0,  // Still lifes are always phase 0
    globalCellSize: CONFIG.parallax.cellSize,
    loopUpdateRate: 10  // Not used for static mode, but required
  })

  const dims = renderer.dimensions

  const cloud = {
    x: GAME_DIMENSIONS.BASE_WIDTH,  // Start off-screen right
    y: random(300, 1200),  // Random vertical position
    vx: CONFIG.parallax.scrollSpeed,
    pattern: patternName,
    gol: renderer.gol,
    width: dims.width,
    height: dims.height,
    cellSize: CONFIG.parallax.cellSize,
    gradient: randomGradient,  // Multicolor gradient
    dead: false
  }

  return cloud
}

/**
 * Update all clouds in parallax background.
 * Handles movement, cleanup, and spawning.
 */
function updateClouds() {
  // Move clouds
  clouds.forEach(cloud => {
    cloud.x += cloud.vx

    // Mark as dead if off-screen left
    if (cloud.x < -cloud.width) {
      cloud.dead = true
    }
  })

  // Remove dead clouds
  clouds = clouds.filter(c => !c.dead)

  // Spawn new cloud if timer reached
  state.cloudSpawnTimer++
  if (state.cloudSpawnTimer >= CONFIG.parallax.spawnInterval) {
    clouds.push(spawnCloud())
    state.cloudSpawnTimer = 0
  }
}

/**
 * Render parallax clouds with opacity.
 * Must be called BEFORE rendering other entities (background layer).
 * Uses pre-created buffer to avoid memory allocation each frame.
 */
function renderClouds() {
  // Clear reusable buffer (much faster than create/destroy)
  cloudGraphics.clear()

  clouds.forEach(cloud => {
    // Render each cell with multicolor gradient and transparency
    const grid = cloud.gol.current
    const cols = cloud.gol.cols
    const rows = cloud.gol.rows

    cloudGraphics.noStroke()

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (grid[x][y] === 1) {
          const px = cloud.x + x * cloud.cellSize
          const py = cloud.y + y * cloud.cellSize

          // Get gradient color from maskedRenderer (uses Perlin noise)
          const [r, g, b] = maskedRenderer.getGradientColor(
            px + cloud.cellSize / 2,
            py + cloud.cellSize / 2
          )

          // Apply opacity to the gradient color
          cloudGraphics.fill(r, g, b, CONFIG.parallax.cloudOpacity * 255)
          cloudGraphics.rect(px, py, cloud.cellSize, cloud.cellSize)
        }
      }
    }
  })

  // Draw the buffer to main canvas
  image(cloudGraphics, 0, 0)
}

// ============================================
// p5.js SETUP
// ============================================
async function setup() {
  // Calculate responsive canvas size
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height

  // Update scale factor (CONFIG values stay at base resolution)
  updateConfigScale()

  createCanvas(canvasWidth, canvasHeight)
  frameRate(60)

  // CSS fade-in: Start invisible, fade in after warmup
  const canvas = document.querySelector('canvas')
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 300ms ease-in'

  maskedRenderer = new VideoGradientRenderer(this)
  initHitboxDebug()  // Initialize hitbox debugging (press H to toggle)

  // Initialize theme receiver
  initThemeReceiver((theme) => {
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
    debugLog(`Flappy Bird: Theme changed to ${theme}, background: ${CONFIG.ui.backgroundColor}`)
  })

  // Create reusable graphics buffer for clouds (avoids memory churn)
  cloudGraphics = createGraphics(GAME_DIMENSIONS.BASE_WIDTH, GAME_DIMENSIONS.BASE_HEIGHT)

  // Pre-compile GPU shaders (eliminates first-run lag)
  await maskedRenderer.warmupShaders([
    GRADIENT_PRESETS.PLAYER,
    GRADIENT_PRESETS.ENEMY_HOT,
    GRADIENT_PRESETS.ENEMY_COLD,
    GRADIENT_PRESETS.ENEMY_RAINBOW,
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
  state.phase = 'PLAYING'
  state.frameCount = 0
  state.level = 1
  state.spawnTimer = 0
  state.cloudSpawnTimer = 0

  setupPlayer()
  pipes = []
  particles = []
  initParallax()
}

function setupPlayer() {
  player = {
    x: CONFIG.player.x,
    y: CONFIG.player.startY,
    width: CONFIG.player.width,
    height: CONFIG.player.height,
    cellSize: CONFIG.player.cellSize,

    // Physics
    vy: 0,

    // GoL engine - LWSS: 7×6 grid at 15fps (period 4 animation: 4 frames per cycle at 60fps)
    gol: new GoLEngine(7, 6, 15),

    // Gradient - Choose from GRADIENT_PRESETS
    gradient: GRADIENT_PRESETS.PLAYER
  }

  // LWSS pattern (Lightweight Spaceship) - Period 4 oscillator
  player.gol.setPattern(Patterns.LIGHTWEIGHT_SPACESHIP, 0, 0)
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
    // Continue updating particles during death animation
    state.dyingTimer++
    particles = updateParticles(particles, state.frameCount)

    // Transition to GAMEOVER when particles done or timeout reached
    const minDelayPassed = state.dyingTimer >= GAMEOVER_CONFIG.MIN_DELAY
    const particlesDone = particles.length === 0
    const maxWaitReached = state.dyingTimer >= GAMEOVER_CONFIG.MAX_WAIT

    if ((particlesDone && minDelayPassed) || maxWaitReached) {
      state.phase = 'GAMEOVER'

      // Send postMessage to parent if in installation
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'gameOver',
          payload: { score: state.score }
        }, '*')
      }
    }
  }

  renderGame()

  // Update score in header (if element exists)
  const scoreElement = document.getElementById('score-value')
  if (scoreElement) {
    scoreElement.textContent = state.score
  }

  maskedRenderer.updateAnimation()

  // Only show Game Over screen in standalone mode
  if (state.phase === 'GAMEOVER') {
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

function updateGame() {
  // Update parallax background (BEFORE other entities)
  updateClouds()

  // Calculate level based on score (every 5 points = 1 level)
  state.level = Math.floor(state.score / 5) + 1

  updatePlayer()
  updatePipes()
  particles = updateParticles(particles, state.frameCount)
  checkCollisions()
  spawnPipes()
}

function updatePlayer() {
  // Jump input
  if (keyIsDown(32) || keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(78)) {  // SPACE, UP, W, or N
    player.vy = CONFIG.jumpForce
  }

  // Apply gravity
  player.vy += CONFIG.gravity

  // Apply terminal velocity (prevent infinite acceleration)
  player.vy = Math.min(player.vy, CONFIG.terminalVelocity)

  player.y += player.vy

  // Check ceiling/ground collision
  if (player.y < CONFIG.ceilingY) {
    player.y = CONFIG.ceilingY
    player.vy = 0
  }

  if (player.y > CONFIG.groundY - player.height && state.phase !== 'GAMEOVER' && state.phase !== 'DYING') {
    state.phase = 'DYING'
    state.dyingTimer = 0
    spawnExplosion(player.x + player.width / 2, player.y + player.height / 2)

    // Note: postMessage will be sent after particle animation completes
  }

  // Update GoL (Modified GoL with life force)
  player.gol.updateThrottled(state.frameCount)
  applyLifeForce(player)
}

// ============================================
// PIPE FILL ALGORITHM
// ============================================

/**
 * Still lifes available for pipe filling.
 * All patterns from LifeWiki - 100% canonical GoL.
 */
const PIPE_STILL_LIFES = [
  Patterns.BLOCK,    // 2×2
  Patterns.BEEHIVE,  // 4×3
  Patterns.LOAF,     // 4×4
  Patterns.BOAT,     // 3×3
  Patterns.TUB,      // 3×3
  Patterns.SHIP,     // 3×3
  Patterns.POND      // 4×4
]

/**
 * Fill a pipe's GoL grid with random still lifes and solid perimeter.
 * Solution C: Random still lifes (1.A) + Perimeter fill (2.A)
 *
 * @param {GoLEngine} gol - The GoL engine to fill
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {string} openSide - Which side to leave open: 'top' or 'bottom'
 */
function fillPipeWithStillLifes(gol, cols, rows, openSide) {
  // Step 1.A: Place random still lifes uniformly
  const numPatterns = Math.floor((cols * rows) / 8)  // ~1 pattern per 8 cells

  for (let i = 0; i < numPatterns; i++) {
    const pattern = random(PIPE_STILL_LIFES)

    // Random position (allow partial overflow)
    const x = Math.floor(random(0, cols))
    const y = Math.floor(random(0, rows))

    // Place pattern (setPattern handles bounds)
    gol.setPattern(pattern, x, y)
  }

  // Step 2.A: Fill perimeter (1 cell border) with open side
  // Top row (only if not open)
  if (openSide !== 'top') {
    for (let x = 0; x < cols; x++) {
      gol.current[x][0] = 1
    }
  }
  // Bottom row (only if not open)
  if (openSide !== 'bottom') {
    for (let x = 0; x < cols; x++) {
      gol.current[x][rows - 1] = 1
    }
  }
  // Left and right columns (always closed)
  for (let y = 0; y < rows; y++) {
    gol.current[0][y] = 1           // Left column
    gol.current[cols - 1][y] = 1    // Right column
  }
}

// ============================================
// PIPE SPAWNING
// ============================================
function spawnPipes() {
  state.spawnTimer++

  if (state.spawnTimer >= CONFIG.pipe.spawnInterval) {
    state.spawnTimer = 0

    // Calculate current speed based on level
    const currentSpeed = Math.max(
      CONFIG.pipe.speedMin,
      CONFIG.pipe.speedStart + (state.level - 1) * CONFIG.pipe.speedIncrement
    )

    // Calculate current gap based on level
    const currentGap = Math.max(
      CONFIG.pipe.gapMin,
      CONFIG.pipe.gapStart - (state.level - 1) * CONFIG.pipe.gapDecrement
    )

    // Random gap position (between ceiling and ground)
    const minGapTop = CONFIG.ceilingY + 240
    const maxGapTop = CONFIG.groundY - currentGap - 240
    const gapTop = random(minGapTop, maxGapTop)

    // Top pipe - brick wall pattern with BEEHIVE still lifes
    const topPipeCols = Math.floor(CONFIG.pipe.width / 30)
    const topPipeRows = Math.floor((gapTop - CONFIG.ceilingY) / 30)

    const topPipe = {
      x: GAME_DIMENSIONS.BASE_WIDTH,
      y: CONFIG.ceilingY,
      width: CONFIG.pipe.width,
      height: gapTop - CONFIG.ceilingY,
      cellSize: CONFIG.pipe.cellSize,
      vx: currentSpeed,
      scored: false,
      gol: new GoLEngine(topPipeCols, topPipeRows, 0),  // updateRate 0 (still lifes don't evolve)
      gradient: GRADIENT_PRESETS.ENEMY_HOT,
      dead: false
    }

    // Bottom pipe - brick wall pattern with BEEHIVE still lifes
    const bottomPipeCols = Math.floor(CONFIG.pipe.width / 30)
    const bottomPipeRows = Math.floor((CONFIG.groundY - (gapTop + currentGap)) / 30)

    const bottomPipe = {
      x: GAME_DIMENSIONS.BASE_WIDTH,
      y: gapTop + currentGap,
      width: CONFIG.pipe.width,
      height: CONFIG.groundY - (gapTop + currentGap),
      cellSize: CONFIG.pipe.cellSize,
      vx: currentSpeed,
      scored: false,
      gol: new GoLEngine(bottomPipeCols, bottomPipeRows, 0),  // updateRate 0 (still lifes don't evolve)
      gradient: GRADIENT_PRESETS.ENEMY_COLD,
      dead: false
    }

    // Fill pipes with random still lifes + solid perimeter (open at screen edge)
    fillPipeWithStillLifes(topPipe.gol, topPipeCols, topPipeRows, 'top')
    fillPipeWithStillLifes(bottomPipe.gol, bottomPipeCols, bottomPipeRows, 'bottom')

    pipes.push(topPipe, bottomPipe)
  }
}

function updatePipes() {
  pipes.forEach(pipe => {
    pipe.x += pipe.vx

    // Brick wall pattern uses still lifes (updateRate = 0)
    // No evolution needed - static patterns for performance
    // pipe.gol.updateThrottled(state.frameCount)  // Commented out - still lifes don't evolve

    // Score when player passes pipe
    if (!pipe.scored && pipe.x + pipe.width < player.x) {
      pipe.scored = true
      state.score++
    }

    // Remove off-screen pipes
    if (pipe.x < -pipe.width) {
      pipe.dead = true
    }
  })

  pipes = pipes.filter(p => !p.dead)
}

function checkCollisions() {
  pipes.forEach(pipe => {
    if (Collision.rectRect(
      player.x, player.y, player.width, player.height,
      pipe.x, pipe.y, pipe.width, pipe.height
    )) {
      if (state.phase !== 'GAMEOVER' && state.phase !== 'DYING') {
        state.phase = 'DYING'
        state.dyingTimer = 0
        spawnExplosion(player.x + player.width / 2, player.y + player.height / 2)

        // Note: postMessage will be sent after particle animation completes
      }
    }
  })
}

function spawnExplosion(x, y) {
  for (let i = 0; i < 8; i++) {
    const particle = {
      x: x + random(-30, 30),  // -10 to 10 × 3
      y: y + random(-30, 30),
      vx: random(-9, 9),       // -3 to 3 × 3
      vy: random(-9, 9),
      alpha: 255,
      width: 180,   // 60 × 3 = 180
      height: 180,  // 60 × 3 = 180
      gol: new GoLEngine(6, 6, 30),  // 6×6 grid maintained, fast evolution (30fps)
      cellSize: 30,  // Scaled to 30px (3x from 10px baseline)
      gradient: GRADIENT_PRESETS.EXPLOSION,
      dead: false
    }

    seedRadialDensity(particle.gol, 0.7, 0.0)
    particles.push(particle)
  }
}

// ============================================
// RENDERING
// ============================================
function renderGame() {
  push()
  scale(scaleFactor)

  // Render parallax clouds (BEFORE all other entities - background layer)
  renderClouds()

  // Render player with gradient (hide during DYING and GAMEOVER)
  if (state.phase === 'PLAYING') {
    maskedRenderer.renderMaskedGrid(
      player.gol,
      player.x,
      player.y,
      player.cellSize,
      player.gradient
    )
  }

  // Render pipes with gradients
  pipes.forEach(pipe => {
    maskedRenderer.renderMaskedGrid(
      pipe.gol,
      pipe.x,
      pipe.y,
      pipe.cellSize,
      pipe.gradient
    )
  })

  // Render particles with gradients and alpha
  renderParticles(particles, maskedRenderer)

  // DEBUG: Render hitboxes (press H to toggle)
  if (state.phase === 'PLAYING') {
    drawHitboxRect(player.x, player.y, player.width, player.height, 'player', '#00FF00')
  }
  pipes.forEach((pipe, index) => {
    drawHitboxRect(pipe.x, pipe.y, pipe.width, pipe.height, `pipe ${index}`, '#FF0000')
  })

  pop()
}

// UI rendering removed - now handled by game-wrapper.html overlay

// ============================================
// INPUT
// ============================================
function keyPressed() {
  if ((key === ' ' || key === 'n' || key === 'N') && state.phase === 'GAMEOVER') {
    initGame()
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

  // No need to modify entity values - scaling happens in rendering
}

// ============================================
// EXPORTS
// ============================================
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
