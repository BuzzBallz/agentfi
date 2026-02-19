"use client"

import React, { useRef, useCallback, useState } from "react"
import "./MagicBento.css"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BentoCardProps {
  color: string
  title: string
  description: string
  label: string
}

interface MagicBentoProps {
  textAutoHide?: boolean
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  enableTilt?: boolean
  enableMagnetism?: boolean
  clickEffect?: boolean
  glowColor?: string
  spotlightRadius?: number
  particleCount?: number
}

/* ------------------------------------------------------------------ */
/*  Card data                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_GLOW_COLOR = "201, 168, 76"

const cardData: BentoCardProps[] = [
  {
    color: "#241A0E",
    title: "3 iNFTs",
    description: "Owned on 0G Chain",
    label: "Collection",
  },
  {
    color: "#241A0E",
    title: "0.031 ADI",
    description: "Total earned across all agents",
    label: "Earnings",
  },
  {
    color: "#241A0E",
    title: "My Agents",
    description: "Your iNFT collection on 0G Chain",
    label: "0G Testnet",
  },
]

/* ------------------------------------------------------------------ */
/*  Star particle                                                      */
/* ------------------------------------------------------------------ */

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.3 + 0.1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }))
}

/* ------------------------------------------------------------------ */
/*  Single card                                                        */
/* ------------------------------------------------------------------ */

interface CardInternalProps {
  card: BentoCardProps
  textAutoHide: boolean
  enableStars: boolean
  enableSpotlight: boolean
  enableBorderGlow: boolean
  enableTilt: boolean
  enableMagnetism: boolean
  clickEffect: boolean
  glowColor: string
  spotlightRadius: number
  particleCount: number
}

const BentoCard: React.FC<CardInternalProps> = ({
  card,
  textAutoHide,
  enableStars,
  enableSpotlight,
  enableBorderGlow,
  enableTilt,
  enableMagnetism,
  clickEffect,
  glowColor,
  spotlightRadius,
  particleCount,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [stars] = useState(() => generateStars(particleCount))
  const [clicked, setClicked] = useState(false)

  /* ---- Mouse tracking for glow / tilt / magnetism ---- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const px = (x / rect.width) * 100
      const py = (y / rect.height) * 100

      if (enableBorderGlow) {
        el.style.setProperty("--glow-x", `${px}%`)
        el.style.setProperty("--glow-y", `${py}%`)
        el.style.setProperty("--glow-intensity", "1")
      }

      if (enableSpotlight) {
        el.style.setProperty(
          "--spotlight",
          `radial-gradient(circle ${spotlightRadius}px at ${px}% ${py}%, rgba(${glowColor}, 0.06) 0%, transparent 100%)`
        )
      }

      if (enableTilt) {
        const tiltX = ((py - 50) / 50) * -6
        const tiltY = ((px - 50) / 50) * 6
        el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`
      }

      if (enableMagnetism) {
        const mx = ((px - 50) / 50) * 4
        const my = ((py - 50) / 50) * 4
        el.style.translate = `${mx}px ${my}px`
      }
    },
    [enableBorderGlow, enableSpotlight, enableTilt, enableMagnetism, glowColor, spotlightRadius]
  )

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty("--glow-intensity", "0")
    el.style.setProperty("--spotlight", "none")
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)"
    el.style.translate = "0px 0px"
  }, [])

  const handleClick = useCallback(() => {
    if (!clickEffect) return
    setClicked(true)
    setTimeout(() => setClicked(false), 400)
  }, [clickEffect])

  /* ---- Class names ---- */
  const classNames = [
    "magic-bento-card",
    enableBorderGlow ? "magic-bento-card--border-glow" : "",
    textAutoHide ? "magic-bento-card--text-autohide" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      ref={cardRef}
      className={classNames}
      style={{
        backgroundColor: card.color,
        transition: "transform 0.25s ease, translate 0.25s ease, border-color 0.3s",
        ...(enableSpotlight
          ? { backgroundImage: "var(--spotlight, none)" }
          : {}),
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Stars / particles */}
      {enableStars && (
        <div
          className="particle-container"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {stars.map((s) => (
            <div
              key={s.id}
              style={{
                position: "absolute",
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                background: `rgba(${glowColor}, ${s.opacity})`,
                animation: `floatStar ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Click ripple */}
      {clicked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: `radial-gradient(circle, rgba(${glowColor}, 0.12) 0%, transparent 70%)`,
            animation: "clickPulse 0.4s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Header — label pill */}
      <div className="magic-bento-card__header">
        <span className="magic-bento-card__label">{card.label}</span>
      </div>

      {/* Content */}
      <div className="magic-bento-card__content">
        <h3 className="magic-bento-card__title">{card.title}</h3>
        <p className="magic-bento-card__description">{card.description}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MagicBento (exported)                                              */
/* ------------------------------------------------------------------ */

const MagicBento: React.FC<MagicBentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  glowColor = DEFAULT_GLOW_COLOR,
  spotlightRadius = 300,
  particleCount = 10,
}) => {
  return (
    <section className="bento-section">
      <div className="card-grid">
        {cardData.map((card, i) => (
          <BentoCard
            key={i}
            card={card}
            textAutoHide={textAutoHide}
            enableStars={enableStars}
            enableSpotlight={enableSpotlight}
            enableBorderGlow={enableBorderGlow}
            enableTilt={enableTilt}
            enableMagnetism={enableMagnetism}
            clickEffect={clickEffect}
            glowColor={glowColor}
            spotlightRadius={spotlightRadius}
            particleCount={particleCount}
          />
        ))}
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes floatStar {
          0%   { transform: translateY(0) scale(1);   opacity: 0.15; }
          100% { transform: translateY(-8px) scale(1.3); opacity: 0.4; }
        }
        @keyframes clickPulse {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </section>
  )
}

export default MagicBento
