"use client"

import { useState, useEffect, useRef, memo } from "react"
import {
  getCounter as fetchCounter,
  incrementCounter as incrementCounterFunc,
  incrementCounterByAmount as incrementCounterByAmountFunc,
} from "@/app/actions"

// SINGLE SOURCE OF TRUTH FOR COUNTER FUNCTIONALITY
const SingleEventCounter = memo(function SingleEventCounter() {
  const [displayCount, setDisplayCount] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Core refs for state management
  const lastServerCountRef = useRef<number | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const localCountRef = useRef<number>(170000) // Start with higher value
  const updateQueueRef = useRef<number[]>([])
  const updateThrottleRef = useRef<boolean>(false)
  const batchUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadCompleteRef = useRef<boolean>(false)

  // Initialize counter on mount with frequent server sync
  useEffect(() => {
    const fetchLatestCount = async () => {
      if (updateThrottleRef.current) return

      setIsLoading(true)
      updateThrottleRef.current = true

      setTimeout(() => {
        updateThrottleRef.current = false
      }, 150)

      try {
        const count = await fetchCounter()
        lastServerCountRef.current = count

        // CRITICAL: Always use the higher value to prevent resets
        const newCount = Math.max(count, localCountRef.current, 170000)
        localCountRef.current = newCount
        setDisplayCount(newCount)

        console.log(`Counter sync: Server=${count}, Local=${localCountRef.current}, Display=${newCount}`)

        setError(null)
        setIsOffline(false)
        initialLoadCompleteRef.current = true
        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to fetch counter:", error)
        setError("Using local counter")
        setIsOffline(true)

        // Use the higher of local count or minimum
        const fallbackCount = Math.max(localCountRef.current, 170000)
        setDisplayCount(fallbackCount)
        localCountRef.current = fallbackCount

        initialLoadCompleteRef.current = true
        setIsInitialized(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLatestCount()

    // Sync every 200ms for real-time updates
    refreshTimerRef.current = setInterval(fetchLatestCount, 200)

    const handleOnline = () => {
      setIsOffline(false)
      fetchLatestCount()
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
      if (batchUpdateTimerRef.current) {
        clearTimeout(batchUpdateTimerRef.current)
      }
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Process batched updates with protection against resets
  const processBatchedUpdates = async () => {
    if (updateQueueRef.current.length === 0) return

    const batchSize = updateQueueRef.current.length
    console.log(`Processing batch of ${batchSize} updates`)

    updateQueueRef.current = []

    if (!isOffline) {
      try {
        const newCount = batchSize === 1 ? await incrementCounterFunc() : await incrementCounterByAmountFunc(batchSize)
        lastServerCountRef.current = newCount

        // CRITICAL: Always use the higher value
        const finalCount = Math.max(newCount, localCountRef.current)
        localCountRef.current = finalCount
        setDisplayCount(finalCount)

        console.log(`Batch update: Server=${newCount}, Final=${finalCount}`)
      } catch (error) {
        console.error("Failed to update counter:", error)
        setIsOffline(true)
        console.log(`Keeping local count ${localCountRef.current} due to server error`)
      }
    } else {
      console.log(`Offline: Keeping local count ${localCountRef.current}`)
    }
  }

  // Trigger counter animation
  const triggerCounterAnimation = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
    }

    setIsAnimating(true)

    animationTimerRef.current = setTimeout(() => {
      setIsAnimating(false)
      animationTimerRef.current = null
    }, 150)
  }

  // SINGLE GLOBAL FUNCTION FOR COUNTER UPDATES
  useEffect(() => {
    window.updateCounterDisplay = (increment = 1) => {
      if (!initialLoadCompleteRef.current) {
        console.log("Ignoring counter update before initial load")
        return
      }

      // Update local count immediately
      localCountRef.current += increment
      setDisplayCount(localCountRef.current)

      // Trigger animation
      triggerCounterAnimation()

      // Queue for server sync
      updateQueueRef.current.push(increment)

      console.log(`Counter update: +${increment}, new count: ${localCountRef.current}`)

      // Schedule batch update
      if (!batchUpdateTimerRef.current) {
        batchUpdateTimerRef.current = setTimeout(() => {
          processBatchedUpdates()
          batchUpdateTimerRef.current = null
        }, 300)
      }
    }

    return () => {
      delete window.updateCounterDisplay
    }
  }, [])

  const getDisplayContent = () => {
    if (isLoading && !isInitialized) {
      return "Loading..."
    }

    if (displayCount !== null) {
      return displayCount.toString()
    }

    return "Loading..."
  }

  return (
    <div className="counter-wrapper zero-gravity-sync-tertiary">
      <p className={`counter-value ${isAnimating ? "counter-animate" : ""} ${isOffline ? "counter-offline" : ""}`}>
        {getDisplayContent()}
      </p>

      {error && <p className="error-message">{error}</p>}

      <style jsx>{`
        .counter-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin: 0;
          padding: 0;
          contain: layout style;
        }
        
        .counter-value {
          font-family: var(--font-orbitron), monospace;
          font-size: clamp(1.5rem, 6vmin, 4rem);
          font-weight: 900;
          color: rgb(255, 0, 0) !important;
          -webkit-text-stroke: 0.5px rgb(255, 0, 0) !important;
          letter-spacing: 0.5px;
          margin: 0;
          padding: 0;
          line-height: 1;
          transition: transform 0.15s ease;
          will-change: transform;
          transform: translateZ(0) scale(1);
          backface-visibility: hidden;
          text-shadow: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          text-align: center;
          white-space: nowrap;
        }
        
        .counter-animate {
          transform: scale(1.25);
        }
        
        .counter-offline {
          opacity: 0.8;
          text-shadow: none !important;
        }
        
        .error-message {
          font-size: clamp(0.6rem, 1.8vmin, 1rem);
          color: #777;
          margin-top: clamp(0.2vh, 0.5vh, 1vh);
          text-align: center;
          font-family: var(--font-orbitron), monospace;
        }

        @media (max-width: 360px) {
          .counter-value {
            font-size: clamp(1.2rem, 5vmin, 3rem);
            letter-spacing: 0.3px;
          }
          
          .error-message {
            font-size: clamp(0.5rem, 1.5vmin, 0.8rem);
          }
        }

        @media (max-height: 500px) {
          .counter-value {
            font-size: clamp(1.3rem, 5.5vmin, 3.5rem);
          }
        }

        @media (min-width: 1600px) {
          .counter-value {
            font-size: clamp(2rem, 5vmin, 4.5rem);
          }
        }
      `}</style>
    </div>
  )
})

export default SingleEventCounter

declare global {
  interface Window {
    updateCounterDisplay?: (increment?: number) => void
  }
}
