/**
 * Dino Runner - Chrome Dino style endless runner
 *
 * Based on game-template.js
 * Player uses Modified GoL with life force
 * Obstacles use Visual Only GoL
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Collision } from '/conways-arcade-online/src/utils/Collision.js'
import { seedRadialDensity, applyLifeForce, maintainDensity } from '/conways-arcade-online/src/utils/GoLHelpers.js'
import { updateParticles, renderParticles } from '/conways-arcade-online/src/utils/ParticleHelpers.js'
import { renderGameOver } from '/conways-arcade-online/src/utils/UIHelpers.js'
import { createPatternRenderer, RenderMode, PatternName } from '/conways-arcade-online/src/utils/PatternRenderer.js'
import { initHitboxDebug, drawHitboxRect, drawHitboxes } from '/conways-arcade-online/src/debug/HitboxDebug.js'
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
// PLAYER DIMENSION CONSTANTS (eliminates magic numbers)
// ============================================
const PLAYER_DIMENSIONS = {
  // Visual dimensions (sprite size)
  RUN: { width: 200, height: 200 },
  DUCK: { width: 265, height: 121 },
  DUCK_OFFSET_X: -32.5,  // (265-200)/2 = 32.5px centering offset

  // Hitbox dimensions (50% width for legs-only collision)
  HITBOX: {
    RUN: { width: 100, height: 200, offsetX: 50 },   // Centered: (200-100)/2 = 50
    DUCK: { width: 130, height: 121, offsetX: 67.5 } // Centered: (265-130)/2 = 67.5
  }
}

// ============================================
// CONFIGURATION - BASE REFERENCE (10:16 ratio)
// ============================================

const CONFIG = createGameConfig({
  // Variable gravity system (Opción B: snappy jump with slight hang time)
  gravity: {
    rising: 3.5,       // Gravedad durante ascenso (vy < 0) - rápido pero con leve hang
    falling: 5.0,      // Gravedad durante descenso (vy >= 0) - caída rápida
    fastFall: 8.0      // Gravedad cuando presiona ↓ en el aire - bajada instantánea
  },
  terminalVelocity: 28,  // Límite de velocidad de caída
  jumpForce: -50,        // Salto más fuerte para compensar gravedad aumentada

  groundY: GAME_DIMENSIONS.BASE_HEIGHT * 0.6,  // 40% from bottom = 60% from top (1920 * 0.6 = 1152)
  horizonY: GAME_DIMENSIONS.BASE_HEIGHT * 0.6 - 15, // Visual horizon line (15px above ground)

  obstacle: {
    spawnInterval: 100,      // Base spawn interval (frames)
    minInterval: 50,         // Minimum interval (difficulty cap)
    intervalVariability: 40, // Random offset ±40 frames (creates variable spacing)
    speed: -15,              // Slower start (Option 2)
    speedIncrease: 0.0015    // Steady ramp (Option 2)
  },

  parallax: {
    cloudDensity: 8,         // Number of clouds on screen
    cloudOpacity: 0.20,      // 20% opacity for subtle effect
    scrollSpeed: -1.5,       // Horizontal velocity (slower than obstacles)
    spawnInterval: 120,      // Every 2 seconds (120 frames)
    cellSize: 30,            // Cell size for cloud patterns
    patterns: [              // Still life patterns for clouds
      PatternName.BLOCK,
      PatternName.BEEHIVE,
      PatternName.LOAF,
      PatternName.BOAT,
      PatternName.TUB
    ]
  },

  obstaclePatterns: [
    // STILL LIFES (Period 1 - never change)
    {
      name: 'BLOCK',
      type: 'still-life',
      gridSize: { cols: 4, rows: 4 },      // 2×2 pattern + padding
      pattern: PatternName.BLOCK,
      gradient: GRADIENT_PRESETS.ENEMY_HOT
    },
    {
      name: 'BEEHIVE',
      type: 'still-life',
      gridSize: { cols: 6, rows: 5 },      // 4×3 pattern + padding
      pattern: PatternName.BEEHIVE,
      gradient: GRADIENT_PRESETS.ENEMY_COLD
    },
    {
      name: 'LOAF',
      type: 'still-life',
      gridSize: { cols: 6, rows: 6 },      // 4×4 pattern + padding
      pattern: PatternName.LOAF,
      gradient: GRADIENT_PRESETS.ENEMY_RAINBOW
    },
    {
      name: 'BOAT',
      type: 'still-life',
      gridSize: { cols: 5, rows: 5 },      // 3×3 pattern + padding
      pattern: PatternName.BOAT,
      gradient: GRADIENT_PRESETS.ENEMY_HOT
    },
    {
      name: 'TUB',
      type: 'still-life',
      gridSize: { cols: 5, rows: 5 },      // 3×3 pattern + padding
      pattern: PatternName.TUB,
      gradient: GRADIENT_PRESETS.ENEMY_COLD
    },

    // OSCILLATORS (Static - phase 0 only, no animation)
    {
      name: 'BLINKER',
      type: 'still-life',  // Changed to still-life for static rendering
      gridSize: { cols: 5, rows: 5 },      // 3×3 pattern + padding
      pattern: PatternName.BLINKER,
      gradient: GRADIENT_PRESETS.ENEMY_RAINBOW
    },
    {
      name: 'TOAD',
      type: 'still-life',  // Changed to still-life for static rendering
      gridSize: { cols: 6, rows: 6 },      // 4×4 pattern + padding
      pattern: PatternName.TOAD,
      gradient: GRADIENT_PRESETS.ENEMY_HOT
    },
    {
      name: 'BEACON',
      type: 'still-life',  // Changed to still-life for static rendering
      gridSize: { cols: 6, rows: 6 },      // 4×4 pattern + padding
      pattern: PatternName.BEACON,
      gradient: GRADIENT_PRESETS.ENEMY_COLD
    }
  ],

  // Pterodactyl patterns (flying obstacles)
  pterodactylPatterns: [
    {
      name: 'LWSS_PHASE_2',
      type: 'flying',
      gridSize: { cols: 7, rows: 6 },      // LWSS is 5×4 + padding
      pattern: PatternName.LIGHTWEIGHT_SPACESHIP,
      phase: 2,  // Phase 2/4
      period: 4,
      gradient: GRADIENT_PRESETS.ENEMY_RAINBOW
    },
    {
      name: 'LWSS_PHASE_3',
      type: 'flying',
      gridSize: { cols: 7, rows: 6 },
      pattern: PatternName.LIGHTWEIGHT_SPACESHIP,
      phase: 3,  // Phase 3/4
      period: 4,
      gradient: GRADIENT_PRESETS.ENEMY_HOT
    },
    {
      name: 'LWSS_PHASE_4',
      type: 'flying',
      gridSize: { cols: 7, rows: 6 },
      pattern: PatternName.LIGHTWEIGHT_SPACESHIP,
      phase: 0,  // Phase 4/4 = Phase 0
      period: 4,
      gradient: GRADIENT_PRESETS.ENEMY_COLD
    }
  ],

  // Ground lines (Chrome Dino style)
  groundLines: {
    density: 5,                    // Number of lines on screen simultaneously
    speed: -15,                    // Match obstacle speed
    minLength: 40,                 // Minimum line length (px)
    maxLength: 80,                 // Maximum line length (px)
    thickness: 2,                  // Stroke weight (px)
    color: [83, 83, 83],          // Gray #535353
    yOffsetMin: 10,                // Min offset from horizonY (10px below minimum)
    yOffsetMax: 40,                // Max offset from horizonY (40px below horizon)
    spawnInterval: 60              // Frames between spawns (every ~1 second at 60fps)
  }
})

// Store scale factor for rendering (don't modify CONFIG values)
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// ============================================
// GAME STATE
// ============================================
const state = createGameState({
  spawnTimer: 0,
  cloudSpawnTimer: 0,  // Timer for cloud spawning
  groundLineSpawnTimer: 0,  // Timer for ground line spawning
  gameSpeed: 1,
  dyingTimer: 0
})

// ============================================
// ENTITIES
// ============================================
let player = null
let obstacles = []
let particles = []
let clouds = []  // Parallax background clouds
let groundLines = []  // Ground decoration lines (Chrome Dino style)

// Gradient renderer
let maskedRenderer = null

// Cloud graphics buffer (reused each frame to avoid memory churn)
let cloudGraphics = null

// PNG sprites for player (Phase 3.4)
let dinoSprites = {
  run: [],   // run_0.png, run_1.png
  duck: [],  // duck_run_0.png, duck_run_1.png
  idle: []   // idle.png (shown during jump)
}

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
// p5.js PRELOAD (Phase 3.4)
// ============================================
function preload() {
  // Load PNG sprites for player (run + duck animations)
  dinoSprites.run[0] = loadImage('/conways-arcade-online/img/dino-sprites/run_0.png')
  dinoSprites.run[1] = loadImage('/conways-arcade-online/img/dino-sprites/run_1.png')
  dinoSprites.duck[0] = loadImage('/conways-arcade-online/img/dino-sprites/duck_run_0.png')
  dinoSprites.duck[1] = loadImage('/conways-arcade-online/img/dino-sprites/duck_run_1.png')
  dinoSprites.idle[0] = loadImage('/conways-arcade-online/img/dino-sprites/idle.png')
}

// Setup completion flag (prevents draw() from running before async setup completes)
let setupComplete = false

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

  // Create gradient renderer
  maskedRenderer = new VideoGradientRenderer(this)

  // Initialize hitbox debugging (press H to toggle)
  initHitboxDebug()

  // Initialize theme receiver
  initThemeReceiver((theme) => {
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
    debugLog(`Dino Runner: Theme changed to ${theme}, background: ${CONFIG.ui.backgroundColor}`)
  })

  // Create reusable graphics buffer for clouds (avoids memory churn)
  cloudGraphics = createGraphics(GAME_DIMENSIONS.BASE_WIDTH, GAME_DIMENSIONS.BASE_HEIGHT)

  // Pre-compile GPU shaders (eliminates first-run lag)
  await maskedRenderer.warmupShaders([
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
  state.phase = 'PLAYING'
  state.frameCount = 0
  state.spawnTimer = 0
  state.cloudSpawnTimer = 0
  state.groundLineSpawnTimer = 0
  state.gameSpeed = 1

  setupPlayer()
  obstacles = []
  particles = []
  groundLines = []
  initParallax()
  initGroundLines()
}

function setupPlayer() {
  // CRITICAL DEVIATION FROM AUTHENTICITY (Phase 3.4)
  // Client requirement: PNG sprites for player with duck animation
  // Rationale: Brand recognition over GoL authenticity
  // Date: 2025-11-19
  // Status: APPROVED BY CLIENT
  // Reference: CLAUDE.md Section 14

  player = {
    x: 200,
    y: CONFIG.groundY - PLAYER_DIMENSIONS.RUN.height,  // groundY - height (sprite sits on physics ground)

    // DIMENSIONS: Change based on ducking state (uses PLAYER_DIMENSIONS constants)
    width: PLAYER_DIMENSIONS.RUN.width,
    height: PLAYER_DIMENSIONS.RUN.height,

    // Physics
    vx: 0,
    vy: 0,
    onGround: true,

    // Duck state
    isDucking: false,

    // Animation
    frameIndex: 0,
    animationSpeed: 6,        // Change sprite every 6 frames (10fps at 60fps)

    // PNG sprites (replaces GoL rendering)
    sprites: dinoSprites      // { run: [img0, img1], duck: [img0, img1] }

    // NO gol property - using static PNG instead
    // NO cellSize - not needed for PNG
    // NO gradient - not needed for PNG
  }
}

// ============================================
// PARALLAX BACKGROUND SYSTEM (Phase 3.4)
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
    y: random(100, 800),  // Random vertical position
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
// GROUND LINES SYSTEM (Chrome Dino style)
// ============================================

/**
 * Initialize ground lines system.
 * Pre-populates the screen with lines for seamless effect.
 */
