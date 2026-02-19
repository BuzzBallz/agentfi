"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Space_Mono, DM_Sans } from "next/font/google"
import { formatEther } from "viem"
import PixelTransition from "@/components/PixelTransition"
import { useListedAgents } from "@/hooks/useListedAgents"
import { useAgentData } from "@/hooks/useAgentData"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

type Category = "All" | "DeFi" | "Risk" | "Yield"

const CATEGORIES: Category[] = ["All", "DeFi", "Risk", "Yield"]

const CATEGORY_COLORS: Record<string, string> = {
  DeFi: "rgba(201,168,76,0.1)",
  Yield: "rgba(122,158,110,0.1)",
  Risk: "rgba(196,122,90,0.1)",
}
const CATEGORY_TEXT: Record<string, string> = {
  DeFi: "#C9A84C",
  Yield: "#7A9E6E",
  Risk: "#C47A5A",
}

// On-chain agent metadata
const AGENT_META: Record<number, { name: string; category: Category; desc: string }> = {
  0: { name: "Portfolio Analyzer", category: "DeFi", desc: "Analyzes wallet composition and generates rebalancing recommendations" },
  1: { name: "Yield Optimizer", category: "Yield", desc: "Scans 50+ protocols to find highest APY opportunities for your assets" },
  2: { name: "Risk Scorer", category: "Risk", desc: "Real-time risk assessment of your DeFi positions with actionable alerts" },
}

// Mock agents for visual richness (not on-chain)
const MOCK_AGENTS = [
  { name: "Cross-Chain Arbitrage", category: "DeFi" as Category, desc: "Identifies arbitrage opportunities across 0G, ADI, and EVM chains", price: "0.015" },
  { name: "Liquidity Manager", category: "Yield" as Category, desc: "Manages LP positions automatically to maximize fee revenue", price: "0.012" },
  { name: "Compliance Monitor", category: "Risk" as Category, desc: "Monitors transactions for FATF Travel Rule compliance on ADI Chain", price: "0.006" },
]

const BADGES = ["ERC-7857 Standard", "0G Chain", "Transferable"]

