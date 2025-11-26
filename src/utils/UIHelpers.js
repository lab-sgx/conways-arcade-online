/**
 * UI Rendering Helpers - Consistent UI across all games
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Render standard game UI (score + controls).
 *
 * @param {Object} config - CONFIG object with .ui and .width properties
 * @param {Object} state - Game state with .score
 * @param {Array<string>} controls - Control instructions (e.g., ['← → or A/D: Move', 'SPACE: Shoot'])
 *
 * @example
 * renderGameUI(CONFIG, state, [
 *   '← → or A/D: Move',
 *   'SPACE or Z: Shoot'
 * ])
 */
export function renderGameUI(config, state, controls) {
  fill(config.ui.textColor)  // Can be hex string or RGB array
  noStroke()
  textFont(config.ui.font)
  textStyle(NORMAL)
  textSize(config.ui.fontSize)
  textAlign(LEFT, TOP)

  text(`SCORE: ${state.score}`, 20, 20)

  // Controls on right side
  textAlign(RIGHT, TOP)
  controls.forEach((control, i) => {
    text(control, config.width - 20, 20 + i * 25)
  })
}

/**
 * Render standard game over screen.
 *
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} score - Final score
 *
 * @example
 * if (state.phase === 'GAMEOVER') {
 *   renderGameOver(width, height, state.score)
 * }
 */
export function renderGameOver(canvasWidth, canvasHeight, score) {
  fill(0, 0, 0, 180)
  noStroke()
  rect(0, 0, canvasWidth, canvasHeight)

  fill(255)
  noStroke()
  textStyle(NORMAL)
  textAlign(CENTER, CENTER)

  textSize(48)
  text('GAME OVER', canvasWidth/2, canvasHeight/2 - 40)

  textSize(24)
  text(`Final Score: ${score}`, canvasWidth/2, canvasHeight/2 + 40)

  textSize(16)
  text('Press SPACE to restart', canvasWidth/2, canvasHeight/2 + 100)
}

/**
 * Render win screen (for games with win conditions like Breakout).
 *
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} score - Final score
 */
export function renderWin(canvasWidth, canvasHeight, score) {
  fill(0, 0, 0, 180)
  noStroke()
  rect(0, 0, canvasWidth, canvasHeight)

  fill(255)
  noStroke()
  textStyle(NORMAL)
  textAlign(CENTER, CENTER)

  textSize(48)
  text('YOU WIN!', canvasWidth/2, canvasHeight/2 - 40)

  textSize(24)
  text(`Final Score: ${score}`, canvasWidth/2, canvasHeight/2 + 40)

  textSize(16)
  text('Press SPACE to restart', canvasWidth/2, canvasHeight/2 + 100)
}
