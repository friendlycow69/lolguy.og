import { Redis } from "@upstash/redis"

// Create a Redis client with Upstash credentials from environment variables
// Vercel provides KV_REST_API_URL and KV_REST_API_TOKEN when using the Upstash integration
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
  automaticDeserialization: false, // DISABLE automatic deserialization to prevent t.map errors
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.exp(retryCount) * 50,
  },
})

// Counter key in the database
export const COUNTER_KEY = "lol_guy_counter"

// Function to check if Redis connection is working
export async function checkRedisConnection(): Promise<boolean> {
  try {
    // Simple ping to check connection
    const pong = await redis.ping()
    console.log("Redis connection test:", pong)
    return true
  } catch (error) {
    console.error("Redis connection error:", error)
    return false
  }
}
