"use client"

import type React from "react"

import { useState, useRef, memo, useEffect } from "react"
import { Copy } from "lucide-react"

const TOKEN_ADDRESS = "53Xy4g1RJnGR6saaJRDNoo1rYTGZ3W5U321EDdSa5BGD"

const CopyButton = memo(function CopyButton() {
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [buttonWidth, setButtonWidth] = useState<number | null>(null)
  const isCopyingRef = useRef(false)
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const vibrationSupportedRef = useRef<boolean | null>(null)

  useEffect(() => {
    vibrationSupportedRef.current =
      typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function"

    if (vibrationSupportedRef.current) {
      try {
        navigator.vibrate(1)
        console.log("Vibration API is supported and initialized")
      } catch (e) {
        console.warn("Vibration API is supported but failed to initialize:", e)
        vibrationSupportedRef.current = false
      }
    } else {
      console.warn("Vibration API is not supported on this device")
    }
  }, [])

  useEffect(() => {
    if (buttonRef.current && !buttonWidth) {
      const width = buttonRef.current.offsetWidth
      setButtonWidth(width)
    }
  }, [buttonWidth])

  const triggerVibration = () => {
    if (!vibrationSupportedRef.current) return false

    try {
      const success = navigator.vibrate([100, 30, 100, 30, 100])

      if (success) {
        console.log("Vibration triggered successfully")
      } else {
        console.warn("Vibration call returned false")
        setTimeout(() => {
          navigator.vibrate(200)
        }, 50)
      }

      return success
    } catch (e) {
      console.error("Vibration failed:", e)
      return false
    }
  }

  const fallbackCopyTextToClipboard = (text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const textArea = document.createElement("textarea")
        textArea.value = text

        Object.assign(textArea.style, {
          position: "fixed",
          left: "0",
          top: "0",
          width: "2em",
          height: "2em",
          padding: "0",
          border: "none",
          outline: "none",
          boxShadow: "none",
          background: "transparent",
          opacity: "0",
        })

        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)
        resolve(successful)
      } catch (err) {
        console.error("Fallback copy failed:", err)
        resolve(false)
      }
    })
  }

  const handleCopy = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()

    console.log("Copy button clicked")
    triggerVibration()

    if (isCopyingRef.current || copied) return
    isCopyingRef.current = true

    try {
      let copySuccessful = false

      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
          await navigator.clipboard.writeText(TOKEN_ADDRESS)
          copySuccessful = true
        } catch (clipboardError) {
          // Silently fallback to next method
        }
      }

      if (!copySuccessful) {
        copySuccessful = await fallbackCopyTextToClipboard(TOKEN_ADDRESS)
      }

      if (!copySuccessful) {
        window.prompt("Copy the address by pressing Ctrl+C / Cmd+C:", TOKEN_ADDRESS)
        copySuccessful = true
      }

      requestAnimationFrame(() => {
        setCopied(true)
      })

      if (copySuccessful) {
        setTimeout(() => triggerVibration(), 100)
      }

      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }

      copyTimerRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          setCopied(false)
          copyTimerRef.current = null
        })
      }, 3000)
    } catch (err) {
      console.error("Copy operation failed:", err)
    } finally {
      setTimeout(() => {
        isCopyingRef.current = false
      }, 300)
    }
  }

  return (
    <a
      ref={buttonRef}
      href="#"
      onClick={handleCopy}
      className={`copy-button ${isHovered ? "hovered" : ""} ${copied ? "copied" : ""} zero-gravity-sync-secondary`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonWidth ? { width: `${buttonWidth}px` } : {}}
    >
      <span className="copy-text">{copied ? "Copied" : "Copy CA"}</span>
      {copied ? <span className="check-icon-wrapper">✓</span> : <Copy size={14} />}

      <style jsx>{`
        .copy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: black !important;
          color: white !important;
          padding: 10px 18px;
          border-radius: 12px;
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: var(--font-orbitron), monospace;
          font-size: 16px;
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          margin: 10px 0;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          min-width: fit-content;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          position: relative;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          will-change: transform, box-shadow;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .copy-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
          z-index: 1;
        }
        
        .copy-button:hover::before {
          left: 100%;
        }

        .copy-text {
          font-weight: 900;
          font-size: 18px;
          letter-spacing: 0.5px;
          text-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.5),
            0 0 5px rgba(255, 255, 255, 0.1);
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          white-space: nowrap;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
          color: white !important;
        }

        .check-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #00ff00 !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 0, 0.5));
          animation: pulse-glow 1.5s infinite;
          transform-origin: center;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 900;
          vertical-align: middle;
          position: relative;
          z-index: 2;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.8);
        }
        
        @keyframes pulse-glow {
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
        
        /* FORCE BLACK BACKGROUND IN ALL STATES */
        .copy-button,
        .copy-button:hover,
        .copy-button:active,
        .copy-button:focus,
        .copy-button.hovered,
        .copy-button.copied,
        .copy-button.copied:hover,
        .copy-button.copied:active,
        .copy-button.copied:focus,
        .copy-button.copied.hovered {
          background: black !important;
          background-color: black !important;
          color: white !important;
        }

        /* Only allow transform and box-shadow changes on hover/active */
        .copy-button:hover, 
        .copy-button.hovered {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 8px 25px rgba(0, 0, 0, 0.5),
            0 4px 15px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .copy-button:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* Ensure text stays white in all states */
        .copy-button .copy-text,
        .copy-button:hover .copy-text,
        .copy-button:active .copy-text,
        .copy-button.copied .copy-text {
          color: white !important;
        }
      `}</style>
    </a>
  )
})

export default CopyButton
