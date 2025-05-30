import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Generate the favicon using the LOL face image
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lol-face-main-lyzoWnJ41KYQ8k0BOaTxDGi9NNOVLr.png",
    )
    const imageData = await response.arrayBuffer()

    // Return the image directly
    return new Response(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (e) {
    console.error(e)
    return new Response("Failed to generate favicon", { status: 500 })
  }
}
