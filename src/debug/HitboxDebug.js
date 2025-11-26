/**
 * HitboxDebug.js
 *
 * Lightweight hitbox visualization system for all games.
 * Press 'H' to toggle hitbox display (works independently from debug UI).
 *
 * @module HitboxDebug
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog } from '../utils/Logger.js'

/**
 * Global state for hitbox debugging
 */
let hitboxDebugEnabled = false

/**
 * Initialize hitbox debugging for a game.
 * Sets up keyboard listener for 'H' key toggle.
 *
 * @example
 * // In game setup
 * import { initHitboxDebug } from '../src/debug/HitboxDebug.js'
 * initHitboxDebug()
 */
export function initHitboxDebug() {
  // Setup keyboard listener (only once)
  if (!window.__hitboxDebugInitialized) {
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'h') {
        hitboxDebugEnabled = !hitboxDebugEnabled
        debugLog(`[HitboxDebug] ${hitboxDebugEnabled ? 'Enabled' : 'Disabled'}`)
        e.preventDefault()
      }
    })
    window.__hitboxDebugInitialized = true
    debugLog('[HitboxDebug] Initialized (press H to toggle)')
  }
}

/**
 * Check if hitbox debugging is currently enabled.
 *
 * @returns {boolean} True if enabled
 *
 * @example
 * if (isHitboxDebugEnabled()) {
 *   drawHitboxRect(player.x, player.y, player.width, player.height, 'player')
 * }
 */
export function isHitboxDebugEnabled() {
  return hitboxDebugEnabled
}

/**
 * Draw rectangular hitbox (for most entities).
 * Uses p5.js global mode functions.
 *
 * @param {number} x - X position (top-left)
 * @param {number} y - Y position (top-left)
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {string} [label=''] - Optional label (entity type)
 * @param {string} [color='#00FF00'] - Hitbox color (default: green)
 *
 * @example
 * // Draw player hitbox
 * drawHitboxRect(player.x, player.y, player.width, player.height, 'player', '#00FF00')
 *
 * @example
 * // Draw obstacle hitbox
 * drawHitboxRect(obs.x, obs.y, obs.width, obs.height, 'obstacle', '#FF0000')
 */
export function drawHitboxRect(x, y, width, height, label = '', color = '#00FF00') {
  if (!hitboxDebugEnabled) return

  push()

  // Draw rectangle outline
  stroke(color)
  strokeWeight(2)
  noFill()
  rect(x, y, width, height)

  // Draw label if provided
  if (label) {
    fill(color)
    noStroke()
    textAlign(LEFT, TOP)
    textSize(12)
    text(label, x, y - 15)
  }

  pop()
}

/**
 * Draw circular hitbox (for circular entities).
 * Uses p5.js global mode functions.
 *
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} radius - Radius
 * @param {string} [label=''] - Optional label (entity type)
 * @param {string} [color='#00FF00'] - Hitbox color (default: green)
 *
 * @example
 * // Draw circular bullet hitbox
 * drawHitboxCircle(bullet.x, bullet.y, bullet.radius, 'bullet', '#FFFF00')
 */
export function drawHitboxCircle(x, y, radius, label = '', color = '#00FF00') {
  if (!hitboxDebugEnabled) return

  push()

  // Draw circle outline
  stroke(color)
  strokeWeight(2)
  noFill()
  circle(x, y, radius * 2)

  // Draw crosshair at center
  stroke(color)
  strokeWeight(1)
  line(x - 5, y, x + 5, y)
  line(x, y - 5, x, y + 5)

  // Draw label if provided
  if (label) {
    fill(color)
    noStroke()
    textAlign(LEFT, TOP)
    textSize(12)
    text(label, x + radius + 5, y - 6)
  }

  pop()
}

/**
 * Draw hitbox for entities with hitbox object.
 * Automatically detects shape (rect vs circle).
 *
 * @param {Object} entity - Entity with hitbox property
 * @param {string} [label=''] - Optional label
 * @param {string} [color='#00FF00'] - Hitbox color
 *
 * @example
 * // Entity with rectangular hitbox
 * const player = {
 *   x: 100, y: 200,
 *   width: 50, height: 50
 * }
 * drawHitbox(player, 'player', '#00FF00')
 *
 * @example
 * // Entity with circular hitbox (hitbox.radius)
 * const enemy = {
 *   hitbox: { x: 300, y: 400, radius: 30 }
 * }
 * drawHitbox(enemy, 'enemy', '#FF0000')
 */
export function drawHitbox(entity, label = '', color = '#00FF00') {
  if (!hitboxDebugEnabled) return

  // Check for circular hitbox
  if (entity.hitbox && entity.hitbox.radius !== undefined) {
    drawHitboxCircle(
      entity.hitbox.x,
      entity.hitbox.y,
      entity.hitbox.radius,
      label,
      color
    )
    return
  }

  // Check for rectangular hitbox
  if (entity.hitbox && entity.hitbox.width !== undefined) {
    drawHitboxRect(
      entity.hitbox.x,
      entity.hitbox.y,
      entity.hitbox.width,
      entity.hitbox.height,
      label,
      color
    )
    return
  }

  // Fallback: use entity's own x/y/width/height
  if (entity.width !== undefined && entity.height !== undefined) {
    drawHitboxRect(
      entity.x,
      entity.y,
      entity.width,
      entity.height,
      label,
      color
    )
    return
  }

  // Fallback: use entity's radius
  if (entity.radius !== undefined) {
    drawHitboxCircle(
      entity.x,
      entity.y,
      entity.radius,
      label,
      color
    )
  }
}

/**
 * Draw hitboxes for array of entities.
 *
 * @param {Array} entities - Array of entities
 * @param {string} label - Label prefix for all entities
 * @param {string} [color='#00FF00'] - Hitbox color
 *
 * @example
 * // Draw all obstacles
 * drawHitboxes(obstacles, 'obstacle', '#FF0000')
 *
 * @example
 * // Draw all bullets
 * drawHitboxes(bullets, 'bullet', '#FFFF00')
 */
export function drawHitboxes(entities, label, color = '#00FF00') {
  if (!hitboxDebugEnabled) return

  entities.forEach((entity, index) => {
    const entityLabel = `${label} ${index}`
    drawHitbox(entity, entityLabel, color)
  })
}
