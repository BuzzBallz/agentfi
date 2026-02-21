"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Space_Mono, DM_Sans } from "next/font/google"
import { formatEther } from "viem"
import PixelTransition from "@/components/PixelTransition"
import { useListedAgents } from "@/hooks/useListedAgents"
import { useAgentData } from "@/hooks/useAgentData"
import { useAppMode } from "@/context/AppModeContext"
import { PLATFORM_FEE_PCT } from "@/config/contracts"
import KYCGate from "@/components/KYCGate"
import FadeContent from "@/components/FadeContent"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

type Category = "All" | "DeFi" | "Risk" | "Yield" | "Custom"

const FILTER_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "defi", label: "DeFi" },
  { value: "yield", label: "Yield" },
  { value: "risk", label: "Risk" },
  { value: "custom", label: "Custom" },
]

const VALUE_TO_CATEGORY: Record<string, Category> = {
  all: "All",
  defi: "DeFi",
  yield: "Yield",
  risk: "Risk",
  custom: "Custom",
}

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

// Category mapping by tokenId (lightweight, not for name/desc)
const TOKEN_CATEGORY: Record<number, Category> = {
  0: "DeFi",
  1: "Yield",
  2: "Risk",
}

const FALLBACK_NAMES: Record<number, string> = {
  0: "Portfolio Analyzer",
  1: "Yield Optimizer",
  2: "Risk Scorer",
}

// Mock agents for visual richness (not on-chain)
const MOCK_AGENTS = [
  { name: "Cross-Chain Arbitrage", category: "DeFi" as Category, desc: "Identifies arbitrage opportunities across 0G, ADI, and EVM chains", price: "0.015" },
  { name: "Liquidity Manager", category: "Yield" as Category, desc: "Manages LP positions automatically to maximize fee revenue", price: "0.012" },
  { name: "Compliance Monitor", category: "Risk" as Category, desc: "Monitors transactions for FATF Travel Rule compliance on ADI Chain", price: "0.006" },
]


