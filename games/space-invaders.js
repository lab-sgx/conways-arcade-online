/**
 * Space Invaders with Simple Gradients (KISS)
 * Demonstration of simple gradient system with GoL masks
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Collision } from '/conways-arcade-online/src/utils/Collision.js'
import { Patterns } from '/conways-arcade-online/src/utils/Patterns.js'
import { seedRadialDensity, applyLifeForce, maintainDensity } from '/conways-arcade-online/src/utils/GoLHelpers.js'
import { updateParticles, renderParticles } from '/conways-arcade-online/src/utils/ParticleHelpers.js'
import { renderGameOver } from '/conways-arcade-online/src/utils/UIHelpers.js'
import { updateLoopPattern } from '/conways-arcade-online/src/utils/LoopPatternHelpers.js'
import { createPatternRenderer, RenderMode, PatternName } from '/conways-arcade-online/src/utils/PatternRenderer.js'
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
  // PHASE 3: Global cell size for all entities
  globalCellSize: 30,  // Pixel size of all GoL cells (range: 15-60)

  invader: {
    cols: 5,      // 6 columns
    rows: 3,      // 3 rows
    // width/height now calculated dynamically from gol.cols/rows × globalCellSize
    spacing: 80,  // Spacing between invaders
    startX: 180,  // Same as Breakout offsetX for visual consistency
    startY: 200,  // Same as Breakout offsetY - unified starting position

    // Level-based speed (NEW - 2025-11-18)
    moveIntervalStart: 30,    // Initial move interval (slow)
    moveIntervalMin: 3,        // Minimum move interval (very fast)
    moveIntervalDecrement: 5,  // Reduce by 5 frames each level (faster acceleration)
    speed: 45,                 // Horizontal move distance

    // Enemy shooting system (NEW - 2025-11-20)
    shootStartLevel: 2,        // Start shooting at level 2
    shootIntervalStart: 120,   // 2 seconds at 60fps (slow)
    shootIntervalMin: 30,      // 0.5 seconds (fast)
    shootIntervalDecrement: 15 // Reduce 15 frames per level
    // NOTE: golUpdateRate removed - now uses CONFIG.loopUpdateRate (unified for all GoL)
  },

  player: {
    // width/height now calculated dynamically from gol.cols/rows × globalCellSize
    speed: 18,    // 6 × 3 = 18
    shootCooldown: 15
  },

  bullet: {
    // width/height now calculated dynamically from gol.cols/rows × globalCellSize
    speed: 12     // Bullet vertical speed (negative = upward)
  },

  enemyBullet: {
    speed: 8      // Downward speed (positive = downward)
    // width/height = globalCellSize (single black cell: 30×30px)
  },

  explosion: {
    // width/height now calculated dynamically from gol.cols/rows × globalCellSize
  },

  background: {
    updateRate: 10  // Background GoL update rate (fps)
  },

  // Loop pattern update rate (frames between phase changes)
  // Controls speed of Pure GoL pattern oscillations (BLINKER, PULSAR, etc.)
  loopUpdateRate: 10,  // 10 fps (6 frames at 60fps)

  // Hitbox limits (Sub-opción 1C: Clamped hitbox)
  // Ensures fair gameplay while allowing visual variety
  hitbox: {
    player: { min: 120, max: 240, default: 180 },
    invaders: { min: 120, max: 240, default: 180 },
    bullets: { min: 60, max: 120, default: 90 },
    explosions: { min: 120, max: 240, default: 180 }
  }
})

// Store scale factor for rendering (don't modify CONFIG values)
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// ============================================
// GAME STATE
// ============================================
const state = createGameState({
  level: 1,
  currentMoveInterval: 30,  // Current invader move interval (decreases per level)
  currentShootInterval: 120, // Current enemy shoot interval (decreases per level)
  invaderDirection: 1,
  invaderMoveTimer: 0,
  enemyShootTimer: 0,        // Timer for enemy shooting
  playerShootCooldown: 0,
  dyingTimer: 0
})

// ============================================
// ENTITIES
// ============================================
let player = null
let invaders = []
let bullets = []
let enemyBullets = []  // Enemy bullets (black cells)
let particles = []

// Theme state (for enemy bullet color)
let currentTheme = 'day'

// Simple gradient renderer
let maskedRenderer = null

// Setup completion flag (prevents draw() from running before async setup completes)
let setupComplete = false

// ============================================
// RESPONSIVE CANVAS HELPERS
// ============================================
function calculateResponsiveSize() {
  // Use window height as reference, calculate width maintaining 10:16 aspect ratio
  const canvasHeight = windowHeight
  const canvasWidth = canvasHeight * GAME_DIMENSIONS.ASPECT_RATIO
  return { width: canvasWidth, height: canvasHeight }
}

function updateConfigScale() {
  // Only update scaleFactor based on canvas size, don't modify CONFIG values
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT
}

/**
 * Calculate entity dimensions from GoL grid size and global cell size (Phase 3).
 * Implements pattern-driven sizing where entity visual size depends on pattern dimensions.
 *
 * @param {Object} entity - Entity with gol property (GoLEngine instance)
 * @returns {Object} { width, height, hitboxRadius }
 *
 * @example
 * // BLINKER player (5×3 grid) at 30px cells
 * const dims = calculateEntityDimensions(player)  // { width: 150, height: 90, hitboxRadius: 72 }
 *
 * // PULSAR invader (15×15 grid) at 30px cells
 * const dims = calculateEntityDimensions(invader)  // { width: 450, height: 450, hitboxRadius: 270 }
 */
