"use client"
import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  blur?: boolean
  duration?: number
  ease?: string
  delay?: number
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = false,
  duration = 400,
  ease = 'power2.out',
  delay = 0,
  className = '',
  style,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const getSeconds = (val: number) => (val > 10 ? val / 1000 : val)

    gsap.set(el, {
      autoAlpha: 0,
      filter: blur ? 'blur(8px)' : 'blur(0px)',
    })
    gsap.to(el, {
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: getSeconds(duration),
      ease,
      delay: getSeconds(delay),
    })

    return () => { gsap.killTweensOf(el) }
  }, [])

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden', ...style }} {...props}>
      {children}
    </div>
  )
}

export default FadeContent
