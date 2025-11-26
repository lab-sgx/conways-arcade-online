/**
 * GameBaseConfig.js
 * Shared configuration helpers for all games
 *
 * @author Game of Life Arcade
 * @license ISC
 */

// ============================================
// GAME DIMENSIONS (Portrait 1200×1920)
// ============================================
export const GAME_DIMENSIONS = {
  BASE_WIDTH: 1200,
  BASE_HEIGHT: 1920,
  ASPECT_RATIO: 1200 / 1920  // 0.625 (10:16 portrait)
}

// ============================================
// GAME OVER CONFIGURATION
// ============================================
export const GAMEOVER_CONFIG = {
  MIN_DELAY: 30,           // Minimum frames to wait before showing game over (0.5 seconds at 60fps)
  MAX_WAIT: 180,           // Maximum frames to wait for particle animation (3 seconds at 60fps)
  PARTICLE_DURATION: 120,  // Frames to show particles before game over message
  MESSAGE_DURATION: 180,   // Frames to show game over message
  FADE_START: 150          // Frame to start fade out
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create initial game state object
 * @param {Object} customState - Custom state properties
 * @returns {Object} Game state object
 */
export function createGameState(customState = {}) {
  return {
    score: 0,
    lives: 1,           // ALWAYS 1 (arcade mode)
    phase: 'PLAYING',   // PLAYING | DYING | GAMEOVER
    frameCount: 0,
    ...customState
  }
}

/**
 * Calculate responsive canvas dimensions maintaining aspect ratio
 * NOTE: Must be called from within p5.js context (setup/draw) where windowWidth/windowHeight are available
 * @returns {Object} {canvasWidth, canvasHeight, scaleFactor}
 */
export function calculateCanvasDimensions() {
  // These variables come from p5.js global scope
  const wWidth = typeof windowWidth !== 'undefined' ? windowWidth : GAME_DIMENSIONS.BASE_WIDTH
  const wHeight = typeof windowHeight !== 'undefined' ? windowHeight : GAME_DIMENSIONS.BASE_HEIGHT

  const windowRatio = wWidth / wHeight
  const targetRatio = GAME_DIMENSIONS.ASPECT_RATIO

  let canvasWidth, canvasHeight, scaleFactor

  if (windowRatio > targetRatio) {
    // Window is wider than target - fit by height
    canvasHeight = wHeight
    canvasWidth = canvasHeight * targetRatio
    scaleFactor = canvasHeight / GAME_DIMENSIONS.BASE_HEIGHT
  } else {
    // Window is taller than target - fit by width
    canvasWidth = wWidth
    canvasHeight = canvasWidth / targetRatio
    scaleFactor = canvasWidth / GAME_DIMENSIONS.BASE_WIDTH
  }

  return { canvasWidth, canvasHeight, scaleFactor }
}

/**
 * Create game configuration object with defaults
 * @param {Object} customConfig - Custom configuration properties
 * @returns {Object} Complete configuration object
 */
export function createGameConfig(customConfig = {}) {
  return {
    width: GAME_DIMENSIONS.BASE_WIDTH,
    height: GAME_DIMENSIONS.BASE_HEIGHT,
    ui: {
      backgroundColor: '#FFFFFF',  // White background
      textColor: '#5f6368',        // Google gray text (dark gray for visibility on white)
      font: 'Arial',
      fontSize: 20,
      score: {
        x: 100,
        y: 100,
        size: 48,
        color: [66, 133, 244]  // Google Blue
      },
      gameOver: {
        titleSize: 96,
        subtitleSize: 48,
        titleColor: [234, 67, 53],  // Google Red
        subtitleColor: [66, 133, 244]  // Google Blue
      }
    },
    ...customConfig
  }
}