function calculateEntityDimensions(entity) {
  const cellSize = CONFIG.globalCellSize
  const cols = entity.gol.cols
  const rows = entity.gol.rows

  const width = cols * cellSize
  const height = rows * cellSize

  // Hitbox scales with visual size (user decision: Q3/Q4 - acceptable gameplay tradeoff)
  // Formula: average dimension × 0.6
  const hitboxRadius = (width + height) / 2 * 0.6

  return { width, height, hitboxRadius }
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

  // Create video gradient renderer (KISS)
  maskedRenderer = new VideoGradientRenderer(this)

  // Initialize theme receiver
  initThemeReceiver((theme) => {
    currentTheme = theme  // Track theme for enemy bullet color
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
    console.log(`Space Invaders: Theme changed to ${theme}, background: ${CONFIG.ui.backgroundColor}`)
  })

  // Pre-compile GPU shaders (eliminates first-run lag)
  await maskedRenderer.warmupShaders([
    GRADIENT_PRESETS.PLAYER,
    GRADIENT_PRESETS.ENEMY_HOT,
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
  state.frameCount = 0
  state.currentMoveInterval = CONFIG.invader.moveIntervalStart  // Reset to starting speed
  state.currentShootInterval = CONFIG.invader.shootIntervalStart // Reset enemy shooting speed
  state.invaderDirection = 1
  invaders = []
  bullets = []
  enemyBullets = []  // Clear enemy bullets
  particles = []

  setupPlayer()
  setupInvaders()
}

// ============================================
// HITBOX HELPER FUNCTIONS
// ============================================

/**
 * Calculate clamped hitbox for an entity.
 * Follows CLAUDE.md principle: "Separate visual (GoL) from logic (hitbox)"
 *
 * @param {number} spriteSize - Visual size (width or height)
 * @param {string} entityType - Type of entity ('player', 'invaders', 'bullets', 'explosions')
 * @returns {Object} Hitbox configuration {width, height, offsetX, offsetY}
 *
 * @example
 * const hitbox = calculateClampedHitbox(264, 'player')
 * // Returns: { width: 240, height: 240, offsetX: 12, offsetY: 12 }
 */
function calculateClampedHitbox(spriteSize, entityType) {
  const limits = CONFIG.hitbox[entityType]

  // Clamp hitbox size between min and max
  const hitboxSize = Math.max(limits.min, Math.min(limits.max, spriteSize))

  return {
    width: hitboxSize,
    height: hitboxSize,
    offsetX: (spriteSize - hitboxSize) / 2,  // Center hitbox in sprite
    offsetY: (spriteSize - hitboxSize) / 2
  }
}

function setupPlayer() {
  // Loop BLINKER (Pure GoL oscillator)
  const renderer = createPatternRenderer({
    mode: RenderMode.LOOP,
    pattern: PatternName.BLINKER,
    globalCellSize: CONFIG.globalCellSize,
    loopUpdateRate: CONFIG.loopUpdateRate
  })

  const hitbox = calculateClampedHitbox(renderer.dimensions.width, 'player')

  player = {
    x: CONFIG.width / 2 - renderer.dimensions.width / 2,
    y: CONFIG.height - 200,
    width: renderer.dimensions.width,
    height: renderer.dimensions.height,
    hitbox: hitbox,
    vx: 0,
    gol: renderer.gol,
    gradient: GRADIENT_PRESETS.PLAYER
  }
}

function setupInvaders() {
  const { cols, rows, spacing, startX, startY } = CONFIG.invader

  // Random still lifes (BLOCK, BEEHIVE, LOAF, BOAT, TUB)
  const stillLifePatterns = [
    PatternName.BLOCK,
    PatternName.BEEHIVE,
    PatternName.LOAF,
    PatternName.BOAT,
    PatternName.TUB
  ]

  // Create a single renderer to get dimensions (use BLOCK as reference)
  const testRenderer = createPatternRenderer({
    mode: RenderMode.STATIC,
    pattern: PatternName.BLOCK,
    phase: 0,
    globalCellSize: CONFIG.globalCellSize
  })

  const dims = testRenderer.dimensions
  const hitbox = calculateClampedHitbox(dims.width, 'invaders')

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Create renderer with random still life pattern
      const renderer = createPatternRenderer({
        mode: RenderMode.STATIC,
        pattern: stillLifePatterns,  // Array = random selection
        phase: 0,  // Still lifes are always phase 0
        globalCellSize: CONFIG.globalCellSize
      })

      const invader = {
        x: startX + col * (dims.width + spacing),
        y: startY + row * (dims.height + spacing),
        width: dims.width,
        height: dims.height,
        hitbox: hitbox,
        dead: false,
        gol: renderer.gol,  // Use frozen GoL from PatternRenderer
        gradient: row % 3 === 0 ? GRADIENT_PRESETS.ENEMY_HOT :
                  row % 3 === 1 ? GRADIENT_PRESETS.ENEMY_COLD :
                  GRADIENT_PRESETS.ENEMY_RAINBOW
      }

      invaders.push(invader)
    }
  }
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
    updateParticlesLocal()

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

  // Update gradient animations
  maskedRenderer.updateAnimation()

  if (state.phase === 'GAMEOVER') {
    // Only show Game Over screen in standalone mode
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

/**
 * Handle loop pattern resets (Pure GoL oscillators/spaceships).
 *
 * Wrapper around updateLoopPattern utility function.
 * Loop patterns require special handling to maintain authentic B3/S23 cycles.
 *
 * @param {GoLEngine} gol - GoL engine with loop metadata
 * @param {number} frameCount - Current frame count from state (unused, kept for API consistency)
 */
function handleLoopReset(gol, frameCount) {
  updateLoopPattern(gol, CONFIG.loopUpdateRate, true)
}

function updateGame() {
  updatePlayer()
  updateInvaders()
  updateBullets()
  updateEnemyBullets()  // Enemy shooting system
  updateParticlesLocal()
  checkCollisions()
  checkWinLose()
}

function updatePlayer() {
  // Movement
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    player.vx = -CONFIG.player.speed
  } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    player.vx = CONFIG.player.speed
  } else {
    player.vx = 0
  }

  player.x += player.vx
  player.x = Collision.clamp(player.x, 0, CONFIG.width - player.width)

  // Shoot
  if ((keyIsDown(32) || keyIsDown(90) || keyIsDown(78)) && state.playerShootCooldown === 0) {  // SPACE, Z, or N
    shootBullet()
    state.playerShootCooldown = CONFIG.player.shootCooldown
  }

  // Update GoL
  player.gol.updateThrottled(state.frameCount)

  // CRITICAL: Only apply lifeForce if NOT frozen AND NOT a loop pattern
  // Loop patterns are Pure GoL (Tier 1) - must remain authentic without lifeForce
  if (!player.gol.isFrozen() && !player.gol.isLoopPattern) {
    applyLifeForce(player)
  }

  // Handle loop pattern resets (Pure GoL oscillations)
  if (player.gol.isLoopPattern) {
    handleLoopReset(player.gol, state.frameCount)
  }

  // Cooldown
  if (state.playerShootCooldown > 0) {
    state.playerShootCooldown--
  }
}

