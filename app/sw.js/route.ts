import { NextResponse } from "next/server"

// Use a fixed version string instead of Date.now()
const APP_VERSION = "1.0.0"

export async function GET() {
  try {
    // Return a simplified service worker that doesn't try to directly access files
    const swContent = `
      // This is a simple service worker that helps with cache invalidation
      
      // Cache version - use fixed version instead of timestamp
      const CACHE_VERSION = "${APP_VERSION}"
      const CACHE_NAME = \`lolguy-cache-\${CACHE_VERSION}\`
      
      // Install event - we'll let the browser handle caching
      self.addEventListener("install", (event) => {
        // Activate the service worker immediately
        self.skipWaiting()
      })
      
      // Activate event - clean up old caches
      self.addEventListener("activate", (event) => {
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames
                .filter((name) => name.startsWith("lolguy-cache-") && name !== CACHE_NAME)
                .map((name) => caches.delete(name)),
            )
          }),
        )
        // Take control of all clients immediately
        self.clients.claim()
      })
      
      // Fetch event - network first, then cache
      self.addEventListener("fetch", (event) => {
        // Skip non-GET requests
        if (event.request.method !== "GET") return
        
        // Handle the fetch event
        event.respondWith(
          fetch(event.request)
            .then((response) => {
              // Only cache successful responses
              if (!response || !response.ok) {
                return response;
              }
              
              // Clone the response
              const responseClone = response.clone()
              
              // Open the cache
              caches.open(CACHE_NAME).then((cache) => {
                // Put the response in the cache
                cache.put(event.request, responseClone)
              })
              
              // Return the response
              return response
            })
            .catch(() => {
              // If fetch fails, try to get from cache
              return caches.match(event.request)
            }),
        )
      })
      
      // Skip waiting when a new version is available
      self.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SKIP_WAITING") {
          self.skipWaiting()
        }
      })
    `

    // Return the service worker with appropriate headers
    return new NextResponse(swContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error serving service worker:", error)
    return new NextResponse("Error serving service worker", { status: 500 })
  }
}
