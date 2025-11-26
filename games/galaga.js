/**
 * Cellship Strike - Endless Vertical Shooter with Game of Life aesthetic
 *
 * - Enemies spawn from top and descend
 * - Player moves freely in 2D (WASD/arrows)
 * - 3 enemy types: BLINKER (fast), BEACON (medium), GLIDER (slow)
 * - Game over when enemy touches player
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { GoLEngine } from '/conways-arcade-online/src/core/GoLEngine.js'
import { VideoGradientRenderer } from '/conways-arcade-online/src/rendering/VideoGradientRenderer.js'
import { GRADIENT_PRESETS } from '/conways-arcade-online/src/utils/GradientPresets.js'
import { Collision } from '/conways-arcade-online/src/utils/Collision.js'
import { Patterns } from '/conways-arcade-online/src/utils/Patterns.js'
import { seedRadialDensity, maintainDensity } from '/conways-arcade-online/src/utils/GoLHelpers.js'
import { updateParticles, renderParticles } from '/conways-arcade-online/src/utils/ParticleHelpers.js'
import { renderGameOver } from '/conways-arcade-online/src/utils/UIHelpers.js'
import { initHitboxDebug, drawHitboxRect } from '/conways-arcade-online/src/debug/HitboxDebug.js'
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
    speed: 12,
    shootCooldown: 20,      // Slower shooting (was 10) - more challenging
    // Fixed hitbox (Solución C): COPPERHEAD usa grid padded 1.4x
    // offsetX/offsetY: 0 = centrado automático, valor > 0 = offset manual
    fixedHitbox: { width: 200, height: 300, offsetX: 70, offsetY: 30 }
  },

  bullet: {
    speed: 16               // Slightly slower bullets
  },

  spawn: {
    intervalStart: 60,      // Frames between spawns (1 sec at 60fps) - balanced for larger player
    intervalMin: 30,        // Minimum interval (0.5 sec)
    intervalDecrement: 2,   // Decrease every 200 points
    scoreThreshold: 200,    // Points needed to increase difficulty
    multiSpawnChance: 0.15, // 15% chance to spawn 2 enemies at once
    multiSpawnChanceMax: 0.3 // Max 30% chance at high difficulty
  },

  stars: {
    count: 80,              // Number of stars
    speedMin: 2,            // Minimum star speed
    speedMax: 8,            // Maximum star speed
    sizeMin: 2,             // Minimum star size
    sizeMax: 6              // Maximum star size
  },

  enemy: {
    small: {
      pattern: PatternName.BLINKER,
      speed: 12,              // Fast (was 8)
      scoreValue: 10,
      gradient: GRADIENT_PRESETS.ENEMY_HOT,
      weight: 45              // Slightly less common
    },
    medium: {
      pattern: PatternName.BEACON,
      speed: 9,               // Medium (was 5)
      scoreValue: 30,
      gradient: GRADIENT_PRESETS.ENEMY_COLD,
      weight: 35
    },
    large: {
      pattern: PatternName.GLIDER,
      speed: 6,               // Slow but still threatening (was 3)
      scoreValue: 50,
      gradient: GRADIENT_PRESETS.ENEMY_RAINBOW,
      weight: 20              // More large enemies
    }
  },

  boss: {
    pulsar: {
      pattern: PatternName.PULSAR,
      hp: 2,                    // 2 hits to kill
      scoreValue: 100,          // 100 points reward
      gradient: GRADIENT_PRESETS.ENEMY_RAINBOW,
      // Fixed hitbox (Solución C): separar visual de lógica
      // PULSAR oscila ~13x13 celdas = ~390px, hitbox 80%
      // offsetX/offsetY: 0 = centrado automático, o valor manual
      fixedHitbox: { width: 320, height: 320, offsetX: 0, offsetY: 0 }
    },
    dragon: {
      pattern: PatternName.DRAGON_VERTICAL,
      hp: 4,                    // 4 hits to kill (tougher)
      scoreValue: 200,          // 200 points reward
      gradient: GRADIENT_PRESETS.ENEMY_HOT,
      // Fixed hitbox: DRAGON es vertical, patrón asimétrico
      // Offsets manuales para centrar en el sprite visual
      fixedHitbox: { width: 500, height: 450, offsetX: 250, offsetY: 250 }
    },
    // Shared boss settings
    speed: 3,                   // Slow horizontal movement
    shootInterval: 60,          // Shoot every 1 second
    bulletSpeed: 10,            // Boss bullet speed
    bulletSpread: 0.3,          // Fan spread angle (radians)
    yPosition: 200              // Fixed Y position (near top)
  },

  loopUpdateRate: 10,

  hitbox: {
    player: { min: 60, max: 300, default: 90 },
    enemies: { min: 45, max: 150, default: 60 },
    boss: { min: 100, max: 600, default: 200 },
    bullets: { min: 30, max: 60, default: 45 }
  }
})

// Scale factor for rendering
let { scaleFactor, canvasWidth, canvasHeight } = calculateCanvasDimensions()

// ============================================
// GAME STATE
// ============================================

const state = createGameState({
  spawnTimer: 0,
  currentSpawnInterval: CONFIG.spawn.intervalStart,
  difficultyLevel: 1,
  playerShootCooldown: 0,
  dyingTimer: 0,
  lastBossScore: 0,          // Track when last boss spawned
  bossShootTimer: 0          // Boss shooting cooldown
})

// ============================================
// ENTITIES
// ============================================

let player = null
let enemies = []
let bullets = []
let particles = []
let stars = []
let boss = null              // Current boss (only 1 at a time)
let bossBullets = []         // Boss projectiles

// Theme state (for star color)
let currentTheme = 'day'

let maskedRenderer = null

// Setup completion flag (prevents draw() from running before async setup completes)
let setupComplete = false

// ============================================
// HELPERS
// ============================================

function calculateResponsiveSize() {
  const canvasHeight = windowHeight
  const canvasWidth = canvasHeight * GAME_DIMENSIONS.ASPECT_RATIO
  return { width: canvasWidth, height: canvasHeight }
}

function updateConfigScale() {
  scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT
}

function calculateClampedHitbox(spriteWidth, spriteHeight, entityType) {
  const limits = CONFIG.hitbox[entityType]
  // Scale hitbox to 70% of sprite size, clamped to limits
  const hitboxWidth = Math.max(limits.min, Math.min(limits.max, spriteWidth * 0.7))
  const hitboxHeight = Math.max(limits.min, Math.min(limits.max, spriteHeight * 0.7))
  return {
    width: hitboxWidth,
    height: hitboxHeight,
    offsetX: (spriteWidth - hitboxWidth) / 2,
    offsetY: (spriteHeight - hitboxHeight) / 2
  }
}

// ============================================
// STARS (Background parallax effect)
// ============================================

function initStars() {
  stars = []
  for (let i = 0; i < CONFIG.stars.count; i++) {
    stars.push(createStar(true))
  }
}

function createStar(randomY = false) {
  const speed = CONFIG.stars.speedMin + Math.random() * (CONFIG.stars.speedMax - CONFIG.stars.speedMin)
  // Faster stars are smaller and dimmer (parallax depth effect)
  const depthFactor = (speed - CONFIG.stars.speedMin) / (CONFIG.stars.speedMax - CONFIG.stars.speedMin)
  const size = CONFIG.stars.sizeMax - depthFactor * (CONFIG.stars.sizeMax - CONFIG.stars.sizeMin)
  const brightness = 100 + (1 - depthFactor) * 155  // 100-255

  return {
    x: Math.random() * CONFIG.width,
    y: randomY ? Math.random() * CONFIG.height : -10,
    speed: speed,
    size: size,
    brightness: brightness
  }
}

function updateStars() {
  stars.forEach(star => {
    star.y += star.speed

    // Wrap around when off screen
    if (star.y > CONFIG.height + 10) {
      star.x = Math.random() * CONFIG.width
      star.y = -10
      // Randomize speed for variety
      const speed = CONFIG.stars.speedMin + Math.random() * (CONFIG.stars.speedMax - CONFIG.stars.speedMin)
      const depthFactor = (speed - CONFIG.stars.speedMin) / (CONFIG.stars.speedMax - CONFIG.stars.speedMin)
      star.speed = speed
      star.size = CONFIG.stars.sizeMax - depthFactor * (CONFIG.stars.sizeMax - CONFIG.stars.sizeMin)
      star.brightness = 100 + (1 - depthFactor) * 155
    }
  })
}

function renderStars() {
  noStroke()
  stars.forEach(star => {
    // Theme-aware star colors (like enemy bullets in space-invaders.js)
    // Day mode: dark stars (0-155) on white background
    // Night mode: bright stars (100-255) on dark background
    if (currentTheme === 'night') {
      fill(star.brightness)  // 100-255 (bright)
    } else {
      fill(255 - star.brightness)  // 0-155 (dark)
    }
    square(star.x, star.y, star.size)
  })
}

// ============================================
// SETUP
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
    currentTheme = theme  // Track theme for star color
    CONFIG.ui.backgroundColor = getBackgroundColor(theme)
    CONFIG.ui.score.color = getTextColor(theme)
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

  // Initialize hitbox debug system (press H to toggle)
  initHitboxDebug()

  // Mark setup as complete and trigger fade-in
  setupComplete = true
  document.querySelector('canvas').style.opacity = '1'
}

function initGame() {
  state.score = 0
  state.lives = 1
  state.phase = 'PLAYING'
  state.frameCount = 0
  state.spawnTimer = 0
  state.currentSpawnInterval = CONFIG.spawn.intervalStart
  state.difficultyLevel = 1
  state.playerShootCooldown = 0
  state.lastBossScore = 0
  state.bossShootTimer = 0

  enemies = []
  bullets = []
  particles = []
  boss = null
  bossBullets = []

  initStars()
  setupPlayer()
}

function setupPlayer() {
  // Use STATIC mode as base - we'll handle animation manually
  const renderer = createPatternRenderer({
    mode: RenderMode.STATIC,
    pattern: PatternName.COPPERHEAD,
    phase: 0,
    globalCellSize: CONFIG.globalCellSize
  })

  // Pre-compute all 10 phases of COPPERHEAD for sprite animation
  const period = 10
  const phases = []
  const pattern = Patterns.COPPERHEAD
  const patternHeight = pattern.length
  const patternWidth = pattern[0].length

  // Create padded grid for evolution
  const paddedWidth = Math.ceil(patternWidth * 1.4)
  const paddedHeight = Math.ceil(patternHeight * 1.4)

  for (let p = 0; p < period; p++) {
    // Create temp engine to evolve to this phase
    const tempGol = new GoLEngine(paddedWidth, paddedHeight, 0)
    const centerX = Math.floor((paddedWidth - patternWidth) / 2)
    const centerY = Math.floor((paddedHeight - patternHeight) / 2)
    tempGol.setPattern(pattern, centerX, centerY)

    // Evolve to phase p
    for (let i = 0; i < p; i++) {
      tempGol.update()
    }

    // Store snapshot of this phase
    phases.push(tempGol.getPattern())
  }

  // Solución C: Usar fixedHitbox si está definido (separar visual de lógica)
  // offsetX/offsetY: 0 = centrado automático, valor > 0 = offset manual
  const hitbox = CONFIG.player.fixedHitbox
    ? {
      width: CONFIG.player.fixedHitbox.width,
      height: CONFIG.player.fixedHitbox.height,
      offsetX: CONFIG.player.fixedHitbox.offsetX || (renderer.dimensions.width - CONFIG.player.fixedHitbox.width) / 2,
      offsetY: CONFIG.player.fixedHitbox.offsetY || (renderer.dimensions.height - CONFIG.player.fixedHitbox.height) / 2
    }
    : calculateClampedHitbox(renderer.dimensions.width, renderer.dimensions.height, 'player')

  player = {
    x: CONFIG.width / 2 - renderer.dimensions.width / 2,
    y: CONFIG.height - 300,
    width: renderer.dimensions.width,
    height: renderer.dimensions.height,
    hitbox: hitbox,
    vx: 0,
    vy: 0,
    gol: renderer.gol,
    gradient: GRADIENT_PRESETS.PLAYER,
    // Sprite animation data
    phases: phases,
    currentPhase: 0,
    phaseTimer: 0,
    phaseDelay: Math.floor(60 / CONFIG.loopUpdateRate) // Frames per phase
  }
}

// ============================================
// ENEMY SPAWNING
// ============================================

function selectEnemyType() {
  const types = Object.keys(CONFIG.enemy)
  const weights = types.map(t => CONFIG.enemy[t].weight)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  let random = Math.random() * totalWeight
  for (let i = 0; i < types.length; i++) {
    random -= weights[i]
    if (random <= 0) return types[i]
  }
  return types[0]
}

function spawnEnemy() {
  const type = selectEnemyType()
  const config = CONFIG.enemy[type]

  const renderer = createPatternRenderer({
    mode: RenderMode.LOOP,
    pattern: config.pattern,
    globalCellSize: CONFIG.globalCellSize,
    loopUpdateRate: CONFIG.loopUpdateRate
  })

  const dims = renderer.dimensions
  const hitbox = calculateClampedHitbox(dims.width, dims.height, 'enemies')

  // Random X position (within screen bounds)
  const x = Math.random() * (CONFIG.width - dims.width)

  const enemy = {
    x: x,
    y: -dims.height,  // Start above screen
    width: dims.width,
    height: dims.height,
    hitbox: hitbox,
    vy: config.speed,
    type: type,
    scoreValue: config.scoreValue,
    dead: false,
    gol: renderer.gol,
    gradient: config.gradient
  }

  enemies.push(enemy)
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
    updateStars()  // Keep stars moving during death
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

  const scoreElement = document.getElementById('score-value')
  if (scoreElement) {
    scoreElement.textContent = state.score
  }

  maskedRenderer.updateAnimation()

  if (state.phase === 'GAMEOVER' && window.parent === window) {
    renderGameOver(width, height, state.score)
  }
}

function updateGame() {
  updateStars()
  updatePlayer()
  updateSpawning()
  updateBossSpawning()
  updateEnemies()
  updateBoss()
  updateBullets()
  updateBossBullets()
  particles = updateParticles(particles, state.frameCount, CONFIG.loopUpdateRate)
  checkCollisions()
  updateDifficulty()
}

// ============================================
// PLAYER UPDATE
// ============================================

function updatePlayer() {
  // Reset velocity
  player.vx = 0
  player.vy = 0

  // Horizontal movement
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    player.vx = -CONFIG.player.speed
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    player.vx = CONFIG.player.speed
  }

  // Vertical movement
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    player.vy = -CONFIG.player.speed
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    player.vy = CONFIG.player.speed
  }

  // Apply movement
  player.x += player.vx
  player.y += player.vy

  // Wrap around horizontally (arcade style)
  if (player.x < -player.width) {
    player.x = CONFIG.width
  } else if (player.x > CONFIG.width) {
    player.x = -player.width
  }
  // Clamp vertical bounds only
  player.y = Collision.clamp(player.y, 100, CONFIG.height - player.height)  // 100 = top margin for UI

  // Shooting
  if ((keyIsDown(32) || keyIsDown(90) || keyIsDown(78)) && state.playerShootCooldown === 0) {  // SPACE, Z, or N
    shootBullet()
    state.playerShootCooldown = CONFIG.player.shootCooldown
  }

  if (state.playerShootCooldown > 0) {
    state.playerShootCooldown--
  }

  // Sprite animation - cycle through pre-computed phases (no GoL evolution)
  player.phaseTimer++
  if (player.phaseTimer >= player.phaseDelay) {
    player.phaseTimer = 0
    player.currentPhase = (player.currentPhase + 1) % player.phases.length

    // Copy phase data to gol grid for rendering
    const phase = player.phases[player.currentPhase]
    for (let x = 0; x < player.gol.cols; x++) {
      for (let y = 0; y < player.gol.rows; y++) {
        player.gol.current[x][y] = (phase[x] && phase[x][y]) ? 1 : 0
      }
    }
  }
}

// ============================================
// SPAWNING
// ============================================

function updateSpawning() {
  state.spawnTimer++

  if (state.spawnTimer >= state.currentSpawnInterval) {
    state.spawnTimer = 0
    spawnEnemy()

    // Multi-spawn: chance to spawn additional enemy (increases with difficulty)
    const multiChance = Math.min(
      CONFIG.spawn.multiSpawnChanceMax,
      CONFIG.spawn.multiSpawnChance + (state.difficultyLevel - 1) * 0.05
    )
    if (Math.random() < multiChance) {
      spawnEnemy()  // Spawn second enemy
    }
  }
}

// ============================================
// ENEMIES
// ============================================

function updateEnemies() {
  enemies.forEach(enemy => {
    // Move down
    enemy.y += enemy.vy

    // Update GoL animation
    if (enemy.gol) {
      enemy.gol.updateThrottled(state.frameCount)
    }

    // Remove if off screen (bottom)
    if (enemy.y > CONFIG.height + 50) {
      enemy.dead = true
    }
  })

  enemies = enemies.filter(e => !e.dead)
}

// ============================================
// BOSS SYSTEM
// ============================================

function updateBossSpawning() {
  // Check if we should spawn a boss every 500 points
  // PULSAR: 500, 1500, 2500... (odd multiples of 500)
  // DRAGON: 1000, 2000, 3000... (even multiples of 500)
  const nextBossThreshold = state.lastBossScore + 500

  if (!boss && state.score >= nextBossThreshold) {
    const bossNumber = Math.floor(nextBossThreshold / 500)
    const bossType = bossNumber % 2 === 1 ? 'pulsar' : 'dragon'
    spawnBoss(bossType)
    state.lastBossScore = nextBossThreshold
  }
}

function spawnBoss(bossType) {
  const bossConfig = CONFIG.boss[bossType]

  const renderer = createPatternRenderer({
    mode: RenderMode.LOOP,
    pattern: bossConfig.pattern,
    globalCellSize: CONFIG.globalCellSize,
    loopUpdateRate: CONFIG.loopUpdateRate
  })

  const dims = renderer.dimensions

  // Solución C: Usar fixedHitbox si está definido (separar visual de lógica)
  // Esto evita el bug de offset negativo cuando sprite < hitbox.min
  // offsetX/offsetY: 0 = centrado automático, valor > 0 = offset manual
  const hitbox = bossConfig.fixedHitbox
    ? {
      width: bossConfig.fixedHitbox.width,
      height: bossConfig.fixedHitbox.height,
      offsetX: bossConfig.fixedHitbox.offsetX || (dims.width - bossConfig.fixedHitbox.width) / 2,
      offsetY: bossConfig.fixedHitbox.offsetY || (dims.height - bossConfig.fixedHitbox.height) / 2
    }
    : calculateClampedHitbox(dims.width, dims.height, 'boss')

  boss = {
    x: CONFIG.width / 2 - dims.width / 2,
    y: -dims.height,  // Start above screen
    targetY: CONFIG.boss.yPosition,  // Target Y position
    width: dims.width,
    height: dims.height,
    hitbox: hitbox,
    vx: CONFIG.boss.speed,
    hp: bossConfig.hp,
    scoreValue: bossConfig.scoreValue,
    dead: false,
    entering: true,  // Boss is entering screen
    gol: renderer.gol,
    gradient: bossConfig.gradient,
    flashTimer: 0    // Flash effect when hit
  }

  state.bossShootTimer = CONFIG.boss.shootInterval  // Delay first shot
}

function updateBoss() {
  if (!boss) return

  // Update flash timer
  if (boss.flashTimer > 0) boss.flashTimer--

  // Update GoL animation
  boss.gol.updateThrottled(state.frameCount)

  // Entry animation (Solución A: velocidad aumentada de 4 a 12)
  if (boss.entering) {
    boss.y += 12  // Move down faster (was 4, now 3x faster)
    if (boss.y >= boss.targetY) {
      boss.y = boss.targetY
      boss.entering = false
    }
    return  // Don't shoot or move horizontally while entering
  }

  // Horizontal movement (bounce off walls)
  boss.x += boss.vx
  if (boss.x <= 0 || boss.x >= CONFIG.width - boss.width) {
    boss.vx *= -1
    boss.x = Collision.clamp(boss.x, 0, CONFIG.width - boss.width)
  }

  // Shooting (fan of 3 bullets)
  state.bossShootTimer--
  if (state.bossShootTimer <= 0) {
    shootBossBullets()
    state.bossShootTimer = CONFIG.boss.shootInterval
  }
}

function shootBossBullets() {
  if (!boss) return

  // Solución A: Calcular desde el hitbox (patrón visual real, no sprite con padding)
  const centerX = boss.x + boss.hitbox.offsetX + boss.hitbox.width / 2
  const centerY = boss.y + boss.hitbox.offsetY + boss.hitbox.height

  // Fan of 3 bullets: left, center, right
  const angles = [-CONFIG.boss.bulletSpread, 0, CONFIG.boss.bulletSpread]

  angles.forEach(angle => {
    const bullet = {
      x: centerX - CONFIG.globalCellSize / 2,
      y: centerY,
      width: CONFIG.globalCellSize,
      height: CONFIG.globalCellSize,
      vx: Math.sin(angle) * CONFIG.boss.bulletSpeed,
      vy: Math.cos(angle) * CONFIG.boss.bulletSpeed,  // Positive = downward
      dead: false
    }
    bossBullets.push(bullet)
  })
}

function updateBossBullets() {
  bossBullets.forEach(bullet => {
    bullet.x += bullet.vx
    bullet.y += bullet.vy

    // Remove if off screen
    if (bullet.y > CONFIG.height || bullet.x < -50 || bullet.x > CONFIG.width + 50) {
      bullet.dead = true
    }
  })

  bossBullets = bossBullets.filter(b => !b.dead)
}

function damageBoss() {
  if (!boss) return

  boss.hp--
  boss.flashTimer = 15  // Flash for 15 frames

  if (boss.hp <= 0) {
    // Boss destroyed!
    state.score += boss.scoreValue
    spawnBossExplosion()
    boss = null
    bossBullets = []  // Clear boss bullets when boss dies
  }
}

function spawnBossExplosion() {
  // Big explosion for boss (more particles)
  const centerX = boss.x + boss.hitbox.offsetX + boss.hitbox.width / 2
  const centerY = boss.y + boss.hitbox.offsetY + boss.hitbox.height / 2

  for (let i = 0; i < 12; i++) {
    const particle = {
      x: centerX + (Math.random() * 2 - 1) * 60,
      y: centerY + (Math.random() * 2 - 1) * 60,
      vx: (Math.random() * 2 - 1) * 6,
      vy: (Math.random() * 2 - 1) * 6,
      alpha: 255,
      width: 180,
      height: 180,
      dead: false,
      gol: new GoLEngine(6, 6, CONFIG.loopUpdateRate),
      gradient: GRADIENT_PRESETS.EXPLOSION
    }

    seedRadialDensity(particle.gol, 0.7, 0.0)
    particle.gol.setPattern(Patterns.BEACON, 1, 1)
    particles.push(particle)
  }
}

// ============================================
// BULLETS
// ============================================

function shootBullet() {
  const bullet = {
    x: player.x + player.width / 2 - CONFIG.globalCellSize,
    y: player.y - CONFIG.globalCellSize * 2,
    width: CONFIG.globalCellSize * 2,
    height: CONFIG.globalCellSize * 2,
    vy: -CONFIG.bullet.speed,
    dead: false,
    gol: new GoLEngine(2, 2, CONFIG.loopUpdateRate),
    gradient: GRADIENT_PRESETS.BULLET
  }

  seedRadialDensity(bullet.gol, 0.75, 0.0)
  bullets.push(bullet)
}

function updateBullets() {
  bullets.forEach(bullet => {
    bullet.y += bullet.vy

    if (state.frameCount % 5 === 0) {
      maintainDensity(bullet, 0.75)
    }

    if (bullet.y < -bullet.height) {
      bullet.dead = true
    }
  })

  bullets = bullets.filter(b => !b.dead)
}

// ============================================
// COLLISIONS
// ============================================

function checkCollisions() {
  // Bullets vs Enemies
  bullets.forEach(bullet => {
    enemies.forEach(enemy => {
      if (!bullet.dead && !enemy.dead) {
        if (Collision.rectRect(
          bullet.x, bullet.y, bullet.width, bullet.height,
          enemy.x + enemy.hitbox.offsetX,
          enemy.y + enemy.hitbox.offsetY,
          enemy.hitbox.width,
          enemy.hitbox.height
        )) {
          bullet.dead = true
          enemy.dead = true
          state.score += enemy.scoreValue
          spawnExplosion(enemy)
        }
      }
    })
  })

  // Bullets vs Boss
  if (boss && !boss.entering) {
    bullets.forEach(bullet => {
      if (!bullet.dead && boss) {  // Check boss still exists (may be killed by previous bullet)
        if (Collision.rectRect(
          bullet.x, bullet.y, bullet.width, bullet.height,
          boss.x + boss.hitbox.offsetX,
          boss.y + boss.hitbox.offsetY,
          boss.hitbox.width,
          boss.hitbox.height
        )) {
          bullet.dead = true
          damageBoss()
        }
      }
    })
  }

  // Boss bullets vs Player
  bossBullets.forEach(bullet => {
    if (!bullet.dead && state.phase === 'PLAYING') {
      if (Collision.rectRect(
        bullet.x, bullet.y, bullet.width, bullet.height,
        player.x + player.hitbox.offsetX,
        player.y + player.hitbox.offsetY,
        player.hitbox.width,
        player.hitbox.height
      )) {
        bullet.dead = true
        destroyPlayer()
      }
    }
  })

  // Player bullets vs Boss bullets (deflection - based on space-invaders.js)
  if (bullets.length > 0 && bossBullets.length > 0) {
    bullets.forEach(playerBullet => {
      if (playerBullet.dead) return  // Early exit (performance)

      bossBullets.forEach(bossBullet => {
        if (!bossBullet.dead && !playerBullet.dead) {
          if (Collision.rectRect(
            playerBullet.x, playerBullet.y, playerBullet.width, playerBullet.height,
            bossBullet.x, bossBullet.y, bossBullet.width, bossBullet.height
          )) {
            playerBullet.dead = true
            bossBullet.dead = true

            // Spawn mini-explosion at midpoint between bullets
            const midX = (playerBullet.x + bossBullet.x) / 2
            const midY = (playerBullet.y + bossBullet.y) / 2
            spawnMiniExplosion(midX, midY)

            state.score += 5  // Small bonus for bullet deflection
          }
        }
      })
    })
  }

  // Boss vs Player (touch)
  if (boss && !boss.entering && state.phase === 'PLAYING') {
    if (Collision.rectRect(
      player.x + player.hitbox.offsetX,
      player.y + player.hitbox.offsetY,
      player.hitbox.width,
      player.hitbox.height,
      boss.x + boss.hitbox.offsetX,
      boss.y + boss.hitbox.offsetY,
      boss.hitbox.width,
      boss.hitbox.height
    )) {
      destroyPlayer()
    }
  }

  // Enemies vs Player
  enemies.forEach(enemy => {
    if (!enemy.dead && state.phase === 'PLAYING') {
      if (Collision.rectRect(
        player.x + player.hitbox.offsetX,
        player.y + player.hitbox.offsetY,
        player.hitbox.width,
        player.hitbox.height,
        enemy.x + enemy.hitbox.offsetX,
        enemy.y + enemy.hitbox.offsetY,
        enemy.hitbox.width,
        enemy.hitbox.height
      )) {
        enemy.dead = true
        spawnExplosion(enemy)
        destroyPlayer()
      }
    }
  })

  enemies = enemies.filter(e => !e.dead)
}

// ============================================
// DIFFICULTY
// ============================================

function updateDifficulty() {
  const newLevel = Math.floor(state.score / CONFIG.spawn.scoreThreshold) + 1

  if (newLevel > state.difficultyLevel) {
    state.difficultyLevel = newLevel

    // Increase spawn rate
    state.currentSpawnInterval = Math.max(
      CONFIG.spawn.intervalMin,
      CONFIG.spawn.intervalStart - (state.difficultyLevel - 1) * CONFIG.spawn.intervalDecrement
    )
  }
}

// ============================================
// EXPLOSIONS
// ============================================

function spawnExplosion(entity) {
  const centerX = entity.x + entity.width / 2
  const centerY = entity.y + entity.height / 2
  const particleCount = entity.type === 'large' ? 5 : 3

  for (let i = 0; i < particleCount; i++) {
    const particle = {
      x: centerX + (Math.random() * 2 - 1) * 30,
      y: centerY + (Math.random() * 2 - 1) * 30,
      vx: (Math.random() * 2 - 1) * 4,
      vy: (Math.random() * 2 - 1) * 4,
      alpha: 255,
      width: 180,
      height: 180,
      dead: false,
      gol: new GoLEngine(6, 6, CONFIG.loopUpdateRate),
      gradient: entity.gradient || GRADIENT_PRESETS.EXPLOSION
    }

    seedRadialDensity(particle.gol, 0.7, 0.0)
    particle.gol.setPattern(Patterns.BLINKER, 1, 1)

    particles.push(particle)
  }
}

/**
 * Spawn mini-explosion when bullets collide.
 * Creates a single 2×2 particle that fades quickly.
 * Based on space-invaders.js implementation.
 *
 * @param {number} x - X coordinate of collision
 * @param {number} y - Y coordinate of collision
 */
