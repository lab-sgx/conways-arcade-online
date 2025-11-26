/**
 * InputManager - Keyboard input manager for arcade controls
 *
 * Handles keyboard input with arcade-style controls
 * Prevents browser default behaviors
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog, debugError } from '../utils/Logger.js'

export class InputManager {
  /**
   * Key codes for arcade controls
   */
  static KEYS = {
    SPACE: ' ',
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    ONE: '1',
    TWO: '2',
    THREE: '3',
    FOUR: '4',
    FIVE: '5',
    SIX: '6',
    SEVEN: '7',
    A: 'a',
    D: 'd',
    W: 'w',
    S: 's'
  }

  constructor() {
    // Track currently pressed keys
    this.pressedKeys = new Map()

    // Track keys that were just pressed this frame
    this.justPressedKeys = new Set()

    // Callback for any key press
    this.keyPressCallbacks = []

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)

    // Start listening
    this.startListening()

    // Prevent browser defaults
    this.preventDefaults()
  }

  /**
   * Start listening for keyboard events
   */
  startListening() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    debugLog('InputManager: Listening for keyboard events')
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    debugLog('InputManager: Stopped listening')
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const key = event.key

    // Prevent browser defaults for arcade keys
    if (this.isArcadeKey(key)) {
      event.preventDefault()
    }

    // Track if this is first press
    if (!this.pressedKeys.has(key)) {
      this.justPressedKeys.add(key)
      this.pressedKeys.set(key, true)

      // Trigger callbacks
      this.triggerKeyPressCallbacks(key, event)

      // Auto-clear justPressed after short delay
      setTimeout(() => {
        this.justPressedKeys.delete(key)
      }, 100)
    }
  }

  /**
   * Handle keyup event
   * @param {KeyboardEvent} event
   */
  handleKeyUp(event) {
    const key = event.key
    this.pressedKeys.delete(key)
    this.justPressedKeys.delete(key)
  }

  /**
   * Check if key is currently pressed
   * @param {string} key - Key to check
   * @returns {boolean}
   */
  isPressed(key) {
    return this.pressedKeys.has(key)
  }

  /**
   * Check if key was just pressed (single frame)
   * @param {string} key - Key to check
   * @returns {boolean}
   */
  wasJustPressed(key) {
    return this.justPressedKeys.has(key)
  }

  /**
   * Register callback for any key press
   * @param {function} callback - Callback(key, event)
   */
  onKeyPress(callback) {
    if (typeof callback !== 'function') {
      debugError('Callback must be a function')
      return
    }
    this.keyPressCallbacks.push(callback)
  }

  /**
   * Remove key press callback
   * @param {function} callback - Callback to remove
   */
  offKeyPress(callback) {
    const index = this.keyPressCallbacks.indexOf(callback)
    if (index > -1) {
      this.keyPressCallbacks.splice(index, 1)
    }
  }

  /**
   * Trigger all key press callbacks
   * @param {string} key - Pressed key
   * @param {KeyboardEvent} event - Original event
   */
  triggerKeyPressCallbacks(key, event) {
    this.keyPressCallbacks.forEach(callback => {
      try {
        callback(key, event)
      } catch (error) {
        debugError('Key press callback error:', error)
      }
    })
  }

  /**
   * Check if key is an arcade control key
   * @param {string} key
   * @returns {boolean}
   */
  isArcadeKey(key) {
    const arcadeKeys = [
      ' ',           // Space
      'Escape',
      'Enter',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      '1', '2', '3', '4', '5', '6', '7', '8',
      'a', 'A', 'd', 'D', 'w', 'W', 's', 'S'
    ]
    return arcadeKeys.includes(key)
  }

  /**
   * Get theme from key (for theme system)
   * Keys 1-4 trigger day mode, keys 5-8 trigger night mode
   * @param {string} key
   * @returns {string|null} 'day', 'night', or null
   */
  getThemeFromKey(key) {
    if (['1', '2', '3', '4'].includes(key)) {
      return 'day'
    }
    if (['5', '6', '7', '8'].includes(key)) {
      return 'night'
    }
    return null
  }

  /**
   * Prevent browser default behaviors
   *
   * NOTE: We do NOT prevent Space here because it's handled in handleKeyDown()
   * which can be disabled via stopListening(). This allows iframes to receive
   * Space events when InputManager is stopped.
   */
  preventDefaults() {
    // Prevent F11 fullscreen (optional)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
      }
    })

    // Prevent Ctrl+W (close window)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
      }
    })

    // Prevent browser back (Backspace)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target === document.body) {
        e.preventDefault()
      }
    })

    debugLog('InputManager: Browser defaults prevented (Space handled in handleKeyDown)')
  }

  /**
   * Clear all pressed keys state
   */
  clear() {
    this.pressedKeys.clear()
    this.justPressedKeys.clear()
  }

  /**
   * Get all currently pressed keys
   * @returns {Array<string>}
   */
  getPressedKeys() {
    return Array.from(this.pressedKeys.keys())
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy() {
    this.stopListening()
    this.keyPressCallbacks = []
    this.clear()
    debugLog('InputManager: Destroyed')
  }
}
