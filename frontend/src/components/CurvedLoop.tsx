"use client"
import { useRef, useEffect, useState, useMemo, useId, FC } from 'react'
import './CurvedLoop.css'

interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  className?: string
  curveAmount?: number
  direction?: 'left' | 'right'
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = '',
  speed = 2,
  className,
  curveAmount = 400,
  direction = 'left',
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText)
    return (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0'
  }, [marqueeText])

  const measureRef = useRef<SVGTextElement | null>(null)
  const textPathRef = useRef<SVGTextPathElement | null>(null)
  const [spacing, setSpacing] = useState(0)
  const uid = useId()
  const pathId = `curve-${uid}`
  const pathD = `M-100,80 Q720,${80 - curveAmount} 1540,80`

  const totalText = spacing
    ? Array(Math.ceil(5000 / spacing) + 6).fill(text).join('')
    : text

  const ready = spacing > 0

  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength())
  }, [text])

  useEffect(() => {
    if (!spacing || !ready) return
    let animationId: number
    let currentOffset = -spacing

    if (textPathRef.current) {
      textPathRef.current.setAttribute('startOffset', currentOffset + 'px')
    }

    const step = () => {
      if (textPathRef.current) {
        const delta = direction === 'right' ? speed : -speed
        currentOffset += delta
        if (currentOffset <= -spacing) currentOffset += spacing
        if (currentOffset > 0) currentOffset -= spacing
        textPathRef.current.setAttribute('startOffset', currentOffset + 'px')
      }
      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [spacing, speed, ready, direction])

  return (
    <div className="curved-loop-jacket" style={{ visibility: ready ? 'visible' : 'hidden', cursor: 'default', pointerEvents: 'none' }}>
      <svg className="curved-loop-svg" viewBox="0 0 1440 180">
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          {text}
        </text>
        <defs>
          <path id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text fontWeight="bold" xmlSpace="preserve" className={className}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={`${-spacing}px`} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  )
}

export default CurvedLoop
