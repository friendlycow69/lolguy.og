"use client"
import { useEffect, useState, useRef } from "react"

interface Cloud {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  delay: number
  type: number // Different cloud shape types
}

export default function CloudBackground() {
  const [clouds, setClouds] = useState<Cloud[]>([])
  const [mounted, setMounted] = useState(false)
  const [isAutofiring, setIsAutofiring] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cloudElementsRef = useRef<HTMLElement[]>([])
  const autofireCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Use a deterministic seed for consistent cloud generation
    const generateClouds = () => {
      const initialClouds: Cloud[] = []
      const cloudCount = 12 // Reduced count for better performance

      // Use a fixed seed for consistent generation across server/client
      let seed = 12345
      const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }

      for (let i = 0; i < cloudCount; i++) {
        // Distribute clouds across the entire screen width for immediate visibility
        const startX = (i / cloudCount) * 120 - 20 // Spread clouds evenly across screen

        initialClouds.push({
          id: i,
          x: startX + seededRandom() * 30 - 15, // Add some randomness to the distribution
          y: seededRandom() * 70 + 10, // Random height between 10% and 80%
          size: seededRandom() * 1.2 + 0.4, // Size between 0.4 and 1.6
          speed: seededRandom() * 0.4 + 0.15, // Speed between 0.15 and 0.55
          opacity: seededRandom() * 0.4 + 0.4, // Opacity between 0.4 and 0.8 (more visible)
          delay: 0, // No delay - start immediately
          type: Math.floor(seededRandom() * 8), // 8 different cloud types
        })
      }

      return initialClouds
    }

    // Set mounted first, then generate clouds
    setMounted(true)

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const generatedClouds = generateClouds()
      setClouds(generatedClouds)
      console.log("Clouds generated:", generatedClouds.length)
    })

    // Create cloud container as direct child of body
    const createCloudContainer = () => {
      // Check if container already exists
      const existingContainer = document.getElementById("cloud-background-container")
      if (existingContainer) {
        containerRef.current = existingContainer as HTMLDivElement
        return existingContainer
      }

      // Create new container
      const container = document.createElement("div")
      container.id = "cloud-background-container"
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "0"
      container.style.width = "100%"
      container.style.height = "100%"
      container.style.pointerEvents = "none"
      container.style.zIndex = "9999" // Very high z-index
      container.style.overflow = "hidden"

      // Add to body as first child to ensure it's behind other content
      if (document.body.firstChild) {
        document.body.insertBefore(container, document.body.firstChild)
      } else {
        document.body.appendChild(container)
      }

      containerRef.current = container
      return container
    }

    createCloudContainer()

    // Set up autofire detection
    const checkAutofireStatus = () => {
      // Check if autofire is active by looking for global autofire state
      const autofireActive = (window as any).isAutofiring || false
      if (autofireActive !== isAutofiring) {
        setIsAutofiring(autofireActive)
        console.log("Autofire status changed:", autofireActive)
      }
    }

    // Check autofire status every 100ms
    autofireCheckIntervalRef.current = setInterval(checkAutofireStatus, 100)

    return () => {
      // Clean up container on unmount
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current)
      }

      if (autofireCheckIntervalRef.current) {
        clearInterval(autofireCheckIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted || clouds.length === 0) return

    const createCloudContainer = () => {
      // Check if container already exists
      const existingContainer = document.getElementById("cloud-background-container")
      if (existingContainer) {
        containerRef.current = existingContainer as HTMLDivElement
        return existingContainer
      }

      // Create new container
      const container = document.createElement("div")
      container.id = "cloud-background-container"
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "0"
      container.style.width = "100%"
      container.style.height = "100%"
      container.style.pointerEvents = "none"
      container.style.zIndex = "9999" // Very high z-index
      container.style.overflow = "hidden"

      // Add to body as first child to ensure it's behind other content
      if (document.body.firstChild) {
        document.body.insertBefore(container, document.body.firstChild)
      } else {
        document.body.appendChild(container)
      }

      containerRef.current = container
      return container
    }

    createCloudContainer()

    if (!containerRef.current || clouds.length === 0) return

    // Clear existing clouds
    containerRef.current.innerHTML = ""
    cloudElementsRef.current = []

    // Create cloud elements
    clouds.forEach((cloud) => {
      const cloudElement = document.createElement("div")
      cloudElement.className = "cloud"
      cloudElement.style.position = "absolute"
      cloudElement.style.top = `${cloud.y}%`
      cloudElement.style.left = `${cloud.x}%`
      cloudElement.style.transform = `scale(${cloud.size})`
      cloudElement.style.opacity = `${cloud.opacity}`

      // Calculate base animation duration (slower = higher number)
      const baseDuration = 80 / cloud.speed // Base duration in seconds
      cloudElement.style.setProperty("--base-duration", `${baseDuration}s`)
      cloudElement.style.setProperty("--autofire-duration", `${baseDuration * 0.3}s`) // 3x faster during autofire

      cloudElement.style.animation = `drift-cloud var(--base-duration) linear infinite`
      cloudElement.style.willChange = "transform"
      cloudElement.style.filter = "blur(0.5px)"

      // Add cloud parts
      const cloudType = cloud.type

      // Create cloud parts based on type
      if (cloudType === 0) {
        // Cumulus
        createCloudPart(cloudElement, { width: "70px", height: "45px", top: "15px", left: "15px" })
        createCloudPart(cloudElement, { width: "50px", height: "50px", top: "8px", left: "5px" })
        createCloudPart(cloudElement, { width: "60px", height: "40px", top: "12px", left: "55px" })
        createCloudPart(cloudElement, { width: "45px", height: "45px", top: "2px", left: "35px" })
        createCloudPart(cloudElement, { width: "55px", height: "30px", top: "25px", left: "25px" })
      } else if (cloudType === 1) {
        // Stratus
        createCloudPart(cloudElement, { width: "120px", height: "25px", top: "20px", left: "10px" })
        createCloudPart(cloudElement, { width: "80px", height: "30px", top: "15px", left: "0px" })
        createCloudPart(cloudElement, { width: "90px", height: "28px", top: "18px", left: "40px" })
        createCloudPart(cloudElement, { width: "60px", height: "20px", top: "25px", left: "70px" })
      } else if (cloudType === 2) {
        // Cumulonimbus
        createCloudPart(cloudElement, { width: "55px", height: "70px", top: "5px", left: "20px" })
        createCloudPart(cloudElement, { width: "45px", height: "45px", top: "25px", left: "5px" })
        createCloudPart(cloudElement, { width: "50px", height: "50px", top: "20px", left: "45px" })
        createCloudPart(cloudElement, { width: "40px", height: "40px", top: "0px", left: "25px" })
        createCloudPart(cloudElement, { width: "35px", height: "35px", top: "35px", left: "35px" })
        createCloudPart(cloudElement, { width: "30px", height: "25px", top: "50px", left: "15px" })
      } else if (cloudType === 3) {
        // Cirrus
        createCloudPart(cloudElement, { width: "80px", height: "15px", top: "20px", left: "10px" }, "wispy")
        createCloudPart(cloudElement, { width: "60px", height: "12px", top: "15px", left: "30px" }, "wispy")
        createCloudPart(cloudElement, { width: "70px", height: "18px", top: "25px", left: "20px" }, "wispy")
        createCloudPart(cloudElement, { width: "45px", height: "10px", top: "30px", left: "40px" }, "wispy")
        createCloudPart(cloudElement, { width: "35px", height: "8px", top: "18px", left: "60px" }, "wispy")
      } else if (cloudType === 4) {
        // Altocumulus
        createCloudPart(cloudElement, { width: "40px", height: "35px", top: "15px", left: "10px" })
        createCloudPart(cloudElement, { width: "45px", height: "30px", top: "20px", left: "35px" })
        createCloudPart(cloudElement, { width: "35px", height: "40px", top: "8px", left: "60px" })
        createCloudPart(cloudElement, { width: "30px", height: "25px", top: "25px", left: "75px" })
        createCloudPart(cloudElement, { width: "25px", height: "30px", top: "12px", left: "85px" })
      } else if (cloudType === 5) {
        // Mammatus
        createCloudPart(cloudElement, { width: "60px", height: "35px", top: "5px", left: "15px" })
        createCloudPart(cloudElement, { width: "25px", height: "30px", top: "25px", left: "10px" }, "bubble")
        createCloudPart(cloudElement, { width: "30px", height: "35px", top: "20px", left: "35px" }, "bubble")
        createCloudPart(cloudElement, { width: "28px", height: "32px", top: "22px", left: "55px" }, "bubble")
        createCloudPart(cloudElement, { width: "45px", height: "25px", top: "8px", left: "45px" })
      } else if (cloudType === 6) {
        // Nimbus
        createCloudPart(cloudElement, { width: "80px", height: "50px", top: "10px", left: "10px" }, "dark")
        createCloudPart(cloudElement, { width: "60px", height: "45px", top: "5px", left: "0px" }, "dark")
        createCloudPart(cloudElement, { width: "70px", height: "40px", top: "15px", left: "50px" }, "dark")
        createCloudPart(cloudElement, { width: "50px", height: "35px", top: "0px", left: "30px" }, "dark")
        createCloudPart(cloudElement, { width: "40px", height: "25px", top: "30px", left: "20px" }, "dark")
      } else if (cloudType === 7) {
        // Fractus
        createCloudPart(cloudElement, { width: "30px", height: "20px", top: "15px", left: "10px" }, "small")
        createCloudPart(cloudElement, { width: "25px", height: "25px", top: "10px", left: "35px" }, "small")
        createCloudPart(cloudElement, { width: "35px", height: "18px", top: "20px", left: "55px" }, "small")
        createCloudPart(cloudElement, { width: "20px", height: "22px", top: "5px", left: "75px" }, "small")
        createCloudPart(cloudElement, { width: "28px", height: "15px", top: "25px", left: "85px" }, "small")
      } else {
        // Default cloud
        createCloudPart(cloudElement, { width: "60px", height: "40px", top: "10px", left: "20px" })
        createCloudPart(cloudElement, { width: "50px", height: "50px", top: "5px", left: "10px" })
        createCloudPart(cloudElement, { width: "40px", height: "30px", top: "15px", left: "40px" })
      }

      containerRef.current.appendChild(cloudElement)
      cloudElementsRef.current.push(cloudElement)
    })

    // Add styles to document head
    const styleElement = document.createElement("style")
    styleElement.id = "cloud-animation-styles"
    styleElement.textContent = `
      @keyframes drift-cloud {
        0% {
          transform: translateX(-20vw) scale(var(--cloud-size, 1));
        }
        100% {
          transform: translateX(120vw) scale(var(--cloud-size, 1));
        }
      }
      
      #cloud-background-container .cloud-part {
        position: absolute;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        filter: blur(0.6px);
        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      #cloud-background-container .cloud-part.wispy {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 20px;
      }
      
      #cloud-background-container .cloud-part.bubble {
        background: rgba(255, 255, 255, 0.7);
        border-radius: 30px;
      }
      
      #cloud-background-container .cloud-part.dark {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 40px;
      }
      
      #cloud-background-container .cloud-part.small {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 10px;
      }
      
      #cloud-background-container .cloud {
        --cloud-size: 1;
      }
    `

    // Remove existing style if it exists
    const existingStyle = document.getElementById("cloud-animation-styles")
    if (existingStyle) {
      document.head.removeChild(existingStyle)
    }

    document.head.appendChild(styleElement)

    return () => {
      const styleToRemove = document.getElementById("cloud-animation-styles")
      if (styleToRemove && document.head.contains(styleToRemove)) {
        document.head.removeChild(styleToRemove)
      }
    }
  }, [clouds, mounted])

  // Update cloud speeds when autofire status changes
  useEffect(() => {
    if (!containerRef.current || cloudElementsRef.current.length === 0) return

    console.log("Updating cloud speeds - Autofire:", isAutofiring)

    cloudElementsRef.current.forEach((cloudElement) => {
      if (isAutofiring) {
        // Switch to faster animation during autofire
        cloudElement.style.animation = `drift-cloud var(--autofire-duration) linear infinite`
        cloudElement.style.filter = "blur(0.8px)" // Slightly more blur for speed effect
      } else {
        // Return to normal speed
        cloudElement.style.animation = `drift-cloud var(--base-duration) linear infinite`
        cloudElement.style.filter = "blur(0.5px)"
      }
    })
  }, [isAutofiring])

  // Helper function to create cloud parts
  function createCloudPart(
    parent: HTMLElement,
    style: { width: string; height: string; top: string; left: string },
    className?: string,
  ) {
    const part = document.createElement("div")
    part.className = `cloud-part ${className || ""}`
    part.style.position = "absolute"
    part.style.width = style.width
    part.style.height = style.height
    part.style.top = style.top
    part.style.left = style.left
    part.style.background = "rgba(255, 255, 255, 0.95)"
    part.style.borderRadius = "50%"
    part.style.filter = "blur(0.6px)"
    part.style.boxShadow = "0 2px 8px rgba(255, 255, 255, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)"
    parent.appendChild(part)
  }

  // Return empty fragment since we're rendering directly to body
  return null
}
