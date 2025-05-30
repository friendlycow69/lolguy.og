"use client"

import { useEffect, useRef, memo } from "react"

// Use memo to prevent unnecessary re-renders
const SimpleSound = memo(function SimpleSound() {
  // Use refs for performance and cleanup
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const activeSourcesRef = useRef<Set<AudioScheduledSourceNode>>(new Set())
  const isInitializedRef = useRef<boolean>(false)
  const masterGainRef = useRef<GainNode | null>(null)
  const compressorRef = useRef<DynamicsCompressorNode | null>(null)
  const limiterRef = useRef<DynamicsCompressorNode | null>(null)
  const audioLoadedRef = useRef<boolean>(false)
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const preloadedAudioRef = useRef<HTMLAudioElement[]>([])
  const audioUrlRef = useRef<string>(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lol-XxQcFKN8D5ethnP5xWnU74vds4Prg1.mp3",
  )
  const APP_VERSION = "1.0.0"

  const PRELOAD_AUDIO_COUNT = 40
  const MAX_CONCURRENT_SOUNDS = 15
  const PLAYBACK_RATE = 0.8 // Downscaled from 1.4 to 0.8

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const versionedAudioUrl = `${audioUrlRef.current}?v=${APP_VERSION}`
    audioUrlRef.current = versionedAudioUrl

    const initAudioContext = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          console.log("Creating AudioContext optimized for +40% speed overlapping sounds...")
          audioContextRef.current = new AudioContextClass({
            latencyHint: "interactive",
            sampleRate: 44100,
          })

          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            console.log("Resuming AudioContext...")
            audioContextRef.current.resume().catch((e) => console.error("Failed to resume AudioContext:", e))
          }

          if (audioContextRef.current) {
            masterGainRef.current = audioContextRef.current.createGain()
            masterGainRef.current.gain.value = 0.8

            compressorRef.current = audioContextRef.current.createDynamicsCompressor()
            compressorRef.current.threshold.value = -12
            compressorRef.current.knee.value = 10
            compressorRef.current.ratio.value = 4
            compressorRef.current.attack.value = 0.003
            compressorRef.current.release.value = 0.1

            limiterRef.current = audioContextRef.current.createDynamicsCompressor()
            limiterRef.current.threshold.value = -3
            limiterRef.current.knee.value = 0
            limiterRef.current.ratio.value = 20
            limiterRef.current.attack.value = 0.001
            limiterRef.current.release.value = 0.05

            masterGainRef.current.connect(compressorRef.current)
            compressorRef.current.connect(limiterRef.current)
            limiterRef.current.connect(audioContextRef.current.destination)

            console.log("Audio processing chain created with 2x speed support")
          }
        }
      } catch (e) {
        console.error("Failed to initialize AudioContext:", e)
      }
    }

    initAudioContext()

    const fetchAudio = async () => {
      try {
        console.log("Fetching audio data...")
        const response = await fetch(versionedAudioUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()

        if (audioContextRef.current) {
          console.log("Decoding audio data...")
          const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
          audioBufferRef.current = buffer
          audioLoadedRef.current = true
          console.log(`Audio data loaded and decoded successfully. Duration: ${buffer.duration}s`)
        }
      } catch (error) {
        console.error("Error loading audio:", error)
        preloadFallbackAudio()
      }
    }

    const preloadFallbackAudio = () => {
      console.log("Preloading fallback audio elements...")

      fallbackAudioRef.current = new Audio(versionedAudioUrl)
      fallbackAudioRef.current.preload = "auto"
      fallbackAudioRef.current.volume = 0.7
      fallbackAudioRef.current.playbackRate = PLAYBACK_RATE // 2x speed

      fallbackAudioRef.current.addEventListener("canplaythrough", () => {
        console.log("Fallback audio loaded with +40% speed")
        audioLoadedRef.current = true
      })

      fallbackAudioRef.current.addEventListener("error", (e) => {
        console.error("Fallback audio loading error:", e)
      })

      fallbackAudioRef.current.load()

      for (let i = 0; i < PRELOAD_AUDIO_COUNT; i++) {
        const audio = new Audio(versionedAudioUrl)
        audio.preload = "auto"
        audio.volume = 0.7
        audio.playbackRate = PLAYBACK_RATE // 2x speed
        audio.load()
        preloadedAudioRef.current.push(audio)
      }
    }

    fetchAudio()
    preloadFallbackAudio()

    const resumeAudioContext = () => {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((e) => console.error("Failed to resume AudioContext:", e))
      }
    }

    window.addEventListener("mousedown", resumeAudioContext, { once: true })
    window.addEventListener("touchstart", resumeAudioContext, { once: true })
    window.addEventListener("keydown", resumeAudioContext, { once: true })

    const adjustMasterVolume = () => {
      if (!masterGainRef.current) return

      const activeSounds = activeSourcesRef.current.size
      let targetVolume = 0.8

      if (activeSounds > 1) {
        targetVolume = 0.8 / Math.sqrt(activeSounds * 0.7)
        targetVolume = Math.max(targetVolume, 0.3)
      }

      masterGainRef.current.gain.setTargetAtTime(targetVolume, audioContextRef.current!.currentTime, 0.05)
    }

    const playSound = () => {
      console.log("Playing LOL sound at 2x speed with intelligent overlapping")

      if (audioContextRef.current && audioBufferRef.current && masterGainRef.current) {
        try {
          if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume()
          }

          if (activeSourcesRef.current.size >= MAX_CONCURRENT_SOUNDS) {
            const oldestSource = activeSourcesRef.current.values().next().value
            if (oldestSource) {
              try {
                oldestSource.stop()
                oldestSource.disconnect()
                activeSourcesRef.current.delete(oldestSource)
              } catch (e) {
                // Ignore errors when stopping old sources
              }
            }
          }

          const source = audioContextRef.current.createBufferSource()
          source.buffer = audioBufferRef.current
          source.playbackRate.value = PLAYBACK_RATE // 2x speed

          const sourceGain = audioContextRef.current.createGain()
          sourceGain.gain.value = 1.0

          source.connect(sourceGain)
          sourceGain.connect(masterGainRef.current)

          activeSourcesRef.current.add(source)
          adjustMasterVolume()

          source.start(0)

          console.log(
            `Started +40% speed audio source. Active: ${activeSourcesRef.current.size}/${MAX_CONCURRENT_SOUNDS}`,
          )

          source.onended = () => {
            source.disconnect()
            sourceGain.disconnect()
            activeSourcesRef.current.delete(source)
            adjustMasterVolume()
          }

          return
        } catch (e) {
          console.error("Error playing with Web Audio API:", e)
        }
      }

      // Fallback method with 2x speed
      try {
        let audioToPlay: HTMLAudioElement | null = null

        if (preloadedAudioRef.current.length > 0) {
          audioToPlay = preloadedAudioRef.current.pop() || null
        }

        if (!audioToPlay) {
          audioToPlay = new Audio(audioUrlRef.current)
          audioToPlay.volume = 0.7
          audioToPlay.playbackRate = PLAYBACK_RATE // 2x speed
          audioToPlay.preload = "auto"
        }

        audioToPlay.currentTime = 0
        audioToPlay.volume = 0.7
        audioToPlay.playbackRate = PLAYBACK_RATE // Ensure 2x speed

        const handleEnded = () => {
          audioToPlay!.removeEventListener("ended", handleEnded)

          if (preloadedAudioRef.current.length < PRELOAD_AUDIO_COUNT) {
            audioToPlay!.currentTime = 0
            audioToPlay!.playbackRate = PLAYBACK_RATE // Maintain 2x speed
            preloadedAudioRef.current.push(audioToPlay!)
          } else {
            audioToPlay!.src = ""
            audioToPlay!.load()
          }
        }

        audioToPlay.addEventListener("ended", handleEnded)

        const playPromise = audioToPlay.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Fallback +40% speed audio started successfully")
            })
            .catch((e) => {
              console.error("Fallback audio play error:", e)
              audioToPlay!.removeEventListener("ended", handleEnded)

              const emergencyAudio = new Audio(audioUrlRef.current)
              emergencyAudio.volume = 0.7
              emergencyAudio.playbackRate = PLAYBACK_RATE // 2x speed
              emergencyAudio.play().catch((e) => console.error("Emergency audio failed:", e))
            })
        }
      } catch (e) {
        console.error("All audio playback methods failed:", e)
      }
    }

    window.playLolSound = playSound

    return () => {
      delete window.playLolSound

      window.removeEventListener("mousedown", resumeAudioContext)
      window.removeEventListener("touchstart", resumeAudioContext)
      window.removeEventListener("keydown", resumeAudioContext)

      activeSourcesRef.current.forEach((source) => {
        try {
          if ("stop" in source) source.stop()
          source.disconnect()
        } catch (e) {
          // Ignore errors during cleanup
        }
      })
      activeSourcesRef.current.clear()

      preloadedAudioRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ""
        audio.load()
      })
      preloadedAudioRef.current = []

      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause()
        fallbackAudioRef.current.src = ""
        fallbackAudioRef.current = null
      }

      if (masterGainRef.current) {
        masterGainRef.current.disconnect()
      }

      if (compressorRef.current) {
        compressorRef.current.disconnect()
      }

      if (limiterRef.current) {
        limiterRef.current.disconnect()
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch((e) => console.error("Error closing AudioContext:", e))
        audioContextRef.current = null
      }

      audioBufferRef.current = null
      masterGainRef.current = null
      compressorRef.current = null
      limiterRef.current = null
    }
  }, [])

  return null
})

export default SimpleSound

declare global {
  interface Window {
    playLolSound?: () => void
  }
}
