/**
 * Void Drift - Asteroids with Game of Life aesthetic
 *
 * Classic asteroid shooter with GoL patterns:
 * - Player ship uses GLIDER pattern with p5.js rotate()
 * - Asteroids use still life patterns (LOAF, BOAT, BLOCK)
 * - Inertia-based physics (thrust, drift, no friction)
 * - Screen wrap (teleport to opposite edge)
 * - Classic division: LARGE → 2 MEDIUM → 4 SMALL
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Collision } from '/conways-arcade-online/src/utils/Collision.js'
import { Patterns } from '/conways-arcade-online/src/utils/Patterns.js'
import { seedRadialDensity } from '/conways-arcade-online/src/utils/GoLHelpers.js'
import { updateParticles, renderParticles } from '/conways-arcade-online/src/utils/ParticleHelpers.js'
import { renderGameOver } from '/conways-arcade-online/src/utils/UIHelpers.js'
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
// GAME CONFIGURATION
// ============================================

const CONFIG = createGameConfig({
  globalCellSize: 30,

  player: {
    gridSize: 3,              // GLIDER is 3×3
    rotationSpeed: 0.08,      // Radians per frame
    thrustPower: 0.25,        // Acceleration per frame
    maxSpeed: 10,             // Maximum velocity magnitude
    friction: 0.998,          // Very slight friction (space drift)
    shootCooldown: 12,        // Frames between shots
    invincibilityTime: 120    // Frames of invincibility after respawn
  },

  bullet: {
    gridSize: 1,              // Single cell bullet
    speed: 14,                // Bullet velocity
    lifetime: 90              // Frames before disappearing
  },

  asteroid: {
    sizes: {
      LARGE: {
        gridSize: 6,
        minSpeed: 1.0,
        maxSpeed: 2.5,
        scoreValue: 20,
        patterns: [PatternName.LOAF, PatternName.POND, PatternName.BEEHIVE]
      },
      MEDIUM: {
        gridSize: 4,
        minSpeed: 1.5,
        maxSpeed: 3.5,
        scoreValue: 50,
        patterns: [PatternName.BOAT, PatternName.TUB, PatternName.SHIP]
      },
      SMALL: {
        gridSize: 2,
        minSpeed: 2.5,
        maxSpeed: 4.5,
        scoreValue: 100,
        patterns: [PatternName.BLOCK]
      }
    },
    startCount: 4,            // Initial asteroids per level
    incrementPerLevel: 1,     // Additional asteroids per level
    maxCount: 12              // Maximum asteroids to spawn
  },

  loopUpdateRate: 10
})

// Store scale factor for rendering
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// ============================================
// GAME STATE
// ============================================

const state = createGameState({
  level: 1,
  dyingTimer: 0,
  playerShootCooldown: 0,
  playerInvincibility: 0
})

// ============================================
// ENTITIES
// ============================================

let player = null
let asteroids = []
let bullets = []
let particles = []

// Gradient renderer
let maskedRenderer = null

// Theme state (for bullet color)
let currentTheme = 'day'

// Setup completion flag
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
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT
}

// ============================================
// p5.js SETUP
// ============================================

async function setup() {
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height
  updateConfigScale()

  createCanvas(canvasWidth, canvasHeight)
  frameRate(60)

  // CSS fade-in: Start invisible, fade in after warmup
  const canvas = document.querySelector('canvas')
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 300ms ease-in'

  maskedRenderer = new VideoGradientRenderer(this)

  initThemeReceiver((theme) => {
    currentTheme = theme  // Track theme for bullet color
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
    console.log(`Void Drift: Theme changed to ${theme}`)
  })

  // Warmup shaders (bullets no longer use gradients - simple rect)
  await maskedRenderer.warmupShaders([
    GRADIENT_PRESETS.PLAYER,
    GRADIENT_PRESETS.ENEMY_COLD,
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
  state.playerShootCooldown = 0
  state.playerInvincibility = CONFIG.player.invincibilityTime

  asteroids = []
  bullets = []
  particles = []

  setupPlayer()
  spawnAsteroidsForLevel()
}

// ============================================
// PLAYER SETUP
// ============================================

function setupPlayer() {
  // Create GLIDER pattern renderer
  const renderer = createPatternRenderer({
    mode: RenderMode.STATIC,
    pattern: PatternName.GLIDER,
    globalCellSize: CONFIG.globalCellSize
  })

  // Use renderer dimensions (includes padding for proper centering)
  const width = renderer.dimensions.width
  const height = renderer.dimensions.height
  const cellSize = CONFIG.globalCellSize
  const gol = renderer.gol

  // Calculate centroid of alive cells for proper rotation pivot
  // GLIDER is asymmetric, so grid center != visual center
  let sumX = 0, sumY = 0, count = 0

  for (let x = 0; x < gol.cols; x++) {
    for (let y = 0; y < gol.rows; y++) {
      if (gol.current[x][y] === 1) {
        // Center of each alive cell in pixels
        sumX += x * cellSize + cellSize / 2
        sumY += y * cellSize + cellSize / 2
        count++
      }
    }
  }

  // Calculate offset to center alive cells at rotation origin
  const centroidX = count > 0 ? sumX / count : width / 2
  const centroidY = count > 0 ? sumY / count : height / 2

  player = {
    x: CONFIG.width / 2,
    y: CONFIG.height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,  // Pointing up initially
    width: width,
    height: height,
    // Render offset: position grid so centroid is at origin (0,0)
    renderOffsetX: -centroidX,
    renderOffsetY: -centroidY,
    gol: gol,
    gradient: GRADIENT_PRESETS.PLAYER,
    dead: false
  }
}

// ============================================
// ASTEROID SYSTEM
// ============================================

function createAsteroid(x, y, size, vx = null, vy = null) {
  const sizeConfig = CONFIG.asteroid.sizes[size]
  const speed = random(sizeConfig.minSpeed, sizeConfig.maxSpeed)
  const angle = random(TWO_PI)

  // Select random pattern from size category
  const patternName = sizeConfig.patterns[Math.floor(random(sizeConfig.patterns.length))]

  const renderer = createPatternRenderer({
    mode: RenderMode.STATIC,
    pattern: patternName,
    globalCellSize: CONFIG.globalCellSize
  })

  const visualSize = sizeConfig.gridSize * CONFIG.globalCellSize

  return {
    x: x,
    y: y,
    vx: vx !== null ? vx : Math.cos(angle) * speed,
    vy: vy !== null ? vy : Math.sin(angle) * speed,
    size: size,
    width: visualSize,
    height: visualSize,
    radius: visualSize / 2 * 0.8,  // Hitbox slightly smaller than visual
    scoreValue: sizeConfig.scoreValue,
    gol: renderer.gol,
    gradient: GRADIENT_PRESETS.ENEMY_COLD,
    dead: false
  }
}

function spawnAsteroidsForLevel() {
  const count = Math.min(
    CONFIG.asteroid.startCount + (state.level - 1) * CONFIG.asteroid.incrementPerLevel,
    CONFIG.asteroid.maxCount
  )

  // Calculate spawn offset based on LARGE asteroid size (spawns completely off-screen)
  const largeSize = CONFIG.asteroid.sizes.LARGE.gridSize * CONFIG.globalCellSize

  for (let i = 0; i < count; i++) {
    // Spawn outside edges (asteroid center is off-screen by its radius)
    let x, y
    const edge = Math.floor(random(4))

    switch (edge) {
      case 0: // Top - spawn above screen
        x = random(CONFIG.width)
        y = -largeSize / 2
        break
      case 1: // Right - spawn right of screen
        x = CONFIG.width + largeSize / 2
        y = random(CONFIG.height)
        break
      case 2: // Bottom - spawn below screen
        x = random(CONFIG.width)
        y = CONFIG.height + largeSize / 2
        break
      case 3: // Left - spawn left of screen
        x = -largeSize / 2
        y = random(CONFIG.height)
        break
    }

    asteroids.push(createAsteroid(x, y, 'LARGE'))
  }
}

function destroyAsteroid(asteroid) {
  asteroid.dead = true
  state.score += asteroid.scoreValue
  spawnExplosion(asteroid.x, asteroid.y, asteroid.gradient)

  // Division logic: LARGE splits once into MEDIUM, then no more splits
  if (asteroid.size === 'LARGE') {
    spawnChildAsteroids(asteroid, 'MEDIUM', 2)
  }
  // MEDIUM and SMALL don't spawn children (simplified difficulty)
}

function spawnChildAsteroids(parent, childSize, count) {
  const sizeConfig = CONFIG.asteroid.sizes[childSize]

  for (let i = 0; i < count; i++) {
    // Divergent velocities (perpendicular to parent)
    const parentAngle = Math.atan2(parent.vy, parent.vx)
    const offset = (i === 0 ? 1 : -1) * (Math.PI / 3 + random(-0.3, 0.3))
    const childAngle = parentAngle + offset

    const speed = random(sizeConfig.minSpeed, sizeConfig.maxSpeed)

    asteroids.push(createAsteroid(
      parent.x,
      parent.y,
      childSize,
      Math.cos(childAngle) * speed,
      Math.sin(childAngle) * speed
    ))
  }
}

// ============================================
// BULLET SYSTEM
// ============================================

function shootBullet() {
  if (state.playerShootCooldown > 0) return

  // Use 1x1 grid size for bullet dimensions (single BLOCK cell)
  const bulletGridSize = 1
  const bulletSize = bulletGridSize * CONFIG.globalCellSize

  // Bullet spawns at nose of ship
  const noseDistance = player.width / 2 + bulletSize / 2
  const bulletX = player.x + Math.cos(player.angle) * noseDistance
  const bulletY = player.y + Math.sin(player.angle) * noseDistance

  const bullet = {
    x: bulletX,
    y: bulletY,
    vx: Math.cos(player.angle) * CONFIG.bullet.speed + player.vx * 0.5,
    vy: Math.sin(player.angle) * CONFIG.bullet.speed + player.vy * 0.5,
    width: bulletSize,
    height: bulletSize,
    lifetime: CONFIG.bullet.lifetime,
    dead: false
  }

  bullets.push(bullet)
  state.playerShootCooldown = CONFIG.player.shootCooldown
}

// ============================================
// SCREEN WRAP
// ============================================

function wrapPosition(entity) {
  // Use entity radius or calculate from width (entity must fully exit before reappearing)
  const radius = entity.radius || (entity.width / 2) || 0

  // Horizontal wrap (entity must fully disappear before reappearing on opposite side)
  if (entity.x + radius < 0) {
    // Fully exited left → reappear fully outside right
    entity.x = CONFIG.width + radius
  } else if (entity.x - radius > CONFIG.width) {
    // Fully exited right → reappear fully outside left
    entity.x = -radius
  }

  // Vertical wrap
  if (entity.y + radius < 0) {
    // Fully exited top → reappear fully outside bottom
    entity.y = CONFIG.height + radius
  } else if (entity.y - radius > CONFIG.height) {
    // Fully exited bottom → reappear fully outside top
    entity.y = -radius
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
    state.dyingTimer++
    particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)

    const minDelayPassed = state.dyingTimer >= GAMEOVER_CONFIG.MIN_DELAY
    const particlesDone = particles.length === 0
    const maxWaitReached = state.dyingTimer >= GAMEOVER_CONFIG.MAX_WAIT

    if ((particlesDone && minDelayPassed) || maxWaitReached) {
      state.phase = 'GAMEOVER'

      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'gameOver',
          payload: { score: state.score }
        }, '*')
      }
    }
  }

  renderGame()

  // Update score display
  const scoreElement = document.getElementById('score-value')
  if (scoreElement) {
    scoreElement.textContent = state.score
  }

  maskedRenderer.updateAnimation()

  if (state.phase === 'GAMEOVER') {
    if (window.parent === window) {
      renderGameOver(width, height, state.score)
    }
  }
}

function updateGame() {
  updatePlayer()
  updateAsteroids()
  updateBullets()
  particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)
  checkCollisions()
  checkLevelComplete()
}

function updatePlayer() {
  // Rotation
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    player.angle -= CONFIG.player.rotationSpeed
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    player.angle += CONFIG.player.rotationSpeed
  }

  // Thrust
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    player.vx += Math.cos(player.angle) * CONFIG.player.thrustPower
    player.vy += Math.sin(player.angle) * CONFIG.player.thrustPower
  }

  // Limit max speed
  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)
  if (speed > CONFIG.player.maxSpeed) {
    player.vx = (player.vx / speed) * CONFIG.player.maxSpeed
    player.vy = (player.vy / speed) * CONFIG.player.maxSpeed
  }

  // Apply very slight friction
  player.vx *= CONFIG.player.friction
  player.vy *= CONFIG.player.friction

  // Move
  player.x += player.vx
  player.y += player.vy

  // Screen wrap
  wrapPosition(player)

  // Shooting
  if (keyIsDown(32) || keyIsDown(90) || keyIsDown(78)) {  // SPACE, Z, or N
    shootBullet()
  }

  // Cooldowns
  if (state.playerShootCooldown > 0) {
    state.playerShootCooldown--
  }

  if (state.playerInvincibility > 0) {
    state.playerInvincibility--
  }
}

function updateAsteroids() {
  asteroids.forEach(asteroid => {
    asteroid.x += asteroid.vx
    asteroid.y += asteroid.vy
    wrapPosition(asteroid)
  })
}

function updateBullets() {
  bullets.forEach(bullet => {
    bullet.x += bullet.vx
    bullet.y += bullet.vy
    wrapPosition(bullet)

    bullet.lifetime--
    if (bullet.lifetime <= 0) {
      bullet.dead = true
    }
  })

  bullets = bullets.filter(b => !b.dead)
}

// ============================================
// COLLISIONS
// ============================================

function checkCollisions() {
  // Bullets vs Asteroids
  bullets.forEach(bullet => {
    asteroids.forEach(asteroid => {
      if (!bullet.dead && !asteroid.dead) {
        const bulletRadius = bullet.width / 2
        if (Collision.circleCircle(
          bullet.x, bullet.y, bulletRadius,
          asteroid.x, asteroid.y, asteroid.radius
        )) {
          bullet.dead = true
          destroyAsteroid(asteroid)
        }
      }
    })
  })

  // Player vs Asteroids (only if not invincible)
  if (state.playerInvincibility <= 0) {
    asteroids.forEach(asteroid => {
      if (!asteroid.dead && state.phase === 'PLAYING') {
        const playerRadius = player.width / 2 * 0.6  // Smaller hitbox for fairness

        if (Collision.circleCircle(
          player.x, player.y, playerRadius,
          asteroid.x, asteroid.y, asteroid.radius
        )) {
          destroyPlayer()
        }
      }
    })
  }

  // Cleanup dead asteroids
  asteroids = asteroids.filter(a => !a.dead)
}

function checkLevelComplete() {
  if (asteroids.length === 0 && state.phase === 'PLAYING') {
    state.level++
    spawnAsteroidsForLevel()
  }
}

// ============================================
// PLAYER DEATH
// ============================================

function destroyPlayer() {
  spawnPlayerExplosion()
  state.lives = 0
  player.dead = true
  state.phase = 'DYING'
  state.dyingTimer = 0
}

function spawnPlayerExplosion() {
  const particleCount = 10

  for (let i = 0; i < particleCount; i++) {
    const particle = {
      x: player.x + random(-30, 30),
      y: player.y + random(-30, 30),
      vx: random(-5, 5),
      vy: random(-5, 5),
      alpha: 255,
      width: 90,
      height: 90,
      gol: new GoLEngine(3, 3, CONFIG.loopUpdateRate),
      gradient: GRADIENT_PRESETS.EXPLOSION,
      dead: false
    }

    seedRadialDensity(particle.gol, 0.8, 0.0)
    particle.gol.setPattern(Patterns.BLINKER, 0, 0)

    particles.push(particle)
  }
}

function spawnExplosion(x, y, gradient) {
  const particleCount = 4

  for (let i = 0; i < particleCount; i++) {
    const particle = {
      x: x + random(-20, 20),
      y: y + random(-20, 20),
      vx: random(-4, 4),
      vy: random(-4, 4),
      alpha: 255,
      width: 60,
      height: 60,
      gol: new GoLEngine(2, 2, CONFIG.loopUpdateRate),
      gradient: gradient || GRADIENT_PRESETS.EXPLOSION,
      dead: false
    }

    seedRadialDensity(particle.gol, 0.9, 0.0)

    particles.push(particle)
  }
}

// ============================================
// RENDERING
// ============================================

function renderGame() {
  push()
  scale(scaleFactor)

  // Render player (with rotation)
  if (player && !player.dead && state.phase === 'PLAYING') {
    push()
    translate(player.x, player.y)
    // Rotate to face direction (+90° because GLIDER points right by default)
    rotate(player.angle + Math.PI / 2)

    // Blinking effect during invincibility
    if (state.playerInvincibility <= 0 || state.frameCount % 10 < 5) {
      maskedRenderer.renderMaskedGrid(
        player.gol,
        player.renderOffsetX,
        player.renderOffsetY,
        CONFIG.globalCellSize,
        player.gradient
      )
    }
    pop()

    // Render thrust particles when accelerating
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
      renderThrustEffect()
    }
  }

  // Render asteroids
  asteroids.forEach(asteroid => {
    maskedRenderer.renderMaskedGrid(
      asteroid.gol,
      asteroid.x - asteroid.width / 2,
      asteroid.y - asteroid.height / 2,
      CONFIG.globalCellSize,
      asteroid.gradient
    )
  })

  // Render bullets (theme-aware: black in day, white in night)
  fill(currentTheme === 'night' ? 255 : 0)
  noStroke()
  bullets.forEach(bullet => {
    rect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height)
  })

  // Render particles
  renderParticles(particles, maskedRenderer, CONFIG.globalCellSize)

  pop()
}

/**
 * Render thrust effect behind player ship
 */
function renderThrustEffect() {
  // Calculate position behind ship
  const thrustDistance = player.width / 2 + 15
  const thrustX = player.x - Math.cos(player.angle) * thrustDistance
  const thrustY = player.y - Math.sin(player.angle) * thrustDistance

  // Simple flickering rectangle effect
  if (state.frameCount % 4 < 2) {
    push()
    translate(thrustX, thrustY)
    rotate(player.angle + Math.PI / 2)
    fill(255, 200, 50, 200)  // Orange-yellow
    noStroke()
    rect(-10, -5, 20, 10)
    pop()
  }
}

// ============================================
// INPUT HANDLING
// ============================================

function keyPressed() {
  if ((key === ' ' || key === 'n' || key === 'N') && state.phase === 'GAMEOVER') {
    if (window.parent === window) {
      initGame()
    }
  }
}

// ============================================
// WINDOW RESIZE
// ============================================

function windowResized() {
  const size = calculateResponsiveSize()
  canvasWidth = size.width
  canvasHeight = size.height
  updateConfigScale()
  resizeCanvas(canvasWidth, canvasHeight)
}

// Export for p5.js
window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
