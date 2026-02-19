"use client"
import { motion } from "motion/react"
import CircularText from "./CircularText"

const OGLogo = () => (
  <svg viewBox="0 0 100 100" width="44" height="44" fill="none">
    <circle cx="32" cy="50" r="22" stroke="#C9A84C" strokeWidth="8" fill="none"/>
    <line x1="18" y1="64" x2="46" y2="36" stroke="#1A1208" strokeWidth="8"/>
    <path d="M58 30 A22 22 0 1 1 58 70 L58 52 L74 52" stroke="#C9A84C" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const HederaLogo = () => (
  <svg viewBox="0 0 100 100" width="44" height="44" fill="none">
    <rect x="22" y="20" width="12" height="60" fill="#C9A84C" rx="2"/>
    <rect x="66" y="20" width="12" height="60" fill="#C9A84C" rx="2"/>
    <rect x="22" y="43" width="56" height="14" fill="#C9A84C" rx="2"/>
  </svg>
)

const ADILogo = () => (
  <svg viewBox="0 0 100 100" width="44" height="44" fill="none">
    <path d="M50 8 L88 42 L50 92 L12 42 Z" stroke="#C9A84C" strokeWidth="5" fill="none" strokeLinejoin="round"/>
    <path d="M50 28 L72 54 L28 54 Z" stroke="#C9A84C" strokeWidth="4" fill="none" strokeLinejoin="round"/>
    <circle cx="50" cy="48" r="5" fill="#C9A84C"/>
  </svg>
)

const CHAINS = [
  { id: "og",     Logo: OGLogo,     name: "0G Chain",  role: "Agent Ownership",    text: "iNFT · ERC-7857 · 0G CHAIN · AGENT · ",        spinDuration: 16, onHover: "speedUp"   as const },
  { id: "hedera", Logo: HederaLogo, name: "Hedera",    role: "Agent Execution",    text: "HEDERA · OPENCLAW · HCS-10 · AGENT KIT · ",     spinDuration: 20, onHover: "slowDown"  as const },
  { id: "adi",    Logo: ADILogo,    name: "ADI Chain", role: "Compliant Payments", text: "ADI CHAIN · PAYMENTS · ZKSTACK · FATF · ",       spinDuration: 24, onHover: "goBonkers" as const },
]

export default function LogoCarousel() {
  return (
    <div className="flex items-center justify-center gap-16 flex-wrap">
      {CHAINS.map((chain, i) => {
        const Logo = chain.Logo
        return (
          <motion.div
            key={chain.id}
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              {/* Spinning text ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <CircularText
                  text={chain.text}
                  spinDuration={chain.spinDuration}
                  onHover={chain.onHover}
                />
              </div>
              {/* Logo fixed in center */}
              <div
                className="relative z-10 flex items-center justify-center rounded-xl"
                style={{ background: "#241A0E", border: "1px solid #3D2E1A", width: 72, height: 72 }}
              >
                <Logo />
              </div>
            </div>
            <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#C9A84C" }}>
              {chain.name}
            </p>
            <p className="text-xs" style={{ color: "#9A8060" }}>
              {chain.role}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
