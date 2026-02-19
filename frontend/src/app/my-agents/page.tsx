"use client"
import { useState } from "react"
import GlareHover from "@/components/GlareHover"
import PixelTransition from "@/components/PixelTransition"
import AnimatedContent from "@/components/AnimatedContent"

const AGENTS = [
  { id: "#0042", name: "Portfolio Analyzer", model: "gpt-4o-mini", capabilities: "DeFi Analysis", minted: "Feb 18, 2026", queries: "47", earned: "0.012 ADI", chain: "0G Chain", status: "ACTIVE" },
  { id: "#0043", name: "Yield Optimizer", model: "gpt-4o-mini", capabilities: "Yield Farming", minted: "Feb 18, 2026", queries: "31", earned: "0.009 ADI", chain: "0G Chain", status: "ACTIVE" },
  { id: "#0044", name: "Risk Scorer", model: "gpt-4o-mini", capabilities: "Risk Assessment", minted: "Feb 18, 2026", queries: "89", earned: "0.010 ADI", chain: "0G Chain", status: "IDLE" },
]

export default function MyAgentsPage() {
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [key, setKey] = useState(0)

  const prev = () => {
    setDirection('left')
    setActive(i => (i - 1 + AGENTS.length) % AGENTS.length)
    setKey(k => k + 1)
  }

  const next = () => {
    setDirection('right')
    setActive(i => (i + 1) % AGENTS.length)
    setKey(k => k + 1)
  }

  const agent = AGENTS[active]

  return (
    <main style={{ minHeight: "100vh", padding: "32px 48px", position: "relative", zIndex: 1 }}>

      {/* Title */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#F5ECD7", margin: 0, letterSpacing: "0.02em" }}>My Agents</h1>
        <p style={{ color: "#9A8060", fontSize: 14, marginTop: 8 }}>Your iNFT collection on 0G Chain</p>
      </div>

      {/* Wallet Summary */}
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

      {/* iNFT Carousel */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>

          {/* Prev arrow */}
          <button onClick={prev} style={{ background: "#241A0E", border: "1px solid #3D2E1A", borderRadius: "50%", width: 44, height: 44, color: "#C9A84C", fontSize: 20, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "#C9A84C")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
          >{"\u2039"}</button>

          {/* Active card — large center */}
          <AnimatedContent
            key={key}
            direction="horizontal"
            reverse={direction === 'left'}
            distance={120}
            duration={0.5}
            ease="power3.out"
            animateOpacity={true}
            initialOpacity={0}
            style={{ width: "100%", flex: 1 }}
          >
            <div style={{ background: "#241A0E", border: "1px solid #5C4422", borderRadius: 16, padding: 36, position: "relative", overflow: "hidden" }}>
              {/* Gold top bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C9A84C" }} />

              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ background: "#1A1208", border: "1px solid #5C4422", borderRadius: 6, padding: "4px 14px", fontFamily: "monospace", fontSize: 13, color: "#C9A84C" }}>
                  {agent.id}
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: agent.status === "ACTIVE" ? "#7A9E6E" : "#5C4A32" }}>
                  {"\u25CF"} {agent.status}
                </span>
              </div>

              {/* Name */}
              <h2 style={{ fontFamily: "monospace", color: "#F5ECD7", fontSize: 26, margin: "0 0 6px", letterSpacing: "0.02em" }}>{agent.name}</h2>
              <p style={{ color: "#9A8060", fontSize: 13, margin: "0 0 24px", fontFamily: "monospace" }}>ERC-7857 {"\u00B7"} {agent.chain}</p>

              {/* Divider */}
              <div style={{ height: 1, background: "#3D2E1A", marginBottom: 24 }} />

              {/* Metadata 2-col grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", marginBottom: 28 }}>
                {[
                  { label: "MODEL", value: agent.model },
                  { label: "CAPABILITIES", value: agent.capabilities },
                  { label: "MINTED", value: agent.minted },
                  { label: "CHAIN", value: agent.chain },
                  { label: "QUERIES RUN", value: agent.queries },
                  { label: "ADI EARNED", value: agent.earned },
                ].map(f => (
                  <div key={f.label}>
                    <p style={{ color: "#5C4A32", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", margin: "0 0 4px" }}>{f.label}</p>
                    <p style={{ color: "#F5ECD7", fontFamily: "monospace", fontSize: 15, margin: 0, fontWeight: "bold" }}>{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <PixelTransition
                  gridSize={6} pixelColor="#C9A84C" animationStepDuration={0.2} aspectRatio="0%"
                  style={{ width: 130, height: 38, borderRadius: 8, overflow: "hidden" }}
                  firstContent={<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#C9A84C", color: "#1A1208", fontFamily: "monospace", fontSize: 12, fontWeight: "bold", letterSpacing: "0.08em" }}>Execute</div>}
                  secondContent={<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#E8C97A", color: "#1A1208", fontFamily: "monospace", fontSize: 12, fontWeight: "bold", letterSpacing: "0.08em" }}>Execute</div>}
                />
                <GlareHover width="130px" height="38px" background="#1A1208" borderRadius="8px" borderColor="#5C4422" glareColor="#C9A84C" glareOpacity={0.2} transitionDuration={500}>
                  <span style={{ color: "#C9A84C", fontFamily: "monospace", fontSize: 12, fontWeight: "bold", letterSpacing: "0.08em" }}>Transfer {"\u2192"}</span>
                </GlareHover>
              </div>
            </div>
          </AnimatedContent>

          {/* Next arrow */}
          <button onClick={next} style={{ background: "#241A0E", border: "1px solid #3D2E1A", borderRadius: "50%", width: 44, height: 44, color: "#C9A84C", fontSize: 20, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "#C9A84C")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
          >{"\u203A"}</button>
        </div>

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {AGENTS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", background: i === active ? "#C9A84C" : "#3D2E1A", transform: i === active ? "scale(1.3)" : "scale(1)", transition: "all 0.2s" }} />
          ))}
        </div>
      </div>

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

      {/* CTA Banner */}
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
