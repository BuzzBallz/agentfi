"use client"
import { useEffect, FC } from "react"
import { motion, useAnimation, useMotionValue, MotionValue } from "motion/react"

interface CircularTextProps {
  text: string
  spinDuration?: number
  onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers"
  className?: string
}

const getTransition = (duration: number, from: number) => ({
  rotate: {
    from,
    to: from + 360,
    ease: "linear" as const,
    duration,
    type: "tween" as const,
    repeat: Infinity,
  },
  scale: { type: "spring" as const, damping: 20, stiffness: 300 },
})

const CircularText: FC<CircularTextProps> = ({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
}) => {
  const letters = Array.from(text)
  const controls = useAnimation()
  const rotation: MotionValue<number> = useMotionValue(0)

  useEffect(() => {
    const start = rotation.get()
    controls.start({ rotate: start + 360, scale: 1, transition: getTransition(spinDuration, start) })
  }, [spinDuration, text, controls])

  const handleHoverStart = () => {
    const start = rotation.get()
    const config =
      onHover === "slowDown"   ? getTransition(spinDuration * 2, start) :
      onHover === "speedUp"    ? getTransition(spinDuration / 4, start) :
      onHover === "goBonkers"  ? getTransition(spinDuration / 20, start) :
      { rotate: { type: "spring" as const, damping: 20, stiffness: 300 }, scale: { type: "spring" as const, damping: 20, stiffness: 300 } }
    const scale = onHover === "goBonkers" ? 0.8 : 1
    controls.start({ rotate: start + 360, scale, transition: config })
  }

  const handleHoverEnd = () => {
    const start = rotation.get()
    controls.start({ rotate: start + 360, scale: 1, transition: getTransition(spinDuration, start) })
  }

  return (
    <motion.div
      className={className}
      style={{ rotate: rotation, position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {letters.map((letter, i) => {
        const angle = (360 / letters.length) * i - 90 // start from top
        const angleRad = (angle * Math.PI) / 180
        const radius = 62
        const x = 70 + radius * Math.cos(angleRad) // 70 = half of 140px container
        const y = 70 + radius * Math.sin(angleRad)
        const rotateLetter = angle + 90 // rotate each letter to face outward

        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              color: "#C9A84C",
              opacity: 0.75,
              transform: `translate(-50%, -50%) rotate(${rotateLetter}deg)`,
              transformOrigin: "center center",
            }}
          >
            {letter}
          </span>
        )
      })}
    </motion.div>
  )
}

export default CircularText
