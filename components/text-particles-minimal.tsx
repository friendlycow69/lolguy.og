"use client"

import { useEffect, useRef, memo } from "react"

// LOL character sequence bullet system with autofire L-O-L-O only
const TextParticlesMinimal = memo(function TextParticlesMinimal() {
  // Track if we've set up the event listeners
  const observerSetRef = useRef(false)

  // Core refs
  const faceContainerRef = useRef<HTMLDivElement | null>(null)
  const bulletLayerRef = useRef<HTMLDivElement | null>(null)
  const activeBulletsRef = useRef<HTMLElement[]>([])

  // Animation tracking
  const bulletIdCounterRef = useRef(0)
  const isTouchDeviceRef = useRef<boolean>(false)
  const hasReceivedTouchRef = useRef<boolean>(false)

  // Press state tracking
  const isPressedRef = useRef<boolean>(false)
  const autofireIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Character sequence tracking for autofire
  const autofireSequence = ["L", "O", "L", "O"] // Endless L-O-L-O sequence for autofire
  const currentAutofireIndexRef = useRef(0)

  // Performance constants
  const MAX_BULLETS = 25
  const BULLET_FONT_SIZE = 66 // pixels for character size (5% bigger again: 63 * 1.05 = 66.15, rounded to 66)
  const AUTOFIRE_RATE = 150 // ms between autofire shots

  // Counter ready state
  const counterReadyRef = useRef<boolean>(false)
  const initialDelayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debug logging
  const logMessage = (message: string) => {
    console.log(`[TextParticlesMinimal] ${message}`)
  }

  // Get next character in autofire sequence
  const getNextAutofireCharacter = () => {
    const character = autofireSequence[currentAutofireIndexRef.current]
    currentAutofireIndexRef.current = (currentAutofireIndexRef.current + 1) % autofireSequence.length
    return character
  }

  // Calculate bullet starting point
  const calculateStartingPoint = () => {
    if (!faceContainerRef.current) {
      faceContainerRef.current = document.querySelector(".dynamic-lol-face-container") as HTMLDivElement
      if (!faceContainerRef.current) return { startX: 0, startY: 0 }
    }

    const faceRect = faceContainerRef.current.getBoundingClientRect()

    // Get face transform for accurate positioning during animations
    let faceTransform = { x: 0, y: 0, scale: 1 }
    if (typeof window !== "undefined" && window.getLolFaceTransform) {
      faceTransform = window.getLolFaceTransform()
    }

    // Calculate face center coordinates
    const faceCenterX = faceRect.left + faceRect.width / 2
    const faceCenterY = faceRect.top + faceRect.height / 2

    // Position bullet starting point to the right of face center and 2% higher
    const startX = faceCenterX + faceRect.width * 0.26 + faceTransform.x
    const startY = faceCenterY + faceRect.height * 0.08 + faceTransform.y // Changed from 0.1 to 0.08 (2% higher)

    // Ensure position is within viewport bounds
    const clampedX = Math.max(0, Math.min(window.innerWidth, startX))
    const clampedY = Math.max(0, Math.min(window.innerHeight, startY))

    return { startX: clampedX, startY: clampedY }
  }

  // Check if click/touch is on interactive area (face or background, but not buttons/links)
  const isClickOnInteractiveArea = (clientX: number, clientY: number): boolean => {
    const element = document.elementFromPoint(clientX, clientY)
    if (!element) return false

    // Check if clicked element is a button, link, or interactive element
    const isInteractiveElement =
      element.tagName === "A" ||
      element.tagName === "BUTTON" ||
      element.closest("a") ||
      element.closest("button") ||
      element.closest(".copy-button") ||
      element.closest(".buy-button") ||
      element.closest('[role="button"]') ||
      element.closest("[onclick]") ||
      element.closest(".clickable") ||
      element.closest(".interactive")

    // If it's an interactive element, don't fire bullets
    if (isInteractiveElement) {
      return false
    }

    // Allow clicks on face or background (body/main content areas)
    const isFaceArea = faceContainerRef.current && faceContainerRef.current.contains(element)

    const isBackgroundArea =
      element.tagName === "BODY" ||
      element.tagName === "MAIN" ||
      element.closest("main") ||
      element.classList.contains("background") ||
      element.classList.contains("main-content")

    return isFaceArea || isBackgroundArea
  }

  useEffect(() => {
    if (observerSetRef.current) return
    observerSetRef.current = true

    logMessage("Initializing autofire-only L-O-L-O bullet system")

    // Detect touch device more accurately
    isTouchDeviceRef.current = "ontouchstart" in window || navigator.maxTouchPoints > 0

    // Get face container reference
    faceContainerRef.current = document.querySelector(".dynamic-lol-face-container") as HTMLDivElement

    // Create bullet layer
    const createBulletLayer = () => {
      const layer = document.createElement("div")
      layer.className = "bullet-layer"
      layer.style.position = "fixed"
      layer.style.top = "0"
      layer.style.left = "0"
      layer.style.width = "100%"
      layer.style.height = "100%"
      layer.style.pointerEvents = "none"
      layer.style.zIndex = "var(--z-index-bullets)"
      layer.style.overflow = "visible"
      document.body.appendChild(layer)
      return layer
    }

    bulletLayerRef.current = createBulletLayer()

    // Trigger face state swap to B and reset to A after 100ms
    const triggerFaceStateSwap = () => {
      logMessage("Triggering face state swap to B for bullet fire")

      // Show State B (shouting face)
      if (typeof window !== "undefined" && window.handleLolFacePressDown) {
        window.handleLolFacePressDown()
      }

      // Reset to State A after 100ms
      setTimeout(() => {
        logMessage("Resetting face state to A after 100ms")
        if (typeof window !== "undefined" && window.handleLolFacePressUp) {
          window.handleLolFacePressUp()
        }
      }, 100)
    }

    // Create autofire character bullet with fade out at screen edge
    const createAutofireBullet = () => {
      const character = getNextAutofireCharacter()
      logMessage(`Autofire creating bullet: ${character}`)

      if (!bulletLayerRef.current) return

      // Memory management - remove oldest bullet if too many
      if (activeBulletsRef.current.length >= MAX_BULLETS) {
        const oldestBullet = activeBulletsRef.current.shift()
        if (oldestBullet && bulletLayerRef.current.contains(oldestBullet)) {
          bulletLayerRef.current.removeChild(oldestBullet)
        }
      }

      // Trigger face state swap for this bullet
      triggerFaceStateSwap()

      // Play sound
      if (typeof window !== "undefined" && window.playLolSound) {
        window.playLolSound()
      }

      // Update counter
      if (typeof window !== "undefined" && window.updateCounterDisplay && counterReadyRef.current) {
        window.updateCounterDisplay(1)
      }

      // Get starting position
      const { startX, startY } = calculateStartingPoint()

      // Create bullet element
      const bullet = document.createElement("div")
      bullet.textContent = character
      bullet.className = "lol-bullet"
      bullet.id = `bullet-${bulletIdCounterRef.current++}`

      // Style the bullet using website's font - removed text shadow
      bullet.style.position = "fixed"
      bullet.style.left = `${startX}px`
      bullet.style.top = `${startY}px`
      bullet.style.fontSize = `${BULLET_FONT_SIZE}px`
      bullet.style.fontFamily = "var(--font-orbitron), monospace"
      bullet.style.fontWeight = "900"
      bullet.style.color = "#FF0000" // Solid red
      bullet.style.webkitTextStroke = "2px #FF0000"
      bullet.style.transform = "translate(-50%, -50%)"
      bullet.style.zIndex = "var(--z-index-bullet-content)"
      bullet.style.pointerEvents = "none"
      bullet.style.opacity = "0"
      bullet.style.willChange = "transform, opacity"
      bullet.style.userSelect = "none"
      bullet.style.webkitUserSelect = "none"
      bullet.style.letterSpacing = "0px"
      bullet.style.lineHeight = "1"
      bullet.style.whiteSpace = "nowrap"

      // Calculate travel distance to screen edge
      const screenEdgeX = window.innerWidth
      const travelDistance = screenEdgeX - startX

      // FIXED SPEED: 400 pixels per second regardless of screen width
      const PIXELS_PER_SECOND = 400
      const animationDuration = travelDistance / PIXELS_PER_SECOND

      // Create unique animation with fade out at screen edge
      const animationName = `bullet-fly-${bullet.id}`
      const styleSheet = document.createElement("style")
      styleSheet.textContent = `
        @keyframes ${animationName} {
          0% {
            transform: translate(-50%, -50%) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateX(${travelDistance}px);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(styleSheet)

      // Apply animation with calculated duration for consistent speed
      bullet.style.animation = `${animationName} ${animationDuration}s linear forwards`

      // Add to DOM and track
      bulletLayerRef.current.appendChild(bullet)
      activeBulletsRef.current.push(bullet)

      // Clean up after animation
      setTimeout(
        () => {
          if (bulletLayerRef.current && bulletLayerRef.current.contains(bullet)) {
            bulletLayerRef.current.removeChild(bullet)
          }

          // Remove from tracking
          const index = activeBulletsRef.current.indexOf(bullet)
          if (index !== -1) {
            activeBulletsRef.current.splice(index, 1)
          }

          // Remove style sheet
          if (document.head.contains(styleSheet)) {
            document.head.removeChild(styleSheet)
          }
        },
        animationDuration * 1000 + 100,
      )
    }

    // Start autofire
    const startAutofire = () => {
      if (autofireIntervalRef.current) return // Already autofiring

      logMessage("Starting autofire with L-O-L-O sequence")

      // Set global autofire state for clouds
      ;(window as any).isAutofiring = true

      // Fire immediately on press down
      createAutofireBullet()

      // Then continue firing at intervals
      autofireIntervalRef.current = setInterval(() => {
        if (isPressedRef.current) {
          createAutofireBullet()
        }
      }, AUTOFIRE_RATE)
    }

    // Stop autofire
    const stopAutofire = () => {
      if (autofireIntervalRef.current) {
        logMessage("Stopping autofire")
        clearInterval(autofireIntervalRef.current)
        autofireIntervalRef.current = null
      }
      // Clear global autofire state for clouds
      ;(window as any).isAutofiring = false
    }

    // Unified interaction handling for both mouse and touch
    const handleInteractionStart = (clientX: number, clientY: number, eventType: string) => {
      // Only respond to clicks on interactive areas (face or background, not buttons)
      if (!isClickOnInteractiveArea(clientX, clientY)) {
        return
      }

      if (isPressedRef.current) return // Prevent duplicate press events

      logMessage(`${eventType} interaction start detected on interactive area - starting autofire`)
      isPressedRef.current = true

      // Start autofire immediately
      startAutofire()
    }

    // Unified interaction end handling
    const handleInteractionEnd = (eventType: string) => {
      if (!isPressedRef.current) return // Prevent duplicate release events

      logMessage(`${eventType} interaction end detected - stopping autofire`)
      isPressedRef.current = false

      // Stop autofire
      stopAutofire()

      // Ensure face returns to State A
      if (typeof window !== "undefined" && window.handleLolFacePressUp) {
        window.handleLolFacePressUp()
      }
    }

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      // If we've received touch events, ignore mouse events to prevent double firing
      if (hasReceivedTouchRef.current) {
        logMessage("Ignoring mouse event - touch events detected")
        return
      }
      handleInteractionStart(e.clientX, e.clientY, "Mouse")
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (hasReceivedTouchRef.current) return
      handleInteractionEnd("Mouse")
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasReceivedTouchRef.current) return
      handleInteractionEnd("Mouse") // Stop autofire when mouse leaves window
    }

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      // Mark that we've received touch events
      hasReceivedTouchRef.current = true

      if (e.touches.length > 0) {
        const touch = e.touches[0]
        handleInteractionStart(touch.clientX, touch.clientY, "Touch")
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      handleInteractionEnd("Touch")
    }

    const handleTouchCancel = (e: TouchEvent) => {
      handleInteractionEnd("Touch")
    }

    // Wait for counter to be ready
    const checkCounterReady = () => {
      if (typeof window !== "undefined" && window.updateCounterDisplay) {
        initialDelayTimerRef.current = setTimeout(() => {
          logMessage("Counter is now ready for updates")
          counterReadyRef.current = true
          initialDelayTimerRef.current = null
        }, 1000)
      } else {
        initialDelayTimerRef.current = setTimeout(checkCounterReady, 200)
      }
    }

    checkCounterReady()

    // Add event listeners based on device capabilities
    // Always add touch listeners first to detect touch capability
    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true })

    // Add mouse listeners with a small delay to allow touch detection
    setTimeout(() => {
      if (!hasReceivedTouchRef.current) {
        // Only add mouse listeners if no touch events were detected
        window.addEventListener("mousedown", handleMouseDown)
        window.addEventListener("mouseup", handleMouseUp)
        window.addEventListener("mouseleave", handleMouseLeave)
        logMessage("Added mouse event listeners (no touch detected)")
      } else {
        logMessage("Skipped mouse event listeners (touch device detected)")
      }
    }, 100)

    return () => {
      // Stop autofire
      stopAutofire()

      // Clear timers
      if (initialDelayTimerRef.current) {
        clearTimeout(initialDelayTimerRef.current)
      }

      // Cleanup all event listeners
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchCancel)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mouseleave", handleMouseLeave)

      // Clean up bullet layer
      if (bulletLayerRef.current && document.body.contains(bulletLayerRef.current)) {
        document.body.removeChild(bulletLayerRef.current)
      }

      // Clear all active bullets
      activeBulletsRef.current = []

      // Reset press state
      isPressedRef.current = false

      // Clear global autofire state
      ;(window as any).isAutofiring = false
    }
  }, [])

  return null
})

export default TextParticlesMinimal

declare global {
  interface Window {
    playLolSound?: () => void
    handleLolFacePressDown?: () => void
    handleLolFacePressUp?: () => void
    updateCounterDisplay?: (increment?: number) => void
    getLolFaceTransform?: () => { x: number; y: number; scale: number }
    isAutofiring?: boolean
  }
}
