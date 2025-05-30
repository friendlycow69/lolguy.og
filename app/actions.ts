"use server"

import { redis, COUNTER_KEY } from "@/lib/redis"

// IMPORTANT: The counter was over 170k, so we need to restore that value
// Setting a higher fallback to prevent resets
const FALLBACK_COUNTER = 170000

// Safe number parsing function
function safeParseNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null
  }

  // If it's already a number
  if (typeof value === "number") {
    return isNaN(value) ? null : value
  }

  // If it's a string
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return isNaN(parsed) ? null : parsed
  }

  // If it's an array (this is what causes t.map errors)
  if (Array.isArray(value)) {
    console.warn("Redis returned array, extracting first element:", value)
    if (value.length > 0) {
      return safeParseNumber(value[0])
    }
    return null
  }

  // If it's an object
  if (typeof value === "object" && value !== null) {
    console.warn("Redis returned object:", value)

    // Try common object patterns
    if ("value" in value) {
      return safeParseNumber(value.value)
    }
    if ("data" in value) {
      return safeParseNumber(value.data)
    }
    if ("result" in value) {
      return safeParseNumber(value.result)
    }

    // Try to convert object to string and parse
    try {
      const stringified = String(value)
      const parsed = Number.parseInt(stringified, 10)
      return isNaN(parsed) ? null : parsed
    } catch (e) {
      console.error("Failed to stringify object:", e)
      return null
    }
  }

  // Try to convert whatever it is to string and parse
  try {
    const stringified = String(value)
    const parsed = Number.parseInt(stringified, 10)
    return isNaN(parsed) ? null : parsed
  } catch (e) {
    console.error("Failed to parse value:", value, e)
    return null
  }
}

// Initialize the counter if it doesn't exist
export async function initializeCounter() {
  try {
    // Check if we have valid Redis credentials
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Redis credentials not found, using fallback")
      return false
    }

    // Use EXISTS to check if the key exists
    const exists = await redis.exists(COUNTER_KEY)

    if (exists === 0) {
      // Counter doesn't exist, initialize it with the higher value
      console.log("Counter doesn't exist, initializing with", FALLBACK_COUNTER)
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return true
    }

    console.log("Counter already exists")
    return true
  } catch (error) {
    console.error("Error initializing counter:", error)
    return false
  }
}

// Get the current counter value - NEVER reset to lower values
export async function getCounter(): Promise<number> {
  try {
    // Check if we have valid Redis credentials
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Redis credentials not found, returning fallback counter")
      return FALLBACK_COUNTER
    }

    // Initialize counter if needed
    await initializeCounter()

    // Get the counter value using GET command with enhanced error handling
    let count: any
    try {
      count = await redis.get(COUNTER_KEY)
      console.log("Raw counter value from Redis:", count, "Type:", typeof count)
    } catch (redisError) {
      console.error("Redis GET operation failed:", redisError)

      // Check if it's specifically a t.map error
      if (redisError && typeof redisError === "object" && "message" in redisError) {
        if (redisError.message.includes("t.map")) {
          console.error("DETECTED t.map ERROR - Redis response parsing issue")
          console.error("This usually means Redis returned an unexpected data structure")
        }
      }

      throw redisError
    }

    // Use safe parsing function
    const parsedCount = safeParseNumber(count)

    if (parsedCount === null) {
      console.log("Could not parse counter value, setting to fallback...")
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return FALLBACK_COUNTER
    }

    // CRITICAL: Never allow the counter to go below the known high value
    if (parsedCount < FALLBACK_COUNTER) {
      console.warn(`Counter value ${parsedCount} is below expected minimum ${FALLBACK_COUNTER}, correcting...`)
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return FALLBACK_COUNTER
    }

    return parsedCount
  } catch (error) {
    console.error("Error getting counter, using fallback:", error)

    // Enhanced error logging to catch t.map issues
    if (error && typeof error === "object") {
      if ("message" in error) {
        console.error("Error message:", error.message)

        // Check if it's specifically a t.map error
        if (error.message.includes("t.map")) {
          console.error("DETECTED t.map ERROR - This is likely a Redis response parsing issue")
          console.error("Full error object:", JSON.stringify(error, null, 2))
        }
      }
      if ("stack" in error) {
        console.error("Error stack:", error.stack)
      }
    }

    return FALLBACK_COUNTER
  }
}

// Increment the counter by 1 with safe parsing
export async function incrementCounter(): Promise<number> {
  try {
    // Check if we have valid Redis credentials
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Redis credentials not found, returning fallback counter")
      return FALLBACK_COUNTER
    }

    await initializeCounter()

    let newCount: any
    try {
      newCount = await redis.incr(COUNTER_KEY)
      console.log("Counter incremented to:", newCount)
    } catch (redisError) {
      console.error("Redis INCR operation failed:", redisError)
      throw redisError
    }

    // Use safe parsing function
    const parsedCount = safeParseNumber(newCount)

    if (parsedCount === null) {
      console.warn("Could not parse incremented value, using fallback")
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return FALLBACK_COUNTER
    }

    // Ensure we never return a value below the minimum
    if (parsedCount < FALLBACK_COUNTER) {
      console.warn(`Increment resulted in ${parsedCount}, correcting to minimum...`)
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return FALLBACK_COUNTER
    }

    return parsedCount
  } catch (error) {
    console.error("Error incrementing counter:", error)
    return FALLBACK_COUNTER
  }
}

// Increment the counter by a specific amount and return the new value
export async function incrementCounterByAmount(amount: number): Promise<number> {
  if (!amount || amount <= 0) {
    return getCounter()
  }

  try {
    // Check if we have valid Redis credentials
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Redis credentials not found, returning fallback counter")
      return FALLBACK_COUNTER
    }

    await initializeCounter()

    let newCount: any
    try {
      // Use INCRBY for efficient batch increment
      newCount = await redis.incrby(COUNTER_KEY, amount)
      console.log(`Counter incremented by ${amount} to:`, newCount)
    } catch (redisError) {
      console.error("Redis INCRBY operation failed:", redisError)
      throw redisError
    }

    // Use safe parsing function
    const parsedCount = safeParseNumber(newCount)

    if (parsedCount === null) {
      console.warn("Could not parse batch incremented value, using fallback")
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return FALLBACK_COUNTER
    }

    // Ensure we never return a value below the minimum
    if (parsedCount < FALLBACK_COUNTER) {
      console.warn(`Batch increment resulted in ${parsedCount}, correcting to minimum...`)
      await redis.set(COUNTER_KEY, FALLBACK_COUNTER)
      return FALLBACK_COUNTER
    }

    return parsedCount
  } catch (error) {
    console.error(`Error incrementing counter by ${amount}:`, error)
    return FALLBACK_COUNTER
  }
}