function spawnMiniExplosion(x, y) {
  const particle = {
    x: x - CONFIG.globalCellSize,  // Center (offset for 2×2 grid)
    y: y - CONFIG.globalCellSize,
    vx: 0,  // No movement (static flash)
    vy: 0,
    alpha: 255,
    width: CONFIG.globalCellSize * 2,   // 60px (2 cells)
    height: CONFIG.globalCellSize * 2,  // 60px
    dead: false,
    gol: new GoLEngine(2, 2, CONFIG.loopUpdateRate),
    gradient: GRADIENT_PRESETS.EXPLOSION
  }

  // Seed with high density for visible flash
  seedRadialDensity(particle.gol, 0.75, 0.0)

  particles.push(particle)
}

function destroyPlayer() {
  // Player explosion
  const centerX = player.x + player.width / 2
  const centerY = player.y + player.height / 2

  for (let i = 0; i < 8; i++) {
    const particle = {
      x: centerX + (Math.random() * 2 - 1) * 40,
      y: centerY + (Math.random() * 2 - 1) * 40,
      vx: (Math.random() * 2 - 1) * 5,
      vy: (Math.random() * 2 - 1) * 5,
      alpha: 255,
      width: 180,
      height: 180,
      dead: false,
      gol: new GoLEngine(6, 6, CONFIG.loopUpdateRate),
      gradient: GRADIENT_PRESETS.EXPLOSION
    }

    seedRadialDensity(particle.gol, 0.7, 0.0)
    particle.gol.setPattern(Patterns.BEACON, 1, 1)

    particles.push(particle)
  }

  state.lives = 0
  state.phase = 'DYING'
  state.dyingTimer = 0
}

