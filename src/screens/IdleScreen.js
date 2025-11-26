/**
 * IdleScreen.v2 - Idle/Attract screen with centered text (Figma design)
 *
 * Clean white background with centered title and prompt
 * Advances on any key press
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getResponsiveDimensions } from '../installation/ScreenHelper.js'
import { IdleLeaderboardShowcaseScreen } from './IdleLeaderboardShowcaseScreen.js'
import { debugLog } from '../utils/Logger.js'

export class IdleScreen {
  /**
   * Showcase inactivity timer (2 minutes)
   */
  static SHOWCASE_INACTIVITY_TIMEOUT = 120000

  constructor(appState, inputManager, storageManager) {
    this.appState = appState
    this.inputManager = inputManager
    this.storageManager = storageManager

    // DOM elements
    this.element = null
    this.titleElement = null
    this.promptElement = null

    // Animation state
    this.isActive = false

    // Showcase management
    this.showcaseScreen = null
    this.showcaseTimerHandle = null

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  /**
   * Show screen - Create and display idle screen
   */
  show() {
    debugLog('IdleScreen: Show')
    this.isActive = true

    // Calculate responsive dimensions (using ScreenHelper)
    const { containerWidth, containerHeight } = getResponsiveDimensions()

    // Create main container
    this.element = document.createElement('div')
    this.element.id = 'idle-screen'
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
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      z-index: 100;
      container-type: size; /* Enable Container Queries */
    `

    // Create title container
    const titleContainer = document.createElement('div')
    titleContainer.style.cssText = `
      width: clamp(300px, 61%, 732px);
      min-height: clamp(200px, 24.3cqh, 467px);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: clamp(20px, 5cqh, 96px);
    `

    // Create title element
    this.titleElement = document.createElement('div')
    this.titleElement.textContent = "Conway's\nArcade"
    this.titleElement.style.cssText = `
      width: 100%;
      text-align: center;
      color: var(--text-primary);
      font-size: clamp(48px, 7cqh, 134px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      white-space: pre-line;
      word-wrap: break-word;
    `

    titleContainer.appendChild(this.titleElement)

    // Create prompt container
    const promptContainer = document.createElement('div')
    promptContainer.style.cssText = `
      width: clamp(300px, 53.5%, 642px);
      min-height: clamp(80px, 11.5cqh, 221px);
      display: flex;
      justify-content: center;
      align-items: center;
    `

    // Create prompt element
    this.promptElement = document.createElement('div')
    this.promptElement.textContent = 'Press any button to start'
    this.promptElement.style.cssText = `
      width: 100%;
      text-align: center;
      color: var(--text-secondary);
      font-size: clamp(24px, 2.9cqh, 55px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      word-wrap: break-word;
    `

    promptContainer.appendChild(this.promptElement)

    // Append all elements
    this.element.appendChild(titleContainer)
    this.element.appendChild(promptContainer)
    document.body.appendChild(this.element)

    // Listen for any key press
    this.inputManager.onKeyPress(this.handleKeyPress)

    // Start showcase inactivity timer (2 minutes)
    this.startShowcaseTimer()

    debugLog('IdleScreen: Active (2min showcase timer)')
  }

  /**
   * Start showcase inactivity timer (2 minutes)
   */
  startShowcaseTimer() {
    // Clear existing timer
    if (this.showcaseTimerHandle) {
      clearTimeout(this.showcaseTimerHandle)
    }

    // Set new timer
    this.showcaseTimerHandle = setTimeout(() => {
      debugLog('IdleScreen: Showcase timer triggered - showing leaderboard')
      this.showShowcase()
    }, IdleScreen.SHOWCASE_INACTIVITY_TIMEOUT)
  }

  /**
   * Show showcase screen
   */
  showShowcase() {
    if (!this.showcaseScreen) {
      // Hide text elements (keep video background visible)
      if (this.titleElement) {
        this.titleElement.style.visibility = 'hidden'
      }
      if (this.promptElement) {
        this.promptElement.style.visibility = 'hidden'
      }

      this.showcaseScreen = new IdleLeaderboardShowcaseScreen(
        this.appState,
        this.inputManager,
        this.storageManager,
        () => this.onShowcaseClosed()
      )
      this.showcaseScreen.show()
    }
  }

  /**
   * Handle showcase closed - restart timer
   */
  onShowcaseClosed() {
    // Show text elements again
    if (this.titleElement) {
      this.titleElement.style.visibility = 'visible'
    }
    if (this.promptElement) {
      this.promptElement.style.visibility = 'visible'
    }

    this.showcaseScreen = null
    // Restart 2-minute timer
    this.startShowcaseTimer()
    debugLog('IdleScreen: Showcase closed - timer restarted')
  }

  /**
   * Hide screen - Clean up and remove elements
   */
  hide() {
    debugLog('IdleScreen: Hide')
    this.isActive = false

    // Clear showcase timer
    if (this.showcaseTimerHandle) {
      clearTimeout(this.showcaseTimerHandle)
      this.showcaseTimerHandle = null
    }

    // Close showcase if active
    if (this.showcaseScreen) {
      this.showcaseScreen.hide()
      this.showcaseScreen = null
    }

    // Stop listening for keys
    this.inputManager.offKeyPress(this.handleKeyPress)

    // Remove element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    // Clear references
    this.element = null
    this.titleElement = null
    this.promptElement = null

    debugLog('IdleScreen: Cleaned up')
  }

  /**
   * Handle key press
   * @param {string} key - Pressed key
   */
  handleKeyPress(key) {
    // If showcase is active, let it handle the key
    if (this.showcaseScreen && this.showcaseScreen.isActive) {
      return
    }

    // Clear and restart showcase timer on user interaction
    this.startShowcaseTimer()

    // SPACE or N advances to Welcome screen
    if (key === ' ' || key === 'n' || key === 'N') {
      debugLog(`IdleScreen: Key "${key}" pressed - advancing to Welcome`)
      this.appState.transition('welcome')
    }
    // Ignore other keys (theme 1-8 handled by ThemeManager, reset M+N handled by ResetManager)
  }
}
