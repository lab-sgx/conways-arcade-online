/**
 * GalleryScreen.v2 - 3D Carousel Prompt Library
 *
 * Horizontal 3D slider showing game prompts
 * Each game displays the AI prompt used to create it
 *
 * @author Game of Life Arcade
 * @license ISC
 */

import { getResponsiveDimensions } from '../installation/ScreenHelper.js'
import { GAMES } from '../installation/GameRegistry.js'
import { debugLog } from '../utils/Logger.js'

export class GalleryScreen {
  /**
   * Inactivity timeout (30 seconds) - returns to Idle if no key pressed
   */
  static INACTIVITY_TIMEOUT = 30000

  constructor(appState, inputManager) {
    this.appState = appState
    this.inputManager = inputManager

    // DOM elements
    this.element = null
    this.cardsContainer = null
    this.leftArrow = null
    this.rightArrow = null

    // Carousel state
    this.currentIndex = 0
    this.isAnimating = false

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  /**
   * Show screen - Create 3D carousel
   */
  show() {
    debugLog('GalleryScreen: Show')

    // Calculate responsive dimensions (using ScreenHelper)
    const { containerWidth, containerHeight } = getResponsiveDimensions()

    // Create main container
    this.element = document.createElement('div')
    this.element.id = 'gallery-screen'
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
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `

    // Create title
    const title = document.createElement('div')
    title.innerHTML = `<span style="font-family: 'Google Sans Flex', sans-serif; font-weight: 500;">Prompt Library</span>`
    title.style.cssText = `
      position: absolute;
      top: clamp(60px, 6.1cqh, 117px);
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: var(--text-primary);
      font-size: clamp(32px, 3.65cqh, 70px);
      font-weight: 500;
      line-height: 1;
      z-index: 10;
    `

    // Create carousel container
    this.cardsContainer = document.createElement('div')
    this.cardsContainer.style.cssText = `
      position: absolute;
      top: 58%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: clamp(600px, 75cqh, 1440px);
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 2000px;
    `

    // Create cards
    GAMES.forEach((game, index) => {
      const card = this.createCard(game, index)
      this.cardsContainer.appendChild(card)
    })

    // Create navigation arrows
    const navContainer = document.createElement('div')
    navContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 88.4%;
      min-width: 500px;
      max-width: 1061px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      pointer-events: none;
    `

    this.leftArrow = this.createArrow('left')
    this.rightArrow = this.createArrow('right')

    // Add click handlers
    this.leftArrow.addEventListener('click', () => this.navigate('left'))
    this.rightArrow.addEventListener('click', () => this.navigate('right'))

    navContainer.appendChild(this.leftArrow)
    navContainer.appendChild(this.rightArrow)

    // Append all elements
    this.element.appendChild(title)
    this.element.appendChild(this.cardsContainer)
    this.element.appendChild(navContainer)
    document.body.appendChild(this.element)

    // Add styles
    this.addStyles()

    // Update carousel position and arrow visibility
    this.updateCarousel(false)
    this.updateArrowVisibility()

    // Listen for keys
    this.inputManager.onKeyPress(this.handleKeyPress)

    // Set inactivity timeout - return to Idle after 30s
    this.appState.setTimeout(GalleryScreen.INACTIVITY_TIMEOUT, 'idle', 'gallery-inactivity')

    debugLog('GalleryScreen: Active (30s inactivity timer)')
  }

  /**
   * Create a carousel card
   */
  createCard(game, index) {
    const card = document.createElement('div')
    card.className = 'gallery-card'
    card.dataset.index = index

    // Card title
    const cardTitle = document.createElement('div')
    cardTitle.className = 'gallery-card-title'
    cardTitle.textContent = game.name
    cardTitle.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      font-size: clamp(20px, 2.12cqh, 40.67px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      margin-bottom: clamp(30px, 3.44cqh, 66px);
    `

    // Prompt container with mask fade effect
    const promptContainer = document.createElement('div')
    promptContainer.className = 'gallery-card-prompt-container'
    promptContainer.style.cssText = `
      position: relative;
      max-height: clamp(450px, 54cqh, 1036px);
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
      mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
    `

    const promptText = document.createElement('div')
    promptText.className = 'gallery-card-prompt'
    promptText.textContent = game.prompt
    promptText.style.cssText = `
      text-align: justify;
      color: var(--text-primary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Mono', monospace;
      font-weight: 500;
      line-height: 1;
      white-space: pre-line;
      word-wrap: break-word;
    `

    promptContainer.appendChild(promptText)

    card.appendChild(cardTitle)
    card.appendChild(promptContainer)

    card.style.cssText = `
      position: absolute;
      width: 70%;
      min-width: 350px;
      max-width: 840px;
      padding: clamp(30px, 3.28cqh, 63px) clamp(30px, 3.65cqh, 70px) clamp(40px, 4.53cqh, 87px) clamp(30px, 3.65cqh, 70px);
      transition: all 0.3s ease;
      transform-style: preserve-3d;
    `

    return card
  }

  /**
   * Create navigation arrow
   */
  createArrow(direction) {
    const arrow = document.createElement('img')
    arrow.className = `gallery-arrow gallery-arrow-${direction}`
    arrow.src = '/conways-arcade-online/img/arrow.png'
    arrow.style.cssText = `
      height: clamp(50px, 6.05cqh, 116.1px);
      cursor: pointer;
      pointer-events: auto;
      transition: filter 0.2s ease;
      filter: brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(85%);
      ${direction === 'left' ? 'transform: scaleX(-1);' : ''}
    `

    arrow.addEventListener('mouseenter', () => {
      // Google Blue #4285F4
      arrow.style.filter = 'brightness(0) saturate(100%) invert(42%) sepia(98%) saturate(1721%) hue-rotate(203deg) brightness(100%) contrast(95%)'
    })
    arrow.addEventListener('mouseleave', () => {
      // Gray #7D7D7D
      arrow.style.filter = 'brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(85%)'
    })

    return arrow
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('gallery-v2-styles')) return

    const style = document.createElement('style')
    style.id = 'gallery-v2-styles'
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      #gallery-screen {
        animation: fadeIn 0.3s ease-in;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Update carousel 3D positions
   */
  updateCarousel(animate = true) {
    const cards = this.cardsContainer.querySelectorAll('.gallery-card')

    cards.forEach((card, index) => {
      const offset = index - this.currentIndex

      // Center card
      if (offset === 0) {
        card.style.transform = 'translateX(-50%) scale(1) translateZ(0)'
        card.style.left = '50%'
        card.style.opacity = '1'
        card.style.zIndex = '3'
        card.style.pointerEvents = 'auto'
      }
      // Left card
      else if (offset === -1) {
        card.style.transform = 'translateX(-50%) scale(0.85) translateZ(-200px) rotateY(25deg)'
        card.style.left = '-5%'
        card.style.opacity = '0.35'
        card.style.zIndex = '2'
        card.style.pointerEvents = 'none'
      }
      // Right card
      else if (offset === 1) {
        card.style.transform = 'translateX(-50%) scale(0.85) translateZ(-200px) rotateY(-25deg)'
        card.style.left = '105%'
        card.style.opacity = '0.35'
        card.style.zIndex = '2'
        card.style.pointerEvents = 'none'
      }
      // Hidden cards
      else if (offset < -1) {
        card.style.transform = 'translateX(-50%) scale(0.7) translateZ(-400px)'
        card.style.left = `${-100 * Math.abs(offset)}%`
        card.style.opacity = '0'
        card.style.zIndex = '1'
        card.style.pointerEvents = 'none'
      }
      else {
        card.style.transform = 'translateX(-50%) scale(0.7) translateZ(-400px)'
        card.style.left = `${100 + 100 * offset}%`
        card.style.opacity = '0'
        card.style.zIndex = '1'
        card.style.pointerEvents = 'none'
      }

      if (!animate) {
        card.style.transition = 'none'
        setTimeout(() => {
          card.style.transition = 'all 0.3s ease'
        }, 50)
      }
    })
  }

  /**
   * Update arrow visibility based on current position
   * Left arrow hidden at first element, right arrow hidden at last element
   */
  updateArrowVisibility() {
    if (this.leftArrow) {
      this.leftArrow.style.visibility = this.currentIndex === 0 ? 'hidden' : 'visible'
    }
    if (this.rightArrow) {
      this.rightArrow.style.visibility = this.currentIndex === GAMES.length - 1 ? 'hidden' : 'visible'
    }
  }

  /**
   * Navigate carousel
   */
  navigate(direction) {
    if (this.isAnimating) return

    this.isAnimating = true

    if (direction === 'left') {
      this.currentIndex = Math.max(0, this.currentIndex - 1)
    } else if (direction === 'right') {
      this.currentIndex = Math.min(GAMES.length - 1, this.currentIndex + 1)
    }

    this.updateCarousel()
    this.updateArrowVisibility()

    setTimeout(() => {
      this.isAnimating = false
    }, 300)

    debugLog(`GalleryScreen: Navigated to game ${this.currentIndex + 1}`)
  }

  /**
   * Hide screen
   */
  hide() {
    debugLog('GalleryScreen: Hide')

    // Clear inactivity timeout
    this.appState.clearTimeout('gallery-inactivity')

    // Stop listening for keys
    this.inputManager.offKeyPress(this.handleKeyPress)

    // Remove element
    if (this.element) {
      this.element.remove()
      this.element = null
      this.cardsContainer = null
      this.leftArrow = null
      this.rightArrow = null
    }

    debugLog('GalleryScreen: Cleaned up')
  }

  /**
   * Handle key press
   */
  handleKeyPress(key) {
    // Reset inactivity timer on any key press
    this.appState.clearTimeout('gallery-inactivity')
    this.appState.setTimeout(GalleryScreen.INACTIVITY_TIMEOUT, 'idle', 'gallery-inactivity')

    // Arrow navigation (LEFT: ArrowLeft or A)
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.navigate('left')
    }
    // Arrow navigation (RIGHT: ArrowRight or D)
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.navigate('right')
    }
    // Space or N confirms selection
    else if (key === ' ' || key === 'n' || key === 'N') {
      this.confirmSelection()
    }
    // Ignore other keys (theme 1-8 handled by ThemeManager, reset M/M+N handled by ResetManager)
  }

  /**
   * Confirm selection and advance to Code Animation
   */
  confirmSelection() {
    const selectedGame = GAMES[this.currentIndex]
    debugLog(`GalleryScreen: Confirmed selection - ${selectedGame.name}`)

    // Store selected game in AppState
    this.appState.setGame(selectedGame)

    // Advance to Code Animation screen
    this.appState.transition('code')
  }
}
