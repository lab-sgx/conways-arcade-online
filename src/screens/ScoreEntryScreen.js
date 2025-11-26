/**
 * ScoreEntryScreen v2 - Arcade-style 3-letter name input (3-screen sequence)
 *
 * SCREEN 1: "GAME OVER" display
 * SCREEN 2: Final Score display
 * SCREEN 3: Name entry (3 letter boxes A-Z)
 *
 * Controls: ↑↓ to change, → to move, Space to confirm/advance
 * Each screen auto-advances after 3 seconds or on Space key
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getResponsiveDimensions } from '../installation/ScreenHelper.js'
import { validateGame } from '../installation/GameRegistry.js'
import { debugLog, debugError } from '../utils/Logger.js'

export class ScoreEntryScreen {
  /**
   * Inactivity timeout (30 seconds) - returns to Idle if no key pressed
   * Only applies to screen 3 (name entry)
   */
  static INACTIVITY_TIMEOUT = 30000

  constructor(appState, inputManager, storageManager) {
    this.appState = appState
    this.inputManager = inputManager
    this.storageManager = storageManager

    // DOM element
    this.element = null

    // Name state
    this.letters = ['A', 'A', 'A']  // Start with AAA
    this.currentPosition = 0         // Current letter position (0-2)

    // Screen sequence state
    this.currentScreen = 1  // 1: Game Over, 2: Score, 3: Name Entry
    this.autoAdvanceTimeout = null

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  /**
   * Show screen - Create DOM and add event listeners
   */
  show() {
    debugLog('ScoreEntryScreen: Show')

    // Get score from AppState
    const state = this.appState.getState()
    const score = state.currentScore
    const game = state.selectedGame

    if (score === null || !validateGame(game)) {
      debugError('ScoreEntryScreen: Invalid score or game')
      this.appState.reset()
      return
    }

    // Reset state
    this.letters = ['A', 'A', 'A']
    this.currentPosition = 0
    this.currentScreen = 1

    // Create screen element
    this.element = document.createElement('div')
    this.element.id = 'score-entry-screen'

    // Calculate responsive dimensions (using ScreenHelper)
    const { containerWidth, containerHeight } = getResponsiveDimensions()

    // Add styles with responsive dimensions
    this.element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${containerWidth}px;
      height: ${containerHeight}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      z-index: 100;
      animation: fadeIn 0.5s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `

    // Add to DOM
    document.body.appendChild(this.element)

    // Add CSS if not already added
    if (!document.getElementById('score-entry-screen-styles')) {
      const style = document.createElement('style')
      style.id = 'score-entry-screen-styles'
      style.textContent = `
        .score-entry-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding-bottom: clamp(160px, 20cqh, 384px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
        }

        .score-entry-gameover {
          font-size: clamp(48px, 6.25cqh, 120px);
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
          line-height: 1;
          text-align: center;
        }

        .score-entry-container-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(60px, 7.5cqh, 144px);
          height: 100%;
          padding-bottom: clamp(160px, 20cqh, 384px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
          animation: fadeIn 0.5s ease-in;
        }

        .score-entry-header {
          font-size: clamp(28px, 4.69cqh, 90px);
          font-weight: 500;
          line-height: 1;
          white-space: nowrap;
          text-align: center;
          width: 100%;
        }

        .score-entry-header-text {
          color: var(--text-primary);
        }

        .score-entry-header-highlight {
          color: var(--highlight-green);
        }

        .score-entry-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(21px, 2.68cqh, 51px);
        }

        .score-entry-number {
          font-size: clamp(94px, 12.19cqh, 234px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1;
          text-align: center;
        }

        .score-entry-game-name {
          font-size: clamp(24px, 3.66cqh, 70px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1;
          text-align: center;
          white-space: nowrap;
        }

        .score-entry-continue {
          position: absolute;
          bottom: clamp(120px, 15cqh, 288px);
          left: 50%;
          transform: translateX(-50%);
          font-size: clamp(16px, 2.12cqh, 41px);
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1;
          white-space: nowrap;
        }

        .score-entry-container-name {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(60px, 7.5cqh, 144px);
          height: 100%;
          padding-bottom: clamp(160px, 20cqh, 384px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
          animation: fadeIn 0.5s ease-in;
        }

        .score-entry-letters-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: clamp(20px, 4cqw, 50px);
        }

        .score-entry-letter-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(21px, 2.68cqh, 51px);
        }

        .score-entry-letter-char {
          font-size: clamp(80px, 12.19cqh, 234px);
          font-weight: 400;
          color: var(--text-tertiary);
          line-height: 1;
          text-align: center;
          transition: color 0.3s ease, font-weight 0.3s ease;
        }

        .score-entry-letter-char.active {
          color: var(--text-primary);
          font-weight: 500;
        }

        .score-entry-letter-line {
          width: clamp(120px, 22cqw, 250px);
          height: 0;
          border: none;
          border-top: clamp(4px, 0.57cqh, 11px) solid var(--text-primary);
          position: relative;
        }

        .score-entry-letter-line::after {
          content: '';
          position: absolute;
          top: clamp(21px, 2.68cqh, 51px);
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: clamp(15px, 2cqh, 40px) solid transparent;
          border-right: clamp(15px, 2cqh, 40px) solid transparent;
          border-bottom: clamp(20px, 2.6cqh, 50px) solid var(--text-primary);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .score-entry-letter-box:has(.active) .score-entry-letter-line::after {
          opacity: 1;
        }

        .score-entry-footer {
          position: absolute;
          bottom: clamp(120px, 15cqh, 288px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          white-space: nowrap;
        }

        .score-entry-play-again {
          color: #7D7D7D;
          font-size: clamp(18px, 2.08cqh, 40px);
          font-family: 'Google Sans Flex', sans-serif;
          font-weight: 500;
          text-decoration: underline;
          line-height: 1;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    // Show first screen
    this.showCurrentScreen()

    // Listen for keys
    this.inputManager.onKeyPress(this.handleKeyPress)

    debugLog('ScoreEntryScreen: Active')
  }

  /**
   * Show the current screen in the sequence
   */
  showCurrentScreen() {
    if (!this.element) return

    const state = this.appState.getState()
    const score = state.currentScore

    // Clear any existing auto-advance timeout
    if (this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout)
      this.autoAdvanceTimeout = null
    }

    if (this.currentScreen === 1) {
      // SCREEN 1: Game Over
      this.element.innerHTML = `
        <div class="score-entry-container">
          <h1 class="score-entry-gameover">Game over</h1>
        </div>
        <div class="score-entry-footer">
          <div class="score-entry-play-again">Play again</div>
        </div>
      `
      // Add click handler for Play again
      const playAgainLink = this.element.querySelector('.score-entry-play-again')
      if (playAgainLink) {
        playAgainLink.addEventListener('click', () => {
          this.playAgain()
        })
      }
      // Auto-advance after 5 seconds
      this.autoAdvanceTimeout = setTimeout(() => {
        this.advanceScreen()
      }, 5000)
    }
    else if (this.currentScreen === 2) {
      // SCREEN 2: Score
      const gameName = state.selectedGame ? state.selectedGame.name : 'Game'
      this.element.innerHTML = `
        <div class="score-entry-container-score">
          <div class="score-entry-header">
            <span class="score-entry-header-text">Here's your final </span><span class="score-entry-header-highlight">score:</span>
          </div>
          <div class="score-entry-card">
            <div class="score-entry-number">${score.toString()}</div>
            <div class="score-entry-game-name">${gameName}</div>
          </div>
          <div class="score-entry-continue">Press any button to continue</div>
        </div>
      `
      // Auto-advance after 3 seconds
      this.autoAdvanceTimeout = setTimeout(() => {
        this.advanceScreen()
      }, 3000)
    }
    else if (this.currentScreen === 3) {
      // SCREEN 3: Name Entry
      this.element.innerHTML = `
        <div class="score-entry-container-name">
          <div class="score-entry-header">
            <span class="score-entry-header-text">Write your </span><span class="score-entry-header-highlight">name</span>
          </div>
          <div class="score-entry-letters-row">
            ${this.letters.map((letter, index) => `
              <div class="score-entry-letter-box">
                <div class="score-entry-letter-char ${index === this.currentPosition ? 'active' : ''}">${letter}</div>
                <div class="score-entry-letter-line"></div>
              </div>
            `).join('')}
          </div>
          <div class="score-entry-continue">Press any button to continue</div>
        </div>
      `

      // Set inactivity timeout only for screen 3 (name entry)
      this.appState.setTimeout(ScoreEntryScreen.INACTIVITY_TIMEOUT, 'idle', 'score-entry-inactivity')
    }
  }

  /**
   * Advance to next screen in sequence
   */
  advanceScreen() {
    if (this.currentScreen < 3) {
      this.currentScreen++
      this.showCurrentScreen()
    }
  }

  /**
   * Play again - restart the same game
   */
  playAgain() {
    debugLog('ScoreEntryScreen: Play again selected - restarting game')
    this.appState.transition('game')
  }

  /**
   * Hide screen - Remove DOM and event listeners
   */
  hide() {
    debugLog('ScoreEntryScreen: Hide')

    // Clear inactivity timeout
    this.appState.clearTimeout('score-entry-inactivity')

    // Clear auto-advance timeout
    if (this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout)
      this.autoAdvanceTimeout = null
    }

    // Stop listening for keys
    this.inputManager.offKeyPress(this.handleKeyPress)

    // Remove element
    if (this.element) {
      this.element.remove()
      this.element = null
    }

    debugLog('ScoreEntryScreen: Cleaned up')
  }

  /**
   * Handle key press
   * @param {string} key - Pressed key
   */
  handleKeyPress(key) {
    // Reset inactivity timer on any key press (only if on screen 3)
    if (this.currentScreen === 3) {
      this.appState.clearTimeout('score-entry-inactivity')
      this.appState.setTimeout(ScoreEntryScreen.INACTIVITY_TIMEOUT, 'idle', 'score-entry-inactivity')
    }

    // Space or N - Different behavior per screen
    if (key === ' ' || key === 'n' || key === 'N') {
      if (this.currentScreen === 1) {
        // On screen 1 (Game Over), go to gallery (Play again)
        if (this.autoAdvanceTimeout) {
          clearTimeout(this.autoAdvanceTimeout)
          this.autoAdvanceTimeout = null
        }
        this.playAgain()
      } else if (this.currentScreen === 2) {
        // On screen 2 (Score), skip to next screen
        if (this.autoAdvanceTimeout) {
          clearTimeout(this.autoAdvanceTimeout)
          this.autoAdvanceTimeout = null
        }
        this.advanceScreen()
      } else {
        // On screen 3, move to next letter or confirm
        this.nextLetter()
      }
    }
    // Only allow letter controls on screen 3
    else if (this.currentScreen === 3) {
      // Arrow Up or W - Increment letter
      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        this.changeLetter(1)
      }
      // Arrow Down or S - Decrement letter
      else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        this.changeLetter(-1)
      }
      // Arrow Right or D - Move to next letter
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        this.nextLetter()
      }
      // Arrow Left or A - Move to previous letter
      else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        this.previousLetter()
      }
    }
    // Ignore other keys (theme 1-8 handled by ThemeManager, reset M/M+N handled by ResetManager)
  }

  /**
   * Change current letter
   * @param {number} direction - 1 for next letter, -1 for previous
   */
  changeLetter(direction) {
    const currentLetter = this.letters[this.currentPosition]
    const currentCode = currentLetter.charCodeAt(0)

    // Calculate new letter (A=65, Z=90)
    let newCode = currentCode + direction

    // Wrap around
    if (newCode < 65) newCode = 90  // Wrap Z -> A
    if (newCode > 90) newCode = 65  // Wrap A -> Z

    // Update letter
    this.letters[this.currentPosition] = String.fromCharCode(newCode)

    // Update display
    this.updateDisplay()
  }

  /**
   * Move to next letter or confirm if all 3 entered
   */
  nextLetter() {
    if (this.currentPosition < 2) {
      // Move to next letter
      this.currentPosition++
      this.updateDisplay()
    } else {
      // All 3 letters entered - confirm
      this.confirmName()
    }
  }

  /**
   * Move to previous letter
   */
  previousLetter() {
    if (this.currentPosition > 0) {
      // Move to previous letter
      this.currentPosition--
      this.updateDisplay()
    }
  }

  /**
   * Update visual display
   */
  updateDisplay() {
    if (!this.element) return

    // Update letter characters
    const letterElements = this.element.querySelectorAll('.score-entry-letter-char')
    letterElements.forEach((el, index) => {
      el.textContent = this.letters[index]
      if (index === this.currentPosition) {
        el.classList.add('active')
      } else {
        el.classList.remove('active')
      }
    })
  }

  /**
   * Confirm name and save score
   */
  confirmName() {
    const name = this.letters.join('')
    debugLog(`ScoreEntryScreen: Confirmed name - ${name}`)

    // Store in AppState
    this.appState.setPlayerName(name)

    // Save score to localStorage - capture timestamp BEFORE saving
    const state = this.appState.getState()
    const timestampBeforeSave = new Date().toISOString()

    const success = this.storageManager.saveScore(
      state.selectedGame.id,
      name,
      state.currentScore
    )

    if (success) {
      debugLog('Score saved successfully')

      // Get scores AFTER saving
      const scoresAfter = this.storageManager.getScores(state.selectedGame.id)

      debugLog('ScoreEntryScreen DEBUG:')
      debugLog('- Looking for:', name, state.currentScore)
      debugLog('- Timestamp before save:', timestampBeforeSave)
      debugLog('- All scores:', scoresAfter.map(s => ({ name: s.name, score: s.score, date: s.date })))

      // Find entries matching name + score
      const matchingEntries = scoresAfter.filter(entry =>
        entry.name === name &&
        entry.score === state.currentScore
      )

      debugLog('- Matching entries:', matchingEntries)

      if (matchingEntries.length > 0) {
        // Take the MOST RECENT one (closest to timestampBeforeSave)
        // This handles both cases:
        // 1. Score made top 10 → our new timestamp will be in the list
        // 2. Score didn't make top 10 → we still identify it was ours
        const newEntry = matchingEntries.reduce((latest, current) => {
          return new Date(current.date) > new Date(latest.date) ? current : latest
        })

        // Save the exact timestamp from localStorage to AppState
        this.appState.setScoreTimestamp(newEntry.date)
        debugLog('✓ Score timestamp captured:', newEntry.date)
      } else {
        debugError('✗ Could not find matching score entry')
        debugLog('- This means the score was saved but immediately discarded (not in top 10)')
        // Still set a timestamp so we can show "you didn't make top 10" message
        this.appState.setScoreTimestamp(timestampBeforeSave)
      }
    } else {
      debugError('Failed to save score')
    }

    // Advance to Leaderboard
    this.appState.transition('leaderboard')
  }
}
