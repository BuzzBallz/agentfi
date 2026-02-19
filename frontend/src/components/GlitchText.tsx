"use client"
import { FC, CSSProperties } from "react"
import "./GlitchText.css"

interface CustomCSSProperties extends CSSProperties {
  "--after-duration": string
  "--before-duration": string
  "--after-shadow": string
  "--before-shadow": string
}

interface GlitchTextProps {
  children: string
  speed?: number
  enableOnHover?: boolean
  className?: string
}

const GlitchText: FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableOnHover = false,
  className = "",
}) => {
  const inlineStyles: CustomCSSProperties = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    // Gold palette instead of red/cyan
    "--after-shadow": "-3px 0 #8A6E2E",
    "--before-shadow": "3px 0 #E8C97A",
  }

  const hoverClass = enableOnHover ? "enable-on-hover" : ""

  return (
    <div
      className={`glitch ${hoverClass} ${className}`}
      style={inlineStyles}
      data-text={children}
    >
      {children}
    </div>
  )
}

export default GlitchText
