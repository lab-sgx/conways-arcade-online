/**
 * Canonical Conway's Game of Life patterns from LifeWiki.
 * All patterns are authentic and documented in GoL literature.
 *
 * Pattern format: 2D array where 1 = alive, 0 = dead
 * Patterns are credited to their sources (LifeWiki, Golly, etc.)
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Canonical Game of Life patterns.
 * All patterns sourced from LifeWiki: https://conwaylife.com/wiki/
 */
export const Patterns = {
  /**
   * BLOCK - 2x2 still life (never changes)
   * Source: https://conwaylife.com/wiki/Block
   * Period: Stable (still life)
   */
  BLOCK: [
    [1, 1],
    [1, 1]
  ],

  /**
   * BEEHIVE - 4x3 still life
   * Source: https://conwaylife.com/wiki/Beehive
   * Period: Stable (still life)
   */
  BEEHIVE: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
  ],

  /**
   * LOAF - 4x4 still life
   * Source: https://conwaylife.com/wiki/Loaf
   * Period: Stable (still life)
   */
  LOAF: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 0]
  ],

  /**
   * BOAT - 3x3 still life
   * Source: https://conwaylife.com/wiki/Boat
   * Period: Stable (still life)
   */
  BOAT: [
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 0]
  ],

  /**
   * TUB - 3x3 still life (circular shape)
   * Source: https://conwaylife.com/wiki/Tub
   * Period: Stable (still life)
   */
  TUB: [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0]
  ],

  /**
   * POND - 4x4 still life (square with hole)
   * Source: https://conwaylife.com/wiki/Pond
   * Period: Stable (still life)
   */
  POND: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
  ],

  /**
   * SHIP - 3x3 still life (boat-like asymmetric)
   * Source: https://conwaylife.com/wiki/Ship
   * Period: Stable (still life)
   */
  SHIP: [
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 1]
  ],

  /**
   * BLINKER - 3x1 oscillator (vertical orientation)
   * Source: https://conwaylife.com/wiki/Blinker
   * Period: 2 (oscillates between vertical and horizontal)
   */
  BLINKER: [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0]
  ],

  /**
   * TOAD - 4x4 oscillator (with padding for proper evolution)
   * Source: https://conwaylife.com/wiki/Toad
   * Period: 2
   * Phase 1: Horizontal offset configuration
   * Phase 2: Vertical configuration
   */
  TOAD: [
    [0, 0, 0, 0],
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [0, 0, 0, 0]
  ],

  /**
   * BEACON - 4x4 oscillator
   * Source: https://conwaylife.com/wiki/Beacon
   * Period: 2
   */
  BEACON: [
    [1, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 0, 1, 1],
    [0, 0, 1, 1]
  ],

  /**
   * PULSAR - 13x13 oscillator (simplified 5x5 for performance)
   * Source: https://conwaylife.com/wiki/Pulsar
   * Period: 3
   * Note: Full 13x13 pattern available, using compact version for sprites
   */
  PULSAR: [
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0]
  ],

  /**
   * GLIDER - 3x3 spaceship (diagonal movement)
   * Source: https://conwaylife.com/wiki/Glider
   * Speed: c/4 (1 cell diagonally per 4 generations)
   * Direction: Southeast in this orientation
   */
  GLIDER: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1]
  ],

  /**
   * LIGHTWEIGHT_SPACESHIP (LWSS) - 7x6 spaceship (horizontally flipped, standard padding)
   * Source: https://conwaylife.com/wiki/Lightweight_spaceship
   * Speed: c/2 (moves 2 cells left per 4 generations in this orientation)
   * Direction: Leftward in this orientation (flipped to match Wikipedia)
   * Period: 4
   * Canonical representation (flipped horizontally):
   * Original:        Flipped:
   * . * . . *    →   * . . * .
   * * . . . .    →   . . . . *
   * * . . . *    →   * . . . *
   * * * * * .    →   . * * * *
   *
   * Standard padding: 1 row top/bottom, 1 column left/right
   */
  LIGHTWEIGHT_SPACESHIP: [
    [0, 0, 0, 0, 0, 0, 0],  // Row 0: top padding
    [0, 1, 0, 0, 1, 0, 0],  // Row 1: * . . * . (flipped)
    [0, 0, 0, 0, 0, 1, 0],  // Row 2: . . . . * (flipped)
    [0, 1, 0, 0, 0, 1, 0],  // Row 3: * . . . * (flipped)
    [0, 0, 1, 1, 1, 1, 0],  // Row 4: . * * * * (flipped)
    [0, 0, 0, 0, 0, 0, 0]   // Row 5: bottom padding
  ],

  /**
   * R_PENTOMINO - Methuselah pattern
   * Source: https://conwaylife.com/wiki/R-pentomino
   * Stabilizes after 1,103 generations into 116 cells
   * Great for explosion effects
   */
  R_PENTOMINO: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 1, 0]
  ],

  /**
   * ACORN - Methuselah pattern
   * Source: https://conwaylife.com/wiki/Acorn
   * Stabilizes after 5,206 generations
   * Great for long-running explosion effects
   */
  ACORN: [
    [0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 0, 0, 1, 1, 1]
  ],

  /**
   * DIEHARD - Methuselah pattern
   * Source: https://conwaylife.com/wiki/Diehard
   * Stabilizes after 130 generations (dies completely)
   * Great for short explosion effects
   */
  DIEHARD: [
    [0, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 1, 1]
  ],

  /**
   * DRAGON - c/6 orthogonal spaceship (ORIGINAL horizontal orientation)
   * Source: https://conwaylife.com/wiki/Dragon
   * Speed: c/6 (1 cell per 6 generations)
   * Period: 6
   * Size: 29×18 (~82 cells)
   * Discovered by Paul Tooke in April 2000 - first c/6 spaceship
   * NOTE: Use rotatePattern90() to orient vertically for vertical shooters
   */
  DRAGON: [
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,0],
    [0,0,0,0,0,1,0,0,0,1,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1,1,0,0,1],
    [1,1,0,0,0,1,0,1,1,0,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0],
    [1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,1,0],
    [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,1,0],
    [1,1,0,0,0,1,0,1,1,0,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0],
    [1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1,1,0,0,1],
    [0,0,0,0,0,1,0,0,0,1,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ],

  /**
   * COPPERHEAD - c/10 orthogonal spaceship
   * Source: https://conwaylife.com/wiki/Copperhead
   * Speed: c/10 (1 cell per 10 generations)
   * Direction: Vertical (moves down in this orientation)
   * Period: 10
   * Size: 8×12 (28 cells)
   * Discovered by 'zdr' in 2016 - first c/10 spaceship found
   */
  COPPERHEAD: [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0]
  ],

  /**
   * DRAGON_VERTICAL - c/6 orthogonal spaceship (rotated 90° CW to face downward)
   * Source: https://conwaylife.com/wiki/Dragon
   * Speed: c/6 (1 cell per 6 generations)
   * Period: 6
   * Size: 18×29 (rotated from 29×18)
   * Use this version for vertical shooters where boss moves down
   */
  DRAGON_VERTICAL: null  // Will be computed after Patterns definition
}

