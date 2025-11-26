/**
 * Breakout GOL - Classic brick breaker with Game of Life aesthetic
 *
 * Based on game-template.js
 * Paddle uses Modified GoL with life force
 * Ball uses Visual Only (maintains density)
 * Bricks use various GoL patterns
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
import {
  GAME_DIMENSIONS,
  GAMEOVER_CONFIG,
  createGameState,
  calculateCanvasDimensions,
  createGameConfig
} from '/conways-arcade-online/src/utils/GameBaseConfig.js'
import { initThemeReceiver, getBackgroundColor, getTextColor } from '/conways-arcade-online/src/utils/ThemeReceiver.js'

// ============================================
// CONFIGURATION - Using GameBaseConfig
// ============================================
const CONFIG = createGameConfig({

  paddle: {
    width: 225,   // 75 × 3 = 225 (half of original 450)
    height: 75,   // 25 × 3 = 75
    speed: 30,    // 10 × 3 = 30
    y: 1850
  },

  ball: {
    speed: 18,    // 6 × 3 = 18
    maxAngle: Math.PI / 3
    // Note: radius is calculated dynamically in setupBall() based on GoL grid size
  },

  brick: {
    rows: 3,      // 3 rows for cleaner layout
    cols: 3,      // 3 columns for balanced grid
    width: 240,   // 80 × 3 = 240
    height: 240,  // 80 × 3 = 240
    padding: 60,  // Unified spacing: 60px (same as Space Invaders for visual consistency)
    offsetX: 0,   // Will be calculated dynamically
    offsetY: 200  // Unified starting position with Space Invaders (same as startY)
  }
})

// Store scale factor for rendering (using GameBaseConfig)
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// Brick patterns with gradients
const BRICK_PATTERNS = [
  { name: 'SHIP', scoreValue: 30, gradient: GRADIENT_PRESETS.ENEMY_HOT },
  { name: 'BOAT', scoreValue: 40, gradient: GRADIENT_PRESETS.ENEMY_COLD },
  { name: 'TUB', scoreValue: 50, gradient: GRADIENT_PRESETS.ENEMY_RAINBOW }
]

// ============================================
// GAME STATE (using GameBaseConfig)
// ============================================
const state = createGameState({
  level: 1,
  dyingTimer: 0
})

// ============================================
// ENTITIES
// ============================================
let paddle = null
let ball = null
let bricks = []
let particles = []

// Gradient renderer
let maskedRenderer = null

// Setup completion flag (prevents draw() from running before async setup completes)
let setupComplete = false

// ============================================
// RESPONSIVE CANVAS HELPERS (using GameBaseConfig)
// ============================================
function calculateResponsiveSize() {
  const canvasHeight = windowHeight
  const canvasWidth = canvasHeight * GAME_DIMENSIONS.ASPECT_RATIO
  return { width: canvasWidth, height: canvasHeight }
}

function updateConfigScale() {
  // Only update scaleFactor based on canvas size, don't modify CONFIG values
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

  // Initialize theme receiver
  initThemeReceiver((theme) => {
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
    console.log(`Breakout: Theme changed to ${theme}, background: ${CONFIG.ui.backgroundColor}`)
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

  setupPaddle()
  setupBall()
  setupBricks()
  particles = []
}

function setupPaddle() {
  paddle = {
    x: CONFIG.width / 2 - CONFIG.paddle.width / 2,
    y: CONFIG.paddle.y,
    width: CONFIG.paddle.width,
    height: CONFIG.paddle.height,
    vx: 0,
    gol: new GoLEngine(
      Math.floor(CONFIG.paddle.width / 30),   // 7 cells for 225px width (225/30 = 7.5)
      Math.floor(CONFIG.paddle.height / 30),  // 2 cells for 75px height (75/30 = 2.5)
      12
    ),
    cellSize: 30,  // Scaled to 30px (3x from 10px baseline)
    gradient: GRADIENT_PRESETS.PLAYER
  }

  // Seed with radial density
  seedRadialDensity(paddle.gol, 0.85, 0.0)

  // Add accent pattern (centered in 7 cols)
  paddle.gol.setPattern(Patterns.BLINKER, 3, 0)  // Centered: (7 - 1) / 2 ≈ 3
}

function setupBall() {
  // Ball visual size: 3 cells × 30px = 90px total width/height
  // Ball radius should be half of that: 90 / 2 = 45px
  const ballVisualSize = 3 * 30  // 90px
  const ballVisualRadius = ballVisualSize / 2  // 45px

  ball = {
    x: CONFIG.width / 2,
    y: CONFIG.paddle.y - ballVisualRadius,
    radius: ballVisualRadius,  // FIXED: Use actual visual radius (45px), not CONFIG (120px)
    vx: 0,  // Start purely vertical (KISS fix for horizontal loops)
    vy: -CONFIG.ball.speed,
    stuck: false,  // Ball starts moving
    gol: new GoLEngine(3, 3, 15),  // 3×3 grid maintained
    cellSize: 30,  // Scaled to 30px (3x from 10px baseline)
    gradient: GRADIENT_PRESETS.BULLET
  }

  // Seed with radial density
  seedRadialDensity(ball.gol, 0.9, 0.0)
}

function setupBricks() {
  bricks = []

  // Calculate visual brick size based on GoL grid (not CONFIG.brick.width)
  // GoL grid size: floor(brickWidth / 30) cells × 30px per cell
  const brickGolCols = Math.floor(CONFIG.brick.width / 30)
  const brickGolRows = Math.floor(CONFIG.brick.height / 30)
  const visualBrickWidth = brickGolCols * 30  // Actual rendered width

  // Calculate offsetX to center grid horizontally using VISUAL width
  const totalWidth = CONFIG.brick.cols * visualBrickWidth + (CONFIG.brick.cols - 1) * CONFIG.brick.padding
  CONFIG.brick.offsetX = (CONFIG.width - totalWidth) / 2

  for (let row = 0; row < CONFIG.brick.rows; row++) {
    for (let col = 0; col < CONFIG.brick.cols; col++) {
      // Cycle through gradients
      const patternInfo = BRICK_PATTERNS[row % BRICK_PATTERNS.length]

      const brick = {
        x: CONFIG.brick.offsetX + col * (CONFIG.brick.width + CONFIG.brick.padding),
        y: CONFIG.brick.offsetY + row * (CONFIG.brick.height + CONFIG.brick.padding),
        width: CONFIG.brick.width,
        height: CONFIG.brick.height,
        row: row,
        col: col,
        scoreValue: patternInfo.scoreValue,
        gol: new GoLEngine(
          brickGolCols,  // Dynamic: 8 cells @ 240px, 4 cells @ 130px
          brickGolRows,  // Square grid
          15  // Same evolution speed as Space Invaders
        ),
        cellSize: 30,  // Fixed at 30px for pattern visibility
        gradient: patternInfo.gradient,
        dead: false
      }

      // Apply canonical GoL pattern and freeze (no evolution)
      // Center pattern in available grid space
      const patternOffsetX = Math.max(0, Math.floor((brickGolCols - 4) / 2))  // Patterns are ~3-4 cells wide
      const patternOffsetY = Math.max(0, Math.floor((brickGolRows - 4) / 2))
      brick.gol.setPattern(Patterns[patternInfo.name], patternOffsetX, patternOffsetY)
      brick.gol.freeze()  // Static patterns, no B3/S23 evolution

      bricks.push(brick)
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

  // Update gradient animation
  maskedRenderer.updateAnimation()

  // Only show Game Over screen in standalone mode
  if (state.phase === 'GAMEOVER') {
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

function updateGame() {
  // Update paddle
  updatePaddle()

  // Update ball
  updateBall()

  // Bricks are frozen (static patterns) - no updates needed

  // Update particles (Pure GoL for explosion effect)
  particles = updateParticles(particles, state.frameCount)

  // Check collisions
  checkCollisions()

  // Check level progression - all bricks destroyed
  if (bricks.length === 0 && state.phase === 'PLAYING') {
    nextLevel()
  }

  // Check game over - no lives left
  if (state.lives <= 0 && state.phase !== 'GAMEOVER' && state.phase !== 'DYING') {
    state.phase = 'DYING'
    state.dyingTimer = 0
    // Note: postMessage will be sent after particle animation completes
  }
}

function updatePaddle() {
  // Movement
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {  // A
    paddle.vx = -CONFIG.paddle.speed
  } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {  // D
    paddle.vx = CONFIG.paddle.speed
  } else {
    paddle.vx = 0
  }

  paddle.x += paddle.vx
  paddle.x = Collision.clamp(paddle.x, 0, CONFIG.width - paddle.width)

  // Update GoL (Modified GoL with life force)
  paddle.gol.updateThrottled(state.frameCount)
  applyLifeForce(paddle)
}

function updateBall() {
  if (ball.stuck) {
    // Ball follows paddle when stuck
    ball.x = paddle.x + paddle.width / 2
    ball.y = paddle.y - ball.radius

    // Release on space or N
    if (keyIsDown(32) || keyIsDown(78)) {  // SPACE or N
      ball.stuck = false
      ball.vy = -CONFIG.ball.speed
      ball.vx = CONFIG.ball.speed * (Math.random() > 0.5 ? 1 : -1)
    }
  } else {
    // Normal movement
    ball.x += ball.vx
    ball.y += ball.vy

    // Wall collisions use VISUAL radius
    // ball.radius is now correctly set to actual visual radius (45px = half of 90px grid)
    const wallRadius = ball.radius

    // Wall collisions (in BASE resolution 1200×1920)
    // Left wall (x = 0): collides when ball.x - 45 < 0
    // Right wall (x = 1200): collides when ball.x + 45 > 1200
    if (ball.x - wallRadius < 0 || ball.x + wallRadius > CONFIG.width) {
      ball.vx *= -1
      ball.x = Collision.clamp(ball.x, wallRadius, CONFIG.width - wallRadius)
    }

    // Top wall (y = 0)
    if (ball.y - wallRadius < 0) {
      ball.vy *= -1
      ball.y = wallRadius
    }

    // Bottom edge - lose life (y > 1920)
    if (ball.y - wallRadius > CONFIG.height) {
      state.lives--
      if (state.lives > 0) {
        resetBall()
      }
    }
  }

  // Update GoL (Visual Only - maintain predictable appearance)
  if (state.frameCount % 6 === 0) {
    maintainDensity(ball, 0.7)
  }
}

function resetBall() {
  ball.x = paddle.x + paddle.width / 2
  ball.y = paddle.y - ball.radius  // Use actual ball radius
  ball.vx = 0  // Vertical on reset
  ball.vy = 0
  ball.stuck = true
}

function nextLevel() {
  state.level++

  // PHASE 1: Grid Expansion (Levels 1-11)
  // Increase grid size while reducing brick size and padding to fit screen
  //
  // PHASE 2: Speed Only (Levels 12+)
  // Grid maxed at 8×8 (64 bricks), only increase speed

  const MAX_GRID_LEVEL = 11  // Level where grid stops growing

  let newRows, newCols, brickSize, padding

  if (state.level <= MAX_GRID_LEVEL) {
    // PHASE 1: Progressive grid expansion with dynamic sizing

    // Grid progression: 3×3 → 3×4 → 4×4 → 4×5 → 5×5 → 5×6 → 6×6 → 6×7 → 7×7 → 7×8 → 8×8
    newRows = Math.min(8, 3 + Math.floor((state.level - 1) / 2))
    newCols = Math.min(8, 3 + Math.floor(state.level / 2))

    // Dynamic brick size calculation
    // Start at 240px (level 1-2), reduce progressively to 130px (level 11)
    const sizeReduction = (state.level - 1) * 10  // 0, 10, 20, 30... 100
    brickSize = Math.max(130, 240 - sizeReduction)

    // Dynamic padding calculation
    // Start at 60px, reduce progressively to 20px
    const paddingReduction = (state.level - 1) * 4  // 0, 4, 8, 12... 40
    padding = Math.max(20, 60 - paddingReduction)

    // Fine-tune to ensure grid fits within maxWidth (1200px)
    const maxUsableWidth = 1180  // Leave 20px margin
    let totalWidth = newCols * brickSize + (newCols - 1) * padding

    // If still too wide, reduce brick size further
    while (totalWidth > maxUsableWidth && brickSize > 130) {
      brickSize -= 5
      totalWidth = newCols * brickSize + (newCols - 1) * padding
    }

    // If STILL too wide, reduce padding
    while (totalWidth > maxUsableWidth && padding > 20) {
      padding -= 2
      totalWidth = newCols * brickSize + (newCols - 1) * padding
    }

  } else {
    // PHASE 2: Grid maxed out, only speed increases
    newRows = 8
    newCols = 8
    brickSize = 130
    padding = 20
  }

  // Apply calculated values
  CONFIG.brick.rows = newRows
  CONFIG.brick.cols = newCols
  CONFIG.brick.width = brickSize
  CONFIG.brick.height = brickSize
  CONFIG.brick.padding = padding
  // Note: offsetX is calculated by setupBricks() to avoid duplication

  // Increase ball speed by 10% per level (capped at 2.5x original speed)
  const speedMultiplier = Math.min(2.5, 1 + (state.level - 1) * 0.1)
  const baseSpeed = 18  // Original speed from CONFIG
  CONFIG.ball.speed = baseSpeed * speedMultiplier

  // Rebuild bricks (this will recalculate offsetX) and reset ball
  setupBricks()
  setupBall()
}

function checkCollisions() {
  // Ball coordinates (ball.x, ball.y) represent the CENTER of the ball
  const ballCenterX = ball.x
  const ballCenterY = ball.y
  const ballActualRadius = ball.radius * 0.5  // Use smaller collision radius (half visual size)

  // Ball vs paddle
  if (Collision.circleRect(
    ballCenterX, ballCenterY, ballActualRadius,
    paddle.x, paddle.y, paddle.width, paddle.height
  )) {
    // Bounce ball
    ball.vy = -Math.abs(ball.vy)
    ball.y = paddle.y - ballActualRadius  // Position ball above paddle

    // Angle based on hit position
    const hitPos = (ballCenterX - paddle.x) / paddle.width  // 0 to 1
    const angle = Collision.lerp(-CONFIG.ball.maxAngle, CONFIG.ball.maxAngle, hitPos)

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
    ball.vx = speed * Math.sin(angle)
    ball.vy = -speed * Math.cos(angle)

    // Ensure minimum vertical speed
    if (Math.abs(ball.vy) < CONFIG.ball.speed * 0.5) {
      ball.vy = -CONFIG.ball.speed * 0.7
    }
  }

  // Ball vs bricks - KISS fix: for loop + break + separation
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i]

    if (Collision.circleRect(
      ballCenterX, ballCenterY, ballActualRadius,
      brick.x, brick.y, brick.width, brick.height
    )) {
      // Determine bounce direction based on hit side
      const brickCenterX = brick.x + brick.width / 2
      const brickCenterY = brick.y + brick.height / 2

      const dx = ballCenterX - brickCenterX
      const dy = ballCenterY - brickCenterY

      if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
        // Hit left or right side
        ball.vx *= -1
        // Separate ball from brick
        if (dx > 0) {
          ball.x = brick.x + brick.width + ballActualRadius
        } else {
          ball.x = brick.x - ballActualRadius
        }
      } else {
        // Hit top or bottom
        ball.vy *= -1
        // Separate ball from brick
        if (dy > 0) {
          ball.y = brick.y + brick.height + ballActualRadius
        } else {
          ball.y = brick.y - ballActualRadius
        }
      }

      // Mark brick as dead
      brick.dead = true
      state.score += brick.scoreValue

      // Spawn explosion
      spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.gradient)

      // Only one brick per frame
      break
    }
  }

  bricks = bricks.filter(b => !b.dead)
}

function spawnExplosion(x, y, brickGradient) {
  for (let i = 0; i < 4; i++) {  // Fewer particles
    const particle = {
      x: x + random(-30, 30),  // -10 to 10 × 3
      y: y + random(-30, 30),
      vx: random(-6, 6),       // -2 to 2 × 3
      vy: random(-6, 6),
      alpha: 255,
      width: 90,   // 30 × 3 = 90 (3 cells × 30 cellSize)
      height: 90,
      gol: new GoLEngine(3, 3, 30),  // 3×3 grid maintained
      cellSize: 30,  // Scaled to 30px (3x from 10px baseline)
      gradient: brickGradient || GRADIENT_PRESETS.EXPLOSION,
      dead: false
    }

    // Seed with radial density
    seedRadialDensity(particle.gol, 0.8, 0.0)

    particles.push(particle)
  }
}

// ============================================
// RENDERING
// ============================================
function renderGame() {
  push()
  scale(scaleFactor)

  // Render paddle with gradient
  maskedRenderer.renderMaskedGrid(
    paddle.gol,
    paddle.x,
    paddle.y,
    paddle.cellSize,
    paddle.gradient
  )

  // Render ball with gradient (hide during DYING, GAMEOVER, and WIN)
  if (state.phase === 'PLAYING') {
    maskedRenderer.renderMaskedGrid(
      ball.gol,
      ball.x - ball.radius,
      ball.y - ball.radius,
      ball.cellSize,
      ball.gradient
    )
  }

  // Render bricks with gradients
  bricks.forEach(brick => {
    maskedRenderer.renderMaskedGrid(
      brick.gol,
      brick.x,
      brick.y,
      brick.cellSize,
      brick.gradient
    )
  })

  // Render particles with gradients and alpha
  renderParticles(particles, maskedRenderer)

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

// Export for p5.js
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
