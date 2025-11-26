/**
 * AppState - Centralized state machine for installation screen navigation
 *
 * Manages 8 screen states and session data
 * Implements Observer pattern for screen change notifications
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog, debugError } from '../utils/Logger.js'

export class AppState {
  // Valid screen states
  static SCREENS = {
    IDLE: 'idle',
    WELCOME: 'welcome',
    GALLERY: 'gallery',
    CODE: 'code',
    GAME: 'game',
    SCORE: 'score',
    LEADERBOARD: 'leaderboard',
    QR: 'qr'
  }

  // Valid transitions (from → [to])
  static TRANSITIONS = {
    idle: ['welcome'],
    welcome: ['gallery', 'idle'],
    gallery: ['code', 'idle'],
    code: ['game', 'idle'],
    game: ['score', 'idle'],
    score: ['leaderboard', 'game', 'idle'],
    leaderboard: ['qr', 'gallery', 'idle'],
    qr: ['idle']
  }

  constructor() {
    // Current screen state
    this.currentScreen = AppState.SCREENS.IDLE

    // Session data
    this.selectedGame = null      // Selected game object: { id, name, path }
    this.currentScore = null       // Final score from game
    this.playerName = null         // 3-letter name (A-Z)
    this.scoreTimestamp = null     // Timestamp of saved score (for exact identification)

    // Timeout handles for auto-advance
    this.timeoutHandles = {}

    // Observer callbacks
    this.observers = []
  }

  /**
   * Transition to new screen with validation
   * @param {string} newScreen - Target screen state
   * @returns {boolean} - Success status
   */
  transition(newScreen) {
    // Validate screen exists
    if (!Object.values(AppState.SCREENS).includes(newScreen)) {
      debugError(`Invalid screen: ${newScreen}`)
      return false
    }

    // Validate transition is allowed
    const validTransitions = AppState.TRANSITIONS[this.currentScreen]
    if (!validTransitions.includes(newScreen)) {
      debugError(`Invalid transition: ${this.currentScreen} → ${newScreen}`)
      return false
    }

    // Clear all timeouts before transition
    this.clearAllTimeouts()

    // Update state
    const previousScreen = this.currentScreen
    this.currentScreen = newScreen

    debugLog(`Screen transition: ${previousScreen} → ${newScreen}`)

    // Notify observers
    this.notifyObservers(newScreen, previousScreen)

    return true
  }

  /**
   * Set selected game
   * @param {object} game - Game object { id, name, path }
   */
  setGame(game) {
    if (!game || !game.id || !game.name || !game.path) {
      debugError('Invalid game object:', game)
      return
    }
    this.selectedGame = game
    debugLog('Selected game:', game.name)
  }

  /**
   * Set final score from game
   * @param {number} score - Final score
   */
  setScore(score) {
    if (typeof score !== 'number' || score < 0) {
      debugError('Invalid score:', score)
      return
    }
    this.currentScore = score
    debugLog('Score set:', score)
  }

  /**
   * Set player name (3 letters A-Z)
   * @param {string} name - Player name
   */
  setPlayerName(name) {
    if (typeof name !== 'string' || name.length !== 3 || !/^[A-Z]{3}$/.test(name)) {
      debugError('Invalid player name (must be 3 letters A-Z):', name)
      return
    }
    this.playerName = name
    debugLog('Player name set:', name)
  }

  /**
   * Set score timestamp (for exact score identification)
   * @param {string} timestamp - ISO timestamp from saved score
   */
  setScoreTimestamp(timestamp) {
    if (typeof timestamp !== 'string') {
      debugError('Invalid score timestamp:', timestamp)
      return
    }
    this.scoreTimestamp = timestamp
    debugLog('Score timestamp set:', timestamp)
  }

  /**
   * Reset all session data and return to idle
   */
  reset() {
    debugLog('Resetting AppState to idle')

    // Clear session data
    this.selectedGame = null
    this.currentScore = null
    this.playerName = null
    this.scoreTimestamp = null

    // Clear all timeouts
    this.clearAllTimeouts()

    // Force transition to idle (bypass validation)
    const previousScreen = this.currentScreen
    this.currentScreen = AppState.SCREENS.IDLE

    // Notify observers
    this.notifyObservers(AppState.SCREENS.IDLE, previousScreen)
  }

  /**
   * Register screen change observer
   * @param {function} callback - Callback(newScreen, previousScreen)
   */
  addObserver(callback) {
    if (typeof callback !== 'function') {
      debugError('Observer must be a function')
      return
    }
    this.observers.push(callback)
    debugLog('Observer registered, total:', this.observers.length)
  }

  /**
   * Subscribe to state changes (alternative to addObserver)
   * @param {function} callback - Callback receives full state object
   * @returns {function} - Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      debugError('Subscribe callback must be a function')
      return () => { }
    }

    // Wrap callback to provide state object
    const wrappedCallback = () => {
      callback(this.getState())
    }

    this.observers.push(wrappedCallback)
    debugLog('Subscriber registered, total:', this.observers.length)

    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(wrappedCallback)
      if (index > -1) {
        this.observers.splice(index, 1)
        debugLog('Subscriber removed, total:', this.observers.length)
      }
    }
  }

  /**
   * Notify all observers of screen change
   * @param {string} newScreen - New screen state
   * @param {string} previousScreen - Previous screen state
   */
  notifyObservers(newScreen, previousScreen) {
    this.observers.forEach(callback => {
      try {
        callback(newScreen, previousScreen)
      } catch (error) {
        debugError('Observer callback error:', error)
      }
    })
  }

  /**
   * Set auto-advance timeout
   * @param {number} delay - Delay in milliseconds
   * @param {string} targetScreen - Screen to transition to
   * @param {string} timeoutId - Optional ID for this timeout
   */
  setTimeout(delay, targetScreen, timeoutId = 'default') {
    // Clear existing timeout with this ID
    if (this.timeoutHandles[timeoutId]) {
      clearTimeout(this.timeoutHandles[timeoutId])
    }

    // Set new timeout
    this.timeoutHandles[timeoutId] = setTimeout(() => {
      debugLog(`Auto-advance timeout: ${this.currentScreen} → ${targetScreen}`)
      this.transition(targetScreen)
      delete this.timeoutHandles[timeoutId]
    }, delay)

    debugLog(`Timeout set: ${delay}ms → ${targetScreen} (ID: ${timeoutId})`)
  }

  /**
   * Clear specific timeout
   * @param {string} timeoutId - Timeout ID to clear
   */
  clearTimeout(timeoutId) {
    if (this.timeoutHandles[timeoutId]) {
      clearTimeout(this.timeoutHandles[timeoutId])
      delete this.timeoutHandles[timeoutId]
      debugLog(`Cleared timeout: ${timeoutId}`)
    }
  }

  /**
   * Clear all active timeouts
   */
  clearAllTimeouts() {
    Object.keys(this.timeoutHandles).forEach(id => {
      clearTimeout(this.timeoutHandles[id])
    })
    this.timeoutHandles = {}
    debugLog('All timeouts cleared')
  }

  /**
   * Get current state snapshot
   * @returns {object} - Current state
   */
  getState() {
    return {
      currentScreen: this.currentScreen,
      selectedGame: this.selectedGame,
      currentScore: this.currentScore,
      playerName: this.playerName,
      scoreTimestamp: this.scoreTimestamp
    }
  }
}
