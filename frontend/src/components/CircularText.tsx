"use client"
import React, { useEffect } from "react"
import {
  motion,
  useAnimation,
  useMotionValue,
} from "motion/react"
import "./CircularText.css"

interface CircularTextProps {
  text: string
  spinDuration?: number
  onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers"
  className?: string
}

function startSpin(
  controls: ReturnType<typeof useAnimation>,
  duration: number,
  startFrom: number
) {
  controls.start({
    rotate: startFrom + 360,
    transition: {
      ease: "linear",
      duration,
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  })
}

const CircularText: React.FC<CircularTextProps> = ({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
}) => {
  const controls = useAnimation()
  const rotationValue = useMotionValue(0)

  useEffect(() => {
    startSpin(controls, spinDuration, 0)
  }, [controls, spinDuration])

  const handleHoverStart = () => {
    const current = rotationValue.get()
    switch (onHover) {
      case "slowDown":
        startSpin(controls, spinDuration * 2, current)
        break
      case "speedUp":
        startSpin(controls, spinDuration / 2, current)
        break
      case "pause":
        controls.stop()
        break
      case "goBonkers":
        startSpin(controls, spinDuration / 5, current)
        break
      default:
        startSpin(controls, spinDuration, current)
    }
  }

  const handleHoverEnd = () => {
    const current = rotationValue.get()
    startSpin(controls, spinDuration, current)
  }

  const characters = text.split("")
  const degreesPerChar = 360 / characters.length

  return (
    <motion.div
      className={`circular-text ${className}`}
      animate={controls}
      style={{ rotate: rotationValue }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
    >
      {characters.map((char, i) => (
        <span
          key={`${char}-${i}`}
          style={{
            transform: `rotate(${degreesPerChar * i}deg)`,
          }}
        >
          {char}
        </span>
      ))}
    </motion.div>
  )
}

export default CircularText