function initGroundLines() {
  groundLines = []

  // Pre-populate screen with lines distributed evenly
  const spacing = GAME_DIMENSIONS.BASE_WIDTH / CONFIG.groundLines.density

  for (let i = 0; i < CONFIG.groundLines.density; i++) {
    const gLine = spawnGroundLine()
    // Distribute lines across screen width
    gLine.x = i * spacing + random(-spacing * 0.3, spacing * 0.3)
    groundLines.push(gLine)
  }
}

/**
 * Create a new ground line.
 * @returns {Object} Ground line entity
 */
function spawnGroundLine() {
  return {
    x: GAME_DIMENSIONS.BASE_WIDTH,  // Start off-screen right
    y: CONFIG.horizonY + random(CONFIG.groundLines.yOffsetMin, CONFIG.groundLines.yOffsetMax),
    length: random(CONFIG.groundLines.minLength, CONFIG.groundLines.maxLength),
    vx: CONFIG.groundLines.speed,
    dead: false
  }
}

/**
 * Update all ground lines.
 * Handles movement, cleanup, and spawning.
 */
function updateGroundLines() {
  // Move lines
  groundLines.forEach(gLine => {
    gLine.x += gLine.vx * state.gameSpeed

    // Mark as dead if off-screen left
    if (gLine.x + gLine.length < 0) {
      gLine.dead = true
    }
  })

  // Remove dead lines
  groundLines = groundLines.filter(gLine => !gLine.dead)

  // Spawn new line if timer reached
  state.groundLineSpawnTimer++
  if (state.groundLineSpawnTimer >= CONFIG.groundLines.spawnInterval) {
    groundLines.push(spawnGroundLine())
    state.groundLineSpawnTimer = 0
  }
}