function updateInvaders() {
  state.invaderMoveTimer++

  // Use level-based move interval (decreases each time matrix is cleared)
  if (state.invaderMoveTimer >= state.currentMoveInterval) {
    moveInvaders()
    state.invaderMoveTimer = 0
  }

  invaders.forEach(inv => {
    // Still lifes are frozen, no update needed
    // (BLOCK, BEEHIVE, LOAF, BOAT, TUB don't evolve)
  })
}

function updateBullets() {
  bullets.forEach(bullet => {
    bullet.y += bullet.vy

    // Visual Only: maintain density
    if (state.frameCount % 5 === 0) {
      maintainDensity(bullet, 0.75)
    }

    // Off screen - use CONFIG.height (base coordinates) not canvas height
    if (bullet.y < 0 || bullet.y > CONFIG.height) {
      bullet.dead = true
    }
  })

  bullets = bullets.filter(b => !b.dead)
}

function updateParticlesLocal() {
  particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)
}

function moveInvaders() {
  const hitEdge = invaders.some(inv =>
    (state.invaderDirection > 0 && inv.x > CONFIG.width - 240) ||  // Scaled: 80 × 3 = 240
    (state.invaderDirection < 0 && inv.x < 150)  // Scaled: 50 × 3 = 150
  )

  if (hitEdge) {
    invaders.forEach(inv => inv.y += 60)  // Scaled: 20 × 3 = 60
    state.invaderDirection *= -1

    if (invaders.some(inv => inv.y > CONFIG.height - 450)) {  // Scaled: 150 × 3 = 450
      state.lives = 0
    }
  } else {
    invaders.forEach(inv => inv.x += state.invaderDirection * CONFIG.invader.speed)
  }
}

