// This is a simple service worker that helps with cache invalidation

// Cache version - change this when you deploy new versions
const CACHE_VERSION = Date.now().toString()
const CACHE_NAME = `lolguy-cache-${CACHE_VERSION}`

// Install event - precache critical resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "lol-face-normal.png",
        "lol-face-main.png",
        "lol-face-shouting.png",
        "small-bullet.png",
        "lol.mp3",
      ])
    }),
  )
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

// This file is not used directly - see app/sw.js/route.ts
// Keeping this file for reference only