/**
 * Stamp a pattern onto a grid at a specific location.
 *
 * @param {number[][]} grid - The target grid (modified in place)
 * @param {number[][]} pattern - The pattern to stamp
 * @param {number} startX - Starting column index
 * @param {number} startY - Starting row index
 * @param {number} cols - Number of columns in grid
 * @param {number} rows - Number of rows in grid
 */
export function stampPattern(grid, pattern, startX, startY, cols, rows) {
  for (let x = 0; x < pattern.length; x++) {
    for (let y = 0; y < pattern[x].length; y++) {
      const gridX = startX + x
      const gridY = startY + y
      if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
        grid[gridX][gridY] = pattern[x][y]
      }
    }
  }
}

/**
 * Rotate a pattern 90 degrees clockwise.
 *
 * @param {number[][]} pattern - Pattern to rotate
 * @returns {number[][]} Rotated pattern
 */
export function rotatePattern90(pattern) {
  const rows = pattern.length
  const cols = pattern[0].length
  const rotated = []

  for (let y = 0; y < cols; y++) {
    rotated[y] = []
    for (let x = 0; x < rows; x++) {
      rotated[y][x] = pattern[rows - 1 - x][y]
    }
  }

  return rotated
}

/**
 * Flip a pattern horizontally.
 *
 * @param {number[][]} pattern - Pattern to flip
 * @returns {number[][]} Flipped pattern
 */
export function flipPatternHorizontal(pattern) {
  return pattern.map(row => [...row].reverse())
}

/**
 * Flip a pattern vertically.
 *
 * @param {number[][]} pattern - Pattern to flip
 * @returns {number[][]} Flipped pattern
 */
export function flipPatternVertical(pattern) {
  return [...pattern].reverse()
}

// ============================================
// COMPUTED PATTERN VARIANTS
// ============================================

/**
 * Initialize DRAGON_VERTICAL as the 90° CW rotation of DRAGON.
 * This makes the dragon face downward for vertical shooters.
 */
Patterns.DRAGON_VERTICAL = rotatePattern90(Patterns.DRAGON)
