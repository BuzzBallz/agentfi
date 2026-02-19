"use client"
import { useRef, useEffect, useCallback, FC, CSSProperties } from 'react'
import { gsap } from 'gsap'
import './DotGrid.css'

interface Dot {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  scale: number
}

interface DotGridProps {
  dotSize?: number
  gap?: number
  baseColor?: string
  activeColor?: string
  proximity?: number
  speedTrigger?: number
  shockRadius?: number
  shockStrength?: number
  maxSpeed?: number
  resistance?: number
  returnDuration?: number
  className?: string
  style?: CSSProperties
}

const DotGrid: FC<DotGridProps> = ({
  dotSize = 4,
  gap = 28,
  baseColor = '#3D2E1A',
  activeColor = '#C9A84C',
  proximity = 120,
  shockRadius = 200,
  shockStrength = 4,
  returnDuration = 1.5,
  className = '',
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)

  const buildGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    const dots: Dot[] = []
    const step = dotSize + gap

    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        dots.push({ baseX: x, baseY: y, x, y, vx: 0, vy: 0, color: baseColor, scale: 1 })
      }
    }
    dotsRef.current = dots
  }, [dotSize, gap, baseColor])

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    buildGrid()
  }, [buildGrid])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  // Mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Click shock
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const dots = dotsRef.current
      const mx = e.clientX
      const my = e.clientY

      for (const dot of dots) {
        const dx = dot.baseX - mx
        const dy = dot.baseY - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < shockRadius && dist > 0) {
          const force = (1 - dist / shockRadius) * shockStrength * (dotSize + gap)
          const angle = Math.atan2(dy, dx)
          const targetX = dot.baseX + Math.cos(angle) * force
          const targetY = dot.baseY + Math.sin(angle) * force

          gsap.to(dot, {
            x: targetX,
            y: targetY,
            duration: 0.15,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(dot, {
                x: dot.baseX,
                y: dot.baseY,
                duration: returnDuration,
                ease: 'elastic.out(1, 0.3)',
              })
            },
          })
        }
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [shockRadius, shockStrength, dotSize, gap, returnDuration])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const proxSq = proximity * proximity

      for (const dot of dotsRef.current) {
        const dx = dot.x - mx
        const dy = dot.y - my
        const distSq = dx * dx + dy * dy

        let color = baseColor
        let size = dotSize

        if (distSq < proxSq) {
          const t = 1 - Math.sqrt(distSq) / proximity
          color = activeColor
          size = dotSize * (1 + t * 0.5)
        }

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, size / 2, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dotSize, baseColor, activeColor, proximity])

  return (
    <section className={`dot-grid ${className}`} style={{ ...style, pointerEvents: 'auto' }}>
      <div className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  )
}

export default DotGrid
