/**
 * GameRegistry - Central Game Catalog (FULL VERSION)
 *
 * Single Source of Truth for all available games in the installation.
 * Merges metadata from GameRegistryMetadata with text content (.txt files).
 *
 * ARCHITECTURE PATTERN:
 * - GameRegistryMetadata.js: Lightweight metadata only (~2KB)
 * - GameRegistry.js: Full data with prompt/thinking texts (~500KB+)
 *
 * USAGE:
 * - Screens (Gallery, CodeAnimation, etc.): Use this file (needs full text)
 * - game-wrapper.html: Use GameRegistryMetadata.js (only needs metadata)
 *
 * @module installation/GameRegistry
 * @author Game of Life Arcade
 * @license ISC
 */

// Import metadata (base structure - no .txt imports)
import { GAMES_METADATA } from './GameRegistryMetadata.js'

// Import text content (prompts)
import spaceInvadersPrompt from '../../public/games/space-invaders-prompt.txt?raw'
import dinoRunnerPrompt from '../../public/games/dino-runner-prompt.txt?raw'
import breakoutPrompt from '../../public/games/breakout-prompt.txt?raw'
import flappyBirdPrompt from '../../public/games/flappy-bird-prompt.txt?raw'
import galagaPrompt from '../../public/games/galaga-prompt.txt?raw'
import snakePrompt from '../../public/games/snake-prompt.txt?raw'
import asteroidsPrompt from '../../public/games/asteroids-prompt.txt?raw'
import lifeDropPrompt from '../../public/games/life-drop-prompt.txt?raw'

// Import text content (thinking)
import spaceInvadersThinking from '../../public/games/space-invaders-thinking.txt?raw'
import dinoRunnerThinking from '../../public/games/dino-runner-thinking.txt?raw'
import breakoutThinking from '../../public/games/breakout-thinking.txt?raw'
import flappyBirdThinking from '../../public/games/flappy-bird-thinking.txt?raw'
import galagaThinking from '../../public/games/galaga-thinking.txt?raw'
import snakeThinking from '../../public/games/snake-thinking.txt?raw'
import asteroidsThinking from '../../public/games/asteroids-thinking.txt?raw'
import lifeDropThinking from '../../public/games/life-drop-thinking.txt?raw'

/**
 * Map of text content by game ID
 * @private
 */
const TEXT_CONTENT = {
  'space-invaders': {
    prompt: spaceInvadersPrompt,
    thinking: spaceInvadersThinking
  },
  'dino-runner': {
    prompt: dinoRunnerPrompt,
    thinking: dinoRunnerThinking
  },
  'breakout': {
    prompt: breakoutPrompt,
    thinking: breakoutThinking
  },
  'flappy-bird': {
    prompt: flappyBirdPrompt,
    thinking: flappyBirdThinking
  },
  'galaga': {
    prompt: galagaPrompt,
    thinking: galagaThinking
  },
  'snake': {
    prompt: snakePrompt,
    thinking: snakeThinking
  },
  'asteroids': {
    prompt: asteroidsPrompt,
    thinking: asteroidsThinking
  },
  'life-drop': {
    prompt: lifeDropPrompt,
    thinking: lifeDropThinking
  }
}

/**
 * All available games with full content (metadata + text)
 *
 * @typedef {Object} Game
 * @property {string} id - Unique game identifier (matches game file name)
 * @property {string} name - Display name (used in all screens)
 * @property {string} prompt - AI prompt text (shown in Gallery carousel)
 * @property {string} thinking - Thinking process text (shown in Code Animation)
 * @property {string} path - iframe path to load the game
 * @property {string} key - Keyboard shortcut (1-4)
 * @property {string} promptPath - Path to prompt .txt file
 * @property {string} thinkingPath - Path to thinking .txt file
 */

/**
 * @type {Game[]}
 */
export const GAMES = GAMES_METADATA.map(meta => ({
  ...meta,
  prompt: TEXT_CONTENT[meta.id].prompt,
  thinking: TEXT_CONTENT[meta.id].thinking
}))

// Re-export metadata functions for convenience
export { GAMES_METADATA, getGameMetadataById, validateGameMetadata } from './GameRegistryMetadata.js'

/**
 * Get game by ID (with full content)
 *
 * @param {string} id - Game ID (e.g., 'space-invaders')
 * @returns {Game|null} Game object or null if not found
 *
 * @example
 * const game = getGameById('space-invaders')
 * if (game) {
 *   console.log(game.name) // 'Cellfront Command'
 *   console.log(game.thinking) // Full thinking text
 * }
 */
export function getGameById(id) {
  return GAMES.find(game => game.id === id) || null
}

/**
 * Validate game object structure (with content fields)
 *
 * Checks that a game object has all required fields including text content.
 * Used by screens to verify game data before use.
 *
 * @param {*} game - Game object to validate
 * @returns {boolean} True if valid, false otherwise
 *
 * @example
 * const game = appState.getState().selectedGame
 * if (!validateGame(game)) {
 *   console.error('Invalid game')
 *   appState.reset()
 *   return
 * }
 */
export function validateGame(game) {
  if (!game || typeof game !== 'object') {
    return false
  }

  // Required fields for games with content
  const requiredFields = ['id', 'name', 'path', 'key', 'prompt', 'thinking']

  return requiredFields.every(field =>
    game.hasOwnProperty(field) &&
    game[field] !== null &&
    game[field] !== undefined &&
    typeof game[field] === 'string' &&
    game[field].length > 0
  )
}
