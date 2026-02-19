"use client"
import { useRef, useEffect, useState, useId, FC, PointerEvent, useMemo } from 'react'
import './CurvedLoop.css'

interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  curveAmount?: number
  direction?: 'left' | 'right'
  className?: string
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = '✦ AgentFi ✦ AgentFi ✦ AgentFi ✦ ',
  speed = 1.5,
  curveAmount = 300,
  direction = 'left',
  className = '',
}) => {
  const pathId = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const textPathRef = useRef<SVGTextPathElement>(null)
  const dragRef = useRef(false)
  const dirRef = useRef(direction)
  const lastXRef = useRef(0)

  const [width, setWidth] = useState(1200)
  const [textLength, setTextLength] = useState(0)
  const [spacing, setSpacing] = useState(0)
  const [ready, setReady] = useState(false)

  // Keep dirRef in sync
  useEffect(() => { dirRef.current = direction }, [direction])

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        setWidth(svgRef.current.clientWidth || 1200)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const pathD = useMemo(() => {
    return `M -100 80 Q ${width * 0.5} ${80 - curveAmount} ${width + 100} 80`
  }, [width, curveAmount])

  const text = marqueeText

  const totalText = textLength
    ? Array(Math.ceil(3600 / textLength) + 4)
        .fill(text)
        .join('')
    : text

  // Measure one repeat of the text on the path
  useEffect(() => {
    if (!textPathRef.current || !svgRef.current) return
    const measure = () => {
      const tp = textPathRef.current
      if (!tp) return
      const len = tp.getComputedTextLength()
      if (len > 0 && totalText.length > text.length) {
        const oneRepeat = (len / totalText.length) * text.length
        setTextLength(text.length)
        setSpacing(oneRepeat)
        setReady(true)
      }
    }
    // Delay to let the SVG render
    const t = setTimeout(measure, 100)
    return () => clearTimeout(t)
  }, [text, totalText, width])

  useEffect(() => {
    if (!spacing || !ready) return
    let animationId: number
    let currentOffset = -spacing

    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === 'right' ? speed : -speed
        currentOffset += delta

        // Infinite wrap — reset seamlessly when crossing boundary
        if (currentOffset <= -spacing) currentOffset += spacing
        if (currentOffset > 0) currentOffset -= spacing

        textPathRef.current.setAttribute('startOffset', currentOffset + 'px')
      }
      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [spacing, speed, ready])

  const onPointerDown = (e: PointerEvent) => {
    dragRef.current = true
    lastXRef.current = e.clientX
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef.current || !textPathRef.current) return
    const dx = e.clientX - lastXRef.current
    textPathRef.current.setAttribute(
      'startOffset',
      (parseFloat(textPathRef.current.getAttribute('startOffset') || '0') + dx) + 'px'
    )
    lastXRef.current = e.clientX
  }

  const onPointerUp = () => {
    dragRef.current = false
  }

  return (
    <div
      className="curved-loop-jacket"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: 'grab', touchAction: 'none' }}
    >
      <svg
        ref={svgRef}
        className="curved-loop-svg"
        viewBox={`0 0 ${width} 180`}
        preserveAspectRatio="none"
      >
        <defs>
          <path id={pathId} d={pathD} fill="none" />
        </defs>
        <text className={className}>
          <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0">
            {totalText}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

export default CurvedLoop
