"use client"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import GlareHover from "@/components/GlareHover"

const CircularGallery = dynamic(() => import("@/components/CircularGallery"), { ssr: false })

const AGENTS = [
  {
    id: "#0042",
    name: "Portfolio Analyzer",
    model: "gpt-4o-mini",
    capabilities: "DeFi Analysis",
    minted: "Feb 18, 2026",
    queries: "47",
    earned: "0.012 ADI",
    chain: "0G Chain",
    status: "ACTIVE",
  },
  {
    id: "#0043",
    name: "Yield Optimizer",
    model: "gpt-4o-mini",
    capabilities: "Yield Farming",
    minted: "Feb 18, 2026",
    queries: "31",
    earned: "0.009 ADI",
    chain: "0G Chain",
    status: "ACTIVE",
  },
  {
    id: "#0044",
    name: "Risk Scorer",
    model: "gpt-4o-mini",
    capabilities: "Risk Assessment",
    minted: "Feb 18, 2026",
    queries: "89",
    earned: "0.010 ADI",
    chain: "0G Chain",
    status: "IDLE",
  },
]

function generateAgentCard(agent: typeof AGENTS[0]): string {
  const canvas = document.createElement("canvas")
  canvas.width = 800
  canvas.height = 600
  const ctx = canvas.getContext("2d")!

  // Background
  ctx.fillStyle = "#241A0E"
  ctx.fillRect(0, 0, 800, 600)

  // Border
  ctx.strokeStyle = "#3D2E1A"
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, 798, 598)

  // Gold top accent line
  ctx.fillStyle = "#C9A84C"
  ctx.fillRect(0, 0, 800, 4)

  // iNFT ID badge
  ctx.fillStyle = "#1A1208"
  ;(ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(40, 40, 120, 36, 6)
  ctx.fill()
  ctx.strokeStyle = "#5C4422"
  ctx.lineWidth = 1
  ;(ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(40, 40, 120, 36, 6)
  ctx.stroke()
  ctx.fillStyle = "#C9A84C"
  ctx.font = "bold 16px monospace"
  ctx.textAlign = "left"
  ctx.fillText(agent.id, 56, 64)

  // Status badge
  const statusColor = agent.status === "ACTIVE" ? "#7A9E6E" : "#5C4A32"
  ctx.fillStyle = statusColor
  ctx.font = "bold 13px monospace"
  ctx.fillText("\u25CF " + agent.status, 600, 64)

  // Agent name
  ctx.fillStyle = "#F5ECD7"
  ctx.font = "bold 36px monospace"
  ctx.textAlign = "left"
  ctx.fillText(agent.name, 40, 150)

  // Subtitle
  ctx.fillStyle = "#9A8060"
  ctx.font = "14px monospace"
  ctx.fillText("ERC-7857 \u00B7 " + agent.chain, 40, 180)

  // Divider
  ctx.fillStyle = "#3D2E1A"
  ctx.fillRect(40, 210, 720, 1)

  // Metadata grid
  const fields = [
    { label: "MODEL", value: agent.model },
    { label: "CAPABILITIES", value: agent.capabilities },
    { label: "MINTED", value: agent.minted },
    { label: "CHAIN", value: agent.chain },
    { label: "QUERIES RUN", value: agent.queries },
    { label: "ADI EARNED", value: agent.earned },
  ]

  fields.forEach((field, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 40 + col * 380
    const y = 250 + row * 80

    ctx.fillStyle = "#5C4A32"
    ctx.font = "11px monospace"
    ctx.fillText(field.label, x, y)

    ctx.fillStyle = "#F5ECD7"
    ctx.font = "bold 15px monospace"
    ctx.fillText(field.value, x, y + 24)
  })

  // Bottom gold line
  ctx.fillStyle = "#C9A84C"
  ctx.fillRect(40, 540, 200, 2)

  ctx.fillStyle = "#9A8060"
  ctx.font = "12px monospace"
  ctx.fillText("AgentFi \u00B7 Powered by 0G Chain + Hedera", 40, 570)

  return canvas.toDataURL("image/png")
}

export default function MyAgentsPage() {
  const [galleryItems, setGalleryItems] = useState<{ image: string; text: string }[]>([])

  useEffect(() => {
    const items = AGENTS.map(agent => ({
      image: generateAgentCard(agent),
      text: agent.name,
    }))
    setGalleryItems(items)
  }, [])

  return (
    <main style={{ minHeight: "100vh", padding: "32px 48px", position: "relative", zIndex: 1 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#F5ECD7", margin: 0, letterSpacing: "0.02em" }}>My Agents</h1>
        <p style={{ color: "#9A8060", fontSize: 14, marginTop: 8 }}>Your iNFT collection on 0G Chain</p>
      </div>

      <div style={{ background: "#241A0E", border: "1px solid #3D2E1A", borderRadius: 12, padding: 20, marginBottom: 40, display: "flex", gap: 32, alignItems: "center" }}>
        {[
          { label: "3 iNFTs Owned", color: "#F5ECD7" },
          { label: "0.031 ADI Earned Total", color: "#C9A84C" },
          { label: "0G Chain \u00B7 Testnet", color: "#9A8060" },
        ].map((stat, i) => (
          <span key={i} style={{ fontFamily: "monospace", fontSize: 13, color: stat.color, paddingRight: 32, borderRight: i < 2 ? "1px solid #3D2E1A" : "none" }}>
            {stat.label}
          </span>
        ))}
      </div>

      {galleryItems.length > 0 && (
        <div style={{ width: "100%", height: 500, marginBottom: 48, borderRadius: 16, overflow: "hidden", border: "1px solid #3D2E1A" }}>
          <CircularGallery
            items={galleryItems}
            bend={3}
            textColor="#C9A84C"
            borderRadius={0.05}
            font="bold 24px monospace"
            scrollSpeed={2}
            scrollEase={0.05}
          />
        </div>
      )}

      {/* Activity timeline */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "monospace", color: "#C9A84C", fontSize: 16, marginBottom: 24, letterSpacing: "0.1em" }}>iNFT Activity</h2>
        <div style={{ position: "relative", paddingLeft: 24 }}>
          <div style={{ position: "absolute", left: 5, top: 0, bottom: 0, width: 1, background: "#3D2E1A" }} />
          {[
            { time: "14:32", title: "iNFT #0044 executed", detail: "Risk score computed: 7.2/10" },
            { time: "14:28", title: "Payment settled", detail: "0.005 ADI received from 0x8b...c3" },
            { time: "14:15", title: "iNFT #0043 executed", detail: "APY 12.4% found on Aave v3" },
            { time: "13:50", title: "iNFT #0042 executed", detail: "Rebalance recommendation generated" },
            { time: "13:20", title: "iNFT #0044 registered", detail: "Agent registered on Hedera via HCS-10" },
            { time: "12:00", title: "Collection minted", detail: "3 iNFTs minted on 0G Chain \u2713" },
          ].map((event, i) => (
            <div key={i} style={{ position: "relative", marginBottom: 24, paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: "50%", background: "#C9A84C" }} />
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#5C4A32" }}>{event.time}</span>
              <p style={{ color: "#F5ECD7", fontSize: 13, margin: "4px 0 2px" }}>{event.title}</p>
              <p style={{ color: "#9A8060", fontSize: 12, margin: 0 }}>{event.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#2E2010", border: "1px solid #5C4422", borderRadius: 12, padding: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontFamily: "monospace", color: "#F5ECD7", fontSize: 18, margin: "0 0 8px" }}>Expand your fleet</h3>
          <p style={{ color: "#9A8060", fontSize: 14, margin: 0 }}>Add specialized agents to your iNFT collection</p>
        </div>
        <GlareHover width="200px" height="44px" background="#241A0E" borderRadius="8px" borderColor="#5C4422" glareColor="#C9A84C" glareOpacity={0.25} transitionDuration={600}>
          <a href="/marketplace" style={{ color: "#C9A84C", fontFamily: "monospace", fontSize: 13, fontWeight: "bold", textDecoration: "none", letterSpacing: "0.1em" }}>Browse Marketplace {"\u2192"}</a>
        </GlareHover>
      </div>
    </main>
  )
}