function shootBullet() {
  const bullet = {
    x: player.x + player.width / 2,  // Temp position, will adjust after dims calculated
    y: player.y,
    width: 0,   // Will be calculated
    height: 0,  // Will be calculated
    vy: -CONFIG.bullet.speed,  // Use CONFIG value (negative = upward)
    dead: false,

    // Small 2x2 grid for compact bullets
    gol: new GoLEngine(2, 2, CONFIG.loopUpdateRate),
    gradient: GRADIENT_PRESETS.BULLET
  }

  // Organic pattern with radial density (compact 2x2)
  seedRadialDensity(bullet.gol, 0.75, 0.0)

  // PHASE 3: Calculate dimensions after pattern applied
  const dims = calculateEntityDimensions(bullet)
  bullet.width = dims.width
  bullet.height = dims.height
  bullet.x = player.x + player.width / 2 - bullet.width / 2  // Center under player
  bullet.y = player.y - bullet.height

  bullets.push(bullet)
}

/**
 * Determine if an invader is in the bottom row (has no invader below it).
 * Used to select which invaders can shoot at the player.
 *
 * @param {Object} invader - Invader to check
 * @returns {boolean} True if no invader is below this one
 */
function isBottomInvader(invader) {
  return !invaders.some(other =>
    !other.dead &&
    Math.abs(other.x - invader.x) < invader.width &&
    other.y > invader.y
  )
}

/**
 * Shoot enemy bullet from random bottom invader.
 * Creates a simple black cell (30×30px) that moves downward.
 * Only shoots from level 2+.
 */
function shootEnemyBullet() {
  // Only shoot from level 2+
  if (state.level < CONFIG.invader.shootStartLevel) return

  // Pick random alive invader from bottom row
  const bottomInvaders = invaders.filter(inv =>
    !inv.dead && isBottomInvader(inv)
  )

  if (bottomInvaders.length === 0) return

  const shooter = bottomInvaders[Math.floor(Math.random() * bottomInvaders.length)]

  // Create enemy bullet (simple black cell - KISS approach)
  const bullet = {
    x: shooter.x + shooter.width / 2 - CONFIG.globalCellSize / 2,  // Center under invader
    y: shooter.y + shooter.height,
    width: CONFIG.globalCellSize,   // Single cell: 30px
    height: CONFIG.globalCellSize,  // Single cell: 30px
    vy: CONFIG.enemyBullet.speed,   // Positive = downward
    dead: false,
    type: 'enemy'
  }

  enemyBullets.push(bullet)
}