/* ── On-chain agent card (fetches metadata + links to detail page) ── */
function OnChainAgentCard({ tokenId, listing }: {
  tokenId: number
  listing: { pricePerHire: bigint; priceDisplay: number }
}) {
  const router = useRouter()
  const { agentData, isLoading } = useAgentData(tokenId)
  const meta = AGENT_META[tokenId]

  const name = meta?.name || `Agent #${tokenId}`
  const category = meta?.category || "DeFi"
  const desc = meta?.desc || (agentData?.systemPrompt?.slice(0, 100) || "AI agent on-chain")

  const cardStyle = {
    background: "#241A0E",
    border: "1px solid #3D2E1A",
    borderRadius: 12,
    padding: 24,
    transition: "border-color 0.2s",
    cursor: "pointer" as const,
    opacity: isLoading ? 0.7 : 1,
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
    <div
      style={cardStyle}
      onMouseOver={e => (e.currentTarget.style.borderColor = "#5C4422")}
      onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
      onClick={() => router.push(`/agent/${tokenId}`)}
    >
      {/* Top: name + category badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}>
          {name}
        </span>
        <span
          className={spaceMono.className}
          style={{
            background: CATEGORY_COLORS[category],
            color: CATEGORY_TEXT[category],
            fontSize: 10,
            letterSpacing: "0.05em",
            padding: "3px 10px",
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {category}
        </span>
      </div>

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
        {desc}
      </div>

      {/* Capabilities (from chain) */}
      {agentData?.capabilities && agentData.capabilities.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {(agentData.capabilities as string[]).slice(0, 3).map((cap: string, i: number) => (
            <span
              key={i}
              className={spaceMono.className}
              style={{
                background: "#1A1208",
                border: "1px solid #3D2E1A",
                color: "#8A6E2E",
                fontSize: 9,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "#3D2E1A", marginBottom: 14 }} />

      {/* Bottom: price + Hire button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>
          {formatEther(listing.pricePerHire)} OG
        </span>
        <div style={{ position: "relative", width: "fit-content" }} onClick={e => e.stopPropagation()}>
          <PixelTransition
            gridSize={6}
            pixelColor="#C9A84C"
            animationStepDuration={0.2}
            aspectRatio="0%"
            style={{ width: 120, height: 36, borderRadius: 8, overflow: "hidden" }}
            firstContent={
              <div style={{ ...hireButtonStyle, background: "#C9A84C", color: "#1A1208" }}
                onClick={() => router.push(`/agent/${tokenId}`)}>
                Hire Agent {"\u2192"}
              </div>
            }
            secondContent={
              <div style={{ ...hireButtonStyle, background: "#E8C97A", color: "#1A1208" }}
                onClick={() => router.push(`/agent/${tokenId}`)}>
                Hire Agent {"\u2192"}
              </div>
            }
          />
        </div>
      </div>
    </div>
  )
}

/* ── Mock agent card (visual only, not on-chain) ── */
function MockAgentCard({ agent }: { agent: typeof MOCK_AGENTS[0] }) {
  const cardStyle = {
    background: "#241A0E",
    border: "1px solid #3D2E1A",
    borderRadius: 12,
    padding: 24,
    transition: "border-color 0.2s",
    opacity: 0.6,
    position: "relative" as const,
  }

  return (
    <div
      style={cardStyle}
      onMouseOver={e => (e.currentTarget.style.borderColor = "#5C4422")}
      onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
    >
      {/* Coming soon badge */}
      <div className={spaceMono.className} style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "rgba(201,168,76,0.15)",
        color: "#8A6E2E",
        fontSize: 9,
        letterSpacing: "0.08em",
        padding: "3px 8px",
        borderRadius: 4,
        fontWeight: 700,
      }}>
        COMING SOON
      </div>

      {/* Top: name + category badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingRight: 80 }}>
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
          }}
        >
          {agent.category}
        </span>
      </div>

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

      {/* Divider */}
      <div style={{ height: 1, background: "#3D2E1A", marginBottom: 14 }} />

      {/* Bottom: price */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>
          {agent.price} ADI
        </span>
        <span className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 11 }}>
          Not yet deployed
        </span>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<Category>("All")
  const [search, setSearch] = useState("")
  const { agents: listedAgents, isLoading, isError } = useListedAgents()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Filter on-chain agents
  const filteredOnChain = listedAgents.filter((a: any) => {
    const meta = AGENT_META[a.tokenId]
    const matchCat = activeFilter === "All" || meta?.category === activeFilter
    const matchSearch = (meta?.name || "").toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Filter mock agents
  const filteredMock = MOCK_AGENTS.filter(a => {
    const matchCat = activeFilter === "All" || a.category === activeFilter
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

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
        <div style={{ display: "flex", gap: 8 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={spaceMono.className}
              style={{
                background: activeFilter === cat ? "#C9A84C" : "#1A1208",
                color: activeFilter === cat ? "#1A1208" : "#9A8060",
                border: activeFilter === cat ? "1px solid #C9A84C" : "1px solid #3D2E1A",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading / Error states ── */}
      {isLoading && (
        <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 13, marginBottom: 24, textAlign: "center" }}>
          Loading agents from 0G Chain...
        </div>
      )}
      {isError && (
        <div className={spaceMono.className} style={{ color: "#C47A5A", fontSize: 13, marginBottom: 24, textAlign: "center" }}>
          Failed to load agents from contract. Check RPC connection.
        </div>
      )}

      {/* ── Section 2: Agent Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 36 }}>
        {/* On-chain agents first */}
        {filteredOnChain.map((agent: any) => (
          <OnChainAgentCard
            key={agent.tokenId}
            tokenId={agent.tokenId}
            listing={{ pricePerHire: agent.pricePerHire, priceDisplay: agent.priceDisplay }}
          />
        ))}

        {/* Mock agents */}
        {filteredMock.map(agent => (
          <MockAgentCard key={agent.name} agent={agent} />
        ))}
      </div>

      {/* No results */}
      {filteredOnChain.length === 0 && filteredMock.length === 0 && !isLoading && (
        <div style={{ textAlign: "center", color: "#5C4A32", fontSize: 14, marginBottom: 36 }}>
          No agents found matching your search.
        </div>
      )}

      {/* ── Section 3: Featured iNFT Banner ── */}
      <div style={{
        background: "#2E2010",
        border: "1px solid #5C4422",
        borderRadius: 12,
        padding: 28,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap" as const,
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Own Your Agent
          </div>
          <div style={{ color: "#9A8060", fontSize: 14, lineHeight: 1.6 }}>
            Every hired agent is minted as an iNFT on 0G Chain. Transfer it, sell it, or keep earning.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          {BADGES.map(badge => (
            <span
              key={badge}
              className={spaceMono.className}
              style={{
                background: "#1A1208",
                border: "1px solid #3D2E1A",
                color: "#C9A84C",
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 6,
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
