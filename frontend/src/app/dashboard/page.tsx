"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Space_Mono, DM_Sans } from "next/font/google"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import PixelTransition from "@/components/PixelTransition"
import { useMyAgents } from "@/hooks/useMyAgents"
import { useAgentData, useTokenImage } from "@/hooks/useAgentData"
import { CONTRACT_ADDRESSES } from "@/config/contracts"
import { useAppMode } from "@/context/AppModeContext"
import { useEarnings, formatEarnings } from "@/hooks/useEarnings"
import { useLiveActivity } from "@/hooks/useLiveActivity"
import FadeContent from "@/components/FadeContent"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const FALLBACK_NAMES: Record<number, string> = {
  0: "Portfolio Analyzer",
  1: "Yield Optimizer",
  2: "Risk Scorer",
}

/* ── Agent Card with SVG ── */
function DashboardAgentCard({ tokenId, pricePerHire }: { tokenId: number; pricePerHire: bigint }) {
  const router = useRouter()
  const { agentData, tokenURI, isLoading } = useAgentData(tokenId)
  const { imageUrl, fallbackSvg } = useTokenImage(tokenURI, tokenId)
  const { currencySymbol } = useAppMode()
  const name = isLoading ? "Loading..." : (agentData?.name || FALLBACK_NAMES[tokenId] || `Agent #${tokenId}`)

  const btnStyle = {
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
      style={{
        background: "#241A0E",
        border: "1px solid #3D2E1A",
        borderRadius: 12,
        padding: 20,
        opacity: isLoading ? 0.7 : 1,
        transition: "border-color 0.2s",
      }}
      onMouseOver={e => (e.currentTarget.style.borderColor = "#5C4422")}
      onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
    >
      {/* SVG image */}
      {imageUrl && (
        <div style={{
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 12,
          background: "#1A1208",
          display: "flex",
          justifyContent: "center",
          maxHeight: 140,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${name} iNFT`}
            style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain" }}
            onError={(e) => { if (fallbackSvg) (e.target as HTMLImageElement).src = fallbackSvg; }}
          />
        </div>
      )}

      {/* Token badge */}
      <span
        className={spaceMono.className}
        style={{
          background: "#1A1208",
          border: "1px solid #5C4422",
          color: "#C9A84C",
          fontSize: 11,
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        #{tokenId}
      </span>

      {/* Name */}
      <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 16, fontWeight: 700, marginTop: 10 }}>
        {name}
      </div>

      {/* Standard */}
      <div style={{ color: "#9A8060", fontSize: 11, marginTop: 4, marginBottom: 14 }}>
        ERC-7857 &middot; 0G Chain
      </div>

      {/* Price */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>
          {formatEther(pricePerHire)} {currencySymbol}
        </span>
        <span style={{ color: "#5C4A32", fontSize: 10 }}>per hire</span>
      </div>

      {/* Execute button */}
      <div style={{ position: "relative", width: "fit-content" }}>
        <PixelTransition
          gridSize={6}
          pixelColor="#C9A84C"
          animationStepDuration={0.2}
          aspectRatio="0%"
          style={{ width: 120, height: 36, borderRadius: 8, overflow: "hidden" }}
          firstContent={
            <div style={{ ...btnStyle, background: "#C9A84C", color: "#1A1208" }}
              onClick={() => router.push(`/agent/${tokenId}`)}>Execute</div>
          }
          secondContent={
            <div style={{ ...btnStyle, background: "#E8C97A", color: "#1A1208" }}
              onClick={() => router.push(`/agent/${tokenId}`)}>Execute</div>
          }
        />
      </div>
    </div>
  )
}

/* ── Main Dashboard Page ── */
export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected, status: accountStatus } = useAccount()
  const { myAgents, isLoading, isError } = useMyAgents()
  const { totalEarned, totalHires, loading: earningsLoading } = useEarnings()
  const { lines: activityLines, loading: activityLoading } = useLiveActivity()
  // Only show "connect wallet" when truly disconnected, not during reconnection
  const isDisconnected = accountStatus === "disconnected"
  const [visibleFeed, setVisibleFeed] = useState(0)

  useEffect(() => {
    if (visibleFeed >= activityLines.length) return
    const timeout = setTimeout(() => {
      setVisibleFeed(prev => prev + 1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [visibleFeed, activityLines.length])

  const cardStyle = {
    background: "#241A0E",
    border: "1px solid #3D2E1A",
    borderRadius: 12,
    padding: 20,
  }

  return (
    <div className={dmSans.className} style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              className={spaceMono.className}
              style={{ fontSize: 32, fontWeight: 700, color: "#F5ECD7", letterSpacing: "0.02em", margin: 0 }}
            >
              Agent Dashboard
            </h1>
            <p style={{ color: "#9A8060", fontSize: 14, marginTop: 6 }}>
              Manage your autonomous AI agents
            </p>
          </div>
          {isConnected && address && (
            <div
              className={spaceMono.className}
              style={{
                background: "#241A0E",
                border: "1px solid #3D2E1A",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#C9A84C",
                fontSize: 13,
                letterSpacing: "0.05em",
              }}
            >
              {shortenAddress(address)}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: My Agents (real on-chain data) ── */}
      <div style={{ marginBottom: 36 }}>
        <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          MY AGENTS
        </div>

        {/* Not connected state — only when truly disconnected, not during reconnection */}
        {isDisconnected && (
          <div style={{
            ...cardStyle,
            textAlign: "center" as const,
            padding: 48,
          }}>
            <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Connect Your Wallet
            </div>
            <div style={{ color: "#9A8060", fontSize: 14 }}>
              Connect your wallet to view your agent iNFTs
            </div>
          </div>
        )}

        {/* Loading */}
        {!isDisconnected && isLoading && (
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 13, textAlign: "center" }}>
            Loading your agents from 0G Chain...
          </div>
        )}

        {/* Error */}
        {!isDisconnected && isError && (
          <div className={spaceMono.className} style={{ color: "#C47A5A", fontSize: 13, textAlign: "center" }}>
            Failed to load agents. Check RPC connection.
          </div>
        )}

        {/* Empty state */}
        {!isDisconnected && !isLoading && !isError && myAgents.length === 0 && (
          <div style={{
            ...cardStyle,
            textAlign: "center" as const,
            padding: 48,
          }}>
            <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              No Agents Owned Yet
            </div>
            <div style={{ color: "#9A8060", fontSize: 14, marginBottom: 20 }}>
              Hire an agent from the marketplace to get started
            </div>
            <a
              href="/marketplace"
              className={spaceMono.className}
              style={{
                background: "#C9A84C",
                color: "#1A1208",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              Browse Marketplace &rarr;
            </a>
          </div>
        )}

        {/* Agent grid */}
        {myAgents.length > 0 && (
          <>
            {/* Wallet summary bar */}
            <div style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              gap: 0,
              marginBottom: 20,
              padding: "14px 20px",
            }}>
              <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 14, flex: 1, textAlign: "center" }}>
                {myAgents.length} iNFTs Owned
              </span>
              <div style={{ width: 1, height: 24, background: "#3D2E1A" }} />
              <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, flex: 1, textAlign: "center" }}>
                {address ? shortenAddress(address) : ""}
              </span>
              <div style={{ width: 1, height: 24, background: "#3D2E1A" }} />
              <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 14, flex: 1, textAlign: "center" }}>
                0G Chain &middot; Testnet
              </span>
            </div>

            {/* NFT import tip */}
            <div style={{
              fontSize: 12,
              color: "#9A8060",
              background: "rgba(26,18,8,0.5)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              border: "1px solid #3D2E1A",
              lineHeight: 1.6,
            }}>
              <span style={{ color: "#C9A84C", fontWeight: 700 }}>Tip:</span>{" "}
              To see your iNFTs in MetaMask: NFTs tab &rarr; Import NFT &rarr;
              Contract: <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 11 }}>{CONTRACT_ADDRESSES.AgentNFT}</span> &rarr;
              Token ID: <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 11 }}>0</span> (or 1, 2)
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(myAgents.length, 3)}, 1fr)`,
              gap: 20,
            }}>
              {myAgents.map(agent => (
                <DashboardAgentCard
                  key={agent.tokenId}
                  tokenId={agent.tokenId}
                  pricePerHire={agent.pricePerHire}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Section 2: Earnings Summary (real on-chain data from AgentHired events) ── */}
      <div style={{ ...cardStyle, marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}>
            Earnings Summary
          </span>
          {earningsLoading && (
            <span style={{ color: "#5C4A32", fontSize: 10, marginLeft: 10 }}>loading...</span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
              TOTAL EARNED (97.5%)
            </div>
            <div className={spaceMono.className} style={{ color: totalEarned > BigInt(0) ? "#7A9E6E" : "#F5ECD7", fontSize: 20, fontWeight: 700 }}>
              {formatEarnings(totalEarned)} A0GI
            </div>
          </div>
          <div>
            <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
              TOTAL HIRES
            </div>
            <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 20, fontWeight: 700 }}>
              {totalHires}
            </div>
          </div>
          <div>
            <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
              iNFTs OWNED
            </div>
            <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 20, fontWeight: 700 }}>
              {myAgents.length}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Create & Mint New Agent CTA ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 0 32px",
        gap: 24,
        marginBottom: 36,
      }}>
        <FadeContent blur duration={900} delay={100}>
          <div>
            <h2 style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(20px, 2.5vw, 32px)",
              fontWeight: 700,
              color: "#F5ECD7",
              marginBottom: 8,
            }}>
              Create &amp; Mint New Agent
            </h2>
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: "#5C4422",
              letterSpacing: "0.1em",
              margin: 0,
            }}>
              Deploy your agent as an ERC-7857 iNFT on 0G Chain
            </p>
          </div>
        </FadeContent>
        <button
          onClick={() => router.push("/dashboard/create")}
          className={spaceMono.className}
          style={{
            background: "#C9A84C",
            color: "#1A1208",
            border: "none",
            borderRadius: 8,
            padding: "12px 28px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Create Agent &rarr;
        </button>
      </div>

      {/* ── Section 4: Live Activity & Performance ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>

        {/* LEFT — Live Activity Feed */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
            <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}>
              Live Activity
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activityLoading && (
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#5C4A32", textAlign: "center", padding: "20px 0" }}>
                Loading on-chain activity...
              </div>
            )}
            {!activityLoading && activityLines.length === 0 && (
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#5C4A32", textAlign: "center", padding: "20px 0" }}>
                No activity yet — hire an agent to see live logs
              </div>
            )}
            {activityLines.slice(0, visibleFeed).map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}>
                <span style={{ color: "#5C4A32", flexShrink: 0, minWidth: 50 }}>{line.time}</span>
                <span style={{ color: "#C9A84C", flexShrink: 0 }}>[{line.agent}]</span>
                <span style={{ color: line.ok ? "#F5ECD7" : "#C47A5A" }}>{line.msg}</span>
              </div>
            ))}
            {visibleFeed < activityLines.length && (
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                <span style={{ animation: "blink 1s infinite", color: "#C9A84C" }}>{"\u258B"}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Performance Stats (real on-chain) */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
            <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}>
              Performance
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Total Earned", value: `${formatEarnings(totalEarned)} A0GI` },
              { label: "Total Hires", value: String(totalHires) },
              { label: "iNFTs Owned", value: String(myAgents.length) },
              { label: "Payment Split", value: "97.5% / 2.5%" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px dotted #3D2E1A",
                }}
              >
                <span style={{ color: "#9A8060", fontSize: 13 }}>{stat.label}</span>
                <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
