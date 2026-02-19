"use client"
import { useState, useEffect } from "react"
import TiltedCard from "@/components/TiltedCard"
import GlareHover from "@/components/GlareHover"
import AnimatedContent from "@/components/AnimatedContent"

const AGENTS = [
  { id: "#0042", name: "Portfolio Analyzer", model: "gpt-4o-mini", capabilities: "DeFi Analysis", minted: "Feb 18, 2026", queries: "47", earned: "0.012 ADI", chain: "0G Chain", status: "ACTIVE" },
  { id: "#0043", name: "Yield Optimizer", model: "gpt-4o-mini", capabilities: "Yield Farming", minted: "Feb 18, 2026", queries: "31", earned: "0.009 ADI", chain: "0G Chain", status: "ACTIVE" },
  { id: "#0044", name: "Risk Scorer", model: "gpt-4o-mini", capabilities: "Risk Assessment", minted: "Feb 18, 2026", queries: "89", earned: "0.010 ADI", chain: "0G Chain", status: "IDLE" },
]

function generateAgentImage(_agent: typeof AGENTS[0]): string {
  const canvas = document.createElement("canvas")
  canvas.width = 400
  canvas.height = 500
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#1A1208"
  ctx.fillRect(0, 0, 400, 500)
  ctx.fillStyle = "#C9A84C"
  ctx.fillRect(0, 0, 400, 3)
  // dot pattern
  ctx.fillStyle = "#241A0E"
  for (let y = 20; y < 500; y += 28) {
    for (let x = 20; x < 400; x += 28) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return canvas.toDataURL("image/png")
}

export default function MyAgentsPage() {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    setImages(AGENTS.map(generateAgentImage))
  }, [])

  const overlayContent = (a: typeof AGENTS[0]) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ background: "#1A1208", border: "1px solid #5C4422", borderRadius: 6, padding: "3px 10px", fontFamily: "monospace", fontSize: 12, color: "#C9A84C" }}>{a.id}</span>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: a.status === "ACTIVE" ? "#7A9E6E" : "#5C4A32" }}>{"\u25CF"} {a.status}</span>
      </div>
      <h3 style={{ fontFamily: "monospace", color: "#F5ECD7", fontSize: 18, margin: "0 0 4px" }}>{a.name}</h3>
      <p style={{ color: "#9A8060", fontSize: 11, margin: "0 0 12px", fontFamily: "monospace" }}>ERC-7857 {"\u00B7"} {a.chain}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
        {[
          { label: "QUERIES", value: a.queries },
          { label: "EARNED", value: a.earned },
          { label: "MODEL", value: a.model },
          { label: "MINTED", value: a.minted },
        ].map(f => (
          <div key={f.label}>
            <p style={{ color: "#5C4A32", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.12em", margin: "0 0 2px" }}>{f.label}</p>
            <p style={{ color: "#F5ECD7", fontFamily: "monospace", fontSize: 12, margin: 0, fontWeight: "bold" }}>{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: "100vh", padding: "32px 48px", position: "relative", zIndex: 1 }}>

      {/* Title */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#F5ECD7", margin: 0, letterSpacing: "0.02em" }}>My Agents</h1>
        <p style={{ color: "#9A8060", fontSize: 14, marginTop: 8 }}>Your iNFT collection on 0G Chain</p>
      </div>

      {/* 3 TiltedCards side by side */}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 48 }}>
          {AGENTS.map((agent, i) => (
            <AnimatedContent key={i} direction="vertical" distance={40} duration={0.6} delay={i * 0.15} animateOpacity>
              <TiltedCard
                imageSrc={images[i]}
                altText={agent.name}
                captionText={agent.id}
                containerHeight="480px"
                containerWidth="100%"
                imageHeight="480px"
                imageWidth="100%"
                scaleOnHover={1.04}
                rotateAmplitude={10}
                showMobileWarning={false}
                showTooltip={true}
                displayOverlayContent={true}
                overlayContent={overlayContent(agent)}
              />
            </AnimatedContent>
          ))}
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

      {/* CTA */}
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
