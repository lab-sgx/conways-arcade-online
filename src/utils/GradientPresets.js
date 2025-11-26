/**
 * Gradient presets using Google brand colors.
 * Each preset defines a color palette and animation settings.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Google brand color palette (RGB values).
 * Official Google brand colors.
 */
export const GOOGLE_COLORS = {
  BLUE: [66, 133, 244],    // Google Blue #4285F4
  RED: [234, 67, 53],      // Google Red #EA4335
  GREEN: [52, 168, 83],    // Google Green #34A853
  YELLOW: [251, 188, 4],   // Google Yellow #FBBC04
  WHITE: [255, 255, 255]
}

/**
 * Predefined gradient configurations for different entity types.
 * Each preset includes:
 * - name: Descriptive name
 * - palette: Array of RGB colors
 * - controlPoints: Number of gradient control points (4-8)
 * - animationSpeed: Speed of gradient animation (pixels/frame)
 * - perColumn: Whether to render gradient per column for variation
 */
export const GRADIENT_PRESETS = {
  /**
   * Player - Animated Google gradient
   */
  PLAYER: {
    name: 'Player (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 16,
    animationSpeed: 0.5,
    perColumn: true
  },

  /**
   * Enemy - Animated Google gradient
   */
  ENEMY_HOT: {
    name: 'Enemy (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 16,
    animationSpeed: 0.8,
    perColumn: true
  },

  /**
   * Enemy - Animated Google gradient
   */
  ENEMY_COLD: {
    name: 'Enemy (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 16,
    animationSpeed: 0.6,
    perColumn: true
  },

  /**
   * Enemy - Animated Google gradient
   */
  ENEMY_RAINBOW: {
    name: 'Enemy (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 16,
    animationSpeed: 1.0,
    perColumn: true
  },

  /**
   * Bullet - Animated Google gradient
   */
  BULLET: {
    name: 'Bullet (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 12,
    animationSpeed: 2.0,
    perColumn: true
  },

  /**
   * Powerup - Animated Google gradient
   */
  POWERUP: {
    name: 'Powerup (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 16,
    animationSpeed: 1.5,
    perColumn: true
  },

  /**
   * Background - Animated Google gradient
   */
  BACKGROUND: {
    name: 'Background (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 20,
    animationSpeed: 0.3,
    perColumn: true
  },

  /**
   * Boss - Animated Google gradient
   */
  BOSS: {
    name: 'Boss (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 20,
    animationSpeed: 1.2,
    perColumn: true
  },

  /**
   * Particle/Explosion - Animated Google gradient
   */
  EXPLOSION: {
    name: 'Explosion (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.RED,
      GOOGLE_COLORS.GREEN,
      GOOGLE_COLORS.YELLOW
    ],
    controlPoints: 16,
    animationSpeed: 3.0,
    perColumn: true
  },

  /**
   * Sky/Clouds - Animated blue to white gradient for parallax clouds
   */
  SKY: {
    name: 'Sky (Animated)',
    palette: [
      GOOGLE_COLORS.BLUE,
      GOOGLE_COLORS.WHITE,
      GOOGLE_COLORS.BLUE
    ],
    controlPoints: 12,
    animationSpeed: 0.2,
    perColumn: true
  }
}

/**
 * Get a random enemy gradient preset.
 *
 * @returns {object} Random enemy gradient preset
 */
export function getRandomEnemyGradient() {
  const enemyPresets = [
    GRADIENT_PRESETS.ENEMY_HOT,
    GRADIENT_PRESETS.ENEMY_COLD,
    GRADIENT_PRESETS.ENEMY_RAINBOW
  ]
  return enemyPresets[Math.floor(Math.random() * enemyPresets.length)]
}

/**
 * Create a custom gradient preset.
 *
 * Allows creating custom gradients with specific color palettes.
 * Control points determine smoothness (4=sharp transitions, 8=smooth blending).
 *
 * @param {string} name - Preset name (e.g., 'CUSTOM_PURPLE')
 * @param {number[][]} colors - Array of RGB color arrays, e.g., [[255, 0, 0], [0, 0, 255]]
 * @param {number} [controlPoints=6] - Number of control points (4-8, clamped). Higher = smoother
 * @param {number} [animationSpeed=0.5] - Animation speed multiplier (0.1 = slow, 2.0 = fast)
 * @param {boolean} [perColumn=true] - Whether to render per column (true) or pre-render (false)
 * @returns {object} Custom gradient preset object
 * @returns {string} returns.name - Preset name
 * @returns {number[][]} returns.palette - Color palette
 * @returns {number} returns.controlPoints - Clamped control points (4-8)
 * @returns {number} returns.animationSpeed - Animation speed
 * @returns {boolean} returns.perColumn - Render mode flag
 *
 * @example
 * // Purple to pink gradient
 * const purpleGradient = createCustomGradient(
 *   'CUSTOM_PURPLE',
 *   [[128, 0, 128], [255, 192, 203]],  // Purple to Pink
 *   6,     // Smooth blending
 *   0.5,   // Medium animation speed
 *   true   // Render per column
 * )
 *
 * @example
 * // Fiery gradient with sharp transitions
 * const fireGradient = createCustomGradient(
 *   'FIRE',
 *   [
 *     [255, 255, 0],   // Yellow
 *     [255, 128, 0],   // Orange
 *     [255, 0, 0],     // Red
 *     [128, 0, 0]      // Dark red
 *   ],
 *   4,     // Sharp transitions
 *   1.5    // Fast animation
 * )
 *
 * @example
 * // Using with entity
 * const enemy = {
 *   gol: new GoLEngine(6, 6, 15),
 *   gradient: createCustomGradient('NEON', [[0, 255, 255], [255, 0, 255]])
 * }
 */
export function createCustomGradient(name, colors, controlPoints = 6, animationSpeed = 0.5, perColumn = true) {
  return {
    name,
    palette: colors,
    controlPoints: Math.max(4, Math.min(8, controlPoints)),
    animationSpeed,
    perColumn
  }
}
