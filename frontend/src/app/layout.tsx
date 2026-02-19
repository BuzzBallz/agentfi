import type { Metadata } from "next"
import "./globals.css"
import dynamic from "next/dynamic"
import { Providers } from "@/components/Providers"

const CardNav = dynamic(() => import("@/components/CardNav"), { ssr: false })
const DotGrid = dynamic(() => import("@/components/DotGrid"), { ssr: false })

export const metadata: Metadata = {
  title: "AgentFi",
  description: "The Banking System for Autonomous AI Agents",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#1A1208", minHeight: "100vh" }}>
        {/* Fixed dot grid background */}
        <DotGrid
          dotSize={4}
          gap={28}
          baseColor="#3D2E1A"
          activeColor="#C9A84C"
          proximity={120}
          shockRadius={200}
          shockStrength={4}
          returnDuration={1.5}
        />
        {/* All content above the grid */}
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
          <Providers>
            <CardNav />
            <div style={{ paddingTop: 60 }}>
              {children}
            </div>
          </Providers>
        </div>
      </body>
    </html>
  )
}