/**
 * Update enemy bullets (movement, cleanup).
 * Includes timer-based shooting from bottom invaders.
 */
function updateEnemyBullets() {
  // Enemy shooting timer (only from level 2+)
  if (state.level >= CONFIG.invader.shootStartLevel) {
    state.enemyShootTimer++

    if (state.enemyShootTimer >= state.currentShootInterval) {
      shootEnemyBullet()
      state.enemyShootTimer = 0
    }
  }

  // Update bullet positions
  enemyBullets.forEach(bullet => {
    bullet.y += bullet.vy

    // Off screen - use CONFIG.height (base coordinates)
    if (bullet.y > CONFIG.height) {
      bullet.dead = true
    }
  })

  enemyBullets = enemyBullets.filter(b => !b.dead)
}

function checkCollisions() {
  // Player bullets vs Invaders
  bullets.forEach(bullet => {
    invaders.forEach(invader => {
      if (!bullet.dead && !invader.dead) {
        // Use hitbox for collision (CLAUDE.md: separate visual from logic)
        if (Collision.rectRect(
          bullet.x, bullet.y, bullet.width, bullet.height,
          invader.x + invader.hitbox.offsetX,
          invader.y + invader.hitbox.offsetY,
          invader.hitbox.width,
          invader.hitbox.height
        )) {
          bullet.dead = true
          invader.dead = true
          state.score += 100
          spawnExplosion(invader)  // PHASE 3: Pass entire invader for size-based explosion
        }
      }
    })
  })

  // Enemy bullets vs Player
  enemyBullets.forEach(bullet => {
    if (!bullet.dead && player && !player.dead) {
      // Use player hitbox for collision
      if (Collision.rectRect(
        bullet.x, bullet.y, bullet.width, bullet.height,
        player.x + player.hitbox.offsetX,
        player.y + player.hitbox.offsetY,
        player.hitbox.width,
        player.hitbox.height
      )) {
        bullet.dead = true
        destroyPlayer()  // Game over
      }
    }
  })

  // Player bullets vs Enemy bullets (NEW - Bullet deflection)
  // Only check if both arrays have bullets (performance optimization)
  if (bullets.length > 0 && enemyBullets.length > 0) {
    bullets.forEach(playerBullet => {
      // Early exit if already dead (performance)
      if (playerBullet.dead) return

      enemyBullets.forEach(enemyBullet => {
        if (!enemyBullet.dead && !playerBullet.dead) {
          // Simple rect collision (both bullets are small)
          if (Collision.rectRect(
            playerBullet.x, playerBullet.y, playerBullet.width, playerBullet.height,
            enemyBullet.x, enemyBullet.y, enemyBullet.width, enemyBullet.height
          )) {
            playerBullet.dead = true
            enemyBullet.dead = true

            // Spawn mini-explosion at midpoint between bullets
            const midX = (playerBullet.x + enemyBullet.x) / 2
            const midY = (playerBullet.y + enemyBullet.y) / 2
            spawnMiniExplosion(midX, midY)

            state.score += 10  // Small bonus for bullet deflection
          }
        }
      })
    })
  }

  invaders = invaders.filter(i => !i.dead)
}

function checkWinLose() {
  if (invaders.length === 0) {
    // Matrix destroyed - increase speed for next level
    state.level++

    // Increase invader movement speed
    state.currentMoveInterval = Math.max(
      CONFIG.invader.moveIntervalMin,
      state.currentMoveInterval - CONFIG.invader.moveIntervalDecrement
    )

    // Increase enemy shooting speed (NEW)
    state.currentShootInterval = Math.max(
      CONFIG.invader.shootIntervalMin,
      state.currentShootInterval - CONFIG.invader.shootIntervalDecrement
    )

    setupInvaders()
  }

  if (state.lives <= 0 && state.phase !== 'GAMEOVER' && state.phase !== 'DYING') {
    state.phase = 'DYING'
    state.dyingTimer = 0
    // Note: postMessage will be sent after particle animation completes
  }
}

