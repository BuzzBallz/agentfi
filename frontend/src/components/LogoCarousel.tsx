"use client"
import { motion } from "motion/react"
import CircularText from "./CircularText"

const OGLogo = () => (
  <svg viewBox="0 0 140 80" width="60" height="34" fill="none">
    {/* "0" — circle with diagonal slash inside */}
    <circle cx="34" cy="40" r="28" stroke="#C9A84C" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <line x1="20" y1="55" x2="48" y2="25" stroke="#C9A84C" strokeWidth="7" strokeLinecap="round"/>
    {/* "G" — open arc (270deg) with horizontal shelf pointing inward on right */}
    <path
      d="M136 16 A34 34 0 1 0 136 64 L136 44 L114 44"
      stroke="#C9A84C"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const HederaLogo = () => (
  <svg viewBox="0 0 100 100" width="48" height="48" fill="none">
    {/* Dark brown circle matching site background */}
    <circle cx="50" cy="50" r="48" fill="#241A0E"/>
    {/* Left pillar — gold */}
    <rect x="26" y="22" width="12" height="56" fill="#C9A84C" rx="1"/>
    {/* Right pillar — gold */}
    <rect x="62" y="22" width="12" height="56" fill="#C9A84C" rx="1"/>
    {/* Crossbar — gold, inner edges only */}
    <rect x="38" y="44" width="24" height="12" fill="#C9A84C" rx="1"/>
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
  { id: "og",     Logo: OGLogo,     name: "0G Chain",  role: "Agent Ownership",    text: "iNFT · ERC-7857 · 0G CHAIN · AGENT · ",    spinDuration: 16, onHover: "speedUp"   as const, url: "https://0g.ai" },
  { id: "hedera", Logo: HederaLogo, name: "Hedera",    role: "Agent Execution",    text: "HEDERA · OPENCLAW · HCS-10 · AGENT KIT · ", spinDuration: 20, onHover: "slowDown"  as const, url: "https://hedera.com" },
  { id: "adi",    Logo: ADILogo,    name: "ADI Chain", role: "Compliant Payments", text: "ADI CHAIN · PAYMENTS · ZKSTACK · FATF · ",  spinDuration: 24, onHover: "goBonkers" as const, url: "https://adi.foundation" },
]

export default function LogoCarousel() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 64, flexWrap: "wrap" }}>
      {CHAINS.map((chain, i) => {
        const Logo = chain.Logo
        return (
          <motion.div
            key={chain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
          >
            {/* Spinning ring + logo */}
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <CircularText text={chain.text} spinDuration={chain.spinDuration} onHover={chain.onHover} />
              <a
                href={chain.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 72,
                  height: 72,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  textDecoration: "none",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Logo />
              </a>
            </div>
            <p style={{ color: "#C9A84C", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {chain.name}
            </p>
            <p style={{ color: "#9A8060", fontSize: 12 }}>
              {chain.role}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
