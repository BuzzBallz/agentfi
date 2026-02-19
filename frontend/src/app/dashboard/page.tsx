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

const ACTIVITY_LINES = [
  { agent: "Portfolio Analyzer", action: "Scanned 12 DeFi positions across 3 chains", time: "2 min ago", status: "done" as const },
  { agent: "Yield Optimizer", action: "Found 12.4% APY on Aave v3 — executing swap", time: "5 min ago", status: "running" as const },
  { agent: "Risk Monitor", action: "Alert: ETH concentration at 40% — above threshold", time: "12 min ago", status: "done" as const },
  { agent: "Portfolio Analyzer", action: "Rebalance recommendation generated", time: "18 min ago", status: "done" as const },
  { agent: "Yield Optimizer", action: "Harvested 0.003 ETH from Lido staking rewards", time: "1 hr ago", status: "done" as const },
]

const ALLOCATIONS = [
  { asset: "ETH", pct: 40 },
  { asset: "BTC", pct: 30 },
  { asset: "USDC", pct: 20 },
  { asset: "Other", pct: 10 },
]

const RECOMMENDATIONS = [
  { title: "Rebalance Portfolio", detail: "Risk Score: 7.2/10", cta: "Run Agent \u2192" },
  { title: "Yield Opportunity", detail: "APY 12.4% (Aave v3)", cta: "Run Agent \u2192" },
  { title: "Risk Alert", detail: "High ETH exposure", cta: "View Details \u2192" },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()

  const [visibleActivities, setVisibleActivities] = useState(0)

  useEffect(() => {
    if (visibleActivities >= ACTIVITY_LINES.length) return
    const timeout = setTimeout(() => {
      setVisibleActivities(prev => prev + 1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [visibleActivities])

  const cardStyle = {
    background: "#241A0E",
    border: "1px solid #3D2E1A",
    borderRadius: 12,
    padding: 24,
  }

  return (
    <div className={dmSans.className} style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── Section 1: Header ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              className={spaceMono.className}
              style={{ fontSize: 32, fontWeight: 700, color: "#F5ECD7", letterSpacing: "0.02em", margin: 0 }}
            >
              DeFAI Dashboard
            </h1>
            <p style={{ color: "#9A8060", fontSize: 14, marginTop: 6 }}>
              Real-time AI agent intelligence
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

      {/* ── Section 2: Portfolio Overview — 3 stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
        {/* Card 1 — Total Value */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 10, letterSpacing: "0.15em", marginBottom: 8 }}>
            PORTFOLIO VALUE
          </div>
          <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 28, fontWeight: 700 }}>
            $24,831.40
          </div>
          <div style={{ color: "#7A9E6E", fontSize: 13, marginTop: 6 }}>
            +2.4% today
          </div>
        </div>

        {/* Card 2 — Active Agents */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 10, letterSpacing: "0.15em", marginBottom: 8 }}>
            ACTIVE AGENTS
          </div>
          <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 28, fontWeight: 700 }}>
            3
          </div>
          <div style={{ color: "#9A8060", fontSize: 13, marginTop: 6 }}>
            Portfolio &middot; Yield &middot; Risk
          </div>
        </div>

        {/* Card 3 — ADI Spent */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 10, letterSpacing: "0.15em", marginBottom: 8 }}>
            ADI SPENT TODAY
          </div>
          <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 28, fontWeight: 700 }}>
            0.031 ADI
          </div>
          <div style={{ color: "#9A8060", fontSize: 13, marginTop: 6 }}>
            &asymp; $0.09
          </div>
        </div>
      </div>

      {/* ── Section 3: Main content — 2 columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 40 }}>

        {/* LEFT — Agent Activity Feed */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
            Agent Activity
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ACTIVITY_LINES.slice(0, visibleActivities).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {/* Status dot */}
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.status === "done" ? "#7A9E6E" : "#FFBD2E",
                  marginTop: 6,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    {/* Agent name badge */}
                    <span
                      className={spaceMono.className}
                      style={{
                        background: "rgba(201, 168, 76, 0.15)",
                        color: "#C9A84C",
                        fontSize: 10,
                        letterSpacing: "0.05em",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      {item.agent}
                    </span>
                    <span style={{ color: "#5C4A32", fontSize: 11 }}>{item.time}</span>
                  </div>
                  <div style={{ color: "#F5ECD7", fontSize: 13, lineHeight: 1.5 }}>
                    {item.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Portfolio Allocation */}
        <div style={cardStyle}>
          <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
            Portfolio Allocation
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ALLOCATIONS.map((item) => (
              <div key={item.asset}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 13 }}>{item.asset}</span>
                  <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 13 }}>{item.pct}%</span>
                </div>
                <div style={{ background: "#1A1208", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${item.pct}%`, height: "100%", background: "#C9A84C", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Agent Recommendations ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {RECOMMENDATIONS.map((rec) => (
          <GlareHover
            key={rec.title}
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
            <div style={{ padding: 24, width: "100%" }}>
              <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {rec.title}
              </div>
              <div style={{ color: "#9A8060", fontSize: 13, marginBottom: 16 }}>
                {rec.detail}
              </div>
              <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 12, letterSpacing: "0.05em", fontWeight: 700 }}>
                {rec.cta}
              </div>
            </div>
          </GlareHover>
        ))}
      </div>
    </div>
  )
}
