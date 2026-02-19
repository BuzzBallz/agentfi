"use client"

import React, { useRef, useCallback } from "react"
import "./TiltedCard.css"

interface TiltedCardProps {
  imageSrc: string
  altText?: string
  captionText?: string
  containerHeight?: string
  containerWidth?: string
  imageHeight?: string
  imageWidth?: string
  scaleOnHover?: number
  rotateAmplitude?: number
  showMobileWarning?: boolean
  showTooltip?: boolean
  displayOverlayContent?: boolean
  overlayContent?: React.ReactNode
}

const TiltedCard: React.FC<TiltedCardProps> = ({
  imageSrc,
  altText = "",
  captionText = "",
  containerHeight = "400px",
  containerWidth = "100%",
  imageHeight = "400px",
  imageWidth = "100%",
  scaleOnHover = 1.05,
  rotateAmplitude = 12,
  showMobileWarning = false,
  showTooltip = true,
  displayOverlayContent = false,
  overlayContent,
}) => {
  const innerRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLSpanElement>(null)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = innerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const px = x / rect.width
      const py = y / rect.height
      const rotateY = (px - 0.5) * rotateAmplitude * 2
      const rotateX = (0.5 - py) * rotateAmplitude * 2
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleOnHover})`

      // Move caption tooltip
      if (captionRef.current && showTooltip) {
        captionRef.current.style.left = `${x}px`
        captionRef.current.style.top = `${y - 40}px`
        captionRef.current.style.opacity = "1"
      }
    },
    [rotateAmplitude, scaleOnHover, showTooltip]
  )

  const handleMouseEnter = useCallback(() => {}, [])

  const handleMouseLeave = useCallback(() => {
    const el = innerRef.current
    if (el) {
      el.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)"
    }
    if (captionRef.current) {
      captionRef.current.style.opacity = "0"
    }
  }, [])

  return (
    <figure
      className="tilted-card-figure"
      style={{ height: containerHeight, width: containerWidth }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <p className="tilted-card-mobile-alert">
          Hover to interact
        </p>
      )}

      <div
        ref={innerRef}
        className="tilted-card-inner"
        style={{
          width: imageWidth,
          height: imageHeight,
          transition: "transform 0.2s ease-out",
        }}
      >
        {/* Background image */}
        <img
          className="tilted-card-img"
          src={imageSrc}
          alt={altText}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Overlay content */}
        {displayOverlayContent && overlayContent && (
          <div className="tilted-card-overlay">
            {overlayContent}
          </div>
        )}
      </div>

      {/* Floating caption tooltip */}
      {showTooltip && captionText && (
        <span
          ref={captionRef}
          className="tilted-card-caption"
          style={{ opacity: 0, transition: "opacity 0.2s" }}
        >
          {captionText}
        </span>
      )}
    </figure>
  )
}

export default TiltedCard
