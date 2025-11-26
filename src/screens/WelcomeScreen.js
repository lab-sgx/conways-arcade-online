/**
 * WelcomeScreen v2 - Welcome/Title screen (Figma design)
 *
 * Displays title and colorful subtitle with cascade animation
 * Pure HTML/CSS, no p5.js
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getResponsiveDimensions } from '../installation/ScreenHelper.js'
import { debugLog } from '../utils/Logger.js'

export class WelcomeScreen {
  /**
   * Inactivity timeout (30 seconds) - returns to Idle if no key pressed
   */
  static INACTIVITY_TIMEOUT = 30000

  constructor(appState, inputManager) {
    this.appState = appState
    this.inputManager = inputManager

    // DOM element
    this.element = null

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  /**
   * Show screen - Create DOM and add event listeners
   */
  show() {
    debugLog('WelcomeScreen: Show')

    // Calculate responsive dimensions (using ScreenHelper)
    const { containerWidth, containerHeight } = getResponsiveDimensions()

    // Create screen element
    this.element = document.createElement('div')
    this.element.id = 'welcome-screen'
    this.element.innerHTML = `
      <div class="welcome-container">
        <h1 class="welcome-title">Welcome to<br/>Conway's Arcade</h1>
        <div class="welcome-subtitle">
          <span class="line line-1">This is where <span class="highlight green">prompts</span> become <span class="highlight yellow">games</span>,</span>
          <span class="line line-2">patterns become <span class="highlight red">play</span>, and AI</span>
          <span class="line line-3">becomes pure <span class="highlight blue">arcade energy</span>.</span>
        </div>
      </div>
    `

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
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding-top: clamp(48px, 5cqh, 96px);
      z-index: 100;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `

    // Add to DOM
    document.body.appendChild(this.element)

    // Add CSS keyframes if not already added
    if (!document.getElementById('welcome-screen-styles')) {
      const style = document.createElement('style')
      style.id = 'welcome-screen-styles'
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .welcome-container {
          width: 100%;
          padding: 0 clamp(40px, 9cqw, 108px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
        }

        .welcome-title {
          font-size: clamp(36px, 5cqh, 95px);
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 clamp(32px, 4cqh, 76px) 0;
          line-height: 1;
          opacity: 0;
          animation: slideUp 0.8s ease-out 0.2s forwards;
        }

        .welcome-subtitle {
          font-size: clamp(36px, 5cqh, 95px);
          font-weight: 500;
          line-height: 1;
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .welcome-subtitle .line {
          display: block;
          opacity: 0;
        }

        .welcome-subtitle .line-1 {
          animation: slideUp 0.8s ease-out 0.6s forwards;
        }

        .welcome-subtitle .line-2 {
          animation: slideUp 0.8s ease-out 0.9s forwards;
        }

        .welcome-subtitle .line-3 {
          animation: slideUp 0.8s ease-out 1.2s forwards;
        }

        .welcome-subtitle .highlight.green {
          color: var(--highlight-green);
        }

        .welcome-subtitle .highlight.yellow {
          color: var(--highlight-yellow);
        }

        .welcome-subtitle .highlight.red {
          color: var(--highlight-red);
        }

        .welcome-subtitle .highlight.blue {
          color: var(--highlight-blue);
        }
      `
      document.head.appendChild(style)
    }

    // Listen for any key
    this.inputManager.onKeyPress(this.handleKeyPress)

    // Set inactivity timeout - return to Idle after 30s
    this.appState.setTimeout(WelcomeScreen.INACTIVITY_TIMEOUT, 'idle', 'welcome-inactivity')

    debugLog('WelcomeScreen: Active (30s inactivity timer)')
  }

  /**
   * Hide screen - Remove DOM and event listeners
   */
  hide() {
    debugLog('WelcomeScreen: Hide')

    // Clear inactivity timeout
    this.appState.clearTimeout('welcome-inactivity')

    // Stop listening for keys
    this.inputManager.offKeyPress(this.handleKeyPress)

    // Remove element
    if (this.element) {
      this.element.remove()
      this.element = null
    }

    debugLog('WelcomeScreen: Cleaned up')
  }

  /**
   * Handle key press
   * @param {string} key - Pressed key
   */
  handleKeyPress(key) {
    // Reset inactivity timer on any key press
    this.appState.clearTimeout('welcome-inactivity')
    this.appState.setTimeout(WelcomeScreen.INACTIVITY_TIMEOUT, 'idle', 'welcome-inactivity')

    // SPACE or N advances to Gallery screen
    if (key === ' ' || key === 'n' || key === 'N') {
      debugLog('WelcomeScreen: Key pressed - advancing to Gallery')
      this.appState.transition('gallery')
    }
    // Ignore other keys (theme 1-8 handled by ThemeManager, reset M/M+N handled by ResetManager)
  }
}
