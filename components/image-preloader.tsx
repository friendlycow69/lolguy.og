"use client"

import { useEffect, useRef } from "react"

// Use a fixed version string instead of Date.now()
const APP_VERSION = "1.0.0"

interface ImagePreloaderProps {
  version?: string
}

export default function ImagePreloader({ version = APP_VERSION }: ImagePreloaderProps) {
  // Track if preloading has been done
  const hasPreloadedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadedImagesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Only preload once
    if (hasPreloadedRef.current) return
    hasPreloadedRef.current = true

    // Create a more efficient preload function with better error handling and logging
    const preloadImage = (src: string, priority = false): Promise<void> => {
      // Add version parameter for cache busting
      const versionedSrc = `/${src}?v=${version}`

      // Skip if already loaded
      if (loadedImagesRef.current.has(versionedSrc)) {
        console.log(`Image already preloaded: ${versionedSrc}`)
        return Promise.resolve()
      }

      return new Promise<void>((resolve) => {
        // Create new Image object
        const img = new Image()

        // Set up load handler
        img.onload = () => {
          console.log(`Successfully preloaded image: ${versionedSrc}`)
          loadedImagesRef.current.add(versionedSrc)
          resolve()
        }

        // Set up error handler with better logging
        img.onerror = (e) => {
          console.error(`Failed to preload image: ${versionedSrc}`, e)
          // Resolve anyway to continue preloading other images
          resolve()
        }

        // Set priority if needed
        if (priority) {
          img.fetchPriority = "high"
        }

        // Set crossOrigin to anonymous to avoid CORS issues
        img.crossOrigin = "anonymous"

        // Start loading
        img.src = versionedSrc
      })
    }

    // Define images in priority order with absolute paths
    const criticalImages = ["lol-face-normal.png", "lol-face-shouting-enlarged.png"]
    const nonCriticalImages = ["small-bullet.png", "lol-bullet.png"]

    console.log("Starting image preloading...")

    // Preload critical images immediately and in parallel
    Promise.all(criticalImages.map((src) => preloadImage(src, true)))
      .then(() => {
        console.log("Critical images preloaded successfully")
        // After critical images are loaded, preload non-critical images during idle time
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => {
            nonCriticalImages.forEach((src) => preloadImage(src, false))
          })
        } else {
          // Fallback for browsers without requestIdleCallback
          timeoutRef.current = setTimeout(() => {
            nonCriticalImages.forEach((src) => preloadImage(src, false))
          }, 1000)
        }
      })
      .catch((error) => {
        console.error("Error preloading critical images:", error)
        // Ensure non-critical images still load even if a critical image fails
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => {
            nonCriticalImages.forEach((src) => preloadImage(src, false))
          })
        } else {
          timeoutRef.current = setTimeout(() => {
            nonCriticalImages.forEach((src) => preloadImage(src, false))
          }, 1000)
        }
      })

    // Preload audio with proper version parameter
    const audio = new Audio()
    audio.preload = "auto"
    audio.src = `/lol.mp3?v=${version}`

    return () => {
      // Clean up any timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [version])

  return null
}
