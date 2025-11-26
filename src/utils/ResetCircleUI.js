/**
 * ResetCircleUI - Visual feedback for reset system
 *
 * Displays a circular progress indicator in the top-right corner
 * - Blue for soft reset (3s)
 * - Red for hard reset (10s)
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { debugLog, debugError } from './Logger.js'

export class ResetCircleUI {
  /**
   * Color configuration
   */
  static COLORS = {
    SOFT_RESET: '#428EF4',  // Google Blue
    HARD_RESET: '#FF5145'   // Google Red
  }

  /**
   * Circle dimensions
   */
  static DIMENSIONS = {
    SIZE: 60,           // Container size
    RADIUS: 26,         // Circle radius
    STROKE_WIDTH: 4,    // Stroke thickness
    CIRCUMFERENCE: 163.36  // 2 * PI * RADIUS
  }

  /**
   * Initialize ResetCircleUI
   */
  constructor() {
    // State
    this.isVisible = false
    this.currentType = null      // 'soft' | 'hard' | null
    this.currentProgress = 0     // 0.0 to 1.0

    // DOM elements
    this.container = null
    this.svg = null
    this.circle = null

    debugLog('ResetCircleUI: Initialized')
  }

  /**
   * Show circle with initial state
   * @param {string} type - 'soft' or 'hard'
   * @param {number} progress - Initial progress (0.0 to 1.0)
   */
  show(type, progress = 0) {
    if (!type || (type !== 'soft' && type !== 'hard')) {
      debugError('ResetCircleUI: Invalid type:', type)
      return
    }

    debugLog(`ResetCircleUI: Show (${type}, ${progress})`)

    this.isVisible = true
    this.currentType = type
    this.currentProgress = progress

    // Create DOM if needed
    if (!this.container) {
      this.createDOM()
    }

    // Update color
    const color = type === 'soft'
      ? ResetCircleUI.COLORS.SOFT_RESET
      : ResetCircleUI.COLORS.HARD_RESET

    this.circle.setAttribute('stroke', color)

    // Update progress
    this.updateProgress(progress)

    // Show container
    this.container.style.display = 'block'
  }

  /**
   * Hide circle
   */
  hide() {
    if (!this.isVisible) {
      return
    }

    debugLog('ResetCircleUI: Hide')

    this.isVisible = false
    this.currentType = null
    this.currentProgress = 0

    if (this.container) {
      this.container.style.display = 'none'
    }
  }

  /**
   * Update progress (0.0 to 1.0)
   * @param {number} progress - Progress value
   */
  updateProgress(progress) {
    if (!this.isVisible || !this.circle) {
      return
    }

    // Clamp progress
    const clampedProgress = Math.max(0, Math.min(1, progress))
    this.currentProgress = clampedProgress

    // Calculate stroke-dashoffset
    // Progress 0 → offset = CIRCUMFERENCE (empty)
    // Progress 1 → offset = 0 (full)
    const offset = ResetCircleUI.DIMENSIONS.CIRCUMFERENCE * (1 - clampedProgress)

    this.circle.setAttribute('stroke-dashoffset', offset)
  }

  /**
   * Create DOM elements
   */
  createDOM() {
    // Create container
    this.container = document.createElement('div')
    this.container.id = 'reset-circle-ui'
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: ${ResetCircleUI.DIMENSIONS.SIZE}px;
      height: ${ResetCircleUI.DIMENSIONS.SIZE}px;
      z-index: 9999;
      pointer-events: none;
      display: none;
    `

    // Create SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svg.setAttribute('width', ResetCircleUI.DIMENSIONS.SIZE)
    this.svg.setAttribute('height', ResetCircleUI.DIMENSIONS.SIZE)
    this.svg.setAttribute('viewBox', `0 0 ${ResetCircleUI.DIMENSIONS.SIZE} ${ResetCircleUI.DIMENSIONS.SIZE}`)

    // Create circle
    this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    const center = ResetCircleUI.DIMENSIONS.SIZE / 2
    this.circle.setAttribute('cx', center)
    this.circle.setAttribute('cy', center)
    this.circle.setAttribute('r', ResetCircleUI.DIMENSIONS.RADIUS)
    this.circle.setAttribute('fill', 'none')
    this.circle.setAttribute('stroke', ResetCircleUI.COLORS.SOFT_RESET)
    this.circle.setAttribute('stroke-width', ResetCircleUI.DIMENSIONS.STROKE_WIDTH)
    this.circle.setAttribute('stroke-linecap', 'round')

    // Set up stroke-dasharray for progress animation
    // dasharray = circumference (so one dash = full circle)
    // dashoffset = how much to offset (controls progress)
    this.circle.setAttribute('stroke-dasharray', ResetCircleUI.DIMENSIONS.CIRCUMFERENCE)
    this.circle.setAttribute('stroke-dashoffset', ResetCircleUI.DIMENSIONS.CIRCUMFERENCE)

    // Rotate circle so progress starts from top (12 o'clock)
    this.circle.setAttribute('transform', `rotate(-90 ${center} ${center})`)

    // Add circle to SVG
    this.svg.appendChild(this.circle)

    // Add SVG to container
    this.container.appendChild(this.svg)

    // Add container to body
    document.body.appendChild(this.container)

    debugLog('ResetCircleUI: DOM created')
  }

  /**
   * Get current state
   * @returns {object} - { isVisible, type, progress }
   */
  getState() {
    return {
      isVisible: this.isVisible,
      type: this.currentType,
      progress: this.currentProgress
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.container) {
      this.container.remove()
      this.container = null
      this.svg = null
      this.circle = null
    }

    this.isVisible = false
    this.currentType = null
    this.currentProgress = 0

    debugLog('ResetCircleUI: Destroyed')
  }
}
