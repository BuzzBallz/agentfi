"use client"

import { useState } from "react"
import { Space_Mono, DM_Sans } from "next/font/google"
import PixelTransition from "@/components/PixelTransition"
import BlurText from "@/components/BlurText"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

type Category = "All" | "DeFi" | "Risk" | "Yield" | "Custom"


const CATEGORY_COLORS: Record<string, string> = {
  DeFi: "rgba(201,168,76,0.1)",
  Yield: "rgba(122,158,110,0.1)",
  Risk: "rgba(196,122,90,0.1)",
  Custom: "rgba(138,110,46,0.15)",
}
const CATEGORY_TEXT: Record<string, string> = {
  DeFi: "#C9A84C",
  Yield: "#7A9E6E",
  Risk: "#C47A5A",
  Custom: "#8A6E2E",
}

const AGENTS = [
  { name: "Portfolio Analyzer", category: "DeFi" as const, desc: "Analyzes wallet composition and generates rebalancing recommendations", price: "0.01", rating: "4.9", queries: "1,247", custom: false },
  { name: "Yield Optimizer", category: "Yield" as const, desc: "Scans 50+ protocols to find highest APY opportunities for your assets", price: "0.008", rating: "4.8", queries: "892", custom: false },
  { name: "Risk Scorer", category: "Risk" as const, desc: "Real-time risk assessment of your DeFi positions with actionable alerts", price: "0.005", rating: "4.7", queries: "2,103", custom: false },
  { name: "Cross-Chain Arbitrage", category: "DeFi" as const, desc: "Identifies arbitrage opportunities across 0G, ADI, and EVM chains", price: "0.015", rating: "4.6", queries: "445", custom: false },
  { name: "Liquidity Manager", category: "Yield" as const, desc: "Manages LP positions automatically to maximize fee revenue", price: "0.012", rating: "4.5", queries: "334", custom: false },
  { name: "Compliance Monitor", category: "Risk" as const, desc: "Monitors transactions for FATF Travel Rule compliance on ADI Chain", price: "0.006", rating: "4.8", queries: "678", custom: false },
  { name: "My DeFi Watcher", category: "Custom" as const, desc: "Custom agent \u2014 monitors wallet activity and sends alerts on unusual movements.", price: "0.007", rating: "\u2014", queries: "New", custom: true },
  { name: "Yield Scout v2", category: "Custom" as const, desc: "Custom agent \u2014 scans Aave and Compound for USDC yield above 8% APY.", price: "0.009", rating: "\u2014", queries: "New", custom: true },
]


