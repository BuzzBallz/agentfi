"use client"
import { useRef, useCallback, FC, ReactNode, CSSProperties } from 'react'
import { gsap } from 'gsap'
import './PixelTransition.css'

interface PixelTransitionProps {
  firstContent: ReactNode
  secondContent: ReactNode
  gridSize?: number
  pixelColor?: string
  animationStepDuration?: number
  aspectRatio?: string
  style?: CSSProperties
  className?: string
}

const PixelTransition: FC<PixelTransitionProps> = ({
  firstContent,
  secondContent,
  gridSize = 7,
  pixelColor = '#ffffff',
  animationStepDuration = 0.3,
  aspectRatio = '100%',
  style,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pixelsRef = useRef<HTMLDivElement>(null)
  const defaultRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const animatingRef = useRef(false)
  const stateRef = useRef<'default' | 'active'>('default')

  const animatePixels = useCallback(
    (toActive: boolean) => {
      if (animatingRef.current) return
      animatingRef.current = true

      const pixelContainer = pixelsRef.current
      if (!pixelContainer) return

      const pixelEls = Array.from(
        pixelContainer.querySelectorAll<HTMLElement>('.pixelated-image-card__pixel')
      )

      const shuffled = [...pixelEls].sort(() => Math.random() - 0.5)
      const totalSteps = gridSize
      const perStep = Math.ceil(shuffled.length / totalSteps)
      const stepDelay = animationStepDuration / totalSteps

      const tl = gsap.timeline()

      // Phase 1 — show pixels to cover current content
      for (let i = 0; i < totalSteps; i++) {
        const batch = shuffled.slice(i * perStep, (i + 1) * perStep)
        tl.set(batch, { display: 'block' }, i * stepDelay)
      }

      // Phase 2 — swap content behind pixel layer
      tl.call(() => {
        if (defaultRef.current && activeRef.current) {
          if (toActive) {
            defaultRef.current.style.display = 'none'
            activeRef.current.style.display = 'flex'
          } else {
            activeRef.current.style.display = 'none'
            defaultRef.current.style.display = 'flex'
          }
          stateRef.current = toActive ? 'active' : 'default'
        }
      })

      // Phase 3 — hide pixels to reveal new content
      const reshuffled = [...pixelEls].sort(() => Math.random() - 0.5)
      for (let i = 0; i < totalSteps; i++) {
        const batch = reshuffled.slice(i * perStep, (i + 1) * perStep)
        tl.set(batch, { display: 'none' }, `>+${stepDelay}`)
      }

      tl.call(() => {
        animatingRef.current = false
      })
    },
    [gridSize, animationStepDuration]
  )

  const handleMouseEnter = useCallback(() => {
    if (stateRef.current === 'default') animatePixels(true)
  }, [animatePixels])

  const handleMouseLeave = useCallback(() => {
    if (stateRef.current === 'active') animatePixels(false)
  }, [animatePixels])

  const pixelSize = 100 / gridSize

  return (
    <div
      ref={containerRef}
      className={`pixelated-image-card ${className}`}
      style={{ ...style, paddingBottom: aspectRatio }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={defaultRef} className="pixelated-image-card__default">
        {firstContent}
      </div>
      <div ref={activeRef} className="pixelated-image-card__active">
        {secondContent}
      </div>
      <div ref={pixelsRef} className="pixelated-image-card__pixels">
        {Array.from({ length: gridSize * gridSize }, (_, i) => {
          const row = Math.floor(i / gridSize)
          const col = i % gridSize
          return (
            <div
              key={i}
              className="pixelated-image-card__pixel"
              style={{
                left: `${col * pixelSize}%`,
                top: `${row * pixelSize}%`,
                width: `${pixelSize + 0.5}%`,
                height: `${pixelSize + 0.5}%`,
                backgroundColor: pixelColor,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default PixelTransition
