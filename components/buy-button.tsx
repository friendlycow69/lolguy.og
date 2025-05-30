"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"

const TOKEN_ADDRESS = "53Xy4g1RJnGR6saaJRDNoo1rYTGZ3W5U321EDdSa5BGD"

export default function BuyButton() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <a
      href={`https://jup.ag/swap/USDC-${TOKEN_ADDRESS}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`buy-button ${isHovered ? "hovered" : ""} zero-gravity-sync-primary`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="buy-text">Buy $LOL</span>
      <ExternalLink size={14} />

      <style jsx>{`
        .buy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: white;
          color: black;
          padding: 10px 18px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: var(--font-orbitron), monospace;
          font-size: 16px;
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          margin: 10px 0;
          border: 2px solid rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          will-change: background-position, transform, box-shadow;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .buy-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
          transition: left 0.5s ease;
          z-index: 1;
        }
        
        .buy-button:hover::before {
          left: 100%;
        }
        
        .buy-text {
          font-weight: 900;
          font-size: 18px;
          letter-spacing: 0.5px;
          text-shadow: 
            0 1px 2px rgba(255, 255, 255, 0.3),
            0 0 5px rgba(0, 0, 0, 0.1);
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
        }
        
        .buy-button:hover, .buy-button.hovered {
          background: #f0f0f0;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 8px 25px rgba(0, 0, 0, 0.3),
            0 4px 15px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-color: rgba(0, 0, 0, 0.5);
        }
        
        .buy-button:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </a>
  )
}