export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<Category>("All")
  const [search, setSearch] = useState("")

  const filtered = AGENTS.filter(a => {
    const matchCat = activeFilter === "All" || a.category === activeFilter
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const cardStyle = {
    background: "#241A0E",
    border: "1px solid #3D2E1A",
    borderRadius: 12,
    padding: 24,
    transition: "border-color 0.2s",
  }

  const hireButtonStyle = {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "bold" as const,
    letterSpacing: "0.08em",
    borderRadius: 8,
    cursor: "pointer",
  }

  return (
    <div className={dmSans.className} style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1
          className={spaceMono.className}
          style={{ fontSize: 32, fontWeight: 700, color: "#F5ECD7", letterSpacing: "0.02em", margin: 0 }}
        >
          Agent Marketplace
        </h1>
        <p style={{ color: "#9A8060", fontSize: 14, marginTop: 6 }}>
          Hire specialized AI agents. Pay with ADI. Own as iNFT.
        </p>
      </div>

      {/* ── Section 1: Search & Filter bar ── */}
      <div style={{
        background: "#241A0E",
        border: "1px solid #3D2E1A",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
        gap: 16,
        flexWrap: "wrap" as const,
      }}>
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={spaceMono.className}
          style={{
            background: "#1A1208",
            border: "1px solid #3D2E1A",
            color: "#F5ECD7",
            borderRadius: 8,
            padding: "10px 16px",
            width: 300,
            fontSize: 13,
            outline: "none",
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              background: "#241A0E",
              border: "1px solid #5C4422",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#C9A84C",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: "bold",
              letterSpacing: "0.08em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              minWidth: 160,
              transition: "border-color 0.2s",
            }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "#C9A84C")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "#5C4422")}
            >
              <span>{activeFilter === "All" ? "All Categories" : activeFilter}</span>
              <span>{"\u25BE"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {(["All", "DeFi", "Yield", "Risk", "Custom"] as Category[]).map(cat => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  style={{ color: activeFilter === cat ? "#C9A84C" : "#F5ECD7" }}
                >
                  {activeFilter === cat && <span style={{ marginRight: 8 }}>{"\u2713"}</span>}
                  {cat === "All" ? "All Categories" : cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Section 2: Agent Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 36 }}>
        {filtered.map(agent => (
          <div
            key={agent.name}
            style={{ ...cardStyle, border: `1px ${agent.custom ? "dashed" : "solid"} #3D2E1A` }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "#5C4422")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
          >
            {/* Top: name + category badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: agent.custom ? 4 : 12 }}>
              <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}>
                {agent.name}
              </span>
              <span
                className={spaceMono.className}
                style={{
                  background: CATEGORY_COLORS[agent.category],
                  color: CATEGORY_TEXT[agent.category],
                  fontSize: 10,
                  letterSpacing: "0.05em",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontWeight: 700,
                  border: agent.custom ? "1px solid #5C4422" : "none",
                }}
              >
                {agent.category}
              </span>
            </div>

            {/* Custom tag */}
            {agent.custom && (
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#8A6E2E", marginBottom: 12 }}>
                {"\u2726"} Custom
              </div>
            )}

            {/* Description */}
            <div style={{
              color: "#9A8060",
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 14,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}>
              {agent.desc}
            </div>

            {/* Stats row */}
            <div className={spaceMono.className} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <span style={{ color: "#E8C97A", fontSize: 11 }}>
                {agent.custom ? agent.rating : `${"\u2605"} ${agent.rating}`}
              </span>
              <span style={{ color: "#5C4A32", fontSize: 11 }}>
                {agent.custom ? "New" : `${agent.queries} queries`}
              </span>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#3D2E1A", marginBottom: 14 }} />

            {/* Bottom: price + Hire button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>
                {agent.price} ADI
              </span>
              <div style={{ position: "relative", width: "fit-content" }}>
                <PixelTransition
                  gridSize={6}
                  pixelColor="#C9A84C"
                  animationStepDuration={0.2}
                  aspectRatio="0%"
                  style={{ width: 120, height: 36, borderRadius: 8, overflow: "hidden" }}
                  firstContent={
                    <div style={{ ...hireButtonStyle, background: "#C9A84C", color: "#1A1208" }}>
                      Hire Agent {"\u2192"}
                    </div>
                  }
                  secondContent={
                    <div style={{ ...hireButtonStyle, background: "#E8C97A", color: "#1A1208" }}>
                      Hire Agent {"\u2192"}
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        ))}

        {/* Create Custom Agent CTA */}
        {(activeFilter === "All" || activeFilter === "Custom") && (
          <a href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#1A1208",
              border: "1px dashed #5C4422",
              borderRadius: 12,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 220,
              gap: 12,
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = "#C9A84C"
                e.currentTarget.style.background = "#241A0E"
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = "#5C4422"
                e.currentTarget.style.background = "#1A1208"
              }}
            >
              <span style={{ fontSize: 28, color: "#5C4422" }}>{"\u2726"}</span>
              <p style={{ fontFamily: "monospace", color: "#C9A84C", fontSize: 14, fontWeight: "bold", margin: 0 }}>Create Custom Agent</p>
              <p style={{ color: "#9A8060", fontSize: 12, margin: 0, textAlign: "center" }}>Deploy your own AI agent from a custom prompt</p>
            </div>
          </a>
        )}
      </div>

      {/* ── Section 3: Own Your Agent ── */}
      <div style={{ padding: "28px 0" }}>
        <div style={{ fontFamily: "monospace", fontSize: 22, color: "#F5ECD7", fontWeight: "bold", marginBottom: 8 }}>
          <BlurText text="Own Your Agent" animateBy="words" direction="bottom" delay={120} stepDuration={0.4} />
        </div>
        <div style={{ color: "#9A8060", fontSize: 14 }}>
          <BlurText text="Every hired agent is minted as an iNFT on 0G Chain. Transfer it, sell it, or keep earning." animateBy="words" direction="bottom" delay={40} stepDuration={0.25} />
        </div>
      </div>
    </div>
  )
}
