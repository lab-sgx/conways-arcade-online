/**
 * GAME TEMPLATE - Use this as starting point for new games
 *
 * This template demonstrates the standard pattern for all GoL Arcade games.
 * Copy this file and modify the marked sections to create your game.
 *
 * FEATURES:
 * - Portrait 1200×1920 resolution (installation target)
 * - Responsive canvas with scaleFactor
 * - postMessage integration for installation mode
 * - Game Over with particle delay pattern
 * - Uses helper functions (GoLHelpers, ParticleHelpers, UIHelpers)
 * - Standardized entity sizes (scaled 3x: 180×180 for main entities)
 * - Animated gradient rendering
 * - LLM-friendly structure
 *
 * CRITICAL: p5.js GLOBAL MODE
 * - This framework uses p5.js global mode (NOT instance mode)
 * - NEVER use 'this' or 'p5.' prefix for p5.js functions
 * - Use fill(), rect(), random() directly
 * - Helper functions do NOT receive 'this' parameter
 * - EXCEPTION: SimpleGradientRenderer constructor needs 'this'
 *
 * @author Game of Life Arcade
 * @license ISC
 */

// ============================================
// IMPORTS - Standard imports for all games
// ============================================
import { GoLEngine } from '../src/core/GoLEngine.js'
import { SimpleGradientRenderer } from '../src/rendering/SimpleGradientRenderer.js'
import { GRADIENT_PRESETS } from '../src/utils/GradientPresets.js'
import { Collision } from '../src/utils/Collision.js'
import { Patterns } from '../src/utils/Patterns.js'
import { seedRadialDensity, applyLifeForce, maintainDensity } from '../src/utils/GoLHelpers.js'
import { updateParticles, renderParticles } from '../src/utils/ParticleHelpers.js'
import { renderGameUI, renderGameOver } from '../src/utils/UIHelpers.js'

// ============================================
// GAME CONFIGURATION - BASE REFERENCE (Portrait 1200×1920)
// All values are proportional to 1200×1920 reference resolution
// ============================================
const BASE_WIDTH = 1200
const BASE_HEIGHT = 1920
const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT  // 0.625 (10:16 portrait)

const CONFIG = {
  width: 1200,   // Will be updated dynamically
  height: 1920,  // Will be updated dynamically

  // Standard UI config (DO NOT MODIFY)
  ui: {
    backgroundColor: '#FFFFFF',
    textColor: '#5f6368',
    accentColor: '#1a73e8',
    font: 'Google Sans Flex, Arial, sans-serif',
    fontSize: 16
  },

  // Game-specific config (CUSTOMIZE THIS)
  player: {
    width: 180,        // Standard: 180×180 for main entities (scaled 3x from 60×60)
    height: 180,
    cellSize: 30,      // Standard: cellSize 30 (scaled 3x from 10)
    speed: 18          // Standard: 18 (scaled 3x from 6)
  }

  // Add your game-specific config here
  // enemy: { width: 180, height: 180, cellSize: 30, ... },
  // projectile: { width: 90, height: 90, cellSize: 30, ... },
}

// Store scale factor for rendering (don't modify CONFIG values)
let scaleFactor = 1
let canvasWidth = BASE_WIDTH
let canvasHeight = BASE_HEIGHT

// ============================================
// GAME OVER CONFIGURATION
// ============================================
const GAMEOVER_CONFIG = {
  MIN_DELAY: 30,   // 0.5s minimum feedback (30 frames at 60fps)
  MAX_WAIT: 150    // 2.5s maximum wait (150 frames)
}

// ============================================
// GAME STATE - Customize for your game
// ============================================
const state = {
  score: 0,
  lives: 1,           // Standard: 1 life
  phase: 'PLAYING',   // PLAYING | DYING | GAMEOVER | WIN
  frameCount: 0,
  dyingTimer: 0       // Frames since entered DYING phase

  // Add game-specific state here
  // level: 1,
  // difficulty: 1,
}

// ============================================
// ENTITIES - Define your game entities
// ============================================
let player = null
let enemies = []
let projectiles = []
let particles = []

// Gradient renderer (DO NOT MODIFY)
let maskedRenderer = null

// ============================================
// RESPONSIVE SIZING FUNCTIONS
// ============================================

/**
 * Calculate responsive canvas size maintaining aspect ratio
 */
function calculateResponsiveSize() {
  const windowAspect = windowWidth / windowHeight

  if (windowAspect > ASPECT_RATIO) {
    // Window is wider than canvas aspect - fit to height
    return {
      height: windowHeight,
      width: windowHeight * ASPECT_RATIO
    }
  } else {
    // Window is taller than canvas aspect - fit to width
    return {
      width: windowWidth,
      height: windowWidth / ASPECT_RATIO
    }
  }
}

/**
 * Update scale factor based on current canvas size
 */
function updateConfigScale() {
  // Only update scaleFactor based on canvas size, don't modify CONFIG values
  scaleFactor = canvasHeight / BASE_HEIGHT
}

// ============================================
// p5.js SETUP - Standard setup with responsive canvas
// ============================================
function setup() {
  // Calculate responsive size
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height

  // Update scale factor
  updateConfigScale()

  // Create canvas
  createCanvas(canvasWidth, canvasHeight)
  frameRate(60)

  // Create renderer (EXCEPTION: needs 'this' parameter)
  maskedRenderer = new SimpleGradientRenderer(this)

  // Initialize game
  initGame()
}

function initGame() {
  state.score = 0
  state.lives = 1
  state.phase = 'PLAYING'
  state.frameCount = 0
  state.dyingTimer = 0

  // Initialize your entities
  setupPlayer()
  // setupEnemies()

  enemies = []
  projectiles = []
  particles = []
}

// ============================================
// ENTITY SETUP - Create your entities with GoL
// ============================================

