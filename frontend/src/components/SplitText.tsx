"use client"
import React, { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  ease?: string | ((t: number) => number)
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars'
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  threshold?: number
  rootMargin?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  textAlign?: React.CSSProperties['textAlign']
  onLetterAnimationComplete?: () => void
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 30,
  duration = 0.6,
  ease = 'power3.out',
  splitType: _splitType = 'chars',
  from: _from = { opacity: 0, y: 20 },
  to: _to = { opacity: 1, y: 0 },
  threshold: _threshold = 0.1,
  rootMargin: _rootMargin = '-10px',
  textAlign = 'left',
  tag = 'p',
  onLetterAnimationComplete,
}) => {
  const ref = useRef<HTMLElement>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    if (document.fonts.status === 'loaded') setFontsLoaded(true)
    else document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  useEffect(() => {
    if (!ref.current || !text || !fontsLoaded) return
    const el = ref.current
    const letters = text.split('')
    el.innerHTML = letters
      .map((ch) => `<span style="display:inline-block;opacity:0;transform:translateY(20px)">${ch === ' ' ? '&nbsp;' : ch}</span>`)
      .join('')

    const spans = el.querySelectorAll('span')
    gsap.to(spans, {
      opacity: 1,
      y: 0,
      duration,
      ease,
      stagger: delay / 1000,
      onComplete: () => onLetterAnimationComplete?.(),
    })

    return () => { gsap.killTweensOf(spans) }
  }, [text, fontsLoaded, delay, duration, ease])

  const Tag = (tag || 'p') as React.ElementType
  return (
    <Tag
      ref={ref}
      className={className}
      style={{ textAlign, display: 'inline-block', whiteSpace: 'normal', wordWrap: 'break-word' }}
    />
  )
}

export default SplitText
