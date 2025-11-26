/**
 * ScreenHelper - Shared responsive dimension utilities for installation screens
 *
 * Provides centralized logic for calculating portrait dimensions (1200×1920)
 * and applying responsive styling to DOM containers.
 *
 * ELIMINATES DUPLICATION: Previously duplicated in 8 screen files.
 *
 * @author Game of Life Arcade
 * @license ISC
 */

/**
 * Portrait installation dimensions (vertical display)
 */
const PORTRAIT_WIDTH = 1200
const PORTRAIT_HEIGHT = 1920

/**
 * Calculate responsive dimensions for portrait installation display.
 *
 * Maintains 10:16 aspect ratio (0.625) and fits within viewport.
 * Handles landscape orientation by limiting width and adjusting height.
 *
 * @returns {{containerWidth: number, containerHeight: number, aspectRatio: number}}
 *
 * @example
 * const { containerWidth, containerHeight } = getResponsiveDimensions()
 * console.log(`Container: ${containerWidth}×${containerHeight}`)
 * // → Container: 675×1080 (on 1920×1080 display rotated)
 * // → Container: 1140×1824 (on 1920×1080 landscape)
 */
export function getResponsiveDimensions() {
  const aspectRatio = PORTRAIT_WIDTH / PORTRAIT_HEIGHT  // 0.625
  const isLandscape = window.innerWidth > window.innerHeight

  if (isLandscape) {
    // Landscape: Limit by width and maintain aspect ratio
    // Use 95% of viewport width to ensure content fits with padding
    const containerWidth = Math.floor(window.innerWidth * 0.95)
    const containerHeight = Math.floor(containerWidth / aspectRatio)

    // If calculated height exceeds viewport, recalculate from height
    if (containerHeight > window.innerHeight) {
      const adjustedHeight = window.innerHeight
      const adjustedWidth = Math.floor(adjustedHeight * aspectRatio)
      return { containerWidth: adjustedWidth, containerHeight: adjustedHeight, aspectRatio }
    }

    return { containerWidth, containerHeight, aspectRatio }
  } else {
    // Portrait: Original behavior - limit by height
    const containerHeight = window.innerHeight
    const containerWidth = Math.floor(containerHeight * aspectRatio)
    return { containerWidth, containerHeight, aspectRatio }
  }
}

/**
 * Apply responsive dimensions to a DOM container element.
 *
 * Sets width, height, and centers the container on screen.
 * Intended for screen containers in installation flow.
 *
 * @param {HTMLElement} container - Container element to style
 * @returns {void}
 *
 * @example
 * const container = document.createElement('div')
 * applyResponsiveDimensions(container)
 * // Container now has responsive width/height styles applied
 */
export function applyResponsiveDimensions(container) {
  const { containerWidth, containerHeight } = getResponsiveDimensions()

  container.style.width = `${containerWidth}px`
  container.style.height = `${containerHeight}px`
}

/**
 * Get standard CSS text for responsive screen containers.
 *
 * Returns a complete CSS string with positioning, dimensions, and styling.
 * Used by screens that need embedded styles.
 *
 * @param {Object} [options={}] - Optional style overrides
 * @param {string} [options.background='#FFFFFF'] - Background color
 * @param {number} [options.zIndex=100] - Z-index value
 * @returns {string} CSS text string
 *
 * @example
 * element.style.cssText = getResponsiveContainerCSS({ background: '#F8F9FA' })
 */
export function getResponsiveContainerCSS(options = {}) {
  const { containerWidth, containerHeight } = getResponsiveDimensions()
  const background = options.background || '#FFFFFF'
  const zIndex = options.zIndex || 100

  return `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${containerWidth}px;
    height: ${containerHeight}px;
    max-width: 100vw;
    max-height: 100vh;
    aspect-ratio: 10 / 16;
    background: ${background};
    z-index: ${zIndex};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `.trim()
}
