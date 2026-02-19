"use client"
import { FC, ReactNode, CSSProperties } from 'react'
import './GlareHover.css'

interface GlareHoverProps {
  children: ReactNode
  width?: string
  height?: string
  background?: string
  borderRadius?: string
  borderColor?: string
  glareColor?: string
  glareOpacity?: number
  glareAngle?: number
  glareSize?: number
  transitionDuration?: number
  playOnce?: boolean
  className?: string
  style?: CSSProperties
}

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const GlareHover: FC<GlareHoverProps> = ({
  children,
  width = '300px',
  height = '200px',
  background = 'transparent',
  borderRadius = '0px',
  borderColor = 'transparent',
  glareColor = '#ffffff',
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 500,
  playOnce = false,
  className = '',
  style,
}) => {
  const cssVars = {
    '--gh-width': width,
    '--gh-height': height,
    '--gh-bg': background,
    '--gh-br': borderRadius,
    '--gh-border': borderColor,
    '--gh-rgba': hexToRgba(glareColor, glareOpacity),
    '--gh-angle': `${glareAngle}deg`,
    '--gh-size': `${glareSize}%`,
    '--gh-duration': `${transitionDuration}ms`,
  } as CSSProperties

  return (
    <div
      className={`glare-hover ${playOnce ? 'glare-hover--play-once' : ''} ${className}`}
      style={{ ...cssVars, ...style }}
    >
      {children}
    </div>
  )
}

export default GlareHover
