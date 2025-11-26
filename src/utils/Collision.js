/**
 * Collision detection utilities for Game of Life Arcade.
 *
 * Simple collision helpers - import optionally in games.
 * All functions are pure (no side effects).
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Collision detection utilities.
 */
export const Collision = {
  /**
   * Check circle-circle collision.
   *
   * @param {number} x1 - Circle 1 center x
   * @param {number} y1 - Circle 1 center y
   * @param {number} r1 - Circle 1 radius
   * @param {number} x2 - Circle 2 center x
   * @param {number} y2 - Circle 2 center y
   * @param {number} r2 - Circle 2 radius
   * @returns {boolean} True if circles overlap
   *
   * @example
   * if (Collision.circleCircle(player.x, player.y, 20, enemy.x, enemy.y, 15)) {
   *   // Collision detected
   * }
   */
  circleCircle(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < (r1 + r2)
  },

  /**
   * Check rectangle-rectangle collision (AABB).
   *
   * @param {number} x1 - Rect 1 top-left x
   * @param {number} y1 - Rect 1 top-left y
   * @param {number} w1 - Rect 1 width
   * @param {number} h1 - Rect 1 height
   * @param {number} x2 - Rect 2 top-left x
   * @param {number} y2 - Rect 2 top-left y
   * @param {number} w2 - Rect 2 width
   * @param {number} h2 - Rect 2 height
   * @returns {boolean} True if rectangles overlap
   *
   * @example
   * if (Collision.rectRect(player.x, player.y, 40, 40, enemy.x, enemy.y, 30, 30)) {
   *   // Collision detected
   * }
   */
  rectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    )
  },

  /**
   * Check circle-rectangle collision.
   *
   * @param {number} cx - Circle center x
   * @param {number} cy - Circle center y
   * @param {number} r - Circle radius
   * @param {number} rx - Rectangle top-left x
   * @param {number} ry - Rectangle top-left y
   * @param {number} rw - Rectangle width
   * @param {number} rh - Rectangle height
   * @returns {boolean} True if circle and rectangle overlap
   *
   * @example
   * if (Collision.circleRect(ball.x, ball.y, 8, brick.x, brick.y, 60, 20)) {
   *   // Collision detected
   * }
   */
  circleRect(cx, cy, r, rx, ry, rw, rh) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rx, Math.min(cx, rx + rw))
    const closestY = Math.max(ry, Math.min(cy, ry + rh))

    // Distance from circle center to closest point
    const dx = cx - closestX
    const dy = cy - closestY
    const dist = Math.sqrt(dx * dx + dy * dy)

    return dist < r
  },

  /**
   * Check if point is inside rectangle.
   *
   * @param {number} px - Point x
   * @param {number} py - Point y
   * @param {number} rx - Rectangle top-left x
   * @param {number} ry - Rectangle top-left y
   * @param {number} rw - Rectangle width
   * @param {number} rh - Rectangle height
   * @returns {boolean} True if point is inside rectangle
   *
   * @example
   * if (Collision.pointInRect(mouseX, mouseY, button.x, button.y, 100, 40)) {
   *   // Mouse over button
   * }
   */
  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
  },

  /**
   * Calculate distance between two points.
   *
   * @param {number} x1 - Point 1 x
   * @param {number} y1 - Point 1 y
   * @param {number} x2 - Point 2 x
   * @param {number} y2 - Point 2 y
   * @returns {number} Distance between points
   *
   * @example
   * const dist = Collision.distance(player.x, player.y, enemy.x, enemy.y)
   * if (dist < 50) {
   *   // Enemy is close
   * }
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
  },

  /**
   * Clamp value between min and max.
   *
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   *
   * @example
   * player.x = Collision.clamp(player.x, 0, width)
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  },

  /**
   * Linear interpolation between two values.
   *
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   *
   * @example
   * const smoothX = Collision.lerp(currentX, targetX, 0.1)
   */
  lerp(a, b, t) {
    return a + (b - a) * t
  }
}