/* -- On-chain agent card (fetches metadata from contract) -- */
function OnChainAgentCard({ tokenId, listing }: {
  tokenId: number
  listing: { pricePerHire: bigint; priceDisplay: number }
}) {
  const router = useRouter()
  const { agentData, isLoading } = useAgentData(tokenId)
  const { currencySymbol, isCompliant } = useAppMode()

  // Name + description from contract
  const name = isLoading ? "Loading..." : (agentData?.name || FALLBACK_NAMES[tokenId] || `Agent #${tokenId}`)
  const category = TOKEN_CATEGORY[tokenId] || "DeFi"
  const desc = agentData?.description || "AI agent on-chain"

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
      {/* Top: name + badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
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

      {/* ERC-7857 badge */}
      <span
        className={spaceMono.className}
        style={{
          background: "rgba(139,92,246,0.1)",
          color: "#A78BFA",
          fontSize: 9,
          letterSpacing: "0.05em",
          padding: "2px 8px",
          borderRadius: 999,
          fontWeight: 700,
          display: "inline-block",
          marginBottom: 10,
        }}
      >
        ERC-7857 iNFT
      </span>
      {isCompliant && (
        <span
          className={spaceMono.className}
          style={{
            background: "rgba(96,165,250,0.1)",
            color: "#60A5FA",
            fontSize: 9,
            letterSpacing: "0.05em",
            padding: "2px 8px",
            borderRadius: 999,
            fontWeight: 700,
            display: "inline-block",
            marginBottom: 10,
            marginLeft: 6,
          }}
        >
          FATF Compliant
        </span>
      )}

      {/* Description from contract */}
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

      {/* Bottom: price + fee info + Hire button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>
            {formatEther(listing.pricePerHire)} {currencySymbol}
          </span>
          <div style={{ color: "#5C4A32", fontSize: 9, marginTop: 2 }}>
            {PLATFORM_FEE_PCT} platform fee
          </div>
        </div>
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

/* -- Mock agent card (visual only, not on-chain) -- */
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

/* -- Main page -- */
export default function MarketplacePage() {
  const [filterValue, setFilterValue] = useState("All")
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const { agents: listedAgents, isLoading, isError } = useListedAgents()
  const { currencySymbol } = useAppMode()

  const activeFilter: Category = VALUE_TO_CATEGORY[
    FILTER_CATEGORIES.find(c => c.label === filterValue)?.value ?? "all"
  ] ?? "All"

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Close combobox on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [filterOpen])

  // Filter on-chain agents by category and search
  // Category is derived from tokenId, name comes from agentData (loaded in card)
  const filteredOnChain = listedAgents.filter((a: any) => {
    const cat = TOKEN_CATEGORY[a.tokenId] || "DeFi"
    const matchCat = activeFilter === "All" || cat === activeFilter
    // Search is best-effort by tokenId since names load in individual cards
    return matchCat
  })

  // Filter mock agents
  const filteredMock = MOCK_AGENTS.filter(a => {
    const matchCat = activeFilter === "All" || a.category === activeFilter
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <KYCGate>
    <div className={dmSans.className} style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* -- Header -- */}
      <div style={{ marginBottom: 32 }}>
        <h1
          className={spaceMono.className}
          style={{ fontSize: 32, fontWeight: 700, color: "#F5ECD7", letterSpacing: "0.02em", margin: 0 }}
        >
          Agent Marketplace
        </h1>
        <p style={{ color: "#9A8060", fontSize: 14, marginTop: 6 }}>
          Hire specialized AI agents. Pay with {currencySymbol}. Own as ERC-7857 iNFT.
        </p>
      </div>

      {/* -- Section 1: Search & Filter bar -- */}
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
        <div ref={filterRef} style={{ position: "relative", display: "inline-block" }}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={spaceMono.className}
            style={{
              minWidth: 180,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#1A1208", border: "1px solid #3D2E1A",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 11,
              color: "#9A8060", cursor: "pointer", gap: 8,
            }}
          >
            <span>{filterValue}</span>
            <span style={{ color: "#3D2E1A" }}>▾</span>
          </button>

          {filterOpen && (
            <ComboboxContent>
              <Combobox>
                <ComboboxInput placeholder="Search category..." />
                <ComboboxList>
                  <ComboboxEmpty>No category found.</ComboboxEmpty>
                  {FILTER_CATEGORIES.map((cat) => (
                    <ComboboxItem
                      key={cat.value}
                      value={cat.value}
                      onSelect={() => {
                        setFilterValue(cat.label)
                        setFilterOpen(false)
                      }}
                      style={{
                        color: filterValue === cat.label ? "#C9A84C" : "#9A8060",
                        background: filterValue === cat.label ? "rgba(201,168,76,0.08)" : "transparent",
                      }}
                    >
                      {filterValue === cat.label && <span style={{ marginRight: 8, color: "#C9A84C" }}>✓</span>}
                      {cat.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </Combobox>
            </ComboboxContent>
          )}
        </div>
      </div>

      {/* -- Loading / Error states -- */}
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

      {/* -- Section 2: Agent Grid -- */}
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

      {/* -- Section 3: Own Your Agent -- */}
      <div style={{ padding: "80px 40px", textAlign: "center" }}>
        <FadeContent blur duration={1000} delay={100}>
          <h2 style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(28px, 4vw, 52px)",
            fontWeight: 700,
            color: "#F5ECD7",
            lineHeight: 1.15,
            marginBottom: "16px",
          }}>
            Own Your Agent.
          </h2>
        </FadeContent>
        <FadeContent blur duration={1000} delay={300}>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "14px",
            color: "#9A8060",
            letterSpacing: "0.1em",
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Every agent you hire is minted as an ERC-7857 iNFT on 0G Chain.<br/>
            Transferable. Sellable. Yours forever.
          </p>
        </FadeContent>
      </div>
    </div>
    </KYCGate>
  )
}
