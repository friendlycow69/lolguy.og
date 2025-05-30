import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Orbitron } from "next/font/google"
import "./globals.css"

// Load Inter font with display swap for better performance
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
})

// Load Orbitron font with display swap
const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  preload: true,
})

export const metadata: Metadata = {
  title: "LOL Guy",
  description: "NOT a laugh. Just a reflex.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    type: "website",
    title: "LOL Guy",
    description: "NOT a laugh. Just a reflex.",
    url: "https://lolguy.vercel.app",
    siteName: "LOL Guy",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "LOL Guy",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "LOL Guy",
    description: "NOT a laugh. Just a reflex.",
    images: ["/favicon.png"],
  },
  appleWebApp: {
    title: "LOL Guy",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  applicationName: "LOL Guy",
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
}

// Use a fixed version string instead of Date.now()
const APP_VERSION = "1.0.0"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <head>
        {/* Preload critical assets with fixed version parameter */}
        <link rel="preload" href={`/lol-face-normal.png?v=${APP_VERSION}`} as="image" />
        <link rel="preload" href={`/lol-face-main.png?v=${APP_VERSION}`} as="image" />

        {/* Preload audio file with high priority */}
        <link
          rel="preload"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lol-XxQcFKN8D5ethnP5xWnU74vds4Prg1.mp3"
          as="audio"
          type="audio/mpeg"
          fetchPriority="high"
        />

        <link rel="preconnect" href="https://v0.blob.com" />
        <link rel="preconnect" href="https://unpkg.com" />
        <meta name="color-scheme" content="light" />
        {/* Service worker registration with simplified update handling */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js?v=${APP_VERSION}').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    // Check for updates less frequently (every 5 minutes)
                    setInterval(() => {
                      registration.update().catch(err => console.log('SW update check error:', err));
                    }, 300000);
                    
                    // When a new service worker is waiting, skip waiting without prompting
                    if (registration.waiting) {
                      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    
                    // Listen for new service workers
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is waiting, apply it without prompting
                            console.log('New version available, applying update...');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      }
                    });
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
                
                // Detect controller change and reload once
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (!refreshing) {
                    refreshing = true;
                    console.log('New service worker activated, reloading page...');
                    window.location.reload();
                  }
                });
              });
            }
            
            // Initialize audio system early
            window.addEventListener('DOMContentLoaded', function() {
              // Try to warm up audio system
              try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                  const silentContext = new AudioContextClass();
                  const oscillator = silentContext.createOscillator();
                  const gain = silentContext.createGain();
                  gain.gain.value = 0.001; // Nearly silent
                  oscillator.connect(gain);
                  gain.connect(silentContext.destination);
                  oscillator.start();
                  setTimeout(() => {
                    oscillator.stop();
                    // Don't close the context to keep audio system warm
                  }, 1);
                }
              } catch (e) {
                console.error('Error initializing audio system:', e);
              }
            });
          `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white text-black overflow-hidden`}>{children}</body>
    </html>
  )
}