// ============================================
// RENDERING WITH MASKED GRADIENTS
// ============================================
function renderGame() {
  push()
  scale(scaleFactor)

  // DEBUG: Visualize hitboxes with simple rectangles
  if (keyIsDown(72)) { // Press 'H' for hitbox visualization
    // Draw simple rectangles where entities should be
    fill(255, 0, 0, 100)
    rect(player.x, player.y, player.width, player.height)

    invaders.forEach(inv => {
      fill(0, 255, 0, 100)
      rect(inv.x, inv.y, inv.width, inv.height)
    })
    pop()
    return // Skip gradient rendering in hitbox mode
  }

  // Render player with masked gradient (hide during DYING and GAMEOVER)
  if (player && state.phase === 'PLAYING') {
    maskedRenderer.renderMaskedGrid(
      player.gol,
      player.x,
      player.y,
      CONFIG.globalCellSize,  // PHASE 3: Use global cell size
      player.gradient
    )
  }

  // Render invaders with masked gradients
  invaders.forEach(invader => {
    maskedRenderer.renderMaskedGrid(
      invader.gol,
      invader.x,
      invader.y,
      CONFIG.globalCellSize,  // PHASE 3: Use global cell size
      invader.gradient
    )
  })

  // Render bullets with masked gradients
  bullets.forEach(bullet => {
    maskedRenderer.renderMaskedGrid(
      bullet.gol,
      bullet.x,
      bullet.y,
      CONFIG.globalCellSize,  // PHASE 3: Use global cell size
      bullet.gradient
    )
  })

  // Render enemy bullets (theme-aware: black in day, white in night)
  fill(currentTheme === 'night' ? 255 : 0)
  noStroke()
  enemyBullets.forEach(bullet => {
    rect(bullet.x, bullet.y, bullet.width, bullet.height)
  })

  // Render particles with masked gradients (PHASE 3: pass globalCellSize)
  renderParticles(particles, maskedRenderer, CONFIG.globalCellSize)

  pop()
}

// UI rendering removed - now handled by game-wrapper.html overlay

// ============================================
// GAME-SPECIFIC FUNCTIONS
// ============================================

function spawnExplosion(invader) {
  // PHASE 3: Calculate center position and size-based particle count
  const centerX = invader.x + invader.width / 2
  const centerY = invader.y + invader.height / 2

  // Calculate particle count based on GoL grid cell count (not pixel area)
  const cellCount = invader.gol.cols * invader.gol.rows
  const baseCellCount = 36  // Baseline: 6×6 grid = 36 cells
  const scaleFactor = cellCount / baseCellCount
  const particleCount = Math.max(2, Math.ceil(scaleFactor * 3))

  // Dispersion radius proportional to invader size
  const dispersionRadius = (invader.width + invader.height) / 4

  for (let i = 0; i < particleCount; i++) {
    const particle = {
      x: centerX + (Math.random() * 2 - 1) * dispersionRadius,
      y: centerY + (Math.random() * 2 - 1) * dispersionRadius,
      vx: (Math.random() * 2 - 1) * 4,
      vy: (Math.random() * 2 - 1) * 4,
      alpha: 255,
      width: 0,   // Will be calculated
      height: 0,  // Will be calculated
      dead: false,

      // 6x6 grid for explosions (uses unified update rate)
      gol: new GoLEngine(6, 6, CONFIG.loopUpdateRate),
      gradient: GRADIENT_PRESETS.EXPLOSION
    }

    // Pure GoL setup (Tier 1: no lifeForce)
    seedRadialDensity(particle.gol, 0.7, 0.0)

    // Add a small pattern in center for chaos
    const explosionPatterns = [Patterns.BLINKER, Patterns.TOAD, Patterns.BEACON]
    const pattern = explosionPatterns[Math.floor(Math.random() * explosionPatterns.length)]
    particle.gol.setPattern(pattern, 1, 1)

    // PHASE 3: Calculate dimensions after pattern applied
    const dims = calculateEntityDimensions(particle)
    particle.width = dims.width
    particle.height = dims.height

    // Center particle: x,y should be top-left corner, not center
    particle.x -= particle.width / 2
    particle.y -= particle.height / 2

    particles.push(particle)
  }
}

