/**
 * QRCodeScreen v2 - Thank you screen with QR code (Figma design)
 *
 * Title: "Thank you LFC for playing Conway's Arcade!"
 * QR Code: Centered with blur circle background
 * Decorations: GoL patterns in corners
 * Auto-timeout: 15 seconds to Idle
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getResponsiveDimensions } from '../installation/ScreenHelper.js'
import { debugLog, debugError } from '../utils/Logger.js'

export class QRCodeScreen {
  /**
   * Inactivity timeout (30 seconds) - returns to Idle if no key pressed
   */
  static INACTIVITY_TIMEOUT = 30000

  /**
   * Base URL for web version
   * Dynamically determined based on current origin
   */
  static BASE_URL = (() => {
    // Use current window origin for deployed version
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/games/`
  })()

  constructor(appState, inputManager) {
    this.appState = appState
    this.inputManager = inputManager

    // DOM element
    this.element = null

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  /**
   * Show screen - Display QR code and thank you message
   */
  show() {
    debugLog('QRCodeScreen: Show')

    // Get selected game and player name
    const state = this.appState.getState()
    const game = state.selectedGame
    const playerName = state.playerName || 'LFC'  // Fallback to 'LFC' if no name

    debugLog('QRCodeScreen DEBUG: playerName =', playerName)
    debugLog('QRCodeScreen DEBUG: full state =', state)

    if (!game) {
      debugError('No game selected')
      this.appState.reset()
      return
    }

    // Generate URL
    const gameUrl = QRCodeScreen.BASE_URL + game.id + '.html'

    // Create screen element
    this.element = document.createElement('div')
    this.element.id = 'qr-screen'

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

    this.element.innerHTML = `
      <div class="qr-container">
        <!-- Title at top -->
        <div class="qr-title-wrapper">
          <div class="qr-title">
            <span class="qr-title-text">Thank you </span><span class="qr-title-highlight">${playerName}</span><span class="qr-title-text"> for playing!</span>
          </div>
        </div>

        <!-- Center section with QR -->
        <div class="qr-center">
          <!-- Scan prompt above QR -->
          <div class="qr-scan-prompt">Scan to play online</div>

          <!-- QR Code with blur circle -->
          <div class="qr-code-wrapper">
            <div class="qr-blur-circle"></div>
            <img src="/conways-arcade-online/img/qr.png" alt="QR Code" class="qr-code-image" />
          </div>

          <!-- Work at google prompt below QR -->
          <div class="qr-scan-prompt">Work at Google <div class="qr-scan-prompt-link">g.co/jobs/AI</div></div>
        </div>
      </div>
    `

    // Add to DOM
    document.body.appendChild(this.element)

    // Add CSS if not already added
    if (!document.getElementById('qr-screen-styles')) {
      const style = document.createElement('style')
      style.id = 'qr-screen-styles'
      style.textContent = `
        .qr-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Google Sans Flex', Arial, sans-serif;
          padding: clamp(60px, 6cqh, 115px) clamp(45px, 7.7cqw, 92px);
        }

        .qr-title-wrapper {
          width: 100%;
          margin-bottom: 0;
          flex-shrink: 0;
        }

        .qr-title {
          font-size: clamp(36px, 4.43cqh, 80px);
          font-weight: 500;
          line-height: 1.1;
          text-align: left;
        }

        .qr-title-text {
          color: var(--text-primary);
        }

        .qr-title-highlight {
          color: var(--highlight-red);
        }

        .qr-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          width: 100%;
          gap: clamp(20px, 3cqh, 60px);
        }

        .qr-scan-prompt {
          font-size: clamp(24px, 2.86cqh, 55px);
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1;
          margin: 0;
          padding: 0;
          background: transparent;
          z-index: 2;
        }

        .qr-scan-prompt-link {
          color: var(--text-primary);
          display: inline;
        }

        .qr-code-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(280px, 48cqw, 577px);
          height: clamp(280px, 29.8cqh, 572px);
        }

        .qr-blur-circle {
          position: absolute;
          width: clamp(350px, 61.8cqw, 741px);
          height: clamp(350px, 38.6cqh, 741px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(66, 133, 244, 0.08) 0%, rgba(66, 133, 244, 0.03) 50%, rgba(255, 255, 255, 0) 100%);
          filter: blur(60px);
          z-index: 1;
        }

        .qr-code-image {
          position: relative;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 2;
        }

        /* Corner decorations */
        .qr-decoration {
          position: absolute;
          background: var(--border-color);
          opacity: 0.6;
          border-radius: 8px;
        }

        .qr-decoration-top-left {
          width: clamp(40px, 7cqw, 84px);
          height: clamp(20px, 2cqh, 38px);
          left: clamp(56px, 9.4cqw, 113px);
          top: clamp(242px, 24.2cqh, 465px);
        }

        .qr-decoration-top-right {
          width: clamp(40px, 7cqw, 84px);
          height: clamp(36px, 3.8cqh, 73px);
          right: clamp(90px, 15cqw, 182px);
          top: clamp(148px, 14.8cqh, 285px);
        }

        .qr-decoration-bottom-left {
          width: clamp(100px, 17.3cqw, 208px);
          height: clamp(121px, 12.1cqh, 232px);
          left: clamp(151px, 25.3cqw, 303px);
          bottom: clamp(171px, 17.1cqh, 329px);
        }

        .qr-decoration-bottom-right {
          width: clamp(87px, 14.6cqw, 175px);
          height: clamp(67px, 6.7cqh, 129px);
          right: clamp(62px, 10.4cqw, 125px);
          bottom: clamp(302px, 30.2cqh, 583px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    // Listen for keys
    this.inputManager.onKeyPress(this.handleKeyPress)

    // Set inactivity timeout - return to Idle after 30s
    this.appState.setTimeout(QRCodeScreen.INACTIVITY_TIMEOUT, 'idle', 'qr-inactivity')

    debugLog('QRCodeScreen: Active (30s inactivity timer)')
  }

  /**
   * Hide screen - Remove DOM and event listeners
   */
  hide() {
    debugLog('QRCodeScreen: Hide')

    // Clear inactivity timeout
    this.appState.clearTimeout('qr-inactivity')

    // Stop listening for keys
    this.inputManager.offKeyPress(this.handleKeyPress)

    // Remove element
    if (this.element) {
      this.element.remove()
      this.element = null
    }

    // Reset AppState (loop complete)
    if (this.appState.currentScreen === 'idle') {
      this.appState.selectedGame = null
      this.appState.currentScore = null
      this.appState.playerName = null
    }

    debugLog('QRCodeScreen: Cleaned up')
  }

  /**
   * Handle key press
   * @param {string} key - Pressed key
   */
  handleKeyPress(key) {
    // Reset inactivity timer on any key press
    this.appState.clearTimeout('qr-inactivity')
    this.appState.setTimeout(QRCodeScreen.INACTIVITY_TIMEOUT, 'idle', 'qr-inactivity')

    // Space or N returns to Idle (restart loop)
    if (key === ' ' || key === 'n' || key === 'N') {
      debugLog('QRCodeScreen: Key pressed - returning to Idle')
      this.appState.reset()
    }
    // Ignore other keys (theme 1-8 handled by ThemeManager, reset M/M+N handled by ResetManager)
  }
}
