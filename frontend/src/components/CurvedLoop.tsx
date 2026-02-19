"use client"
import { useRef, useEffect, useState, useMemo, useId, FC, PointerEvent } from 'react'
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
  const offsetRef = useRef(0)
  const rafRef = useRef<number>(0)
  const draggingRef = useRef(false)
  const lastXRef = useRef(0)
  const velocityRef = useRef(0)

  const [width, setWidth] = useState(1200)

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
    const h = 120
    const midY = h / 2
    const cy = midY + curveAmount / 10
    return `M -${width * 0.5} ${midY} Q ${width * 0.5} ${cy} ${width * 1.5} ${midY}`
  }, [width, curveAmount])

  const repeatedText = useMemo(() => {
    let result = ''
    while (result.length < 600) result += marqueeText
    return result
  }, [marqueeText])

  useEffect(() => {
    const step = () => {
      if (!draggingRef.current) {
        const dir = direction === 'left' ? -1 : 1
        offsetRef.current += speed * dir * 0.5
        velocityRef.current *= 0.95
        offsetRef.current += velocityRef.current
      }

      if (offsetRef.current > 100) offsetRef.current -= 100
      if (offsetRef.current < -100) offsetRef.current += 100

      const textPath = svgRef.current?.querySelector('textPath')
      if (textPath) {
        textPath.setAttribute('startOffset', `${offsetRef.current}%`)
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [speed, direction])

  const onPointerDown = (e: PointerEvent) => {
    draggingRef.current = true
    lastXRef.current = e.clientX
    velocityRef.current = 0
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return
    const dx = e.clientX - lastXRef.current
    const pct = (dx / width) * 100
    offsetRef.current += pct
    velocityRef.current = pct * 0.5
    lastXRef.current = e.clientX
  }

  const onPointerUp = () => {
    draggingRef.current = false
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
        viewBox={`0 0 ${width} 120`}
        preserveAspectRatio="none"
      >
        <defs>
          <path id={pathId} d={pathD} fill="none" />
        </defs>
        <text className={className}>
          <textPath href={`#${pathId}`} startOffset="0%">
            {repeatedText}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

export default CurvedLoop
