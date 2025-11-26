/**
 * CodeAnimationScreen v2 - Terminal-style code animation (Figma design)
 *
 * Displays LLM-style text generation with colored keywords
 * Dark terminal background (#33333E)
 * Rectangular blinking cursor
 * Auto-scrolls as text appears
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getResponsiveDimensions } from '../installation/ScreenHelper.js'
import { getGameById } from '../installation/GameRegistry.js'
import { debugLog, debugError } from '../utils/Logger.js'

export class CodeAnimationScreen {
  constructor(appState, inputManager) {
    this.appState = appState
    this.inputManager = inputManager

    // DOM elements
    this.element = null

    // Animation state
    this.currentText = ''
    this.targetText = ''
    this.currentChar = 0
    this.intervalHandle = null
    this.timeoutHandle = null

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  /**
   * Show screen - Create DOM and start typewriter animation
   */
  async show() {
    debugLog('CodeAnimationScreen: Show')

    // Get selected game
    const game = this.appState.getState().selectedGame
    if (!game) {
      debugError('No game selected')
      this.appState.reset()
      return
    }

    // Get thinking text from GameRegistry
    const gameData = getGameById(game.id)

    if (!gameData || !gameData.thinking) {
      debugError(`No thinking text found for game: ${game.id}`)
      this.appState.reset()
      return
    }

    this.targetText = gameData.thinking

    // Create screen element
    this.element = document.createElement('div')
    this.element.id = 'code-screen'
    this.element.innerHTML = `
      <div class="code-container">
        <div class="code-display">
          <div class="code-content"></div>
        </div>
      </div>
    `

    // Calculate responsive dimensions (using ScreenHelper)
    const { containerWidth, containerHeight } = getResponsiveDimensions()

    // Add styles with responsive dimensions
    // Note: Background inverted from theme - day=dark, night=light
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
      background: var(--code-bg);
      z-index: 100;
      animation: fadeIn 0.3s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `

    // Add to DOM
    document.body.appendChild(this.element)

    // Add CSS if not already added
    if (!document.getElementById('code-screen-styles')) {
      const style = document.createElement('style')
      style.id = 'code-screen-styles'
      style.textContent = `
        .code-container {
          padding: clamp(80px, 10.3cqh, 198px) clamp(30px, 5cqw, 60px);
          font-family: 'Google Sans Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .code-display {
          flex: 1;
          overflow-y: auto;
          /* Hide scrollbar for all browsers */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .code-display::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .code-content {
          font-size: clamp(18px, 2.34cqh, 45px);
          line-height: 1.2;
          color: var(--code-text);
          white-space: pre-wrap;
          word-wrap: break-word;
          font-weight: 400;
        }

        .code-content .highlight {
          font-weight: 600;
        }

        .code-content .highlight.red {
          color: var(--highlight-red);
        }

        .code-content .highlight.green {
          color: var(--highlight-green);
        }

        .code-content .highlight.blue {
          color: var(--highlight-blue);
        }

        .code-content .highlight.yellow {
          color: var(--highlight-yellow);
        }

        .code-content .cursor {
          display: inline-block;
          width: 0.6em;
          height: 1em;
          background: var(--code-text);
          animation: blink 0.8s infinite;
          vertical-align: text-bottom;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    // Start typewriter animation
    this.startTypewriter()

    // Listen for keys (allow skip with Space)
    this.inputManager.onKeyPress(this.handleKeyPress)

    debugLog('CodeAnimationScreen: Active')
  }

  /**
   * Hide screen - Stop animation and clean up
   */
  hide() {
    debugLog('CodeAnimationScreen: Hide')

    // Stop animation
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }

    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }

    // Stop listening for keys
    this.inputManager.offKeyPress(this.handleKeyPress)

    // Remove element
    if (this.element) {
      this.element.remove()
      this.element = null
    }

    // Reset state
    this.currentText = ''
    this.targetText = ''
    this.currentChar = 0

    debugLog('CodeAnimationScreen: Cleaned up')
  }

  /**
   * Start typewriter animation
   */
  startTypewriter() {
    this.currentChar = 0
    this.currentText = ''

    // Update every 20ms (~50 chars/sec, faster terminal effect)
    this.intervalHandle = setInterval(() => {
      if (this.currentChar < this.targetText.length) {
        const char = this.targetText[this.currentChar]

        // If we hit an opening tag, skip to the end of it instantly
        if (char === '<') {
          const closingBracket = this.targetText.indexOf('>', this.currentChar)
          if (closingBracket !== -1) {
            // Copy entire tag instantly (from < to >)
            this.currentText += this.targetText.substring(this.currentChar, closingBracket + 1)
            this.currentChar = closingBracket + 1
          } else {
            // No closing bracket found, just add the char
            this.currentText += char
            this.currentChar++
          }
        } else {
          // Normal character, add it
          this.currentText += char
          this.currentChar++
        }

        // Update display
        const codeContent = this.element.querySelector('.code-content')
        if (codeContent) {
          // Set HTML to preserve span tags for colored text
          codeContent.innerHTML = this.currentText + '<span class="cursor"></span>'

          // Auto-scroll like terminal (keep bottom visible)
          const codeDisplay = this.element.querySelector('.code-display')
          if (codeDisplay) {
            codeDisplay.scrollTop = codeDisplay.scrollHeight
          }
        }
      } else {
        // Animation complete
        clearInterval(this.intervalHandle)
        this.intervalHandle = null

        // Keep cursor blinking at end for 1 second, then remove and auto-advance
        this.timeoutHandle = setTimeout(() => {
          const codeContent = this.element.querySelector('.code-content')
          if (codeContent) {
            // Remove cursor
            codeContent.innerHTML = this.currentText
          }

          // Auto-advance after cursor disappears
          setTimeout(() => {
            this.advanceToGame()
          }, 500)
        }, 1000)
      }
    }, 5)
  }

  /**
   * Handle key press
   * @param {string} key - Pressed key
   */
  handleKeyPress(key) {
    // Space or N skips animation
    if (key === ' ' || key === 'n' || key === 'N') {
      debugLog('CodeAnimationScreen: Key pressed - skipping animation')
      this.advanceToGame()
    }
    // Ignore other keys (theme 1-8 handled by ThemeManager, reset M/M+N handled by ResetManager)
  }

  /**
   * Advance to Game screen
   */
  advanceToGame() {
    debugLog('CodeAnimationScreen: Advancing to Game')
    this.appState.transition('game')
  }
}
