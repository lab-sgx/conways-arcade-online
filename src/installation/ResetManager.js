/**
 * ResetManager - Global reset system with visual feedback
 *
 * Two reset levels:
 * - Soft Reset (M for 3s): Clear session, keep localStorage
 * - Hard Reset (M+N for 10s): Clear localStorage completely + session
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog, debugError } from '../utils/Logger.js'

export class ResetManager {
  /**
   * Reset configuration
   */
  static CONFIG = {
    SOFT_DURATION: 3000,   // 3 seconds
    HARD_DURATION: 10000,  // 10 seconds
    KEY_M: 'm',
    KEY_N: 'n'
  }

  /**
   * Initialize reset manager
   * @param {InputManager} inputManager - Keyboard input manager
   * @param {AppState} appState - Application state manager
   * @param {StorageManager} storageManager - localStorage manager
   * @param {ResetCircleUI} resetCircleUI - Visual feedback component
   */
  constructor(inputManager, appState, storageManager, resetCircleUI) {
    if (!inputManager || !appState || !storageManager || !resetCircleUI) {
      throw new Error('ResetManager: Missing required dependencies')
    }

    this.inputManager = inputManager
    this.appState = appState
    this.storageManager = storageManager
    this.resetCircleUI = resetCircleUI

    // Reset state
    this.isResetting = false
    this.resetType = null        // 'soft' | 'hard' | null
    this.startTime = null        // Timestamp when reset started
    this.requiredDuration = null // Duration required (3000 or 10000)
    this.animationFrameId = null // requestAnimationFrame ID

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.updateProgress = this.updateProgress.bind(this)

    debugLog('ResetManager: Initialized')
  }

  /**
   * Start listening for reset key combinations
   */
  startListening() {
    // Listen to keydown directly on window (works even when InputManager is stopped)
    // NOTE: Does NOT work in GameScreen when iframe has focus (events don't propagate from iframe)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    debugLog('ResetManager: Listening for M and M+N combinations')
  }

  /**
   * Stop listening for reset keys
   */
  stopListening() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)

    // Cancel any active reset
    if (this.isResetting) {
      this.cancel()
    }

    debugLog('ResetManager: Stopped listening')
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    const key = event.key
    const keyLower = key.toLowerCase()

    // Only M or N keys can initiate reset
    if (keyLower !== ResetManager.CONFIG.KEY_M && keyLower !== ResetManager.CONFIG.KEY_N) {
      return
    }

    // Check if M is pressed (check both InputManager and native event)
    const mPressed = this.inputManager.isPressed('m') || this.inputManager.isPressed('M') ||
                     keyLower === 'm'
    const nPressed = this.inputManager.isPressed('n') || this.inputManager.isPressed('N') ||
                     keyLower === 'n'

    // Determine reset type
    let newResetType = null

    if (mPressed && nPressed) {
      // Hard reset: M + N (allowed on all screens except GameScreen)
      newResetType = 'hard'
    } else if (mPressed && !nPressed) {
      // Soft reset: M only (NOT allowed on IdleScreen)
      const currentScreen = this.appState.getState().currentScreen
      if (currentScreen === 'idle') {
        return // Ignore soft reset on IdleScreen
      }
      newResetType = 'soft'
    } else {
      // N pressed first (without M) → ignore
      return
    }

    // If already resetting, check if type changed
    if (this.isResetting) {
      if (this.resetType !== newResetType) {
        // Type changed (soft → hard), restart
        debugLog(`ResetManager: Transition ${this.resetType} → ${newResetType}`)
        this.cancel()
        this.startReset(newResetType)
      }
      // Same type, already running, do nothing
      return
    }

    // Start new reset
    this.startReset(newResetType)
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} event
   */
  handleKeyUp(event) {
    const key = event.key.toLowerCase()

    // Only care about M or N
    if (key !== ResetManager.CONFIG.KEY_M && key !== ResetManager.CONFIG.KEY_N) {
      return
    }

    // If not resetting, ignore
    if (!this.isResetting) {
      return
    }

    // Check if required keys are still pressed
    const mPressed = this.inputManager.isPressed('m') || this.inputManager.isPressed('M')
    const nPressed = this.inputManager.isPressed('n') || this.inputManager.isPressed('N')

    // Soft reset: requires M only
    if (this.resetType === 'soft' && !mPressed) {
      debugLog('ResetManager: Soft reset canceled (M released)')
      this.cancel()
      return
    }

    // Hard reset: requires both M and N
    if (this.resetType === 'hard' && (!mPressed || !nPressed)) {
      debugLog('ResetManager: Hard reset canceled (M or N released)')
      this.cancel()
      return
    }
  }

  /**
   * Start reset timer and animation
   * @param {string} type - 'soft' or 'hard'
   */
  startReset(type) {
    this.isResetting = true
    this.resetType = type
    this.startTime = Date.now()
    this.requiredDuration = type === 'soft'
      ? ResetManager.CONFIG.SOFT_DURATION
      : ResetManager.CONFIG.HARD_DURATION

    // Show circle UI
    this.resetCircleUI.show(type, 0)

    // Start animation loop
    this.updateProgress()

    debugLog(`ResetManager: Started ${type} reset (${this.requiredDuration}ms)`)
  }

  /**
   * Update progress animation (called via requestAnimationFrame)
   */
  updateProgress() {
    if (!this.isResetting) {
      return
    }

    // Check if required keys are still pressed
    const mPressed = this.inputManager.isPressed('m') || this.inputManager.isPressed('M')
    const nPressed = this.inputManager.isPressed('n') || this.inputManager.isPressed('N')

    // Cancel if required keys released
    if (this.resetType === 'soft' && !mPressed) {
      debugLog('ResetManager: Soft reset canceled (M released)')
      this.cancel()
      return
    }

    if (this.resetType === 'hard' && (!mPressed || !nPressed)) {
      debugLog('ResetManager: Hard reset canceled (M or N released)')
      this.cancel()
      return
    }

    const elapsed = Date.now() - this.startTime
    const progress = Math.min(elapsed / this.requiredDuration, 1)

    // Update UI
    this.resetCircleUI.updateProgress(progress)

    // Check if complete
    if (progress >= 1) {
      debugLog(`ResetManager: ${this.resetType} reset completed`)
      this.executeReset()
      return
    }

    // Continue animation
    this.animationFrameId = requestAnimationFrame(this.updateProgress)
  }

  /**
   * Execute the appropriate reset action
   */
  executeReset() {
    const type = this.resetType

    // Cancel animation
    this.cancel()

    // Execute based on type
    if (type === 'soft') {
      this.softReset()
    } else if (type === 'hard') {
      this.hardReset()
    }
  }

  /**
   * Soft Reset: Clear session, keep localStorage
   */
  softReset() {
    debugLog('ResetManager: Executing SOFT RESET')
    debugLog('- Clearing session data')
    debugLog('- Keeping localStorage')
    debugLog('- Transitioning to Idle screen')

    // Clear session via AppState
    this.appState.reset()

    debugLog('ResetManager: Soft reset complete')
  }

  /**
   * Hard Reset: Clear localStorage completely + session
   */
  hardReset() {
    debugLog('ResetManager: Executing HARD RESET')
    debugLog('- Clearing ALL localStorage')
    debugLog('- Clearing session data')
    debugLog('- Transitioning to Idle screen')

    // Clear localStorage
    try {
      localStorage.clear()
      debugLog('ResetManager: localStorage cleared')
    } catch (error) {
      debugError('ResetManager: Failed to clear localStorage:', error)
    }

    // Clear session via AppState
    this.appState.reset()

    debugLog('ResetManager: Hard reset complete')
  }

  /**
   * Cancel ongoing reset
   */
  cancel() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.resetCircleUI.hide()

    this.isResetting = false
    this.resetType = null
    this.startTime = null
    this.requiredDuration = null

    debugLog('ResetManager: Reset canceled')
  }

  /**
   * Get current reset state
   * @returns {object} - { type, progress, isResetting }
   */
  getResetState() {
    if (!this.isResetting) {
      return {
        type: null,
        progress: 0,
        isResetting: false
      }
    }

    const elapsed = Date.now() - this.startTime
    const progress = Math.min(elapsed / this.requiredDuration, 1)

    return {
      type: this.resetType,
      progress: progress,
      isResetting: true
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopListening()
    this.resetCircleUI.destroy()
    debugLog('ResetManager: Destroyed')
  }
}
