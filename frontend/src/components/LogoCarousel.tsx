"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import CircularText from "./CircularText"

// Monochrome SVG logos — all rendered in gold #C9A84C on dark background

// 0G Labs logo — recreated as monochrome SVG (purple → gold tint on dark)
const OGLogo = () => (
  <svg viewBox="0 0 100 100" width="56" height="56" fill="none">
    {/* Left circle with slash — mimics 0G left letterform */}
    <circle cx="32" cy="50" r="22" stroke="#C9A84C" strokeWidth="8" fill="none"/>
    <line x1="18" y1="64" x2="46" y2="36" stroke="#1A1208" strokeWidth="8"/>
    {/* Right G letterform */}
    <path
      d="M58 30 A22 22 0 1 1 58 70 L58 52 L74 52"
      stroke="#C9A84C" strokeWidth="8" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
)

// Hedera logo — H shape, monochrome gold
const HederaLogo = () => (
  <svg viewBox="0 0 100 100" width="56" height="56" fill="none">
    <rect x="22" y="20" width="12" height="60" fill="#C9A84C" rx="2"/>
    <rect x="66" y="20" width="12" height="60" fill="#C9A84C" rx="2"/>
    <rect x="22" y="43" width="56" height="14" fill="#C9A84C" rx="2"/>
  </svg>
)

// ADI logo — diamond/triangle shape, monochrome gold
const ADILogo = () => (
  <svg viewBox="0 0 100 100" width="56" height="56" fill="none">
    {/* Outer diamond */}
    <path
      d="M50 8 L88 42 L50 92 L12 42 Z"
      stroke="#C9A84C" strokeWidth="5" fill="none"
      strokeLinejoin="round"
    />
    {/* Inner triangle */}
    <path
      d="M50 28 L72 54 L28 54 Z"
      stroke="#C9A84C" strokeWidth="4" fill="none"
      strokeLinejoin="round"
    />
    {/* Center dot */}
    <circle cx="50" cy="48" r="5" fill="#C9A84C"/>
  </svg>
)

const LOGOS = [
  { id: "og",     label: "0G CHAIN · AGENT OWNERSHIP · iNFT ERC-7857 · ",     Logo: OGLogo,     name: "0G Chain"  },
  { id: "hedera", label: "HEDERA · AGENT EXECUTION · OPENCLAW · HCS-10 · ",   Logo: HederaLogo, name: "Hedera"   },
  { id: "adi",    label: "ADI CHAIN · COMPLIANT PAYMENTS · L2 ZKSTACK · ",     Logo: ADILogo,    name: "ADI Chain" },
]

export default function LogoCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % LOGOS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const active = LOGOS[current]
  const ActiveLogo = active.Logo

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Spinning circular text + logo in center */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        {/* Circular spinning text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularText
            text={active.label}
            spinDuration={18}
            onHover="speedUp"
          />
        </div>

        {/* Logo in center — crossfade on change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative z-10 flex items-center justify-center rounded-xl p-3"
            style={{ background: "#241A0E", border: "1px solid #3D2E1A" }}
          >
            <ActiveLogo />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Chain name below */}
      <AnimatePresence mode="wait">
        <motion.p
          key={active.id + "-name"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: "#C9A84C" }}
        >
          {active.name}
        </motion.p>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="flex gap-2">
        {LOGOS.map((logo, i) => (
          <button
            key={logo.id}
            onClick={() => setCurrent(i)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: i === current ? "#C9A84C" : "#3D2E1A",
              transform: i === current ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  )
}
