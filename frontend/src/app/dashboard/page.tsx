"use client"

import { useState, useEffect } from "react"
import { Space_Mono, DM_Sans } from "next/font/google"
import { useAccount } from "wagmi"
import GlareHover from "@/components/GlareHover"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}****${address.slice(-4)}`
}

const AGENTS = [
  { name: "Portfolio Analyzer", status: "active" as const, nftId: "#0042", chain: "0G Chain", lastRun: "2 min ago", earnings: "0.012 ADI" },
  { name: "Yield Optimizer", status: "active" as const, nftId: "#0087", chain: "0G Chain", lastRun: "5 min ago", earnings: "0.008 ADI" },
  { name: "Risk Scorer", status: "idle" as const, nftId: "#0103", chain: "0G Chain", lastRun: "1 hr ago", earnings: "0.011 ADI" },
]

const FEED_LINES = [
  { time: "14:32", agent: "Portfolio Analyzer", msg: "Scanning wallet 0x3f...a2 \u2713", ok: true },
  { time: "14:31", agent: "Risk Scorer", msg: "ETH exposure: HIGH \u2014 score 7.2/10", ok: false },
  { time: "14:30", agent: "Yield Optimizer", msg: "Found: Aave v3 USDC pool \u2014 APY 12.4%", ok: true },
  { time: "14:28", agent: "Portfolio Analyzer", msg: "Rebalance recommendation generated", ok: true },
  { time: "14:25", agent: "ADI Chain", msg: "Payment 0.01 ADI settled \u2713", ok: true },
  { time: "14:22", agent: "0G Chain", msg: "iNFT #0042 state updated \u2713", ok: true },
  { time: "14:20", agent: "Hedera", msg: "Agent registered via HCS-10 \u2713", ok: true },
]

const STATS = [
  { label: "Total ADI Earned", value: "0.031 ADI" },
  { label: "Queries Executed", value: "47" },
  { label: "Avg Response Time", value: "3.2s" },
  { label: "iNFTs Owned", value: "3" },
]

const ALLOCATIONS = [
  { asset: "ETH", pct: 40 },
  { asset: "BTC", pct: 30 },
  { asset: "USDC", pct: 20 },
  { asset: "Other", pct: 10 },
]

const QUICK_ACTIONS = [
  { title: "Hire New Agent", desc: "Browse the marketplace", cta: "Explore \u2192", href: "/marketplace" },
  { title: "Transfer iNFT", desc: "Send agent to new owner", cta: "Transfer \u2192", href: "#" },
  { title: "View on 0G Chain", desc: "Inspect on-chain state", cta: "Explorer \u2192", href: "#" },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [visibleFeed, setVisibleFeed] = useState(0)

  useEffect(() => {
    if (visibleFeed >= FEED_LINES.length) return
    const timeout = setTimeout(() => {
      setVisibleFeed(prev => prev + 1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [visibleFeed])

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
              Agents Dashboard
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

      {/* ── Section 1: Agent Roster ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36 }}>
        {AGENTS.map((agent) => (
          <div key={agent.name} style={cardStyle}>
            {/* Name + Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}>
                {agent.name}
              </span>
              <span
                className={spaceMono.className}
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: agent.status === "active" ? "#7A9E6E" : "#5C4A32",
                }}
              >
                ● {agent.status === "active" ? "ACTIVE" : "IDLE"}
              </span>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9A8060", fontSize: 11 }}>iNFT</span>
                <span className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 11 }}>{agent.nftId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9A8060", fontSize: 11 }}>Chain</span>
                <span style={{ color: "#9A8060", fontSize: 11 }}>{agent.chain}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9A8060", fontSize: 11 }}>Last run</span>
                <span style={{ color: "#5C4A32", fontSize: 11 }}>{agent.lastRun}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9A8060", fontSize: 11 }}>Earned</span>
                <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 11 }}>{agent.earnings}</span>
              </div>
            </div>

            {/* Run Agent button */}
            <GlareHover
              width="100%"
              height="34px"
              background="#1A1208"
              borderRadius="8px"
              borderColor="#5C4422"
              glareColor="#C9A84C"
              glareOpacity={0.2}
              glareAngle={-45}
              glareSize={250}
              transitionDuration={500}
            >
              <span
                className={spaceMono.className}
                style={{ color: "#C9A84C", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}
              >
                Run Agent
              </span>
            </GlareHover>
          </div>
        ))}
      </div>

      {/* ── Section 2: Live Feed + Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 36 }}>

        {/* LEFT — Live Activity Feed */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 18 }}>
            Live Activity
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FEED_LINES.slice(0, visibleFeed).map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}>
                <span style={{ color: "#5C4A32", flexShrink: 0, minWidth: 40 }}>{line.time}</span>
                <span style={{ color: "#C9A84C", flexShrink: 0 }}>[{line.agent}]</span>
                <span style={{ color: line.ok ? "#F5ECD7" : "#C47A5A" }}>{line.msg}</span>
              </div>
            ))}
            {visibleFeed < FEED_LINES.length && (
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                <span style={{ animation: "blink 1s infinite", color: "#C9A84C" }}>▋</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Performance Stats + Allocation */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 18 }}>
            Performance
          </div>

          {/* Stat rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24 }}>
            {STATS.map((stat) => (
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

          {/* Allocation bars */}
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>
            ALLOCATION
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ALLOCATIONS.map((item) => (
              <div key={item.asset}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 12 }}>{item.asset}</span>
                  <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 12 }}>{item.pct}%</span>
                </div>
                <div style={{ background: "#1A1208", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${item.pct}%`, height: "100%", background: "#C9A84C", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: Quick Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {QUICK_ACTIONS.map((action) => (
          <GlareHover
            key={action.title}
            width="100%"
            height="auto"
            background="#241A0E"
            borderRadius="12px"
            borderColor="#3D2E1A"
            glareColor="#C9A84C"
            glareOpacity={0.2}
            glareAngle={-45}
            glareSize={250}
            transitionDuration={600}
          >
            <a href={action.href} style={{ padding: 24, width: "100%", display: "block", textDecoration: "none" }}>
              <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                {action.title}
              </div>
              <div style={{ color: "#9A8060", fontSize: 13, marginBottom: 16 }}>
                {action.desc}
              </div>
              <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 12, letterSpacing: "0.05em", fontWeight: 700 }}>
                {action.cta}
              </div>
            </a>
          </GlareHover>
        ))}
      </div>
    </div>
  )
}
