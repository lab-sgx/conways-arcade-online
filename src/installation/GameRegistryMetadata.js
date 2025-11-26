/**
 * GameRegistryMetadata - Game Metadata (LIGHTWEIGHT VERSION)
 *
 * Contains ONLY core game metadata without text content.
 * Used by game-wrapper.html to avoid loading .txt files.
 *
 * ARCHITECTURE PATTERN:
 * - This file: Lightweight metadata only (~2KB) - for iframes
 * - GameRegistry.js: Full data with prompt/thinking texts (~500KB+) - for screens
 *
 * USAGE:
 * - game-wrapper.html: Use this file (only needs game title/paths)
 * - Screens: Use GameRegistry.js instead (needs full prompt/thinking texts)
 *
 * CONSISTENCY:
 * GameRegistry.js imports and extends this file, ensuring single source of truth.
 *
 * @module installation/GameRegistryMetadata
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Game metadata (without prompt/thinking content)
 *
 * @typedef {Object} GameMetadata
 * @property {string} id - Unique game identifier
 * @property {string} name - Display name
 * @property {string} path - iframe path
 * @property {string} key - Keyboard shortcut (1-4)
 * @property {string} promptPath - Path to prompt .txt file
 * @property {string} thinkingPath - Path to thinking .txt file
 */

/**
 * @type {GameMetadata[]}
 */
export const GAMES_METADATA = [
  {
    id: 'space-invaders',
    name: 'Cellfront Command',
    path: '/conways-arcade-online/games/game-wrapper.html?game=space-invaders',
    key: '1',
    promptPath: '/conways-arcade-online/games/space-invaders-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/space-invaders-thinking.txt'
  },
  {
    id: 'dino-runner',
    name: 'Automata Rush',
    path: '/conways-arcade-online/games/game-wrapper.html?game=dino-runner',
    key: '2',
    promptPath: '/conways-arcade-online/games/dino-runner-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/dino-runner-thinking.txt'
  },
  {
    id: 'breakout',
    name: 'Cellular Shatter',
    path: '/conways-arcade-online/games/game-wrapper.html?game=breakout',
    key: '3',
    promptPath: '/conways-arcade-online/games/breakout-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/breakout-thinking.txt'
  },
  {
    id: 'flappy-bird',
    name: 'Hoppy Glider',
    path: '/conways-arcade-online/games/game-wrapper.html?game=flappy-bird',
    key: '4',
    promptPath: '/conways-arcade-online/games/flappy-bird-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/flappy-bird-thinking.txt'
  },
  {
    id: 'galaga',
    name: 'Cellship Strike',
    path: '/conways-arcade-online/games/game-wrapper.html?game=galaga',
    key: '5',
    promptPath: '/conways-arcade-online/games/galaga-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/galaga-thinking.txt'
  },
  {
    id: 'snake',
    name: 'Trail of Life',
    path: '/conways-arcade-online/games/game-wrapper.html?game=snake',
    key: '6',
    promptPath: '/conways-arcade-online/games/snake-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/snake-thinking.txt'
  },
  {
    id: 'asteroids',
    name: 'Debris Automata',
    path: '/conways-arcade-online/games/game-wrapper.html?game=asteroids',
    key: '7',
    promptPath: '/conways-arcade-online/games/asteroids-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/asteroids-thinking.txt'
  },
  {
    id: 'life-drop',
    name: "Conway's GoL",
    path: '/conways-arcade-online/games/game-wrapper.html?game=life-drop',
    key: '8',
    promptPath: '/conways-arcade-online/games/life-drop-prompt.txt',
    thinkingPath: '/conways-arcade-online/games/life-drop-thinking.txt'
  }
]

/**
 * Get game metadata by ID
 *
 * @param {string} id - Game ID
 * @returns {GameMetadata|null}
 *
 * @example
 * const game = getGameMetadataById('space-invaders')
 * console.log(game.name) // 'Cellfront Command'
 */
export function getGameMetadataById(id) {
  return GAMES_METADATA.find(game => game.id === id) || null
}

/**
 * Validate game metadata object
 *
 * @param {*} game - Game metadata to validate
 * @returns {boolean}
 *
 * @example
 * const game = getGameMetadataById('space-invaders')
 * if (validateGameMetadata(game)) {
 *   console.log('Valid metadata')
 * }
 */
export function validateGameMetadata(game) {
  if (!game || typeof game !== 'object') {
    return false
  }

  const requiredFields = ['id', 'name', 'path', 'key']

  return requiredFields.every(field =>
    game.hasOwnProperty(field) &&
    game[field] !== null &&
    game[field] !== undefined &&
    typeof game[field] === 'string' &&
    game[field].length > 0
  )
}