/**
 * Render ground lines with simple stroke.
 * Must be called AFTER horizon line, BEFORE obstacles.
 */
function renderGroundLines() {
  push()
  stroke(CONFIG.groundLines.color[0], CONFIG.groundLines.color[1], CONFIG.groundLines.color[2])
  strokeWeight(CONFIG.groundLines.thickness)

  groundLines.forEach(gLine => {
    line(gLine.x, gLine.y, gLine.x + gLine.length, gLine.y)
  })

  pop()
}

// ============================================
// HITBOX CALCULATION HELPER
// ============================================

/**
 * Calculate tight hitbox based on actual alive cells in GoL grid.
 * Returns bounding box that fits exactly around the visible pattern.
 *
 * @param {GoLEngine} golEngine - GoL engine with pattern
 * @returns {Object} { width, height, offsetX, offsetY }
 */
function calculateTightHitbox(golEngine) {
  const grid = golEngine.current
  let minX = golEngine.cols
  let maxX = 0
  let minY = golEngine.rows
  let maxY = 0

  // Find bounding box of alive cells
  for (let x = 0; x < golEngine.cols; x++) {
    for (let y = 0; y < golEngine.rows; y++) {
      if (grid[x][y] === 1) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  // Calculate dimensions (add 1 because indices are 0-based)
  const width = (maxX - minX + 1) * 30
  const height = (maxY - minY + 1) * 30
  const offsetX = minX * 30
  const offsetY = minY * 30

  return { width, height, offsetX, offsetY }
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
    updateParticlesOnly()

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

  // Update gradient animation
  maskedRenderer.updateAnimation()

  if (state.phase === 'GAMEOVER') {
    // Only show Game Over screen in standalone mode
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

function updateGame() {
  // Update parallax background (BEFORE other entities)
  updateClouds()

  // Update ground lines (Chrome Dino style decoration)
  updateGroundLines()

  // Update player
  updatePlayer()

  // Spawn obstacles
  state.spawnTimer++

  // Calculate base interval with difficulty scaling
  const baseInterval = Math.max(
    CONFIG.obstacle.minInterval,
    CONFIG.obstacle.spawnInterval - Math.floor(state.score / 100)
  )

  // Add random variability (±40 frames) for Chrome Dino-style spacing
  const randomOffset = random(-CONFIG.obstacle.intervalVariability, CONFIG.obstacle.intervalVariability)
  const currentInterval = Math.max(
    CONFIG.obstacle.minInterval,
    baseInterval + randomOffset
  )

  if (state.spawnTimer >= currentInterval) {
    spawnObstacle()
    state.spawnTimer = 0
  }

  // Update obstacles (Phase 3.4: GoL patterns + static pterodactyls)
  obstacles.forEach(obs => {
    obs.x += obs.vx * state.gameSpeed

    // Update GoL according to type
    if (obs.type === 'oscillator') {
      // Only oscillators animate (BLINKER, TOAD, BEACON)
      obs.gol.updateThrottled(state.frameCount)
    }
    // Still lifes and flying pterodactyls are static
    // They are frozen by PatternRenderer with RenderMode.STATIC

    if (obs.x < -150) {  // Scaled: -50 × 3 = -150
      obs.dead = true
      state.score += 10
    }
  })

  obstacles = obstacles.filter(obs => !obs.dead)

  // Update particles (Pure GoL)
  updateParticlesOnly()

  // Check collisions
  checkCollisions()

  // Increase difficulty
  state.gameSpeed += CONFIG.obstacle.speedIncrease

  // Increment score
  if (state.frameCount % 6 === 0) {
    state.score++
  }
}

function updatePlayer() {
  // Read input states FIRST (before physics)
  const isDuckPressed = keyIsDown(DOWN_ARROW)
  const isJumpPressed = keyIsDown(32) || keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(78)  // SPACE, UP, W, or N

  // Jump input (jump has priority over duck)
  if (isJumpPressed && player.onGround && !isDuckPressed) {
    player.vy = CONFIG.jumpForce
    player.onGround = false
    player.isDucking = false  // Cancel duck on jump
  }

  // Apply VARIABLE GRAVITY based on state
  let currentGravity
  if (!player.onGround && isDuckPressed) {
    // Fast fall: pressing DOWN while in air accelerates descent
    currentGravity = CONFIG.gravity.fastFall
  } else if (player.vy < 0) {
    // Rising: gentler gravity for more "hang time" at peak
    currentGravity = CONFIG.gravity.rising
  } else {
    // Falling: stronger gravity for satisfying descent
    currentGravity = CONFIG.gravity.falling
  }

  player.vy += currentGravity

  // Apply terminal velocity (cap falling speed)
  if (player.vy > CONFIG.terminalVelocity) {
    player.vy = CONFIG.terminalVelocity
  }

  // Move player
  player.y += player.vy

  // Ground collision (clamp position and reset velocity)
  if (player.y >= CONFIG.groundY - PLAYER_DIMENSIONS.RUN.height) {
    player.y = CONFIG.groundY - PLAYER_DIMENSIONS.RUN.height  // Clamp to ground
    player.vy = 0
    player.onGround = true
  } else {
    player.onGround = false
  }

  // Duck input (only on ground when not jumping)
  if (isDuckPressed && player.onGround && !isJumpPressed) {
    player.isDucking = true
  } else {
    player.isDucking = false
  }

  // Update dimensions based on ducking state (using PLAYER_DIMENSIONS constants)
  if (player.isDucking) {
    player.width = PLAYER_DIMENSIONS.DUCK.width
    player.height = PLAYER_DIMENSIONS.DUCK.height
    // Adjust Y ONLY if on ground (don't interfere with jumping/falling)
    if (player.onGround) {
      player.y = CONFIG.groundY - PLAYER_DIMENSIONS.DUCK.height
    }
  } else {
    player.width = PLAYER_DIMENSIONS.RUN.width
    player.height = PLAYER_DIMENSIONS.RUN.height
    // Y already clamped in ground collision above
  }

  // Update animation frame
  player.frameIndex = Math.floor(state.frameCount / player.animationSpeed) % 2

  // NO GoL update - player uses static PNG sprites (Phase 3.4)
}

function spawnObstacle() {
  // Phase 3.4: Randomly choose between ground obstacles and flying pterodactyls
  const spawnFlying = random() < 0.3  // 30% chance of pterodactyl
  const patternConfig = spawnFlying
    ? random(CONFIG.pterodactylPatterns)
    : random(CONFIG.obstaclePatterns)

  // Create renderer using PatternRenderer
  const renderer = createPatternRenderer({
    mode: (patternConfig.type === 'still-life' || patternConfig.type === 'flying') ? RenderMode.STATIC : RenderMode.LOOP,
    pattern: patternConfig.pattern,
    phase: patternConfig.phase !== undefined ? patternConfig.phase : undefined,
    globalCellSize: 30,
    loopUpdateRate: 10  // 10fps for oscillators only
  })

  const dims = renderer.dimensions

  // Position based on obstacle type
  let obstacleY
  if (spawnFlying) {
    // Flying obstacles: Very low to force ducking
    // Duck height: 121px - pterodactyl must be low enough to hit standing player
    // Bottom of pterodactyl at 80px above ground (forces duck, can't jump over)
    const minHeightAboveGround = 80  // Tighter - must duck
    obstacleY = CONFIG.groundY - dims.height - minHeightAboveGround
  } else {
    // Ground obstacles: centered on horizon line
    obstacleY = CONFIG.horizonY - dims.height * 0.5
  }

  // Calculate tight hitbox based on actual alive cells
  const tightHitbox = calculateTightHitbox(renderer.gol)
  const hitboxWidth = tightHitbox.width
  const hitboxHeight = tightHitbox.height
  const hitboxOffsetX = tightHitbox.offsetX
  const hitboxOffsetY = tightHitbox.offsetY

  const obstacle = {
    x: GAME_DIMENSIONS.BASE_WIDTH,
    y: obstacleY,
    width: dims.width,      // Visual width (full pattern)
    height: dims.height,    // Visual height (full pattern)
    hitboxWidth,            // Collision width (tighter for pterodactyls)
    hitboxHeight,           // Collision height (tighter for pterodactyls)
    hitboxOffsetX,          // Hitbox offset from x
    hitboxOffsetY,          // Hitbox offset from y
    vx: CONFIG.obstacle.speed,
    gol: renderer.gol,
    cellSize: 30,
    gradient: patternConfig.gradient,
    type: patternConfig.type,  // 'still-life', 'oscillator', or 'flying'
    name: patternConfig.name,
    dead: false,
    isFlying: spawnFlying  // Track if this is a flying obstacle
  }

  obstacles.push(obstacle)
}

function updateParticlesOnly() {
  particles = updateParticles(particles, state.frameCount)
}

function checkCollisions() {
  obstacles.forEach(obs => {
    // Use custom hitbox dimensions if available (for pterodactyls)
    const obsHitboxX = obs.x + (obs.hitboxOffsetX || 0)
    const obsHitboxY = obs.y + (obs.hitboxOffsetY || 0)
    const obsHitboxWidth = obs.hitboxWidth || obs.width
    const obsHitboxHeight = obs.hitboxHeight || obs.height

    // Get player hitbox (50% width, centered on legs)
    const playerHitbox = player.isDucking ? PLAYER_DIMENSIONS.HITBOX.DUCK : PLAYER_DIMENSIONS.HITBOX.RUN
    const playerVisualOffsetX = player.isDucking ? PLAYER_DIMENSIONS.DUCK_OFFSET_X : 0
    const playerHitboxX = player.x + playerVisualOffsetX + playerHitbox.offsetX
    const playerHitboxY = player.y
    const playerHitboxW = playerHitbox.width
    const playerHitboxH = playerHitbox.height

    if (Collision.rectRect(
      playerHitboxX, playerHitboxY, playerHitboxW, playerHitboxH,
      obsHitboxX, obsHitboxY, obsHitboxWidth, obsHitboxHeight
    )) {
      // Game over
      if (state.phase !== 'GAMEOVER' && state.phase !== 'DYING') {
        state.phase = 'DYING'
        state.dyingTimer = 0

        // Spawn explosion
        spawnExplosion(player.x + player.width / 2, player.y + player.height / 2)

        // Note: postMessage will be sent after particle animation completes
      }
    }
  })
}

function spawnExplosion(x, y) {
  for (let i = 0; i < 8; i++) {
    const particle = {
      x: x + random(-30, 30),  // Scaled: -10 to 10 × 3
      y: y + random(-30, 30),
      vx: random(-9, 9),       // Scaled: -3 to 3 × 3
      vy: random(-9, 9),
      alpha: 255,
      width: 180,   // 60 × 3 = 180 (scaled)
      height: 180,  // 60 × 3 = 180
      gol: new GoLEngine(6, 6, 30),  // 6×6 grid maintained
      cellSize: 30,  // Scaled to 30px (3x from 10px baseline)
      gradient: GRADIENT_PRESETS.EXPLOSION,
      dead: false
    }

    // Seed with radial density
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

  // Horizon line (aesthetic - drawn above physics ground)
  stroke(CONFIG.ui.textColor)
  strokeWeight(2)
  line(0, CONFIG.horizonY, GAME_DIMENSIONS.BASE_WIDTH, CONFIG.horizonY)

  // Render ground lines (Chrome Dino style - AFTER horizon, BEFORE player)
  renderGroundLines()

  // Render player with PNG sprite animation (hide during DYING and GAMEOVER)
  // Phase 3.4: Using animated PNG sprites (run + duck + idle)
  if (state.phase === 'PLAYING' && player.sprites) {
    // Select sprite set based on player state (priority: jump > duck > run)
    let spriteSet
    if (!player.onGround) {
      // Jumping/falling - show idle sprite (static)
      spriteSet = player.sprites.idle
    } else if (player.isDucking) {
      // Ducking on ground - show duck animation
      spriteSet = player.sprites.duck
    } else {
      // Running on ground - show run animation
      spriteSet = player.sprites.run
    }

    // Verify sprite set exists and has frames
    if (spriteSet && spriteSet.length > 0) {
      // Get current animation frame (% prevents index overflow)
      const currentSprite = spriteSet[player.frameIndex % spriteSet.length]

      // Render sprite (dimensions match hitbox exactly)
      if (currentSprite && currentSprite.width > 0) {
        // When ducking, center the wider sprite horizontally
        // Duck sprite: 265px wide (65px wider than run 200px)
        // Offset by half the difference to keep dino centered
        const offsetX = player.isDucking ? PLAYER_DIMENSIONS.DUCK_OFFSET_X : 0

        push()
        imageMode(CORNER)
        noSmooth()  // Pixel-perfect rendering for sprites
        image(
          currentSprite,
          player.x + offsetX,
          player.y,
          player.width,   // 200px (run) or 265px (duck)
          player.height   // 200px (run) or 121px (duck)
        )
        pop()
      }
    }
  }

  // Render obstacles with gradients
  obstacles.forEach(obs => {
    maskedRenderer.renderMaskedGrid(
      obs.gol,
      obs.x,
      obs.y,
      obs.cellSize,
      obs.gradient
    )
  })

  // Render particles with gradients and alpha
  // Note: ParticleHelpers uses globalCellSize parameter, but particles have individual cellSize
  // We pass 30 as the standard cellSize for dino-runner particles
  renderParticles(particles, maskedRenderer, 30)

  // Debug: Draw hitboxes (press H to toggle)
  // Show actual collision hitbox (50% width, centered on legs)
  const playerHitbox = player.isDucking ? PLAYER_DIMENSIONS.HITBOX.DUCK : PLAYER_DIMENSIONS.HITBOX.RUN
  const playerVisualOffsetX = player.isDucking ? PLAYER_DIMENSIONS.DUCK_OFFSET_X : 0
  const playerHitboxX = player.x + playerVisualOffsetX + playerHitbox.offsetX
  drawHitboxRect(playerHitboxX, player.y, playerHitbox.width, playerHitbox.height, 'player', '#00FF00')

  // Draw obstacle hitboxes (using custom hitbox dimensions for pterodactyls)
  obstacles.forEach((obs, index) => {
    const obsHitboxX = obs.x + (obs.hitboxOffsetX || 0)
    const obsHitboxY = obs.y + (obs.hitboxOffsetY || 0)
    const obsHitboxWidth = obs.hitboxWidth || obs.width
    const obsHitboxHeight = obs.hitboxHeight || obs.height
    drawHitboxRect(obsHitboxX, obsHitboxY, obsHitboxWidth, obsHitboxHeight, `obstacle ${index}`, '#FF0000')
  })

  pop()
}

// UI rendering removed - now handled by game-wrapper.html overlay

// ============================================
// INPUT
// ============================================
function keyPressed() {
  if ((key === ' ' || key === 'n' || key === 'N') && state.phase === 'GAMEOVER') {
    // Only allow restart in standalone mode
    if (window.parent === window) {
      initGame()
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

  // No need to modify entity values - scaling happens in rendering
}

// Export for p5.js
window.preload = preload
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
