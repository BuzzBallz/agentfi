"use client"

import { Space_Mono, DM_Sans } from "next/font/google"
import PixelTransition from "@/components/PixelTransition"
import GlareHover from "@/components/GlareHover"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

const INFTS = [
  { id: "#0042", name: "Portfolio Analyzer", model: "gpt-4o-mini", capability: "DeFi Analysis", minted: "Feb 18, 2026", owner: "0x3f...a2", queries: "47", earned: "0.012 ADI" },
  { id: "#0043", name: "Yield Optimizer", model: "gpt-4o-mini", capability: "Yield Farming", minted: "Feb 18, 2026", owner: "0x3f...a2", queries: "31", earned: "0.009 ADI" },
  { id: "#0044", name: "Risk Scorer", model: "gpt-4o-mini", capability: "Risk Assessment", minted: "Feb 18, 2026", owner: "0x3f...a2", queries: "89", earned: "0.010 ADI" },
]

const TIMELINE = [
  { time: "14:32", title: "iNFT #0044 executed", detail: "Risk score computed: 7.2/10" },
  { time: "14:28", title: "Payment settled", detail: "0.005 ADI received from 0x8b...c3" },
  { time: "14:15", title: "iNFT #0043 executed", detail: "APY 12.4% found on Aave v3" },
  { time: "13:50", title: "iNFT #0042 executed", detail: "Rebalance recommendation generated" },
  { time: "13:20", title: "iNFT #0044 registered", detail: "Agent registered on Hedera via HCS-10" },
  { time: "12:00", title: "Collection minted", detail: "3 iNFTs minted on 0G Chain \u2713" },
]

const META_FIELDS = [
  { label: "Model", key: "model" as const },
  { label: "Capabilities", key: "capability" as const },
  { label: "Minted", key: "minted" as const },
  { label: "Owner", key: "owner" as const },
  { label: "Queries Run", key: "queries" as const },
  { label: "ADI Earned", key: "earned" as const },
]

export default function MyAgentsPage() {
  const cardStyle = {
    background: "#241A0E",
    border: "1px solid #3D2E1A",
    borderRadius: 12,
    padding: 24,
  }

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
    <div className={dmSans.className} style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1
          className={spaceMono.className}
          style={{ fontSize: 32, fontWeight: 700, color: "#F5ECD7", letterSpacing: "0.02em", margin: 0 }}
        >
          My Agents
        </h1>
        <p style={{ color: "#9A8060", fontSize: 14, marginTop: 6 }}>
          Your iNFT collection on 0G Chain
        </p>
      </div>

      {/* ── Section 1: Wallet Summary ── */}
      <div style={{
        background: "#241A0E",
        border: "1px solid #3D2E1A",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 32,
      }}>
        <span className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 14, flex: 1, textAlign: "center" }}>
          3 iNFTs Owned
        </span>
        <div style={{ width: 1, height: 24, background: "#3D2E1A" }} />
        <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, flex: 1, textAlign: "center" }}>
          0.031 ADI Earned Total
        </span>
        <div style={{ width: 1, height: 24, background: "#3D2E1A" }} />
        <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 14, flex: 1, textAlign: "center" }}>
          0G Chain &middot; Testnet
        </span>
      </div>

      {/* ── Section 2: iNFT Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
        {INFTS.map(nft => (
          <div key={nft.id} style={cardStyle}>
            {/* iNFT ID badge */}
            <span
              className={spaceMono.className}
              style={{
                background: "#1A1208",
                border: "1px solid #5C4422",
                color: "#C9A84C",
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              {nft.id}
            </span>

            {/* Agent name */}
            <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 18, fontWeight: 700, marginTop: 12 }}>
              {nft.name}
            </div>

            {/* Intelligence Layer tag */}
            <div style={{ color: "#9A8060", fontSize: 11, marginTop: 4, marginBottom: 16 }}>
              ERC-7857 &middot; 0G Chain
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#3D2E1A", marginBottom: 16 }} />

            {/* Metadata grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 20 }}>
              {META_FIELDS.map(field => (
                <div key={field.label}>
                  <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 10, letterSpacing: "0.08em", marginBottom: 2 }}>
                    {field.label}
                  </div>
                  <div style={{ color: "#F5ECD7", fontSize: 12 }}>
                    {nft[field.key]}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ position: "relative", width: "fit-content" }}>
                <PixelTransition
                  gridSize={6}
                  pixelColor="#C9A84C"
                  animationStepDuration={0.2}
                  aspectRatio="0%"
                  style={{ width: 110, height: 36, borderRadius: 8, overflow: "hidden" }}
                  firstContent={
                    <div style={{ ...btnStyle, background: "#C9A84C", color: "#1A1208" }}>Execute</div>
                  }
                  secondContent={
                    <div style={{ ...btnStyle, background: "#E8C97A", color: "#1A1208" }}>Execute</div>
                  }
                />
              </div>
              <GlareHover
                width="110px"
                height="36px"
                background="#1A1208"
                borderRadius="8px"
                borderColor="#5C4422"
                glareColor="#C9A84C"
                glareOpacity={0.2}
                glareAngle={-45}
                glareSize={250}
                transitionDuration={500}
              >
                <span className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
                  Transfer
                </span>
              </GlareHover>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 3: Activity Timeline ── */}
      <div style={cardStyle}>
        <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
          iNFT Activity
        </div>
        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: 5,
            top: 6,
            bottom: 6,
            width: 1,
            background: "#3D2E1A",
          }} />

          {TIMELINE.map((evt, i) => (
            <div key={i} style={{ position: "relative", marginBottom: i < TIMELINE.length - 1 ? 20 : 0 }}>
              {/* Gold dot */}
              <div style={{
                position: "absolute",
                left: -22,
                top: 6,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#C9A84C",
                border: "2px solid #241A0E",
              }} />
              <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 11, marginBottom: 2 }}>
                {evt.time}
              </div>
              <div style={{ color: "#F5ECD7", fontSize: 13, marginBottom: 2 }}>
                {evt.title}
              </div>
              <div style={{ color: "#9A8060", fontSize: 12 }}>
                {evt.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Hire More CTA ── */}
      <div style={{
        background: "#2E2010",
        border: "1px solid #5C4422",
        borderRadius: 12,
        padding: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 32,
        gap: 24,
        flexWrap: "wrap" as const,
      }}>
        <div>
          <div className={spaceMono.className} style={{ color: "#F5ECD7", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Expand your fleet
          </div>
          <div style={{ color: "#9A8060", fontSize: 14 }}>
            Add specialized agents to your iNFT collection
          </div>
        </div>
        <GlareHover
          width="200px"
          height="42px"
          background="#241A0E"
          borderRadius="8px"
          borderColor="#5C4422"
          glareColor="#C9A84C"
          glareOpacity={0.25}
          glareAngle={-45}
          glareSize={250}
          transitionDuration={600}
        >
          <a
            href="/marketplace"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              color: "#C9A84C",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: "bold",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            Browse Marketplace {"\u2192"}
          </a>
        </GlareHover>
      </div>
    </div>
  )
}
