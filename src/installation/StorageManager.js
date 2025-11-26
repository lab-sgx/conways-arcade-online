/**
 * StorageManager - localStorage wrapper for leaderboard persistence
 *
 * Manages score persistence with top 50 leaderboards per game
 * Handles quota exceeded errors gracefully
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog, debugWarn, debugError } from '../utils/Logger.js'

export class StorageManager {
  /**
   * Storage key format: scores_{gameName}
   */
  static KEY_PREFIX = 'scores_'

  /**
   * Maximum scores to keep per game
   */
  static MAX_SCORES = 50

  constructor() {
    // Test localStorage availability
    this.isAvailable = this.testLocalStorage()

    if (!this.isAvailable) {
      debugWarn('localStorage not available - scores will not persist')
    }
  }

  /**
   * Test if localStorage is available
   * @returns {boolean} - True if available
   */
  testLocalStorage() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Save score to leaderboard
   * Automatically maintains top 10 only
   * @param {string} gameName - Game identifier
   * @param {string} playerName - 3-letter player name
   * @param {number} score - Final score
   * @returns {boolean} - Success status
   */
  saveScore(gameName, playerName, score) {
    if (!this.isAvailable) {
      debugWarn('Cannot save score - localStorage not available')
      return false
    }

    // Validate inputs
    if (!gameName || typeof gameName !== 'string') {
      debugError('Invalid gameName:', gameName)
      return false
    }

    if (!playerName || typeof playerName !== 'string' || playerName.length !== 3) {
      debugError('Invalid playerName (must be 3 letters):', playerName)
      return false
    }

    if (typeof score !== 'number' || score < 0) {
      debugError('Invalid score:', score)
      return false
    }

    try {
      // Get existing scores
      const scores = this.getScores(gameName)

      // Add new score
      scores.push({
        name: playerName.toUpperCase(),
        score: score,
        date: new Date().toISOString()
      })

      // Sort descending by score
      scores.sort((a, b) => b.score - a.score)

      // Keep only top 50
      const top50 = scores.slice(0, StorageManager.MAX_SCORES)

      // Save to localStorage
      const key = StorageManager.KEY_PREFIX + gameName
      localStorage.setItem(key, JSON.stringify(top50))

      debugLog(`Score saved: ${gameName} - ${playerName}: ${score}`)
      return true

    } catch (error) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        debugWarn('localStorage quota exceeded, clearing old scores')
        this.handleQuotaExceeded(gameName)

        // Retry save
        try {
          const scores = this.getScores(gameName)
          scores.push({
            name: playerName.toUpperCase(),
            score: score,
            date: new Date().toISOString()
          })
          scores.sort((a, b) => b.score - a.score)
          const top50 = scores.slice(0, StorageManager.MAX_SCORES)
          const key = StorageManager.KEY_PREFIX + gameName
          localStorage.setItem(key, JSON.stringify(top50))
          debugLog('Score saved after quota cleanup')
          return true
        } catch (retryError) {
          debugError('Failed to save score after retry:', retryError)
          return false
        }
      } else {
        debugError('Error saving score:', error)
        return false
      }
    }
  }

  /**
   * Get top 50 scores for game
   * @param {string} gameName - Game identifier
   * @returns {Array} - Array of {name, score, date} objects, sorted descending
   */
  getScores(gameName) {
    if (!this.isAvailable) {
      return []
    }

    if (!gameName || typeof gameName !== 'string') {
      debugError('Invalid gameName:', gameName)
      return []
    }

    try {
      const key = StorageManager.KEY_PREFIX + gameName
      const data = localStorage.getItem(key)

      if (!data) {
        return []
      }

      const scores = JSON.parse(data)

      // Validate data structure
      if (!Array.isArray(scores)) {
        debugError('Invalid scores data structure for', gameName)
        return []
      }

      // Validate each score object
      const validScores = scores.filter(score => {
        return score &&
               typeof score.name === 'string' &&
               typeof score.score === 'number' &&
               typeof score.date === 'string'
      })

      // Sort descending by score
      validScores.sort((a, b) => b.score - a.score)

      return validScores.slice(0, StorageManager.MAX_SCORES)

    } catch (error) {
      debugError('Error loading scores:', error)
      return []
    }
  }

  /**
   * Check if score makes top 50
   * @param {string} gameName - Game identifier
   * @param {number} score - Score to check
   * @returns {boolean} - True if score makes top 50
   */
  isHighScore(gameName, score) {
    if (typeof score !== 'number' || score < 0) {
      return false
    }

    const scores = this.getScores(gameName)

    // If less than 50 scores, always a high score
    if (scores.length < StorageManager.MAX_SCORES) {
      return true
    }

    // Check if score beats lowest top 50 score
    const lowestTopScore = scores[scores.length - 1].score
    return score > lowestTopScore
  }

  /**
   * Clear all scores for game
   * @param {string} gameName - Game identifier
   * @returns {boolean} - Success status
   */
  clearScores(gameName) {
    if (!this.isAvailable) {
      return false
    }

    if (!gameName || typeof gameName !== 'string') {
      debugError('Invalid gameName:', gameName)
      return false
    }

    try {
      const key = StorageManager.KEY_PREFIX + gameName
      localStorage.removeItem(key)
      debugLog(`Cleared scores for: ${gameName}`)
      return true
    } catch (error) {
      debugError('Error clearing scores:', error)
      return false
    }
  }

  /**
   * Handle quota exceeded by removing oldest scores
   * @param {string} currentGame - Game to preserve
   */
  handleQuotaExceeded(currentGame) {
    debugLog('Handling localStorage quota exceeded')

    try {
      // Get all score keys
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(StorageManager.KEY_PREFIX)) {
          keys.push(key)
        }
      }

      // Clear scores for games other than current game
      keys.forEach(key => {
        if (key !== StorageManager.KEY_PREFIX + currentGame) {
          localStorage.removeItem(key)
          debugLog('Removed old scores:', key)
        }
      })

    } catch (error) {
      debugError('Error handling quota:', error)
    }
  }

  /**
   * Get all games with saved scores
   * @returns {Array<string>} - Array of game names
   */
  getAllGames() {
    if (!this.isAvailable) {
      return []
    }

    try {
      const games = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(StorageManager.KEY_PREFIX)) {
          const gameName = key.substring(StorageManager.KEY_PREFIX.length)
          games.push(gameName)
        }
      }
      return games
    } catch (error) {
      debugError('Error getting games:', error)
      return []
    }
  }

  /**
   * Get total number of scores across all games
   * @returns {number} - Total score count
   */
  getTotalScoreCount() {
    if (!this.isAvailable) {
      return 0
    }

    const games = this.getAllGames()
    let total = 0

    games.forEach(game => {
      const scores = this.getScores(game)
      total += scores.length
    })

    return total
  }
}