// ============================================
// RENDERING
// ============================================

function renderGame() {
  push()
  scale(scaleFactor)

  // Render stars (background - behind everything)
  renderStars()

  // Render enemies
  enemies.forEach(enemy => {
    if (!enemy.dead) {
      maskedRenderer.renderMaskedGrid(
        enemy.gol,
        enemy.x,
        enemy.y,
        CONFIG.globalCellSize,
        enemy.gradient
      )
    }
  })

  // Render boss (with flash effect when hit)
  if (boss) {
    // Skip rendering every other frame when flashing (blink effect)
    const shouldRender = boss.flashTimer <= 0 || Math.floor(boss.flashTimer / 3) % 2 === 0

    if (shouldRender) {
      maskedRenderer.renderMaskedGrid(
        boss.gol,
        boss.x,
        boss.y,
        CONFIG.globalCellSize,
        boss.gradient
      )
    }
  }

  // Render boss bullets (theme-aware like space-invaders)
  fill(currentTheme === 'night' ? 255 : 0)
  noStroke()
  bossBullets.forEach(bullet => {
    rect(bullet.x, bullet.y, bullet.width, bullet.height)
  })

  // Render bullets
  bullets.forEach(bullet => {
    maskedRenderer.renderMaskedGrid(
      bullet.gol,
      bullet.x,
      bullet.y,
      CONFIG.globalCellSize,
      bullet.gradient
    )
  })

  // Render player (hide during DYING/GAMEOVER)
  if (player && state.phase === 'PLAYING') {
    maskedRenderer.renderMaskedGrid(
      player.gol,
      player.x,
      player.y,
      CONFIG.globalCellSize,
      player.gradient
    )
  }

  // Render particles
  renderParticles(particles, maskedRenderer, CONFIG.globalCellSize)

  // ============================================
  // HITBOX DEBUG (Press H to toggle)
  // ============================================

  // Player hitbox (green)
  if (player && state.phase === 'PLAYING') {
    drawHitboxRect(
      player.x + player.hitbox.offsetX,
      player.y + player.hitbox.offsetY,
      player.hitbox.width,
      player.hitbox.height,
      'player',
      '#00FF00'
    )
  }

  // Boss hitbox (magenta) - Solución C debug
  if (boss) {
    drawHitboxRect(
      boss.x + boss.hitbox.offsetX,
      boss.y + boss.hitbox.offsetY,
      boss.hitbox.width,
      boss.hitbox.height,
      'boss',
      '#FF00FF'
    )
  }

  // Enemy hitboxes (red)
  enemies.forEach(enemy => {
    if (!enemy.dead) {
      drawHitboxRect(
        enemy.x + enemy.hitbox.offsetX,
        enemy.y + enemy.hitbox.offsetY,
        enemy.hitbox.width,
        enemy.hitbox.height,
        'enemy',
        '#FF0000'
      )
    }
  })

  // Player bullet hitboxes (cyan)
  bullets.forEach(bullet => {
    drawHitboxRect(
      bullet.x,
      bullet.y,
      bullet.width,
      bullet.height,
      'bullet',
      '#00FFFF'
    )
  })

  pop()
}

// ============================================
// INPUT
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

// ============================================
// EXPORTS
// ============================================

window.setup = setup
window.draw = draw
window.keyPressed = keyPressed
window.windowResized = windowResized