/**
 * Spawn player explosion particles.
 * Creates more particles than invader explosion (player is important visual event).
 */
function spawnPlayerExplosion() {
  const centerX = player.x + player.width / 2
  const centerY = player.y + player.height / 2

  // More particles than invader (8 vs 2-3)
  const particleCount = 8

  // Dispersion radius proportional to player size
  const dispersionRadius = (player.width + player.height) / 4

  for (let i = 0; i < particleCount; i++) {
    const particle = {
      x: centerX + (Math.random() * 2 - 1) * dispersionRadius,
      y: centerY + (Math.random() * 2 - 1) * dispersionRadius,
      vx: (Math.random() * 2 - 1) * 5,  // Slightly faster than invader explosion
      vy: (Math.random() * 2 - 1) * 5,
      alpha: 255,
      width: 0,
      height: 0,
      dead: false,

      // 6x6 grid for explosions (uses unified update rate)
      gol: new GoLEngine(6, 6, CONFIG.loopUpdateRate),
      gradient: GRADIENT_PRESETS.EXPLOSION
    }

    // Pure GoL setup (Tier 1: no lifeForce)
    seedRadialDensity(particle.gol, 0.7, 0.0)

    // Add a small pattern in center for chaos
    const explosionPatterns = [Patterns.BLINKER, Patterns.TOAD, Patterns.BEACON]
    const pattern = explosionPatterns[Math.floor(Math.random() * explosionPatterns.length)]
    particle.gol.setPattern(pattern, 1, 1)

    // Calculate dimensions after pattern applied
    const dims = calculateEntityDimensions(particle)
    particle.width = dims.width
    particle.height = dims.height

    // Center particle: x,y should be top-left corner, not center
    particle.x -= particle.width / 2
    particle.y -= particle.height / 2

    particles.push(particle)
  }
}

/**
 * Destroy player (hit by enemy bullet).
 * Spawns explosion particles and triggers game over.
 */
function destroyPlayer() {
  spawnPlayerExplosion()
  state.lives = 0
  player.dead = true  // Hide player during DYING phase
}

/**
 * Spawn mini-explosion when bullets collide.
 * Creates a single 2×2 Blinker particle that oscillates briefly.
 *
 * @param {number} x - X coordinate of collision
 * @param {number} y - Y coordinate of collision
 */
function spawnMiniExplosion(x, y) {
  const particle = {
    x: x - CONFIG.globalCellSize,  // Center (30px offset for 2×2 grid)
    y: y - CONFIG.globalCellSize,
    vx: 0,  // No movement (static flash)
    vy: 0,
    alpha: 255,
    width: 0,   // Will be calculated
    height: 0,  // Will be calculated
    dead: false,
    lifetime: 20,  // 20 frames = 0.33 seconds (quick but visible)

    // 2×2 grid with BLINKER pattern (oscillates for visual effect)
    gol: new GoLEngine(2, 2, CONFIG.loopUpdateRate),
    gradient: GRADIENT_PRESETS.EXPLOSION
  }

  // Vertical blinker in 2×2 grid (will oscillate horizontally)
  particle.gol.setPattern(Patterns.BLINKER, 0, 0)

  // Calculate dimensions after pattern applied
  const dims = calculateEntityDimensions(particle)
  particle.width = dims.width   // 60px (2 cells × 30px)
  particle.height = dims.height // 60px

  particles.push(particle)
}

// ============================================
// INPUT HANDLING
// ============================================
function keyPressed() {
  if ((key === ' ' || key === 'n' || key === 'N') && state.phase === 'GAMEOVER') {
    // Only allow restart in standalone mode
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
  // Recalculate canvas size
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height
  updateConfigScale()
  resizeCanvas(canvasWidth, canvasHeight)

  // No need to modify entity values - scaling happens in rendering
}

// Make functions global for p5.js
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized

