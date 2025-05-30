"use client"

import { useState, useEffect, useRef, lazy, Suspense } from "react"
import Link from "next/link"
import DynamicLolFace from "@/components/dynamic-lol-face"
import ImagePreloader from "@/components/image-preloader"
import BuyButton from "@/components/buy-button"
import SimpleSound from "@/components/simple-sound"
import CopyButton from "@/components/copy-button"
import CloudBackground from "@/components/cloud-background"

// Lazy load non-critical components - UPDATED to use minimal component
const TextParticlesMinimal = lazy(() => import("@/components/text-particles-minimal"))
const SingleEventCounter = lazy(() => import("@/components/single-event-counter"))

// Token address
const TOKEN_ADDRESS = "53Xy4g1RJnGR6saaJRDNoo1rYTGZ3W5U321EDdSa5BGD"

export default function Home() {
  // Component state
  const [isMounted, setIsMounted] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [isLandscape, setIsLandscape] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [version] = useState(() => "1.0.0")
  const [addressCopied, setAddressCopied] = useState(false)
  const [showFullAddress, setShowFullAddress] = useState(false)

  // Refs
  const contentRef = useRef<HTMLDivElement>(null)
  const faceContainerRef = useRef<HTMLDivElement>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialSizeSetRef = useRef<boolean>(false)
  const audioInitializedRef = useRef<boolean>(false)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const socialLinksRef = useRef<HTMLDivElement>(null)

  // Initialize audio on page load
  useEffect(() => {
    if (audioInitializedRef.current) return
    audioInitializedRef.current = true

    // Create and play a silent audio to initialize audio context
    const initAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          const silentContext = new AudioContextClass()
          if (silentContext.state === "suspended") {
            silentContext.resume().catch((e) => console.error("Failed to resume silent context:", e))
          }

          const oscillator = silentContext.createOscillator()
          const gain = silentContext.createGain()
          gain.gain.value = 0.001
          oscillator.connect(gain)
          gain.connect(silentContext.destination)

          oscillator.start()
          setTimeout(() => {
            oscillator.stop()
          }, 1)
        }
      } catch (e) {
        console.error("Error initializing silent audio:", e)
      }
    }

    const initOnInteraction = () => {
      initAudio()
      window.removeEventListener("mousedown", initOnInteraction)
      window.removeEventListener("touchstart", initOnInteraction)
      window.removeEventListener("keydown", initOnInteraction)
    }

    initAudio()

    window.addEventListener("mousedown", initOnInteraction, { once: true })
    window.addEventListener("touchstart", initOnInteraction, { once: true })
    window.addEventListener("keydown", initOnInteraction, { once: true })

    return () => {
      window.removeEventListener("mousedown", initOnInteraction)
      window.removeEventListener("touchstart", initOnInteraction)
      window.removeEventListener("keydown", initOnInteraction)
    }
  }, [])

  // Force floating animations on social links after mount
  useEffect(() => {
    if (!isMounted || !socialLinksRef.current) return

    const socialLinks = socialLinksRef.current.querySelectorAll("a")

    // Apply animations directly to each link with !important
    socialLinks.forEach((link, index) => {
      const element = link as HTMLElement

      // Remove any existing animation classes
      element.classList.remove(
        "zero-gravity-sync-primary",
        "zero-gravity-sync-secondary",
        "zero-gravity-sync-tertiary",
        "zero-gravity-sync-micro",
      )

      // Apply specific animations based on index with !important
      switch (index) {
        case 0: // JOIN X COMMUNITY
          element.style.setProperty("animation", "float-sync-secondary 20s ease-in-out infinite", "important")
          element.style.setProperty("animation-delay", "-10s", "important")
          break
        case 1: // TELEGRAM
          element.style.setProperty("animation", "float-sync-tertiary 20s ease-in-out infinite", "important")
          element.style.setProperty("animation-delay", "-15s", "important")
          break
        case 2: // LIVE CHART
          element.style.setProperty("animation", "float-sync-micro 20s ease-in-out infinite", "important")
          element.style.setProperty("animation-delay", "-5s", "important")
          break
      }

      // Ensure transform properties are set with !important
      element.style.setProperty("will-change", "transform", "important")
      element.style.setProperty("backface-visibility", "hidden", "important")
      element.style.setProperty("transform", "translateZ(0)", "important")

      console.log(`Applied floating animation to social link ${index}:`, element.style.animation)
    })

    // Also try adding a class-based approach as backup
    setTimeout(() => {
      socialLinks.forEach((link, index) => {
        const element = link as HTMLElement
        element.classList.add("force-float-animation")

        // Set a custom CSS property for the animation
        switch (index) {
          case 0:
            element.style.setProperty("--float-animation", "float-sync-secondary 20s ease-in-out infinite", "important")
            element.style.setProperty("--float-delay", "-10s", "important")
            break
          case 1:
            element.style.setProperty("--float-animation", "float-sync-tertiary 20s ease-in-out infinite", "important")
            element.style.setProperty("--float-delay", "-15s", "important")
            break
          case 2:
            element.style.setProperty("--float-animation", "float-sync-micro 20s ease-in-out infinite", "important")
            element.style.setProperty("--float-delay", "-5s", "important")
            break
        }
      })
    }, 100)
  }, [isMounted, isHydrated])

  // Optimize viewport dimension updates with debounce
  const updateViewportDimensions = () => {
    cancelAnimationFrame(
      requestAnimationFrame(() => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }

        resizeTimeoutRef.current = setTimeout(() => {
          const vw = window.innerWidth
          const vh = window.innerHeight

          if (vw !== viewportWidth || vh !== viewportHeight) {
            setViewportWidth(vw)
            setViewportHeight(vh)
            setIsLandscape(vw > vh)
            setIsDesktop(vw >= 1024)
          }
        }, 100)
      }),
    )
  }

  // Initialize component with optimized handler
  useEffect(() => {
    setIsMounted(true)

    const vw = window.innerWidth
    const vh = window.innerHeight
    setViewportWidth(vw)
    setViewportHeight(vh)
    setIsLandscape(vw > vh)
    setIsDesktop(vw >= 1024)
    initialSizeSetRef.current = true

    requestAnimationFrame(() => {
      setIsHydrated(true)
    })

    window.addEventListener("resize", updateViewportDimensions, { passive: true })
    window.addEventListener("orientationchange", updateViewportDimensions, { passive: true })

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      window.removeEventListener("resize", updateViewportDimensions)
      window.removeEventListener("orientationchange", updateViewportDimensions)
    }
  }, [])

  // Memoized face size calculation
  const calculateFaceSize = () => {
    if (!isMounted || !initialSizeSetRef.current) return { width: "50vmin", height: "50vmin" }

    const baseDimension = Math.min(viewportWidth, viewportHeight)

    let sizeFactor = 0.45
    if (isDesktop) {
      sizeFactor = 0.28
    } else if (isLandscape) {
      sizeFactor = 0.32
    }

    const size = Math.max(150, baseDimension * sizeFactor)

    return {
      width: `${size}px`,
      height: `${size}px`,
    }
  }

  const faceSize = calculateFaceSize()

  // Function to check if full address fits
  const checkIfFullAddressFits = (address: string) => {
    if (!taglineRef.current || !isMounted) return false

    // Create a temporary span to measure text width
    const tempSpan = document.createElement("span")
    tempSpan.style.visibility = "hidden"
    tempSpan.style.position = "absolute"
    tempSpan.style.fontSize = window.getComputedStyle(taglineRef.current).fontSize
    tempSpan.style.fontFamily = window.getComputedStyle(taglineRef.current).fontFamily
    tempSpan.style.fontWeight = window.getComputedStyle(taglineRef.current).fontWeight
    tempSpan.textContent = address
    document.body.appendChild(tempSpan)

    const fullWidth = tempSpan.offsetWidth
    const containerWidth = taglineRef.current.offsetWidth - 32 // Account for padding

    document.body.removeChild(tempSpan)

    return fullWidth <= containerWidth
  }

  // Function to format address based on available width
  const formatAddress = (address: string) => {
    // If copied, always show "Copied" regardless of width
    if (addressCopied) {
      return "Copied"
    }

    // If we should show full address (after copy) and it fits, show it
    if (showFullAddress && checkIfFullAddressFits(address)) {
      return address
    }

    // If we should show full address but it doesn't fit, show truncated
    if (showFullAddress) {
      const startChars = 6
      const endChars = 6
      return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
    }

    // Initial load: check if full address fits
    if (checkIfFullAddressFits(address)) {
      return address
    }

    // Otherwise, show truncated version
    const startChars = 6
    const endChars = 6
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
  }

  // Handle copy address
  const handleCopyAddress = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(TOKEN_ADDRESS)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = TOKEN_ADDRESS
        textArea.style.position = "fixed"
        textArea.style.left = "0"
        textArea.style.top = "0"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      setAddressCopied(true)
      setShowFullAddress(true) // Set flag to prefer full address after copy

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => {
        setAddressCopied(false)
        // Keep showFullAddress as true so it tries to show full address
        copyTimeoutRef.current = null
      }, 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <main className={`viewport-container ${isDesktop ? "desktop-layout" : ""}`}>
      <meta name="app-version" content={version} hidden />

      {/* CloudBackground is now rendered directly to body */}
      <CloudBackground />

      <ImagePreloader version={version} />
      <SimpleSound />

      <div className="centered-content" ref={contentRef}>
        {/* Title */}
        <h1 className="title zero-gravity-sync-primary">
          <Link
            href="https://knowyourmeme.com/memes/lol-guy"
            target="_blank"
            rel="noopener noreferrer"
            className="title-link"
          >
            LOL Guy
          </Link>
        </h1>

        {/* Face */}
        <div
          ref={faceContainerRef}
          className="face-container zero-gravity-sync-secondary"
          style={{
            width: faceSize.width,
            height: faceSize.height,
          }}
        >
          <DynamicLolFace />
          <Suspense fallback={null}>{isHydrated && <TextParticlesMinimal />}</Suspense>
        </div>

        {/* Address */}
        <p
          ref={taglineRef}
          className={`tagline super-bold zero-gravity-sync-tertiary ${addressCopied ? "copied" : ""}`}
          onClick={handleCopyAddress}
          title="Click to copy address"
        >
          <span className="contract-address">{formatAddress(TOKEN_ADDRESS)}</span>
          {addressCopied && <span className="address-checkmark">✓</span>}
        </p>

        {/* Counter */}
        <div className="counter-container zero-gravity-sync-quaternary">
          <Suspense fallback={null}>{isHydrated && <SingleEventCounter />}</Suspense>
        </div>

        {/* Buttons */}
        <div className="buttons-container zero-gravity-sync-primary-delayed">
          <BuyButton />
          <CopyButton />
        </div>

        {/* Social Links - Each with synchronized floating */}
        <div className="social-links" ref={socialLinksRef}>
          <Link
            href="https://x.com/i/communities/1914104319453933789"
            className="social-link zero-gravity-sync-secondary-delayed"
            target="_blank"
            rel="noopener noreferrer"
          >
            JOIN X COMMUNITY
          </Link>
          <Link
            href="https://t.me/LOLGUYSOL"
            className="social-link zero-gravity-sync-tertiary-delayed"
            target="_blank"
            rel="noopener noreferrer"
          >
            TELEGRAM
          </Link>
          <Link
            href="https://dexscreener.com/solana/hnmnnj7uvx988rwxjkk8ggwaqsi3e1nueecab763dqys"
            className="social-link zero-gravity-sync-micro"
            target="_blank"
            rel="noopener noreferrer"
          >
            LIVE CHART
          </Link>
        </div>
      </div>

      <style jsx>{`
        /* Define the keyframes directly in the component */
        @keyframes float-sync-primary {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(4px, -3px, 0) rotate(0.8deg); }
          50% { transform: translate3d(-3px, 5px, 0) rotate(-0.6deg); }
          75% { transform: translate3d(-5px, -2px, 0) rotate(0.4deg); }
        }

        @keyframes float-sync-secondary {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(-3px, 4px, 0) rotate(-0.6deg); }
          50% { transform: translate3d(5px, -2px, 0) rotate(0.8deg); }
          75% { transform: translate3d(2px, 3px, 0) rotate(-0.4deg); }
        }

        @keyframes float-sync-tertiary {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(2px, -4px, 0) rotate(0.5deg); }
          50% { transform: translate3d(-4px, 2px, 0) rotate(-0.7deg); }
          75% { transform: translate3d(3px, -1px, 0) rotate(0.3deg); }
        }

        @keyframes float-sync-quaternary {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(-2px, 3px, 0) rotate(-0.4deg); }
          50% { transform: translate3d(3px, -4px, 0) rotate(0.6deg); }
          75% { transform: translate3d(-4px, 1px, 0) rotate(-0.2deg); }
        }

        @keyframes float-sync-micro {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(1px, -2px, 0) rotate(0.2deg); }
          50% { transform: translate3d(-2px, 1px, 0) rotate(-0.3deg); }
          75% { transform: translate3d(2px, -1px, 0) rotate(0.1deg); }
        }

        .viewport-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          background-color: var(--background-grey) !important;
          padding: 0;
          margin: 0;
          position: relative;
          contain: layout size style;
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          z-index: 1;
        }

        .centered-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          max-height: 100vh;
          max-height: 100dvh;
          padding: 0;
          box-sizing: border-box;
          gap: clamp(1vh, 2vh, 3vh);
          background-color: transparent !important;
          contain: layout style;
          position: relative;
          z-index: 10;
        }

        .title {
          font-family: var(--font-orbitron), monospace;
          font-size: clamp(1.2rem, 4vmin, 2.5rem);
          font-weight: 900;
          -webkit-text-stroke: 1px #000000;
          letter-spacing: 0.5px;
          color: #000000;
          margin: 0;
          will-change: transform;
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          line-height: 1.2;
          text-align: center;
          flex-shrink: 0;
          animation: float-sync-primary 20s ease-in-out infinite;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        
        .title-link {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s ease;
          display: inline-block;
        }
        
        .title-link:hover {
          color: #555;
        }

        .face-container {
          position: relative;
          transition: width 0.3s ease, height 0.3s ease;
          background-color: transparent !important;
          will-change: transform;
          contain: layout size style;
          flex-shrink: 0;
          animation: float-sync-secondary 20s ease-in-out infinite;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .tagline {
          font-family: var(--font-orbitron), monospace;
          font-size: clamp(0.6rem, 2vmin, 1.2rem);
          text-align: center;
          margin: 0;
          max-width: 95%;
          will-change: transform;
          color: #000000;
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          font-weight: 900;
          -webkit-text-stroke: 0.5px #000000;
          letter-spacing: 0.3px;
          cursor: pointer;
          padding: clamp(4px, 1vh, 12px) clamp(6px, 2vw, 16px);
          border-radius: 4px;
          transition: transform 0.2s ease;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
          animation: float-sync-tertiary 20s ease-in-out infinite;
          backface-visibility: hidden;
          transform: translateZ(0);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .tagline:active {
          transform: scale(0.95);
        }

        .tagline.copied {
          animation: simple-pulse 0.3s ease;
        }

        .address-checkmark {
          color: #00ff00 !important;
          font-size: 14px;
          font-weight: 900;
          -webkit-text-stroke: 1px #00ff00 !important;
          text-shadow: 0 0 5px #00ff00;
          animation: address-checkmark-glow 1.5s infinite;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          transform-origin: center;
          position: relative;
          z-index: 2;
        }

        @keyframes address-checkmark-glow {
          0% { 
            transform: scale(1); 
            opacity: 1;
            filter: drop-shadow(0 0 3px rgba(0, 255, 0, 0.5));
          }
          50% { 
            transform: scale(1.2); 
            opacity: 0.9;
            filter: drop-shadow(0 0 8px rgba(0, 255, 0, 0.8));
          }
          100% { 
            transform: scale(1); 
            opacity: 1;
            filter: drop-shadow(0 0 3px rgba(0, 255, 0, 0.5));
          }
        }

        @keyframes simple-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }

        .super-bold {
          font-weight: 900;
          -webkit-text-stroke: 0.5px #000000;
          letter-spacing: 0.3px;
          color: #000000;
        }

        .counter-container {
          margin: 0;
          background-color: transparent !important;
          will-change: transform;
          min-height: clamp(1.5rem, 3vh, 3rem);
          contain: layout size style;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float-sync-quaternary 20s ease-in-out infinite;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        
        .buttons-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 2vw, 20px);
          margin: 0;
          background-color: transparent !important;
          will-change: transform;
          flex-wrap: wrap;
          width: 100%;
          max-width: min(90vw, 400px);
          padding: 0 clamp(4px, 1vw, 8px);
          flex-shrink: 0;
          animation: float-sync-primary 20s ease-in-out infinite;
          animation-delay: -5s;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .social-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(0.5vh, 1vh, 1.5vh);
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          width: 100%;
          max-width: 95vw;
          flex-shrink: 0;
        }

        .social-link {
          font-family: var(--font-orbitron), monospace;
          font-size: clamp(0.9rem, 3.5vmin, 2rem);
          font-weight: 900 !important;
          text-decoration: underline;
          color: #000;
          transition: color 0.2s ease;
          letter-spacing: 0.05em;
          cursor: pointer;
          -webkit-text-stroke: 0.5px #000000 !important;
          text-shadow: 0 0 1px #000 !important;
          will-change: transform;
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          display: inline-block;
          text-align: center;
          line-height: 1.2;
          padding: clamp(2px, 0.5vh, 6px) clamp(4px, 1vw, 8px);
          word-break: keep-all;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .social-link:hover {
          color: #555;
          transform: translateZ(0) translateY(-1px);
        }

        /* Very narrow screens */
        @media (max-width: 360px) {
          .tagline {
            font-size: clamp(0.5rem, 1.8vmin, 0.9rem);
            padding: clamp(3px, 0.8vh, 8px) clamp(4px, 1.5vw, 10px);
          }
          
          .social-link {
            font-size: clamp(0.7rem, 3vmin, 1.4rem);
            padding: clamp(1px, 0.3vh, 4px) clamp(2px, 0.8vw, 6px);
          }
          
          .buttons-container {
            gap: clamp(6px, 1.5vw, 12px);
            flex-direction: column;
          }
        }

        /* Ultra-narrow screens (like folded phones) */
        @media (max-width: 280px) {
          .social-link {
            font-size: clamp(0.6rem, 2.8vmin, 1.2rem);
            white-space: normal;
            word-break: break-word;
            line-height: 1.1;
          }
          
          .tagline {
            font-size: clamp(0.45rem, 1.6vmin, 0.8rem);
          }
          
          .title {
            font-size: clamp(1rem, 3.5vmin, 2rem);
          }
        }

        /* Ultra-wide screens */
        @media (min-width: 1600px) {
          .centered-content {
            max-width: 1400px;
          }
        }

        .contract-address {
          display: inline-block;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .force-float-animation {
          animation: var(--float-animation) !important;
          animation-delay: var(--float-delay) !important;
          will-change: transform !important;
          backface-visibility: hidden !important;
          transform: translateZ(0) !important;
        }
      `}</style>
    </main>
  )
}
