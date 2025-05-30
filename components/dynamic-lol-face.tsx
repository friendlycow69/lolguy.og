"use client"

import type React from "react"

import { useState, useEffect, useRef, memo } from "react"
import Image from "next/image"

// Use a fixed version string instead of Date.now()
const APP_VERSION = "1.0.0"

interface DynamicLolFaceProps {
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

// Use memo to prevent unnecessary re-renders
const DynamicLolFace = memo(function DynamicLolFace({ className = "", onClick }: DynamicLolFaceProps) {
  // State management: A (normal) always shown, B (shouting) only during press-hold
  const [isStateB, setIsStateB] = useState(false) // false = State A (normal), true = State B (shouting + enlarged)

  // Refs for state tracking
  const faceContainerRef = useRef<HTMLDivElement>(null)
  const currentPositionXRef = useRef(0)
  const currentTransformRef = useRef<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 })

  // Debug logging
  const logStateChange = (message: string) => {
    console.log(`[DynamicLolFace] ${message}`)
  }

  const version = APP_VERSION

  // Update transform tracking
  const updateCurrentTransform = (x: number, y: number, scale: number) => {
    currentTransformRef.current = { x, y, scale }
    logStateChange(`Transform updated: x=${x}, y=${y}, scale=${scale}`)
  }

  // Function to handle press down - show State B
  const handlePressDown = () => {
    logStateChange("Press down - showing State B (shouting)")
    setIsStateB(true)

    // Update transform
    if (faceContainerRef.current) {
      const currentX = currentPositionXRef.current
      faceContainerRef.current.style.transform = `translate3d(${currentX}px, 0, 0) scale(1)`
      updateCurrentTransform(currentX, 0, 1)
    }
  }

  // Function to handle press up - return to State A
  const handlePressUp = () => {
    logStateChange("Press up - returning to State A (normal)")
    setIsStateB(false)

    // Update transform
    if (faceContainerRef.current) {
      const currentX = currentPositionXRef.current
      faceContainerRef.current.style.transform = `translate3d(${currentX}px, 0, 0) scale(1)`
      updateCurrentTransform(currentX, 0, 1)
    }
  }

  // Expose the functions globally for the bullet system
  useEffect(() => {
    window.handleLolFacePressDown = handlePressDown
    window.handleLolFacePressUp = handlePressUp
    window.getLolFaceTransform = () => {
      return {
        x: currentPositionXRef.current,
        y: 0,
        scale: 1,
      }
    }

    return () => {
      // Clean up global functions
      delete window.handleLolFacePressDown
      delete window.handleLolFacePressUp
      delete window.getLolFaceTransform
    }
  }, [])

  // Update transform when state changes
  useEffect(() => {
    if (faceContainerRef.current) {
      faceContainerRef.current.style.transform = `translate3d(${currentPositionXRef.current}px, 0, 0) scale(1)`
      updateCurrentTransform(currentPositionXRef.current, 0, 1)
    }
  }, [isStateB])

  // Debug effect to track face state changes
  useEffect(() => {
    logStateChange(`Face state changed to: ${isStateB ? "shouting (State B)" : "normal (State A)"}`)
  }, [isStateB])

  return (
    <div ref={faceContainerRef} className={`dynamic-lol-face-container ${isStateB ? "state-b" : "state-a"}`}>
      {/* State A: Normal face image - always default */}
      <Image
        src={`/lol-face-normal.png?v=${version}`}
        alt="LOL Face"
        fill
        className={`lol-face-image ${isStateB ? "opacity-0" : "opacity-100"} ${className}`}
        priority={true}
        style={{
          objectFit: "contain",
          willChange: "opacity",
        }}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        loading="eager"
        fetchPriority="high"
        unoptimized={true}
      />

      {/* State B: Pre-scaled shouting face image - only during press-hold */}
      <Image
        src={`/lol-face-shouting-enlarged.png?v=${version}`}
        alt="LOL Face Shouting Enlarged"
        fill
        className={`lol-face-image lol-face-shouting ${isStateB ? "opacity-100" : "opacity-0"} ${className}`}
        priority={true}
        style={{
          objectFit: "contain",
          willChange: "opacity",
        }}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        loading="eager"
        fetchPriority="high"
        unoptimized={true}
      />

      {/* Fallback images for the two states */}
      <div
        className={`fallback-image normal-face ${isStateB ? "hidden" : "visible"}`}
        style={{
          backgroundImage: `url(/lol-face-normal.png?v=${version})`,
        }}
      />
      <div
        className={`fallback-image shouting-face ${isStateB ? "visible" : "hidden"}`}
        style={{
          backgroundImage: `url(/lol-face-shouting-enlarged.png?v=${version})`,
        }}
      />

      <style jsx>{`
        .dynamic-lol-face-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          margin: 0 auto;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          min-width: 150px;
          min-height: 150px;
          pointer-events: none;
          contain: layout paint style;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          z-index: var(--z-index-face);
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .fallback-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 1;
        }
        
        .hidden {
          opacity: 0;
        }
        
        .visible {
          opacity: 1;
        }
      `}</style>

      <style jsx global>{`
        .lol-face-image {
          position: absolute;
          transition: opacity 0ms;
          will-change: opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          z-index: 2;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
})

export default DynamicLolFace

// Add type definition for global functions
declare global {
  interface Window {
    playLolSound?: () => void
    handleLolFacePressDown?: () => void
    handleLolFacePressUp?: () => void
    getLolFaceTransform?: () => { x: number; y: number; scale: number }
  }
}