/**
 * STANDARD SIZES AND CONFIGURATIONS (Portrait 1200×1920):
 *
 * Player/Main entities: 180×180, cellSize 30, GoLEngine(6, 6, 12)
 * Enemies/Bricks: 180×180, cellSize 30, GoLEngine(6, 6, 15)
 * Bullets/Projectiles: 90×90, cellSize 30, GoLEngine(3, 3, 0 or 15)
 * Explosions: 90×90 or 180×180, cellSize 30, GoLEngine(3-6, 3-6, 30)
 *
 * GRADIENTS: Use GRADIENT_PRESETS
 * - GRADIENT_PRESETS.PLAYER (blue)
 * - GRADIENT_PRESETS.ENEMY_HOT (red-orange)
 * - GRADIENT_PRESETS.ENEMY_COLD (blue-purple)
 * - GRADIENT_PRESETS.ENEMY_RAINBOW (multi-color)
 * - GRADIENT_PRESETS.BULLET (yellow)
 * - GRADIENT_PRESETS.EXPLOSION (red-yellow)
 */

function setupPlayer() {
  player = {
    x: CONFIG.width / 2,
    y: CONFIG.height - 300,
    width: CONFIG.player.width,
    height: CONFIG.player.height,
    cellSize: CONFIG.player.cellSize,

    // GoL engine - Standard: 6×6 grid at 12fps for player
    gol: new GoLEngine(6, 6, 12),

    // Gradient - Choose from GRADIENT_PRESETS
    gradient: GRADIENT_PRESETS.PLAYER
  }

  // Seed with radial density - Standard pattern
  seedRadialDensity(player.gol, 0.85, 0.0)

  // Optional: Add accent pattern for visual interest
  player.gol.setPattern(Patterns.BLINKER, 2, 2)
}

// ============================================
// UPDATE LOOP - Main game logic
// ============================================
function draw() {
  state.frameCount++
  background(CONFIG.ui.backgroundColor)

  if (state.phase === 'PLAYING') {
    updateGame()
  } else if (state.phase === 'DYING') {
    // Update particles during death animation
    state.dyingTimer++
    particles = updateParticles(particles, state.frameCount)

    // Check if we should transition to GAMEOVER
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
  } else if (state.phase === 'GAMEOVER') {
    // Continue updating particles during game over
    particles = updateParticles(particles, state.frameCount)
  }

  renderGame()
  renderUI()
  maskedRenderer.updateAnimation()

  if (state.phase === 'GAMEOVER') {
    // Only show Game Over UI in standalone mode
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

function updateGame() {
  // Update player
  updatePlayer()

  // Update enemies (example)
  // enemies.forEach(enemy => {
  //   enemy.gol.updateThrottled(state.frameCount)
  //   applyLifeForce(enemy)
  // })

  // Update particles
  particles = updateParticles(particles, state.frameCount)

  // Check collisions
  // checkCollisions()

  // Update score
  state.score++
}

function updatePlayer() {
  // Player movement
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {  // A
    player.x -= CONFIG.player.speed
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {  // D
    player.x += CONFIG.player.speed
  }

  // Clamp to screen
  player.x = Collision.clamp(player.x, 0, CONFIG.width - player.width)

  // Update GoL with life force
  player.gol.updateThrottled(state.frameCount)
  applyLifeForce(player)
}

// ============================================
// RENDERING - Draw all game elements with scaling
// ============================================
function renderGame() {
  // Apply responsive scaling
  push()
  scale(scaleFactor)

  // Render player (hide during DYING/GAMEOVER)
  if (state.phase === 'PLAYING') {
    maskedRenderer.renderMaskedGrid(
      player.gol,
      player.x,
      player.y,
      player.cellSize,
      player.gradient
    )
  }

  // Render enemies (example)
  // enemies.forEach(enemy => {
  //   maskedRenderer.renderMaskedGrid(
  //     enemy.gol,
  //     enemy.x,
  //     enemy.y,
  //     enemy.cellSize,
  //     enemy.gradient
  //   )
  // })

  // Render particles with alpha
  renderParticles(particles, maskedRenderer)

  pop()
}

function renderUI() {
  push()
  scale(scaleFactor)

  renderGameUI(CONFIG, state, [
    '← → or A/D: Move'
    // Add more control instructions here
  ])

  pop()
}

// ============================================
// GAME LOGIC - Your game-specific functions
// ============================================

/**
 * Example: Spawn explosion particles
 */
// function spawnExplosion(x, y) {
//   for (let i = 0; i < 6; i++) {
//     const particle = {
//       x: x + random(-30, 30),
//       y: y + random(-30, 30),
//       vx: random(-9, 9),
//       vy: random(-9, 9),
//       alpha: 255,
//       width: 90,
//       height: 90,
//       gol: new GoLEngine(3, 3, 30),
//       cellSize: 30,
//       gradient: GRADIENT_PRESETS.EXPLOSION,
//       dead: false
//     }
//     seedRadialDensity(particle.gol, 0.8, 0.0)
//     particles.push(particle)
//   }
// }

/**
 * Example: Check collisions and trigger death
 */
// function checkCollisions() {
//   enemies.forEach(enemy => {
//     if (Collision.rectRect(
//       player.x, player.y, player.width, player.height,
//       enemy.x, enemy.y, enemy.width, enemy.height
//     )) {
//       state.phase = 'DYING'
//       state.dyingTimer = 0
//       spawnExplosion(player.x + player.width/2, player.y + player.height/2)
//     }
//   })
// }

// ============================================
// INPUT HANDLING
// ============================================
function keyPressed() {
  if (key === ' ' && state.phase === 'GAMEOVER') {
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
}

// ============================================
// EXPORTS - Make functions available to p5.js
// ============================================
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
