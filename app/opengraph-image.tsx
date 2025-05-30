import { ImageResponse } from "next/og"

export const alt = "LOL Guy"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        position: "relative",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
        }}
      />

      {/* LOL Face Image */}
      <img
        src={`https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lol-face-main-lyzoWnJ41KYQ8k0BOaTxDGi9NNOVLr.png`}
        alt="LOL Guy"
        width={400}
        height={400}
        style={{
          margin: "0 auto",
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 60,
          fontWeight: "bold",
          marginTop: 40,
          color: "black",
        }}
      >
        LOL Guy
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 30,
          marginTop: 24,
          color: "black",
        }}
      >
        NOT a laugh. Just a reflex.
      </div>
    </div>,
    {
      ...size,
    },
  )
}
